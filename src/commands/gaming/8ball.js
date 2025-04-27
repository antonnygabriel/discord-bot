// src/commands/fun/8ball.js
/**
 * Comando de Bola 8 Mágica
 * Responde a perguntas do usuário com respostas aleatórias e místicas
 */

const { SlashCommandBuilder } = require('discord.js');
const { createGameEmbed } = require('../../utils/gameUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Pergunte algo à bola 8 mágica')
    .addStringOption(option => 
      option
        .setName('pergunta')
        .setDescription('O que você quer perguntar?')
        .setRequired(true)),
  
  cooldown: 5,
  category: 'fun',
  
  async execute(client, interaction) {
    // Obtém a pergunta
    const question = interaction.options.getString('pergunta');
    
    // Verifica se a pergunta termina com ponto de interrogação
    const formattedQuestion = question.endsWith('?') ? question : `${question}?`;
    
    // Lista de respostas possíveis
    const responses = [
      // Respostas positivas
      'Com certeza!',
      'Definitivamente sim.',
      'Sem dúvida.',
      'Sim, certamente.',
      'Você pode contar com isso.',
      'A meu ver, sim.',
      'Provavelmente.',
      'As perspectivas são boas.',
      'Sim.',
      'Sinais apontam que sim.',
      
      // Respostas neutras
      'Resposta nebulosa, tente novamente.',
      'Pergunte novamente mais tarde.',
      'Melhor não te dizer agora.',
      'Não posso prever agora.',
      'Concentre-se e pergunte novamente.',
      
      // Respostas negativas
      'Não conte com isso.',
      'Minha resposta é não.',
      'Minhas fontes dizem que não.',
      'As perspectivas não são boas.',
      'Muito duvidoso.'
    ];
    
    // Escolhe uma resposta aleatória
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    // Determina a cor com base no tipo de resposta
    let color = '#0099FF'; // Neutro (padrão)
    
    if (responses.indexOf(response) < 10) {
      color = '#00FF00'; // Positivo (verde)
    } else if (responses.indexOf(response) >= 15) {
      color = '#FF0000'; // Negativo (vermelho)
    }
    
    // Cria o embed de resposta
    const responseEmbed = createGameEmbed(
      '🎱 Bola 8 Mágica',
      `**Pergunta:** ${formattedQuestion}\n\n**Resposta:** ${response}`,
      color
    );
    
    // Adiciona um footer místico
    responseEmbed.setFooter({ text: 'Os mistérios do universo foram consultados...' });
    
    // Responde à interação
    await interaction.reply({ embeds: [responseEmbed] });
  }
};
