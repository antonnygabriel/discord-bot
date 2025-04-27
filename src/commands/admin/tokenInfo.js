// src/commands/owner/tokenInfo.js
/**
 * Comando TokenInfo - Exibe informações básicas sobre o token do bot
 * 
 * Este comando permite ao dono do bot visualizar informações básicas sobre o token do bot,
 * como ID do bot, nome, uptime e versão da biblioteca, sem nunca exibir o token diretamente.
 * 
 * @module commands/owner/tokenInfo
 */

const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const { isOwner, notOwnerEmbed, errorEmbed } = require('../../utils/ownerUtils');
const os = require('os');
const packageJson = require('../../../package.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tokeninfo')
    .setDescription('Exibe informações básicas sobre o token do bot (apenas owner)'),
  
  cooldown: 10,
  category: 'owner',
  
  /**
   * Executa o comando tokeninfo
   * @param {Client} client - Cliente do Discord
   * @param {CommandInteraction} interaction - Interação do comando
   */
  async execute(client, interaction) {
    // Verifica se o usuário é um owner autorizado
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ embeds: [notOwnerEmbed()], ephemeral: true });
    }
    
    try {
      // Obtém informações do token de forma segura
      const tokenInfo = this.getTokenInfo(client);
      
      // Cria o embed com as informações
      const infoEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('🔑 Informações do Bot')
        .addFields(
          { name: 'ID da Aplicação', value: `\`${client.user.id}\`` },
          { name: 'Nome do Bot', value: client.user.tag },
          { name: 'Tipo de Token', value: tokenInfo.type },
          { name: 'Data de Criação', value: tokenInfo.creationDate },
          { name: 'Tempo Online', value: tokenInfo.uptime },
          { name: 'Versão do Discord.js', value: `v${version}` },
          { name: 'Versão do Node.js', value: process.version },
          { name: 'Versão do Bot', value: packageJson.version || 'Desconhecida' },
          { name: 'Sistema Operacional', value: `${os.type()} ${os.release()} (${os.arch()})` },
          { name: 'Uso de Memória', value: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB` }
        )
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'Estas informações são seguras para compartilhar' })
        .setTimestamp();
      
      await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
      
    } catch (error) {
      console.error(`[ERRO][TokenInfo] Falha ao exibir informações:`, error);
      await interaction.reply({ embeds: [errorEmbed(error)], ephemeral: true });
    }
  },
  
  /**
   * Obtém informações seguras sobre o token
   * @param {Client} client - Cliente do Discord
   * @returns {Object} Informações do token
   */
  getTokenInfo(client) {
    // Determina o tipo de token com base no ID do bot
    const botId = client.user.id;
    let tokenType = 'Bot';
    
    // Verifica se é um token de bot ou de usuário
    if (client.user.bot) {
      tokenType = 'Bot';
    } else {
      tokenType = 'Usuário (Não recomendado)';
    }
    
    // Calcula a data de criação do ID do Discord (Snowflake)
    const creationTimestamp = this.getTimestampFromSnowflake(botId);
    const creationDate = new Date(creationTimestamp).toLocaleString();
    
    // Calcula o tempo online
    const uptime = this.formatUptime(client.uptime);
    
    return {
      type: tokenType,
      creationDate,
      uptime
    };
  },
  
  /**
   * Obtém o timestamp de um Snowflake do Discord
   * @param {string} snowflake - ID do Discord (Snowflake)
   * @returns {number} Timestamp em milissegundos
   */
  getTimestampFromSnowflake(snowflake) {
    // O primeiro bit é reservado, então deslocamos 22 bits para a direita
    // e adicionamos a época do Discord (1º de janeiro de 2015)
    return Number(BigInt(snowflake) >> 22n) + 1420070400000;
  },
  
  /**
   * Formata o tempo de atividade do bot
   * @param {number} uptime - Tempo de atividade em milissegundos
   * @returns {string} Tempo formatado
   */
  formatUptime(uptime) {
    const totalSeconds = Math.floor(uptime / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days} dia${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minuto${minutes !== 1 ? 's' : ''}`);
    if (seconds > 0) parts.push(`${seconds} segundo${seconds !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
  }
};
