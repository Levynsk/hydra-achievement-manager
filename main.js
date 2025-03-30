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
    console.log(`Salvando configuração: ${key} = `, value);
    
    // Tratar outputPaths de forma especial
    if (key === 'outputPaths') {
      // Garantir que o valor é um array
      if (!Array.isArray(value)) {
        value = [value];
      }
      
      // Salvar dentro do objeto config
      const config = store.get('config') || {};
      config.outputPaths = value;
      store.set('config', config);
      
      console.log('Caminhos salvos em config.outputPaths:', value);
    } else {
      // Verificar se estamos lidando com uma chave dentro de config
      if (key.includes('.')) {
        store.set(key, value);
      } else {
        // Para outras chaves, salvar diretamente
        store.set(key, value);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Erro ao salvar configuração ${key}:`, error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-config', (event, key) => {
  // Se não for especificada uma chave, retorna toda a configuração
  if (!key) {
    const config = store.get('config') || {};
    // Garantir que outputPaths exista
    if (!config.outputPaths) {
      config.outputPaths = [config.outputPath || 'C:/Users/Public/Documents/Steam/RUNE'];
      config.activeOutputPath = config.outputPath || 'C:/Users/Public/Documents/Steam/RUNE';
      store.set('config', config);
    }
    return config;
  }
  
  // Se for 'outputPaths' e não existir, inicializa com o outputPath atual
  if (key === 'outputPaths') {
    const paths = store.get('outputPaths');
    if (!paths) {
      const currentPath = store.get('outputPath') || 'C:/Users/Public/Documents/Steam/RUNE';
      store.set('outputPaths', [currentPath]);
      return [currentPath];
    }
    return paths;
  }
  
  return store.get(key);
});

ipcMain.handle('write-achievements', async (event, appId, achievements, targetDirectory) => {
  try {
    const config = store.get('config') || {};
    const outputPaths = config.outputPaths || [config.outputPath || 'C:/Users/Public/Documents/Steam/RUNE'];
    
    // Se um diretório de destino específico foi fornecido, usa-o; caso contrário, usa o ativo
    const outputPath = targetDirectory || config.activeOutputPath || outputPaths[0];
    
    console.log('Diretório alvo para salvar:', outputPath);
    console.log('AppID:', appId);
    
    // Determinar o caminho correto com base no diretório de destino
    let achievementsPath;
    if (outputPath.includes('OnlineFix')) {
      // Caminho específico para OnlineFix (AppID/Stats/achievements.ini)
      achievementsPath = path.join(outputPath, appId, 'Stats', 'achievements.ini');
      console.log('Usando caminho específico para OnlineFix:', achievementsPath);
    } else {
      // Caminho padrão para outros diretórios
      achievementsPath = path.join(outputPath, appId, 'achievements.ini');
      console.log('Usando caminho padrão:', achievementsPath);
    }
    
    console.log('Caminho completo do arquivo:', achievementsPath);
    
    // Criar diretório se não existir
    const dir = path.dirname(achievementsPath);
    if (!fs.existsSync(dir)) {
      console.log('Criando diretório:', dir);
      try {
        fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
        console.log('Diretório criado com sucesso');
      } catch (mkdirError) {
        console.error('Erro ao criar diretório:', mkdirError);
        throw new Error(`Não foi possível criar o diretório: ${mkdirError.message}`);
      }
    }
    
    // Verificar se consegue escrever no diretório
    try {
      fs.accessSync(dir, fs.constants.W_OK);
      console.log('Diretório tem permissão de escrita');
    } catch (accessError) {
      console.error('Erro de permissão no diretório:', accessError);
      throw new Error(`Sem permissão para escrever no diretório: ${accessError.message}`);
    }
    
    // Mapa para armazenar conquistas e garantir que não haja duplicatas
    const achievementsMap = new Map();
    
    // Set para armazenar os IDs das conquistas selecionadas
    const selectedAchievementIds = new Set(achievements.map(a => a.id));
    
    // Verificar se o arquivo existe, e se existir, ler as conquistas atuais
    if (fs.existsSync(achievementsPath)) {
      console.log('Arquivo existente encontrado, mesclando dados...');
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
            
            // Adicionar ao mapa apenas se ainda não existir E estiver nas conquistas selecionadas
            if (!achievementsMap.has(id) && selectedAchievementIds.has(id)) {
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
    
    console.log('Escrevendo arquivo:', achievementsPath);
    fs.writeFileSync(achievementsPath, iniContent);
    
    return { success: true, message: 'Arquivo achievements.ini foi gerado com sucesso!' };
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
    return { success: false, message: error.message };
  }
});

// Handler para obter todos os diretórios de saída configurados
ipcMain.handle('get-output-directories', async (event) => {
  try {
    console.log('Obtendo diretórios de configuração no processo principal...');
    
    // Diretórios padrão fixos como solicitado
    const defaultDirectories = [
      'C:/Users/Public/Documents/Steam/RUNE',
      'C:/Users/Public/Documents/Steam/CODEX',
      'C:/ProgramData/Steam/RLD!',
      'C:/Users/Public/Documents/OnlineFix',
      'C:/Users/Public/Documents/Steam'
    ];
    
    // Salvar no store para futura referência
    store.set('config.outputPaths', defaultDirectories);
    
    // Se não houver um diretório ativo, definir o primeiro como ativo
    const activeOutputPath = store.get('config.activeOutputPath');
    if (!activeOutputPath || !defaultDirectories.includes(activeOutputPath)) {
      store.set('config.activeOutputPath', defaultDirectories[0]);
    }
    
    console.log('Diretórios padrão retornados:', defaultDirectories);
    return { success: true, directories: defaultDirectories };
  } catch (error) {
    console.error('Erro ao obter diretórios:', error);
    return { success: false, message: error.message };
  }
});

// Handler para verificar em quais diretórios o jogo já existe
ipcMain.handle('check-game-files', async (event, appId, directories) => {
  try {
    if (!appId) {
      return { success: false, message: 'ID do aplicativo não fornecido' };
    }
    
    if (!directories || !Array.isArray(directories) || directories.length === 0) {
      return { success: true, existingDirectories: [] };
    }
    
    const existingDirectories = [];
    
    for (const directory of directories) {
      // Caminho padrão
      const gamePath = path.join(directory, appId);
      const achievementsPath = path.join(gamePath, 'achievements.ini');
      
      // Caminho específico para OnlineFix (AppID/Stats/achievements.ini)
      const onlineFixPath = path.join(directory, appId, 'Stats', 'achievements.ini');
      
      // Verificar ambos os caminhos
      if (fs.existsSync(achievementsPath) || (directory.includes('OnlineFix') && fs.existsSync(onlineFixPath))) {
        existingDirectories.push(directory);
      }
    }
    
    return { success: true, existingDirectories };
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
      
      // Verificar o caminho de achievements.ini com base no diretório
      let achievementsPath;
      if (outputPath.includes('OnlineFix')) {
        // Caminho específico para OnlineFix
        achievementsPath = path.join(outputPath, folder, 'Stats', 'achievements.ini');
      } else {
        // Caminho padrão
        achievementsPath = path.join(outputPath, folder, 'achievements.ini');
      }
      
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
    const outputPaths = config.outputPaths || [config.outputPath || 'C:/Users/Public/Documents/Steam/RUNE'];
    const activeOutputPath = config.activeOutputPath || outputPaths[0];
    
    // Determinar o caminho correto com base no diretório ativo
    let achievementsPath;
    if (activeOutputPath.includes('OnlineFix')) {
      // Caminho específico para OnlineFix (AppID/Stats/achievements.ini)
      achievementsPath = path.join(activeOutputPath, appId, 'Stats', 'achievements.ini');
    } else {
      // Caminho padrão para outros diretórios
      achievementsPath = path.join(activeOutputPath, appId, 'achievements.ini');
    }
    
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

// Handler para selecionar um diretório
ipcMain.handle('select-directory', async () => {
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    }
    
    return { success: true, filePath: result.filePaths[0] };
  } catch (error) {
    return { success: false, message: error.message };
  }
});