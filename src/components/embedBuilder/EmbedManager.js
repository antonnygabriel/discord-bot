// src/components/embedBuilder/EmbedManager.js
class EmbedManager {
    constructor() { this.sessions = new Map(); }
    createSession(userId) {
      if (!this.sessions.has(userId)) {
        this.sessions.set(userId, {
          embedData: {
            title: '', description: '', color: 0x0099FF, thumbnail: null, image: null,
            footer: { text: '', iconURL: null },
            author: { name: '', iconURL: null },
            fields: []
          },
          collector: null, messageId: null
        });
      }
    }
    hasSession(userId) { return this.sessions.has(userId); }
    getEmbedData(userId) { return this.sessions.get(userId)?.embedData; }
    setCollector(userId, c) { if (this.sessions.has(userId)) this.sessions.get(userId).collector = c; }
    setMessageId(userId, id) { if (this.sessions.has(userId)) this.sessions.get(userId).messageId = id; }
    getMessageId(userId) { return this.sessions.get(userId)?.messageId; }
    updateField(userId, field, value) {
      const data = this.getEmbedData(userId); if (!data) return;
      if (field.includes('.')) { const [p, c] = field.split('.'); if (data[p]) data[p][c] = value; }
      else { data[field] = value; }
    }
    addField(userId, field) {
      const data = this.getEmbedData(userId);
      if (data && data.fields.length < 25) data.fields.push(field);
    }
    removeField(userId, idx) {
      const data = this.getEmbedData(userId);
      if (data && idx < data.fields.length) data.fields.splice(idx, 1);
    }
    removeSession(userId) {
      const s = this.sessions.get(userId);
      if (s && s.collector) s.collector.stop();
      this.sessions.delete(userId);
    }
  }
  module.exports = new EmbedManager();
  