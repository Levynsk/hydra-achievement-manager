import { apiKeyInput, customTimestampInput } from './constants.js';
import { initLanguageSelector } from './settings.js';
import { applyTranslations } from './translations.js';
import { t } from './translations.js';
import { setupEventListeners } from './events.js';
import { initSearchListeners } from './search.js';
import { populateChangelog } from './ui.js';
import { initLoadingScreen } from './setup.js';
import { ensureWizardAlwaysShows } from './config.js';

export async function initApp() {
  // Garante que o wizard sempre aparece
  await ensureWizardAlwaysShows();
  // Show loading screen first
  await initLoadingScreen();

  const savedApiKey = await window.api.getApiKey();
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
    apiKeyInput.type = 'password';
  }

  const now = new Date();
  const localNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  customTimestampInput.value = localNow.toISOString().slice(0, 16);

  await initLanguageSelector();
  await applyTranslations();

  setupEventListeners();
  initSearchListeners();
}

document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
  populateChangelog();
});