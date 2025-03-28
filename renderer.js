
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const toggleApiKeyBtn = document.getElementById('toggleApiKey');
const appIdInput = document.getElementById('appId');
const steamIdInput = document.getElementById('steamId');
const fetchAchievementsBtn = document.getElementById('fetchAchievements');
const achievementsCard = document.getElementById('achievementsCard');
const loadingCard = document.getElementById('loadingCard');
const errorCard = document.getElementById('errorCard');
const errorMessage = document.getElementById('errorMessage');
const tryAgainBtn = document.getElementById('tryAgain');
const achievementsList = document.getElementById('achievementsList');
const selectAllBtn = document.getElementById('selectAll');
const deselectAllBtn = document.getElementById('deselectAll');
const timestampTypeSelect = document.getElementById('timestampType');
const customTimestampInput = document.getElementById('customTimestamp');
const generateFileBtn = document.getElementById('generateFile');
const successModal = document.getElementById('successModal');
const successMessage = document.getElementById('successMessage');
const closeModalBtns = document.querySelectorAll('.close-modal');
const appContainer = document.querySelector('.app-container');
const currentSectionTitle = document.getElementById('currentSection');
const sidebarNavLinks = document.querySelectorAll('.sidebar-nav a');
const searchAchievementsInput = document.getElementById('searchAchievements');
const appIdContainer = document.querySelector('.app-id-info');

let achievements = [];
let selectedAchievements = new Set();
let userAchievements = [];

async function initApp() {
  const savedApiKey = await window.api.getApiKey();
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
    apiKeyInput.type = 'password';
  }
  
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  customTimestampInput.value = now.toISOString().slice(0, 16);
  
  loadThemeSettings();
  
  setupEventListeners();
}

function setupEventListeners() {
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
      successModal.classList.remove('active');
    });
  });
  
  sidebarNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      

      sidebarNavLinks.forEach(l => l.parentElement.classList.remove('active'));
      
      link.parentElement.classList.add('active');
      
      currentSectionTitle.textContent = link.textContent.trim();
      
      const targetSection = link.getAttribute('href').substring(1);
      handleSectionChange(targetSection);
    });
  });

  searchAchievementsInput.addEventListener('input', filterAchievements);

  document.getElementById('minimizeBtn').addEventListener('click', () => {
    window.windowControls.minimize();
  });

  document.getElementById('maximizeBtn').addEventListener('click', () => {
    window.windowControls.maximize();
  });

  document.getElementById('closeBtn').addEventListener('click', () => {
    window.windowControls.close();
  });
}

async function saveApiKey() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showError('Por favor, insira uma chave de API válida.');
    return;
  }
  
  const result = await window.api.saveApiKey(apiKey);
  if (result.success) {
    saveApiKeyBtn.innerHTML = '<i class="fas fa-check"></i> Salvo';
    setTimeout(() => {
      saveApiKeyBtn.innerHTML = '<i class="fas fa-save"></i> Salvar';
    }, 2000);
  }
}

function toggleApiKeyVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleApiKeyBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    apiKeyInput.type = 'password';
    toggleApiKeyBtn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

async function fetchAchievements() {
  const appId = appIdInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  
  if (!appId) {
    showError('Por favor, insira um App ID válido.');
    return;
  }
  
  if (!apiKey) {
    showError('Por favor, insira uma chave de API válida.');
    return;
  }
  
  appIdContainer.innerHTML = `<p>Você pode encontrar o App ID na URL da loja Steam: store.steampowered.com/app/<strong>APP_ID</strong>/</p>`;

  await displayGameInfo(appId);
  
  achievementsCard.classList.add('hidden');
  errorCard.classList.add('hidden');
  loadingCard.classList.remove('hidden');
  
  achievements = [];
  selectedAchievements.clear();
  
  const result = await window.api.getAchievements(appId, apiKey);
  
  loadingCard.classList.add('hidden');
  
  if (result.success) {
    achievements = result.achievements;
    renderAchievements();
    achievementsCard.classList.remove('hidden');
  } else {
    showError(result.message || 'Ocorreu um erro ao buscar as conquistas.');
  }
}

function renderAchievements() {
  achievementsList.innerHTML = '';
  
  if (achievements.length === 0) {
    achievementsList.innerHTML = '<p class="no-achievements">Nenhuma conquista encontrada para este jogo.</p>';
    return;
  }
  
  achievements.forEach(achievement => {
    const achievementItem = document.createElement('div');
    achievementItem.className = 'achievement-item';
    achievementItem.dataset.id = achievement.id;
    
    const iconUrl = achievement.icon || 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/0/achievements_placeholder.jpg';
    
    achievementItem.innerHTML = `
      <img src="${iconUrl}" alt="${achievement.name}" class="achievement-icon">
      <div class="achievement-info">
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-description">${achievement.description || 'Sem descrição'}</div>
        <div class="checkbox-container">
          <input type="checkbox" class="custom-checkbox achievement-checkbox" id="achievement-${achievement.id}">
          <label for="achievement-${achievement.id}">Selecionar</label>
        </div>
        <!-- Ensure the custom timestamp input is visible -->
        <div class="custom-timestamp">
          <label for="timestamp-${achievement.id}">Timestamp:</label>
          <input type="datetime-local" id="timestamp-${achievement.id}" class="timestamp-input">
        </div>
      </div>
    `;
    
    achievementsList.appendChild(achievementItem);
    
    const checkbox = achievementItem.querySelector('.achievement-checkbox');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedAchievements.add(achievement.id);
      } else {
        selectedAchievements.delete(achievement.id);
      }
      updateGenerateButtonState();
    });
  });
  
  updateGenerateButtonState();
  setupAchievementCardListeners();
}

function selectAllAchievements() {
  const checkboxes = document.querySelectorAll('.achievement-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
    const achievementId = checkbox.closest('.achievement-item').dataset.id;
    selectedAchievements.add(achievementId);
  });
  updateGenerateButtonState();
}

function deselectAllAchievements() {
  const checkboxes = document.querySelectorAll('.achievement-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  selectedAchievements.clear();
  updateGenerateButtonState();
}

function handleTimestampTypeChange() {
  const timestampType = timestampTypeSelect.value;
  if (timestampType === 'custom') {
    customTimestampInput.classList.remove('hidden');
  } else {
    customTimestampInput.classList.add('hidden');
  }
}

async function generateAchievementsFile() {
  try {
    if (selectedAchievements.size === 0) {
      showError('Por favor, selecione pelo menos uma conquista.');
      return;
    }
    
    const appId = appIdInput.value.trim();
    if (!appId) {
      showError('App ID inválido.');
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
      successMessage.textContent = result.message;
      successModal.classList.add('active');
    } else {
      throw new Error(result.message || 'Erro ao gerar arquivo.');
    }
  } catch (error) {
    showError(error.message);
  }
}

function updateGenerateButtonState() {
  generateFileBtn.disabled = selectedAchievements.size === 0;
  if (selectedAchievements.size === 0) {
    generateFileBtn.classList.add('btn-disabled');
  } else {
    generateFileBtn.classList.remove('btn-disabled');
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorCard.classList.remove('hidden');
  achievementsCard.classList.add('hidden');
  loadingCard.classList.add('hidden');
}

async function loadThemeSettings() {
  const config = await window.api.getConfig();
  const theme = config.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) {
    themeSelect.value = theme;
    
    themeSelect.addEventListener('change', async (e) => {
      const newTheme = e.target.value;
      document.documentElement.setAttribute('data-theme', newTheme);
      await window.api.saveConfig('theme', newTheme);
    });
  }
  
  const outputPathInput = document.getElementById('outputPath');
  if (outputPathInput) {
    outputPathInput.value = config.outputPath || 'C:/Users/Public/Documents/Steam/RUNE';
    
    const saveOutputPathBtn = document.getElementById('saveOutputPath');
    if (saveOutputPathBtn) {
      saveOutputPathBtn.addEventListener('click', async () => {
        const newPath = outputPathInput.value.trim();
        if (newPath) {
          await window.api.saveConfig('outputPath', newPath);
          saveOutputPathBtn.innerHTML = '<i class="fas fa-check"></i> Salvo';
          setTimeout(() => {
            saveOutputPathBtn.innerHTML = '<i class="fas fa-save"></i> Salvar';
          }, 2000);
        }
      });
    }
  }
}

function handleSectionChange(section) {
  const gamesSection = document.getElementById('gamesSection');
  const achievementsSection = document.querySelector('.setup-section');
  const settingsSection = document.getElementById('settingsSection');

  gamesSection.classList.add('hidden');
  achievementsSection.classList.add('hidden');
  settingsSection.classList.add('hidden');

  if (section === 'games') {
    gamesSection.classList.remove('hidden');
    fetchGames();
  } else if (section === 'achievements') {
    achievementsSection.classList.remove('hidden');
  } else if (section === 'settings') {
    settingsSection.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', initApp);

function filterAchievements() {
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

function setupAchievementCardListeners() {
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

async function fetchGames() {
  const gamesList = document.getElementById('gamesList');
  gamesList.innerHTML = '<p>Carregando jogos...</p>';

  try {
    const config = await window.api.getConfig();
    const outputPath = config.outputPath;

    if (!outputPath) {
      throw new Error('O caminho de saída não está configurado.');
    }

    const result = await window.api.getGameFolders(outputPath);

    if (!result.success) {
      throw new Error(result.message);
    }

    const games = [];
    for (const game of result.games) {
      const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${game.id}`);
      const data = await response.json();
      if (data[game.id]?.success) {
        const gameData = data[game.id].data;
        const totalAchievements = gameData.achievements?.total || 0;

        games.push({
          id: game.id,
          name: gameData.name,
          image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/header.jpg`,
          achievements: {
            unlocked: game.unlockedAchievements,
            total: totalAchievements,
          },
        });
      }
    }

    gamesList.innerHTML = '';
    games.forEach(game => {
      const progress = (game.achievements.unlocked / game.achievements.total) * 100;
      const gameCard = document.createElement('div');
      gameCard.className = 'game-card';
      gameCard.style.cursor = 'pointer';
      gameCard.innerHTML = `
        <img src="${game.image}" alt="${game.name}">
        <div class="game-info">
          <div class="game-title">${game.name}</div>
          <div class="game-achievements">${game.achievements.unlocked}/${game.achievements.total} conquistas</div>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-bar-inner" style="width: ${progress}%;"></div>
            </div>
            <div class="progress-percentage">${progress.toFixed(1)}%</div>
          </div>
        </div>
      `;

      gameCard.addEventListener('click', () => {
        appIdInput.value = game.id;
        
        const achievementsLink = document.querySelector('.sidebar-nav a[href="#achievements"]');
        achievementsLink.click();
        
        fetchAchievements();
      });

      gamesList.appendChild(gameCard);
    });
  } catch (error) {
    gamesList.innerHTML = `<p>Erro ao carregar jogos: ${error.message}</p>`;
  }
}

async function displayGameInfo(appId) {
  try {
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
    const data = await response.json();
    
    const config = await window.api.getConfig();
    const outputPath = config.outputPath;
    const result = await window.api.getGameFolders(outputPath);
    
    if (data[appId]?.success) {
      const gameData = data[appId].data;
      const totalAchievements = gameData.achievements?.total || 0;
      
      let unlockedAchievements = 0;
      if (result.success) {
        const gameInfo = result.games.find(g => g.id === appId);
        if (gameInfo) {
          unlockedAchievements = gameInfo.unlockedAchievements;
        }
      }

      const progress = totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0;
      
      const gameInfoHtml = `
        <div class="game-preview-card" style="
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--bg-tertiary);
          padding: 1rem;
          border-radius: var(--card-radius);
          margin: 1rem 0;
        ">
          <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg" 
               alt="${gameData.name}"
               style="width: 200px; height: auto; border-radius: 4px;">
          <div class="game-preview-info" style="flex: 1;">
            <h3 style="margin-bottom: 0.5rem;">${gameData.name}</h3>
            <div class="game-achievements" style="color: var(--text-secondary); margin-bottom: 0.5rem;">
              ${unlockedAchievements}/${totalAchievements} conquistas
            </div>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-bar-inner" style="width: ${progress}%;"></div>
              </div>
              <div class="progress-percentage">${progress.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      `;
      
      appIdContainer.innerHTML = gameInfoHtml + appIdContainer.innerHTML;
    }
  } catch (error) {
    console.error('Erro ao buscar informações do jogo:', error);
  }
}