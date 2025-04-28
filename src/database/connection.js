const mongoose = require('mongoose');
require('dotenv').config();

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ [MongoDB] Conectado com sucesso!');
  } catch (err) {
    console.error('❌ [MongoDB] Falha ao conectar:', err);
    process.exit(1);
  }
}

module.exports = connectMongo;
