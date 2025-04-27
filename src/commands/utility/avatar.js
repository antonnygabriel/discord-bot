// src/commands/utility/avatar.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Mostra o avatar de um usuário em alta resolução')
    .addUserOption(option => 
      option
        .setName('usuario')
        .setDescription('O usuário para mostrar o avatar (padrão: você mesmo)')
        .setRequired(false)),
  
  cooldown: 5,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Obtém o usuário alvo (ou o próprio usuário que executou o comando)
      const targetUser = interaction.options.getUser('usuario') || interaction.user;
      
      // Obtém o avatar em diferentes formatos
      const avatarPNG = targetUser.displayAvatarURL({ dynamic: false, format: 'png', size: 4096 });
      const avatarJPG = targetUser.displayAvatarURL({ dynamic: false, format: 'jpg', size: 4096 });
      const avatarWebP = targetUser.displayAvatarURL({ dynamic: false, format: 'webp', size: 4096 });
      
      // Verifica se o avatar é animado (GIF)
      const isAnimated = targetUser.avatar?.startsWith('a_');
      const avatarGIF = isAnimated ? targetUser.displayAvatarURL({ dynamic: true, format: 'gif', size: 4096 }) : null;
      
      // Cria o embed com o avatar
      const avatarEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`Avatar de ${targetUser.tag}`)
        .setImage(targetUser.displayAvatarURL({ dynamic: true, size: 4096 }))
        .setDescription('Clique nos links abaixo para baixar em diferentes formatos:')
        .addFields(
          { name: 'Links', value: `[PNG](${avatarPNG}) | [JPG](${avatarJPG}) | [WebP](${avatarWebP})${isAnimated ? ` | [GIF](${avatarGIF})` : ''}` }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [avatarEmbed] });
    } catch (error) {
      console.error('Erro no comando avatar:', error);
      await interaction.reply({ 
        content: 'Ocorreu um erro ao buscar o avatar do usuário.', 
        ephemeral: true 
      });
    }
  }
};
