// src/commands/fun/guessnumber.js
/**
 * Comando de Adivinhar o Número
 * O jogador tenta adivinhar um número aleatório escolhido pelo bot
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { hasActiveGame, registerGame, removeGame, createGameEmbed, createWinEmbed, createTimeoutEmbed } = require('../../utils/gameUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guessnumber')
    .setDescription('Tente adivinhar um número de 1 a 100')
    .addIntegerOption(option =>
      option
        .setName('dificuldade')
        .setDescription('Nível de dificuldade (determina o número de tentativas)')
        .setRequired(false)
        .addChoices(
          { name: 'Fácil (15 tentativas)', value: 15 },
          { name: 'Médio (10 tentativas)', value: 10 },
          { name: 'Difícil (7 tentativas)', value: 7 },
          { name: 'Extremo (5 tentativas)', value: 5 }
        )),
  
  cooldown: 10,
  category: 'fun',
  
  async execute(client, interaction) {
    // Verifica se já existe um jogo ativo para este usuário no canal
    if (hasActiveGame(interaction.channelId, `guessnumber_${interaction.user.id}`)) {
      return interaction.reply({
        content: 'Você já tem um jogo de adivinhar o número em andamento neste canal.',
        ephemeral: true
      });
    }
    
    // Obtém a dificuldade (padrão: médio - 10 tentativas)
    const maxAttempts = interaction.options.getInteger('dificuldade') || 10;
    
    // Gera um número aleatório entre 1 e 100
    const secretNumber = Math.floor(Math.random() * 100) + 1;
    
    // Cria o objeto do jogo
    const gameData = {
      secretNumber,
      attempts: 0,
      maxAttempts,
      guesses: []
    };
    
    // Registra o jogo como ativo
    registerGame(interaction.channelId, `guessnumber_${interaction.user.id}`, gameData);
    
    // Cria o embed inicial
    const gameEmbed = createGameEmbed(
      '🔢 Adivinhe o Número',
      `Estou pensando em um número entre 1 e 100.\nVocê tem ${maxAttempts} tentativas para adivinhar!\n\nDigite um número usando o botão abaixo.`
    );
    
    // Cria o botão para fazer um palpite
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('guess_number_button')
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
    const filter = i => i.user.id === interaction.user.id && i.customId === 'guess_number_button';
    const collector = message.createMessageComponentCollector({ filter, time: 300000 }); // 5 minutos
    
    collector.on('collect', async i => {
      // Cria um modal para o palpite
      const modal = {
        title: 'Adivinhe o Número',
        custom_id: 'guess_number_modal',
        components: [{
          type: 1,
          components: [{
            type: 4,
            custom_id: 'guess_input',
            label: 'Digite seu palpite (1-100)',
            style: 1,
            min_length: 1,
            max_length: 3,
            placeholder: 'Digite um número entre 1 e 100',
            required: true
          }]
        }]
      };
      
      // Mostra o modal
      await i.showModal(modal);
      
      // Aguarda a resposta do modal
      try {
        const modalResponse = await i.awaitModalSubmit({ time: 60000, filter: i => i.user.id === interaction.user.id });
        
        // Obtém o palpite
        const guess = parseInt(modalResponse.fields.getTextInputValue('guess_input'));
        
        // Verifica se o palpite é válido
        if (isNaN(guess) || guess < 1 || guess > 100) {
          await modalResponse.reply({
            content: 'Por favor, digite um número válido entre 1 e 100.',
            ephemeral: true
          });
          return;
        }
        
        // Incrementa o número de tentativas
        gameData.attempts++;
        gameData.guesses.push(guess);
        
        // Verifica se o palpite está correto
        if (guess === secretNumber) {
          // Jogador acertou!
          const winEmbed = createWinEmbed(
            interaction.user.username,
            'Adivinhe o Número',
            `🎉 Parabéns! Você acertou em ${gameData.attempts} tentativas!\n\nO número era ${secretNumber}.`
          );
          
          // Adiciona o histórico de palpites
          winEmbed.addFields({
            name: 'Seus palpites',
            value: gameData.guesses.join(', ')
          });
          
          // Desativa o botão
          const disabledRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('guess_number_button')
                .setLabel('Jogo finalizado')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true)
            );
          
          // Atualiza a mensagem
          await modalResponse.update({ embeds: [winEmbed], components: [disabledRow] });
          
          // Remove o jogo da lista de ativos
          removeGame(interaction.channelId, `guessnumber_${interaction.user.id}`);
          
          // Encerra o coletor
          collector.stop();
          return;
        }
        
        // Verifica se o jogador esgotou as tentativas
        if (gameData.attempts >= maxAttempts) {
          // Jogador perdeu
          const loseEmbed = createGameEmbed(
            '🔢 Adivinhe o Número - Fim de Jogo',
            `❌ Você esgotou suas ${maxAttempts} tentativas!\n\nO número era ${secretNumber}.`,
            '#FF0000'
          );
          
          // Adiciona o histórico de palpites
          loseEmbed.addFields({
            name: 'Seus palpites',
            value: gameData.guesses.join(', ')
          });
          
          // Desativa o botão
          const disabledRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('guess_number_button')
                .setLabel('Jogo finalizado')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true)
            );
          
          // Atualiza a mensagem
          await modalResponse.update({ embeds: [loseEmbed], components: [disabledRow] });
          
          // Remove o jogo da lista de ativos
          removeGame(interaction.channelId, `guessnumber_${interaction.user.id}`);
          
          // Encerra o coletor
          collector.stop();
          return;
        }
        
        // Jogador ainda tem tentativas
        const hint = guess < secretNumber ? 'maior' : 'menor';
        const distance = Math.abs(guess - secretNumber);
        let hintEmoji = '';
        
        // Adiciona emoji baseado na distância
        if (distance <= 5) hintEmoji = '🔥 Muito quente!';
        else if (distance <= 10) hintEmoji = '😮 Quente!';
        else if (distance <= 20) hintEmoji = '😐 Morno.';
        else if (distance <= 40) hintEmoji = '❄️ Frio.';
        else hintEmoji = '🧊 Muito frio!';
        
        // Cria o embed atualizado
        const updatedEmbed = createGameEmbed(
          '🔢 Adivinhe o Número',
          `Tentativa ${gameData.attempts}/${maxAttempts}\n\nSeu palpite: ${guess}\nDica: O número é **${hint}**\n${hintEmoji}\n\nTentativas restantes: ${maxAttempts - gameData.attempts}`
        );
        
        // Adiciona o histórico de palpites
        updatedEmbed.addFields({
          name: 'Seus palpites',
          value: gameData.guesses.join(', ')
        });
        
        // Atualiza a mensagem
        await modalResponse.update({ embeds: [updatedEmbed], components: [row] });
      } catch (error) {
        // Timeout do modal ou erro
        console.error('Erro no modal de palpite:', error);
      }
    });
    
    collector.on('end', (collected, reason) => {
      if (reason === 'time' && hasActiveGame(interaction.channelId, `guessnumber_${interaction.user.id}`)) {
        // Timeout - jogo abandonado
        const timeoutEmbed = createTimeoutEmbed('Adivinhe o Número');
        
        // Adiciona o número secreto
        timeoutEmbed.addFields({
          name: 'O número era',
          value: `${secretNumber}`
        });
        
        // Desativa o botão
        const disabledRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('guess_number_button')
              .setLabel('Tempo esgotado')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true)
          );
        
        // Atualiza a mensagem
        interaction.editReply({ embeds: [timeoutEmbed], components: [disabledRow] });
        
        // Remove o jogo da lista de ativos
        removeGame(interaction.channelId, `guessnumber_${interaction.user.id}`);
      }
    });
  }
};
