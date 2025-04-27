// src/commands/fun/wordle.js
/**
 * Jogo Wordle
 * Adivinhe uma palavra de 5 letras em até 6 tentativas
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { hasActiveGame, registerGame, removeGame } = require('../../utils/gameUtils');

// Lista de palavras de 5 letras
const wordList = [
  'ABRIR', 'AGUDO', 'AMIGO', 'ANEXO', 'ASTRO', 'ATLAS', 'AVISO', 'AZEDO',
  'BALDE', 'BARCO', 'BATER', 'BEBEM', 'BICHO', 'BOLSA', 'BRAVO', 'BRISA',
  'CABRA', 'CALMA', 'CAMPO', 'CANTO', 'CASAL', 'CEDER', 'CERCA', 'CHAVE',
  'CHUVA', 'CIELO', 'CINTO', 'CLIMA', 'COBRA', 'COMER', 'CORPO', 'COURO',
  'CRISE', 'CURSO', 'DANÇA', 'DADOS', 'DENTE', 'DIZER', 'DOIDO', 'DRAMA',
  'DUELO', 'DUQUE', 'ELITE', 'ENFIM', 'ÉPOCA', 'ERRAR', 'ESTAR', 'ETAPA',
  'EXAME', 'EXTRA', 'FALAR', 'FALTA', 'FARDO', 'FAZER', 'FEBRE', 'FESTA',
  'FICAR', 'FILHO', 'FINAL', 'FORÇA', 'FORNO', 'FRACO', 'FRASE', 'FUGIR'
];

// Emojis para feedback
const CORRECT = '🟩'; // Letra correta na posição correta
const PRESENT = '🟨'; // Letra correta na posição errada
const ABSENT = '⬛'; // Letra não está na palavra

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wordle')
    .setDescription('Jogue Wordle - adivinhe uma palavra de 5 letras em até 6 tentativas'),
  
  cooldown: 10,
  category: 'fun',
  
  async execute(client, interaction) {
    // Verifica se já existe um jogo ativo para este usuário no canal
    if (hasActiveGame(interaction.channelId, `wordle_${interaction.user.id}`)) {
      return interaction.reply({
        content: 'Você já tem um jogo de Wordle em andamento neste canal.',
        ephemeral: true
      });
    }
    
    // Escolhe uma palavra aleatória
    const secretWord = wordList[Math.floor(Math.random() * wordList.length)];
    
    // Inicializa o estado do jogo
    const gameData = {
      secretWord,
      attempts: [],
      maxAttempts: 6,
      startTime: Date.now()
    };
    
    // Registra o jogo como ativo
    registerGame(interaction.channelId, `wordle_${interaction.user.id}`, gameData);
    
    // Cria o embed inicial
    const gameEmbed = createGameEmbed(gameData);
    
    // Cria o botão para fazer um palpite
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('wordle_guess')
          .setLabel('Fazer um palpite')
          .setStyle(ButtonStyle.Primary)
      );
    
    // Envia a mensagem inicial
    const message = await interaction.reply({
      embeds: [gameEmbed],
      components: [row],
      fetchReply: true
    });
    
    // Cria o coletor para os palpites
    const filter = i => i.user.id === interaction.user.id && i.customId === 'wordle_guess';
    const collector = message.createMessageComponentCollector({ filter, time: 300000 }); // 5 minutos
    
    collector.on('collect', async i => {
      // Cria um modal para o palpite
      const modal = {
        title: 'Wordle - Fazer um palpite',
        custom_id: 'wordle_modal',
        components: [{
          type: 1,
          components: [{
            type: 4,
            custom_id: 'wordle_input',
            label: 'Digite uma palavra de 5 letras',
            style: 1,
            min_length: 5,
            max_length: 5,
            placeholder: 'Digite sua palavra aqui',
            required: true
          }]
        }]
      };
      
      // Mostra o modal
      await i.showModal(modal);
      
      // Aguarda a resposta do modal
      try {
        const modalResponse = await i.awaitModalSubmit({ time: 60000, filter: i => i.user.id === interaction.user.id });
        
        // Obtém o palpite e converte para maiúsculas
        let guess = modalResponse.fields.getTextInputValue('wordle_input').toUpperCase();
        
        // Valida o palpite
        if (guess.length !== 5) {
          await modalResponse.reply({
            content: 'Por favor, digite uma palavra de exatamente 5 letras.',
            ephemeral: true
          });
          return;
        }
        
        // Verifica se contém apenas letras
        if (!/^[A-Z]+$/.test(guess)) {
          await modalResponse.reply({
            content: 'Por favor, digite apenas letras (A-Z).',
            ephemeral: true
          });
          return;
        }
        
        // Adiciona o palpite e o feedback
        const feedback = evaluateGuess(guess, secretWord);
        gameData.attempts.push({ word: guess, feedback });
        
        // Verifica se o jogador ganhou
        if (guess === secretWord) {
          // Jogador ganhou!
          const winEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎮 Wordle - Vitória!')
            .setDescription(`🎉 Parabéns! Você adivinhou a palavra **${secretWord}** em ${gameData.attempts.length} tentativas!`)
            .addFields(
              { name: 'Suas tentativas', value: formatAttempts(gameData.attempts) }
            )
            .setTimestamp();
          
          // Adiciona o tempo de jogo
          const gameTime = Math.floor((Date.now() - gameData.startTime) / 1000);
          winEmbed.addFields({ name: 'Tempo de jogo', value: `${gameTime} segundos` });
          
          // Desativa o botão
          const disabledRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('wordle_guess')
                .setLabel('Jogo finalizado')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true)
            );
          
          // Atualiza a mensagem
          await modalResponse.update({ embeds: [winEmbed], components: [disabledRow] });
          
          // Remove o jogo da lista de ativos
          removeGame(interaction.channelId, `wordle_${interaction.user.id}`);
          
          // Encerra o coletor
          collector.stop();
          return;
        }
        
        // Verifica se o jogador esgotou as tentativas
        if (gameData.attempts.length >= gameData.maxAttempts) {
          // Jogador perdeu
          const loseEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🎮 Wordle - Fim de Jogo')
            .setDescription(`❌ Você esgotou suas ${gameData.maxAttempts} tentativas!\n\nA palavra era **${secretWord}**.`)
            .addFields(
              { name: 'Suas tentativas', value: formatAttempts(gameData.attempts) }
            )
            .setTimestamp();
          
          // Desativa o botão
          const disabledRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('wordle_guess')
                .setLabel('Jogo finalizado')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true)
            );
          
          // Atualiza a mensagem
          await modalResponse.update({ embeds: [loseEmbed], components: [disabledRow] });
          
          // Remove o jogo da lista de ativos
          removeGame(interaction.channelId, `wordle_${interaction.user.id}`);
          
          // Encerra o coletor
          collector.stop();
          return;
        }
        
        // Jogo continua
        const updatedEmbed = createGameEmbed(gameData);
        
        // Atualiza a mensagem
        await modalResponse.update({ embeds: [updatedEmbed], components: [row] });
        
      } catch (error) {
        // Timeout do modal ou erro
        console.error('Erro no modal de Wordle:', error);
      }
    });
    
    collector.on('end', (collected, reason) => {
      if (reason === 'time' && hasActiveGame(interaction.channelId, `wordle_${interaction.user.id}`)) {
        // Timeout - jogo abandonado
        const timeoutEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('⏱️ Tempo Esgotado')
          .setDescription(`O jogo foi cancelado devido à inatividade.\n\nA palavra era **${secretWord}**.`)
          .setTimestamp();
        
        // Desativa o botão
        const disabledRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('wordle_guess')
              .setLabel('Tempo esgotado')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
        
        // Atualiza a mensagem
        interaction.editReply({ embeds: [timeoutEmbed], components: [disabledRow] });
        
        // Remove o jogo da lista de ativos
        removeGame(interaction.channelId, `wordle_${interaction.user.id}`);
      }
    });
  }
};

/**
 * Cria o embed do jogo
 * @param {Object} gameData - Dados do jogo
 * @returns {EmbedBuilder} Embed do jogo
 */
function createGameEmbed(gameData) {
  const embed = new EmbedBuilder()
    .setColor('#0099FF')
    .setTitle('🎮 Wordle')
    .setDescription('Adivinhe a palavra de 5 letras em até 6 tentativas.\n\n' +
                   '🟩 = Letra correta na posição correta\n' +
                   '🟨 = Letra correta na posição errada\n' +
                   '⬛ = Letra não está na palavra')
    .setTimestamp();
  
  // Adiciona as tentativas anteriores
  if (gameData.attempts.length > 0) {
    embed.addFields({ name: 'Suas tentativas', value: formatAttempts(gameData.attempts) });
  }
  
  // Adiciona informações sobre tentativas restantes
  const attemptsLeft = gameData.maxAttempts - gameData.attempts.length;
  embed.addFields({ name: 'Tentativas restantes', value: `${attemptsLeft} de ${gameData.maxAttempts}` });
  
  return embed;
}

/**
 * Formata as tentativas para exibição
 * @param {Array} attempts - Lista de tentativas
 * @returns {string} Tentativas formatadas
 */
function formatAttempts(attempts) {
  return attempts.map((attempt, index) => {
    return `${index + 1}. ${attempt.word} ${attempt.feedback.join('')}`;
  }).join('\n');
}

/**
 * Avalia um palpite e retorna o feedback
 * @param {string} guess - Palpite do jogador
 * @param {string} secretWord - Palavra secreta
 * @returns {Array} Array de emojis representando o feedback
 */
function evaluateGuess(guess, secretWord) {
  const result = Array(5).fill(ABSENT);
  const secretLetters = secretWord.split('');
  
  // Primeiro, encontra letras corretas na posição correta
  for (let i = 0; i < 5; i++) {
    if (guess[i] === secretWord[i]) {
      result[i] = CORRECT;
      secretLetters[i] = null; // Marca como usada
    }
  }
  
  // Depois, encontra letras corretas na posição errada
  for (let i = 0; i < 5; i++) {
    if (result[i] === CORRECT) continue; // Já marcada como correta
    
    const letterIndex = secretLetters.indexOf(guess[i]);
    if (letterIndex !== -1) {
      result[i] = PRESENT;
      secretLetters[letterIndex] = null; // Marca como usada
    }
  }
  
  return result;
}
