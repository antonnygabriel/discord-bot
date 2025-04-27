// src/events/ready.js
const { Events } = require('discord.js');
const { logger } = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    logger.success(`Bot online! Logado como ${client.user.tag}`);
    
    // Define o status do bot
    // client.user.setPresence({
    //   activities: [{ name: '/help', type: 3 }], // 3 = Assistindo
    //   status: 'online'
    // });
    
    // Log de estatísticas
    logger.info(`Servindo ${client.guilds.cache.size} servidores`);
    logger.info(`Total de ${client.users.cache.size} usuários`);
  }
};
