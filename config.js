const { ipcRenderer } = require('electron');

// Configurações globais da aplicação
const API_CONFIG = {
  HYDRA_API_URL: ''
};

const defaultConfig = {
  apiKey: '',
  outputPath: 'C:/Users/Public/Documents/Steam/RUNE',
  outputPaths: ['C:/Users/Public/Documents/Steam/RUNE'],
  activeOutputPath: 'C:/Users/Public/Documents/Steam/RUNE',
  theme: 'dark', 
  language: 'pt-BR',
  apiSource: 'hydra',
  liteMode: false
};

async function getConfig(key) {
  return await ipcRenderer.invoke('get-config', key);
}

async function saveConfig(key, value) {
  return await ipcRenderer.invoke('save-config', key, value);
}

module.exports = {
  API_CONFIG,
  defaultConfig,
  getConfig,
  saveConfig
};
