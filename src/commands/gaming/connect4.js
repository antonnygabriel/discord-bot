// src/commands/fun/connect4.js
/**
 * Jogo Connect Four (Conecte 4)
 * Um jogo de estratégia para dois jogadores onde o objetivo é conectar quatro peças em linha
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { hasActiveGame, registerGame, removeGame } = require('../../utils/gameUtils');

// Emojis para o tabuleiro
const EMPTY = '⚪';
const PLAYER1 = '🔴';
const PLAYER2 = '🔵';
const NUMBERS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('connect4')
    .setDescription('Jogue Connect Four contra outro usuário')
    .addUserOption(option => 
      option
        .setName('oponente')
        .setDescription('Usuário para jogar contra')
        .setRequired(true)),
  
  cooldown: 10,
  category: 'fun',
  
  async execute(client, interaction) {
    // Verifica se já existe um jogo ativo no canal
    if (hasActiveGame(interaction.channelId, 'connect4')) {
      return interaction.reply({
        content: 'Já existe um jogo de Connect Four em andamento neste canal.',
        ephemeral: true
      });
    }
    
    // Obtém o oponente
    const opponent = interaction.options.getUser('oponente');
    
    // Verifica se o oponente é o próprio usuário ou um bot
    if (opponent.id === interaction.user.id) {
      return interaction.reply({
        content: 'Você não pode jogar contra si mesmo.',
        ephemeral: true
      });
    }
    
    if (opponent.bot) {
      return interaction.reply({
        content: 'Você não pode jogar contra um bot.',
        ephemeral: true
      });
    }
    
    // Cria o embed de convite
    const inviteEmbed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('🎮 Connect Four - Convite')
      .setDescription(`${opponent}, você foi desafiado para uma partida de Connect Four por ${interaction.user}.\nVocê aceita o desafio?`)
      .setTimestamp();
    
    // Cria os botões de aceitar/recusar
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('c4_accept')
          .setLabel('Aceitar')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('c4_decline')
          .setLabel('Recusar')
          .setStyle(ButtonStyle.Danger)
      );
    
    // Envia o convite
    const message = await interaction.reply({
      embeds: [inviteEmbed],
      components: [row],
      fetchReply: true
    });
    
    // Cria o coletor para a resposta do convite
    const filter = i => i.user.id === opponent.id && i.customId.startsWith('c4_');
    const collector = message.createMessageComponentCollector({ filter, time: 30000, max: 1 });
    
    collector.on('collect', async i => {
      if (i.customId === 'c4_accept') {
        // Oponente aceitou o desafio
        await startGame(interaction, i, interaction.user, opponent);
      } else {
        // Oponente recusou o desafio
        const declineEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🎮 Connect Four - Recusado')
          .setDescription(`${opponent} recusou o desafio de ${interaction.user}.`)
          .setTimestamp();
        
        await i.update({ embeds: [declineEmbed], components: [] });
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        // Timeout - oponente não respondeu
        const timeoutEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('⏱️ Tempo Esgotado')
          .setDescription(`${opponent} não respondeu ao desafio a tempo.`)
          .setTimestamp();
        
        interaction.editReply({ embeds: [timeoutEmbed], components: [] });
      }
    });
  }
};

/**
 * Inicia o jogo Connect Four
 * @param {CommandInteraction} interaction - Interação original
 * @param {MessageComponentInteraction} buttonInteraction - Interação do botão
 * @param {User} player1 - Jogador 1 (🔴)
 * @param {User} player2 - Jogador 2 (🔵)
 */
async function startGame(interaction, buttonInteraction, player1, player2) {
  // Cria o tabuleiro vazio (6 linhas x 7 colunas)
  const board = Array(6).fill().map(() => Array(7).fill(EMPTY));
  
  // Define o jogador atual (player1 começa)
  const gameData = {
    board,
    currentPlayer: player1.id,
    player1: player1.id,
    player2: player2.id,
    symbols: {
      [player1.id]: PLAYER1,
      [player2.id]: PLAYER2
    }
  };
  
  // Registra o jogo como ativo
  registerGame(interaction.channelId, 'connect4', gameData);
  
  // Cria o embed do jogo
  const gameEmbed = createGameEmbed(player1, player2, board, gameData.currentPlayer);
  
  // Cria os botões para as colunas
  const components = createBoardButtons();
  
  // Atualiza a mensagem com o tabuleiro
  await buttonInteraction.update({ embeds: [gameEmbed], components: components });
  
  // Cria o coletor para as jogadas
  const message = await interaction.fetchReply();
  const filter = i => (i.user.id === player1.id || i.user.id === player2.id) && i.customId.startsWith('c4_col_');
  const collector = message.createMessageComponentCollector({ filter, time: 300000 }); // 5 minutos
  
  collector.on('collect', async i => {
    // Verifica se é a vez do jogador
    if (i.user.id !== gameData.currentPlayer) {
      return i.reply({ content: 'Não é sua vez de jogar!', ephemeral: true });
    }
    
    // Obtém a coluna selecionada
    const column = parseInt(i.customId.split('_')[2]);
    
    // Verifica se a coluna está cheia
    if (board[0][column] !== EMPTY) {
      return i.reply({ content: 'Esta coluna está cheia!', ephemeral: true });
    }
    
    // Encontra a primeira posição vazia de baixo para cima
    let row = 5;
    while (row >= 0 && board[row][column] !== EMPTY) {
      row--;
    }
    
    // Faz a jogada
    board[row][column] = gameData.symbols[gameData.currentPlayer];
    
    // Verifica se há um vencedor
    const winner = checkWinner(board, gameData.symbols[gameData.currentPlayer]);
    
    if (winner) {
      // Há um vencedor
      const winnerUser = gameData.currentPlayer === player1.id ? player1 : player2;
      const winEmbed = new EmbedBuilder()
        .setColor(gameData.currentPlayer === player1.id ? '#FF0000' : '#0000FF')
        .setTitle('🎮 Connect Four - Fim de Jogo')
        .setDescription(`${winnerUser} (${gameData.symbols[gameData.currentPlayer]}) venceu o jogo!`)
        .addFields({ name: 'Tabuleiro Final', value: boardToString(board) })
        .setTimestamp();
      
      // Cria os componentes finais (desativados)
      const finalComponents = createBoardButtons(true);
      
      // Atualiza a mensagem
      await i.update({ embeds: [winEmbed], components: finalComponents });
      
      // Remove o jogo da lista de ativos
      removeGame(interaction.channelId, 'connect4');
      
      // Encerra o coletor
      collector.stop();
      return;
    }
    
    // Verifica se é um empate (tabuleiro cheio)
    if (isBoardFull(board)) {
      const tieEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('🎮 Connect Four - Empate')
        .setDescription('O jogo terminou em empate!')
        .addFields({ name: 'Tabuleiro Final', value: boardToString(board) })
        .setTimestamp();
      
      // Cria os componentes finais (desativados)
      const finalComponents = createBoardButtons(true);
      
      // Atualiza a mensagem
      await i.update({ embeds: [tieEmbed], components: finalComponents });
      
      // Remove o jogo da lista de ativos
      removeGame(interaction.channelId, 'connect4');
      
      // Encerra o coletor
      collector.stop();
      return;
    }
    
    // Alterna o jogador atual
    gameData.currentPlayer = gameData.currentPlayer === player1.id ? player2.id : player1.id;
    
    // Atualiza o embed do jogo
    const updatedEmbed = createGameEmbed(player1, player2, board, gameData.currentPlayer);
    
    // Atualiza a mensagem
    await i.update({ embeds: [updatedEmbed], components: components });
  });
  
  collector.on('end', (collected, reason) => {
    if (reason === 'time' && hasActiveGame(interaction.channelId, 'connect4')) {
      // Timeout - jogo abandonado
      const timeoutEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('⏱️ Tempo Esgotado')
        .setDescription('O jogo foi cancelado devido à inatividade.')
        .addFields({ name: 'Tabuleiro Final', value: boardToString(board) })
        .setTimestamp();
      
      // Cria os componentes finais (desativados)
      const finalComponents = createBoardButtons(true);
      
      // Atualiza a mensagem
      interaction.editReply({ embeds: [timeoutEmbed], components: finalComponents });
      
      // Remove o jogo da lista de ativos
      removeGame(interaction.channelId, 'connect4');
    }
  });
}

/**
 * Cria o embed do jogo
 * @param {User} player1 - Jogador 1
 * @param {User} player2 - Jogador 2
 * @param {Array} board - Tabuleiro do jogo
 * @param {string} currentPlayerId - ID do jogador atual
 * @returns {EmbedBuilder} Embed do jogo
 */
function createGameEmbed(player1, player2, board, currentPlayerId) {
  const currentPlayer = currentPlayerId === player1.id ? player1 : player2;
  const playerSymbol = currentPlayerId === player1.id ? PLAYER1 : PLAYER2;
  
  return new EmbedBuilder()
    .setColor(currentPlayerId === player1.id ? '#FF0000' : '#0000FF')
    .setTitle('🎮 Connect Four')
    .setDescription(`${player1} (${PLAYER1}) vs ${player2} (${PLAYER2})`)
    .addFields(
      { name: 'Tabuleiro', value: boardToString(board) },
      { name: 'Vez de', value: `${currentPlayer} (${playerSymbol})` }
    )
    .setFooter({ text: 'Clique em um número para jogar nessa coluna' })
    .setTimestamp();
}

/**
 * Converte o tabuleiro para string
 * @param {Array} board - Tabuleiro do jogo
 * @returns {string} Representação do tabuleiro em string
 */
function boardToString(board) {
  // Adiciona os números das colunas
  let result = NUMBERS.join('');
  
  // Adiciona as linhas do tabuleiro
  for (let row = 0; row < board.length; row++) {
    result += '\n';
    for (let col = 0; col < board[row].length; col++) {
      result += board[row][col];
    }
  }
  
  return result;
}

/**
 * Cria os botões para as colunas do tabuleiro
 * @param {boolean} disabled - Se os botões devem estar desativados
 * @returns {Array} Array de ActionRowBuilder com os botões
 */
function createBoardButtons(disabled = false) {
  const row = new ActionRowBuilder();
  
  for (let col = 0; col < 7; col++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`c4_col_${col}`)
        .setLabel(`${col + 1}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled)
    );
  }
  
  return [row];
}

/**
 * Verifica se há um vencedor
 * @param {Array} board - Tabuleiro do jogo
 * @param {string} symbol - Símbolo do jogador
 * @returns {boolean} Se há um vencedor
 */
function checkWinner(board, symbol) {
  // Verifica linhas horizontais
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      if (board[row][col] === symbol &&
          board[row][col+1] === symbol &&
          board[row][col+2] === symbol &&
          board[row][col+3] === symbol) {
        return true;
      }
    }
  }
  
  // Verifica linhas verticais
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 7; col++) {
      if (board[row][col] === symbol &&
          board[row+1][col] === symbol &&
          board[row+2][col] === symbol &&
          board[row+3][col] === symbol) {
        return true;
      }
    }
  }
  
  // Verifica diagonais (/)
  for (let row = 3; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      if (board[row][col] === symbol &&
          board[row-1][col+1] === symbol &&
          board[row-2][col+2] === symbol &&
          board[row-3][col+3] === symbol) {
        return true;
      }
    }
  }
  
  // Verifica diagonais (\)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      if (board[row][col] === symbol &&
          board[row+1][col+1] === symbol &&
          board[row+2][col+2] === symbol &&
          board[row+3][col+3] === symbol) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Verifica se o tabuleiro está cheio
 * @param {Array} board - Tabuleiro do jogo
 * @returns {boolean} Se o tabuleiro está cheio
 */
function isBoardFull(board) {
  return board[0].every(cell => cell !== EMPTY);
}
