// src/commands/fun/hangman.js
/**
 * Comando de Jogo da Forca (Hangman)
 * Permite aos usuários jogar o clássico jogo da forca com palavras aleatórias
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { hasActiveGame, registerGame, removeGame, createGameEmbed, createWinEmbed, createTimeoutEmbed } = require('../../utils/gameUtils');

// Lista de palavras para o jogo
const wordList = [
  'JAVASCRIPT', 'DISCORD', 'PROGRAMACAO', 'DESENVOLVIMENTO',
  'COMPUTADOR', 'INTERNET', 'ALGORITMO', 'TECNOLOGIA',
  'SERVIDOR', 'APLICATIVO', 'FRAMEWORK', 'BIBLIOTECA',
  'INTERFACE', 'VARIAVEL', 'FUNCAO', 'OBJETO'
];

// Estados do boneco da forca
const hangmanStates = [
  "  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========\n",
  "  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========\n",
  "  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========\n",
  "  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========\n",
  "  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========\n",
  "  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========\n",
  "  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========\n"
];


module.exports = {
  data: new SlashCommandBuilder()
    .setName('hangman')
    .setDescription('Jogue o clássico jogo da forca')
    .addStringOption(option =>
      option
        .setName('categoria')
        .setDescription('Categoria de palavras')
        .setRequired(false)
        .addChoices(
          { name: 'Programação', value: 'programming' }
        )),
  
  cooldown: 10,
  category: 'fun',
  
  async execute(client, interaction) {
    // Verifica se já existe um jogo ativo no canal
    if (hasActiveGame(interaction.channelId, 'hangman')) {
      return interaction.reply({
        content: 'Já existe um jogo da forca em andamento neste canal.',
        ephemeral: true
      });
    }
    
    // Escolhe uma palavra aleatória
    const word = wordList[Math.floor(Math.random() * wordList.length)];
    
    // Inicializa o estado do jogo
    const gameData = {
      word,
      guessedLetters: [],
      wrongGuesses: 0,
      maxWrongGuesses: 6,
      startTime: Date.now()
    };
    
    // Registra o jogo como ativo
    registerGame(interaction.channelId, 'hangman', gameData);
    
    // Cria o estado inicial da palavra oculta
    const hiddenWord = getHiddenWord(word, gameData.guessedLetters);
    
    // Cria o embed inicial
    const gameEmbed = createGameEmbed(
      '🎮 Jogo da Forca',
      `${hangmanStates[0]}\n\nPalavra: \`${hiddenWord}\`\n\nLetras já tentadas: Nenhuma\n\nErros: 0/${gameData.maxWrongGuesses}`
    );
    
    // Cria os botões para interação
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('hangman_guess')
          .setLabel('Adivinhar Letra')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('hangman_word')
          .setLabel('Adivinhar Palavra')
          .setStyle(ButtonStyle.Success)
      );
    
    // Envia a mensagem inicial
    const message = await interaction.reply({
      embeds: [gameEmbed],
      components: [row],
      fetchReply: true
    });
    
    // Cria o coletor para os palpites
    const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('hangman_');
    const collector = message.createMessageComponentCollector({ filter, time: 300000 }); // 5 minutos
    
    collector.on('collect', async i => {
      if (i.customId === 'hangman_guess') {
        // Modal para adivinhar uma letra
        const modal = {
          title: 'Adivinhar Letra',
          custom_id: 'hangman_letter_modal',
          components: [{
            type: 1,
            components: [{
              type: 4,
              custom_id: 'letter_input',
              label: 'Digite uma letra',
              style: 1,
              min_length: 1,
              max_length: 1,
              placeholder: 'Digite apenas uma letra',
              required: true
            }]
          }]
        };
        
        await i.showModal(modal);
        
        try {
          const modalResponse = await i.awaitModalSubmit({ time: 60000, filter: i => i.user.id === interaction.user.id });
          
          // Obtém a letra
          let letter = modalResponse.fields.getTextInputValue('letter_input').toUpperCase();
          
          // Verifica se é uma letra válida
          if (!/^[A-Z]$/.test(letter)) {
            await modalResponse.reply({
              content: 'Por favor, digite apenas uma letra válida (A-Z).',
              ephemeral: true
            });
            return;
          }
          
          // Verifica se a letra já foi tentada
          if (gameData.guessedLetters.includes(letter)) {
            await modalResponse.reply({
              content: `Você já tentou a letra "${letter}".`,
              ephemeral: true
            });
            return;
          }
          
          // Adiciona a letra às tentativas
          gameData.guessedLetters.push(letter);
          
          // Verifica se a letra está na palavra
          if (!word.includes(letter)) {
            gameData.wrongGuesses++;
          }
          
          // Atualiza a palavra oculta
          const updatedHiddenWord = getHiddenWord(word, gameData.guessedLetters);
          
          // Verifica se o jogador ganhou
          if (!updatedHiddenWord.includes('_')) {
            // Jogador ganhou!
            const winEmbed = createWinEmbed(
              interaction.user.username,
              'Jogo da Forca',
              `🎉 Parabéns! Você adivinhou a palavra: **${word}**\n\n${hangmanStates[gameData.wrongGuesses]}\n\nErros: ${gameData.wrongGuesses}/${gameData.maxWrongGuesses}`
            );
            
            // Adiciona o tempo de jogo
            const gameTime = Math.floor((Date.now() - gameData.startTime) / 1000);
            winEmbed.addFields({
              name: 'Tempo de jogo',
              value: `${gameTime} segundos`
            });
            
            // Desativa os botões
            const disabledRow = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('hangman_guess')
                  .setLabel('Jogo finalizado')
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(true),
                new ButtonBuilder()
                  .setCustomId('hangman_word')
                  .setLabel('Palavra encontrada')
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(true)
              );
            
            // Atualiza a mensagem
            await modalResponse.update({ embeds: [winEmbed], components: [disabledRow] });
            
            // Remove o jogo da lista de ativos
            removeGame(interaction.channelId, 'hangman');
            
            // Encerra o coletor
            collector.stop();
            return;
          }
          
          // Verifica se o jogador perdeu
          if (gameData.wrongGuesses >= gameData.maxWrongGuesses) {
            // Jogador perdeu
            const loseEmbed = new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('🎮 Jogo da Forca - Fim de Jogo')
              .setDescription(`❌ Você perdeu! A palavra era: **${word}**\n\n${hangmanStates[gameData.wrongGuesses]}\n\nErros: ${gameData.wrongGuesses}/${gameData.maxWrongGuesses}`)
              .setTimestamp();
            
            // Desativa os botões
            const disabledRow = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('hangman_guess')
                  .setLabel('Jogo finalizado')
                  .setStyle(ButtonStyle.Danger)
                  .setDisabled(true),
                new ButtonBuilder()
                  .setCustomId('hangman_word')
                  .setLabel('Você perdeu')
                  .setStyle(ButtonStyle.Danger)
                  .setDisabled(true)
              );
            
            // Atualiza a mensagem
            await modalResponse.update({ embeds: [loseEmbed], components: [disabledRow] });
            
            // Remove o jogo da lista de ativos
            removeGame(interaction.channelId, 'hangman');
            
            // Encerra o coletor
            collector.stop();
            return;
          }
          
          // Jogo continua
          const updatedEmbed = createGameEmbed(
            '🎮 Jogo da Forca',
            `${hangmanStates[gameData.wrongGuesses]}\n\nPalavra: \`${updatedHiddenWord}\`\n\nLetras já tentadas: ${gameData.guessedLetters.join(', ')}\n\nErros: ${gameData.wrongGuesses}/${gameData.maxWrongGuesses}`
          );
          
          // Atualiza a mensagem
          await modalResponse.update({ embeds: [updatedEmbed], components: [row] });
          
        } catch (error) {
          // Timeout do modal ou erro
          console.error('Erro no modal de letra:', error);
        }
      } else if (i.customId === 'hangman_word') {
        // Modal para adivinhar a palavra completa
        const modal = {
          title: 'Adivinhar Palavra',
          custom_id: 'hangman_word_modal',
          components: [{
            type: 1,
            components: [{
              type: 4,
              custom_id: 'word_input',
              label: 'Digite a palavra completa',
              style: 1,
              min_length: 1,
              max_length: 20,
              placeholder: 'Digite a palavra que você acha que é',
              required: true
            }]
          }]
        };
        
        await i.showModal(modal);
        
        try {
          const modalResponse = await i.awaitModalSubmit({ time: 60000, filter: i => i.user.id === interaction.user.id });
          
          // Obtém a palavra
          const guessedWord = modalResponse.fields.getTextInputValue('word_input').toUpperCase();
          
          // Verifica se a palavra está correta
          if (guessedWord === word) {
            // Jogador ganhou!
            const winEmbed = createWinEmbed(
              interaction.user.username,
              'Jogo da Forca',
              `🎉 Parabéns! Você adivinhou a palavra: **${word}**\n\n${hangmanStates[gameData.wrongGuesses]}\n\nErros: ${gameData.wrongGuesses}/${gameData.maxWrongGuesses}`
            );
            
            // Adiciona o tempo de jogo
            const gameTime = Math.floor((Date.now() - gameData.startTime) / 1000);
            winEmbed.addFields({
              name: 'Tempo de jogo',
              value: `${gameTime} segundos`
            });
            
            // Desativa os botões
            const disabledRow = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('hangman_guess')
                  .setLabel('Jogo finalizado')
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(true),
                new ButtonBuilder()
                  .setCustomId('hangman_word')
                  .setLabel('Palavra encontrada')
                  .setStyle(ButtonStyle.Success)
                  .setDisabled(true)
              );
            
            // Atualiza a mensagem
            await modalResponse.update({ embeds: [winEmbed], components: [disabledRow] });
            
            // Remove o jogo da lista de ativos
            removeGame(interaction.channelId, 'hangman');
            
            // Encerra o coletor
            collector.stop();
            return;
          } else {
            // Palavra incorreta - conta como erro
            gameData.wrongGuesses++;
            
            // Verifica se o jogador perdeu
            if (gameData.wrongGuesses >= gameData.maxWrongGuesses) {
              // Jogador perdeu
              const loseEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🎮 Jogo da Forca - Fim de Jogo')
                .setDescription(`❌ Você perdeu! A palavra era: **${word}**\n\n${hangmanStates[gameData.wrongGuesses]}\n\nErros: ${gameData.wrongGuesses}/${gameData.maxWrongGuesses}`)
                .setTimestamp();
              
              // Desativa os botões
              const disabledRow = new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('hangman_guess')
                    .setLabel('Jogo finalizado')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true),
                  new ButtonBuilder()
                    .setCustomId('hangman_word')
                    .setLabel('Você perdeu')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
                );
              
              // Atualiza a mensagem
              await modalResponse.update({ embeds: [loseEmbed], components: [disabledRow] });
              
              // Remove o jogo da lista de ativos
              removeGame(interaction.channelId, 'hangman');
              
              // Encerra o coletor
              collector.stop();
              return;
            }
            
            // Jogo continua
            const hiddenWord = getHiddenWord(word, gameData.guessedLetters);
            const updatedEmbed = createGameEmbed(
              '🎮 Jogo da Forca',
              `${hangmanStates[gameData.wrongGuesses]}\n\nPalavra: \`${hiddenWord}\`\n\nLetras já tentadas: ${gameData.guessedLetters.join(', ') || 'Nenhuma'}\n\nErros: ${gameData.wrongGuesses}/${gameData.maxWrongGuesses}\n\n❌ Palavra "${guessedWord}" incorreta!`
            );
            
            // Atualiza a mensagem
            await modalResponse.update({ embeds: [updatedEmbed], components: [row] });
          }
          
        } catch (error) {
          // Timeout do modal ou erro
          console.error('Erro no modal de palavra:', error);
        }
      }
    });
    
    collector.on('end', (collected, reason) => {
      if (reason === 'time' && hasActiveGame(interaction.channelId, 'hangman')) {
        // Timeout - jogo abandonado
        const timeoutEmbed = createTimeoutEmbed('Jogo da Forca');
        
        // Adiciona a palavra
        timeoutEmbed.addFields({
          name: 'A palavra era',
          value: `${word}`
        });
        
        // Desativa os botões
        const disabledRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('hangman_guess')
              .setLabel('Tempo esgotado')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('hangman_word')
              .setLabel('Jogo finalizado')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
        
        // Atualiza a mensagem
        interaction.editReply({ embeds: [timeoutEmbed], components: [disabledRow] });
        
        // Remove o jogo da lista de ativos
        removeGame(interaction.channelId, 'hangman');
      }
    });
  }
};

/**
 * Obtém a representação da palavra com letras adivinhadas
 * @param {string} word - Palavra a ser adivinhada
 * @param {Array} guessedLetters - Letras já adivinhadas
 * @returns {string} Palavra com letras adivinhadas e underscores
 */
function getHiddenWord(word, guessedLetters) {
  return word
    .split('')
    .map(letter => guessedLetters.includes(letter) ? letter : '_')
    .join(' ');
}
