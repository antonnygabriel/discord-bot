const VipUser = require('../database/models/VipUser');
const { isOwner } = require('./ownerUtils');

async function isVipUser(userId) {
  if (isOwner(userId)) return true;
  const vip = await VipUser.findOne({ userId, expiresAt: { $gt: new Date() } });
  return !!vip;
}

module.exports = { isVipUser };
