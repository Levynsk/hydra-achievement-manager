import {
  achievements as achievementsImport,
  selectedAchievements,
  userAchievements as userAchievementsImport,
  achievementsList,
  achievementsCard,
  loadingCard,
  errorCard,
  searchAchievementsInput,
  timestampTypeSelect,
  customTimestampInput,
  generateFileBtn,
  appIdInput
} from './constants.js';
import { t } from './translations.js';
import { showError, showSuccess } from './settings.js';

// Variáveis locais que serão modificadas
let achievements = [];
let userAchievements = [];

export async function fetchAchievements() {
  const appId = appIdInput.value.trim();
  if (!appId) {
    await showError(await t('error.appIdRequired'));
    return;
  }

  // Limpar seleções anteriores ao mudar de jogo
  selectedAchievements.clear();
  
  loadingCard.classList.remove('hidden');
  errorCard.classList.add('hidden');
  achievementsCard.classList.add('hidden');

  try {
    const apiKey = await window.api.getApiKey();
    if (!apiKey) {
      throw new Error('API key não encontrada. Por favor, configure sua chave da API Steam nas configurações.');
    }

    // Limpar o array de conquistas antes de receber novos dados
    achievements = [];
    userAchievements = [];
    
    const achievementsResult = await window.api.getAchievements(appId, apiKey);
    if (!achievementsResult.success) {
      throw new Error(achievementsResult.message);
    }

    achievements = achievementsResult.achievements;
    await renderAchievements();
    
    loadingCard.classList.add('hidden');
    achievementsCard.classList.remove('hidden');
  } catch (error) {
    loadingCard.classList.add('hidden');
    errorCard.classList.remove('hidden');
    await showError(error.message);
  }
}

export async function renderAchievements() {
  achievementsList.innerHTML = '';
  
  // Limpar seleções anteriores antes de renderizar novas conquistas
  selectedAchievements.clear();
  
  if (achievements.length === 0) {
    achievementsList.innerHTML = `<p class="no-achievements">${await t('achievements.noAchievements')}</p>`;
    return;
  }
  
  const selectText = await t('achievements.select');
  const alreadyUnlockedText = await t('achievements.alreadyUnlocked');
  const unlockedAtText = await t('achievements.unlockedAt');
  
  // Usar um Map para garantir que cada conquista seja única por apiname
  const uniqueAchievements = new Map();
  
  // Adicionar cada conquista ao Map, sobrescrevendo duplicatas
  for (const achievement of achievements) {
    uniqueAchievements.set(achievement.apiname, achievement);
  }
  
  // Renderizar apenas as conquistas únicas
  for (const achievement of uniqueAchievements.values()) {
    const achievementItem = document.createElement('div');
    achievementItem.className = 'achievement-item';
    achievementItem.dataset.id = achievement.apiname;
    
    if (achievement.unlocked) {
      achievementItem.classList.add('achieved');
    }
    
    const iconUrl = achievement.icon || 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/0/achievements_placeholder.jpg';
    
    const unlockTimeFormatted = achievement.unlockTime 
      ? new Date(achievement.unlockTime * 1000).toLocaleString() 
      : '';
    
    achievementItem.innerHTML = `
      <input type="checkbox" class="achievement-checkbox" id="achievement-${achievement.apiname}" ${achievement.unlocked ? 'checked' : ''}>
      <img src="${iconUrl}" alt="${achievement.displayName}" class="achievement-icon">
      <div class="achievement-name">${achievement.displayName}</div>
      <div class="achievement-description">${achievement.description || await t('achievements.noDescription')}</div>
      <div class="achievement-time">
        <i class="far fa-clock"></i>
        <input type="datetime-local" id="timestamp-${achievement.apiname}" class="timestamp-input" ${achievement.unlockTime ? `value="${formatDateForInput(achievement.unlockTime)}"` : ''}>
      </div>
    `;
    
    achievementsList.appendChild(achievementItem);
    
    const checkbox = achievementItem.querySelector('.achievement-checkbox');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedAchievements.add(achievement.apiname);
        achievementItem.classList.add('achieved');
      } else {
        selectedAchievements.delete(achievement.apiname);
        achievementItem.classList.remove('achieved');
      }
      updateGenerateButtonState();
    });
    
    if (achievement.unlocked) {
      selectedAchievements.add(achievement.apiname);
    }
  }
  
  updateGenerateButtonState();
  setupAchievementCardListeners();
}

function formatDateForInput(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toISOString().slice(0, 16);
}

export function selectAllAchievements() {
  const checkboxes = document.querySelectorAll('.achievement-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
    const achievementId = checkbox.closest('.achievement-item').dataset.id;
    selectedAchievements.add(achievementId);
  });
  updateGenerateButtonState();
}

export function deselectAllAchievements() {
  const checkboxes = document.querySelectorAll('.achievement-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  selectedAchievements.clear();
  updateGenerateButtonState();
}

export function handleTimestampTypeChange() {
  const timestampType = timestampTypeSelect.value;
  if (timestampType === 'custom') {
    customTimestampInput.classList.remove('hidden');
  } else {
    customTimestampInput.classList.add('hidden');
  }
}

export async function generateAchievementsFile() {
  try {
    if (selectedAchievements.size === 0) {
      await showError(await t('errors.noSelection'));
      return;
    }
    
    const appId = appIdInput.value.trim();
    if (!appId) {
      await showError(await t('errors.invalidAppId'));
      return;
    }

    const achievementsData = [];
    
    for (const achievementId of selectedAchievements) {
      const timestampInput = document.getElementById(`timestamp-${achievementId}`);
      let unlockTime;

      if (timestampInput && timestampInput.value) {
        unlockTime = Math.floor(new Date(timestampInput.value).getTime() / 1000);
      } else {
        const timestampType = timestampTypeSelect.value;
        switch (timestampType) {
          case 'custom':
            if (customTimestampInput.value) {
              unlockTime = Math.floor(new Date(customTimestampInput.value).getTime() / 1000);
            } else {
              unlockTime = Math.floor(Date.now() / 1000);
            }
            break;
          case 'random':
            const now = Math.floor(Date.now() / 1000);
            const oneYearAgo = now - (365 * 24 * 60 * 60);
            unlockTime = Math.floor(Math.random() * (now - oneYearAgo) + oneYearAgo);
            break;
          default:
            unlockTime = Math.floor(Date.now() / 1000);
        }
      }

      achievementsData.push({
        id: achievementId,
        unlockTime
      });
    }

    const result = await window.api.writeAchievements(appId, achievementsData);
    
    if (result.success) {
      const successMessage = document.getElementById('successMessage');
      const successModal = document.getElementById('successModal');
      if (successMessage && successModal) {
        successMessage.textContent = result.message;
        
        // Garante que o modal seja exibido sempre
        successModal.classList.remove('active');
        // Força um reflow do DOM
        void successModal.offsetWidth;
        // Adiciona a classe active para exibir o modal
        successModal.classList.add('active');
      }
    } else {
      throw new Error(result.message || await t('errors.writeError'));
    }
  } catch (error) {
    await showError(error.message);
  }
}

export function updateGenerateButtonState() {
  generateFileBtn.disabled = selectedAchievements.size === 0;
  if (selectedAchievements.size === 0) {
    generateFileBtn.classList.add('btn-disabled');
  } else {
    generateFileBtn.classList.remove('btn-disabled');
  }
}

export function filterAchievements() {
  const searchTerm = searchAchievementsInput.value.toLowerCase();
  const achievementItems = document.querySelectorAll('.achievement-item');

  achievementItems.forEach(item => {
    const achievementName = item.querySelector('.achievement-name').textContent.toLowerCase();
    if (achievementName.includes(searchTerm)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

export function setupAchievementCardListeners() {
  const expandButtons = document.querySelectorAll('.expand-card-btn');
  expandButtons.forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.achievement-item');
      const options = card.querySelector('.custom-timestamp-options');
      options.classList.toggle('hidden');
    });
  });

  const enableCustomTimestampCheckboxes = document.querySelectorAll('.enable-custom-timestamp');
  enableCustomTimestampCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const input = e.target.closest('.custom-timestamp-options').querySelector('.custom-timestamp-input');
      input.disabled = !e.target.checked;
      input.classList.toggle('hidden', !e.target.checked);
    });
  });
} 