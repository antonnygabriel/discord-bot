// src/commands/utility/emojilist.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('emojilist')
    .setDescription('Lista todos os emojis do servidor'),
  
  cooldown: 10,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Adia a resposta para ter tempo de coletar os dados
      await interaction.deferReply();
      
      // Obtém todos os emojis do servidor
      const emojis = interaction.guild.emojis.cache;
      
      // Verifica se o servidor tem emojis
      if (emojis.size === 0) {
        return interaction.editReply('Este servidor não possui emojis personalizados.');
      }
      
      // Separa os emojis animados dos estáticos
      const animatedEmojis = emojis.filter(emoji => emoji.animated);
      const staticEmojis = emojis.filter(emoji => !emoji.animated);
      
      // Formata os emojis para exibição
      const formatEmojis = (emojiCollection) => {
        return emojiCollection.map(emoji => `${emoji} \`:${emoji.name}:\``).join(' ');
      };
      
      // Cria o embed com os emojis
      const emojiEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`Emojis do Servidor: ${interaction.guild.name}`)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      // Adiciona os emojis estáticos, se houver
      if (staticEmojis.size > 0) {
        // Divide em grupos de 20 para não exceder o limite de caracteres
        const staticGroups = [];
        let currentGroup = [];
        let currentLength = 0;
        
        staticEmojis.forEach(emoji => {
          const emojiText = `${emoji} \`:${emoji.name}:\` `;
          if (currentLength + emojiText.length > 1024) {
            staticGroups.push(currentGroup.join(' '));
            currentGroup = [emojiText];
            currentLength = emojiText.length;
          } else {
            currentGroup.push(emojiText);
            currentLength += emojiText.length;
          }
        });
        
        if (currentGroup.length > 0) {
          staticGroups.push(currentGroup.join(' '));
        }
        
        // Adiciona cada grupo como um campo separado
        staticGroups.forEach((group, index) => {
          emojiEmbed.addFields({ 
            name: index === 0 ? `😀 Emojis Estáticos (${staticEmojis.size})` : '\u200B', 
            value: group 
          });
        });
      } else {
        emojiEmbed.addFields({ 
          name: '😀 Emojis Estáticos', 
          value: 'Nenhum emoji estático encontrado.' 
        });
      }
      
      // Adiciona os emojis animados, se houver
      if (animatedEmojis.size > 0) {
        // Divide em grupos de 20 para não exceder o limite de caracteres
        const animatedGroups = [];
        let currentGroup = [];
        let currentLength = 0;
        
        animatedEmojis.forEach(emoji => {
          const emojiText = `${emoji} \`:${emoji.name}:\` `;
          if (currentLength + emojiText.length > 1024) {
            animatedGroups.push(currentGroup.join(' '));
            currentGroup = [emojiText];
            currentLength = emojiText.length;
          } else {
            currentGroup.push(emojiText);
            currentLength += emojiText.length;
          }
        });
        
        if (currentGroup.length > 0) {
          animatedGroups.push(currentGroup.join(' '));
        }
        
        // Adiciona cada grupo como um campo separado
        animatedGroups.forEach((group, index) => {
          emojiEmbed.addFields({ 
            name: index === 0 ? `🎭 Emojis Animados (${animatedEmojis.size})` : '\u200B', 
            value: group 
          });
        });
      } else {
        emojiEmbed.addFields({ 
          name: '🎭 Emojis Animados', 
          value: 'Nenhum emoji animado encontrado.' 
        });
      }
      
      // Adiciona estatísticas
      emojiEmbed.addFields({ 
        name: '📊 Estatísticas', 
        value: `**Total de Emojis:** ${emojis.size}\n**Estáticos:** ${staticEmojis.size}\n**Animados:** ${animatedEmojis.size}` 
      });
      
      await interaction.editReply({ embeds: [emojiEmbed] });
    } catch (error) {
      console.error('Erro no comando emojilist:', error);
      await interaction.editReply({ 
        content: 'Ocorreu um erro ao listar os emojis do servidor.', 
        ephemeral: true 
      });
    }
  }
};
