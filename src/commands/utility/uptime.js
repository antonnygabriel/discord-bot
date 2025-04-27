// src/commands/utility/uptime.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Mostra há quanto tempo o bot está online'),
  
  cooldown: 5,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Calcula o uptime
      const uptime = formatUptime(client.uptime);
      
      // Calcula quando o bot foi iniciado
      const startTimestamp = Date.now() - client.uptime;
      const startedAt = `<t:${Math.floor(startTimestamp / 1000)}:F>`;
      const startedRelative = `<t:${Math.floor(startTimestamp / 1000)}:R>`;
      
      // Cria o embed com as informações
      const uptimeEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`⏱️ Uptime de ${client.user.username}`)
        .addFields(
          { name: '🕒 Tempo Online', value: uptime },
          { name: '🚀 Iniciado em', value: `${startedAt}\n${startedRelative}` }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [uptimeEmbed] });
    } catch (error) {
      console.error('Erro no comando uptime:', error);
      await interaction.reply({ 
        content: 'Ocorreu um erro ao verificar o uptime do bot.', 
        ephemeral: true 
      });
    }
  }
};

// Função para formatar o uptime
function formatUptime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  const parts = [];
  if (days > 0) parts.push(`${days} dia${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minuto${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0) parts.push(`${seconds} segundo${seconds !== 1 ? 's' : ''}`);
  
  return parts.join(', ');
}
