// src/commands/fun/tictactoe.js
/**
 * Comando de Jogo da Velha
 * Permite jogar contra outro usuário usando botões interativos
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { hasActiveGame, registerGame, removeGame, createGameEmbed, createWinEmbed, createTieEmbed, createTimeoutEmbed } = require('../../utils/gameUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tictactoe')
    .setDescription('Jogue Jogo da Velha com outro usuário')
    .addUserOption(option => 
      option
        .setName('oponente')
        .setDescription('Usuário para jogar contra')
        .setRequired(true)),
  
  cooldown: 10,
  category: 'fun',
  
  async execute(client, interaction) {
    // Verifica se já existe um jogo ativo no canal
    if (hasActiveGame(interaction.channelId, 'tictactoe')) {
      return interaction.reply({
        content: 'Já existe um jogo da velha em andamento neste canal.',
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
    const inviteEmbed = createGameEmbed(
      '🎮 Jogo da Velha - Convite',
      `${opponent}, você foi desafiado para uma partida de Jogo da Velha por ${interaction.user}.\nVocê aceita o desafio?`
    );
    
    // Cria os botões de aceitar/recusar
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ttt_accept')
          .setLabel('Aceitar')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('ttt_decline')
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
    const filter = i => i.user.id === opponent.id && i.customId.startsWith('ttt_');
    const collector = message.createMessageComponentCollector({ filter, time: 30000, max: 1 });
    
    collector.on('collect', async i => {
      if (i.customId === 'ttt_accept') {
        // Oponente aceitou o desafio
        await startGame(interaction, i, interaction.user, opponent);
      } else {
        // Oponente recusou o desafio
        const declineEmbed = createGameEmbed(
          '🎮 Jogo da Velha - Recusado',
          `${opponent} recusou o desafio de ${interaction.user}.`,
          '#FF0000'
        );
        
        await i.update({ embeds: [declineEmbed], components: [] });
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        // Timeout - oponente não respondeu
        const timeoutEmbed = createTimeoutEmbed('Jogo da Velha');
        interaction.editReply({ embeds: [timeoutEmbed], components: [] });
      }
    });
  }
};

/**
 * Inicia o jogo da velha
 * @param {CommandInteraction} interaction - Interação original
 * @param {MessageComponentInteraction} buttonInteraction - Interação do botão
 * @param {User} player1 - Jogador 1 (X)
 * @param {User} player2 - Jogador 2 (O)
 */
async function startGame(interaction, buttonInteraction, player1, player2) {
  // Cria o tabuleiro inicial (array 3x3 com valores vazios)
  const board = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ];
  
  // Define o jogador atual (X começa)
  const gameData = {
    board,
    currentPlayer: player1.id,
    player1: player1.id,
    player2: player2.id,
    symbols: {
      [player1.id]: 'X',
      [player2.id]: 'O'
    }
  };
  
  // Registra o jogo como ativo
  registerGame(interaction.channelId, 'tictactoe', gameData);
  
  // Cria o embed do jogo
  const gameEmbed = createGameEmbed(
    '🎮 Jogo da Velha',
    `${player1} (X) vs ${player2} (O)\n\nVez de ${gameData.currentPlayer === player1.id ? player1 : player2} (${gameData.symbols[gameData.currentPlayer]})`
  );
  
  // Cria os botões do tabuleiro
  const components = createBoardComponents(board);
  
  // Atualiza a mensagem com o tabuleiro
  await buttonInteraction.update({ embeds: [gameEmbed], components });
  
  // Cria o coletor para as jogadas
  const message = await interaction.fetchReply();
  const filter = i => (i.user.id === player1.id || i.user.id === player2.id) && i.customId.startsWith('ttt_cell_');
  const collector = message.createMessageComponentCollector({ filter, time: 300000 }); // 5 minutos
  
  collector.on('collect', async i => {
    // Verifica se é a vez do jogador
    if (i.user.id !== gameData.currentPlayer) {
      return i.reply({ content: 'Não é sua vez de jogar!', ephemeral: true });
    }
    
    // Obtém as coordenadas da célula
    const [, row, col] = i.customId.split('_');
    const rowIndex = parseInt(row);
    const colIndex = parseInt(col);
    
    // Verifica se a célula está vazia
    if (board[rowIndex][colIndex] !== '') {
      return i.reply({ content: 'Esta célula já está ocupada!', ephemeral: true });
    }
    
    // Faz a jogada
    board[rowIndex][colIndex] = gameData.symbols[gameData.currentPlayer];
    
    // Verifica se há um vencedor
    const winner = checkWinner(board);
    
    if (winner) {
      // Há um vencedor
      const winnerUser = winner === 'X' ? player1 : player2;
      const winEmbed = createWinEmbed(
        winnerUser.username,
        'Jogo da Velha',
        `${winnerUser} (${winner}) venceu o jogo!`
      );
      
      // Cria os componentes finais (desativados)
      const finalComponents = createBoardComponents(board, true);
      
      // Atualiza a mensagem
      await i.update({ embeds: [winEmbed], components: finalComponents });
      
      // Remove o jogo da lista de ativos
      removeGame(interaction.channelId, 'tictactoe');
      
      // Encerra o coletor
      collector.stop();
      return;
    }
    
    // Verifica se é um empate
    if (isBoardFull(board)) {
      const tieEmbed = createTieEmbed(
        'Jogo da Velha',
        'O jogo terminou em empate!'
      );
      
      // Cria os componentes finais (desativados)
      const finalComponents = createBoardComponents(board, true);
      
      // Atualiza a mensagem
      await i.update({ embeds: [tieEmbed], components: finalComponents });
      
      // Remove o jogo da lista de ativos
      removeGame(interaction.channelId, 'tictactoe');
      
      // Encerra o coletor
      collector.stop();
      return;
    }
    
    // Alterna o jogador atual
    gameData.currentPlayer = gameData.currentPlayer === player1.id ? player2.id : player1.id;
    
    // Atualiza o embed do jogo
    const updatedEmbed = createGameEmbed(
      '🎮 Jogo da Velha',
      `${player1} (X) vs ${player2} (O)\n\nVez de ${gameData.currentPlayer === player1.id ? player1 : player2} (${gameData.symbols[gameData.currentPlayer]})`
    );
    
    // Atualiza os componentes do tabuleiro
    const updatedComponents = createBoardComponents(board);
    
    // Atualiza a mensagem
    await i.update({ embeds: [updatedEmbed], components: updatedComponents });
  });
  
  collector.on('end', (collected, reason) => {
    if (reason === 'time') {
      // Timeout - jogo abandonado
      const timeoutEmbed = createTimeoutEmbed('Jogo da Velha');
      
      // Cria os componentes finais (desativados)
      const finalComponents = createBoardComponents(board, true);
      
      // Atualiza a mensagem
      interaction.editReply({ embeds: [timeoutEmbed], components: finalComponents });
      
      // Remove o jogo da lista de ativos
      removeGame(interaction.channelId, 'tictactoe');
    }
  });
}

/**
 * Cria os componentes do tabuleiro
 * @param {Array} board - Tabuleiro do jogo
 * @param {boolean} disabled - Se os botões devem estar desativados
 * @returns {Array} Array de ActionRowBuilder com os botões
 */
function createBoardComponents(board, disabled = false) {
  const components = [];
  
  for (let row = 0; row < 3; row++) {
    const actionRow = new ActionRowBuilder();
    
    for (let col = 0; col < 3; col++) {
      const cell = board[row][col];
      
      let style = ButtonStyle.Secondary;
      let label = ' ';
      
      if (cell === 'X') {
        style = ButtonStyle.Danger;
        label = 'X';
      } else if (cell === 'O') {
        style = ButtonStyle.Success;
        label = 'O';
      }
      
      actionRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`ttt_cell_${row}_${col}`)
          .setLabel(label)
          .setStyle(style)
          .setDisabled(disabled || cell !== '')
      );
    }
    
    components.push(actionRow);
  }
  
  return components;
}

/**
 * Verifica se há um vencedor
 * @param {Array} board - Tabuleiro do jogo
 * @returns {string|null} Símbolo do vencedor ou null se não houver
 */
function checkWinner(board) {
  // Verifica linhas
  for (let row = 0; row < 3; row++) {
    if (board[row][0] && board[row][0] === board[row][1] && board[row][0] === board[row][2]) {
      return board[row][0];
    }
  }
  
  // Verifica colunas
  for (let col = 0; col < 3; col++) {
    if (board[0][col] && board[0][col] === board[1][col] && board[0][col] === board[2][col]) {
      return board[0][col];
    }
  }
  
  // Verifica diagonais
  if (board[0][0] && board[0][0] === board[1][1] && board[0][0] === board[2][2]) {
    return board[0][0];
  }
  
  if (board[0][2] && board[0][2] === board[1][1] && board[0][2] === board[2][0]) {
    return board[0][2];
  }
  
  return null;
}

/**
 * Verifica se o tabuleiro está cheio
 * @param {Array} board - Tabuleiro do jogo
 * @returns {boolean} Se o tabuleiro está cheio
 */
function isBoardFull(board) {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (board[row][col] === '') {
        return false;
      }
    }
  }
  
  return true;
}
