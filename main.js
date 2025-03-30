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
    
    // Mapa para armazenar conquistas e garantir que não haja duplicatas
    const achievementsMap = new Map();
    
    // Verificar se o arquivo existe, e se existir, ler as conquistas atuais
    if (fs.existsSync(achievementsPath)) {
      try {
        const existingContent = fs.readFileSync(achievementsPath, 'utf8');
        const sections = existingContent.split(/\n\s*\n/);
        
        for (const section of sections) {
          if (!section.trim()) continue;
          
          const lines = section.split('\n');
          const idMatch = lines[0].match(/\[(.*?)\]/);
          
          if (idMatch) {
            const id = idMatch[1];
            const unlockTimeMatch = lines.find(line => line.includes('UnlockTime='))?.match(/UnlockTime=(\d+)/);
            const unlockTime = unlockTimeMatch ? parseInt(unlockTimeMatch[1]) : Math.floor(Date.now() / 1000);
            
            // Adicionar ao mapa apenas se ainda não existir
            if (!achievementsMap.has(id)) {
              achievementsMap.set(id, { id, unlockTime });
            }
          }
        }
      } catch (error) {
        console.error('Erro ao ler o arquivo de conquistas existente:', error);
        // Continuar mesmo com erro, criando um novo arquivo
      }
    }
    
    // Adicionar as novas conquistas, substituindo as existentes se tiverem o mesmo ID
    for (const achievement of achievements) {
      achievementsMap.set(achievement.id, achievement);
    }
    
    // Escrever arquivo de conquistas no formato INI - sem duplicatas
    let iniContent = '';
    for (const achievement of achievementsMap.values()) {
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
        try {
          const content = fs.readFileSync(achievementsPath, 'utf8');
          const achievementMatches = (content.match(/\[.*?\]/g) || []).filter(match => !!match.trim());
          
          // Identificar conquistas únicas, pois o mesmo ID pode aparecer mais de uma vez no arquivo
          const uniqueAchievementIds = new Set();
          for (const match of achievementMatches) {
            const id = match.replace(/[\[\]]/g, ''); // Remove colchetes
            if (id.trim()) {
              uniqueAchievementIds.add(id);
            }
          }
          
          gamesMap.set(folder, {
            id: folder,
            unlockedAchievements: uniqueAchievementIds.size // Usar o número de conquistas únicas
          });
        } catch (error) {
          console.error(`Erro ao ler o arquivo de conquistas para o jogo ${folder}:`, error);
          // Se houver erro na leitura do arquivo, ainda adiciona o jogo, mas com 0 conquistas
          gamesMap.set(folder, {
            id: folder,
            unlockedAchievements: 0
          });
        }
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
    const achievementsMap = new Map(); // Usar um Map para evitar duplicatas
    const sections = content.split(/\n\s*\n/); // Dividir por linhas em branco para cada seção
    
    for (const section of sections) {
      if (!section.trim()) continue;
      
      const lines = section.split('\n');
      const idMatch = lines[0].match(/\[(.*?)\]/);
      
      if (idMatch) {
        const id = idMatch[1];
        const unlockTimeMatch = lines.find(line => line.includes('UnlockTime='))?.match(/UnlockTime=(\d+)/);
        const unlockTime = unlockTimeMatch ? parseInt(unlockTimeMatch[1]) : null;
        
        // Adicionar ao mapa (substitui se já existir com o mesmo ID)
        achievementsMap.set(id, {
          id,
          unlockTime
        });
      }
    }
    
    // Converter o Map para um array
    return Array.from(achievementsMap.values());
  } catch (error) {
    console.error('Erro ao ler o arquivo de conquistas:', error);
    return [];
  }
});