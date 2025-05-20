import {
  apiKeyInput,
  appIdInput,
  appIdContainer,
  searchAchievementsInput,
  timestampTypeSelect,
  generateFileBtn,
  currentSectionTitle,
  sidebarNavLinks,
  loadingCard,
  errorCard,
  tryAgainBtn,
  successModal,
  loadDirectoryModal,
  directoryModal,
  cancelLoadBtn,
  confirmLoadBtn,
  cancelSaveBtn,
  confirmSaveBtn
} from './constants.js';

export async function t(key, params = {}) {
  return await window.api.getTranslation(key, params);
}

export async function applyTranslations() {
  try {
    // Log para depuração - chaves importantes de tradução da API
    await debugApiTranslationKeys();
    
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    if (sidebarLinks.length >= 3) {
      sidebarLinks[0].innerHTML = `<i class="fas fa-gamepad"></i> ${await t('sidebar.games')}`;
      sidebarLinks[1].innerHTML = `<i class="fas fa-search"></i> ${await t('sidebar.search')}`;
      sidebarLinks[2].innerHTML = `<i class="fas fa-trophy"></i> ${await t('sidebar.achievements')}`;
      sidebarLinks[3].innerHTML = `<i class="fas fa-cog"></i> ${await t('sidebar.settings')}`;
    }
    
    const achievementsTitle = document.querySelector('.app-id-achievements-card h2');
    if (achievementsTitle) {
      achievementsTitle.innerHTML = `<i class="fas fa-gamepad"></i> ${await t('achievements.title')}`;
    }
    
    if (appIdInput) {
      appIdInput.placeholder = await t('achievements.appIdPlaceholder');
    }
    
    if (appIdContainer) {
      appIdContainer.innerHTML = `<p>${await t('achievements.appIdInfo')}</p>`;
    }
    
    if (searchAchievementsInput) {
      searchAchievementsInput.placeholder = await t('achievements.searchPlaceholder');
    }
    
    const timestampLabel = document.querySelector('label[for="timestampType"]');
    if (timestampLabel) {
      timestampLabel.textContent = await t('achievements.timestamp');
    }
    
    if (timestampTypeSelect && timestampTypeSelect.options.length >= 3) {
      timestampTypeSelect.options[0].textContent = await t('achievements.timestampCurrent');
      timestampTypeSelect.options[1].textContent = await t('achievements.timestampCustom');
      timestampTypeSelect.options[2].textContent = await t('achievements.timestampRandom');
    }
    
    if (generateFileBtn) {
      generateFileBtn.innerHTML = `<i class="fas fa-file-export"></i> ${await t('achievements.generateFile')}`;
    }
    
    const settingsTitle = document.querySelector('#settingsSection h2');
    if (settingsTitle) {
      settingsTitle.innerHTML = `<i class="fas fa-cog"></i> ${await t('settings.title')}`;
    }
    
    const apiKeyLabel = document.querySelector('label[for="apiKey"]');
    if (apiKeyLabel) {
      apiKeyLabel.textContent = await t('settings.apiKeyLabel');
    }
    
    if (apiKeyInput) {
      apiKeyInput.placeholder = await t('settings.apiKeyPlaceholder');
    }
    
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    if (saveApiKeyBtn) {
      saveApiKeyBtn.innerHTML = `<i class="fas fa-save"></i> ${await t('settings.saveApiKey')}`;
    }
    
    const apiKeyInfo = document.querySelector('.setting-item:has(#apiKey) .setting-description');
    if (apiKeyInfo) {
      const apiKeyInfoText = await t('settings.apiKeyInfo');
      const currentLang = await window.api.getCurrentLanguage();
      const replaceWord = currentLang.startsWith('pt') ? 'aqui' : 'here';
      const apiKeyLink = `<a href="https://steamcommunity.com/dev/apikey" target="_blank">${replaceWord}</a>`;
      apiKeyInfo.innerHTML = apiKeyInfoText.replace(replaceWord, apiKeyLink);
    }
    
    // Traduzir elementos da seção de API Source
    const apiSourceLabel = document.querySelector('label[for="apiSource"]');
    if (apiSourceLabel) {
      apiSourceLabel.textContent = await t('apiSources.source');
    }
    
    const apiSourceSelect = document.getElementById('apiSource');
    if (apiSourceSelect && apiSourceSelect.options.length >= 2) {
      apiSourceSelect.options[0].textContent = await t('apiSources.hydra');
      apiSourceSelect.options[1].textContent = await t('apiSources.steamOfficial');
    }
    
    const saveApiSourceBtn = document.getElementById('saveApiSource');
    if (saveApiSourceBtn) {
      saveApiSourceBtn.innerHTML = `<i class="fas fa-save"></i> ${await t('apiSources.saveSource')}`;
    }
    
    const apiSourceInfo = document.querySelector('.setting-item:has(#apiSource) .setting-description');
    if (apiSourceInfo) {
      apiSourceInfo.textContent = await t('apiSources.selectDataSource');
    }
    
    // Steam ID
    const steamIdLabel = document.querySelector('label[for="steamId"]');
    if (steamIdLabel) {
      steamIdLabel.textContent = await t('apiSources.steamId');
    }
    
    const steamIdInput = document.getElementById('steamId');
    if (steamIdInput) {
      steamIdInput.placeholder = await t('apiSources.steamIdPlaceholder');
    }
    
    const saveSteamIdBtn = document.getElementById('saveSteamId');
    if (saveSteamIdBtn) {
      saveSteamIdBtn.innerHTML = `<i class="fas fa-save"></i> ${await t('settings.saveApiKey')}`;
    }
    
    const steamIdInfo = document.querySelector('.setting-item:has(#steamId) .setting-description');
    if (steamIdInfo) {
      const steamIdInfoText = await t('apiSources.steamIdInfo');
      const currentLang = await window.api.getCurrentLanguage();
      const replaceWord = currentLang.startsWith('pt') ? 'aqui' : 'here';
      const steamIdLink = `<a href="https://steamid.io" target="_blank">${replaceWord}</a>`;
      steamIdInfo.innerHTML = steamIdInfoText.replace(replaceWord, steamIdLink);
    }
    
    const languageLabel = document.querySelector('label[for="languageSelect"]');
    if (languageLabel) {
      languageLabel.textContent = await t('settings.languageLabel');
    }
    
    const languageInfo = document.querySelector('.setting-item:has(#languageSelect) .setting-description');
    if (languageInfo) {
      languageInfo.textContent = await t('settings.languageInfo');
    }
    
    // Traduzir elementos da aba de aparência 
    const liteModeLabel = document.querySelector('label[for="liteModeToggle"]');
    if (liteModeLabel) {
      liteModeLabel.textContent = await t('settings.liteModeLabel');
    }
    
    const liteModeInfo = document.querySelector('#tab-appearance .setting-description');
    if (liteModeInfo) {
      liteModeInfo.textContent = await t('settings.liteModeInfo');
    }
    
    const appearanceTitle = document.querySelector('.settings-group:nth-child(3) h3');
    if (appearanceTitle) {
      appearanceTitle.textContent = await t('settings.appearance');
    }
    
    const themeLabel = document.querySelector('label[for="themeSelect"]');
    if (themeLabel) {
      themeLabel.textContent = await t('settings.themeLabel');
    }
    
    const themeOptions = document.getElementById('themeSelect')?.options;
    if (themeOptions && themeOptions.length >= 2) {
      themeOptions[0].textContent = await t('settings.themeDark');
      themeOptions[1].textContent = await t('settings.themeLight');
    }
    
    const aboutTitle = document.querySelector('.settings-group:nth-child(5) h3');
    if (aboutTitle) {
      aboutTitle.textContent = await t('settings.about');
    }
    
    const aboutText = document.querySelectorAll('.settings-group:nth-child(5) p');
    if (aboutText.length >= 3) {
      aboutText[0].textContent = `${await t('app.title')} ${await t('app.version')}`;
      aboutText[1].textContent = await t('app.about');
      aboutText[2].textContent = await t('app.credits');
    }
    
    // Aplicar traduções para o diretório personalizado
    const customDirectoryTitle = document.querySelector('.custom-directory-title');
    if (customDirectoryTitle) {
      customDirectoryTitle.textContent = await t('directories.customDirectory');
    }

    const customDirectoryDesc = document.querySelector('.custom-directory-description');
    if (customDirectoryDesc) {
      customDirectoryDesc.textContent = await t('directories.customDirectoryDescription');
    }

    // Aplicar traduções para a área de pesquisa
    const searchInput = document.getElementById('searchGameInput');
    if (searchInput) {
      searchInput.placeholder = await t('search.placeholder');
    }
    
    const searchDescription = document.querySelector('.search-info p');
    if (searchDescription) {
      searchDescription.textContent = await t('search.description');
    }
    
    const searchLoadingText = document.querySelector('#searchLoadingCard p');
    if (searchLoadingText) {
      searchLoadingText.textContent = await t('search.loading');
    }
    
    const searchErrorTitle = document.querySelector('#searchErrorCard h3');
    if (searchErrorTitle) {
      searchErrorTitle.textContent = await t('error.title');
    }
    
    const searchTryAgainBtn = document.getElementById('searchTryAgain');
    if (searchTryAgainBtn) {
      searchTryAgainBtn.textContent = await t('search.tryAgain');
    }
    
    await updateCurrentSectionTitle();
    
    const loadingText = document.querySelector('#loadingCard p');
    if (loadingText) {
      loadingText.textContent = await t('loading.achievements');
    }
    
    const errorTitle = document.querySelector('#errorCard h3');
    if (errorTitle) {
      errorTitle.textContent = await t('error.title');
    }
    
    if (tryAgainBtn) {
      tryAgainBtn.textContent = await t('error.tryAgain');
    }
    
    const successTitle = document.querySelector('#successModal .modal-header h3');
    if (successTitle) {
      successTitle.innerHTML = `<i class="fas fa-check-circle"></i> ${await t('success.title')}`;
    }
    
    const okButton = document.querySelector('#successModal .modal-footer button');
    if (okButton) {
      okButton.textContent = await t('success.ok');
    }
    
    // Traduzir elementos do modal de seleção de diretório para salvar
    const dirModalTitle = document.querySelector('#directoryModal .modal-header h3');
    if (dirModalTitle) {
      dirModalTitle.innerHTML = `<i class="fas fa-folder-open"></i> ${await t('directories.selectTitle')}`;
    }

    // Traduzir botão de seleção de diretório personalizado
    const selectCustomDirBtn = document.querySelector('.select-custom-dir-btn');
    if (selectCustomDirBtn) {
      selectCustomDirBtn.textContent = await t('directories.selectCustom');
    }
    
    const dirModalMsg = document.querySelector('#directoryModal .modal-body > p');
    if (dirModalMsg) {
      dirModalMsg.textContent = await t('directories.selectMessage');
    }

    // Traduzir opções de formato
    const formatTitle = document.querySelector('.format-selection h4');
    if (formatTitle) {
      formatTitle.textContent = await t('formats.title');
    }

    const iniButton = document.querySelector('.format-button[data-format="ini"] span');
    const iniDescription = document.querySelector('.format-button[data-format="ini"] small');
    if (iniButton) {
      iniButton.textContent = await t('formats.ini');
    }
    if (iniDescription) {
      iniDescription.textContent = await t('formats.iniDescription');
    }

    const jsonButton = document.querySelector('.format-button[data-format="json"] span');
    const jsonDescription = document.querySelector('.format-button[data-format="json"] small');
    if (jsonButton) {
      jsonButton.textContent = await t('formats.json');
    }
    if (jsonDescription) {
      jsonDescription.textContent = await t('formats.jsonDescription');
    }
    
    if (cancelSaveBtn) {
      cancelSaveBtn.textContent = await t('directories.cancel');
    }
    
    if (confirmSaveBtn) {
      confirmSaveBtn.textContent = await t('directories.save');
    }
    
    // Traduzir elementos do modal de seleção de diretório para carregar
    const loadModalTitle = document.querySelector('#loadDirectoryModal .modal-header h3');
    if (loadModalTitle) {
      loadModalTitle.innerHTML = `<i class="fas fa-folder-open"></i> ${await t('loadModal.title')}`;
    }
    
    const loadModalMsg = document.querySelector('#loadDirectoryModal .modal-body > p');
    if (loadModalMsg) {
      loadModalMsg.textContent = await t('loadModal.message');
    }
    
    if (cancelLoadBtn) {
      cancelLoadBtn.textContent = await t('loadModal.cancel');
    }
    
    if (confirmLoadBtn) {
      confirmLoadBtn.textContent = await t('loadModal.load');
    }

    // Traduzir elementos da aba de atualizações
    const updatesTitle = document.querySelector('#tab-updates h3');
    if (updatesTitle) {
      updatesTitle.textContent = await t('settings.updates.title');
    }

    const currentVersionText = document.querySelector('#tab-updates .version-item span[data-i18n="settings.updates.currentVersion"]');
    if (currentVersionText) {
      currentVersionText.textContent = await t('settings.updates.currentVersion');
    }

    const latestVersionText = document.querySelector('#tab-updates .version-item span[data-i18n="settings.updates.latestVersion"]');
    if (latestVersionText) {
      latestVersionText.textContent = await t('settings.updates.latestVersion');
    }

    const checkUpdateBtn = document.querySelector('#checkUpdateBtn span[data-i18n="settings.updates.checkUpdates"]');
    if (checkUpdateBtn) {
      checkUpdateBtn.textContent = await t('settings.updates.checkUpdates');
    }

    const downloadUpdateBtn = document.querySelector('#downloadUpdateBtn span[data-i18n="settings.updates.downloadUpdate"]');
    if (downloadUpdateBtn) {
      downloadUpdateBtn.textContent = await t('settings.updates.downloadUpdate');
    }
    
    // Add translation for toggle selection button
    const toggleSelectionBtn = document.getElementById('toggleSelection');
    if (toggleSelectionBtn) {
      toggleSelectionBtn.innerHTML = `<i class="fa-solid fa-square"></i> ${await t('achievements.toggleSelect.select')}`;
    }
    
    // Add translations for export progress modal
    const progressModalTitle = document.querySelector('#progressModal .modal-header h3');
    if (progressModalTitle) {
      progressModalTitle.innerHTML = `<i class="fas fa-sync fa-spin"></i> ${await t('achievements.exporting')}`;
    }
    
    console.log('Traduções aplicadas com sucesso');
  } catch (error) {
    console.error('Erro ao aplicar traduções:', error);
  }
}

export async function updateCurrentSectionTitle() {
  const activeLink = document.querySelector('.sidebar-nav li.active a');
  if (activeLink && currentSectionTitle) {
    const section = activeLink.getAttribute('href')?.substring(1);
    let titleKey = '';
    
    switch (section) {
      case 'games':
        titleKey = 'sidebar.games';
        break;
      case 'search':
        titleKey = 'sidebar.search';
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

// Função auxiliar para debug das traduções
async function debugApiTranslationKeys() {
  console.log('Debugging API translation keys:');
  console.log('apiSources.source:', await t('apiSources.source'));
  console.log('apiSources.hydra:', await t('apiSources.hydra'));
  console.log('apiSources.steamOfficial:', await t('apiSources.steamOfficial'));
  console.log('apiSources.selectDataSource:', await t('apiSources.selectDataSource'));
  console.log('settings.saveApiKey:', await t('settings.saveApiKey'));
  console.log('apiSources.saveSource:', await t('apiSources.saveSource'));
  console.log('apiSources.steamId:', await t('apiSources.steamId'));
  console.log('apiSources.steamIdInfo:', await t('apiSources.steamIdInfo'));
}