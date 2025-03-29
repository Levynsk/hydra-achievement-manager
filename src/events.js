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
  closeBtn
} from './constants.js';
import { saveApiKey, toggleApiKeyVisibility, initSettings } from './settings.js';
import { fetchAchievements, selectAllAchievements, deselectAllAchievements, handleTimestampTypeChange, generateAchievementsFile, filterAchievements } from './achievements.js';
import { handleSectionChange } from './ui.js';
import { clearGamesList } from './games.js';

export function setupEventListeners() {
  // Inicializar configurações
  initSettings();

  // Eventos da titlebar
  minimizeBtn.addEventListener('click', () => window.windowControls.minimize());
  maximizeBtn.addEventListener('click', async () => {
    await window.windowControls.maximize();
    // Atualizar o ícone do botão de maximizar
    const isMaximized = await window.windowControls.isMaximized();
    maximizeBtn.querySelector('i').className = isMaximized ? 'fas fa-window-restore' : 'fas fa-window-maximize';
  });
  closeBtn.addEventListener('click', () => {
    // Limpar a lista de jogos antes de fechar a aplicação
    clearGamesList();
    window.windowControls.close();
  });

  saveApiKeyBtn.addEventListener('click', saveApiKey);
  toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
  
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
        modal.classList.remove('active');
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