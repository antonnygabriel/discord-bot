const { createCanvas, loadImage } = require('canvas'); // ou 'canvas' se preferir

async function getUserAvatar(user, size = 256) {
  // Pega o avatar em PNG, sempre estático
  return user.displayAvatarURL({ extension: 'png', size, forceStatic: true });
}

module.exports = { createCanvas, loadImage, getUserAvatar };
