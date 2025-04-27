// src/utils/ownerUtils.js
/**
 * Utilitários para verificação de owner e segurança
 * @module utils/ownerUtils
 */

const { EmbedBuilder } = require('discord.js');
require('dotenv').config();


/**
 * Verifica se o usuário é um owner autorizado
 * @param {string} userId - ID do usuário a verificar
 * @returns {boolean} Se o usuário é um owner autorizado
 */
function isOwner(userId) {
  // Obtém os IDs de owner do config ou .env
  const ownerIds = process.env.OWNER_IDS?.split(',') || [];
  return ownerIds.includes(userId);
}

/**
 * Cria um embed de erro para usuários não autorizados
 * @returns {EmbedBuilder} Embed de erro
 */
function notOwnerEmbed() {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('⛔ Acesso Negado')
    .setDescription('Este comando é exclusivo para o dono do bot.')
    .setTimestamp();
}

/**
 * Cria um embed de erro genérico
 * @param {Error} error - Objeto de erro
 * @returns {EmbedBuilder} Embed de erro formatado
 */
function errorEmbed(error) {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('❌ Erro')
    .setDescription(`Ocorreu um erro durante a execução do comando.`)
    .addFields({ name: 'Detalhes', value: `\`\`\`js\n${error.message}\`\`\`` })
    .setTimestamp();
}

/**
 * Cria um embed de sucesso
 * @param {string} title - Título do embed
 * @param {string} description - Descrição do embed
 * @returns {EmbedBuilder} Embed de sucesso
 */
function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Cria um embed informativo
 * @param {string} title - Título do embed
 * @param {string} description - Descrição do embed
 * @returns {EmbedBuilder} Embed informativo
 */
function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor('#0099FF')
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Sanitiza a saída para remover informações sensíveis
 * @param {string} output - Saída a ser sanitizada
 * @returns {string} Saída sanitizada
 */
function sanitizeOutput(output) {
  if (typeof output !== 'string') return output;
  
  return output
    // Remove tokens do Discord
    .replace(/[\w-]{24}\.[\w-]{6}\.[\w-]{27}/g, '[TOKEN REDACTED]')
    .replace(/[\w-]{24}\.[\w-]{6}\.[\w-]{38}/g, '[TOKEN REDACTED]')
    // Remove outras informações sensíveis
    .replace(/process\.env\.[A-Z_]+/g, '[ENV REDACTED]')
    .replace(/config\.token/gi, '[TOKEN REDACTED]')
    .replace(/client\.token/gi, '[TOKEN REDACTED]');
}

module.exports = { 
  isOwner, 
  notOwnerEmbed, 
  errorEmbed, 
  successEmbed, 
  infoEmbed,
  sanitizeOutput
};
