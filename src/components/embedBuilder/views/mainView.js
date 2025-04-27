// View principal com botões 
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
function createMainView(embedData) {
  const embed = new EmbedBuilder()
    .setColor(embedData.color)
    .setTitle('🛠️ Criador de Embeds')
    .setDescription('Use os botões para personalizar sua embed. Clique em Preview para ver como está ficando ou Enviar para publicar.')
    .addFields({ name: 'Status', value: getStatus(embedData) })
    .setFooter({ text: 'Você tem 15 minutos para concluir.' });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('embed_title').setLabel('Título').setStyle(embedData.title ? ButtonStyle.Success : ButtonStyle.Secondary).setEmoji('📝'),
    new ButtonBuilder().setCustomId('embed_description').setLabel('Descrição').setStyle(embedData.description ? ButtonStyle.Success : ButtonStyle.Secondary).setEmoji('📄'),
    new ButtonBuilder().setCustomId('embed_color').setLabel('Cor').setStyle(ButtonStyle.Primary).setEmoji('🎨'),
    new ButtonBuilder().setCustomId('embed_thumbnail').setLabel('Thumbnail').setStyle(embedData.thumbnail ? ButtonStyle.Success : ButtonStyle.Secondary).setEmoji('🖼️')
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('embed_image').setLabel('Imagem').setStyle(embedData.image ? ButtonStyle.Success : ButtonStyle.Secondary).setEmoji('📷'),
    new ButtonBuilder().setCustomId('embed_footer').setLabel('Rodapé').setStyle(embedData.footer.text ? ButtonStyle.Success : ButtonStyle.Secondary).setEmoji('👣'),
    new ButtonBuilder().setCustomId('embed_author').setLabel('Autor').setStyle(embedData.author.name ? ButtonStyle.Success : ButtonStyle.Secondary).setEmoji('👤'),
    new ButtonBuilder().setCustomId('embed_fields').setLabel(`Campos (${embedData.fields.length})`).setStyle(embedData.fields.length ? ButtonStyle.Success : ButtonStyle.Secondary).setEmoji('📋')
  );
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('embed_preview').setLabel('Preview').setStyle(ButtonStyle.Primary).setEmoji('👁️'),
    new ButtonBuilder().setCustomId('embed_send').setLabel('Enviar').setStyle(ButtonStyle.Success).setEmoji('📤'),
    new ButtonBuilder().setCustomId('embed_cancel').setLabel('Cancelar').setStyle(ButtonStyle.Danger).setEmoji('❌')
  );
  return { embed, components: [row1, row2, row3] };
}
function getStatus(d) {
  return [
    d.title ? '✅ Título definido' : '❌ Título não definido',
    d.description ? '✅ Descrição definida' : '❌ Descrição não definida',
    d.thumbnail ? '✅ Thumbnail definida' : '❌ Thumbnail não definida',
    d.image ? '✅ Imagem definida' : '❌ Imagem não definida',
    d.footer.text ? '✅ Rodapé definido' : '❌ Rodapé não definido',
    d.author.name ? '✅ Autor definido' : '❌ Autor não definido',
    `✅ ${d.fields.length} campos`
  ].join('\n');
}
module.exports = { createMainView };
