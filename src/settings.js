import { apiKeyInput, currentLanguage, setCurrentLanguage, saveApiKeyBtn, toggleApiKeyBtn } from './constants.js';
import { applyTranslations } from './translations.js';
import { t } from './translations.js';

export async function initLanguageSelector() {
  const languageSelect = document.getElementById('languageSelect');
  if (!languageSelect) return;
  
  try {
    // Obter idiomas disponíveis e idioma atual
    const languages = await window.api.getAvailableLanguages();
    const currentLang = await window.api.getCurrentLanguage();
    setCurrentLanguage(currentLang);

    // Limpar opções existentes
    languageSelect.innerHTML = '';
    
    // Adicionar opções de idioma
    Object.values(languages).forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.name;
      if (lang.code === currentLanguage) {
        option.selected = true;
      }
      languageSelect.appendChild(option);
    });
    
    // Adicionar evento de mudança de idioma
    languageSelect.addEventListener('change', async (e) => {
      const newLang = e.target.value;
      await window.api.setLanguage(newLang);
      setCurrentLanguage(newLang);
      
      // Recarregar a página para aplicar o novo idioma
      window.location.reload();
    });
    
    console.log('Seletor de idiomas inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar seletor de idiomas:', error);
  }
}

export async function saveApiKey() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    await showError(await t('errors.invalidApiKey'));
    return;
  }
  
  const result = await window.api.saveApiKey(apiKey);
  if (result.success) {
    const savedText = await t('settings.saved');
    saveApiKeyBtn.innerHTML = `<i class="fas fa-check"></i> ${savedText}`;
    setTimeout(async () => {
      const saveText = await t('settings.saveApiKey');
      saveApiKeyBtn.innerHTML = `<i class="fas fa-save"></i> ${saveText}`;
    }, 2000);
  }
}

export function toggleApiKeyVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleApiKeyBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    apiKeyInput.type = 'password';
    toggleApiKeyBtn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

export function setupSettingsTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Remover classe active de todos os botões e painéis
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Adicionar classe active ao botão e painel correspondente
      button.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}

export async function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  const errorCard = document.getElementById('errorCard');
  const achievementsCard = document.getElementById('achievementsCard');
  const loadingCard = document.getElementById('loadingCard');
  
  if (errorMessage) errorMessage.textContent = message;
  if (errorCard) errorCard.classList.remove('hidden');
  if (achievementsCard) achievementsCard.classList.add('hidden');
  if (loadingCard) loadingCard.classList.add('hidden');
}

export async function showSuccess(message) {
  const successMessage = document.getElementById('successMessage');
  const successModal = document.getElementById('successModal');
  
  if (successMessage) successMessage.textContent = message;
  if (successModal) successModal.classList.add('active');
}

export async function initSettings() {
  // Carregar API Key salva
  const savedApiKey = await window.api.getApiKey();
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
    apiKeyInput.type = 'password';
  }
  
  // Configurar as abas de configurações
  setupSettingsTabs();
  
  // Esconder o campo Steam ID na interface 
  const steamIdContainer = document.querySelector('.setting-item:has(#steamId)');
  if (steamIdContainer) {
    steamIdContainer.style.display = 'none';
  }
} 