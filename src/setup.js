import { getConfig, saveConfig } from './config.js';
import { t } from './translations.js';

let loadingProgress = 0;
const totalSteps = 5;

// Initialize loading screen
export async function initLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const progressBar = document.getElementById('loadingProgress');
    
    // Reset progress
    loadingProgress = 0;
    updateLoadingProgress(0);

    // Show loading screen
    loadingScreen.style.display = 'flex';

    // Garantir carregamento mínimo de 5 segundos
    const startTime = Date.now();

    // Simulate loading steps
    await updateLoadingProgress(20, await t('loading.resources'));
    await updateLoadingProgress(40, await t('loading.settings'));
    await updateLoadingProgress(60, await t('loading.translations'));
    await updateLoadingProgress(80, await t('loading.updates'));
    await updateLoadingProgress(100, await t('loading.complete'));

    const elapsed = Date.now() - startTime;
    if (elapsed < 5000) {
        await new Promise(resolve => setTimeout(resolve, 5000 - elapsed));
    }

    // Agora só verifica setupComplete
    const isFirstTime = !(await getConfig('setupComplete'));
    if (isFirstTime) {
        await showSetupWizard();
    } else {
        hideLoadingScreen();
    }
}

// Update loading progress
async function updateLoadingProgress(progress, message = '') {
    const progressBar = document.getElementById('loadingProgress');
    progressBar.style.width = `${progress}%`;
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
}

// Hide loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        loadingScreen.style.opacity = '1';
    }, 300);
}

// Show setup wizard
async function showSetupWizard() {
    const setupWizard = document.getElementById('setupWizard');
    const languageSelect = document.getElementById('setupLanguageSelect');
    const themeSelect = document.getElementById('setupThemeSelect');
    const apiSourceSelect = document.getElementById('setupApiSourceSelect');
    const wizardApiKeyContainer = document.getElementById('wizardApiKeyContainer');
    const wizardApiKey = document.getElementById('wizardApiKey');
    const wizardFinishBtn = document.getElementById('wizardFinishBtn');
    const wizardToggleApiKey = document.getElementById('wizardToggleApiKey');

    // Hide loading screen
    hideLoadingScreen();
    
    // Obter idioma atual
    const currentLang = await window.api.getCurrentLanguage();
    
    // Populate language select
    const languages = await window.api.getAvailableLanguages();
    languageSelect.innerHTML = '';
    Object.values(languages).forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.name;
        if (lang.code === currentLang) {
            option.selected = true;
        }
        languageSelect.appendChild(option);
    });

    // Função para atualizar os temas
    async function updateThemeOptions() {
        const darkOption = themeSelect.querySelector('option[value="dark"]');
        const lightOption = themeSelect.querySelector('option[value="light"]');
        
        if (darkOption) darkOption.textContent = await t('settings.themeDark');
        if (lightOption) lightOption.textContent = await t('settings.themeLight');
    }

    // Atualizar textos do wizard conforme idioma
    async function updateWizardTexts() {
        // Step 1
        document.querySelector('#setupStep1 h2').textContent = await t('setup.welcome.title');
        document.querySelector('#setupStep1 p').textContent = await t('setup.welcome.description');
        document.querySelector('#setupStep1 .btn-primary').textContent = await t('setup.buttons.next');
        // Step 2
        document.querySelector('#setupStep2 h2').textContent = await t('setup.theme.title');
        document.querySelector('#setupStep2 p').textContent = await t('setup.theme.description');
        document.querySelector('#setupStep2 .btn').textContent = await t('setup.buttons.back');
        document.querySelector('#setupStep2 .btn-primary').textContent = await t('setup.buttons.next');
        // Step 3
        document.querySelector('#setupStep3 h2').textContent = await t('setup.lite.title');
        document.querySelector('#setupStep3 p').textContent = await t('setup.lite.description');
        // Atualizar apenas o span de texto do toggle
        const liteModeDesc = document.getElementById('liteModeDesc');
        if (liteModeDesc) {
            liteModeDesc.textContent = await t('setup.lite.toggle');
        }
        document.querySelector('#setupStep3 .btn').textContent = await t('setup.buttons.back');
        document.querySelector('#setupStep3 .btn-primary').textContent = await t('setup.buttons.next');
        // Step 4
        document.querySelector('#setupStep4 h2').textContent = await t('setup.api.title');
        document.querySelector('#setupStep4 p').textContent = await t('setup.api.description');
        document.querySelector('#setupStep4 .btn').textContent = await t('setup.buttons.back');
        document.querySelector('#setupStep4 .btn-primary').textContent = await t('setup.buttons.finish');

        // Atualizar campo de chave da API Steam do wizard
        const wizardApiKeyLabel = document.querySelector('#wizardApiKeyContainer label[for="wizardApiKey"]');
        if (wizardApiKeyLabel) wizardApiKeyLabel.textContent = await t('settings.apiKeyLabel');
        const wizardApiKeyInput = document.getElementById('wizardApiKey');
        if (wizardApiKeyInput) wizardApiKeyInput.placeholder = await t('settings.apiKeyPlaceholder');
        const wizardApiKeyInfo = document.querySelector('#wizardApiKeyContainer .setting-description');
        if (wizardApiKeyInfo) {
            const apiKeyInfoText = await t('settings.apiKeyInfo');
            const currentLang = await window.api.getCurrentLanguage();
            const replaceWord = currentLang.startsWith('pt') ? 'aqui' : 'here';
            const apiKeyLink = `<a href=\"https://steamcommunity.com/dev/apikey\" target=\"_blank\">${replaceWord}</a>`;
            wizardApiKeyInfo.innerHTML = apiKeyInfoText.replace(replaceWord, apiKeyLink);
        }

        // Atualizar opções de tema
        await updateThemeOptions();
    }

    // Atualizar textos ao trocar idioma
    languageSelect.addEventListener('change', async (e) => {
        await window.api.setLanguage(e.target.value);
        setTimeout(updateWizardTexts, 100);
    });

    // Atualizar textos iniciais
    await updateWizardTexts();

    // Mostrar/ocultar campo da chave conforme seleção
    function updateApiKeyVisibility() {
        if (apiSourceSelect.value === 'steam') {
            wizardApiKeyContainer.style.display = '';
            validateWizardApiKey();
        } else {
            wizardApiKeyContainer.style.display = 'none';
            wizardFinishBtn.disabled = false;
        }
    }

    // Bloquear botão se campo vazio
    function validateWizardApiKey() {
        if (apiSourceSelect.value === 'steam' && !wizardApiKey.value.trim()) {
            wizardFinishBtn.disabled = true;
        } else {
            wizardFinishBtn.disabled = false;
        }
    }

    apiSourceSelect.addEventListener('change', updateApiKeyVisibility);
    wizardApiKey.addEventListener('input', validateWizardApiKey);
    if (wizardToggleApiKey) {
        wizardToggleApiKey.addEventListener('click', () => {
            if (wizardApiKey.type === 'password') {
                wizardApiKey.type = 'text';
                wizardToggleApiKey.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            } else {
                wizardApiKey.type = 'password';
                wizardToggleApiKey.innerHTML = '<i class="fa-solid fa-eye"></i>';
            }
        });
    }
    // Inicializar visibilidade
    updateApiKeyVisibility();

    // Show setup wizard
    setupWizard.classList.add('active');
}

// Handle setup wizard navigation
export function nextStep(currentStep) {
    const currentStepEl = document.getElementById(`setupStep${currentStep}`);
    const nextStepEl = document.getElementById(`setupStep${currentStep + 1}`);
    
    if (currentStepEl && nextStepEl) {
        currentStepEl.classList.remove('active');
        nextStepEl.classList.add('active');
    }
}

export function prevStep(currentStep) {
    const currentStepEl = document.getElementById(`setupStep${currentStep}`);
    const prevStepEl = document.getElementById(`setupStep${currentStep - 1}`);
    
    if (currentStepEl && prevStepEl) {
        currentStepEl.classList.remove('active');
        prevStepEl.classList.add('active');
    }
}

// Finish setup and save settings
export async function finishSetup() {
    const language = document.getElementById('setupLanguageSelect').value;
    const theme = document.getElementById('setupThemeSelect').value;
    const apiSource = document.getElementById('setupApiSourceSelect').value;
    const liteMode = document.getElementById('setupLiteModeToggle').checked;
    const wizardApiKey = document.getElementById('wizardApiKey');

    // Se for Steam e não tiver chave, não avança
    if (apiSource === 'steam' && (!wizardApiKey || !wizardApiKey.value.trim())) {
        wizardApiKey.focus();
        return;
    }
    if (apiSource === 'steam') {
        await saveConfig('apiKey', wizardApiKey.value.trim());
    }

    // Save settings
    await saveConfig('language', language);
    await saveConfig('theme', theme);
    await saveConfig('apiSource', apiSource);
    await saveConfig('liteMode', liteMode);
    await saveConfig('setupComplete', true);

    // Aplicar Lite Mode imediatamente
    if (liteMode) {
        document.body.classList.add('lite-mode');
    } else {
        document.body.classList.remove('lite-mode');
    }
    
    // Hide setup wizard
    const setupWizard = document.getElementById('setupWizard');
    setupWizard.classList.remove('active');

    // Reiniciar o app para aplicar as configurações
    if (window.api && window.api.restartApp) {
        window.api.restartApp();
    } else {
        window.location.reload();
    }
}

// Listen for setup wizard buttons
window.nextStep = nextStep;
window.prevStep = prevStep;
window.finishSetup = finishSetup;