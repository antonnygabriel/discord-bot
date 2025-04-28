const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

/**
 * Carrega todos os comandos das pastas de categorias (recursivo)
 * @param {Client} client - Cliente do Discord
 */
module.exports = async (client) => {
  client.commands = client.commands || new Map();

  // Função recursiva para carregar comandos de subpastas
  function loadCommandsFromDir(dir, category = null) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Nome da categoria é o nome da subpasta (ou mantenha a principal)
        loadCommandsFromDir(filePath, category || path.basename(dir));
      } else if (file.endsWith('.js')) {
        try {
          const command = require(filePath);

          // Validação das propriedades obrigatórias
          if (!command.data || !command.execute) {
            logger.warn(`O comando em ${filePath} está faltando propriedades obrigatórias 'data' ou 'execute'`);
            continue;
          }

          // Categoria: usa a pasta principal se não for subpasta, senão usa a subpasta
          command.category = category || path.basename(dir);

          // Adiciona caminho absoluto do arquivo para debug/sistemas avançados
          command.__filename = filePath;

          // Evita comandos duplicados
          if (client.commands.has(command.data.name)) {
            logger.warn(`Comando duplicado detectado: ${command.data.name} (${filePath}) - Ignorando.`);
            continue;
          }

          // Registra o comando
          client.commands.set(command.data.name, command);
          logger.info(`Comando carregado: ${command.data.name} (${command.category})`);
        } catch (err) {
          logger.error(`Erro ao carregar comando ${filePath}:`, err);
        }
      }
    }
  }

  // Caminho para a pasta de comandos
  const commandsPath = path.join(__dirname, '..', 'commands');
  loadCommandsFromDir(commandsPath);

  logger.success(`Total de ${client.commands.size} comandos carregados`);
};
