// src/handlers/errorHandler.js
const { EmbedBuilder } = require('discord.js');
const { logger } = require('../utils/logger');

/**
 * Configura o tratamento de erros para comandos e interações
 * @param {Client} client - Cliente do Discord
 */
module.exports = async (client) => {
  client.handleError = async (error, interaction, command = null) => {
    // Registra o erro no console
    logger.error(`Erro ao executar ${command ? `o comando ${command.data.name}` : 'uma interação'}:`, error);

    // Cria um embed de erro
    const errorEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('❌ Erro')
      .setDescription('Ocorreu um erro ao processar sua solicitação.')
      .setTimestamp();

    // Adiciona detalhes do erro em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      errorEmbed.addFields({
        name: 'Detalhes do erro',
        value: `\`\`\`${error?.message || String(error)}\`\`\``
      });
    }

    // Responde à interação com o embed de erro
    try {
      if (interaction && !interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      } else if (interaction && (interaction.replied || interaction.deferred)) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      }
    } catch (replyError) {
      logger.error('Erro ao responder com o embed de erro:', replyError);
    }

    // Registra o erro no canal de logs, se configurado
    if (process.env.LOG_CHANNEL_ID && client.channels) {
      try {
        const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID).catch(() => null);
        if (logChannel) {
          const userTag = interaction?.user?.tag || 'Desconhecido';
          const userId = interaction?.user?.id || 'N/A';
          const guildName = interaction?.guild?.name || (interaction?.guildId ? 'Servidor desconhecido' : 'DM');
          const guildId = interaction?.guild?.id || (interaction?.guildId || 'DM');

          const logEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Erro Detectado')
            .setDescription(`Erro ao executar ${command ? `o comando \`${command.data.name}\`` : 'uma interação'}`)
            .addFields(
              { name: 'Usuário', value: `${userTag} (${userId})` },
              { name: 'Servidor', value: `${guildName} (${guildId})` },
              { name: 'Erro', value: `\`\`\`${error?.stack ? error.stack.slice(0, 1000) : error?.message || String(error)}\`\`\`` }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (logError) {
        logger.error('Erro ao enviar log de erro para o canal:', logError);
      }
    }
  };

  logger.info('Sistema de tratamento de erros configurado');
};
