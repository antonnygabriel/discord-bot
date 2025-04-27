// src/commands/utility/botinfo.js
const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Mostra informações sobre o bot'),
  
  cooldown: 10,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Adia a resposta para ter tempo de coletar os dados
      await interaction.deferReply();
      
      // Calcula o uptime
      const uptime = formatUptime(client.uptime);
      
      // Coleta estatísticas
      const serverCount = client.guilds.cache.size;
      const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
      const channelCount = client.channels.cache.size;
      
      // Informações do sistema
      const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const cpuModel = os.cpus()[0].model;
      const cpuCores = os.cpus().length;
      const nodeVersion = process.version;
      const discordJsVersion = version;
      
      // Cria o embed com as informações
      const botEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`Informações sobre ${client.user.username}`)
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: '🤖 Bot', value: 
            `**Nome:** ${client.user.tag}\n` +
            `**ID:** ${client.user.id}\n` +
            `**Criado em:** <t:${Math.floor(client.user.createdTimestamp / 1000)}:F>\n` +
            `**Uptime:** ${uptime}`
          },
          { name: '📊 Estatísticas', value: 
            `**Servidores:** ${serverCount}\n` +
            `**Usuários:** ${userCount}\n` +
            `**Canais:** ${channelCount}\n` +
            `**Ping:** ${client.ws.ping}ms`
          },
          { name: '💻 Sistema', value: 
            `**Memória:** ${memoryUsage} MB\n` +
            `**CPU:** ${cpuModel} (${cpuCores} cores)\n` +
            `**Node.js:** ${nodeVersion}\n` +
            `**Discord.js:** v${discordJsVersion}`
          }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [botEmbed] });
    } catch (error) {
      console.error('Erro no comando botinfo:', error);
      await interaction.editReply({ 
        content: 'Ocorreu um erro ao buscar informações do bot.', 
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
