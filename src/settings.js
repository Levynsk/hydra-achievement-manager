import { apiKeyInput, currentLanguage, setCurrentLanguage, saveApiKeyBtn, toggleApiKeyBtn, apiSourceSelect, setSelectedApiSource } from './constants.js';
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

export async function saveApiSource() {
  const apiSource = apiSourceSelect.value;
  const result = await window.api.saveConfig('apiSource', apiSource);
  
  if (result.success) {
    setSelectedApiSource(apiSource);
    
    const saveApiSourceBtn = document.getElementById('saveApiSource');
    const savedText = await t('settings.saved');
    saveApiSourceBtn.innerHTML = `<i class="fas fa-check"></i> ${savedText}`;
    setTimeout(async () => {
      saveApiSourceBtn.innerHTML = `<i class="fas fa-save"></i> ${await t('apiSources.saveSource')}`;
    }, 2000);
    
    // Atualizar a visibilidade do campo de API Key quando a fonte é alterada
    const apiKeySettingItem = document.querySelector('.setting-item:has(#apiKey)');
    if (apiKeySettingItem) {
      if (apiSource === 'hydra') {
        // Ocultar o campo da API Key quando a Hydra for selecionada
        apiKeySettingItem.style.display = 'none';
      } else {
        // Mostrar o campo da API Key quando a Steam for selecionada
        apiKeySettingItem.style.display = '';
      }
    }
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

export async function setupSettingsTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Traduzir os textos dos botões das abas
  for (const button of tabButtons) {
    const tabId = button.getAttribute('data-tab');
    if (tabId === 'tab-api') {
      button.textContent = await t('settings.tabs.api');
    } else if (tabId === 'tab-language') {
      button.textContent = await t('settings.tabs.language');
    } else if (tabId === 'tab-appearance') {
      button.textContent = await t('settings.tabs.appearance');
    } else if (tabId === 'tab-updates') {
      button.innerHTML = `<i class="fas fa-sync"></i> ${await t('settings.tabs.updates')}`;
    } else if (tabId === 'tab-about') {
      button.textContent = await t('settings.tabs.about');
    }
  }
  
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
  if (successModal) successModal.classList.remove('hidden');
}

export async function toggleLiteMode() {
  const liteModeToggle = document.getElementById('liteModeToggle');
  if (!liteModeToggle) return;
  
  const isLiteModeEnabled = liteModeToggle.checked;
  
  // Salvar configuração
  const result = await window.api.saveConfig('liteMode', isLiteModeEnabled);
  
  if (result.success) {
    // Aplicar Lite Mode imediatamente
    if (isLiteModeEnabled) {
      document.body.classList.add('lite-mode');
    } else {
      document.body.classList.remove('lite-mode');
    }
  }
}

// Função para mostrar notificação
export function showNotification(title, message, icon = 'info-circle', duration = 5000) {
  // Remove notificação existente se houver
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Criar nova notificação
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
  `;

  // Adicionar ao body
  document.body.appendChild(notification);

  // Adicionar evento de clique para fechar
  notification.addEventListener('click', () => {
    notification.classList.add('closing');
    setTimeout(() => notification.remove(), 300);
  });

  // Auto-fechar após duração especificada
  if (duration) {
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.add('closing');
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }
}

// Função para verificar atualizações
export async function checkForUpdates(showNotificationIfNoUpdate = true) {
  const checkUpdateBtn = document.getElementById('checkUpdateBtn');
  const downloadUpdateBtn = document.getElementById('downloadUpdateBtn');
  const newVersionContainer = document.getElementById('new-version-container');
  const currentVersionEl = document.getElementById('current-version');
  const newVersionEl = document.getElementById('new-version');
  const changelogEl = document.getElementById('changelog');

  try {
    // Alterar texto do botão para indicar que está verificando
    checkUpdateBtn.innerHTML = `<i class="fas fa-sync fa-spin"></i> ${await t('settings.updates.checkUpdates')}`;
    
    const updateInfo = await window.electron.getUpdateInfo();
    
    if (!updateInfo) {
      throw new Error('Não foi possível obter informações da atualização');
    }

    // Atualizar elementos da UI
    currentVersionEl.textContent = updateInfo.currentVersion;

    if (updateInfo.remoteVersion > updateInfo.currentVersion) {
      // Mostrar nova versão e botão de download
      newVersionContainer.style.display = 'flex';
      newVersionEl.textContent = updateInfo.remoteVersion;
      downloadUpdateBtn.style.display = 'inline-flex';
      
      // Mostrar notificação
      showNotification(
        await t('settings.updates.newVersionAvailable'),
        await t('settings.updates.newVersionMessage', { version: updateInfo.remoteVersion }),
        'arrow-circle-up'
      );
    } else if (showNotificationIfNoUpdate) {
      showNotification(
        await t('settings.updates.upToDate'),
        await t('settings.updates.upToDateMessage'),
        'check-circle',
        3000
      );
    }

    // Mostrar todo o histórico de atualizações em ordem decrescente
    if (updateInfo.allUpdates && Array.isArray(updateInfo.allUpdates)) {
      const changelogContent = updateInfo.allUpdates
        .slice()
        .reverse()
        .map(update => `
          <div class="update-entry">
            <h4>Versão ${update.version}</h4>
            <ul>
              ${update.changelog.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        `)
        .join('<hr>');

      changelogEl.innerHTML = changelogContent;
    }
  } catch (error) {
    console.error('Erro ao verificar atualizações:', error);
    showNotification(
      await t('error.title'),
      await t('settings.updates.error'),
      'exclamation-circle'
    );
  } finally {
    // Restaurar texto do botão
    checkUpdateBtn.innerHTML = `<i class="fas fa-sync"></i> ${await t('settings.updates.checkUpdates')}`;
  }
}

export async function initSettings() {
  // Carregar API Key salva
  const savedApiKey = await window.api.getApiKey();
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
    apiKeyInput.type = 'password';
  }
  
  // Carregar configuração da fonte da API
  const savedApiSource = await window.api.getConfig('apiSource');
  if (savedApiSource && apiSourceSelect) {
    apiSourceSelect.value = savedApiSource;
    setSelectedApiSource(savedApiSource);
    
    // Atualizar a visibilidade do campo da API Key com base na fonte selecionada
    const apiKeySettingItem = document.querySelector('.setting-item:has(#apiKey)');
    if (apiKeySettingItem) {
      if (savedApiSource === 'hydra') {
        // Ocultar o campo da API Key quando a Hydra for selecionada
        apiKeySettingItem.style.display = 'none';
      } else {
        // Mostrar o campo da API Key quando a Steam for selecionada
        apiKeySettingItem.style.display = '';
      }
    }
  }
  
  // Carregar configuração do Lite Mode
  const liteModeToggle = document.getElementById('liteModeToggle');
  if (liteModeToggle) {
    const isLiteModeEnabled = await window.api.getConfig('liteMode');
    liteModeToggle.checked = isLiteModeEnabled;
    
    // Aplicar Lite Mode se estiver ativado
    if (isLiteModeEnabled) {
      document.body.classList.add('lite-mode');
    }
    
    // Adicionar evento para alternar o Lite Mode
    liteModeToggle.addEventListener('change', toggleLiteMode);
  }
  
  // Configurar as abas de configurações
  await setupSettingsTabs();
  
  // Esconder o campo Steam ID na interface 
  const steamIdContainer = document.querySelector('.setting-item:has(#steamId)');
  if (steamIdContainer) {
    steamIdContainer.style.display = 'none';
  }

  // Configurar eventos da aba de atualizações
  const checkUpdateBtn = document.getElementById('checkUpdateBtn');
  const downloadUpdateBtn = document.getElementById('downloadUpdateBtn');

  if (checkUpdateBtn) {
    checkUpdateBtn.addEventListener('click', () => checkForUpdates());
  }

  if (downloadUpdateBtn) {
    downloadUpdateBtn.addEventListener('click', async () => {
      const updateInfo = await window.electron.getUpdateInfo();
      if (updateInfo?.downloadUrl) {
        await window.electron.openExternalLink(updateInfo.downloadUrl);
      }
    });
  }

  // Verificar atualizações ao iniciar (sem notificação se não houver atualização)
  await checkForUpdates(false);
}