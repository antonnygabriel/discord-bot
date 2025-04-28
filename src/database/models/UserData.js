const mongoose = require('mongoose');

const UserDataSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true },
  // outros campos de usuário
});

module.exports = mongoose.model('UserData', UserDataSchema);
