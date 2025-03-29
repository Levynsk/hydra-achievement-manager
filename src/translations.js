import {
  apiKeyInput,
  appIdInput,
  appIdContainer,
  searchAchievementsInput,
  selectAllBtn,
  deselectAllBtn,
  timestampTypeSelect,
  generateFileBtn,
  currentSectionTitle,
  sidebarNavLinks,
  loadingCard,
  errorCard,
  tryAgainBtn,
  successModal
} from './constants.js';

export async function t(key, params = {}) {
  return await window.api.getTranslation(key, params);
}

export async function applyTranslations() {
  try {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    if (sidebarLinks.length >= 3) {
      sidebarLinks[0].innerHTML = `<i class="fas fa-gamepad"></i> ${await t('sidebar.games')}`;
      sidebarLinks[1].innerHTML = `<i class="fas fa-trophy"></i> ${await t('sidebar.achievements')}`;
      sidebarLinks[2].innerHTML = `<i class="fas fa-cog"></i> ${await t('sidebar.settings')}`;
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
    
    if (selectAllBtn) {
      selectAllBtn.innerHTML = `<i class="fas fa-check-square"></i> ${await t('achievements.selectAll')}`;
    }
    
    if (deselectAllBtn) {
      deselectAllBtn.innerHTML = `<i class="fas fa-square"></i> ${await t('achievements.deselectAll')}`;
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
      apiKeyInfo.innerHTML = await t('settings.apiKeyInfo');
    }
    
    const languageLabel = document.querySelector('label[for="languageSelect"]');
    if (languageLabel) {
      languageLabel.textContent = await t('settings.languageLabel');
    }
    
    const languageInfo = document.querySelector('.setting-item:has(#languageSelect) .setting-description');
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
    
    const themeOptions = document.getElementById('themeSelect')?.options;
    if (themeOptions && themeOptions.length >= 2) {
      themeOptions[0].textContent = await t('settings.themeDark');
      themeOptions[1].textContent = await t('settings.themeLight');
    }
    
    const outputDirTitle = document.querySelector('.settings-group:nth-child(4) h3');
    if (outputDirTitle) {
      outputDirTitle.textContent = await t('settings.outputDir');
    }
    
    const outputDirLabel = document.querySelector('label[for="outputPath"]');
    if (outputDirLabel) {
      outputDirLabel.textContent = await t('settings.outputDirLabel');
    }
    
    const outputPathInput = document.getElementById('outputPath');
    if (outputPathInput) {
      outputPathInput.placeholder = await t('settings.outputDirPlaceholder');
    }
    
    const outputDirInfo = document.querySelector('.setting-item:has(#outputPath) .setting-description');
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
      aboutText[0].textContent = `${await t('app.title')} ${await t('app.version')}`;
      aboutText[1].textContent = await t('app.about');
      aboutText[2].textContent = await t('app.credits');
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