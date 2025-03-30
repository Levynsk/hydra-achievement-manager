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
  
  // Configurar o timestamp personalizado inicial com a data e hora atuais
  const now = new Date();
  // Ajustar para o fuso horário local
  const localNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  customTimestampInput.value = localNow.toISOString().slice(0, 16);
  
  // Inicializar traduções
  await initLanguageSelector();
  await applyTranslations();
  
  // Configurar o caminho de saída
  const config = await window.api.getConfig();
  const outputPathInput = document.getElementById('outputPath');
  if (outputPathInput) {
    outputPathInput.value = config.outputPath || 'C:/Users/Public/Documents/Steam/RUNE';
    
    const saveOutputPathBtn = document.getElementById('saveOutputPath');
    if (saveOutputPathBtn) {
      saveOutputPathBtn.addEventListener('click', async () => {
        const newPath = outputPathInput.value.trim();
        if (newPath) {
          await window.api.saveConfig('outputPath', newPath);
          const savedText = await t('settings.saved');
          saveOutputPathBtn.innerHTML = `<i class="fas fa-check"></i> ${savedText}`;
          setTimeout(async () => {
            const saveText = await t('settings.saveApiKey');
            saveOutputPathBtn.innerHTML = `<i class="fas fa-save"></i> ${saveText}`;
          }, 2000);
        }
      });
    }
  }
  
  setupEventListeners();
}

// Inicializar a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initApp); 