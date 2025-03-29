import { t } from './translations.js';
import { showError } from './settings.js';
import { fetchAchievements } from './achievements.js';

const gamesList = document.getElementById('gamesList');
const gamesSection = document.getElementById('gamesSection');

// Variável para controlar se já está carregando jogos
let isLoadingGames = false;

// Função para limpar a lista de jogos
export function clearGamesList() {
  if (gamesList) {
    gamesList.innerHTML = '';
    console.log('Lista de jogos limpa');
  }
}

export async function displayGameInfo(appId) {
  try {
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
    const data = await response.json();
    
    const config = await window.api.getConfig();
    const outputPath = config.outputPath;
    const result = await window.api.getGameFolders(outputPath);
    
    if (data[appId]?.success) {
      const gameData = data[appId].data;
      const totalAchievements = gameData.achievements?.total || 0;
      
      let unlockedAchievements = 0;
      if (result.success) {
        const game = result.games.find(g => g.id === appId);
        if (game) {
          unlockedAchievements = game.unlockedAchievements;
        }
      }
      
      const appIdContainer = document.querySelector('.app-id-info');
      if (appIdContainer) {
        appIdContainer.innerHTML = `
          <p>${await t('achievements.appIdInfo')}</p>
          <div class="game-info-container">
            <img src="https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg" alt="${gameData.name}" class="game-header">
            <div class="game-details">
              <h3>${gameData.name}</h3>
              <div>
                <span>${unlockedAchievements}/${totalAchievements} ${await t('games.achievements')}</span>
                <span class="achievement-percentage">${(totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        `;
      }

      const appIdInput = document.getElementById('appId');
      if (appIdInput) {
        appIdInput.value = appId;
        await fetchAchievements();
      }
    }
  } catch (error) {
    console.error('Erro ao buscar informações do jogo:', error);
  }
}

export async function fetchGames() {
  const gamesList = document.getElementById('gamesList');
  if (!gamesList) return;
  
  // Evitar múltiplas chamadas simultâneas
  if (isLoadingGames) {
    console.log('Já está carregando jogos, solicitação ignorada');
    return;
  }
  
  // Definir estado de carregamento
  isLoadingGames = true;
  
  // Limpe a lista de jogos antes de carregar novamente
  clearGamesList();
  
  gamesList.innerHTML = `<div class="loading-content"><div class="loader"></div><p>${await t('games.loading')}</p></div>`;

  try {
    const config = await window.api.getConfig();
    const outputPath = config.outputPath;

    if (!outputPath) {
      throw new Error('O caminho de saída não está configurado.');
    }

    const result = await window.api.getGameFolders(outputPath);

    if (!result.success) {
      throw new Error(result.message);
    }

    // Use um Map para garantir unicidade por ID do jogo
    const gamesMap = new Map();
    
    for (const game of result.games) {
      // Verificar se já temos este jogo no Map
      if (gamesMap.has(game.id)) continue;
      
      try {
        const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${game.id}`);
        const data = await response.json();
        
        if (data[game.id]?.success) {
          const gameData = data[game.id].data;
          const totalAchievements = gameData.achievements?.total || 0;

          gamesMap.set(game.id, {
            id: game.id,
            name: gameData.name,
            image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/header.jpg`,
            achievements: {
              unlocked: game.unlockedAchievements,
              total: totalAchievements,
            },
          });
        }
      } catch (error) {
        console.error(`Erro ao buscar detalhes do jogo ${game.id}:`, error);
      }
    }

    // Converter o Map em um array para exibição
    const games = Array.from(gamesMap.values());
    
    // Limpe o indicador de carregamento
    gamesList.innerHTML = '';
    
    if (games.length === 0) {
      gamesList.innerHTML = `<p class="no-games">${await t('games.noGames')}</p>`;
      return;
    }
    
    const selectText = await t('games.select');
    const achievementsText = await t('games.achievements');
    
    // Usando Promise.all para processar todos os jogos de forma assíncrona
    await Promise.all(games.map(async (game) => {
      const progress = game.achievements.total > 0 ? (game.achievements.unlocked / game.achievements.total) * 100 : 0;
      const isPlatinum = progress === 100 && game.achievements.total > 0;
      const gameCard = document.createElement('div');
      gameCard.className = 'game-card';
      gameCard.dataset.id = game.id;
      
      // Adiciona a classe 'platinum' se o jogo estiver 100% completo e tiver conquistas
      if (isPlatinum) {
        gameCard.classList.add('platinum');
      }
      
      // Texto da porcentagem com indicação de platina
      const percentageText = isPlatinum 
        ? `<span class="progress-percentage">${await t('achievements.platinum')} ✓</span>` 
        : `<span class="progress-percentage">${progress.toFixed(1)}%</span>`;
      
      gameCard.innerHTML = `
        <button class="game-select-btn" title="${selectText}">
          <i class="fas fa-plus"></i>
        </button>
        <img src="${game.image}" alt="${game.name}" onerror="this.src='assets/game-placeholder.jpg'">
        <div class="game-info">
          <div class="game-title" title="${game.name}">${game.name}</div>
          <div class="game-achievements">
            <span><i class="fas fa-trophy"></i> ${game.achievements.unlocked}/${game.achievements.total} ${achievementsText}</span>
            ${percentageText}
          </div>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${progress}%;">
              <div class="progress-bar-inner"></div>
            </div>
          </div>
        </div>
      `;

      // Evento de clique no botão de seleção
      gameCard.querySelector('.game-select-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // Previne que o clique chegue ao card
        selectGame(game.id);
      });

      // Evento de clique no card inteiro
      gameCard.addEventListener('click', () => {
        selectGame(game.id);
      });

      gamesList.appendChild(gameCard);
    }));
  } catch (error) {
    const errorTemplate = await t('games.error', { message: error.message });
    gamesList.innerHTML = `<p class="error-message">${errorTemplate}</p>`;
  } finally {
    // Resetar o estado de carregamento quando terminar, independentemente do resultado
    isLoadingGames = false;
  }
}

// Função para selecionar um jogo e navegar para a tela de conquistas
function selectGame(gameId) {
  // Atualiza visualmente o botão se necessário
  const buttons = document.querySelectorAll('.game-select-btn');
  buttons.forEach(btn => {
    if (btn.closest('.game-card').dataset.id === gameId) {
      btn.classList.add('selected');
      btn.innerHTML = '<i class="fas fa-check"></i>';
    } else {
      btn.classList.remove('selected');
      btn.innerHTML = '<i class="fas fa-plus"></i>';
    }
  });
  
  // Preenche o appId e navega para a tela de conquistas
  const appIdInput = document.getElementById('appId');
  if (appIdInput) {
    appIdInput.value = gameId;
    
    const achievementsLink = document.querySelector('.sidebar-nav a[href="#achievements"]');
    if (achievementsLink) {
      achievementsLink.click();
    }
    
    fetchAchievements();
  }
}

// Expor a função globalmente para os botões
window.displayGameInfo = displayGameInfo; 