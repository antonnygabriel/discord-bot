// src/utils/vipUtils.js
const fs = require('fs');
const path = require('path');

const VIP_CONFIG_PATH = path.join(__dirname, '../database/vipConfig.json');

// Garante que o arquivo de configuração existe
function ensureVipConfig() {
  if (!fs.existsSync(VIP_CONFIG_PATH)) {
    fs.writeFileSync(VIP_CONFIG_PATH, JSON.stringify({
      vipUsers: [],
      guildCommands: {}
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(VIP_CONFIG_PATH));
}

// Verifica se um usuário é VIP
function isVipUser(userId) {
  const config = ensureVipConfig();
  return config.vipUsers.includes(userId);
}

// Embed para quando o usuário não é VIP
function notVipEmbed() {
  return {
    color: 0xFF0000,
    title: '❌ Acesso Negado',
    description: 'Você não tem permissão para usar este comando. Apenas usuários VIP podem acessá-lo.',
    footer: { text: 'Contate o administrador para mais informações' }
  };
}

module.exports = { isVipUser, notVipEmbed, ensureVipConfig };
