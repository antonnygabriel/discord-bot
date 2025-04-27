// src/commands/utility/roles.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('Lista todos os cargos disponíveis no servidor'),
  
  cooldown: 10,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Adia a resposta para ter tempo de coletar os dados
      await interaction.deferReply();
      
      // Obtém todos os cargos do servidor (exceto @everyone)
      const roles = interaction.guild.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position);
      
      // Verifica se o servidor tem cargos
      if (roles.size === 0) {
        return interaction.editReply('Este servidor não possui cargos além de @everyone.');
      }
      
      // Formata os cargos para exibição
      const rolesList = roles.map(role => {
        const memberCount = role.members.size;
        return `<@&${role.id}> - ${memberCount} membro${memberCount !== 1 ? 's' : ''}`;
      });
      
      // Divide a lista em chunks para não exceder o limite de caracteres
      const chunks = [];
      let currentChunk = [];
      let currentLength = 0;
      
      for (const role of rolesList) {
        if (currentLength + role.length > 1024) {
          chunks.push(currentChunk);
          currentChunk = [role];
          currentLength = role.length;
        } else {
          currentChunk.push(role);
          currentLength += role.length;
        }
      }
      
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      
      // Cria o embed com os cargos
      const rolesEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`Cargos do Servidor: ${interaction.guild.name}`)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setFooter({ text: `Solicitado por ${interaction.user.tag} | Total: ${roles.size} cargos` })
        .setTimestamp();
      
      // Adiciona os chunks como campos separados
      chunks.forEach((chunk, index) => {
        rolesEmbed.addFields({ 
          name: index === 0 ? '📋 Lista de Cargos' : '\u200B', 
          value: chunk.join('\n') 
        });
      });
      
      await interaction.editReply({ embeds: [rolesEmbed] });
    } catch (error) {
      console.error('Erro no comando roles:', error);
      await interaction.editReply({ 
        content: 'Ocorreu um erro ao listar os cargos do servidor.', 
        ephemeral: true 
      });
    }
  }
};
