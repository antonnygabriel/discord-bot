// src/components/buttons/confirm.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  customId: 'confirm', // Parte inicial do customId (confirm_actionType_targetId)
  
  async execute(client, interaction, args) {
    // args[0] = actionType, args[1] = targetId, etc.
    const [actionType, targetId] = args;
    
    // Exemplo de lógica para diferentes tipos de ação
    switch (actionType) {
      case 'delete':
        await interaction.reply({
          content: `Confirmado! Item ${targetId} foi deletado.`,
          ephemeral: true
        });
        break;
        
      case 'ban':
        // Lógica para banir usuário
        await interaction.reply({
          content: `Usuário ${targetId} foi banido.`,
          ephemeral: true
        });
        break;
        
      default:
        await interaction.reply({
          content: 'Ação desconhecida.',
          ephemeral: true
        });
    }
  }
};
