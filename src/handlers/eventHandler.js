// src/handlers/eventHandler.js
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Carrega todos os eventos do bot
 * @param {Client} client - Cliente do Discord
 */
module.exports = async (client) => {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    // Verifica se o evento deve ser executado uma vez ou várias vezes
    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args) => event.execute(client, ...args));
    }
    
    logger.info(`Evento carregado: ${event.name}`);
  }
  
  logger.success(`Total de ${eventFiles.length} eventos carregados`);
};
