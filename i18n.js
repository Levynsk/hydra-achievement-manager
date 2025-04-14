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
let englishTranslations = {}; // Armazena as traduções em inglês para fallback

/**
 * Initialize the internationalization module
 */
function init() {
  // Load all available languages
  loadAvailableLanguages();
  
  // Get system language or saved language preference
  const savedLanguage = store.get('language');
  const systemLanguage = app.getLocale();
  
  // Load English translations for fallback
  loadEnglishTranslations();
  
  // Set current language (saved preference or system language or default to en-US)
  setLanguage(savedLanguage || systemLanguage || 'en-US');
  
  return {
    t, // Translation function
    getTranslation, // Translation function with fallback
    getCurrentLanguage,
    getAvailableLanguages,
    setLanguage,
    getTranslationCompletion // Get translation completion percentage
  };
}

/**
 * Load English translations for fallback
 */
function loadEnglishTranslations() {
  try {
    const filePath = path.join(__dirname, 'locales', 'en-US.json');
    if (fs.existsSync(filePath)) {
      const langData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (langData && langData.translations) {
        englishTranslations = langData.translations;
      }
    }
  } catch (err) {
    console.error('Error loading English translations for fallback:', err);
    englishTranslations = {};
  }
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
  } catch (err) {
    console.error('Error loading language files:', err);
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
        // Save language preference
        store.set('language', langCode);
        return true;
      }
    }
  } catch (err) {
    console.error('Error setting language:', err);
  }
  
  return false;
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

/**
 * Get translation for a key with fallback to English
 * @param {string} key - Translation key (e.g., 'app.title', 'errors.invalidApiKey')
 * @param {Object} params - Parameters to replace in the translation
 * @returns {string} - Translated text or English fallback or the key if not found
 */
function getTranslation(key, params = {}) {
  // Split the key by dots to navigate the translations object
  const parts = key.split('.');
  let value = translations;
  let englishValue = englishTranslations;
  let foundInCurrent = true;
  
  // Navigate through the translations object
  for (const part of parts) {
    if (value && value[part] !== undefined) {
      value = value[part];
    } else {
      foundInCurrent = false;
      value = null;
      break;
    }
  }
  
  // If not found in current language or not a string, try English
  if (!foundInCurrent || typeof value !== 'string') {
    // Try to find in English
    for (const part of parts) {
      if (englishValue && englishValue[part] !== undefined) {
        englishValue = englishValue[part];
      } else {
        // Not found in English either
        return key;
      }
    }
    
    // If English value is not a string, return the key
    if (typeof englishValue !== 'string') {
      return key;
    }
    
    value = englishValue;
  }
  
  // Replace parameters in the translation
  for (const [param, replacement] of Object.entries(params)) {
    value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), replacement);
  }
  
  return value;
}

/**
 * Get translation for a key
 * @param {string} key - Translation key
 * @param {Object} params - Parameters to replace in the translation
 * @returns {string} - Translated text or the key if not found
 */
function t(key, params = {}) {
  return getTranslation(key, params);
}

/**
 * Calculate translation completion percentage
 * @param {string} langCode - Language code to check 
 * @returns {number} - Percentage of translation completion (0-100)
 */
function getTranslationCompletion(langCode = currentLanguage) {
  try {
    // If English, return 100%
    if (langCode === 'en-US') return 100;
    
    // Load translation file
    const filePath = path.join(__dirname, 'locales', `${langCode}.json`);
    if (!fs.existsSync(filePath)) return 0;
    
    const langData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!langData || !langData.translations) return 0;
    
    // Count English keys (baseline)
    function countTranslationKeys(obj) {
      let count = 0;
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          count += countTranslationKeys(obj[key]);
        } else if (typeof obj[key] === 'string') {
          count++;
        }
      }
      return count;
    }
    
    const enKeys = countTranslationKeys(englishTranslations);
    if (enKeys === 0) return 0;
    
    // Count keys in current language
    const langKeys = countTranslationKeys(langData.translations);
    
    return Math.round((langKeys / enKeys) * 100);
  } catch (err) {
    console.error('Error calculating translation completion:', err);
    return 0;
  }
}

module.exports = init();