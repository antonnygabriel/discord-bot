const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const UserLevel = require('../../database/models/UserLevel');
const { xpForLevel } = require('../../utils/levelUtils');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Veja seu nível e XP')
    .addUserOption(opt => opt.setName('usuário').setDescription('Usuário').setRequired(false)),
  async execute(client, interaction) {
    const user = interaction.options.getUser('usuário') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const data = await UserLevel.findOne({ guildId: interaction.guild.id, userId: user.id }) ||
      { xp: 0, level: 1 };

    // Canvas config
    const width = 600, height = 180;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fundo gradiente suave
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#e3ecfa');
    grad.addColorStop(1, '#c1d8f7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Sombra suave (simulada com retângulo transparente)
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    ctx.fillRect(12, 12, width - 24, height - 24);

    // Card branco com bordas arredondadas
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.arcTo(width - 30, 30, width - 30, height - 30, 30);
    ctx.arcTo(width - 30, height - 30, 30, height - 30, 30);
    ctx.arcTo(30, height - 30, 30, 30, 30);
    ctx.arcTo(30, 30, width - 30, 30, 30);
    ctx.closePath();
    ctx.fill();

    // Avatar circular com sombra
    const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 128 }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(90, 90, 45, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 8;
    ctx.clip();
    ctx.drawImage(avatar, 45, 45, 90, 90);
    ctx.restore();

    // Nome do usuário
    ctx.font = 'bold 28px Sans-serif';
    ctx.fillStyle = '#333';
    ctx.fillText(member ? member.displayName : user.username, 160, 75);

    // Nível
    ctx.font = '20px Sans-serif';
    ctx.fillStyle = '#4b7bec';
    ctx.fillText(`Nível: ${data.level}`, 160, 110);

    // XP
    ctx.font = '18px Sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText(`XP: ${data.xp} / ${xpForLevel(data.level)}`, 160, 135);

    // Barra de XP
    const bar_x = 160, bar_y = 145, bar_w = 400, bar_h = 22;
    ctx.fillStyle = '#e0e7ef';
    ctx.fillRect(bar_x, bar_y, bar_w, bar_h);
    ctx.fillStyle = '#4b7bec';
    const percent = Math.min(data.xp / xpForLevel(data.level), 1);
    ctx.fillRect(bar_x, bar_y, bar_w * percent, bar_h);
    ctx.strokeStyle = '#b0c4de';
    ctx.lineWidth = 2;
    ctx.strokeRect(bar_x, bar_y, bar_w, bar_h);

    // Envia o card
    const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'rank.png' });
    await interaction.reply({ files: [attachment] });
  }
};
