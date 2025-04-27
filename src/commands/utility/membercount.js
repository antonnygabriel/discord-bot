// src/commands/utility/membercount.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('membercount')
    .setDescription('Mostra o número de membros no servidor'),
  
  cooldown: 5,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Adia a resposta para ter tempo de coletar os dados
      await interaction.deferReply();
      
      // Busca todos os membros do servidor
      await interaction.guild.members.fetch();
      
      // Conta os membros
      const totalMembers = interaction.guild.memberCount;
      const botCount = interaction.guild.members.cache.filter(member => member.user.bot).size;
      const humanCount = totalMembers - botCount;
      
      // Conta os membros online, offline, etc.
      const onlineCount = interaction.guild.members.cache.filter(member => member.presence?.status === 'online').size;
      const idleCount = interaction.guild.members.cache.filter(member => member.presence?.status === 'idle').size;
      const dndCount = interaction.guild.members.cache.filter(member => member.presence?.status === 'dnd').size;
      const offlineCount = interaction.guild.members.cache.filter(member => !member.presence || member.presence.status === 'offline').size;
      
      // Cria o embed com as informações
      const countEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`👥 Contagem de Membros: ${interaction.guild.name}`)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .addFields(
          { name: '📊 Total', value: `${totalMembers} membros`, inline: false },
          { name: '👤 Humanos', value: `${humanCount}`, inline: true },
          { name: '🤖 Bots', value: `${botCount}`, inline: true },
          { name: '\u200B', value: '\u200B', inline: false }, // Espaçador
          { name: '🟢 Online', value: `${onlineCount}`, inline: true },
          { name: '🟡 Ausente', value: `${idleCount}`, inline: true },
          { name: '🔴 Não Perturbe', value: `${dndCount}`, inline: true },
          { name: '⚫ Offline', value: `${offlineCount}`, inline: true }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [countEmbed] });
    } catch (error) {
      console.error('Erro no comando membercount:', error);
      await interaction.editReply({ 
        content: 'Ocorreu um erro ao contar os membros do servidor.', 
        ephemeral: true 
      });
    }
  }
};
