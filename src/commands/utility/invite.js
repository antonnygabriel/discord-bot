// src/commands/utility/invite.js
const { SlashCommandBuilder, EmbedBuilder, OAuth2Scopes, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Gera um link de convite para adicionar o bot a outros servidores'),
  
  cooldown: 5,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Gera o link de convite com as permissões necessárias
      const inviteLink = client.generateInvite({
        scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
        permissions: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.UseExternalEmojis,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak
          // Adicione outras permissões necessárias para o seu bot
        ]
      });
      
      // Cria o embed com o link de convite
      const inviteEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`Convide ${client.user.username} para o seu servidor!`)
        .setDescription(`Clique no botão abaixo para adicionar ${client.user.username} ao seu servidor.`)
        .addFields(
          { name: '🔗 Link de Convite', value: `[Clique aqui para convidar](${inviteLink})` },
          { name: '📋 Permissões Solicitadas', value: 'Este link solicita as permissões mínimas necessárias para que o bot funcione corretamente.' }
        )
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [inviteEmbed] });
    } catch (error) {
      console.error('Erro no comando invite:', error);
      await interaction.reply({ 
        content: 'Ocorreu um erro ao gerar o link de convite.', 
        ephemeral: true 
      });
    }
  }
};
