// src/components/embedBuilder/handlers/modalHandlers.js
const EmbedManager = require('../EmbedManager');
const { createMainView } = require('../views/mainView');
const { createFieldsView } = require('../views/fieldManager');
const { validateWebhook, sendWebhook } = require('../utils/webhookManager');
const { validateURL } = require('../utils/embedValidator');

module.exports = {
  async handle(client, interaction) {
    const userId = interaction.user.id;
    if (!EmbedManager.hasSession(userId)) {
      return interaction.reply({ content: 'Você não tem uma sessão ativa.', ephemeral: true });
    }
    const embedData = EmbedManager.getEmbedData(userId);

    switch (interaction.customId) {
      case 'embed_title_modal':
        EmbedManager.updateField(userId, 'title', interaction.fields.getTextInputValue('title_input'));
        break;
      case 'embed_description_modal':
        EmbedManager.updateField(userId, 'description', interaction.fields.getTextInputValue('description_input'));
        break;
      case 'embed_thumbnail_modal': {
        const url = interaction.fields.getTextInputValue('thumbnail_input');
        if (url && !validateURL(url)) return interaction.reply({ content: 'URL inválida.', ephemeral: true });
        EmbedManager.updateField(userId, 'thumbnail', url || null);
        break;
      }
      case 'embed_image_modal': {
        const url = interaction.fields.getTextInputValue('image_input');
        if (url && !validateURL(url)) return interaction.reply({ content: 'URL inválida.', ephemeral: true });
        EmbedManager.updateField(userId, 'image', url || null);
        break;
      }
      case 'embed_footer_modal': {
        EmbedManager.updateField(userId, 'footer.text', interaction.fields.getTextInputValue('footer_text_input'));
        const icon = interaction.fields.getTextInputValue('footer_icon_input');
        if (icon && !validateURL(icon)) return interaction.reply({ content: 'URL do ícone inválida.', ephemeral: true });
        EmbedManager.updateField(userId, 'footer.iconURL', icon || null);
        break;
      }
      case 'embed_author_modal': {
        EmbedManager.updateField(userId, 'author.name', interaction.fields.getTextInputValue('author_name_input'));
        const icon = interaction.fields.getTextInputValue('author_icon_input');
        if (icon && !validateURL(icon)) return interaction.reply({ content: 'URL do ícone inválida.', ephemeral: true });
        EmbedManager.updateField(userId, 'author.iconURL', icon || null);
        break;
      }
      case 'embed_add_field_modal': {
        const name = interaction.fields.getTextInputValue('field_name_input');
        const value = interaction.fields.getTextInputValue('field_value_input');
        EmbedManager.addField(userId, { name, value, inline: false });
        break;
      }
      case 'embed_send_modal':
        await handleSendModal(client, interaction, embedData, userId);
        return;
      case 'embed_color_modal': {
        const colorHex = interaction.fields.getTextInputValue('color_input');
        if (!/^#([0-9A-F]{3}){1,2}$/i.test(colorHex)) return interaction.reply({ content: 'Código hexadecimal inválido.', ephemeral: true });
        const colorInt = parseInt(colorHex.substring(1), 16);
        EmbedManager.updateField(userId, 'color', colorInt);
        break;
      }
      default:
        return interaction.reply({ content: 'Modal não reconhecido.', ephemeral: true });
    }

    // Atualiza tela principal ou de campos, conforme contexto
    if (['embed_title_modal', 'embed_description_modal', 'embed_thumbnail_modal', 'embed_image_modal', 'embed_footer_modal', 'embed_author_modal', 'embed_color_modal'].includes(interaction.customId)) {
      const { embed, components } = createMainView(embedData);
      await interaction.update({ embeds: [embed], components });
    } else if (interaction.customId === 'embed_add_field_modal') {
      const { embed, components } = createFieldsView(embedData);
      await interaction.update({ embeds: [embed], components });
    }
  }
};

async function handleSendModal(client, interaction, embedData, userId) {
  const channelId = interaction.fields.getTextInputValue('channel_input');
  const webhookURL = interaction.fields.getTextInputValue('webhook_input');
  await interaction.deferUpdate();

  // Monta embed final
  const { EmbedBuilder } = require('discord.js');
  const finalEmbed = new EmbedBuilder();
  if (embedData.title) finalEmbed.setTitle(embedData.title);
  if (embedData.description) finalEmbed.setDescription(embedData.description);
  if (embedData.color) finalEmbed.setColor(embedData.color);
  if (embedData.thumbnail) finalEmbed.setThumbnail(embedData.thumbnail);
  if (embedData.image) finalEmbed.setImage(embedData.image);
  if (embedData.author.name) finalEmbed.setAuthor({ name: embedData.author.name, iconURL: embedData.author.iconURL || undefined });
  if (embedData.footer.text) finalEmbed.setFooter({ text: embedData.footer.text, iconURL: embedData.footer.iconURL || undefined });
  if (embedData.fields.length > 0) finalEmbed.addFields(...embedData.fields);

  try {
    if (webhookURL) {
      if (!(await validateWebhook(webhookURL))) {
        return interaction.followUp({ content: 'Webhook inválido.', ephemeral: true });
      }
      await sendWebhook(webhookURL, { embeds: [finalEmbed.toJSON()] });
      await interaction.editReply({ content: '✅ Embed enviada via webhook!', embeds: [], components: [] });
    } else {
      let targetChannel = interaction.channel;
      if (channelId) {
        targetChannel = await client.channels.fetch(channelId).catch(() => null);
        if (!targetChannel) return interaction.followUp({ content: 'Canal não encontrado.', ephemeral: true });
      }
      await targetChannel.send({ embeds: [finalEmbed] });
      await interaction.editReply({ content: '✅ Embed enviada!', embeds: [], components: [] });
    }
    EmbedManager.removeSession(userId);
  } catch (err) {
    await interaction.followUp({ content: `Erro ao enviar embed: ${err.message}`, ephemeral: true });
  }
}
