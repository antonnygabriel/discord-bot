// src/events/interactionCreate.js
const { Events } = require('discord.js');
const { logger } = require('../utils/logger');
const CooldownUtil = require('../utils/cooldown');
const { isVipUser, notVipEmbed } = require('../utils/vipUtils');

module.exports = {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    // Trata comandos de barra
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      
      if (!command) {
        logger.warn(`Comando não encontrado: ${interaction.commandName}`);
        return;
      }
      
      try {
        // Verifica se o usuário é VIP (exceto para comandos públicos)
        if (command.vipOnly !== false && !isVipUser(interaction.user.id)) {
          return interaction.reply({ embeds: [notVipEmbed()], ephemeral: true });
        }
        
        // Verifica cooldown
        const canExecute = await CooldownUtil.check(interaction, command, client.cooldowns);
        if (!canExecute) return;
        
        // Executa o comando
        await command.execute(client, interaction);
        
        // Log de uso do comando
        logger.info(`${interaction.user.tag} usou o comando /${interaction.commandName} em ${interaction.guild ? interaction.guild.name : 'DM'}`);
      } catch (error) {
        // Usa o handler de erros global
        client.handleError(error, interaction, command);
      }
    }
    
    // Trata interações com botões
    else if (interaction.isButton()) {
      const [customId, ...args] = interaction.customId.split('_');
      const buttonHandler = client.buttons?.get(customId);
      
      if (!buttonHandler) return;
      
      try {
        // Verifica se o botão é VIP-only
        if (buttonHandler.vipOnly && !isVipUser(interaction.user.id)) {
          return interaction.reply({ embeds: [notVipEmbed()], ephemeral: true });
        }
        
        await buttonHandler.execute(client, interaction, args);
      } catch (error) {
        client.handleError(error, interaction);
      }
    }
    
    // Trata interações com menus de seleção
    else if (interaction.isStringSelectMenu()) {
      const [customId, ...args] = interaction.customId.split('_');
      const selectHandler = client.selectMenus?.get(customId);
      
      if (!selectHandler) return;
      
      try {
        // Verifica se o select menu é VIP-only
        if (selectHandler.vipOnly && !isVipUser(interaction.user.id)) {
          return interaction.reply({ embeds: [notVipEmbed()], ephemeral: true });
        }
        
        await selectHandler.execute(client, interaction, args);
      } catch (error) {
        client.handleError(error, interaction);
      }
    }
    
    // Trata interações com modais
    else if (interaction.isModalSubmit()) {
      const [customId, ...args] = interaction.customId.split('_');
      const modalHandler = client.modals?.get(customId);
      
      if (!modalHandler) return;
      
      try {
        // Verifica se o modal é VIP-only
        if (modalHandler.vipOnly && !isVipUser(interaction.user.id)) {
          return interaction.reply({ embeds: [notVipEmbed()], ephemeral: true });
        }
        
        await modalHandler.execute(client, interaction, args);
      } catch (error) {
        client.handleError(error, interaction);
      }
    }
    
    // Trata interações de autocompletar
    else if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      
      if (!command || !command.autocomplete) return;
      
      try {
        await command.autocomplete(client, interaction);
      } catch (error) {
        logger.error(`Erro ao processar autocomplete para ${interaction.commandName}:`, error);
      }
    }
  }
};
