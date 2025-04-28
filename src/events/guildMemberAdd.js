// src/events/guildMemberAdd.js
const GuildConfig = require('../database/models/GuildConfig');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(client, member) {
    try {
      const config = await GuildConfig.findOne({ guildId: member.guild.id });
      if (!config || !config.welcomeChannel) return;

      const channel = await member.guild.channels.fetch(config.welcomeChannel).catch(() => null);
      if (!channel) return;

      channel.send(`Bem-vindo(a), ${member}!`);
    } catch (err) {
      console.error('[MongoDB] Erro ao buscar canal de boas-vindas:', err);
    }
  }
};
