// Script para deploy de comandos 
// deploy-commands.js
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Função para carregar todos os comandos
const loadCommands = () => {
  const commands = [];
  const commandsPath = path.join(__dirname, 'src', 'commands');
  const commandFolders = fs.readdirSync(commandsPath);
  
  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    
    // Verifica se é um diretório
    if (!fs.statSync(folderPath).isDirectory()) continue;
    
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(chalk.green(`✓ Comando carregado: ${command.data.name}`));
      } else {
        console.log(chalk.yellow(`⚠ O comando em ${filePath} está faltando a propriedade "data" ou "execute"`));
      }
    }
  }
  
  return commands;
};

// Função principal para registrar comandos
const deployCommands = async () => {
  try {
    console.log(chalk.blue('Iniciando deploy de comandos...'));
    
    const commands = loadCommands();
    console.log(chalk.blue(`Total de ${commands.length} comandos encontrados.`));
    
    // Cria uma nova instância do REST
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    
    // Determina se deve registrar globalmente ou apenas em um servidor específico
    const isDev = process.env.NODE_ENV === 'development';
    const route = isDev && process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);
    
    console.log(chalk.yellow(`Registrando comandos ${isDev ? 'no servidor de desenvolvimento' : 'globalmente'}...`));
    
    // Registra os comandos
    const data = await rest.put(route, { body: commands });
    
    console.log(chalk.green(`✓ ${data.length} comandos registrados com sucesso!`));
    
    // Lista os comandos registrados
    data.forEach(cmd => {
      console.log(chalk.cyan(`- ${cmd.name}`));
    });
    
  } catch (error) {
    console.error(chalk.red('Erro ao registrar comandos:'));
    console.error(error);
  }
};

// Executa o deploy
deployCommands();
