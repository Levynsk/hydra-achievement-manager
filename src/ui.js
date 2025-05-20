import { appContainer, currentSectionTitle } from './constants.js';
import { t } from './translations.js';
import { fetchGames, clearGamesList } from './games.js';

let currentSection = '';
let currentGameInfo = null;

export function setCurrentGame(gameInfo) {
  currentGameInfo = gameInfo;
  updateTitlebarSection(currentSection);
}

async function updateTitlebarSection(section) {
  const titlebarIcon = document.querySelector('.current-section-icon');
  const titlebarText = document.querySelector('.current-section-text');
  
  let icon = '';
  switch (section) {
    case 'games':
      icon = 'fa-gamepad';
      break;
    case 'search':
      icon = 'fa-search';
      break;
    case 'achievements':
      icon = currentGameInfo ? 'fa-trophy' : 'fa-trophy';
      break;
    case 'settings':
      icon = 'fa-cog';
      break;
    default:
      icon = 'fa-trophy';
  }
  
  titlebarIcon.className = `current-section-icon fas ${icon}`;
  
  if (section === 'achievements' && currentGameInfo) {
    titlebarText.textContent = currentGameInfo.name;
  } else {
    titlebarText.textContent = await t(`sidebar.${section}`);
  }
}

export async function updateCurrentSectionTitle() {
  // Removed since header section no longer exists
  return;
}

export async function handleSectionChange(section) {
  if (currentSection === 'games' && section !== 'games') {
    clearGamesList();
  }

  // Clear game info when leaving achievements section
  if (currentSection === 'achievements' && section !== 'achievements') {
    currentGameInfo = null;
  }

  currentSection = section;

  document.querySelectorAll('.sidebar-nav li').forEach(li => {
    li.classList.remove('active');
  });
  document.querySelector(`.sidebar-nav a[href="#${section}"]`).parentElement.classList.add('active');

  document.querySelectorAll('.section').forEach(section => {
    section.classList.add('hidden');
  });

  const selectedSection = document.getElementById(`${section}Section`);
  if (selectedSection) {
    selectedSection.classList.remove('hidden');
  }

  await updateCurrentSectionTitle();
  await updateTitlebarSection(section);

  if (section === 'games') {
    await fetchGames();
  }
}

export async function populateChangelog() {
  const changelog = document.getElementById('changelog');
  if (!changelog) return;

  try {
    const response = await fetch('https://raw.githubusercontent.com/Levynsk/hydra-achievement-manager/refs/heads/main/updates.json');
    if (!response.ok) {
      throw new Error('Failed to fetch changelog');
    }

    const { updates } = await response.json();

    changelog.innerHTML = updates.map(version => `
      <div class="update-entry">
        <h4>Versão ${version.version}</h4>
        <ul>
          ${version.changelog.map(change => `<li>${change}</li>`).join('')}
        </ul>
      </div>
      ${version.version !== '1.0.0' ? '<hr>' : ''}
    `).join('');
  } catch (error) {
    console.error('Error fetching changelog:', error);
    changelog.innerHTML = '<p class="error-message">Failed to load changelog</p>';
  }
}

// Initialize titlebar section on load
document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.substring(1) || 'achievements';
  updateTitlebarSection(hash);
});