// src/commands/utility/banner.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('Mostra o banner de perfil de um usuário')
    .addUserOption(option => 
      option
        .setName('usuario')
        .setDescription('O usuário para mostrar o banner (padrão: você mesmo)')
        .setRequired(false)),
  
  cooldown: 5,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Obtém o usuário alvo (ou o próprio usuário que executou o comando)
      const targetUser = interaction.options.getUser('usuario') || interaction.user;
      
      // Adia a resposta para ter tempo de buscar o banner
      await interaction.deferReply();
      
      // Busca informações completas do usuário (incluindo banner)
      const fetchedUser = await client.users.fetch(targetUser.id, { force: true });
      
      // Verifica se o usuário tem um banner
      if (!fetchedUser.banner) {
        return interaction.editReply({
          content: `${targetUser.tag} não possui um banner de perfil.`,
          ephemeral: true
        });
      }
      
      // Obtém o banner em diferentes formatos
      const bannerPNG = fetchedUser.bannerURL({ dynamic: false, format: 'png', size: 4096 });
      const bannerJPG = fetchedUser.bannerURL({ dynamic: false, format: 'jpg', size: 4096 });
      const bannerWebP = fetchedUser.bannerURL({ dynamic: false, format: 'webp', size: 4096 });
      
      // Verifica se o banner é animado (GIF)
      const isAnimated = fetchedUser.banner.startsWith('a_');
      const bannerGIF = isAnimated ? fetchedUser.bannerURL({ dynamic: true, format: 'gif', size: 4096 }) : null;
      
      // Cria o embed com o banner
      const bannerEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`Banner de ${targetUser.tag}`)
        .setImage(fetchedUser.bannerURL({ dynamic: true, size: 4096 }))
        .setDescription('Clique nos links abaixo para baixar em diferentes formatos:')
        .addFields(
          { name: 'Links', value: `[PNG](${bannerPNG}) | [JPG](${bannerJPG}) | [WebP](${bannerWebP})${isAnimated ? ` | [GIF](${bannerGIF})` : ''}` }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [bannerEmbed] });
    } catch (error) {
      console.error('Erro no comando banner:', error);
      await interaction.editReply({ 
        content: 'Ocorreu um erro ao buscar o banner do usuário.', 
        ephemeral: true 
      });
    }
  }
};
