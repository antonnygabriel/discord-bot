// src/commands/utility/ping.js
const { SlashCommandBuilder } = require('discord.js');
const EmbedUtil = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Responde com o ping do bot'),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias (opcional)
  userPermissions: [],
  botPermissions: [],
  
  async execute(client, interaction) {
    // Resposta inicial
    const sent = await interaction.reply({ 
      embeds: [EmbedUtil.info('Ping', 'Calculando ping...')],
      fetchReply: true 
    });
    
    // Calcula o ping
    const pingLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);
    
    // Atualiza a resposta com os valores calculados
    await interaction.editReply({
      embeds: [
        EmbedUtil.info('Ping', 
          `🏓 Pong!\n\n**Latência do Bot:** ${pingLatency}ms\n**Latência da API:** ${apiLatency}ms`)
      ]
    });
  }
};
