// /comandos/canvas/wantedposter.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, getUserAvatar } = require('../../utils/canvasUtils');
const path = require('path');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('wantedposter')
    .setDescription('Coloca o avatar em um cartaz de procurado')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário alvo').setRequired(false)),
  async execute(client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const avatarURL = await getUserAvatar(user, 256);
    const avatar = await loadImage(avatarURL);
    const wanted = await loadImage(path.join(__dirname, '../../assets/wanted.png'));

    const canvas = createCanvas(wanted.width, wanted.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(wanted, 0, 0);
    ctx.drawImage(avatar, 92, 210, 255, 255); // ajuste conforme seu template

    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'wanted.png' });
    await interaction.reply({ files: [attachment] });
  }
};
