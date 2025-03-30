import { apiKeyInput, customTimestampInput } from './constants.js';
import { initLanguageSelector } from './settings.js';
import { applyTranslations } from './translations.js';
import { t } from './translations.js';
import { setupEventListeners } from './events.js';

export async function initApp() {
  const savedApiKey = await window.api.getApiKey();
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
    apiKeyInput.type = 'password';
  }
  
  // Configurar o timestamp personalizado inicial com a data e hora atuais
  const now = new Date();
  // Ajustar para o fuso horário local
  const localNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
  customTimestampInput.value = localNow.toISOString().slice(0, 16);
  
  // Inicializar traduções
  await initLanguageSelector();
  await applyTranslations();
  
  // Configurar os diretórios de saída
  const config = await window.api.getConfig();
  const outputPathInput = document.getElementById('outputPath');
  const directoriesContainer = document.getElementById('directoriesContainer');
  
  if (outputPathInput && directoriesContainer) {
    outputPathInput.value = '';
    
    // Inicializar os diretórios
    const outputPaths = config.outputPaths || [config.outputPath || 'C:/Users/Public/Documents/Steam/RUNE'];
    const activeOutputPath = config.activeOutputPath || outputPaths[0];
    
    // Função para renderizar os diretórios
    const renderDirectories = async () => {
      directoriesContainer.innerHTML = '';
      
      // Buscar os diretórios padrão
      const paths = await window.api.getConfig('outputPaths') || [];
      const activePath = await window.api.getConfig('activeOutputPath') || paths[0];
      
      // Usar Set para garantir que não haja duplicatas
      const uniquePaths = [...new Set(paths)];
      
      uniquePaths.forEach(path => {
        const directoryItem = document.createElement('div');
        directoryItem.className = 'directory-item';
        if (path === activePath) {
          directoryItem.classList.add('active');
        }
        
        // Usar o caminho completo em vez de apenas o nome da pasta
        directoryItem.innerHTML = `
          <span class="directory-name" title="${path}">${path}</span>
          <div class="directory-actions">
            <button class="btn btn-icon set-active-btn" title="Definir como ativo"><i class="fas fa-check"></i></button>
          </div>
        `;
        
        // Evento para definir como diretório ativo
        directoryItem.querySelector('.set-active-btn').addEventListener('click', async () => {
          await window.api.saveConfig('activeOutputPath', path);
          renderDirectories();
        });
        
        directoriesContainer.appendChild(directoryItem);
      });
    };
    
    // Renderizar diretórios iniciais
    renderDirectories();
  }
  
  setupEventListeners();
}

// Inicializar a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initApp);