// Elementos da interface
export const apiKeyInput = document.getElementById('apiKey');
export const saveApiKeyBtn = document.getElementById('saveApiKey');
export const toggleApiKeyBtn = document.getElementById('toggleApiKey');
export const appIdInput = document.getElementById('appId');
export const fetchAchievementsBtn = document.getElementById('fetchAchievements');
export const achievementsCard = document.getElementById('achievementsCard');
export const loadingCard = document.getElementById('loadingCard');
export const errorCard = document.getElementById('errorCard');
export const errorMessage = document.getElementById('errorMessage');
export const tryAgainBtn = document.getElementById('tryAgain');
export const achievementsList = document.getElementById('achievementsList');
export const selectAllBtn = document.getElementById('selectAll');
export const deselectAllBtn = document.getElementById('deselectAll');
export const timestampTypeSelect = document.getElementById('timestampType');
export const customTimestampInput = document.getElementById('customTimestamp');
export const generateFileBtn = document.getElementById('generateFile');
export const successModal = document.getElementById('successModal');
export const successMessage = document.getElementById('successMessage');
export const closeModalBtns = document.querySelectorAll('.close-modal');
export const appContainer = document.querySelector('.app-container');
export const currentSectionTitle = document.getElementById('currentSection');
export const sidebarNavLinks = document.querySelectorAll('.sidebar-nav a');
export const searchAchievementsInput = document.getElementById('searchAchievements');
export const appIdContainer = document.querySelector('.app-id-info');
export const minimizeBtn = document.getElementById('minimizeBtn');
export const maximizeBtn = document.getElementById('maximizeBtn');
export const closeBtn = document.getElementById('closeBtn');

// Novos elementos para o modal de seleção de diretório
export const directoryModal = document.getElementById('directoryModal');
export const directoryList = document.getElementById('directoryList');
export const cancelSaveBtn = document.getElementById('cancelSave');
export const confirmSaveBtn = document.getElementById('confirmSave');

// Constantes para o modal de seleção ao carregar conquistas
export const loadDirectoryModal = document.getElementById('loadDirectoryModal');
export const loadDirectoryList = document.getElementById('loadDirectoryList');
export const cancelLoadBtn = document.getElementById('cancelLoad');
export const confirmLoadBtn = document.getElementById('confirmLoad');

// Variáveis globais
export let achievements = [];
export let selectedAchievements = new Set();
export let userAchievements = [];
export let currentLanguage = 'pt-BR';
export let existingDirectories = [];

// Função para atualizar o idioma atual
export function setCurrentLanguage(lang) {
  currentLanguage = lang;
} 