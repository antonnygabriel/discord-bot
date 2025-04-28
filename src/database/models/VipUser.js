const mongoose = require('mongoose');

const VipUserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true }, // data de expiração
  addedBy: { type: String },
  addedAt: { type: Date, default: Date.now }
});

// TTL index: apaga o documento quando expiresAt < now
VipUserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('VipUser', VipUserSchema);
    