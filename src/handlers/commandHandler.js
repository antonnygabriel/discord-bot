// src/handlers/commandHandler.js
const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Carrega todos os comandos das pastas de categorias
 * @param {Client} client - Cliente do Discord
 */
module.exports = async (client) => {
  // Caminho para a pasta de comandos
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFolders = fs.readdirSync(commandsPath);
  
  // Percorre todas as pastas de categorias
  for (const folder of commandFolders) {
    const categoryPath = path.join(commandsPath, folder);
    
    // Verifica se é um diretório
    if (!fs.statSync(categoryPath).isDirectory()) continue;
    
    // Lê todos os arquivos de comando na categoria
    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const command = require(filePath);
      
      // Valida se o comando tem as propriedades necessárias
      if (!command.data || !command.execute) {
        logger.warn(`O comando em ${filePath} está faltando propriedades obrigatórias 'data' ou 'execute'`);
        continue;
      }
      
      // Adiciona a categoria ao comando
      command.category = folder;
      
      // Registra o comando na coleção
      client.commands.set(command.data.name, command);
      logger.info(`Comando carregado: ${command.data.name} (${folder})`);
    }
  }
  
  logger.success(`Total de ${client.commands.size} comandos carregados`);
};