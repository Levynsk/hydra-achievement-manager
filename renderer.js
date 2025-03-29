
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
let currentLanguage = 'pt-BR'; 

async function t(key, params = {}) {
  return await window.api.getTranslation(key, params);
}

async function applyTranslations() {
  const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
  sidebarLinks[0].textContent = await t('sidebar.games');
  sidebarLinks[1].textContent = await t('sidebar.achievements');
  sidebarLinks[2].textContent = await t('sidebar.settings');
  
  document.querySelector('.app-id-achievements-card h2').textContent = await t('achievements.title');
  appIdInput.placeholder = await t('achievements.appIdPlaceholder');
  appIdContainer.innerHTML = `<p>${await t('achievements.appIdInfo')}</p>`;
  searchAchievementsInput.placeholder = await t('achievements.searchPlaceholder');
  selectAllBtn.innerHTML = `<i class="fas fa-check-square"></i> ${await t('achievements.selectAll')}`;
  deselectAllBtn.innerHTML = `<i class="fas fa-square"></i> ${await t('achievements.deselectAll')}`;
  document.querySelector('label[for="timestampType"]').textContent = await t('achievements.timestamp');
  
  const timestampOptions = timestampTypeSelect.options;
  timestampOptions[0].textContent = await t('achievements.timestampCurrent');
  timestampOptions[1].textContent = await t('achievements.timestampCustom');
  timestampOptions[2].textContent = await t('achievements.timestampRandom');
  
  generateFileBtn.innerHTML = `<i class="fas fa-file-export"></i> ${await t('achievements.generateFile')}`;
  
  const settingsTitle = document.querySelector('#settingsSection h2');
  if (settingsTitle) {
    settingsTitle.textContent = await t('settings.title');
  }
  
  const apiKeyLabel = document.querySelector('label[for="apiKey"]');
  if (apiKeyLabel) {
    apiKeyLabel.textContent = await t('settings.apiKeyLabel');
  }
  
  if (apiKeyInput) {
    apiKeyInput.placeholder = await t('settings.apiKeyPlaceholder');
  }
  
  if (saveApiKeyBtn) {
    saveApiKeyBtn.innerHTML = `<i class="fas fa-save"></i> ${await t('settings.saveApiKey')}`;
  }
  
  const apiKeyInfo = document.querySelector('.setting-description');
  if (apiKeyInfo) {
    apiKeyInfo.innerHTML = await t('settings.apiKeyInfo');
  }
  
  const languageLabel = document.querySelector('label[for="languageSelect"]');
  if (languageLabel) {
    languageLabel.textContent = await t('settings.languageLabel');
  }
  
  const languageInfo = document.querySelectorAll('.setting-description')[1];
  if (languageInfo) {
    languageInfo.textContent = await t('settings.languageInfo');
  }
  
  const appearanceTitle = document.querySelector('.settings-group:nth-child(3) h3');
  if (appearanceTitle) {
    appearanceTitle.textContent = await t('settings.appearance');
  }
  
  const themeLabel = document.querySelector('label[for="themeSelect"]');
  if (themeLabel) {
    themeLabel.textContent = await t('settings.themeLabel');
  }
  
  const outputDirLabel = document.querySelector('label[for="outputPath"]');
  if (outputDirLabel) {
    outputDirLabel.textContent = await t('settings.outputDirLabel');
  }
  
  const outputPathInput = document.getElementById('outputPath');
  if (outputPathInput) {
    outputPathInput.placeholder = await t('settings.outputDirPlaceholder');
  }
  
  const outputDirInfo = document.querySelectorAll('.setting-description')[2];
  if (outputDirInfo) {
    outputDirInfo.textContent = await t('settings.outputDirInfo');
  }
  
  const saveOutputPathBtn = document.getElementById('saveOutputPath');
  if (saveOutputPathBtn) {
    saveOutputPathBtn.innerHTML = `<i class="fas fa-save"></i> ${await t('settings.saveApiKey')}`;
  }
  
  const aboutTitle = document.querySelector('.settings-group:nth-child(5) h3');
  if (aboutTitle) {
    aboutTitle.textContent = await t('settings.about');
  }
  
  const aboutText = document.querySelectorAll('.settings-group:nth-child(5) p');
  if (aboutText.length >= 3) {
    aboutText[0].textContent = await t('app.title') + ' ' + await t('app.version');
    aboutText[1].textContent = await t('app.about');
    aboutText[2].textContent = await t('app.credits');
  }
  
  updateCurrentSectionTitle();
  
  const loadingText = document.querySelector('#loadingCard p');
  if (loadingText) {
    loadingText.textContent = await t('loading.achievements');
  }
  
  const errorTitle = document.querySelector('#errorCard h3');
  if (errorTitle) {
    errorTitle.textContent = await t('error.title');
  }
  
  const tryAgainButton = document.getElementById('tryAgain');
  if (tryAgainButton) {
    tryAgainButton.textContent = await t('error.tryAgain');
  }
  
  const successTitle = document.querySelector('#successModal .modal-header h3');
  if (successTitle) {
    successTitle.innerHTML = `<i class="fas fa-check-circle"></i> ${await t('success.title')}`;
  }
  
  const okButton = document.querySelector('#successModal .modal-footer button');
  if (okButton) {
    okButton.textContent = await t('success.ok');
  }
}

async function updateCurrentSectionTitle() {
  const activeLink = document.querySelector('.sidebar-nav li.active a');
  if (activeLink) {
    const section = activeLink.getAttribute('href').substring(1);
    let titleKey = '';
    
    switch (section) {
      case 'games':
        titleKey = 'sidebar.games';
        break;
      case 'achievements':
        titleKey = 'sidebar.achievements';
        break;
      case 'settings':
        titleKey = 'sidebar.settings';
        break;
      default:
        titleKey = 'sidebar.achievements';
    }
    
    currentSectionTitle.textContent = await t(titleKey);
  }
}

async function initLanguageSelector() {
  const languageSelect = document.getElementById('languageSelect');
  if (!languageSelect) return;
  
  const languages = await window.api.getAvailableLanguages();
  currentLanguage = await window.api.getCurrentLanguage();

  languageSelect.innerHTML = '';
  
  Object.values(languages).forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.name;
    if (lang.code === currentLanguage) {
      option.selected = true;
    }
    languageSelect.appendChild(option);
  });
  
  languageSelect.addEventListener('change', async (e) => {
    const newLang = e.target.value;
    await window.api.setLanguage(newLang);
    currentLanguage = newLang;
    await applyTranslations();
  });
}

async function initApp() {
  const savedApiKey = await window.api.getApiKey();
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
    apiKeyInput.type = 'password';
  }
  
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  customTimestampInput.value = now.toISOString().slice(0, 16);
  
  // Inicializar traduções
  await initLanguageSelector();
  await applyTranslations();
  
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
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      

      sidebarNavLinks.forEach(l => l.parentElement.classList.remove('active'));
      
      link.parentElement.classList.add('active');
      
      await updateCurrentSectionTitle();
      
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
    showError(await t('errors.invalidApiKey'));
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
    showError(await t('errors.invalidAppId'));
    return;
  }
  
  if (!apiKey) {
    showError(await t('errors.invalidApiKey'));
    return;
  }
  
  appIdContainer.innerHTML = `<p>${await t('achievements.appIdInfo')}</p>`;

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
    await renderAchievements();
    achievementsCard.classList.remove('hidden');
  } else {
    showError(result.message || await t('errors.fetchError'));
  }
}

async function renderAchievements() {
  achievementsList.innerHTML = '';
  
  if (achievements.length === 0) {
    achievementsList.innerHTML = `<p class="no-achievements">${await t('achievements.noAchievements')}</p>`;
    return;
  }
  
  const selectText = await t('achievements.select');
  
  for (const achievement of achievements) {
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
          <label for="achievement-${achievement.id}">${selectText}</label>
        </div>
        <!-- Ensure the custom timestamp input is visible -->
        <div class="custom-timestamp">
          <label for="timestamp-${achievement.id}">${await t('achievements.timestamp')}</label>
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
  }
  
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
      showError(await t('errors.noSelection'));
      return;
    }
    
    const appId = appIdInput.value.trim();
    if (!appId) {
      showError(await t('errors.invalidAppId'));
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
      throw new Error(result.message || await t('errors.writeError'));
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

async function showError(message) {
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
  gamesList.innerHTML = `<div class="loading-content"><div class="loader"></div><p>${await t('games.loading')}</p></div>`;

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
    
    if (games.length === 0) {
      gamesList.innerHTML = `<p class="no-games">${await t('games.noGames')}</p>`;
      return;
    }
    
    const selectText = await t('games.select');
    // Progress text removed as we're only showing percentage now
    
    games.forEach(game => {
      const progress = game.achievements.total > 0 ? (game.achievements.unlocked / game.achievements.total) * 100 : 0;
      const gameCard = document.createElement('div');
      gameCard.className = 'game-card';
      gameCard.innerHTML = `
        <img src="${game.image}" alt="${game.name}" onerror="this.src='assets/game-placeholder.jpg'">
        <div class="game-info">
          <div class="game-title" title="${game.name}">${game.name}</div>
          <div class="game-achievements">
            <i class="fas fa-trophy"></i> ${game.achievements.unlocked}/${game.achievements.total} conquistas
          </div>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-bar-inner" style="width: ${progress}%;"></div>
            </div>
            <div class="progress-details">
              <span class="progress-percentage">${progress.toFixed(1)}%</span>
            </div>
          </div>
          <button class="play-button">
            <i class="fas fa-gamepad"></i> ${selectText}
          </button>
        </div>
      `;

      gameCard.querySelector('.play-button').addEventListener('click', () => {
        appIdInput.value = game.id;
        
        const achievementsLink = document.querySelector('.sidebar-nav a[href="#achievements"]');
        achievementsLink.click();
        
        fetchAchievements();
      });

      gamesList.appendChild(gameCard);
    });
  } catch (error) {
    const errorTemplate = await t('games.error', { message: error.message });
    gamesList.innerHTML = `<p class="error-message">${errorTemplate}</p>`;
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
        const game = result.games.find(g => g.id === appId);
        if (game) {
          unlockedAchievements = game.unlockedAchievements;
        }
      }
      
      appIdContainer.innerHTML = `
        <p>${await t('achievements.appIdInfo')}</p>
        <div class="game-info-container">
          <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg" alt="${gameData.name}" class="game-header">
          <div class="game-details">
            <h3>${gameData.name}</h3>
            <p>${unlockedAchievements}/${totalAchievements} conquistas</p>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Erro ao buscar informações do jogo:', error);
  }
}