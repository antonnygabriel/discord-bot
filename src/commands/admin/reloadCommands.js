// src/commands/owner/reloadCommands.js
/**
 * Comando Reload Commands - Recarrega todos os comandos sem reiniciar o bot
 * 
 * Este comando permite ao dono do bot recarregar todos os comandos ou um comando específico
 * sem precisar reiniciar o bot, útil para desenvolvimento e manutenção.
 * 
 * @module commands/owner/reloadCommands
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwner, notOwnerEmbed, errorEmbed, successEmbed } = require('../../utils/ownerUtils');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reloadcomandos')
    .setDescription('Recarrega comandos ou eventos (apenas owner)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('commands')
        .setDescription('Recarrega todos os comandos')
        .addStringOption(option =>
          option
            .setName('comando')
            .setDescription('Nome específico do comando a recarregar (opcional)')
            .setRequired(false))),
  
  cooldown: 10,
  category: 'owner',
  
  /**
   * Executa o comando reload commands
   * @param {Client} client - Cliente do Discord
   * @param {CommandInteraction} interaction - Interação do comando
   */
  async execute(client, interaction) {
    // Verifica se o usuário é um owner autorizado
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ embeds: [notOwnerEmbed()], ephemeral: true });
    }
    
    if (interaction.options.getSubcommand() === 'commands') {
      await interaction.deferReply();
      
      const specificCommand = interaction.options.getString('comando');
      
      try {
        if (specificCommand) {
          // Recarrega um comando específico
          const commandName = await this.reloadSpecificCommand(client, specificCommand);
          
          const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Comando Recarregado')
            .setDescription(`O comando \`${commandName}\` foi recarregado com sucesso.`)
            .setTimestamp();
          
          await interaction.editReply({ embeds: [successEmbed] });
        } else {
          // Recarrega todos os comandos
          const result = await this.reloadAllCommands(client);
          
          const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Comandos Recarregados')
            .setDescription(`${result.loaded} comandos foram recarregados com sucesso.`)
            .setTimestamp();
          
          if (result.errors.length > 0) {
            successEmbed.addFields({
              name: '⚠️ Erros',
              value: result.errors.map(e => `- ${e}`).join('\n')
            });
          }
          
          await interaction.editReply({ embeds: [successEmbed] });
        }
      } catch (error) {
        console.error(`[ERRO][ReloadCommands] Falha ao recarregar comandos:`, error);
        await interaction.editReply({ embeds: [errorEmbed(error)] });
      }
    }
  },
  
  /**
   * Recarrega um comando específico
   * @param {Client} client - Cliente do Discord
   * @param {string} commandName - Nome do comando a recarregar
   * @returns {Promise<string>} Nome do comando recarregado
   */
  async reloadSpecificCommand(client, commandName) {
    const command = client.commands.get(commandName);
    
    if (!command) {
      throw new Error(`Comando "${commandName}" não encontrado.`);
    }
    
    // Encontra o caminho do arquivo do comando
    const commandsPath = path.join(__dirname, '../../commands');
    const categories = fs.readdirSync(commandsPath);
    let commandPath = null;
    
    // Procura o comando em todas as categorias
    for (const category of categories) {
      const categoryPath = path.join(commandsPath, category);
      
      // Verifica se é um diretório
      if (!fs.statSync(categoryPath).isDirectory()) continue;
      
      const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = path.join(categoryPath, file);
        const commandModule = require(filePath);
        
        if (commandModule.data?.name === commandName) {
          commandPath = filePath;
          break;
        }
      }
      
      if (commandPath) break;
    }
    
    if (!commandPath) {
      throw new Error(`Arquivo do comando "${commandName}" não encontrado.`);
    }
    
    // Limpa o cache do require para o arquivo do comando
    delete require.cache[require.resolve(commandPath)];
    
    // Recarrega o comando
    const newCommand = require(commandPath);
    
    // Valida se o comando tem as propriedades necessárias
    if (!newCommand.data || !newCommand.execute) {
      throw new Error(`Comando em ${commandPath} está faltando propriedades obrigatórias`);
    }
    
    // Registra o comando na coleção
    client.commands.set(newCommand.data.name, newCommand);
    
    return newCommand.data.name;
  },
  
  /**
   * Recarrega todos os comandos
   * @param {Client} client - Cliente do Discord
   * @returns {Promise<Object>} Resultado da operação
   */
  async reloadAllCommands(client) {
    // Limpa a coleção de comandos
    client.commands.clear();
    
    // Resultado da operação
    const result = {
      loaded: 0,
      errors: []
    };
    
    // Caminho para a pasta de comandos
    const commandsPath = path.join(__dirname, '../../commands');
    const categories = fs.readdirSync(commandsPath);
    
    // Percorre todas as categorias
    for (const category of categories) {
      const categoryPath = path.join(commandsPath, category);
      
      // Verifica se é um diretório
      if (!fs.statSync(categoryPath).isDirectory()) continue;
      
      // Lê todos os arquivos de comando na categoria
      const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        try {
          const filePath = path.join(categoryPath, file);
          
          // Limpa o cache do require para o arquivo
          delete require.cache[require.resolve(filePath)];
          
          // Carrega o comando
          const command = require(filePath);
          
          // Valida se o comando tem as propriedades necessárias
          if (!command.data || !command.execute) {
            result.errors.push(`Comando em ${filePath} está faltando propriedades obrigatórias`);
            continue;
          }
          
          // Adiciona a categoria ao comando
          command.category = category;
          
          // Registra o comando na coleção
          client.commands.set(command.data.name, command);
          result.loaded++;
        } catch (error) {
          result.errors.push(`Erro ao carregar ${file}: ${error.message}`);
        }
      }
    }
    
    return result;
  }
};
