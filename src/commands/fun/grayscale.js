// /comandos/canvas/grayscale.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, getUserAvatar } = require('../../utils/canvasUtils');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('grayscale')
    .setDescription('Avatar preto e branco')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário alvo').setRequired(false)),
  async execute(client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const avatarURL = await getUserAvatar(user, 256);
    const avatar = await loadImage(avatarURL);

    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(avatar, 0, 0, 256, 256);

    // Manipulação manual dos pixels
    const imageData = ctx.getImageData(0, 0, 256, 256);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const avg = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
      imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);

    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'grayscale.png' });
    await interaction.reply({ files: [attachment] });
  }
};
