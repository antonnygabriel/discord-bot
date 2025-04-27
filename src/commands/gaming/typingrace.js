// src/commands/fun/typingrace.js
/**
 * Jogo Typing Race
 * Corrida de digitação: quem digitar o texto mais rápido e com maior precisão ganha
 */

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { hasActiveGame, registerGame, removeGame } = require('../../utils/gameUtils');

// Lista de frases para digitar, organizadas por dificuldade
const phrases = {
  easy: [
    "O rato roeu a roupa do rei de Roma.",
    "Quem não arrisca, não petisca.",
    "A prática leva à perfeição.",
    "Quem canta seus males espanta.",
    "A união faz a força."
  ],
  medium: [
    "A vida é uma jornada, não um destino.",
    "Todo caminho longo começa com um primeiro passo.",
    "Água mole em pedra dura, tanto bate até que fura.",
    "Depois da tempestade vem a bonança.",
    "Não deixe para amanhã o que você pode fazer hoje."
  ],
  hard: [
    "O conhecimento é como uma ilha, quanto maior, maior é a fronteira com o desconhecido.",
    "A diferença entre o possível e o impossível está na determinação de uma pessoa.",
    "Programar é o processo de transformar cafeína em código funcional.",
    "A criatividade é a inteligência se divertindo, e a diversão é a criatividade aprendendo.",
    "A persistência é o caminho do êxito, e a paciência é a companheira da sabedoria."
  ]
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('typingrace')
    .setDescription('Inicie uma corrida de digitação')
    .addIntegerOption(option =>
      option
        .setName('dificuldade')
        .setDescription('Nível de dificuldade')
        .setRequired(false)
        .addChoices(
          { name: 'Fácil', value: 0 },
          { name: 'Médio', value: 1 },
          { name: 'Difícil', value: 2 }
        )),
  
  cooldown: 10,
  category: 'fun',
  
  async execute(client, interaction) {
    // Verifica se já existe um jogo ativo no canal
    if (hasActiveGame(interaction.channelId, 'typingrace')) {
      return interaction.reply({
        content: 'Já existe uma corrida de digitação em andamento neste canal.',
        ephemeral: true
      });
    }
    
    // Obtém a dificuldade (padrão: médio)
    const difficulty = interaction.options.getInteger('dificuldade') ?? 1;
    
    // Escolhe uma frase aleatória baseada na dificuldade
    const phrase = selectPhrase(difficulty);
    
    // Inicializa o estado do jogo
    const gameData = {
      phrase,
      participants: [],
      startTime: null,
      isOpen: true,
      difficulty,
      maxTime: 120000 // 2 minutos
    };
    
    // Registra o jogo como ativo
    registerGame(interaction.channelId, 'typingrace', gameData);
    
    // Cria o embed de registro
    const registrationEmbed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('🏁 Corrida de Digitação')
      .setDescription('Uma nova corrida de digitação está começando!\nClique no botão abaixo para participar.')
      .addFields(
        { name: 'Dificuldade', value: getDifficultyName(difficulty) },
        { name: 'Participantes', value: 'Nenhum participante ainda.' }
      )
      .setFooter({ text: 'A corrida começará em 30 segundos ou quando o host clicar em "Iniciar Agora"' })
      .setTimestamp();
    
    // Cria os botões de registro
    const registrationRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('typingrace_join')
          .setLabel('Participar')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('typingrace_start')
          .setLabel('Iniciar Agora')
          .setStyle(ButtonStyle.Primary)
      );
    
    // Envia a mensagem de registro
    const message = await interaction.reply({
      embeds: [registrationEmbed],
      components: [registrationRow],
      fetchReply: true
    });
    
    // Cria o coletor para o registro
    const filter = i => i.customId === 'typingrace_join' || i.customId === 'typingrace_start';
    const collector = message.createMessageComponentCollector({ filter, time: 30000 });
    
    collector.on('collect', async i => {
      if (i.customId === 'typingrace_join') {
        // Usuário quer participar
        if (!gameData.isOpen) {
          await i.reply({
            content: 'O período de registro já foi encerrado.',
            ephemeral: true
          });
          return;
        }
        
        // Verifica se o usuário já está registrado
        if (gameData.participants.some(p => p.id === i.user.id)) {
          await i.reply({
            content: 'Você já está registrado para esta corrida.',
            ephemeral: true
          });
          return;
        }
        
        // Adiciona o usuário à lista de participantes
        gameData.participants.push({
          id: i.user.id,
          tag: i.user.tag,
          time: null,
          accuracy: null,
          wpm: null,
          finished: false
        });
        
        // Atualiza o embed
        const updatedEmbed = new EmbedBuilder()
          .setColor('#0099FF')
          .setTitle('🏁 Corrida de Digitação')
          .setDescription('Uma nova corrida de digitação está começando!\nClique no botão abaixo para participar.')
          .addFields(
            { name: 'Dificuldade', value: getDifficultyName(difficulty) },
            { name: 'Participantes', value: gameData.participants.map(p => p.tag).join('\n') || 'Nenhum participante ainda.' }
          )
          .setFooter({ text: 'A corrida começará em 30 segundos ou quando o host clicar em "Iniciar Agora"' })
          .setTimestamp();
        
        await i.update({ embeds: [updatedEmbed], components: [registrationRow] });
        
      } else if (i.customId === 'typingrace_start') {
        // Usuário quer iniciar a corrida agora
        
        // Verifica se o usuário é o host
        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: 'Apenas quem iniciou a corrida pode iniciá-la imediatamente.',
            ephemeral: true
          });
          return;
        }
        
        // Verifica se há participantes suficientes
        if (gameData.participants.length < 1) {
          await i.reply({
            content: 'É necessário pelo menos um participante para iniciar a corrida.',
            ephemeral: true
          });
          return;
        }
        
        // Encerra o período de registro
        gameData.isOpen = false;
        collector.stop();
        
        // Inicia a corrida
        await startRace(interaction, i, gameData);
      }
    });
    
    collector.on('end', async collected => {
      if (gameData.isOpen) {
        // O tempo de registro acabou naturalmente
        
        // Verifica se há participantes suficientes
        if (gameData.participants.length < 1) {
          const cancelEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🏁 Corrida de Digitação - Cancelada')
            .setDescription('A corrida foi cancelada devido à falta de participantes.')
            .setTimestamp();
          
          await interaction.editReply({ embeds: [cancelEmbed], components: [] });
          
          // Remove o jogo da lista de ativos
          removeGame(interaction.channelId, 'typingrace');
          return;
        }
        
        // Encerra o período de registro
        gameData.isOpen = false;
        
        // Inicia a corrida
        await startRace(interaction, null, gameData);
      }
    });
  }
};

/**
 * Inicia a corrida de digitação
 * @param {CommandInteraction} interaction - Interação original
 * @param {MessageComponentInteraction|null} buttonInteraction - Interação do botão (se houver)
 * @param {Object} gameData - Dados do jogo
 */
async function startRace(interaction, buttonInteraction, gameData) {
  // Define o tempo de início
  gameData.startTime = Date.now();
  
  // Cria o embed da corrida
  const raceEmbed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('🏁 Corrida de Digitação - INICIADA!')
    .setDescription('Digite a frase abaixo o mais rápido e preciso possível!\nEnvie sua resposta neste canal.')
    .addFields(
      { name: '📝 Frase para digitar', value: `\`\`\`${gameData.phrase}\`\`\`` },
      { name: '👥 Participantes', value: gameData.participants.map(p => `${p.tag} - ⏳`).join('\n') }
    )
    .setFooter({ text: 'A corrida terminará em 2 minutos ou quando todos terminarem' })
    .setTimestamp();
  
  // Atualiza a mensagem
  if (buttonInteraction) {
    await buttonInteraction.update({ embeds: [raceEmbed], components: [] });
  } else {
    await interaction.editReply({ embeds: [raceEmbed], components: [] });
  }
  
  // Cria o coletor para as respostas
  const filter = m => gameData.participants.some(p => p.id === m.author.id && !p.finished);
  const collector = interaction.channel.createMessageCollector({ filter, time: gameData.maxTime }); // 2 minutos
  
  collector.on('collect', async message => {
    // Encontra o participante
    const participant = gameData.participants.find(p => p.id === message.author.id);
    
    // Calcula o tempo em segundos
    const timeElapsed = (Date.now() - gameData.startTime) / 1000;
    participant.time = timeElapsed;
    
    // Calcula a precisão
    participant.accuracy = calculateAccuracy(gameData.phrase, message.content);
    
    // Calcula palavras por minuto
    participant.wpm = calculateWPM(gameData.phrase, timeElapsed);
    
    // Marca como finalizado
    participant.finished = true;
    
    // Verifica se todos terminaram
    const allFinished = gameData.participants.every(p => p.finished);
    
    // Atualiza o embed
    const updatedEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🏁 Corrida de Digitação - EM ANDAMENTO')
      .setDescription('Digite a frase abaixo o mais rápido e preciso possível!\nEnvie sua resposta neste canal.')
      .addFields(
        { name: '📝 Frase para digitar', value: `\`\`\`${gameData.phrase}\`\`\`` },
        { name: '👥 Participantes', value: formatParticipants(gameData.participants) }
      )
      .setFooter({ text: allFinished ? 'Todos terminaram!' : 'A corrida terminará em 2 minutos ou quando todos terminarem' })
      .setTimestamp();
    
    await interaction.editReply({ embeds: [updatedEmbed] });
    
    // Se todos terminaram, encerra a corrida
    if (allFinished) {
      collector.stop();
    }
  });
  
  collector.on('end', async collected => {
    // Ordena os participantes por tempo (mais rápido primeiro) e precisão como desempate
    gameData.participants.sort((a, b) => {
      // Participantes que não terminaram vão para o final
      if (!a.finished && !b.finished) return 0;
      if (!a.finished) return 1;
      if (!b.finished) return -1;
      
      // Prioriza precisão acima de 90%
      if (a.accuracy >= 90 && b.accuracy < 90) return -1;
      if (a.accuracy < 90 && b.accuracy >= 90) return 1;
      
      // Para precisão similar, ordena por tempo
      return a.time - b.time;
    });
    
    // Cria o embed final
    const finalEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏁 Corrida de Digitação - RESULTADOS')
      .setDescription('A corrida terminou! Aqui estão os resultados:')
      .addFields(
        { name: '📝 Frase', value: `\`\`\`${gameData.phrase}\`\`\`` },
        { name: '🏆 Classificação', value: formatResults(gameData.participants) }
      )
      .setTimestamp();
    
    // Atualiza a mensagem
    await interaction.editReply({ embeds: [finalEmbed], components: [] });
    
    // Remove o jogo da lista de ativos
    removeGame(interaction.channelId, 'typingrace');
  });
}

/**
 * Seleciona uma frase baseada na dificuldade
 * @param {number} difficulty - Nível de dificuldade (0=fácil, 1=médio, 2=difícil)
 * @returns {string} Frase selecionada
 */
function selectPhrase(difficulty) {
  const category = difficulty === 0 ? 'easy' : (difficulty === 1 ? 'medium' : 'hard');
  const categoryPhrases = phrases[category];
  return categoryPhrases[Math.floor(Math.random() * categoryPhrases.length)];
}

/**
 * Retorna o nome da dificuldade
 * @param {number} difficulty - Nível de dificuldade
 * @returns {string} Nome da dificuldade
 */
function getDifficultyName(difficulty) {
  switch (difficulty) {
    case 0: return 'Fácil';
    case 1: return 'Médio';
    case 2: return 'Difícil';
    default: return 'Desconhecido';
  }
}

/**
 * Calcula a precisão entre duas strings
 * @param {string} original - Texto original
 * @param {string} typed - Texto digitado
 * @returns {number} Porcentagem de precisão (0-100)
 */
function calculateAccuracy(original, typed) {
  if (!typed) return 0;
  
  const originalChars = original.split('');
  const typedChars = typed.split('');
  
  let correctChars = 0;
  const maxLength = Math.max(originalChars.length, typedChars.length);
  
  for (let i = 0; i < maxLength; i++) {
    if (originalChars[i] === typedChars[i]) {
      correctChars++;
    }
  }
  
  return Math.round((correctChars / maxLength) * 100);
}

/**
 * Calcula palavras por minuto
 * @param {string} text - Texto digitado
 * @param {number} timeInSeconds - Tempo em segundos
 * @returns {number} Palavras por minuto
 */
function calculateWPM(text, timeInSeconds) {
  // Uma palavra é considerada como 5 caracteres
  const words = text.length / 5;
  const minutes = timeInSeconds / 60;
  
  return Math.round(words / minutes);
}

/**
 * Formata a lista de participantes durante a corrida
 * @param {Array} participants - Lista de participantes
 * @returns {string} Lista formatada
 */
function formatParticipants(participants) {
  return participants.map(p => {
    if (!p.finished) {
      return `${p.tag} - ⏳`;
    }
    return `${p.tag} - ✅ ${p.time.toFixed(2)}s (${p.accuracy}% precisão, ${p.wpm} PPM)`;
  }).join('\n');
}

/**
 * Formata os resultados finais
 * @param {Array} participants - Lista de participantes
 * @returns {string} Resultados formatados
 */
function formatResults(participants) {
  const medals = ['🥇', '🥈', '🥉'];
  
  return participants.map((p, index) => {
    const medal = index < 3 ? medals[index] : `${index + 1}.`;
    
    if (!p.finished) {
      return `${medal} ${p.tag} - Não completou`;
    }
    
    return `${medal} ${p.tag} - ${p.time.toFixed(2)}s (${p.accuracy}% precisão, ${p.wpm} PPM)`;
  }).join('\n');
}
