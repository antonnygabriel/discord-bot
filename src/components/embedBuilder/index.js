const EmbedManager = require('./EmbedManager');
const { createMainView } = require('./views/mainView');
const buttonHandlers = require('./handlers/buttonHandlers');
const selectHandlers = require('./handlers/selectHandlers');

module.exports = {
  async start(client, interaction) {
    EmbedManager.createSession(interaction.user.id);
    await interaction.deferReply();

    const { embed, components } = createMainView(EmbedManager.getEmbedData(interaction.user.id));
    const msg = await interaction.editReply({ embeds: [embed], components, fetchReply: true });
    EmbedManager.setMessageId(interaction.user.id, msg.id);

    // Crie apenas UM collector por mensagem!
    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 15 * 60 * 1000
    });
    EmbedManager.setCollector(interaction.user.id, collector);

    collector.on('collect', async i => {
      console.log('Collector capturou:', i.customId); // Diagnóstico
      try {
        if (i.isButton()) {
          console.log('Handler botão chamado:', i.customId); // Diagnóstico
          await buttonHandlers.handle(client, i);
        } else if (i.isStringSelectMenu()) {
          console.log('Handler select chamado:', i.customId); // Diagnóstico
          await selectHandlers.handle(client, i);
        }
        // NÃO trate modals aqui!
      } catch (err) {
        if (!i.replied && !i.deferred) {
          await i.reply({ content: 'Erro ao processar interação.', ephemeral: true });
        }
        console.error('Erro no collector:', err);
      }
    });

    collector.on('end', () => {
      EmbedManager.removeSession(interaction.user.id);
      msg.edit({ components: [] }).catch(() => {});
    });
  }
};
