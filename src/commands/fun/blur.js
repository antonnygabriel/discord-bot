// comandos/canvas/blur.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, getUserAvatar } = require('../../utils/canvasUtils');
const cooldown = require('../../utils/cooldown.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blur')
    .setDescription('Aplica desfoque no avatar')
    .addUserOption(opt => opt.setName('usuario').setDescription('Usuário alvo').setRequired(false)),
  async execute(client, interaction) {
    if (!(await cooldown('blur', interaction.user.id, interaction, 5))) return;

    const user = interaction.options.getUser('usuario') || interaction.user;
    const avatarURL = await getUserAvatar(user, 256);
    const avatar = await loadImage(avatarURL);

    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    ctx.filter = 'blur(6px)';
    ctx.drawImage(avatar, 0, 0, 256, 256);

    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'blur.png' });
    await interaction.reply({ files: [attachment] });
  }
};
