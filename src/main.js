import { apiKeyInput, customTimestampInput } from './constants.js';
import { initLanguageSelector } from './settings.js';
import { applyTranslations } from './translations.js';
import { t } from './translations.js';
import { setupEventListeners } from './events.js';

export async function initApp() {
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
}

document.addEventListener('DOMContentLoaded', initApp);