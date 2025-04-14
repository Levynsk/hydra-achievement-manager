import { t } from './translations.js';

// Elementos do DOM
const searchInput = document.getElementById('searchGameInput');
const searchButton = document.getElementById('searchGameButton');
const searchResultsList = document.getElementById('searchResultsList');
const searchLoadingCard = document.getElementById('searchLoadingCard');
const searchErrorCard = document.getElementById('searchErrorCard');
const searchErrorMessage = document.getElementById('searchErrorMessage');
const searchTryAgainBtn = document.getElementById('searchTryAgain');

// Inicializa os listeners dos elementos
export function initSearchListeners() {
  if (searchButton) {
    searchButton.addEventListener('click', searchGames);
  }
  
  if (searchInput) {
    searchInput.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        searchGames();
      }
    });
  }
  
  if (searchTryAgainBtn) {
    searchTryAgainBtn.addEventListener('click', searchGames);
  }
}

// Função principal de pesquisa de jogos
export async function searchGames() {
  // Verificar se há um termo de pesquisa
  const searchTerm = searchInput.value.trim();
  if (!searchTerm) {
    searchResultsList.innerHTML = `<p class="no-games">Por favor, digite um termo de pesquisa.</p>`;
    return;
  }
  
  // Exibir estado de carregamento
  searchResultsList.innerHTML = '';
  searchLoadingCard.classList.remove('hidden');
  searchErrorCard.classList.add('hidden');
  
  try {
    // Fazer requisição à API da Steam
    const response = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(searchTerm)}&cc=us&l=en`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Esconder o loading
    searchLoadingCard.classList.add('hidden');
    
    // Verificar se há jogos nos resultados
    if (!data.items || data.items.length === 0) {
      searchResultsList.innerHTML = `<p class="no-games">Nenhum jogo encontrado com o termo "${searchTerm}".</p>`;
      return;
    }
    
    // Renderizar os resultados encontrados
    await renderSearchResults(data.items);
    
  } catch (error) {
    console.error('Erro ao pesquisar jogos:', error);
    searchLoadingCard.classList.add('hidden');
    searchErrorCard.classList.remove('hidden');
    searchErrorMessage.textContent = `Ocorreu um erro ao pesquisar jogos: ${error.message}`;
  }
}

// Função para renderizar os resultados da pesquisa
async function renderSearchResults(games) {
  searchResultsList.innerHTML = '';
  
  const achievementsText = await t('games.achievements') || 'conquistas';
  
  // Usar um Map para garantir unicidade por ID do jogo
  const uniqueGames = new Map();
  
  for (const game of games) {
    if (game.type !== 'app') continue; // Filtrar apenas aplicativos
    
    // Se o jogo já existe no Map, pular
    if (uniqueGames.has(game.id)) continue;
    
    // Adicionar ao Map
    uniqueGames.set(game.id, game);
    
    // Buscar dados das conquistas usando a API oficial da Steam
    let totalAchievements = "?";
    
    try {
      const detailsResponse = await fetch(`https://store.steampowered.com/api/appdetails?appids=${game.id}`);
      const detailsData = await detailsResponse.json();
      
      if (detailsData[game.id]?.success) {
        totalAchievements = detailsData[game.id].data.achievements?.total || "?";
      }
    } catch (error) {
      console.warn(`Não foi possível obter detalhes para o jogo ${game.id}:`, error);
    }
    
    // Criar card do jogo
    const gameCard = document.createElement('div');
    gameCard.className = 'game-card';
    gameCard.dataset.id = game.id;
    
    // Usar a imagem fornecida pela API ou uma imagem padrão
    const imageUrl = game.tiny_image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.id}/header.jpg`;
    
    // Criar HTML do card
    gameCard.innerHTML = `
      <img src="${imageUrl}" alt="${game.name}" onerror="this.src='assets/game-placeholder.jpg'">
      <div class="game-info">
        <div class="game-title">${game.name}</div>
        <div class="game-achievements">
          <i class="fas fa-trophy"></i> ${totalAchievements} ${achievementsText}
        </div>
      </div>
      <button class="game-select-btn" data-id="${game.id}" aria-label="Selecionar jogo">
        <i class="fas fa-arrow-right"></i>
      </button>
    `;
    
    // Adicionar apenas um listener no card inteiro
    gameCard.addEventListener('click', () => {
      selectGame(game.id);
    });
    
    // Adicionar o card à lista de resultados
    searchResultsList.appendChild(gameCard);
  }
}

// Função para selecionar um jogo dos resultados
function selectGame(gameId) {
  // Redirecionar para a aba de conquistas com o id do jogo
  const appIdInput = document.getElementById('appId');
  const fetchAchievementsBtn = document.getElementById('fetchAchievements');
  
  if (appIdInput && fetchAchievementsBtn) {
    // Alternar para a aba de conquistas
    const achievementsLink = document.querySelector('.sidebar-nav a[href="#achievements"]');
    if (achievementsLink) {
      achievementsLink.click();
    }
    
    // Preencher o App ID e clicar no botão para buscar conquistas
    appIdInput.value = gameId;
    fetchAchievementsBtn.click();
  }
}