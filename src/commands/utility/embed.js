// src/commands/utility/embedbuilder.js
const { SlashCommandBuilder } = require('discord.js');
const EmbedBuilder = require('../../components/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embedbuilder')
    .setDescription('Cria uma embed personalizada interativamente'),
  
  cooldown: 10,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Inicia o sistema de criação de embeds
      await EmbedBuilder.start(client, interaction);
    } catch (error) {
      console.error('Erro ao iniciar o EmbedBuilder:', error);
      
      // Verifica se a interação já foi respondida
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'Ocorreu um erro ao iniciar o criador de embeds. Por favor, tente novamente mais tarde.',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: 'Ocorreu um erro ao iniciar o criador de embeds. Por favor, tente novamente mais tarde.',
          ephemeral: true
        });
      }
    }
  }
};
