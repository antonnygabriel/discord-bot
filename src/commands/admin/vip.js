const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const VipUser = require('../../database/models/VipUser');
const { isOwner } = require('../../utils/ownerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vip')
    .setDescription('Gerencia usuários VIP (apenas dono)')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Adiciona um usuário à lista VIP')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário para adicionar').setRequired(true))
        .addIntegerOption(opt => opt.setName('dias').setDescription('Tempo de VIP em dias').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove um usuário da lista VIP')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário para remover').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Lista todos os usuários VIP')),

  async execute(client, interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        content: 'Apenas o dono pode usar este comando.',
        flags: MessageFlags.Ephemeral
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const user = interaction.options.getUser('usuario');
      const dias = interaction.options.getInteger('dias');
      if (dias < 1) {
        return interaction.reply({
          content: 'O tempo de VIP deve ser de pelo menos 1 dia.',
          flags: MessageFlags.Ephemeral
        });
      }

      const expiresAt = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
      try {
        await VipUser.findOneAndUpdate(
          { userId: user.id },
          { expiresAt, addedBy: interaction.user.id, addedAt: new Date() },
          { upsert: true, new: true }
        );

        // Envia DM bonita para o usuário com botão de suporte
        try {
          const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('✨ Parabéns, você agora é VIP!')
            .setDescription(
              `Muito obrigado por apoiar o servidor!\n\n` +
              `Seu VIP está ativo por **${dias} dia(s)**.\n` +
              `Aproveite os benefícios exclusivos e, se tiver dúvidas, fale com a staff!\n\n` +
              `💛 Você faz parte do grupo especial de apoiadores!`
            )
            .setFooter({ text: 'Equipe do Bot', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

          // Botão de suporte
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('Servidor de Suporte')
              .setStyle(ButtonStyle.Link)
              .setURL('https://discord.gg/SEU_LINK_DE_SUPORTE') // Troque pelo seu link real!
          );

          await user.send({ embeds: [embed], components: [row] });
        } catch (dmError) {
          // DM fechada, ignora
        }

        return interaction.reply({
          content: `${user} agora é VIP por ${dias} dia(s)!`,
          flags: MessageFlags.Ephemeral
        });
      } catch (err) {
        console.error('[MongoDB] Erro ao adicionar VIP:', err);
        return interaction.reply({
          content: 'Erro ao adicionar VIP.',
          flags: MessageFlags.Ephemeral
        });
      }
    }

    if (sub === 'remove') {
      const user = interaction.options.getUser('usuario');
      try {
        const res = await VipUser.deleteOne({ userId: user.id });
        if (res.deletedCount === 0) {
          return interaction.reply({
            content: `${user} não é VIP.`,
            flags: MessageFlags.Ephemeral
          });
        }
        return interaction.reply({
          content: `${user} removido da lista VIP.`,
          flags: MessageFlags.Ephemeral
        });
      } catch (err) {
        console.error('[MongoDB] Erro ao remover VIP:', err);
        return interaction.reply({
          content: 'Erro ao remover VIP.',
          flags: MessageFlags.Ephemeral
        });
      }
    }

    if (sub === 'list') {
      try {
        const vips = await VipUser.find();
        if (!vips.length) {
          return interaction.reply({
            content: 'Nenhum usuário VIP registrado.',
            flags: MessageFlags.Ephemeral
          });
        }
        const vipList = await Promise.all(
          vips.map(async vip => {
            try {
              const user = await client.users.fetch(vip.userId);
              const expires = `<t:${Math.floor(vip.expiresAt.getTime()/1000)}:R>`;
              return `- ${user.tag} (\`${vip.userId}\`) expira ${expires}`;
            } catch {
              return `- ID: ${vip.userId} (usuário não encontrado)`;
            }
          })
        );
        return interaction.reply({
          content: `Usuários VIP:\n${vipList.join('\n')}`,
          flags: MessageFlags.Ephemeral
        });
      } catch (err) {
        console.error('[MongoDB] Erro ao listar VIPs:', err);
        return interaction.reply({
          content: 'Erro ao listar VIPs.',
          flags: MessageFlags.Ephemeral
        });
      }
    }
  }
};
