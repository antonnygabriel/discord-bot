const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const EmbedManager = require('../EmbedManager');
const { createMainView } = require('../views/mainView');
const { createFieldsView } = require('../views/fieldManager');
const { createPreviewView } = require('../views/previewView');

module.exports = {
  async handle(client, interaction) {
    const userId = interaction.user.id;
    if (!EmbedManager.hasSession(userId)) {
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: 'Sessão não encontrada.', ephemeral: true });
      }
      return;
    }
    const embedData = EmbedManager.getEmbedData(userId);

    switch (interaction.customId) {
      case 'embed_title':
        await showModal(interaction, 'embed_title_modal', 'Definir Título', [
          new TextInputBuilder()
            .setCustomId('title_input')
            .setLabel('Título (máx. 256 caracteres)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(256)
            .setValue(embedData.title || '')
            .setRequired(false)
        ]);
        break;

      case 'embed_description':
        await showModal(interaction, 'embed_description_modal', 'Definir Descrição', [
          new TextInputBuilder()
            .setCustomId('description_input')
            .setLabel('Descrição (máx. 4000 caracteres)')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(4000)
            .setValue(embedData.description || '')
            .setRequired(false)
        ]);
        break;

      case 'embed_color': {
        // Mostra select de cor NA MENSAGEM PRINCIPAL, mantendo os botões do builder!
        const { embed, components } = createMainView(embedData);
        const colorRow = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('embed_color_select')
            .setPlaceholder('Escolha uma cor')
            .addOptions([
              { label: 'Azul Discord', value: '#0099FF' },
              { label: 'Vermelho', value: '#FF0000' },
              { label: 'Verde', value: '#00FF00' },
              { label: 'Amarelo', value: '#FFFF00' },
              { label: 'Roxo', value: '#9900FF' },
              { label: 'Rosa', value: '#FF00FF' },
              { label: 'Laranja', value: '#FF9900' },
              { label: 'Preto', value: '#000000' },
              { label: 'Branco', value: '#FFFFFF' },
              { label: 'Personalizada', value: 'custom' }
            ])
        );
        // Adiciona o select como uma linha extra, mantendo os botões principais
        await interaction.update({
          embeds: [embed],
          components: [...components, colorRow]
        });
        break;
      }

      case 'embed_thumbnail':
        await showModal(interaction, 'embed_thumbnail_modal', 'Definir Thumbnail', [
          new TextInputBuilder()
            .setCustomId('thumbnail_input')
            .setLabel('URL da Thumbnail')
            .setStyle(TextInputStyle.Short)
            .setValue(embedData.thumbnail || '')
            .setRequired(false)
        ]);
        break;

      case 'embed_image':
        await showModal(interaction, 'embed_image_modal', 'Definir Imagem', [
          new TextInputBuilder()
            .setCustomId('image_input')
            .setLabel('URL da Imagem')
            .setStyle(TextInputStyle.Short)
            .setValue(embedData.image || '')
            .setRequired(false)
        ]);
        break;

      case 'embed_footer':
        await showModal(interaction, 'embed_footer_modal', 'Definir Rodapé', [
          new TextInputBuilder()
            .setCustomId('footer_text_input')
            .setLabel('Texto do Rodapé')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(2048)
            .setValue(embedData.footer.text || '')
            .setRequired(false),
          new TextInputBuilder()
            .setCustomId('footer_icon_input')
            .setLabel('URL do Ícone do Rodapé')
            .setStyle(TextInputStyle.Short)
            .setValue(embedData.footer.iconURL || '')
            .setRequired(false)
        ]);
        break;

      case 'embed_author':
        await showModal(interaction, 'embed_author_modal', 'Definir Autor', [
          new TextInputBuilder()
            .setCustomId('author_name_input')
            .setLabel('Nome do Autor')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(256)
            .setValue(embedData.author.name || '')
            .setRequired(false),
          new TextInputBuilder()
            .setCustomId('author_icon_input')
            .setLabel('URL do Ícone do Autor')
            .setStyle(TextInputStyle.Short)
            .setValue(embedData.author.iconURL || '')
            .setRequired(false)
        ]);
        break;

      case 'embed_fields': {
        const { embed, components } = createFieldsView(embedData);
        await interaction.update({ embeds: [embed], components });
        break;
      }

      case 'embed_add_field':
        await showModal(interaction, 'embed_add_field_modal', 'Adicionar Campo', [
          new TextInputBuilder()
            .setCustomId('field_name_input')
            .setLabel('Nome do Campo')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(256)
            .setRequired(true),
          new TextInputBuilder()
            .setCustomId('field_value_input')
            .setLabel('Valor do Campo')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(1024)
            .setRequired(true)
        ]);
        break;

      case 'embed_remove_field':
        if (embedData.fields.length === 0) {
          await interaction.reply({ content: 'Não há campos para remover.', ephemeral: true });
        } else {
          const options = embedData.fields.map((f, i) => ({
            label: f.name.substring(0, 100),
            value: i.toString(),
            description: f.value.substring(0, 100)
          }));
          await interaction.update({
            embeds: [createFieldsView(embedData).embed],
            components: [
              new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                  .setCustomId('embed_remove_field_select')
                  .setPlaceholder('Escolha um campo')
                  .addOptions(options)
              )
            ]
          });
        }
        break;

      case 'embed_preview': {
        const { embed, components } = createPreviewView(embedData);
        await interaction.update({ embeds: [embed], components });
        break;
      }

      case 'embed_send':
        await showModal(interaction, 'embed_send_modal', 'Enviar Embed', [
          new TextInputBuilder()
            .setCustomId('channel_input')
            .setLabel('ID do Canal (opcional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false),
          new TextInputBuilder()
            .setCustomId('webhook_input')
            .setLabel('URL do Webhook (opcional)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ]);
        break;

      case 'embed_back': {
        const { embed, components } = createMainView(embedData);
        await interaction.update({ embeds: [embed], components });
        break;
      }

      case 'embed_cancel':
        EmbedManager.removeSession(userId);
        await interaction.update({ content: 'Criação de embed cancelada.', embeds: [], components: [] });
        break;

      default:
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'Botão não reconhecido.', ephemeral: true });
        }
    }
  }
};

async function showModal(interaction, customId, title, inputs) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title);
  for (const input of inputs) modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}
