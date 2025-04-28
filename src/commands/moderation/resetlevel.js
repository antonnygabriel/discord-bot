const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const UserLevel = require('../../database/models/UserLevel');
const { deleteUser } = require('../../utils/levelCache');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetlevel')
    .setDescription('Reseta o nível e XP de um usuário')
    .addUserOption(opt => opt.setName('usuário').setDescription('Usuário').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(client, interaction) {
    const user = interaction.options.getUser('usuário');
    await UserLevel.findOneAndUpdate(
      { guildId: interaction.guild.id, userId: user.id },
      { xp: 0, level: 1 }
    );
    deleteUser(interaction.guild.id, user.id);
    await interaction.reply({ content: `Nível e XP de ${user} resetados.`, ephemeral: true });
  }
};
