const { Events, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { logger } = require('../utils/logger');
const CooldownUtil = require('../utils/cooldown');
const { isVipUser, notVipEmbed } = require('../utils/vipUtils');
const TicketPanel = require('../database/models/TicketPanel');
const Ticket = require('../database/models/Ticket');

module.exports = {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    // Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        logger.warn(`Comando não encontrado: ${interaction.commandName}`);
        return;
      }
      try {
        // VIP check: só bloqueia se explicitamente vipOnly: true
        if (command.vipOnly && !await isVipUser(interaction.user.id)) {
          return interaction.reply({ embeds: [notVipEmbed()], ephemeral: true });
        }
        // Cooldown
        const canExecute = await CooldownUtil.check(interaction, command, client.cooldowns);
        if (!canExecute) return;
        await command.execute(client, interaction);
        logger.info(`${interaction.user.tag} usou o comando /${interaction.commandName} em ${interaction.guild ? interaction.guild.name : 'DM'}`);
      } catch (error) {
        client.handleError(error, interaction, command);
      }
      return;
    }

    // Botões de Tickets
    if (interaction.isButton()) {
      // --- TICKET SYSTEM ---
      // Abrir ticket
      const panel = interaction.guild ? await TicketPanel.findOne({ guildId: interaction.guild.id }) : null;
      if (panel && panel.buttons.some(b => b.customId === interaction.customId)) {
        const btn = panel.buttons.find(b => b.customId === interaction.customId);

        // Anti-spam: só 1 ticket aberto por user
        const existing = await Ticket.findOne({ guildId: interaction.guild.id, userId: interaction.user.id, closedAt: null });
        if (existing) {
          const ch = interaction.guild.channels.cache.get(existing.channelId);
          if (ch) return interaction.reply({ content: `Você já possui um ticket aberto: ${ch}`, ephemeral: true });
        }

        // Nome e contador
        const ticketId = String(panel.ticketCounter || 1).padStart(4, '0');
        panel.ticketCounter = (panel.ticketCounter || 1) + 1;
        await panel.save();

        // Cria canal privado
        const channel = await interaction.guild.channels.create({
          name: `ticket-${ticketId}`,
          type: ChannelType.GuildText,
          parent: btn.categoryId,
          topic: `Ticket de ${interaction.user.tag} (${interaction.user.id})`,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            ...(panel.staffRoleId ? [{ id: panel.staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
          ]
        });

        await Ticket.create({
          guildId: interaction.guild.id,
          ticketId,
          channelId: channel.id,
          userId: interaction.user.id,
          categoryId: btn.categoryId
        });

        // Mensagem de boas-vindas + botões
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('ticket_adduser').setLabel('Adicionar Membro').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('ticket_reopen').setLabel('Reabrir Ticket').setStyle(ButtonStyle.Success)
        );
        const embed = new EmbedBuilder()
          .setTitle('🎫 Ticket Aberto')
          .setDescription(panel.initialMessage || 'Descreva seu problema e aguarde atendimento!')
          .setColor(panel.color || '#4b7bec')
          .setTimestamp();

        await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
        await interaction.reply({ content: `Seu ticket foi criado: ${channel}`, ephemeral: true });
        return;
      }

      // Fechar ticket (confirmação)
      if (interaction.customId === 'ticket_close') {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_confirmclose').setLabel('Sim, fechar').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('ticket_cancelclose').setLabel('Não').setStyle(ButtonStyle.Secondary)
        );
        await interaction.reply({ content: 'Você realmente deseja fechar este ticket?', components: [row], ephemeral: true });
        return;
      }

      // Confirmação de fechamento
      if (interaction.customId === 'ticket_confirmclose') {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id, closedAt: null });
        if (!ticket) return interaction.reply({ content: 'Ticket não encontrado.', ephemeral: true });
        ticket.closedAt = new Date();
        ticket.closedBy = interaction.user.id;
        await ticket.save();

        // Bloqueia o canal
        await interaction.channel.permissionOverwrites.edit(ticket.userId, { ViewChannel: false });
        await interaction.channel.send({ embeds: [new EmbedBuilder().setColor('#e74c3c').setTitle('Ticket Fechado').setDescription('Este ticket foi fechado.')] });

        // Log
        const panel = await TicketPanel.findOne({ guildId: interaction.guild.id });
        if (panel && panel.logChannelId) {
          const logChannel = interaction.guild.channels.cache.get(panel.logChannelId);
          if (logChannel) {
            await logChannel.send({ embeds: [new EmbedBuilder().setTitle('Ticket Fechado').setDescription(`Ticket #${ticket.ticketId} fechado por <@${interaction.user.id}>`).setColor('#e74c3c')] });
          }
        }
        return interaction.reply({ content: 'Ticket fechado!', ephemeral: true });
      }
      if (interaction.customId === 'ticket_cancelclose') {
        return interaction.reply({ content: 'Fechamento cancelado.', ephemeral: true });
      }

      // Adicionar membro ao ticket (opcional)
      if (interaction.customId === 'ticket_adduser') {
        // Exemplo: pode abrir um modal para pedir o ID do usuário a ser adicionado
        return interaction.reply({ content: 'Funcionalidade de adicionar membro em breve!', ephemeral: true });
      }

      // Reabrir ticket (opcional)
      if (interaction.customId === 'ticket_reopen') {
        // Exemplo: desbloqueia o canal para o autor
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        if (!ticket) return interaction.reply({ content: 'Ticket não encontrado.', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(ticket.userId, { ViewChannel: true });
        await interaction.channel.send({ embeds: [new EmbedBuilder().setColor('#4b7bec').setTitle('Ticket Reaberto').setDescription('Este ticket foi reaberto.')] });
        return interaction.reply({ content: 'Ticket reaberto!', ephemeral: true });
      }

      // --- OUTROS BOTÕES ---
      // Sistema de botões customizados
      const [customId, ...args] = interaction.customId.split('_');
      const buttonHandler = client.buttons?.get(customId);
      if (buttonHandler) {
        try {
          if (buttonHandler.vipOnly && !await isVipUser(interaction.user.id)) {
            return interaction.reply({ embeds: [notVipEmbed()], ephemeral: true });
          }
          await buttonHandler.execute(client, interaction, args);
        } catch (error) {
          client.handleError(error, interaction);
        }
      }
      return;
    }

    // Select Menus
    if (interaction.isStringSelectMenu()) {
      const [customId, ...args] = interaction.customId.split('_');
      const selectHandler = client.selectMenus?.get(customId);
      if (!selectHandler) return;
      try {
        if (selectHandler.vipOnly && !await isVipUser(interaction.user.id)) {
          return interaction.reply({ embeds: [notVipEmbed()], ephemeral: true });
        }
        await selectHandler.execute(client, interaction, args);
      } catch (error) {
        client.handleError(error, interaction);
      }
      return;
    }

    // Modais
    if (interaction.isModalSubmit()) {
      const [customId, ...args] = interaction.customId.split('_');
      const modalHandler = client.modals?.get(customId);
      if (!modalHandler) return;
      try {
        if (modalHandler.vipOnly && !await isVipUser(interaction.user.id)) {
          return interaction.reply({ embeds: [notVipEmbed()], ephemeral: true });
        }
        await modalHandler.execute(client, interaction, args);
      } catch (error) {
        client.handleError(error, interaction);
      }
      return;
    }

    // Autocomplete
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;
      try {
        await command.autocomplete(client, interaction);
      } catch (error) {
        logger.error(`Erro ao processar autocomplete para ${interaction.commandName}:`, error);
      }
      return;
    }
  }
};
