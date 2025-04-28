const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('Configura o canal de boas-vindas do servidor')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal de texto para mensagens de boas-vindas')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(client, interaction) {
    const channel = interaction.options.getChannel('canal');
    if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
      return interaction.reply({ content: 'Selecione um canal de texto válido.', ephemeral: true });
    }

    try {
      await GuildConfig.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { welcomeChannel: channel.id },
        { upsert: true, new: true }
      );
      await interaction.reply({ content: `Canal de boas-vindas configurado para ${channel}.`, ephemeral: true });
    } catch (err) {
      console.error('[MongoDB] Erro ao salvar config:', err);
      await interaction.reply({ content: 'Erro ao salvar configuração no banco de dados.', ephemeral: true });
    }
  }
};
