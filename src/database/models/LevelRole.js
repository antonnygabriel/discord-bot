const mongoose = require('mongoose');

const LevelRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  level: { type: Number, required: true },
  roleId: { type: String, required: true }
});
LevelRoleSchema.index({ guildId: 1, level: 1 }, { unique: true });

module.exports = mongoose.model('LevelRole', LevelRoleSchema);
