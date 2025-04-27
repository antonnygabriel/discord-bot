// src/components/selectMenus/roles.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  customId: 'roles', // Parte inicial do customId (roles_category)
  
  async execute(client, interaction, args) {
    const [category] = args;
    const selectedValues = interaction.values;
    
    // Exemplo: Adicionar/remover cargos selecionados
    await interaction.reply({
      content: `Você selecionou os seguintes cargos da categoria ${category}: ${selectedValues.join(', ')}`,
      ephemeral: true
    });
    
    // Implementação real adicionaria/removeria os cargos
  }
};
