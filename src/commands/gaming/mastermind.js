// src/commands/fun/mastermind.js
/**
 * Jogo Mastermind
 * Descubra a sequência secreta de cores em até 10 tentativas
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const { hasActiveGame, registerGame, removeGame } = require('../../utils/gameUtils');

// Cores disponíveis
const COLORS = [
  { name: 'Vermelho', emoji: '🔴', value: 'red' },
  { name: 'Azul', emoji: '🔵', value: 'blue' },
  { name: 'Verde', emoji: '🟢', value: 'green' },
  { name: 'Amarelo', emoji: '🟡', value: 'yellow' },
  { name: 'Roxo', emoji: '🟣', value: 'purple' },
  { name: 'Laranja', emoji: '🟠', value: 'orange' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mastermind')
    .setDescription('Jogue Mastermind - descubra a sequência secreta de cores')
    .addIntegerOption(option =>
      option
        .setName('dificuldade')
        .setDescription('Nível de dificuldade')
        .setRequired(false)
        .addChoices(
          { name: 'Fácil (4 cores, 12 tentativas)', value: 4 },
          { name: 'Médio (5 cores, 10 tentativas)', value: 5 },
          { name: 'Difícil (6 cores, 8 tentativas)', value: 6 }
        )),
  
  cooldown: 10,
  category: 'fun',
  
  async execute(client, interaction) {
    // Verifica se já existe um jogo ativo para este usuário no canal
    if (hasActiveGame(interaction.channelId, `mastermind_${interaction.user.id}`)) {
      return interaction.reply({
        content: 'Você já tem um jogo de Mastermind em andamento neste canal.',
        ephemeral: true
      });
    }
    
    // Obtém a dificuldade (padrão: médio - 5 cores)
    const difficulty = interaction.options.getInteger('dificuldade') || 5;
    
    // Define o número máximo de tentativas com base na dificuldade
    const maxAttempts = difficulty === 4 ? 12 : (difficulty === 5 ? 10 : 8);
    
    // Gera a sequência secreta
    const secretCode = generateSecretCode(difficulty);
    
    // Inicializa o estado do jogo
    const gameData = {
      secretCode,
      attempts: [],
      currentGuess: [],
      maxAttempts,
      difficulty,
      startTime: Date.now()
    };
    
    // Registra o jogo como ativo
    registerGame(interaction.channelId, `mastermind_${interaction.user.id}`, gameData);
    
    // Cria o embed inicial
    const gameEmbed = createGameEmbed(gameData);
    
    // Cria os componentes para seleção de cores
    const components = createComponents(gameData);
    
    // Envia a mensagem inicial
    const message = await interaction.reply({
      embeds: [gameEmbed],
      components: components,
      fetchReply: true
    });
    
    // Cria o coletor para as interações
    const filter = i => i.user.id === interaction.user.id && 
                        (i.customId === 'mastermind_select' || 
                         i.customId === 'mastermind_submit' || 
                         i.customId === 'mastermind_clear');
    
    const collector = message.createMessageComponentCollector({ filter, time: 600000 }); // 10 minutos
    
    collector.on('collect', async i => {
      if (i.customId === 'mastermind_select') {
        // Usuário selecionou uma cor
        const selectedColor = i.values[0];
        
        // Verifica se o palpite atual já está completo
        if (gameData.currentGuess.length >= difficulty) {
          await i.reply({
            content: `Você já selecionou ${difficulty} cores. Clique em "Enviar Palpite" ou "Limpar" para recomeçar.`,
            ephemeral: true
          });
          return;
        }
        
        // Adiciona a cor ao palpite atual
        gameData.currentGuess.push(selectedColor);
        
        // Atualiza o embed
        const updatedEmbed = createGameEmbed(gameData);
        
        // Atualiza os componentes
        const updatedComponents = createComponents(gameData);
        
        // Atualiza a mensagem
        await i.update({ embeds: [updatedEmbed], components: updatedComponents });
        
      } else if (i.customId === 'mastermind_clear') {
        // Usuário quer limpar o palpite atual
        gameData.currentGuess = [];
        
        // Atualiza o embed
        const updatedEmbed = createGameEmbed(gameData);
        
        // Atualiza os componentes
        const updatedComponents = createComponents(gameData);
        
        // Atualiza a mensagem
        await i.update({ embeds: [updatedEmbed], components: updatedComponents });
        
      } else if (i.customId === 'mastermind_submit') {
        // Usuário quer enviar o palpite
        
        // Verifica se o palpite está completo
        if (gameData.currentGuess.length < difficulty) {
          await i.reply({
            content: `Seu palpite está incompleto. Selecione ${difficulty} cores antes de enviar.`,
            ephemeral: true
          });
          return;
        }
        
        // Avalia o palpite
        const feedback = evaluateGuess(gameData.currentGuess, gameData.secretCode);
        
        // Adiciona o palpite e o feedback à lista de tentativas
        gameData.attempts.push({
          guess: [...gameData.currentGuess],
          feedback
        });
        
        // Limpa o palpite atual
        gameData.currentGuess = [];
        
        // Verifica se o jogador ganhou
        if (feedback.correct === difficulty) {
          // Jogador ganhou!
          const winEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎮 Mastermind - Vitória!')
            .setDescription(`🎉 Parabéns! Você descobriu a sequência secreta em ${gameData.attempts.length} tentativas!`)
            .addFields(
              { name: 'Sequência secreta', value: formatCode(gameData.secretCode) },
              { name: 'Suas tentativas', value: formatAttempts(gameData.attempts, difficulty) }
            )
            .setTimestamp();
          
          // Adiciona o tempo de jogo
          const gameTime = Math.floor((Date.now() - gameData.startTime) / 1000);
          winEmbed.addFields({ name: 'Tempo de jogo', value: `${gameTime} segundos` });
          
          // Desativa os componentes
          const disabledComponents = createDisabledComponents();
          
          // Atualiza a mensagem
          await i.update({ embeds: [winEmbed], components: disabledComponents });
          
          // Remove o jogo da lista de ativos
          removeGame(interaction.channelId, `mastermind_${interaction.user.id}`);
          
          // Encerra o coletor
          collector.stop();
          return;
        }
        
        // Verifica se o jogador esgotou as tentativas
        if (gameData.attempts.length >= gameData.maxAttempts) {
          // Jogador perdeu
          const loseEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🎮 Mastermind - Fim de Jogo')
            .setDescription(`❌ Você esgotou suas ${gameData.maxAttempts} tentativas!`)
            .addFields(
              { name: 'Sequência secreta', value: formatCode(gameData.secretCode) },
              { name: 'Suas tentativas', value: formatAttempts(gameData.attempts, difficulty) }
            )
            .setTimestamp();
          
          // Desativa os componentes
          const disabledComponents = createDisabledComponents();
          
          // Atualiza a mensagem
          await i.update({ embeds: [loseEmbed], components: disabledComponents });
          
          // Remove o jogo da lista de ativos
          removeGame(interaction.channelId, `mastermind_${interaction.user.id}`);
          
          // Encerra o coletor
          collector.stop();
          return;
        }
        
        // Jogo continua
        const updatedEmbed = createGameEmbed(gameData);
        
        // Atualiza os componentes
        const updatedComponents = createComponents(gameData);
        
        // Atualiza a mensagem
        await i.update({ embeds: [updatedEmbed], components: updatedComponents });
      }
    });
    
    collector.on('end', (collected, reason) => {
      if (reason === 'time' && hasActiveGame(interaction.channelId, `mastermind_${interaction.user.id}`)) {
        // Timeout - jogo abandonado
        const timeoutEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('⏱️ Tempo Esgotado')
          .setDescription('O jogo foi cancelado devido à inatividade.')
          .addFields({ name: 'Sequência secreta', value: formatCode(gameData.secretCode) })
          .setTimestamp();
        
        // Desativa os componentes
        const disabledComponents = createDisabledComponents();
        
        // Atualiza a mensagem
        interaction.editReply({ embeds: [timeoutEmbed], components: disabledComponents });
        
        // Remove o jogo da lista de ativos
        removeGame(interaction.channelId, `mastermind_${interaction.user.id}`);
      }
    });
  }
};

/**
 * Gera uma sequência secreta aleatória
 * @param {number} length - Comprimento da sequência
 * @returns {Array} Sequência secreta
 */
function generateSecretCode(length) {
  const code = [];
  for (let i = 0; i < length; i++) {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)].value;
    code.push(randomColor);
  }
  return code;
}

/**
 * Cria o embed do jogo
 * @param {Object} gameData - Dados do jogo
 * @returns {EmbedBuilder} Embed do jogo
 */
function createGameEmbed(gameData) {
  const embed = new EmbedBuilder()
    .setColor('#0099FF')
    .setTitle('🎮 Mastermind')
    .setDescription('Descubra a sequência secreta de cores.\n\n' +
                   '🎯 = Cor correta na posição correta\n' +
                   '⚪ = Cor correta na posição errada')
    .setTimestamp();
  
  // Adiciona informações sobre o jogo
  embed.addFields({ 
    name: 'Dificuldade', 
    value: `${gameData.difficulty} cores, ${gameData.maxAttempts} tentativas` 
  });
  
  // Adiciona o palpite atual
  if (gameData.currentGuess.length > 0) {
    embed.addFields({ 
      name: 'Palpite atual', 
      value: formatCode(gameData.currentGuess) + ' ' + '⬜'.repeat(gameData.difficulty - gameData.currentGuess.length)
    });
  } else {
    embed.addFields({ 
      name: 'Palpite atual', 
      value: '⬜'.repeat(gameData.difficulty)
    });
  }
  
  // Adiciona as tentativas anteriores
  if (gameData.attempts.length > 0) {
    embed.addFields({ 
      name: 'Suas tentativas', 
      value: formatAttempts(gameData.attempts, gameData.difficulty) 
    });
  }
  
  // Adiciona informações sobre tentativas restantes
  const attemptsLeft = gameData.maxAttempts - gameData.attempts.length;
  embed.addFields({ 
    name: 'Tentativas restantes', 
    value: `${attemptsLeft} de ${gameData.maxAttempts}` 
  });
  
  return embed;
}

/**
 * Formata um código para exibição
 * @param {Array} code - Código a ser formatado
 * @returns {string} Código formatado com emojis
 */
function formatCode(code) {
  return code.map(color => {
    const colorObj = COLORS.find(c => c.value === color);
    return colorObj ? colorObj.emoji : '⬜';
  }).join(' ');
}

/**
 * Formata as tentativas para exibição
 * @param {Array} attempts - Lista de tentativas
 * @param {number} difficulty - Dificuldade do jogo
 * @returns {string} Tentativas formatadas
 */
function formatAttempts(attempts, difficulty) {
  if (attempts.length === 0) return 'Nenhuma tentativa ainda.';
  
  return attempts.map((attempt, index) => {
    const guessDisplay = formatCode(attempt.guess);
    const feedbackDisplay = '🎯'.repeat(attempt.feedback.correct) + '⚪'.repeat(attempt.feedback.misplaced);
    return `${index + 1}. ${guessDisplay} | ${feedbackDisplay}`;
  }).join('\n');
}

/**
 * Avalia um palpite e retorna o feedback
 * @param {Array} guess - Palpite do jogador
 * @param {Array} secretCode - Código secreto
 * @returns {Object} Objeto com o número de cores corretas e mal posicionadas
 */
function evaluateGuess(guess, secretCode) {
  let correct = 0;
  let misplaced = 0;
  
  // Cria cópias para não modificar os originais
  const secretCopy = [...secretCode];
  const guessCopy = [...guess];
  
  // Primeiro, encontra cores corretas na posição correta
  for (let i = 0; i < secretCopy.length; i++) {
    if (guessCopy[i] === secretCopy[i]) {
      correct++;
      // Marca como já contabilizado
      guessCopy[i] = null;
      secretCopy[i] = null;
    }
  }
  
  // Depois, encontra cores corretas na posição errada
  for (let i = 0; i < secretCopy.length; i++) {
    if (guessCopy[i] === null) continue; // Já contabilizado
    
    const colorIndex = secretCopy.findIndex(color => color === guessCopy[i] && color !== null);
    if (colorIndex !== -1) {
      misplaced++;
      // Marca como já contabilizado
      secretCopy[colorIndex] = null;
      guessCopy[i] = null;
    }
  }
  
  return { correct, misplaced };
}

/**
 * Cria os componentes para interação
 * @param {Object} gameData - Dados do jogo
 * @returns {Array} Array de componentes
 */
function createComponents(gameData) {
  // Cria o menu de seleção de cores
  const selectRow = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('mastermind_select')
        .setPlaceholder('Selecione uma cor')
        .addOptions(COLORS.map(color => ({
          label: color.name,
          value: color.value,
          emoji: color.emoji
        })))
    );
  
  // Cria os botões de ação
  const buttonRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('mastermind_submit')
        .setLabel('Enviar Palpite')
        .setStyle(ButtonStyle.Success)
        .setDisabled(gameData.currentGuess.length < gameData.difficulty),
      new ButtonBuilder()
        .setCustomId('mastermind_clear')
        .setLabel('Limpar')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(gameData.currentGuess.length === 0)
    );
  
  return [selectRow, buttonRow];
}

/**
 * Cria componentes desativados para o fim do jogo
 * @returns {Array} Array de componentes desativados
 */
function createDisabledComponents() {
  // Cria o menu de seleção desativado
  const selectRow = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('mastermind_select')
        .setPlaceholder('Jogo finalizado')
        .setDisabled(true)
        .addOptions([{ label: 'Jogo finalizado', value: 'disabled' }])
    );
  
  // Cria os botões desativados
  const buttonRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('mastermind_submit')
        .setLabel('Jogo finalizado')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('mastermind_clear')
        .setLabel('Jogo finalizado')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
  
  return [selectRow, buttonRow];
}
