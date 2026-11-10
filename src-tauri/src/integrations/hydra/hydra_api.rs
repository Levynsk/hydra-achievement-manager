use crate::models::{HydraAchievement, HydraGameAchievements};
use anyhow::{Context, Result};

pub struct HydraApi;

impl HydraApi {
    /// Busca achievements de um jogo usando a API Hydra
    pub async fn get_game_achievements(
        game_id: &str,
        language: Option<&str>,
    ) -> Result<HydraGameAchievements> {
        let base_url = std::env::var("HYDRA_API_URL")
            .unwrap_or_else(|_| "https://hydra-api-us-east-1.losbroxas.org".to_string());
        let base_url = base_url.trim_end_matches('/');

        let mut final_url = format!("{}/games/steam/{}/achievements", base_url, game_id);

        if let Some(lang) = language {
            let clean_lang = lang.trim();
            if !clean_lang.is_empty() {
                final_url.push_str("?language=");
                final_url.push_str(clean_lang);
            }
        }

        log::info!("Fetching Hydra achievements from: {}", final_url);

        let client = crate::utils::http::get_client().map_err(|e| {
            log::error!("Failed to create HTTP client: {}", e);
            anyhow::anyhow!("Internal HTTP client error: {}", e)
        })?;

        let response = client
            .get(&final_url)
            .header("User-Agent", "Hydra-Achievement-Manager")
            .send()
            .await
            .map_err(|e| {
                log::error!("Hydra API Request Failed (reqwest): Error={:?}", e);
                anyhow::anyhow!("Failed to fetch from Hydra API: {}", e)
            })?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_default();
            log::error!(
                "Hydra API error status: {} body: {}",
                status,
                error_text
            );
            anyhow::bail!("Hydra API returned status {}: {}", status, error_text);
        }

        let mut achievements: Vec<HydraAchievement> = response
            .json()
            .await
            .context("Failed to parse Hydra API response")?;

        for ach in &mut achievements {
            if ach.percent.is_none() {
                ach.percent = ach.global_unlock_percentage;
            }
        }

        Ok(HydraGameAchievements {
            game_id: game_id.to_string(),
            achievements,
        })
    }

    /// Busca um achievement específico pelo nome
    pub fn get_achievement_by_name(
        game_achievements: &HydraGameAchievements,
        achievement_name: &str,
    ) -> Option<HydraAchievement> {
        game_achievements
            .achievements
            .iter()
            .find(|ach| ach.name == achievement_name)
            .cloned()
    }
}
