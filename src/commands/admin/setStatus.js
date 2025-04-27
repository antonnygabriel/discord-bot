// src/commands/owner/setStatus.js
/**
 * Comando SetStatus - Altera o status do bot
 * 
 * Este comando permite ao dono do bot alterar o status de presença e o tipo de atividade
 * do bot, como online/dnd/idle e playing/watching/listening/competing.
 * 
 * @module commands/owner/setStatus
 */

const { SlashCommandBuilder, EmbedBuilder, ActivityType } = require('discord.js');
const { isOwner, notOwnerEmbed, errorEmbed, successEmbed } = require('../../utils/ownerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setarstatusdobot')
    .setDescription('Altera o status do bot (apenas owner)')
    .addStringOption(option =>
      option
        .setName('status')
        .setDescription('Status de presença do bot')
        .setRequired(true)
        .addChoices(
          { name: 'Online', value: 'online' },
          { name: 'Ausente', value: 'idle' },
          { name: 'Não Perturbe', value: 'dnd' },
          { name: 'Invisível', value: 'invisible' }
        ))
    .addStringOption(option =>
      option
        .setName('tipo')
        .setDescription('Tipo de atividade')
        .setRequired(true)
        .addChoices(
          { name: 'Jogando', value: 'playing' },
          { name: 'Transmitindo', value: 'streaming' },
          { name: 'Ouvindo', value: 'listening' },
          { name: 'Assistindo', value: 'watching' },
          { name: 'Competindo', value: 'competing' },
          { name: 'Nenhum', value: 'none' }
        ))
    .addStringOption(option =>
      option
        .setName('texto')
        .setDescription('Texto da atividade')
        .setRequired(false))
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription('URL para streaming (apenas para tipo "Transmitindo")')
        .setRequired(false)),
  
  cooldown: 5,
  category: 'owner',
  
  /**
   * Executa o comando setstatus
   * @param {Client} client - Cliente do Discord
   * @param {CommandInteraction} interaction - Interação do comando
   */
  async execute(client, interaction) {
    // Verifica se o usuário é um owner autorizado
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ embeds: [notOwnerEmbed()], ephemeral: true });
    }
    
    const status = interaction.options.getString('status');
    const activityType = interaction.options.getString('tipo');
    const activityText = interaction.options.getString('texto');
    const streamUrl = interaction.options.getString('url');
    
    try {
      // Define o status de presença
      await client.user.setStatus(status);
      
      // Define a atividade, se solicitada
      if (activityType !== 'none') {
        const activityTypeMap = {
          playing: ActivityType.Playing,
          streaming: ActivityType.Streaming,
          listening: ActivityType.Listening,
          watching: ActivityType.Watching,
          competing: ActivityType.Competing
        };
        
        const activityOptions = {
          type: activityTypeMap[activityType],
          name: activityText || 'algo incrível'
        };
        
        // Adiciona URL para streaming, se fornecida
        if (activityType === 'streaming' && streamUrl) {
          activityOptions.url = streamUrl;
        }
        
        await client.user.setActivity(activityOptions);
      } else {
        // Remove a atividade
        await client.user.setActivity(null);
      }
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Status Alterado')
        .setDescription('O status do bot foi alterado com sucesso.')
        .addFields(
          { name: 'Status', value: this.getStatusEmoji(status) + ' ' + this.getStatusName(status) },
          { name: 'Atividade', value: activityType !== 'none' 
            ? `${this.getActivityEmoji(activityType)} ${this.getActivityName(activityType)} ${activityText || 'algo incrível'}`
            : 'Nenhuma atividade'
          }
        )
        .setFooter({ text: `Alterado por ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [successEmbed] });
      
    } catch (error) {
      console.error(`[ERRO][SetStatus] Falha ao alterar status:`, error);
      await interaction.reply({ embeds: [errorEmbed(error)] });
    }
  },
  
  /**
   * Obtém o emoji correspondente ao status
   * @param {string} status - Status de presença
   * @returns {string} Emoji do status
   */
  getStatusEmoji(status) {
    switch (status) {
      case 'online': return '🟢';
      case 'idle': return '🟡';
      case 'dnd': return '🔴';
      case 'invisible': return '⚪';
      default: return '⚫';
    }
  },
  
  /**
   * Obtém o nome formatado do status
   * @param {string} status - Status de presença
   * @returns {string} Nome formatado
   */
  getStatusName(status) {
    switch (status) {
      case 'online': return 'Online';
      case 'idle': return 'Ausente';
      case 'dnd': return 'Não Perturbe';
      case 'invisible': return 'Invisível';
      default: return 'Desconhecido';
    }
  },
  
  /**
   * Obtém o emoji correspondente ao tipo de atividade
   * @param {string} activityType - Tipo de atividade
   * @returns {string} Emoji da atividade
   */
  getActivityEmoji(activityType) {
    switch (activityType) {
      case 'playing': return '🎮';
      case 'streaming': return '📺';
      case 'listening': return '🎵';
      case 'watching': return '👀';
      case 'competing': return '🏆';
      default: return '❓';
    }
  },
  
  /**
   * Obtém o nome formatado do tipo de atividade
   * @param {string} activityType - Tipo de atividade
   * @returns {string} Nome formatado
   */
  getActivityName(activityType) {
    switch (activityType) {
      case 'playing': return 'Jogando';
      case 'streaming': return 'Transmitindo';
      case 'listening': return 'Ouvindo';
      case 'watching': return 'Assistindo';
      case 'competing': return 'Competindo em';
      default: return '';
    }
  }
};
