// src/components/embedBuilder/utils/embedValidator.js

/**
 * Valida se a string é uma URL de imagem válida.
 * @param {string} url
 * @returns {boolean}
 */
function validateURL(url) {
    if (!url) return false;
    try {
      const u = new URL(url);
      // Aceita apenas http(s) e termina com extensão de imagem comum
      return /^https?:$/.test(u.protocol) &&
        /\.(png|jpg|jpeg|gif|webp)$/i.test(u.pathname);
    } catch {
      return false;
    }
  }
  
  module.exports = { validateURL };
  