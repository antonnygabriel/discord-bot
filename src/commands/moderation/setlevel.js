const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const UserLevel = require('../../database/models/UserLevel');
const { getUser, setUser } = require('../../utils/levelCache');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlevel')
    .setDescription('Define o nível de um usuário')
    .addUserOption(opt => opt.setName('usuário').setDescription('Usuário').setRequired(true))
    .addIntegerOption(opt => opt.setName('nível').setDescription('Nível').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const user = interaction.options.getUser('usuário');
    const level = interaction.options.getInteger('nível');
    const data = await UserLevel.findOneAndUpdate(
      { guildId: interaction.guild.id, userId: user.id },
      { level },
      { upsert: true, new: true }
    );
    setUser(interaction.guild.id, user.id, { ...data.toObject(), level });
    await interaction.reply({ content: `Nível de ${user} definido para ${level}.`, ephemeral: true });
  }
};
