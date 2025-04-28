// /comandos/canvas/caption.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('../../utils/canvasUtils');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('caption')
    .setDescription('Adiciona uma legenda a uma imagem')
    .addAttachmentOption(opt => opt.setName('imagem').setDescription('Imagem').setRequired(true))
    .addStringOption(opt => opt.setName('texto').setDescription('Legenda').setRequired(true)),
  async execute(client, interaction) {
    const imagem = interaction.options.getAttachment('imagem');
    const texto = interaction.options.getString('texto');
    if (!imagem || !imagem.contentType.startsWith('image/')) {
      return interaction.reply({ content: 'Envie uma imagem válida.', ephemeral: true });
    }
    const img = await loadImage(imagem.url);

    const canvas = createCanvas(img.width, img.height + 60);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, img.height, img.width, 60);
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(texto, img.width / 2, img.height + 40);

    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'caption.png' });
    await interaction.reply({ files: [attachment] });
  }
};
