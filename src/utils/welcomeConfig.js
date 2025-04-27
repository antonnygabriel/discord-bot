const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../database/welcomeConfig.json');

function ensureConfigFile() {
  if (!fs.existsSync(path.dirname(configPath))) fs.mkdirSync(path.dirname(configPath), { recursive: true });
  if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, '{}');
}

function getAllConfig() {
  ensureConfigFile();
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function getGuildConfig(guildId) {
  const all = getAllConfig();
  return all[guildId] || {};
}

function setGuildConfig(guildId, data) {
  const all = getAllConfig();
  all[guildId] = { ...all[guildId], ...data };
  fs.writeFileSync(configPath, JSON.stringify(all, null, 2));
}

module.exports = { getAllConfig, getGuildConfig, setGuildConfig };
