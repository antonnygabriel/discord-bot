const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserLevel = require('../../database/models/UserLevel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top 10 usuários com mais nível no servidor'),
  async execute(client, interaction) {
    const top = await UserLevel.find({ guildId: interaction.guild.id })
      .sort([['level', -1], ['xp', -1]])
      .limit(10);

    if (!top.length) {
      return interaction.reply({ content: 'Ninguém tem XP ainda!', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🏆 Leaderboard de Níveis')
      .setColor('#00FF99')
      .setDescription(
        await Promise.all(top.map(async (u, i) => {
          const user = await client.users.fetch(u.userId).catch(() => null);
          return `**${i + 1}.** ${user ? user.tag : `ID: ${u.userId}`} - Nível: **${u.level}** | XP: **${u.xp}**`;
        })).then(arr => arr.join('\n'))
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
