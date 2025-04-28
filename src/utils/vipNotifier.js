const VipUser = require('../database/models/VipUser');

let notified = new Set();

async function notifyExpiredVips(client) {
  const now = new Date();
  // Busca VIPs que já expiraram (TTL pode demorar até 1 minuto para apagar)
  const expired = await VipUser.find({ expiresAt: { $lte: now } });
  for (const vip of expired) {
    if (notified.has(vip.userId)) continue;
    notified.add(vip.userId);
    try {
      const user = await client.users.fetch(vip.userId);
      await user.send('Seu VIP expirou! Para renovar, fale com a staff.');
    } catch (e) {
      // Ignora erros de DM fechada, etc.
    }
  }
  // Limpa notificações antigas
  setTimeout(() => notified.clear(), 5 * 60 * 1000);
}

module.exports = notifyExpiredVips;
