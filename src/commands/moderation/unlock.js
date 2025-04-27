// src/commands/admin/unlock.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Destranca um canal para que membros possam enviar mensagens novamente')
    .addChannelOption(option => 
      option
        .setName('canal')
        .setDescription('O canal que será destrancado (padrão: canal atual)')
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText))
    .addStringOption(option => 
      option
        .setName('motivo')
        .setDescription('Motivo do destrancamento')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ManageChannels'],
  botPermissions: ['ManageChannels'],
  
  async execute(client, interaction) {
    // Obtém o canal e o motivo
    const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';
    
    // Verifica permissões do usuário
    if (!await PermissionUtil.checkUserPermissions(interaction, this.userPermissions)) return;
    
    // Verifica permissões do bot
    if (!await PermissionUtil.checkBotPermissions(interaction, this.botPermissions)) return;
    
    try {
      // Verifica se o canal é um canal de texto
      if (targetChannel.type !== ChannelType.GuildText) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription('Apenas canais de texto podem ser destrancados.')
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Obtém o cargo @everyone
      const everyoneRole = interaction.guild.roles.everyone;
      
      // Verifica se o canal está trancado
      const currentPerms = targetChannel.permissionOverwrites.cache.get(everyoneRole.id);
      if (!currentPerms || !currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`O canal ${targetChannel} não está trancado.`)
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Destranca o canal
      await targetChannel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: null // Remove a sobrescrita de permissão
      }, { reason: `${interaction.user.tag}: ${reason}` });
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔓 Canal Destrancado')
        .setDescription(`O canal ${targetChannel} foi destrancado. Membros podem enviar mensagens novamente.`)
        .addFields(
          { name: 'Destrancado por', value: interaction.user.tag },
          { name: 'Motivo', value: reason }
        )
        .setTimestamp();
      
      // Responde à interação
      await interaction.reply({ embeds: [successEmbed] });
      
      // Envia uma mensagem no canal destrancado, se for diferente do canal atual
      if (targetChannel.id !== interaction.channel.id) {
        const channelEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🔓 Canal Destrancado')
          .setDescription(`Este canal foi destrancado por ${interaction.user.tag}.`)
          .addFields({ name: 'Motivo', value: reason })
          .setTimestamp();
        
        await targetChannel.send({ embeds: [channelEmbed] });
      }
      
    } catch (error) {
      // Trata erros inesperados
      console.error(`Erro ao destrancar canal:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao tentar destrancar o canal ${targetChannel}.`)
        .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
