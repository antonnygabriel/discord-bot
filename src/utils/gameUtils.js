// src/utils/gameUtils.js
/**
 * Utilitários para comandos de jogos
 * @module utils/gameUtils
 */

const { EmbedBuilder } = require('discord.js');

// Armazena jogos ativos por canal
const activeGames = new Map();

/**
 * Verifica se há um jogo ativo no canal
 * @param {string} channelId - ID do canal
 * @param {string} gameType - Tipo de jogo
 * @returns {boolean} Se há um jogo ativo
 */
function hasActiveGame(channelId, gameType) {
  const key = `${channelId}-${gameType}`;
  return activeGames.has(key);
}

/**
 * Registra um jogo ativo no canal
 * @param {string} channelId - ID do canal
 * @param {string} gameType - Tipo de jogo
 * @param {Object} gameData - Dados do jogo
 */
function registerGame(channelId, gameType, gameData) {
  const key = `${channelId}-${gameType}`;
  activeGames.set(key, gameData);
}

/**
 * Remove um jogo ativo do canal
 * @param {string} channelId - ID do canal
 * @param {string} gameType - Tipo de jogo
 */
function removeGame(channelId, gameType) {
  const key = `${channelId}-${gameType}`;
  activeGames.delete(key);
}

/**
 * Obtém um jogo ativo no canal
 * @param {string} channelId - ID do canal
 * @param {string} gameType - Tipo de jogo
 * @returns {Object|null} Dados do jogo ou null se não existir
 */
function getGame(channelId, gameType) {
  const key = `${channelId}-${gameType}`;
  return activeGames.get(key) || null;
}

/**
 * Cria um embed de jogo com estilo consistente
 * @param {string} title - Título do embed
 * @param {string} description - Descrição do embed
 * @param {string} color - Cor do embed em hexadecimal
 * @returns {EmbedBuilder} Embed formatado
 */
function createGameEmbed(title, description, color = '#0099FF') {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Cria um embed de vitória
 * @param {string} winner - Nome do vencedor
 * @param {string} gameTitle - Título do jogo
 * @param {string} message - Mensagem adicional
 * @returns {EmbedBuilder} Embed de vitória
 */
function createWinEmbed(winner, gameTitle, message = '') {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle(`🏆 ${winner} venceu em ${gameTitle}!`)
    .setDescription(message)
    .setTimestamp();
}

/**
 * Cria um embed de empate
 * @param {string} gameTitle - Título do jogo
 * @param {string} message - Mensagem adicional
 * @returns {EmbedBuilder} Embed de empate
 */
function createTieEmbed(gameTitle, message = '') {
  return new EmbedBuilder()
    .setColor('#FFFF00')
    .setTitle(`🤝 Empate em ${gameTitle}!`)
    .setDescription(message)
    .setTimestamp();
}

/**
 * Cria um embed de timeout
 * @param {string} gameTitle - Título do jogo
 * @returns {EmbedBuilder} Embed de timeout
 */
function createTimeoutEmbed(gameTitle) {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle(`⏱️ Tempo Esgotado`)
    .setDescription(`O jogo ${gameTitle} foi cancelado por inatividade.`)
    .setTimestamp();
}

module.exports = {
  hasActiveGame,
  registerGame,
  removeGame,
  getGame,
  createGameEmbed,
  createWinEmbed,
  createTieEmbed,
  createTimeoutEmbed
};
