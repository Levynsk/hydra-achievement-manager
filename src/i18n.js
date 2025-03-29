/**
 * Este arquivo serve como um proxy para o módulo i18n na raiz do projeto.
 * Importa o módulo principal e reexporta suas funções para uso no front-end.
 */

const rootI18n = require('../i18n');

// Reexportar o módulo principal
module.exports = rootI18n; 