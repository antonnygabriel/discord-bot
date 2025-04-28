const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  ticketId: { type: String, required: true },
  channelId: { type: String, required: true },
  userId: { type: String, required: true },
  categoryId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  closedBy: { type: String }
});

module.exports = mongoose.model('Ticket', TicketSchema);
