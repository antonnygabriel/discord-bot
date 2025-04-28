// /comandos/canvas/invert.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, getUserAvatar } = require('../../utils/canvasUtils');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('invert')
    .setDescription('Inverte as cores do avatar')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário alvo').setRequired(false)),
  async execute(client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const avatarURL = await getUserAvatar(user, 256);
    const avatar = await loadImage(avatarURL);

    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(avatar, 0, 0, 256, 256);

    const imageData = ctx.getImageData(0, 0, 256, 256);
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 255 - imageData.data[i];       // R
      imageData.data[i+1] = 255 - imageData.data[i+1];   // G
      imageData.data[i+2] = 255 - imageData.data[i+2];   // B
    }
    ctx.putImageData(imageData, 0, 0);

    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'invert.png' });
    await interaction.reply({ files: [attachment] });
  }
};
