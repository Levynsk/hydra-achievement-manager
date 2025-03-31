import { appContainer, currentSectionTitle } from './constants.js';
import { t } from './translations.js';
import { fetchGames, clearGamesList } from './games.js';

let currentSection = '';

export async function updateCurrentSectionTitle() {
  const activeLink = document.querySelector('.sidebar-nav li.active a');
  if (activeLink) {
    const section = activeLink.getAttribute('href').substring(1);
    let titleKey = '';

    switch (section) {
      case 'games':
        titleKey = 'sidebar.games';
        break;
      case 'achievements':
        titleKey = 'sidebar.achievements';
        break;
      case 'settings':
        titleKey = 'sidebar.settings';
        break;
      default:
        titleKey = 'sidebar.achievements';
    }

    currentSectionTitle.textContent = await t(titleKey);
  }
}

export async function handleSectionChange(section) {

  if (currentSection === 'games' && section !== 'games') {
    clearGamesList();
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

  if (section === 'games') {
    await fetchGames();
  }
}