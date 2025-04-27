// Utils para criar embeds 
// src/utils/embeds.js
const { EmbedBuilder } = require('discord.js');

/**
 * Utilitário para criar embeds com estilo consistente
 */
class EmbedUtil {
  /**
   * Cria um embed de sucesso
   * @param {string} title - Título do embed
   * @param {string} description - Descrição do embed
   * @returns {EmbedBuilder} Embed formatado
   */
  static success(title, description) {
    return new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`✅ ${title}`)
      .setDescription(description)
      .setTimestamp();
  }
  
  /**
   * Cria um embed de erro
   * @param {string} title - Título do embed
   * @param {string} description - Descrição do embed
   * @returns {EmbedBuilder} Embed formatado
   */
  static error(title, description) {
    return new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(`❌ ${title}`)
      .setDescription(description)
      .setTimestamp();
  }
  
  /**
   * Cria um embed de informação
   * @param {string} title - Título do embed
   * @param {string} description - Descrição do embed
   * @returns {EmbedBuilder} Embed formatado
   */
  static info(title, description) {
    return new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle(`ℹ️ ${title}`)
      .setDescription(description)
      .setTimestamp();
  }
  
  /**
   * Cria um embed de aviso
   * @param {string} title - Título do embed
   * @param {string} description - Descrição do embed
   * @returns {EmbedBuilder} Embed formatado
   */
  static warning(title, description) {
    return new EmbedBuilder()
      .setColor('#FFFF00')
      .setTitle(`⚠️ ${title}`)
      .setDescription(description)
      .setTimestamp();
  }
  
  /**
   * Cria um embed personalizado
   * @param {Object} options - Opções do embed
   * @returns {EmbedBuilder} Embed personalizado
   */
  static custom(options) {
    const embed = new EmbedBuilder();
    
    if (options.color) embed.setColor(options.color);
    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.author) embed.setAuthor(options.author);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.footer) embed.setFooter(options.footer);
    if (options.timestamp) embed.setTimestamp();
    if (options.fields) embed.addFields(options.fields);
    
    return embed;
  }
}

module.exports = EmbedUtil;
