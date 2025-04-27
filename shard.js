// shard.js
const { ShardingManager } = require('discord.js');
const path = require('path');
require('dotenv').config();

// O arquivo bot.js será o seu atual index.js
const manager = new ShardingManager(path.join(__dirname, 'src', 'bot.js'), {
  token: process.env.BOT_TOKEN,
  totalShards: 'auto', // Determina automaticamente o número de shards
  respawn: true, // Reinicia shards que caírem
});

// Evento quando um shard é criado
manager.on('shardCreate', shard => {
  console.log(`[${new Date().toISOString()}] Shard ${shard.id} iniciado`);
  
  shard.on('death', () => {
    console.error(`[${new Date().toISOString()}] Shard ${shard.id} morreu inesperadamente`);
  });
  
  shard.on('ready', () => {
    console.log(`[${new Date().toISOString()}] Shard ${shard.id} está pronto`);
  });
});

// Inicia os shards
manager.spawn()
  .then(shards => {
    console.log(`[${new Date().toISOString()}] Iniciados ${shards.size} shards com sucesso`);
  })
  .catch(error => {
    console.error(`[${new Date().toISOString()}] Erro ao iniciar shards:`, error);
  });
