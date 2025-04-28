const UserLevel = require('../database/models/UserLevel');
const LevelRole = require('../database/models/LevelRole');
const { xpForLevel, getRandomXp } = require('../utils/levelUtils');
const { getUser, setUser } = require('../utils/levelCache');

const XP_COOLDOWN = 60 * 1000; // 1 minuto

module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    if (message.author.bot || !message.guild) return;

    const key = `${message.guild.id}-${message.author.id}`;
    let data = getUser(message.guild.id, message.author.id);

    const now = Date.now();

    if (!data) {
      // Busca do banco ou cria novo
      let dbData = await UserLevel.findOne({ guildId: message.guild.id, userId: message.author.id });
      if (!dbData) {
        dbData = await UserLevel.create({ guildId: message.guild.id, userId: message.author.id });
      }
      data = {
        xp: dbData.xp,
        level: dbData.level,
        lastMessage: dbData.lastMessage
      };
    }

    // Anti-flood: só ganha XP se passou o cooldown
    if (data.lastMessage && now - data.lastMessage.getTime() < XP_COOLDOWN) {
      setUser(message.guild.id, message.author.id, data);
      return;
    }

    // Ganha XP
    const xpGain = getRandomXp();
    data.xp += xpGain;
    data.lastMessage = new Date(now);

    // Level up?
    let leveledUp = false;
    while (data.xp >= xpForLevel(data.level)) {
      data.xp -= xpForLevel(data.level);
      data.level++;
      leveledUp = true;
    }

    // Salva no cache e no MongoDB
    setUser(message.guild.id, message.author.id, data);
    await UserLevel.findOneAndUpdate(
      { guildId: message.guild.id, userId: message.author.id },
      { xp: data.xp, level: data.level, lastMessage: data.lastMessage },
      { upsert: true }
    );

    // Se upou de nível, verifica cargo automático
    if (leveledUp) {
      const levelRole = await LevelRole.findOne({ guildId: message.guild.id, level: data.level });
      if (levelRole) {
        const role = message.guild.roles.cache.get(levelRole.roleId);
        const member = await message.guild.members.fetch(message.author.id).catch(() => null);
        if (role && member && !member.roles.cache.has(role.id)) {
          await member.roles.add(role).catch(() => {});
          message.channel.send(`${message.author} atingiu o nível ${data.level} e recebeu o cargo <@&${role.id}>! 🎉`);
        }
      } else {
        message.channel.send(`${message.author} subiu para o nível ${data.level}! 🎉`);
      }
    }
  }
};
