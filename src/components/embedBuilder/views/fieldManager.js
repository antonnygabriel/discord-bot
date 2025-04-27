// Gerenciador de campos 
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
function createFieldsView(embedData) {
  const embed = new EmbedBuilder()
    .setColor(embedData.color || 0x0099FF)
    .setTitle('📋 Gerenciar Campos da Embed')
    .setDescription(
      embedData.fields.length
        ? 'Campos atuais listados abaixo. Você pode adicionar ou remover campos.'
        : 'Nenhum campo adicionado ainda. Clique em "Adicionar Campo" para começar.'
    )
    .setFooter({ text: 'Máximo de 25 campos por embed.' });

  if (embedData.fields.length) {
    embed.addFields(
      embedData.fields.slice(0, 10).map((f, i) => ({
        name: `#${i + 1} ${f.name}`,
        value: f.value.length > 1024 ? f.value.slice(0, 1021) + '...' : f.value,
        inline: f.inline || false
      }))
    );
    if (embedData.fields.length > 10) {
      embed.addFields({
        name: '...',
        value: `+${embedData.fields.length - 10} campos ocultos (limite visual do Discord)`,
        inline: false
      });
    }
  }
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('embed_add_field').setLabel('Adicionar Campo').setStyle(ButtonStyle.Success).setEmoji('➕').setDisabled(embedData.fields.length >= 25),
    new ButtonBuilder().setCustomId('embed_remove_field').setLabel('Remover Campo').setStyle(ButtonStyle.Danger).setEmoji('➖').setDisabled(embedData.fields.length === 0),
    new ButtonBuilder().setCustomId('embed_back').setLabel('Voltar').setStyle(ButtonStyle.Secondary).setEmoji('◀️')
  );
  return { embed, components: [row] };
}
module.exports = { createFieldsView };
