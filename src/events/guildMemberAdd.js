// src/events/guildMemberAdd.js
const { getGuildConfig } = require('../utils/welcomeConfig');
const { createWelcomeImage } = require('../utils/welcomeImage');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    // Ignora bots
    if (member.user.bot) return;
    
    // Busca a configuração correta para este servidor
    const config = getGuildConfig(member.guild.id);
    if (!config || !config.welcomeChannel) return;

    // Busca o canal salvo
    const channel = member.guild.channels.cache.get(config.welcomeChannel);
    if (!channel) return;

    try {
      // Cria a imagem e envia a embed
      const image = await createWelcomeImage(member);
      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setDescription(`${member} acabou de entrar no servidor!`)
        .setImage('attachment://welcome.png');

      await channel.send({ embeds: [embed], files: [image] });
    } catch (error) {
      console.error(`Erro ao enviar mensagem de boas-vindas para ${member.user.tag}:`, error);
    }
  }
};
