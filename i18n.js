// i18n.js - Internationalization module
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const Store = require('electron-store');

const store = new Store();

// Available languages
let availableLanguages = {};
let currentLanguage = null;
let translations = {};

/**
 * Initialize the internationalization module
 */
function init() {
  // Load all available languages
  loadAvailableLanguages();
  
  // Get system language or saved language preference
  const savedLanguage = store.get('language');
  const systemLanguage = app.getLocale();
  
  // Set current language (saved preference or system language or default to en-US)
  setLanguage(savedLanguage || systemLanguage || 'en-US');
  
  return {
    t, // Translation function
    getCurrentLanguage,
    getAvailableLanguages,
    setLanguage
  };
}

/**
 * Load all available language files from the locales directory
 */
function loadAvailableLanguages() {
  const localesDir = path.join(__dirname, 'locales');
  
  try {
    if (!fs.existsSync(localesDir)) {
      fs.mkdirSync(localesDir, { recursive: true });
    }
    
    const files = fs.readdirSync(localesDir);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(localesDir, file);
          const langData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const langCode = file.replace('.json', '');
          
          if (langData && langData.meta && langData.meta.name) {
            availableLanguages[langCode] = {
              code: langCode,
              name: langData.meta.name,
              author: langData.meta.author || 'Unknown',
              version: langData.meta.version || '1.0.0'
            };
          }
        } catch (err) {
          console.error(`Error loading language file ${file}:`, err);
        }
      }
    });
    
    // If no languages found, add English as default
    if (Object.keys(availableLanguages).length === 0) {
      availableLanguages['en-US'] = {
        code: 'en-US',
        name: 'English (United States)',
        author: 'System',
        version: '1.0.0'
      };
    }
  } catch (err) {
    console.error('Error loading language files:', err);
    // Fallback to English
    availableLanguages['en-US'] = {
      code: 'en-US',
      name: 'English (United States)',
      author: 'System',
      version: '1.0.0'
    };
  }
}

/**
 * Set the current language
 * @param {string} langCode - Language code (e.g., 'en-US', 'pt-BR')
 * @returns {boolean} - Success status
 */
function setLanguage(langCode) {
  // If the language doesn't exist, try to find a close match
  if (!availableLanguages[langCode]) {
    // Try to match the language part (e.g., 'en' from 'en-US')
    const langPart = langCode.split('-')[0];
    const closestMatch = Object.keys(availableLanguages).find(code => 
      code.startsWith(langPart + '-')
    );
    
    if (closestMatch) {
      langCode = closestMatch;
    } else {
      // Default to en-US if no match found
      langCode = 'en-US';
    }
  }
  
  try {
    const filePath = path.join(__dirname, 'locales', `${langCode}.json`);
    
    if (fs.existsSync(filePath)) {
      const langData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (langData && langData.translations) {
        translations = langData.translations;
        currentLanguage = langCode;
        
        // Save the language preference
        store.set('language', langCode);
        
        return true;
      }
    }
    
    // If we get here, something went wrong, try to load English
    if (langCode !== 'en-US') {
      return setLanguage('en-US');
    }
    
    return false;
  } catch (err) {
    console.error(`Error setting language to ${langCode}:`, err);
    return false;
  }
}

/**
 * Get translation for a key
 * @param {string} key - Translation key (e.g., 'app.title', 'errors.invalidApiKey')
 * @param {Object} params - Parameters to replace in the translation
 * @returns {string} - Translated text or the key if not found
 */
function t(key, params = {}) {
  // Split the key by dots to navigate the translations object
  const parts = key.split('.');
  let value = translations;
  
  // Navigate through the translations object
  for (const part of parts) {
    if (value && value[part] !== undefined) {
      value = value[part];
    } else {
      // Key not found
      return key;
    }
  }
  
  // If the value is not a string, return the key
  if (typeof value !== 'string') {
    return key;
  }
  
  // Replace parameters in the translation
  let result = value;
  for (const [param, replacement] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), replacement);
  }
  
  return result;
}

/**
 * Get the current language code
 * @returns {string} - Current language code
 */
function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Get all available languages
 * @returns {Object} - Available languages
 */
function getAvailableLanguages() {
  return availableLanguages;
}

module.exports = init();