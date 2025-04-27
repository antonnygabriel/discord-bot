// src/commands/fun/coinflip.js
/**
 * Comando de Cara ou Coroa
 * Simula o lançamento de uma moeda com animação
 */

const { SlashCommandBuilder } = require('discord.js');
const { createGameEmbed } = require('../../utils/gameUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Jogue cara ou coroa')
    .addStringOption(option =>
      option
        .setName('escolha')
        .setDescription('Escolha cara ou coroa')
        .setRequired(false)
        .addChoices(
          { name: 'Cara', value: 'heads' },
          { name: 'Coroa', value: 'tails' }
        )),
  
  cooldown: 3,
  category: 'fun',
  
  async execute(client, interaction) {
    // Obtém a escolha do usuário (se houver)
    const userChoice = interaction.options.getString('escolha');
    
    // Cria o embed inicial
    const initialEmbed = createGameEmbed(
      '🪙 Cara ou Coroa',
      'Jogando a moeda...'
    );
    
    // Responde com o embed inicial
    await interaction.reply({ embeds: [initialEmbed] });
    
    // Simula o lançamento da moeda (animação)
    const flippingEmbed = createGameEmbed(
      '🪙 Cara ou Coroa',
      'Jogando a moeda...\n\n🪙 *girando...*'
    );
    
    // Atualiza a mensagem após 1 segundo
    setTimeout(async () => {
      await interaction.editReply({ embeds: [flippingEmbed] });
      
      // Determina o resultado
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      
      // Cria o embed final
      let finalEmbed;
      
      if (userChoice) {
        // Usuário fez uma escolha
        const won = userChoice === result;
        
        finalEmbed = createGameEmbed(
          '🪙 Cara ou Coroa',
          `Resultado: **${result === 'heads' ? 'Cara' : 'Coroa'}** ${result === 'heads' ? '(Heads)' : '(Tails)'}\n\nVocê escolheu: **${userChoice === 'heads' ? 'Cara' : 'Coroa'}**\n\n${won ? '🎉 Você acertou!' : '❌ Você errou!'}`,
          won ? '#00FF00' : '#FF0000'
        );
      } else {
        // Usuário não fez escolha
        finalEmbed = createGameEmbed(
          '🪙 Cara ou Coroa',
          `Resultado: **${result === 'heads' ? 'Cara' : 'Coroa'}** ${result === 'heads' ? '(Heads)' : '(Tails)'}`,
          '#0099FF'
        );
      }
      
      // Adiciona a imagem da moeda
      finalEmbed.setThumbnail(result === 'heads' ? 'https://i.imgur.com/HAvGDfl.png' : 'https://i.imgur.com/XnAHEDT.png');
      
      // Atualiza a mensagem com o resultado final
      await interaction.editReply({ embeds: [finalEmbed] });
    }, 1500);
  }
};
