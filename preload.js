const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getAchievements: async (appId, apiKey) => {
    try {
      const response = await fetch(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${appId}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.game || !data.game.availableGameStats || !data.game.availableGameStats.achievements) {
        throw new Error('Não foi possível obter as conquistas. Verifique o app_id e tente novamente.');
      }
      
      const achievements = data.game.availableGameStats.achievements.map(achievement => ({
        id: achievement.name,
        name: achievement.displayName,
        description: achievement.description || '',
        icon: achievement.icon || ''
      }));
      
      return { success: true, achievements };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  
  getUserAchievements: async (appId, apiKey, steamId) => {
    try {
      const response = await fetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${apiKey}&appid=${appId}&steamid=${steamId}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.playerstats || !data.playerstats.achievements) {
        throw new Error('Não foi possível obter as conquistas do usuário. Verifique o app_id, steamid e tente novamente.');
      }
      
      const unlockedAchievements = data.playerstats.achievements
        .filter(achievement => achievement.achieved === 1)
        .map(achievement => ({
          id: achievement.apiname,
          unlockTime: achievement.unlocktime
        }));
      
      return { success: true, unlockedAchievements };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  
  writeAchievements: (appId, achievements) => {
    return ipcRenderer.invoke('write-achievements', appId, achievements);
  },

  saveApiKey: (apiKey) => {
    return ipcRenderer.invoke('save-api-key', apiKey);
  },
  
  getApiKey: () => {
    return ipcRenderer.invoke('get-api-key');
  },
  
  getConfig: (key) => {
    return ipcRenderer.invoke('get-config', key);
  },
  
  saveConfig: (key, value) => {
    return ipcRenderer.invoke('save-config', key, value);
  },
  
  getCurrentTimestamp: () => {
    return Math.floor(Date.now() / 1000);
  },

  getGameFolders: async (outputPath) => {
    return await ipcRenderer.invoke('get-game-folders', outputPath);
  },

  // i18n related functions
  getTranslation: (key, params = {}) => {
    return ipcRenderer.invoke('get-translation', key, params);
  },
  
  getCurrentLanguage: () => {
    return ipcRenderer.invoke('get-current-language');
  },
  
  getAvailableLanguages: () => {
    return ipcRenderer.invoke('get-available-languages');
  },
  
  setLanguage: (langCode) => {
    return ipcRenderer.invoke('set-language', langCode);
  }
});

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.invoke('minimize-window'),
  maximize: () => ipcRenderer.invoke('maximize-window'),
  close: () => ipcRenderer.invoke('close-window')
});