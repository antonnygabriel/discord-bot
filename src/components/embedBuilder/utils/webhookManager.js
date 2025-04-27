// src/components/embedBuilder/utils/webhookManager.js
const fetch = require('node-fetch');

/**
 * Valida se a URL fornecida é um webhook do Discord válido e ativo.
 * @param {string} url - URL do webhook.
 * @returns {Promise<boolean>} True se for válido, false caso contrário.
 */
async function validateWebhook(url) {
  try {
    if (
      !/^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/i.test(url)
    ) {
      return false;
    }
    const res = await fetch(url, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Envia uma embed ou mensagem via webhook do Discord.
 * @param {string} url - URL do webhook.
 * @param {object} payload - Payload (ex: { content, embeds, username, avatar_url }).
 * @returns {Promise<boolean>} True se enviado com sucesso, false se erro.
 */
async function sendWebhook(url, payload) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = {
  validateWebhook,
  sendWebhook
};
