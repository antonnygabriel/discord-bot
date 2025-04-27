// src/commands/owner/leaveGuild.js
/**
 * Comando LeaveGuild - Faz o bot sair de um servidor específico
 * 
 * Este comando permite ao dono do bot fazer o bot sair de um servidor específico
 * através do ID do servidor.
 * 
 * @module commands/owner/leaveGuild
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwner, notOwnerEmbed, errorEmbed, successEmbed } = require('../../utils/ownerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaveguild')
    .setDescription('Faz o bot sair de um servidor específico (apenas owner)')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('ID do servidor para sair')
        .setRequired(true))
    .addBooleanOption(option =>
      option
        .setName('confirmação')
        .setDescription('Confirmar saída do servidor')
        .setRequired(true)),
  
  cooldown: 10,
  category: 'owner',
  
  /**
   * Executa o comando leaveguild
   * @param {Client} client - Cliente do Discord
   * @param {CommandInteraction} interaction - Interação do comando
   */
  async execute(client, interaction) {
    // Verifica se o usuário é um owner autorizado
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ embeds: [notOwnerEmbed()], ephemeral: true });
    }
    
    const guildId = interaction.options.getString('id');
    const confirmation = interaction.options.getBoolean('confirmação');
    
    if (!confirmation) {
      const cancelEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('⚠️ Operação Cancelada')
        .setDescription('Saída do servidor cancelada pelo usuário.')
        .setTimestamp();
      
      return interaction.reply({ embeds: [cancelEmbed] });
    }
    
    try {
      // Busca o servidor pelo ID
      const guild = client.guilds.cache.get(guildId);
      
      if (!guild) {
        const notFoundEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Servidor Não Encontrado')
          .setDescription(`Não foi encontrado nenhum servidor com o ID \`${guildId}\`.`)
          .setTimestamp();
        
        return interaction.reply({ embeds: [notFoundEmbed] });
      }
      
      // Armazena informações do servidor antes de sair
      const guildName = guild.name;
      const guildMemberCount = guild.memberCount;
      
      // Sai do servidor
      await guild.leave();
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Servidor Deixado')
        .setDescription(`O bot saiu do servidor **${guildName}** com sucesso.`)
        .addFields(
          { name: 'ID do Servidor', value: `\`${guildId}\`` },
          { name: 'Membros', value: `${guildMemberCount}` }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [successEmbed] });
      
    } catch (error) {
      console.error(`[ERRO][LeaveGuild] Falha ao sair do servidor:`, error);
      await interaction.reply({ embeds: [errorEmbed(error)] });
    }
  }
};
