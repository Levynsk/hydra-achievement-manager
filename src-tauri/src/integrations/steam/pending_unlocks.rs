use crate::models::UnlockOptions;
use crate::unlocker::AchievementUnlocker;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Condvar, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

/// Evento emitido sempre que a fila de unlocks agendados muda.
pub const PENDING_UNLOCKS_UPDATED_EVENT: &str = "steam-pending-unlocks-updated";

/// Nome do arquivo onde a fila é persistida (dentro do app_data_dir).
pub const PENDING_UNLOCKS_FILE: &str = "pending-steam-unlocks.json";

/// Tempo máximo entre verificações, para reagir a mudanças de relógio do sistema.
const IDLE_POLL_SECS: i64 = 30;

/// Intervalo de retry quando a Steam não está disponível na hora do unlock.
const RETRY_DELAY_SECS: i64 = 60;

/// Um unlock Steam que precisa esperar até `unlock_at` para ser aplicado.
///
/// A Steam não permite definir o horário de uma conquista: o servidor grava o
/// momento em que `SetAchievement` é chamado. Por isso, timestamps futuros são
/// guardados aqui e aplicados somente quando a data chega.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct PendingSteamUnlock {
    pub id: String,
    #[serde(rename = "appId")]
    pub app_id: u32,
    #[serde(rename = "achievementName")]
    pub achievement_name: String,
    /// Unix timestamp (segundos) em que o unlock deve ser aplicado.
    #[serde(rename = "unlockAt")]
    pub unlock_at: i64,
    #[serde(rename = "createdAt", default)]
    pub created_at: i64,
}

/// Ação Steam que pode ser executada imediatamente.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SteamUnlockAction {
    pub achievement_name: String,
    pub unlocked: bool,
}

/// Separa o pedido de unlock entre o que deve ser aplicado agora e o que
/// precisa esperar o timestamp chegar.
#[derive(Debug, Clone, Default)]
pub struct SteamUnlockPlan {
    pub immediate: Vec<SteamUnlockAction>,
    pub scheduled: Vec<PendingSteamUnlock>,
}

impl SteamUnlockPlan {
    pub fn build(options: &UnlockOptions, app_id: u32) -> Self {
        Self::build_at(options, app_id, unix_now())
    }

    pub fn build_at(options: &UnlockOptions, app_id: u32, now: i64) -> Self {
        let mut plan = Self::default();

        for achievement in &options.achievements {
            // Remover (lock) não tem timestamp: a Steam sempre aplica na hora.
            if !achievement.completed {
                plan.immediate.push(SteamUnlockAction {
                    achievement_name: achievement.name.clone(),
                    unlocked: false,
                });
                continue;
            }

            let unlock_time = AchievementUnlocker::resolve_unlock_time(achievement, options);

            if unlock_time > now {
                plan.scheduled.push(PendingSteamUnlock {
                    id: pending_unlock_id(app_id, &achievement.name, unlock_time),
                    app_id,
                    achievement_name: achievement.name.clone(),
                    unlock_at: unlock_time,
                    created_at: now,
                });
            } else {
                plan.immediate.push(SteamUnlockAction {
                    achievement_name: achievement.name.clone(),
                    unlocked: true,
                });
            }
        }

        // Uma conquista só pode aparecer uma vez em cada lista (o primeiro
        // pedido vence).
        let mut immediate_seen = HashSet::new();
        plan.immediate
            .retain(|action| immediate_seen.insert(action.achievement_name.clone()));
        let mut scheduled_seen = HashSet::new();
        plan.scheduled
            .retain(|item| scheduled_seen.insert(item.achievement_name.clone()));

        // Se a mesma conquista aparece como imediata e agendada, o imediato vence.
        let immediate_names: HashSet<&str> = plan
            .immediate
            .iter()
            .map(|action| action.achievement_name.as_str())
            .collect();
        plan.scheduled
            .retain(|item| !immediate_names.contains(item.achievement_name.as_str()));

        plan
    }
}

/// Gerenciador da fila de unlocks Steam futuros.
///
/// A fila é persistida em disco para sobreviver a reinícios do app e um worker
/// em background aplica os unlocks quando o horário chega.
pub struct SteamUnlockScheduler {
    shared: Arc<(Mutex<Vec<PendingSteamUnlock>>, Condvar)>,
    storage_path: PathBuf,
    started: AtomicBool,
}

impl SteamUnlockScheduler {
    pub fn new(storage_path: PathBuf) -> Self {
        let queue = load_queue(&storage_path);
        if !queue.is_empty() {
            log::info!(
                "[Steam scheduler] Loaded {} pending unlock(s) from {}",
                queue.len(),
                storage_path.display()
            );
        }

        Self {
            shared: Arc::new((Mutex::new(queue), Condvar::new())),
            storage_path,
            started: AtomicBool::new(false),
        }
    }

    /// Inicia o worker que aplica os unlocks no horário certo.
    pub fn start(&self, app_handle: AppHandle) -> Result<()> {
        if self.started.swap(true, Ordering::SeqCst) {
            return Ok(());
        }

        let shared = Arc::clone(&self.shared);
        let storage_path = self.storage_path.clone();

        thread::Builder::new()
            .name("steam-unlock-scheduler".to_string())
            .spawn(move || run_scheduler(shared, storage_path, app_handle))
            .context("Failed to spawn Steam unlock scheduler thread")?;

        Ok(())
    }

    /// Retorna a fila atual, ordenada pelo horário do unlock.
    pub fn pending(&self) -> Vec<PendingSteamUnlock> {
        let mut queue = self.lock_queue().clone();
        queue.sort_by_key(|item| item.unlock_at);
        queue
    }

    /// Adiciona itens à fila. Um agendamento novo para a mesma conquista
    /// substitui o anterior.
    pub fn schedule(&self, items: Vec<PendingSteamUnlock>) -> Result<Vec<PendingSteamUnlock>> {
        if items.is_empty() {
            return Ok(Vec::new());
        }

        {
            let mut queue = self.lock_queue();
            for item in &items {
                queue.retain(|existing| {
                    !(existing.app_id == item.app_id
                        && existing.achievement_name == item.achievement_name)
                });
            }
            queue.extend(items.iter().cloned());
            queue.sort_by_key(|item| item.unlock_at);
            persist_queue(&self.storage_path, &queue)?;
        }

        self.notify();
        Ok(items)
    }

    /// Cancela um unlock agendado pelo id. Retorna `true` se algo foi removido.
    pub fn cancel(&self, id: &str) -> Result<bool> {
        let removed = {
            let mut queue = self.lock_queue();
            let before = queue.len();
            queue.retain(|item| item.id != id);
            let removed = queue.len() != before;
            if removed {
                persist_queue(&self.storage_path, &queue)?;
            }
            removed
        };

        if removed {
            self.notify();
        }
        Ok(removed)
    }

    /// Remove agendamentos de conquistas que serão aplicadas imediatamente,
    /// evitando um segundo unlock inútil no futuro.
    pub fn cancel_for_achievements(&self, app_id: u32, names: &[&str]) -> Result<usize> {
        if names.is_empty() {
            return Ok(0);
        }

        let removed = {
            let mut queue = self.lock_queue();
            let before = queue.len();
            queue.retain(|item| {
                !(item.app_id == app_id
                    && names
                        .iter()
                        .any(|name| *name == item.achievement_name.as_str()))
            });
            let removed = before - queue.len();
            if removed > 0 {
                persist_queue(&self.storage_path, &queue)?;
            }
            removed
        };

        if removed > 0 {
            self.notify();
        }
        Ok(removed)
    }

    fn lock_queue(&self) -> std::sync::MutexGuard<'_, Vec<PendingSteamUnlock>> {
        match self.shared.0.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        }
    }

    fn notify(&self) {
        self.shared.1.notify_all();
    }
}

fn run_scheduler(
    shared: Arc<(Mutex<Vec<PendingSteamUnlock>>, Condvar)>,
    storage_path: PathBuf,
    app_handle: AppHandle,
) {
    let (lock, cvar) = &*shared;
    let mut retry_at: i64 = 0;

    loop {
        let now = unix_now();

        // Coleta o que já venceu. Se estamos aguardando um retry, a lista fica
        // vazia e o worker apenas dorme até `retry_at`.
        let due = {
            let queue = match lock.lock() {
                Ok(guard) => guard,
                Err(poisoned) => poisoned.into_inner(),
            };

            if now >= retry_at {
                queue
                    .iter()
                    .filter(|item| item.unlock_at <= now)
                    .cloned()
                    .collect::<Vec<_>>()
            } else {
                Vec::new()
            }
        };

        if !due.is_empty() {
            let outcome = apply_due_unlocks(&app_handle, &due);

            if !outcome.applied_ids.is_empty() {
                {
                    let mut queue = match lock.lock() {
                        Ok(guard) => guard,
                        Err(poisoned) => poisoned.into_inner(),
                    };
                    queue.retain(|item| !outcome.applied_ids.contains(&item.id));
                    if let Err(error) = persist_queue(&storage_path, &queue) {
                        log::warn!(
                            "[Steam scheduler] Failed to persist pending unlocks after applying: {}",
                            error
                        );
                    }
                }
                let _ = app_handle.emit(PENDING_UNLOCKS_UPDATED_EVENT, ());
            }

            if outcome.errors.is_empty() {
                retry_at = 0;
            } else {
                for error in &outcome.errors {
                    log::warn!("[Steam scheduler] {}", error);
                }
                // Mantém os itens na fila e tenta novamente mais tarde (Steam
                // pode estar fechada ou o jogo pode ter sido desinstalado).
                retry_at = unix_now() + RETRY_DELAY_SECS;
            }

            continue;
        }

        // Recalcula o próximo horário segurando o mesmo mutex que o
        // `wait_timeout` usa. Isso evita perder um `notify` de um agendamento
        // feito entre a coleta acima e a espera.
        let queue = match lock.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };

        let now = unix_now();
        let has_due = queue.iter().any(|item| item.unlock_at <= now);
        if has_due && retry_at <= now {
            // Um item venceu entre as duas checagens; volta ao topo para aplicá-lo.
            drop(queue);
            continue;
        }

        let next_future = queue
            .iter()
            .filter(|item| item.unlock_at > now)
            .map(|item| item.unlock_at)
            .min()
            .unwrap_or(i64::MAX);

        let mut wake_at = next_future;
        if has_due {
            wake_at = wake_at.min(retry_at.max(now + 1));
        }

        let wait_secs = wake_at.saturating_sub(now).clamp(1, IDLE_POLL_SECS);
        let _ = cvar.wait_timeout(queue, Duration::from_secs(wait_secs as u64));
    }
}

#[derive(Debug, Default)]
struct ApplyOutcome {
    applied_ids: Vec<String>,
    errors: Vec<String>,
}

fn apply_due_unlocks(app_handle: &AppHandle, due: &[PendingSteamUnlock]) -> ApplyOutcome {
    let mut outcome = ApplyOutcome::default();

    let state = app_handle.state::<crate::AppState>();
    let steam_lock = match state.steam_monitor.lock() {
        Ok(guard) => guard,
        Err(error) => {
            outcome
                .errors
                .push(format!("Steam monitor lock poisoned: {}", error));
            return outcome;
        }
    };

    let Some(steam_monitor) = steam_lock.as_ref() else {
        outcome
            .errors
            .push("Steam monitor not initialized".to_string());
        return outcome;
    };

    if let Err(error) = steam_monitor.initialize() {
        outcome
            .errors
            .push(format!("Failed to initialize Steam: {}", error));
        return outcome;
    }
    if !steam_monitor.is_enabled() {
        outcome
            .errors
            .push("Steam integration not available or Steam not running".to_string());
        return outcome;
    }

    // Agrupa por AppID para minimizar trocas de sessão.
    let mut ordered: Vec<&PendingSteamUnlock> = due.iter().collect();
    ordered.sort_by_key(|item| item.app_id);

    let mut current_app_id: Option<u32> = None;
    for item in ordered {
        if current_app_id != Some(item.app_id) {
            if let Err(error) = steam_monitor.switch_app_id(item.app_id) {
                outcome.errors.push(format!(
                    "Failed to switch Steam AppID to {}: {}",
                    item.app_id, error
                ));
                continue;
            }
            if !steam_monitor.is_enabled() {
                outcome.errors.push(format!(
                    "Steam integration unavailable for AppID {}",
                    item.app_id
                ));
                continue;
            }
            current_app_id = Some(item.app_id);
        }

        match steam_monitor.set_achievement(&item.achievement_name, true) {
            Ok(()) => {
                log::info!(
                    "[Steam scheduler] Unlocked '{}' for AppID {} (scheduled for {})",
                    item.achievement_name,
                    item.app_id,
                    item.unlock_at
                );
                outcome.applied_ids.push(item.id.clone());
            }
            Err(error) => outcome.errors.push(format!(
                "Failed to unlock '{}' for AppID {}: {}",
                item.achievement_name, item.app_id, error
            )),
        }
    }

    if let Err(error) = steam_monitor.shutdown() {
        log::warn!(
            "[Steam scheduler] Failed to close Steam session after scheduled unlock: {}",
            error
        );
    }

    outcome
}

fn load_queue(path: &Path) -> Vec<PendingSteamUnlock> {
    let content = match fs::read_to_string(path) {
        Ok(content) => content,
        Err(error) => {
            if error.kind() != std::io::ErrorKind::NotFound {
                log::warn!(
                    "[Steam scheduler] Failed to read pending unlocks at {}: {}",
                    path.display(),
                    error
                );
            }
            return Vec::new();
        }
    };

    match serde_json::from_str::<Vec<PendingSteamUnlock>>(&content) {
        Ok(mut queue) => {
            queue.sort_by_key(|item| item.unlock_at);
            queue
        }
        Err(error) => {
            log::warn!(
                "[Steam scheduler] Failed to parse pending unlocks at {}: {}",
                path.display(),
                error
            );
            Vec::new()
        }
    }
}

fn persist_queue(path: &Path, queue: &[PendingSteamUnlock]) -> Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .with_context(|| format!("Failed to create directory: {}", parent.display()))?;
    }

    let content =
        serde_json::to_string_pretty(queue).context("Failed to serialize pending Steam unlocks")?;

    let tmp_path = path.with_extension("json.tmp");
    fs::write(&tmp_path, content)
        .with_context(|| format!("Failed to write pending unlocks: {}", tmp_path.display()))?;

    if fs::rename(&tmp_path, path).is_err() {
        // No Windows o rename não substitui um arquivo existente.
        let _ = fs::remove_file(path);
        fs::rename(&tmp_path, path)
            .with_context(|| format!("Failed to replace pending unlocks: {}", path.display()))?;
    }

    Ok(())
}

fn pending_unlock_id(app_id: u32, achievement_name: &str, unlock_at: i64) -> String {
    format!("{}:{}:{}", app_id, achievement_name, unlock_at)
}

/// Unix timestamp atual em segundos.
pub fn unix_now() -> i64 {
    chrono::Utc::now().timestamp()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{AchievementToUnlock, TimeFormat, Timestamp, UnlockMode};
    use chrono::{Datelike, Timelike};

    fn timestamp_from_unix(secs: i64) -> Timestamp {
        let dt = chrono::DateTime::from_timestamp(secs, 0)
            .expect("valid timestamp")
            .with_timezone(&chrono::Local);

        Timestamp {
            day: format!("{:02}", dt.day()),
            month: format!("{:02}", dt.month()),
            year: dt.year().to_string(),
            hour: format!("{:02}", dt.hour()),
            minute: format!("{:02}", dt.minute()),
            ampm: None,
        }
    }

    fn options(achievements: Vec<AchievementToUnlock>) -> UnlockOptions {
        UnlockOptions {
            game_id: "123".to_string(),
            selected_path: "steam://".to_string(),
            achievements,
            mode: UnlockMode::Current,
            custom_timestamp: None,
            time_format: TimeFormat::TwentyFourHour,
        }
    }

    fn achievement(name: &str, completed: bool, unlock_at: i64) -> AchievementToUnlock {
        AchievementToUnlock {
            name: name.to_string(),
            completed,
            timestamp: timestamp_from_unix(unlock_at),
        }
    }

    #[test]
    fn future_timestamp_is_scheduled() {
        let now = 1_800_000_000;
        let plan = SteamUnlockPlan::build_at(
            &options(vec![achievement("ACH_WIN", true, now + 3_600)]),
            123,
            now,
        );

        assert!(plan.immediate.is_empty());
        assert_eq!(plan.scheduled.len(), 1);
        assert_eq!(plan.scheduled[0].achievement_name, "ACH_WIN");
        assert_eq!(plan.scheduled[0].app_id, 123);
        assert_eq!(plan.scheduled[0].unlock_at, now + 3_600);
    }

    #[test]
    fn past_timestamp_is_applied_immediately() {
        let now = 1_800_000_000;
        let plan = SteamUnlockPlan::build_at(
            &options(vec![achievement("ACH_WIN", true, now - 3_600)]),
            123,
            now,
        );

        assert_eq!(
            plan.immediate,
            vec![SteamUnlockAction {
                achievement_name: "ACH_WIN".to_string(),
                unlocked: true,
            }]
        );
        assert!(plan.scheduled.is_empty());
    }

    #[test]
    fn locking_is_always_immediate() {
        let now = 1_800_000_000;
        let plan = SteamUnlockPlan::build_at(
            &options(vec![achievement("ACH_WIN", false, now + 86_400)]),
            123,
            now,
        );

        assert_eq!(
            plan.immediate,
            vec![SteamUnlockAction {
                achievement_name: "ACH_WIN".to_string(),
                unlocked: false,
            }]
        );
        assert!(plan.scheduled.is_empty());
    }

    #[test]
    fn immediate_action_wins_over_scheduled_duplicate() {
        let now = 1_800_000_000;
        let plan = SteamUnlockPlan::build_at(
            &options(vec![
                achievement("ACH_WIN", true, now + 3_600),
                achievement("ACH_WIN", true, now - 3_600),
            ]),
            123,
            now,
        );

        assert_eq!(plan.immediate.len(), 1);
        assert!(plan.scheduled.is_empty());
    }

    #[test]
    fn scheduler_persists_and_reloads_queue() {
        let dir =
            std::env::temp_dir().join(format!("ham-steam-scheduler-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        let path = dir.join(PENDING_UNLOCKS_FILE);

        let now = unix_now();
        let item = PendingSteamUnlock {
            id: pending_unlock_id(123, "ACH_WIN", now + 60),
            app_id: 123,
            achievement_name: "ACH_WIN".to_string(),
            unlock_at: now + 60,
            created_at: now,
        };

        {
            let scheduler = SteamUnlockScheduler::new(path.clone());
            scheduler
                .schedule(vec![item.clone()])
                .expect("schedule should persist");
        }

        let reloaded = SteamUnlockScheduler::new(path);
        assert_eq!(reloaded.pending(), vec![item]);

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn scheduling_same_achievement_replaces_previous_entry() {
        let dir = std::env::temp_dir().join(format!(
            "ham-steam-scheduler-replace-test-{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&dir);
        let path = dir.join(PENDING_UNLOCKS_FILE);
        let scheduler = SteamUnlockScheduler::new(path);

        let now = unix_now();
        let first = PendingSteamUnlock {
            id: pending_unlock_id(123, "ACH_WIN", now + 60),
            app_id: 123,
            achievement_name: "ACH_WIN".to_string(),
            unlock_at: now + 60,
            created_at: now,
        };
        let second = PendingSteamUnlock {
            id: pending_unlock_id(123, "ACH_WIN", now + 120),
            app_id: 123,
            achievement_name: "ACH_WIN".to_string(),
            unlock_at: now + 120,
            created_at: now,
        };

        scheduler
            .schedule(vec![first])
            .expect("first schedule should persist");
        scheduler
            .schedule(vec![second.clone()])
            .expect("second schedule should persist");

        assert_eq!(scheduler.pending(), vec![second]);

        let _ = fs::remove_dir_all(&dir);
    }
}
