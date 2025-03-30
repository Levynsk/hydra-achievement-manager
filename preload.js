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
        throw new Error('Could not get achievements. Please check the app_id and try again.');
      }
      
      const achievementsMap = new Map();
      
      data.game.availableGameStats.achievements.forEach(achievement => {
        if (!achievementsMap.has(achievement.name)) {
          achievementsMap.set(achievement.name, {
            apiname: achievement.name,
            displayName: achievement.displayName,
            description: achievement.description || '',
            icon: achievement.icon || ''
          });
        }
      });
      
      const achievements = Array.from(achievementsMap.values());
      
      const unlockedAchievementsInfo = await ipcRenderer.invoke('get-unlocked-achievements', appId);
      
      const achievementsWithUnlockedStatus = achievements.map(achievement => {
        const unlockedInfo = unlockedAchievementsInfo.find(a => a.id === achievement.apiname);
        return {
          ...achievement,
          unlocked: !!unlockedInfo,
          unlockTime: unlockedInfo ? unlockedInfo.unlockTime : null
        };
      });
      
      return { success: true, achievements: achievementsWithUnlockedStatus };
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

  saveSteamId: (steamId) => {
    return ipcRenderer.invoke('save-config', 'steamId', steamId);
  },
  
  getSteamId: () => {
    return ipcRenderer.invoke('get-config', 'steamId');
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
  close: () => ipcRenderer.invoke('close-window'),
  isMaximized: () => ipcRenderer.invoke('is-window-maximized')
});