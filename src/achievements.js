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
  appIdInput,
  directoryModal,
  directoryList,
  cancelSaveBtn,
  confirmSaveBtn
} from './constants.js';
import { t } from './translations.js';
import { showError, showSuccess } from './settings.js';

// Inicializar variável global para armazenar diretórios existentes
window.existingDirs = [];

// Variáveis locais que serão modificadas
let achievements = [];
let userAchievements = [];
let currentAppId = '';
let outputDirectories = [];
let selectedDirectoryPath = null; // Nova variável local para armazenar o diretório selecionado

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
  // Ajustar para o fuso horário local
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return localDate.toISOString().slice(0, 16);
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
    const achievementItem = checkbox.closest('.achievement-item');
    if (achievementItem) {
      achievementItem.classList.remove('achieved');
    }
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
    const appId = appIdInput.value.trim();
    if (!appId) {
      await showError(await t('errors.invalidAppId'));
      return;
    }

    currentAppId = appId;
    
    // Abrir diretamente o modal - a busca de diretórios e verificação de arquivos
    // já é feita dentro do openDirectoryModal
    await openDirectoryModal();
  } catch (error) {
    await showError(error.message);
  }
}

// Função para buscar diretórios de saída salvos nas configurações
async function fetchOutputDirectories() {
  try {
    console.log('Buscando diretórios de saída...');
    const result = await window.api.getOutputDirectories();
    console.log('Resultado da busca de diretórios:', result);
    
    if (result.success) {
      outputDirectories = result.directories || [];
      console.log('Diretórios encontrados:', outputDirectories);
    } else {
      console.error('Erro ao buscar diretórios:', result.message);
      outputDirectories = [];
    }
    return outputDirectories;
  } catch (error) {
    console.error('Erro ao buscar diretórios de saída:', error);
    return [];
  }
}

// Função para verificar em quais diretórios o jogo já existe
async function checkExistingGameFiles(appId) {
  // Criar array local para armazenar os diretórios com arquivos existentes
  let existingDirs = [];
  
  if (outputDirectories.length === 0) {
    return;
  }
  
  try {
    const result = await window.api.checkGameFiles(appId, outputDirectories);
    if (result.success) {
      existingDirs = result.existingDirectories || [];
      
      // Atualizar a referência para existingDirectories no escopo global do módulo
      // Isso evita tentar atribuir diretamente à variável importada
      window.existingDirs = existingDirs;
    }
  } catch (error) {
    console.error('Erro ao verificar arquivos existentes:', error);
  }
}

// Abrir o modal de seleção de diretório
async function openDirectoryModal() {
  // Limpar seleção de diretório anterior
  selectedDirectoryPath = null;
  
  // Buscar diretórios novamente sempre que o modal for aberto
  console.log('Abrindo modal de seleção de diretório...');
  await fetchOutputDirectories();
  console.log('Diretórios carregados para o modal:', outputDirectories);
  
  // Verificar em quais diretórios o jogo já existe
  await checkExistingGameFiles(currentAppId);
  console.log('Diretórios onde o jogo existe:', window.existingDirs);
  
  // Forçar a leitura fresca da lista de diretórios do store
  // antes de renderizar a lista no modal
  await forcedDirectoryUpdate();
  
  renderDirectoryList();
  directoryModal.classList.remove('hidden');
  
  // Adicionar eventos aos botões do modal
  cancelSaveBtn.addEventListener('click', closeDirectoryModal);
  confirmSaveBtn.addEventListener('click', saveAchievementsToSelectedDirectory);
  
  // Adicionar evento para fechar o modal ao clicar no X
  const closeButtons = directoryModal.querySelectorAll('.close-modal');
  closeButtons.forEach(btn => btn.addEventListener('click', closeDirectoryModal));
}

// Função para forçar uma atualização da lista de diretórios
async function forcedDirectoryUpdate() {
  try {
    console.log('Forçando atualização da lista de diretórios...');
    // Buscar diretamente da configuração mais recente
    const config = await window.api.getConfig();
    console.log('Configuração obtida:', config);
    
    if (config && config.outputPaths && Array.isArray(config.outputPaths)) {
      outputDirectories = config.outputPaths;
      console.log('Diretórios atualizados forçadamente:', outputDirectories);
    } else {
      console.warn('Não foi possível encontrar outputPaths na configuração');
    }
  } catch (error) {
    console.error('Erro ao forçar atualização dos diretórios:', error);
  }
}

// Fechar o modal de seleção de diretório
function closeDirectoryModal(preserveSelection = false) {
  directoryModal.classList.add('hidden');
  
  // Remover os eventos para evitar múltiplos listeners
  cancelSaveBtn.removeEventListener('click', closeDirectoryModal);
  confirmSaveBtn.removeEventListener('click', saveAchievementsToSelectedDirectory);
  
  const closeButtons = directoryModal.querySelectorAll('.close-modal');
  closeButtons.forEach(btn => btn.removeEventListener('click', closeDirectoryModal));
  
  // Limpar a seleção de diretório apenas se não for para preservá-la
  if (!preserveSelection) {
    selectedDirectoryPath = null;
  }
}

// Renderizar lista de diretórios no modal
function renderDirectoryList() {
  directoryList.innerHTML = '';
  
  if (outputDirectories.length === 0) {
    directoryList.innerHTML = `<p class="no-directories">Nenhum diretório configurado. Configure diretórios na seção de Configurações.</p>`;
    confirmSaveBtn.disabled = true;
    return;
  }
  
  // Criar um elemento para cada diretório
  outputDirectories.forEach((dir, index) => {
    const existingDirs = window.existingDirs || [];
    const isExisting = existingDirs.includes(dir);
    const directoryOption = document.createElement('div');
    directoryOption.className = 'directory-option';
    directoryOption.dataset.index = index;
    directoryOption.dataset.path = dir;
    
    const icon = isExisting ? 'fa-folder-open' : 'fa-folder';
    const tooltip = isExisting ? 'Este jogo já existe neste diretório' : '';
    
    directoryOption.innerHTML = `
      <i class="fas ${icon}"></i>
      <span class="directory-option-name" title="${dir}">${dir}</span>
      ${isExisting ? '<i class="fas fa-check" style="color: var(--accent-success);"></i>' : ''}
    `;
    
    directoryOption.addEventListener('click', () => {
      selectDirectory(directoryOption);
    });
    
    directoryList.appendChild(directoryOption);
  });
  
  // Desabilitar botão de confirmar até que um diretório seja selecionado
  confirmSaveBtn.disabled = true;
}

// Selecionar um diretório da lista
function selectDirectory(directoryOption) {
  // Remover seleção anterior
  const selectedOptions = directoryList.querySelectorAll('.directory-option.selected');
  selectedOptions.forEach(opt => opt.classList.remove('selected'));
  
  // Selecionar o novo diretório
  directoryOption.classList.add('selected');
  
  // Salvar o diretório selecionado
  selectedDirectoryPath = directoryOption.dataset.path;
  console.log('Diretório selecionado:', selectedDirectoryPath);
  
  // Habilitar botão de confirmar
  confirmSaveBtn.disabled = false;
}

// Salvar as conquistas no diretório selecionado
async function saveAchievementsToSelectedDirectory() {
  try {
    const appId = currentAppId;
    if (!appId) {
      throw new Error('ID do aplicativo não encontrado.');
    }
    
    if (!selectedDirectoryPath) {
      throw new Error('Nenhum diretório selecionado.');
    }
    
    console.log('Salvando no diretório:', selectedDirectoryPath);
    
    // Se não houver conquistas selecionadas, criamos um array vazio para limpar o arquivo INI
    const achievementsData = [];
    
    // Só processar conquistas se houver alguma selecionada
    if (selectedAchievements.size > 0) {
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
              // Timestamp atual ajustado para o fuso horário local
              const currentDate = new Date();
              unlockTime = Math.floor(currentDate.getTime() / 1000);
          }
        }

        achievementsData.push({
          id: achievementId,
          unlockTime
        });
      }
    }

    // Guardar o diretório selecionado antes de fechar o modal
    const dirToSave = selectedDirectoryPath;
    
    // Fechar o modal antes de salvar para melhorar a experiência do usuário
    closeDirectoryModal(true);
    
    // Chamar a API para salvar o arquivo no diretório específico
    const result = await window.api.writeAchievements(appId, achievementsData, dirToSave);
    
    if (result.success) {
      const successMessage = document.getElementById('successMessage');
      const successModal = document.getElementById('successModal');
      if (successMessage && successModal) {
        successMessage.textContent = `${result.message} em ${dirToSave}`;
        
        // Garante que o modal seja exibido sempre
        successModal.classList.remove('hidden');
      }
    } else {
      throw new Error(result.message || await t('errors.writeError'));
    }
  } catch (error) {
    await showError(error.message);
  }
}

export function updateGenerateButtonState() {
  // Remover a desabilitação do botão baseada na quantidade de conquistas selecionadas
  // O botão deve estar sempre habilitado para permitir a geração do INI
  generateFileBtn.disabled = false;
  generateFileBtn.classList.remove('btn-disabled');
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