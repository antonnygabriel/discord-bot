const { Client, GatewayIntentBits, Partials, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const connectMongo = require('./database/connection');
const notifyExpiredVips = require('./utils/vipNotifier');
require('dotenv').config();

// Inicialização do cliente Discord
const client = new Client({
  intents: Object.values(GatewayIntentBits),
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction
  ]
});

// Coleções globais
client.commands = new Collection();
client.cooldowns = new Collection();

// Carregamento dinâmico dos handlers
async function loadHandlers() {
  const handlersPath = path.join(__dirname, 'handlers');
  const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));
  for (const file of handlerFiles) {
    const filePath = path.join(handlersPath, file);
    try {
      const handler = require(filePath);
      await handler(client);
      console.log(`Handler carregado: ${file}`);
    } catch (error) {
      console.error(`Erro ao carregar handler ${file}:`, error);
    }
  }
}

// Sistema de status FiveM (opcional)
async function setupFiveMStatus(client) {
  const CONFIG_PATH = path.join(__dirname, 'config.json');
  if (!fs.existsSync(CONFIG_PATH)) return;
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (!config.fivem || !config.fivem.statusChannelId || !config.fivem.ip || !config.fivem.porta) return;

  const FiveMAPI = require('./utils/fivemUtils');
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

  async function updateFiveMStatusEmbed() {
    try {
      const channel = await client.channels.fetch(config.fivem.statusChannelId).catch(() => null);
      if (!channel) return;

      const fivemAPI = new FiveMAPI(config.fivem.ip, config.fivem.porta);
      const status = await fivemAPI.getServerStatus();
      const playerCount = status.online ? await fivemAPI.getPlayers() : 0;
      const maxPlayers = status.online ? (await fivemAPI.getServerInfo())?.vars?.sv_maxClients || 64 : 64;

      const embed = new EmbedBuilder()
        .setTitle(config.fivem.titulo || 'Servidor FiveM')
        .setDescription(config.fivem.descricao || `Servidor: ${config.fivem.ip}:${config.fivem.porta}`)
        .setColor(status.online ? (config.fivem.cor || '#00FF00') : '#FF0000')
        .addFields(
          { name: 'Status', value: status.online ? '✅ Online' : '❌ Offline', inline: true },
          { name: 'Jogadores', value: `${playerCount}/${maxPlayers}`, inline: true }
        )
        .setTimestamp();

      if (config.fivem.imagem) embed.setImage(config.fivem.imagem);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(config.fivem.botao || 'Conectar')
          .setStyle(ButtonStyle.Link)
          .setURL(`fivem://connect/${config.fivem.ip}:${config.fivem.porta}`)
          .setDisabled(!status.online)
      );

      // Edita mensagem anterior ou envia nova
      const messages = await channel.messages.fetch({ limit: 10 });
      const botMessage = messages.find(msg => msg.author.id === client.user.id && msg.embeds.length > 0 && msg.embeds[0].title === (config.fivem.titulo || 'Servidor FiveM'));
      if (botMessage) {
        await botMessage.edit({ embeds: [embed], components: [row] });
      } else {
        await channel.send({ embeds: [embed], components: [row] });
      }
    } catch (err) {
      console.error('Erro ao atualizar status FiveM:', err);
    }
  }

  setInterval(updateFiveMStatusEmbed, 5 * 60 * 1000);
  updateFiveMStatusEmbed();
}

// Inicialização principal
(async () => {
  try {
    // 1. Conecta ao MongoDB antes de tudo
    await connectMongo();

    // 2. Carrega handlers (comandos, eventos, etc)
    await loadHandlers();

    // 3. Login do bot
    await client.login(process.env.BOT_TOKEN);

    // 4. Notificador de VIPs expirados (async, não bloqueia)
    setInterval(() => notifyExpiredVips(client), 60 * 1000);

    // 5. Sistema de status FiveM (opcional)
    setupFiveMStatus(client);

    // 6. Evento ready
    client.once(Events.ClientReady, async () => {
      const shardInfo = client.shard
        ? `[Shard ${client.shard.ids.join('/')}]`
        : '[Sem Sharding]';
      console.log(`${shardInfo} Bot online como ${client.user.tag}`);

      // Estatísticas globais (sharding)
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

      if (client.shard) {
        setInterval(updateBotStats, 30 * 60 * 1000);
        updateBotStats();
      }
    });

  } catch (error) {
    console.error('Erro crítico ao iniciar o bot:', error);
    process.exit(1);
  }
})();

// Tratamento global de erros
process.on('unhandledRejection', (error) => {
  console.error(`Erro não tratado:`, error);
});
process.on('uncaughtException', (error) => {
  console.error(`Exceção não capturada:`, error);
});
