// src/commands/admin/lock.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Tranca um canal para que membros não possam enviar mensagens')
    .addChannelOption(option => 
      option
        .setName('canal')
        .setDescription('O canal que será trancado (padrão: canal atual)')
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText))
    .addStringOption(option => 
      option
        .setName('motivo')
        .setDescription('Motivo do trancamento')
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
          .setDescription('Apenas canais de texto podem ser trancados.')
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Obtém o cargo @everyone
      const everyoneRole = interaction.guild.roles.everyone;
      
      // Verifica se o canal já está trancado
      const currentPerms = targetChannel.permissionOverwrites.cache.get(everyoneRole.id);
      if (currentPerms && currentPerms.deny.has(PermissionFlagsBits.SendMessages)) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`O canal ${targetChannel} já está trancado.`)
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Tranca o canal
      await targetChannel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: false
      }, { reason: `${interaction.user.tag}: ${reason}` });
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔒 Canal Trancado')
        .setDescription(`O canal ${targetChannel} foi trancado. Membros não podem mais enviar mensagens.`)
        .addFields(
          { name: 'Trancado por', value: interaction.user.tag },
          { name: 'Motivo', value: reason }
        )
        .setTimestamp();
      
      // Responde à interação
      await interaction.reply({ embeds: [successEmbed] });
      
      // Envia uma mensagem no canal trancado, se for diferente do canal atual
      if (targetChannel.id !== interaction.channel.id) {
        const channelEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🔒 Canal Trancado')
          .setDescription(`Este canal foi trancado por ${interaction.user.tag}.`)
          .addFields({ name: 'Motivo', value: reason })
          .setTimestamp();
        
        await targetChannel.send({ embeds: [channelEmbed] });
      }
      
    } catch (error) {
      // Trata erros inesperados
      console.error(`Erro ao trancar canal:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao tentar trancar o canal ${targetChannel}.`)
        .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
