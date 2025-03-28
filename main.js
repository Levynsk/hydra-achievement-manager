const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

const store = new Store();

let mainWindow;

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1e1e2e', 
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false, 
    frame: false, 
    titleBarStyle: 'hidden',
    autoHideMenuBar: true
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {

    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-achievements', async (event, appId, apiKey) => {
  try {

    return { success: true, message: 'Achievements fetched successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('write-achievements', async (event, appId, achievements) => {
  try {
    const dirPath = path.join('C:/Users/Public/Documents/Steam/RUNE', appId.toString());

    await fs.promises.mkdir(dirPath, { recursive: true });

    const filePath = path.join(dirPath, 'achievements.ini');

    let fileContent = '';
    for (const achievement of achievements) {
      fileContent += `[${achievement.id}]\n`;
      fileContent += `Achieved=1\n`;
      fileContent += `UnlockTime=${achievement.unlockTime}\n\n`;
    }

    await fs.promises.writeFile(filePath, fileContent, 'utf8');

    return { 
      success: true, 
      message: `Arquivo achievements.ini foi gerado com sucesso em ${filePath}` 
    };
  } catch (error) {
    console.error('Erro ao gerar arquivo:', error);
    return { 
      success: false, 
      message: `Erro ao gerar arquivo: ${error.message}` 
    };
  }
});

ipcMain.handle('save-api-key', async (event, apiKey) => {
  store.set('steamApiKey', apiKey);
  return { success: true };
});

ipcMain.handle('get-api-key', async () => {
  return store.get('steamApiKey', '');
});

ipcMain.handle('get-config', async (event, key) => {
  if (key) {
    return store.get(key);
  }
  return {
    apiKey: store.get('steamApiKey', ''),
    outputPath: store.get('outputPath', 'C:/Users/Public/Documents/Steam/RUNE'),
    theme: store.get('theme', 'dark'),
    language: store.get('language', 'pt-BR')
  };
});

ipcMain.handle('save-config', async (event, key, value) => {
  store.set(key, value);
  return { success: true };
});

ipcMain.handle('get-game-folders', async (event, outputPath) => {
  try {
    if (!outputPath) {
      throw new Error('O caminho de saída não foi fornecido.');
    }

    const fullPath = path.resolve(outputPath);
    const folders = fs.readdirSync(fullPath).filter(file => fs.statSync(path.join(fullPath, file)).isDirectory());

    const games = [];
    for (const folder of folders) {
      const iniPath = path.join(fullPath, folder, 'achievements.ini');
      let unlockedAchievements = 0;

      if (fs.existsSync(iniPath)) {
        const iniContent = fs.readFileSync(iniPath, 'utf-8');
        unlockedAchievements = (iniContent.match(/Achieved=1/g) || []).length;
      }

      games.push({
        id: folder,
        unlockedAchievements,
      });
    }

    return { success: true, games };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('close-window', () => {
  mainWindow.close();
});