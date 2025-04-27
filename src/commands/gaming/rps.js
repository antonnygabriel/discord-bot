// src/commands/fun/rps.js
/**
 * Comando de Pedra, Papel e Tesoura
 * Permite jogar o clássico jogo contra o bot usando botões interativos
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createGameEmbed, createWinEmbed, createTieEmbed } = require('../../utils/gameUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Jogue Pedra, Papel e Tesoura contra o bot'),
  
  cooldown: 5,
  category: 'fun',
  
  async execute(client, interaction) {
    // Cria os botões para as escolhas
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('rps_rock')
          .setLabel('Pedra')
          .setEmoji('🪨')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('rps_paper')
          .setLabel('Papel')
          .setEmoji('📄')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('rps_scissors')
          .setLabel('Tesoura')
          .setEmoji('✂️')
          .setStyle(ButtonStyle.Primary)
      );
    
    // Cria o embed inicial
    const gameEmbed = createGameEmbed(
      '🎮 Pedra, Papel e Tesoura',
      `${interaction.user}, escolha sua jogada!`
    );
    
    // Envia a mensagem com os botões
    const message = await interaction.reply({
      embeds: [gameEmbed],
      components: [row],
      fetchReply: true
    });
    
    // Cria o coletor de interações
    const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('rps_');
    const collector = message.createMessageComponentCollector({ filter, time: 30000, max: 1 });
    
    collector.on('collect', async i => {
      // Obtém a escolha do jogador
      const playerChoice = i.customId.replace('rps_', '');
      
      // Obtém a escolha do bot
      const choices = ['rock', 'paper', 'scissors'];
      const botChoice = choices[Math.floor(Math.random() * choices.length)];
      
      // Determina o vencedor
      const result = determineWinner(playerChoice, botChoice);
      
      // Cria o embed de resultado
      let resultEmbed;
      if (result === 'win') {
        resultEmbed = createWinEmbed(
          interaction.user.username,
          'Pedra, Papel e Tesoura',
          `Você escolheu ${getEmoji(playerChoice)} e eu escolhi ${getEmoji(botChoice)}.\nVocê venceu!`
        );
      } else if (result === 'lose') {
        resultEmbed = createWinEmbed(
          'Bot',
          'Pedra, Papel e Tesoura',
          `Você escolheu ${getEmoji(playerChoice)} e eu escolhi ${getEmoji(botChoice)}.\nEu venci!`
        );
      } else {
        resultEmbed = createTieEmbed(
          'Pedra, Papel e Tesoura',
          `Nós dois escolhemos ${getEmoji(playerChoice)}.\nEmpate!`
        );
      }
      
      // Desativa os botões
      const disabledRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('rps_rock')
            .setLabel('Pedra')
            .setEmoji('🪨')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('rps_paper')
            .setLabel('Papel')
            .setEmoji('📄')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('rps_scissors')
            .setLabel('Tesoura')
            .setEmoji('✂️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );
      
      // Atualiza a mensagem com o resultado
      await i.update({ embeds: [resultEmbed], components: [disabledRow] });
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        // Timeout - ninguém interagiu
        const timeoutEmbed = createGameEmbed(
          '⏱️ Tempo Esgotado',
          'Você não fez uma escolha a tempo.',
          '#FF0000'
        );
        
        // Desativa os botões
        const disabledRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('rps_rock')
              .setLabel('Pedra')
              .setEmoji('🪨')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('rps_paper')
              .setLabel('Papel')
              .setEmoji('📄')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('rps_scissors')
              .setLabel('Tesoura')
              .setEmoji('✂️')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true)
          );
        
        interaction.editReply({ embeds: [timeoutEmbed], components: [disabledRow] });
      }
    });
  }
};

/**
 * Determina o vencedor do jogo
 * @param {string} playerChoice - Escolha do jogador
 * @param {string} botChoice - Escolha do bot
 * @returns {string} Resultado: 'win', 'lose' ou 'tie'
 */
function determineWinner(playerChoice, botChoice) {
  if (playerChoice === botChoice) return 'tie';
  
  if (
    (playerChoice === 'rock' && botChoice === 'scissors') ||
    (playerChoice === 'paper' && botChoice === 'rock') ||
    (playerChoice === 'scissors' && botChoice === 'paper')
  ) {
    return 'win';
  }
  
  return 'lose';
}

/**
 * Obtém o emoji correspondente à escolha
 * @param {string} choice - Escolha (rock, paper, scissors)
 * @returns {string} Emoji correspondente
 */
function getEmoji(choice) {
  switch (choice) {
    case 'rock': return '🪨';
    case 'paper': return '📄';
    case 'scissors': return '✂️';
    default: return '❓';
  }
}
