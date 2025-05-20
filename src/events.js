import {
  saveApiKeyBtn,
  toggleApiKeyBtn,
  fetchAchievementsBtn,
  appIdInput,
  generateFileBtn,
  exportDataBtn,
  timestampTypeSelect,
  tryAgainBtn,
  closeModalBtns,
  sidebarNavLinks,
  searchAchievementsInput,
  minimizeBtn,
  maximizeBtn,
  closeBtn,
  apiSourceSelect,
  errorCard,
  progressModal,
  progressBar,
  progressMessage
} from './constants.js';
import { saveApiKey, toggleApiKeyVisibility, initSettings, saveApiSource } from './settings.js';
import { fetchAchievements, handleTimestampTypeChange, generateAchievementsFile, filterAchievements, toggleSelectAll, exportAllAchievements } from './achievements.js';
import { handleSectionChange } from './ui.js';
import { clearGamesList } from './games.js';
import { t } from './translations.js';

export function setupEventListeners() {
  // Inicializar configurações
  initSettings();

  // Eventos da titlebar
  minimizeBtn.addEventListener('click', () => {
    console.log('Minimize button clicked');
    window.windowControls.minimize();
  });
  
  // Atualizar o botão maximizar com base no estado da janela
  window.windowControls.onWindowStateChange((state) => {
    console.log('Window state changed:', state);
    const maximizeIcon = maximizeBtn.querySelector('i');
    if (state.isMaximized) {
      console.log('Updating icon to unmaximize state');
      maximizeIcon.classList.remove('fa-up-right-and-down-left-from-center');
      maximizeIcon.classList.add('fa-down-left-and-up-right-to-center');
    } else {
      console.log('Updating icon to maximize state');
      maximizeIcon.classList.remove('fa-down-left-and-up-right-to-center');
      maximizeIcon.classList.add('fa-up-right-and-down-left-from-center');
    }
  });
  
  // Adicionar uma flag para controlar o estado de transição
  let isMaximizeInProgress = false;
  
  maximizeBtn.addEventListener('click', async () => {
    if (isMaximizeInProgress) return; // Evita cliques durante a transição
    
    isMaximizeInProgress = true;
    console.log('Maximize button clicked');
    await window.windowControls.maximize();
    
    // Adicionar um pequeno atraso antes de permitir nova ação
    setTimeout(() => {
      isMaximizeInProgress = false;
    }, 300);
  });

  closeBtn.addEventListener('click', () => {
    // Limpar a lista de jogos antes de fechar a aplicação
    clearGamesList();
    window.windowControls.close();
  });

  saveApiKeyBtn.addEventListener('click', saveApiKey);
  toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
  
  // Adicionar evento para salvar a fonte da API
  const saveApiSourceBtn = document.getElementById('saveApiSource');
  if (saveApiSourceBtn) {
    saveApiSourceBtn.addEventListener('click', saveApiSource);
  }
  
  // Adicionar evento para atualizar a visibilidade da chave da API quando a fonte muda
  if (apiSourceSelect) {
    apiSourceSelect.addEventListener('change', updateApiKeyVisibility);
    // Inicializar a visibilidade imediatamente com base na configuração atual
    setTimeout(updateApiKeyVisibility, 100); // Pequeno atraso para garantir que todos os componentes já foram carregados
  }
  
  fetchAchievementsBtn.addEventListener('click', fetchAchievements);
  appIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchAchievements();
  });
  
  generateFileBtn.addEventListener('click', generateAchievementsFile);
  exportDataBtn.addEventListener('click', exportAllAchievements);
  
  timestampTypeSelect.addEventListener('change', handleTimestampTypeChange);
  
  tryAgainBtn.addEventListener('click', () => {
    errorCard.classList.add('hidden');
    fetchAchievements();
  });

  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    });
  });

  sidebarNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = e.target.getAttribute('href').substring(1);
      handleSectionChange(section);
    });
  });

  searchAchievementsInput.addEventListener('input', filterAchievements);
  
  // Adicione um event listener para limpar a lista de jogos quando a aplicação for fechada (beforeunload)
  window.addEventListener('beforeunload', () => {
    clearGamesList();
  });

  // Select/Deselect All
  document.getElementById('toggleSelection').addEventListener('click', toggleSelectAll);
}

// Função para atualizar a visibilidade do campo API Key
function updateApiKeyVisibility() {
  if (!apiSourceSelect) return;
  
  const apiKeySettingItem = document.querySelector('.setting-item:has(#apiKey)');
  if (!apiKeySettingItem) return;
  
  const apiKeyDescription = apiKeySettingItem.querySelector('.setting-description');
  
  if (apiSourceSelect.value === 'hydra') {
    // Ocultar o campo da API Key quando a Hydra for selecionada
    apiKeySettingItem.style.display = 'none';
  } else {
    // Mostrar o campo da API Key quando a Steam for selecionada
    apiKeySettingItem.style.display = '';
    apiKeyDescription.innerHTML = 'Você pode obter sua chave da API Steam <a href="https://steamcommunity.com/dev/apikey" target="_blank">aqui</a>.';
  }
}

// Initialize timestamp type select with icon
async function initializeTimestampSelect() {
  const timestampType = timestampTypeSelect.value;
  const icons = {
    current: '<i class="fa-regular fa-clock"></i>',
    custom: '<i class="fa-regular fa-calendar"></i>',
    random: '<i class="fa-solid fa-shuffle"></i>'
  };

  // Get translated texts
  const currentText = await t('achievements.timestampCurrent');
  const customText = await t('achievements.timestampCustom');
  const randomText = await t('achievements.timestampRandom');

  // Update select content with translations
  timestampTypeSelect.innerHTML = `
    ${icons[timestampType]} ${timestampType === 'current' ? currentText : timestampType === 'custom' ? customText : randomText}
    <option value="current">${currentText}</option>
    <option value="custom">${customText}</option>
    <option value="random">${randomText}</option>
  `;
  timestampTypeSelect.value = timestampType; // Restore selected value
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await initializeTimestampSelect();
});