// comandos/api/jail.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fetch = require('node-fetch');
const { getUserAvatar } = require('../../utils/canvasUtils');
const cooldown = require('../../utils/cooldown.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jail')
    .setDescription('Coloca o avatar atrás das grades')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário alvo').setRequired(false)),
  async execute(client, interaction) {
    if (!(await cooldown('jail', interaction.user.id, interaction, 5))) return;

    const user = interaction.options.getUser('usuario') || interaction.user;
    const avatarURL = await getUserAvatar(user, 256);
    const apiUrl = `https://nekobot.xyz/api/imagegen?type=jail&url=${encodeURIComponent(avatarURL)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (!data.success) return interaction.reply({ content: 'Erro na API.', ephemeral: true });

    const imgRes = await fetch(data.message);
    const buffer = await imgRes.arrayBuffer();
    const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: 'jail.png' });
    await interaction.reply({ files: [attachment] });
  }
};
