const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setGuildConfig } = require('../../utils/welcomeConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('Configura o canal de boas-vindas do servidor')
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal para mensagens de boas-vindas')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(client, interaction) {
    try {
      // Defer imediatamente para garantir tempo
      await interaction.deferReply({ ephemeral: true });

      const channel = interaction.options.getChannel('canal');
      if (!channel || !channel.isTextBased()) {
        return await interaction.editReply({ content: 'Por favor, selecione um canal de texto válido.' });
      }

      setGuildConfig(interaction.guildId, { welcomeChannel: channel.id });

      await interaction.editReply({
        content: `✅ Canal de boas-vindas configurado para ${channel}.`
      });
    } catch (error) {
      console.error('Erro no /setwelcome:', error);
      if (interaction.deferred || interaction.replied)
        await interaction.editReply({ content: 'Ocorreu um erro ao configurar o canal de boas-vindas.' });
    }
  }
};
