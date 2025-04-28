const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const LevelRole = require('../../database/models/LevelRole');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlevelrole')
    .setDescription('Define um cargo para ser atribuído ao atingir determinado nível')
    .addIntegerOption(opt => opt.setName('nível').setDescription('Nível').setRequired(true))
    .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const level = interaction.options.getInteger('nível');
    const role = interaction.options.getRole('cargo');
    await LevelRole.findOneAndUpdate(
      { guildId: interaction.guild.id, level },
      { roleId: role.id },
      { upsert: true }
    );
    await interaction.reply({ content: `Cargo ${role} será atribuído ao atingir o nível ${level}.`, ephemeral: true });
  }
};
