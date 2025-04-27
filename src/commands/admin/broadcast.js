// src/commands/owner/broadcast.js
/**
 * Comando Broadcast - Envia uma mensagem para todos os servidores
 * 
 * Este comando permite ao dono do bot enviar uma mensagem embedada para um canal específico
 * em todos os servidores em que o bot está presente.
 * 
 * @module commands/owner/broadcast
 */

const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { isOwner, notOwnerEmbed, errorEmbed } = require('../../utils/ownerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('Envia uma mensagem para todos os servidores (apenas owner)')
    .addStringOption(option =>
      option
        .setName('título')
        .setDescription('Título da mensagem')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('mensagem')
        .setDescription('Conteúdo da mensagem')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('canal')
        .setDescription('Nome do canal para enviar (ex: "anúncios", "geral")')
        .setRequired(true))
    .addBooleanOption(option =>
      option
        .setName('confirmação')
        .setDescription('Confirmar envio da mensagem')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('cor')
        .setDescription('Cor do embed em formato hexadecimal (ex: #FF0000)')
        .setRequired(false))
    .addStringOption(option =>
      option
        .setName('imagem')
        .setDescription('URL da imagem para incluir no embed')
        .setRequired(false)),
  
  cooldown: 60, // Cooldown longo para evitar spam
  category: 'owner',
  
  /**
   * Executa o comando broadcast
   * @param {Client} client - Cliente do Discord
   * @param {CommandInteraction} interaction - Interação do comando
   */
  async execute(client, interaction) {
    // Verifica se o usuário é um owner autorizado
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ embeds: [notOwnerEmbed()], ephemeral: true });
    }
    
    const title = interaction.options.getString('título');
    const message = interaction.options.getString('mensagem');
    const channelName = interaction.options.getString('canal').toLowerCase();
    const confirmation = interaction.options.getBoolean('confirmação');
    const color = interaction.options.getString('cor') || '#0099FF';
    const imageUrl = interaction.options.getString('imagem');
    
    if (!confirmation) {
      const cancelEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('⚠️ Operação Cancelada')
        .setDescription('Broadcast cancelado pelo usuário.')
        .setTimestamp();
      
      return interaction.reply({ embeds: [cancelEmbed] });
    }
    
    try {
      await interaction.deferReply();
      
      // Valida a cor
      const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
      if (!colorRegex.test(color)) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Cor Inválida')
          .setDescription('A cor deve estar em formato hexadecimal (ex: #FF0000).')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }
      
      // Cria o embed para broadcast
      const broadcastEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(message)
        .setFooter({ text: `Mensagem enviada pelo dono do bot` })
        .setTimestamp();
      
      // Adiciona imagem se fornecida
      if (imageUrl) {
        broadcastEmbed.setImage(imageUrl);
      }
      
      // Obtém todos os servidores
      const guilds = client.guilds.cache;
      
      // Estatísticas de envio
      const stats = {
        total: guilds.size,
        success: 0,
        failed: 0,
        skipped: 0,
        errors: []
      };
      
      // Envia a mensagem para cada servidor
      for (const guild of guilds.values()) {
        try {
          // Encontra um canal com o nome especificado
          const channel = guild.channels.cache.find(ch => 
            ch.type === ChannelType.GuildText && 
            (ch.name.toLowerCase() === channelName || ch.name.toLowerCase().includes(channelName))
          );
          
          if (!channel) {
            stats.skipped++;
            stats.errors.push(`${guild.name}: Canal não encontrado`);
            continue;
          }
          
          // Verifica permissões do bot no canal
          if (!channel.permissionsFor(guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
            stats.skipped++;
            stats.errors.push(`${guild.name}: Sem permissão para enviar mensagens`);
            continue;
          }
          
          // Envia a mensagem
          await channel.send({ embeds: [broadcastEmbed] });
          stats.success++;
          
        } catch (error) {
          stats.failed++;
          stats.errors.push(`${guild.name}: ${error.message}`);
        }
      }
      
      // Cria o embed de resultado
      const resultEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('📢 Broadcast Concluído')
        .setDescription(`Mensagem enviada para os servidores.`)
        .addFields(
          { name: 'Total de Servidores', value: `${stats.total}`, inline: true },
          { name: 'Enviados com Sucesso', value: `${stats.success}`, inline: true },
          { name: 'Falhas', value: `${stats.failed + stats.skipped}`, inline: true }
        )
        .setTimestamp();
      
      // Adiciona detalhes de erros, se houver
      if (stats.errors.length > 0) {
        const errorDetails = stats.errors.slice(0, 10).join('\n');
        resultEmbed.addFields({
          name: 'Detalhes de Falhas (10 primeiras)',
          value: errorDetails.length > 1024 ? errorDetails.slice(0, 1021) + '...' : errorDetails
        });
      }
      
      await interaction.editReply({ embeds: [resultEmbed] });
      
    } catch (error) {
      console.error(`[ERRO][Broadcast] Falha ao enviar broadcast:`, error);
      await interaction.editReply({ embeds: [errorEmbed(error)] });
    }
  }
};
