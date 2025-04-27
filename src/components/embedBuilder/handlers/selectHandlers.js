// Manipuladores para select menus 
// src/components/embedBuilder/handlers/selectHandlers.js
const EmbedManager = require('../EmbedManager');
const { createMainView } = require('../views/mainView');
const { createFieldsView } = require('../views/fieldManager');

module.exports = {
  async handle(client, interaction) {
    const userId = interaction.user.id;
    if (!EmbedManager.hasSession(userId)) {
      return interaction.reply({ content: 'Você não tem uma sessão ativa.', ephemeral: true });
    }
    const embedData = EmbedManager.getEmbedData(userId);

    switch (interaction.customId) {
      // selectHandlers.js (apenas o trecho da cor)
case 'embed_color_select': {
  const selected = interaction.values[0];
  if (selected === 'custom') {
    // ... abrir modal de cor personalizada ...
  } else {
    const colorInt = parseInt(selected.replace('#', ''), 16);
    EmbedManager.updateField(userId, 'color', colorInt);
    const { embed, components } = createMainView(embedData);
    await interaction.update({ embeds: [embed], components }); // Remove o select, mantém os botões!
  }
  break;
}

      case 'embed_remove_field_select':
        await handleRemoveFieldSelect(interaction, embedData, userId);
        break;
      default:
        await interaction.reply({ content: 'Select menu não reconhecido.', ephemeral: true });
    }
  }
};

async function handleColorSelect(interaction, embedData, userId) {
  const selected = interaction.values[0];
  if (selected === 'custom') {
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
    const modal = new ModalBuilder()
      .setCustomId('embed_color_modal')
      .setTitle('Definir Cor Personalizada')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('color_input')
            .setLabel('Código Hexadecimal (ex: #FF0000)')
            .setStyle(TextInputStyle.Short)
            .setValue('#')
            .setRequired(true)
        )
      );
    await interaction.showModal(modal);
    return;
  }
  const colorInt = parseInt(selected.replace('#', ''), 16);
  EmbedManager.updateField(userId, 'color', colorInt);
  const { embed, components } = createMainView(embedData);
  const messageId = EmbedManager.getMessageId(userId);
  await interaction.message.channel.messages.fetch(messageId).then(msg =>
    msg.edit({ embeds: [embed], components })
  );
  await interaction.update({ content: `Cor definida para ${selected}.`, components: [] });
}

async function handleRemoveFieldSelect(interaction, embedData, userId) {
  const idx = parseInt(interaction.values[0]);
  if (isNaN(idx) || idx < 0 || idx >= embedData.fields.length) {
    return interaction.reply({ content: 'Índice de campo inválido.', ephemeral: true });
  }
  const fieldName = embedData.fields[idx].name;
  EmbedManager.removeField(userId, idx);
  const { embed, components } = createFieldsView(embedData);
  const messageId = EmbedManager.getMessageId(userId);
  await interaction.message.channel.messages.fetch(messageId).then(msg =>
    msg.edit({ embeds: [embed], components })
  );
  await interaction.update({ content: `Campo "${fieldName}" removido com sucesso.`, components: [] });
}
