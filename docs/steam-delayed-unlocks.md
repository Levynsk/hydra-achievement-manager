# Delayed Steam unlocks (future timestamps)

## The problem

`ISteamUserStats::SetAchievement` has no timestamp parameter. When the call
succeeds, Steam's backend records the **current server time** as the unlock
time. There is no public API to backdate or forward-date an achievement, so a
chosen timestamp can only be respected by *waiting* until that moment and then
calling `SetAchievement`.

## Behavior

When an unlock is requested for the `steam://` source, the app splits the
request into two plans:

| Request | Result |
|---|---|
| Unlock with a timestamp `<= now` | Applied immediately, exactly like before. |
| Unlock with a timestamp `> now` | Stored in a persistent queue and applied automatically when the timestamp is reached. |
| Lock (achievement unchecked) | Applied immediately. Any queued unlock for that achievement is cancelled. |

Details:

- The queue lives in `pending-steam-unlocks.json` inside Tauri's
  `app_data_dir`, so it survives app restarts.
- A background worker wakes at the next scheduled time (and at most every 30 s,
  to tolerate system clock changes).
- If Steam is closed or the AppID cannot be initialized at the scheduled time,
  the item stays in the queue and is retried every 60 s.
- Scheduling a new time for the same achievement/AppID replaces the previous
  entry.
- If the app was closed when a timestamp passed, the unlock is applied on the
  next launch. The unlock time will then be the launch time, because the exact
  moment was missed - Steam still cannot be backdated.
- The worker shuts the temporary Steam session down after applying the batch,
  mirroring the existing unlock flow.

The app must be running (and Steam available) at the scheduled time. This is a
Steam limitation, not an app one.

## Backend

New module: `src-tauri/src/integrations/steam/pending_unlocks.rs`

- `PendingSteamUnlock` - serialized queue item (`id`, `appId`,
  `achievementName`, `unlockAt`, `createdAt`).
- `SteamUnlockPlan::build(options, app_id)` - splits an `UnlockOptions` into
  `immediate` actions and `scheduled` items. Uses
  `AchievementUnlocker::resolve_unlock_time` (extracted from
  `process_achievements` so both flows resolve timestamps identically).
- `SteamUnlockScheduler` - thread-safe, persisted queue with `schedule`,
  `cancel`, `cancel_for_achievements` and `pending`.
- `run_scheduler` - worker loop; groups due items by AppID and unlocks them.
- `apply_due_unlocks` - initializes Steamworks, switches AppID, calls
  `set_achievement(..., true)`, then shuts the session down.

State and commands:

- `AppState.steam_unlock_scheduler` (started once, after `AppState` is managed).
- `unlock_achievements` keeps its name but now returns
  `{ "unlockedNow": number, "scheduled": PendingSteamUnlock[] }`.
- `get_pending_steam_unlocks` - returns the queue ordered by time.
- `cancel_pending_steam_unlock(id)` - removes one queued unlock.
- Event `steam-pending-unlocks-updated` fires whenever the queue changes.

## Frontend

- `PendingSteamUnlocks` panel on the Steam achievements page lists queued
  unlocks with their date and a cancel button.
- The unlock toast reports scheduled amounts separately and no longer marks a
  queued achievement as unlocked optimistically.
- Global **Custom** mode now actually uses the chosen custom date for
  achievements without an individual timestamp. Previously it was replaced by
  `new Date()`, which also made future global dates impossible to schedule.
- Updated Steam warning text (en-US/pt-BR) to explain that past timestamps
  cannot be applied and future ones are queued.

## Tests

`pending_unlocks.rs` includes unit tests for:

- future timestamps being scheduled;
- past timestamps being applied immediately;
- locks always being immediate;
- immediate actions winning over a duplicate scheduled entry;
- queue persistence across scheduler instances;
- rescheduling replacing the previous entry.

Run with:

```bash
cd src-tauri
cargo test pending_unlocks
```
