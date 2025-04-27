// View de pré-visualização 
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
function createPreviewView(embedData) {
  const previewEmbed = new EmbedBuilder();
  if (embedData.title) previewEmbed.setTitle(embedData.title);
  if (embedData.description) previewEmbed.setDescription(embedData.description);
  if (embedData.color) previewEmbed.setColor(embedData.color);
  if (embedData.thumbnail) previewEmbed.setThumbnail(embedData.thumbnail);
  if (embedData.image) previewEmbed.setImage(embedData.image);
  if (embedData.author.name) previewEmbed.setAuthor({ name: embedData.author.name, iconURL: embedData.author.iconURL || undefined });
  if (embedData.footer.text) previewEmbed.setFooter({ text: embedData.footer.text, iconURL: embedData.footer.iconURL || undefined });
  if (embedData.fields.length > 0) previewEmbed.addFields(...embedData.fields);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('embed_back').setLabel('Voltar ao Editor').setStyle(ButtonStyle.Secondary).setEmoji('◀️'),
    new ButtonBuilder().setCustomId('embed_send').setLabel('Enviar').setStyle(ButtonStyle.Success).setEmoji('📤')
  );
  return { embed: previewEmbed, components: [row] };
}
module.exports = { createPreviewView };
