const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  welcomeChannel: { type: String },
  boostChannel: { type: String },
  connectEmbed: {
    title: String,
    description: String,
    buttonLabel: String,
    connectLink: String
  }
  // Adicione outros campos conforme necessário
});

module.exports = mongoose.model('GuildConfig', GuildConfigSchema);
