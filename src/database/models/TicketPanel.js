const mongoose = require('mongoose');

const ButtonSchema = new mongoose.Schema({
  customId: { type: String, required: true },
  label: { type: String, required: true },
  emoji: { type: String },
  categoryId: { type: String, required: true },
  style: { type: String, default: 'Primary' }
});

const TicketPanelSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  panelChannelId: { type: String },
  panelMessageId: { type: String },
  title: { type: String, default: 'Painel de Tickets' },
  description: { type: String, default: 'Clique em um botão abaixo para abrir um ticket.' },
  color: { type: String, default: '#4b7bec' },
  thumbnail: { type: String },
  image: { type: String },
  footer: { type: String },
  buttons: [ButtonSchema],
  logChannelId: { type: String },
  staffRoleId: { type: String },
  ticketCounter: { type: Number, default: 1 }
});

module.exports = mongoose.model('TicketPanel', TicketPanelSchema);
