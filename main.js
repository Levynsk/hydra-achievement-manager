const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');
const i18n = require('./i18n');

const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: false,
    resizable: true,
    minWidth: 800,
    minHeight: 600
  });

  mainWindow.loadFile('index.html');

  // DevTools em janela separada apenas no ambiente de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('save-api-key', async (event, apiKey) => {
  try {
    store.set('steamApiKey', apiKey);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-api-key', () => {
  return store.get('steamApiKey');
});

ipcMain.handle('save-config', async (event, key, value) => {
  try {
    store.set(key, value);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-config', (event, key) => {
  return store.get(key);
});

ipcMain.handle('write-achievements', async (event, appId, achievements) => {
  try {
    const config = store.get('config') || {};
    const outputPath = config.outputPath || 'C:/Users/Public/Documents/Steam/RUNE';
    
    const achievementsPath = path.join(outputPath, appId, 'achievements.ini');
    
    // Criar diretório se não existir
    const dir = path.dirname(achievementsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Escrever arquivo de conquistas no formato INI - exatamente como no Python
    let iniContent = '';
    for (const achievement of achievements) {
      iniContent += `[${achievement.id}]\n`;
      iniContent += `Achieved=1\n`;
      iniContent += `UnlockTime=${achievement.unlockTime}\n\n`;
    }
    
    fs.writeFileSync(achievementsPath, iniContent);
    
    return { success: true, message: 'Arquivo achievements.ini foi gerado com sucesso!' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-game-folders', async (event, outputPath) => {
  try {
    if (!fs.existsSync(outputPath)) {
      return { success: false, message: 'Diretório não encontrado.' };
    }

    const folders = fs.readdirSync(outputPath);
    const gamesMap = new Map(); // Usar um Map para garantir a unicidade

    for (const folder of folders) {
      // Ignorar pastas duplicadas ou inválidas
      if (!folder || gamesMap.has(folder)) continue;
      
      const achievementsPath = path.join(outputPath, folder, 'achievements.ini');
      if (fs.existsSync(achievementsPath)) {
        // Ler o conteúdo do arquivo INI para contar as conquistas
        const content = fs.readFileSync(achievementsPath, 'utf8');
        const achievementMatches = content.match(/\[.*?\]/g) || [];
        
        gamesMap.set(folder, {
          id: folder,
          unlockedAchievements: achievementMatches.length
        });
      }
    }

    // Converter o Map para um array de jogos
    const games = Array.from(gamesMap.values());

    return { success: true, games };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Window control handlers
ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('close-window', () => {
  mainWindow.close();
});

ipcMain.handle('is-window-maximized', () => {
  return mainWindow.isMaximized();
});

// i18n handlers
ipcMain.handle('get-translation', async (event, key, params = {}) => {
  try {
    return i18n.getTranslation(key, params);
  } catch (error) {
    console.error(`Erro ao buscar tradução para "${key}":`, error);
    return key; // Retornar a chave como fallback em caso de erro
  }
});

ipcMain.handle('get-current-language', () => {
  return i18n.getCurrentLanguage();
});

ipcMain.handle('get-available-languages', () => {
  return i18n.getAvailableLanguages();
});

ipcMain.handle('set-language', async (event, langCode) => {
  try {
    const success = i18n.setLanguage(langCode);
    if (success) {
      store.set('language', langCode);
      return { success: true };
    }
    return { success: false, message: 'Idioma não disponível' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-unlocked-achievements', async (event, appId) => {
  try {
    const config = store.get('config') || {};
    const outputPath = config.outputPath || 'C:/Users/Public/Documents/Steam/RUNE';
    
    const achievementsPath = path.join(outputPath, appId, 'achievements.ini');
    
    // Se o arquivo não existe, retorna um array vazio
    if (!fs.existsSync(achievementsPath)) {
      return [];
    }
    
    // Ler o conteúdo do arquivo INI
    const content = fs.readFileSync(achievementsPath, 'utf8');
    
    // Parsear o arquivo INI para extrair as conquistas
    const unlockedAchievements = [];
    const sections = content.split(/\n\s*\n/); // Dividir por linhas em branco para cada seção
    
    for (const section of sections) {
      if (!section.trim()) continue;
      
      const lines = section.split('\n');
      const idMatch = lines[0].match(/\[(.*?)\]/);
      
      if (idMatch) {
        const id = idMatch[1];
        const unlockTimeMatch = lines.find(line => line.includes('UnlockTime='))?.match(/UnlockTime=(\d+)/);
        const unlockTime = unlockTimeMatch ? parseInt(unlockTimeMatch[1]) : null;
        
        unlockedAchievements.push({
          id,
          unlockTime
        });
      }
    }
    
    return unlockedAchievements;
  } catch (error) {
    console.error('Erro ao ler o arquivo de conquistas:', error);
    return [];
  }
});