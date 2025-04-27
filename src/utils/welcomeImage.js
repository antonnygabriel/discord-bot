// src/utils/welcomeImage.js
const { createCanvas, loadImage, registerFont } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

registerFont('./fonts/Roboto-Bold.ttf', { family: 'Roboto', weight: 'bold' });

async function createWelcomeImage(member) {
  const canvas = createCanvas(1200, 500);
  const ctx = canvas.getContext('2d');

  // Gradiente de fundo moderno
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#11998e');
  gradient.addColorStop(1, '#38ef7d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Camada de conteúdo com transparência
  ctx.beginPath();
  ctx.roundRect(50, 50, canvas.width - 100, canvas.height - 100, 30);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fill();

  // Efeito de vidro fosco
  ctx.save();
  ctx.filter = 'blur(50px)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(100, 100, canvas.width - 200, canvas.height - 200);
  ctx.restore();

  // Avatar com borda e sombra
  const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'jpg', size: 512 }));
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 10;
  ctx.beginPath();
  ctx.arc(250, 250, 120, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 130, 130, 240, 240);
  ctx.restore();

  // Texto principal com hierarquia visual
  ctx.font = 'bold 42px Roboto';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';

  // Nome do servidor com gradiente
  const serverGradient = ctx.createLinearGradient(400, 0, 800, 0);
  serverGradient.addColorStop(0, '#ffffff');
  serverGradient.addColorStop(1, '#e6ffe6');
  ctx.fillStyle = serverGradient;
  ctx.fillText(member.guild.name, 400, 180);

  // Linha decorativa
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(400, 200);
  ctx.lineTo(1000, 200);
  ctx.stroke();

  // Texto de boas-vindas
  ctx.font = 'italic 36px Roboto';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Bem-vindo(a),`, 400, 250);

  // Nome do usuário com destaque
  ctx.font = 'bold 48px Roboto';
  ctx.fillStyle = serverGradient;
  ctx.fillText(member.user.username, 400, 320);

  // Contagem de membros
  ctx.font = '28px Roboto';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(`🚀 Você é o membro #${member.guild.memberCount}`, 400, 380);

  return new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' });
}

module.exports = { createWelcomeImage };
