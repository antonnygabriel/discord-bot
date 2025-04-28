function xpForLevel(level) {
    // Exemplo: XP necessário = 100 * level^1.5 (ajuste para sua curva)
    return Math.floor(100 * Math.pow(level, 1.5));
  }
  
  function getRandomXp() {
    return Math.floor(Math.random() * 6) + 5; // 5-10 XP
  }
  
  module.exports = { xpForLevel, getRandomXp };
  