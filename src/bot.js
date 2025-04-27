const { Client, GatewayIntentBits, Partials, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const buttonHandlers = require('./components/embedBuilder/handlers/buttonHandlers');
const selectHandlers = require('./components/embedBuilder/handlers/selectHandlers');
const modalHandlers = require('./components/embedBuilder/handlers/modalHandlers');

// Ativando todas as intents disponíveis
const allIntents = Object.values(GatewayIntentBits);

const client = new Client({
  intents: allIntents,
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction
  ]
});

// Coleções para armazenar comandos e cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// Importação dos handlers
const handlersPath = path.join(__dirname, 'handlers');
const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

// Event listener para interações
client.on('interactionCreate', async interaction => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      // Seu handler de comandos
      const command = client.commands.get(interaction.commandName);
      if (command) await command.execute(client, interaction);
      return;
    }
    
    // Modals do EmbedBuilder DEVEM ser tratados aqui:
    if (interaction.isModalSubmit()) {
      // Log de diagnóstico
      console.log('[Modal Global] customId:', interaction.customId);
      // Se for um modal do builder, encaminhe para o handler
      if (interaction.customId.startsWith('embed_')) {
        await modalHandlers.handle(client, interaction);
      }
    }
  } catch (err) {
    console.error('Erro no interactionCreate:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Ocorreu um erro.', ephemeral: true });
    }
  }
});

// Evento ready com informações de sharding
client.once(Events.ClientReady, async () => {
  const shardInfo = client.shard 
    ? `[Shard ${client.shard.ids.join('/')}]` 
    : '[Sem Sharding]';
  
  console.log(`${shardInfo} Bot online como ${client.user.tag}`);
  
  try {
    // Carrega a configuração VIP
    const vipConfig = require('./utils/vipUtils').ensureVipConfig();
    
    // Registra comandos por guild
    for (const guildId in vipConfig.guildCommands) {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (guild) {
        const commands = Array.from(client.commands.values()).map(cmd => cmd.data);
        await guild.commands.set(commands);
        console.log(`✅ Comandos registrados para a guild: ${guild.name}`);
      }
    }
    
    console.log('✅ Comandos registrados para todas as guilds configuradas');
    
    // Função para atualizar estatísticas globais do bot
    async function updateBotStats() {
      try {
        if (!client.shard) return;
        
        const guildCounts = await client.shard.fetchClientValues('guilds.cache.size');
        const totalGuilds = guildCounts.reduce((acc, count) => acc + count, 0);
        
        const memberCounts = await client.shard.broadcastEval(c => 
          c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
        );
        const totalMembers = memberCounts.reduce((acc, count) => acc + count, 0);
        
        console.log(`${shardInfo} Total: ${totalGuilds} servidores e ${totalMembers} membros`);
      } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
      }
    }
    
    // Atualiza estatísticas a cada 30 minutos se estiver em sharding
    if (client.shard) {
      setInterval(updateBotStats, 30 * 60 * 1000);
      updateBotStats();
    }
  } catch (error) {
    console.error('Erro ao inicializar o bot:', error);
  }
});

// Carregamento dinâmico dos handlers
(async () => {
  for (const file of handlerFiles) {
    const filePath = path.join(handlersPath, file);
    const handler = require(filePath);
    
    // Executa cada handler passando o cliente
    try {
      await handler(client);
      console.log(`Handler carregado: ${file}`);
    } catch (error) {
      console.error(`Erro ao carregar handler ${file}:`, error);
    }
  }
  
  // Login do bot após carregar todos os handlers
  client.login(process.env.BOT_TOKEN);
})();

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  console.error(`Erro não tratado:`, error);
});

process.on('uncaughtException', (error) => {
  console.error(`Exceção não capturada:`, error);
  // Em produção, você pode querer reiniciar o bot ou notificar administradores
});
