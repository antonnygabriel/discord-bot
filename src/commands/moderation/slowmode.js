// src/commands/admin/slowmode.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Define um tempo de "modo lento" em um canal')
    .addIntegerOption(option => 
      option
        .setName('segundos')
        .setDescription('Tempo em segundos (0 para desativar, máximo 21600 = 6 horas)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600))
    .addChannelOption(option => 
      option
        .setName('canal')
        .setDescription('O canal para definir o modo lento (padrão: canal atual)')
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText))
    .addStringOption(option => 
      option
        .setName('motivo')
        .setDescription('Motivo para alterar o modo lento')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ManageChannels'],
  botPermissions: ['ManageChannels'],
  
  async execute(client, interaction) {
    // Obtém os parâmetros do comando
    const seconds = interaction.options.getInteger('segundos');
    const channel = interaction.options.getChannel('canal') || interaction.channel;
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';
    
    // Verifica permissões do usuário
    if (!await PermissionUtil.checkUserPermissions(interaction, this.userPermissions)) return;
    
    // Verifica permissões do bot
    if (!await PermissionUtil.checkBotPermissions(interaction, this.botPermissions)) return;
    
    try {
      // Verifica se o canal é um canal de texto
      if (channel.type !== ChannelType.GuildText) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription('O modo lento só pode ser definido em canais de texto.')
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Define o modo lento no canal
      await channel.setRateLimitPerUser(seconds, `${interaction.user.tag}: ${reason}`);
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(seconds > 0 ? '⏱️ Modo Lento Ativado' : '⏱️ Modo Lento Desativado')
        .setTimestamp();
      
      if (seconds > 0) {
        // Formata o tempo para exibição
        let timeDisplay;
        if (seconds < 60) {
          timeDisplay = `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
        } else if (seconds < 3600) {
          const minutes = Math.floor(seconds / 60);
          timeDisplay = `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        } else {
          const hours = Math.floor(seconds / 3600);
          timeDisplay = `${hours} hora${hours !== 1 ? 's' : ''}`;
        }
        
        successEmbed.setDescription(`Modo lento definido para ${timeDisplay} no canal ${channel}.`);
      } else {
        successEmbed.setDescription(`Modo lento desativado no canal ${channel}.`);
      }
      
      successEmbed.addFields({ name: 'Motivo', value: reason });
      
      // Responde à interação
      await interaction.reply({ embeds: [successEmbed] });
      
      // Se o canal for diferente do canal atual, envia uma notificação nele
      if (channel.id !== interaction.channel.id) {
        const notificationEmbed = new EmbedBuilder()
          .setColor('#0099FF')
          .setTitle(seconds > 0 ? '⏱️ Modo Lento Ativado' : '⏱️ Modo Lento Desativado')
          .setDescription(seconds > 0 
            ? `${interaction.user.tag} definiu o modo lento deste canal para ${seconds} segundos.`
            : `${interaction.user.tag} desativou o modo lento deste canal.`)
          .addFields({ name: 'Motivo', value: reason })
          .setTimestamp();
        
        await channel.send({ embeds: [notificationEmbed] });
      }
      
    } catch (error) {
      // Trata erros inesperados
      console.error(`Erro ao definir modo lento:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao tentar definir o modo lento no canal ${channel}.`)
        .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
