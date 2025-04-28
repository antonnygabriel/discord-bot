const userCache = new Map(); // key: `${guildId}-${userId}`, value: {xp, level, lastMessage}

function getCacheKey(guildId, userId) {
  return `${guildId}-${userId}`;
}

function getUser(guildId, userId) {
  return userCache.get(getCacheKey(guildId, userId));
}

function setUser(guildId, userId, data) {
  userCache.set(getCacheKey(guildId, userId), data);
}

function deleteUser(guildId, userId) {
  userCache.delete(getCacheKey(guildId, userId));
}

module.exports = { getUser, setUser, deleteUser, getCacheKey, userCache };
