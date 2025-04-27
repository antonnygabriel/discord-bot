// src/commands/owner/reloadEvents.js
/**
 * Comando Reload Events - Recarrega todos os eventos sem reiniciar o bot
 * 
 * Este comando permite ao dono do bot recarregar todos os eventos ou um evento específico
 * sem precisar reiniciar o bot, útil para desenvolvimento e manutenção.
 * 
 * @module commands/owner/reloadEvents
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwner, notOwnerEmbed, errorEmbed, successEmbed } = require('../../utils/ownerUtils');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reloadeventos')
    .setDescription('Recarrega comandos ou eventos (apenas owner)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('events')
        .setDescription('Recarrega todos os eventos')
        .addStringOption(option =>
          option
            .setName('evento')
            .setDescription('Nome específico do evento a recarregar (opcional)')
            .setRequired(false))),
  
  cooldown: 10,
  category: 'owner',
  
  /**
   * Executa o comando reload events
   * @param {Client} client - Cliente do Discord
   * @param {CommandInteraction} interaction - Interação do comando
   */
  async execute(client, interaction) {
    // Verifica se o usuário é um owner autorizado
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ embeds: [notOwnerEmbed()], ephemeral: true });
    }
    
    if (interaction.options.getSubcommand() === 'events') {
      await interaction.deferReply();
      
      const specificEvent = interaction.options.getString('evento');
      
      try {
        if (specificEvent) {
          // Recarrega um evento específico
          const eventName = await this.reloadSpecificEvent(client, specificEvent);
          
          const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Evento Recarregado')
            .setDescription(`O evento \`${eventName}\` foi recarregado com sucesso.`)
            .setTimestamp();
          
          await interaction.editReply({ embeds: [successEmbed] });
        } else {
          // Recarrega todos os eventos
          const result = await this.reloadAllEvents(client);
          
          const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Eventos Recarregados')
            .setDescription(`${result.loaded} eventos foram recarregados com sucesso.`)
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
        console.error(`[ERRO][ReloadEvents] Falha ao recarregar eventos:`, error);
        await interaction.editReply({ embeds: [errorEmbed(error)] });
      }
    }
  },
  
  /**
   * Recarrega um evento específico
   * @param {Client} client - Cliente do Discord
   * @param {string} eventName - Nome do evento a recarregar
   * @returns {Promise<string>} Nome do evento recarregado
   */
  async reloadSpecificEvent(client, eventName) {
    // Caminho para a pasta de eventos
    const eventsPath = path.join(__dirname, '../../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    // Encontra o arquivo do evento
    const eventFile = eventFiles.find(file => {
      const eventModule = require(path.join(eventsPath, file));
      return eventModule.name === eventName;
    });
    
    if (!eventFile) {
      throw new Error(`Evento "${eventName}" não encontrado.`);
    }
    
    const filePath = path.join(eventsPath, eventFile);
    
    // Remove os listeners existentes
    const oldEvent = require(filePath);
    if (client.listeners(oldEvent.name).length > 0) {
      client.removeAllListeners(oldEvent.name);
    }
    
    // Limpa o cache do require para o arquivo
    delete require.cache[require.resolve(filePath)];
    
    // Carrega o evento novamente
    const event = require(filePath);
    
    // Registra o evento
    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
      client.on(event.name, (...args) => event.execute(client, ...args));
    }
    
    return event.name;
  },
  
  /**
   * Recarrega todos os eventos
   * @param {Client} client - Cliente do Discord
   * @returns {Promise<Object>} Resultado da operação
   */
  async reloadAllEvents(client) {
    // Resultado da operação
    const result = {
      loaded: 0,
      errors: []
    };
    
    // Remove todos os listeners existentes
    const eventNames = client._eventsCount > 0 ? Object.keys(client._events) : [];
    
    for (const eventName of eventNames) {
      // Ignora eventos internos do Node.js
      if (eventName === 'newListener' || eventName === 'removeListener') continue;
      
      client.removeAllListeners(eventName);
    }
    
    // Caminho para a pasta de eventos
    const eventsPath = path.join(__dirname, '../../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    // Carrega todos os eventos
    for (const file of eventFiles) {
      try {
        const filePath = path.join(eventsPath, file);
        
        // Limpa o cache do require para o arquivo
        delete require.cache[require.resolve(filePath)];
        
        // Carrega o evento
        const event = require(filePath);
        
        // Registra o evento
        if (event.once) {
          client.once(event.name, (...args) => event.execute(client, ...args));
        } else {
          client.on(event.name, (...args) => event.execute(client, ...args));
        }
        
        result.loaded++;
      } catch (error) {
        result.errors.push(`Erro ao carregar ${file}: ${error.message}`);
      }
    }
    
    return result;
  }
};
