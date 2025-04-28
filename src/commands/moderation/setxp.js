const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const UserLevel = require('../../database/models/UserLevel');
const { getUser, setUser } = require('../../utils/levelCache');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setxp')
    .setDescription('Define o XP de um usuário')
    .addUserOption(opt => opt.setName('usuário').setDescription('Usuário').setRequired(true))
    .addIntegerOption(opt => opt.setName('xp').setDescription('XP').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const user = interaction.options.getUser('usuário');
    const xp = interaction.options.getInteger('xp');
    const data = await UserLevel.findOneAndUpdate(
      { guildId: interaction.guild.id, userId: user.id },
      { xp },
      { upsert: true, new: true }
    );
    setUser(interaction.guild.id, user.id, { ...data.toObject(), xp });
    await interaction.reply({ content: `XP de ${user} definido para ${xp}.`, ephemeral: true });
  }
};
