// src/commands/utility/servericon.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('servericon')
    .setDescription('Mostra o ícone atual do servidor em alta qualidade'),
  
  cooldown: 5,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Verifica se o servidor tem um ícone
      if (!interaction.guild.icon) {
        return interaction.reply({
          content: 'Este servidor não possui um ícone.',
          ephemeral: true
        });
      }
      
      // Obtém o ícone em diferentes formatos
      const iconPNG = interaction.guild.iconURL({ dynamic: false, format: 'png', size: 4096 });
      const iconJPG = interaction.guild.iconURL({ dynamic: false, format: 'jpg', size: 4096 });
      const iconWebP = interaction.guild.iconURL({ dynamic: false, format: 'webp', size: 4096 });
      
      // Verifica se o ícone é animado (GIF)
      const isAnimated = interaction.guild.icon.startsWith('a_');
      const iconGIF = isAnimated ? interaction.guild.iconURL({ dynamic: true, format: 'gif', size: 4096 }) : null;
      
      // Cria o embed com o ícone
      const iconEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`Ícone do Servidor: ${interaction.guild.name}`)
        .setImage(interaction.guild.iconURL({ dynamic: true, size: 4096 }))
        .setDescription('Clique nos links abaixo para baixar em diferentes formatos:')
        .addFields(
          { name: 'Links', value: `[PNG](${iconPNG}) | [JPG](${iconJPG}) | [WebP](${iconWebP})${isAnimated ? ` | [GIF](${iconGIF})` : ''}` }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [iconEmbed] });
    } catch (error) {
      console.error('Erro no comando servericon:', error);
      await interaction.reply({ 
        content: 'Ocorreu um erro ao buscar o ícone do servidor.', 
        ephemeral: true 
      });
    }
  }
};
