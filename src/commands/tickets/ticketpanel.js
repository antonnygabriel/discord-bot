const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const TicketPanel = require('../../database/models/TicketPanel');

function randomId(len = 8) {
  return Math.random().toString(36).substr(2, len);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Configuração avançada do painel de tickets')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Cria um painel de tickets vazio')
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Apaga o painel de tickets do servidor')
    )
    .addSubcommand(sub =>
      sub.setName('settitle')
        .setDescription('Define o título')
        .addStringOption(opt => opt.setName('texto').setDescription('Título').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('setdescription')
        .setDescription('Define a descrição')
        .addStringOption(opt => opt.setName('texto').setDescription('Descrição').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('setcolor')
        .setDescription('Cor da embed')
        .addStringOption(opt => opt.setName('hex').setDescription('#HEX').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('setthumbnail')
        .setDescription('Imagem miniatura')
        .addStringOption(opt => opt.setName('url').setDescription('URL').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('setimage')
        .setDescription('Imagem de fundo')
        .addStringOption(opt => opt.setName('url').setDescription('URL').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('setfooter')
        .setDescription('Footer da embed')
        .addStringOption(opt => opt.setName('texto').setDescription('Texto').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('addbutton')
        .setDescription('Adiciona um botão')
        .addStringOption(opt => opt.setName('nome').setDescription('Nome').setRequired(true))
        .addChannelOption(opt => opt.setName('categoria').setDescription('Categoria').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
        .addStringOption(opt => opt.setName('emoji').setDescription('Emoji').setRequired(false))
        .addStringOption(opt => opt.setName('cor').setDescription('Cor do botão (Primary, Success, Danger, Secondary)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('removebutton')
        .setDescription('Remove um botão')
        .addStringOption(opt => opt.setName('nome').setDescription('Nome do botão').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('setlogchannel')
        .setDescription('Canal de logs')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal de logs').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('setstaffrole')
        .setDescription('Cargo de atendimento')
        .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('preview')
        .setDescription('Visualizar painel')
    )
    .addSubcommand(sub =>
      sub.setName('send')
        .setDescription('Publicar painel')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    let panel = await TicketPanel.findOne({ guildId });

    // Subcomando DELETE
    if (sub === 'delete') {
      if (!panel) {
        return interaction.reply({
          content: 'Nenhum painel encontrado para este servidor.',
          flags: MessageFlags.Ephemeral
        });
      }
      await TicketPanel.deleteOne({ guildId });
      return interaction.reply({
        content: 'Painel de tickets apagado com sucesso!',
        flags: MessageFlags.Ephemeral
      });
    }

    if (!panel && sub !== 'create') {
      return interaction.reply({
        content: 'Painel não encontrado. Use `/ticketpanel create` primeiro.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'create') {
      if (panel) {
        return interaction.reply({
          content: 'Painel já existe!',
          flags: MessageFlags.Ephemeral
        });
      }
      await TicketPanel.create({ guildId });
      return interaction.reply({
        content: 'Painel criado! Agora personalize com os comandos.',
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'settitle') {
      panel.title = interaction.options.getString('texto');
      await panel.save();
      return interaction.reply({
        content: 'Título atualizado!',
        flags: MessageFlags.Ephemeral
      });
    }
    if (sub === 'setdescription') {
      panel.description = interaction.options.getString('texto');
      await panel.save();
      return interaction.reply({
        content: 'Descrição atualizada!',
        flags: MessageFlags.Ephemeral
      });
    }
    if (sub === 'setcolor') {
      panel.color = interaction.options.getString('hex');
      await panel.save();
      return interaction.reply({
        content: 'Cor atualizada!',
        flags: MessageFlags.Ephemeral
      });
    }
    if (sub === 'setthumbnail') {
      panel.thumbnail = interaction.options.getString('url');
      await panel.save();
      return interaction.reply({
        content: 'Thumbnail atualizada!',
        flags: MessageFlags.Ephemeral
      });
    }
    if (sub === 'setimage') {
      panel.image = interaction.options.getString('url');
      await panel.save();
      return interaction.reply({
        content: 'Imagem atualizada!',
        flags: MessageFlags.Ephemeral
      });
    }
    if (sub === 'setfooter') {
      panel.footer = interaction.options.getString('texto');
      await panel.save();
      return interaction.reply({
        content: 'Footer atualizado!',
        flags: MessageFlags.Ephemeral
      });
    }
    if (sub === 'setlogchannel') {
      panel.logChannelId = interaction.options.getChannel('canal').id;
      await panel.save();
      return interaction.reply({
        content: 'Canal de logs configurado!',
        flags: MessageFlags.Ephemeral
      });
    }
    if (sub === 'setstaffrole') {
      panel.staffRoleId = interaction.options.getRole('cargo').id;
      await panel.save();
      return interaction.reply({
        content: 'Cargo de atendimento configurado!',
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'addbutton') {
      const name = interaction.options.getString('nome');
      if (panel.buttons.find(b => b.label === name)) {
        return interaction.reply({
          content: 'Já existe um botão com esse nome.',
          flags: MessageFlags.Ephemeral
        });
      }
      panel.buttons.push({
        customId: `ticket_${randomId(8)}`,
        label: name,
        emoji: interaction.options.getString('emoji'),
        categoryId: interaction.options.getChannel('categoria').id,
        style: interaction.options.getString('cor') || 'Primary'
      });
      await panel.save();
      return interaction.reply({
        content: 'Botão adicionado!',
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'removebutton') {
      const name = interaction.options.getString('nome');
      panel.buttons = panel.buttons.filter(b => b.label !== name);
      await panel.save();
      return interaction.reply({
        content: 'Botão removido!',
        flags: MessageFlags.Ephemeral
      });
    }

    // Função para gerar embed e botões
    function getPanelEmbed(panel) {
      const embed = new EmbedBuilder()
        .setTitle(panel.title)
        .setDescription(panel.description)
        .setColor(panel.color || '#4b7bec');
      if (panel.thumbnail) embed.setThumbnail(panel.thumbnail);
      if (panel.image) embed.setImage(panel.image);
      if (panel.footer) embed.setFooter({ text: panel.footer, iconURL: client.user.displayAvatarURL() });

      const row = new ActionRowBuilder();
      for (const btn of panel.buttons) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(btn.customId)
            .setLabel(btn.label)
            .setStyle(ButtonStyle[btn.style] || ButtonStyle.Primary)
            .setEmoji(btn.emoji || null)
        );
      }
      return { embed, row };
    }

    if (sub === 'preview') {
      const { embed, row } = getPanelEmbed(panel);
      return interaction.reply({
        embeds: [embed],
        components: [row],
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'send') {
      const canal = interaction.options.getChannel('canal');
      const { embed, row } = getPanelEmbed(panel);
      const msg = await canal.send({ embeds: [embed], components: [row] });
      panel.panelChannelId = canal.id;
      panel.panelMessageId = msg.id;
      await panel.save();
      return interaction.reply({
        content: 'Painel enviado!',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
