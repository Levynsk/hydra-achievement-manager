import {
  saveApiKeyBtn,
  toggleApiKeyBtn,
  fetchAchievementsBtn,
  appIdInput,
  selectAllBtn,
  deselectAllBtn,
  generateFileBtn,
  timestampTypeSelect,
  tryAgainBtn,
  closeModalBtns,
  sidebarNavLinks,
  searchAchievementsInput,
  minimizeBtn,
  maximizeBtn,
  closeBtn,
  apiSourceSelect,
  errorCard
} from './constants.js';
import { saveApiKey, toggleApiKeyVisibility, initSettings, saveApiSource } from './settings.js';
import { fetchAchievements, selectAllAchievements, deselectAllAchievements, handleTimestampTypeChange, generateAchievementsFile, filterAchievements } from './achievements.js';
import { handleSectionChange } from './ui.js';
import { clearGamesList } from './games.js';

export function setupEventListeners() {
  // Inicializar configurações
  initSettings();

  // Eventos da titlebar
  minimizeBtn.addEventListener('click', () => window.windowControls.minimize());
  maximizeBtn.addEventListener('click', () => window.windowControls.maximize());
  closeBtn.addEventListener('click', () => {
    // Limpar a lista de jogos antes de fechar a aplicação
    clearGamesList();
    window.windowControls.close();
  });

  // Atualizar ícone do botão de maximizar quando o estado da janela mudar
  window.windowControls.onWindowStateChange((state) => {
    maximizeBtn.querySelector('i').className = state === 'maximized' ? 'fas fa-window-restore' : 'fas fa-window-maximize';
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
  
  selectAllBtn.addEventListener('click', selectAllAchievements);
  deselectAllBtn.addEventListener('click', deselectAllAchievements);
  generateFileBtn.addEventListener('click', generateAchievementsFile);
  
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