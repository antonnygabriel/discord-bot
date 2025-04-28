const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { checkServerStatus } = require('../../utils/fivemUtils');
const { isOwner, errorEmbed } = require('../../utils/ownerUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fivemstatus')
        .setDescription('Mostra o status do servidor FiveM')
        .addStringOption(opt => opt.setName('ip').setDescription('IP do servidor').setRequired(true))
        .addStringOption(opt => opt.setName('porta').setDescription('Porta do servidor').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(client, interaction) {
        if (!isOwner(interaction.user.id) && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                embeds: [errorEmbed('Apenas administradores podem usar este comando.')],
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const ip = interaction.options.getString('ip');
        const porta = interaction.options.getString('porta');
        const status = await checkServerStatus(ip, porta);

        if (status.online) {
            const embed = new EmbedBuilder()
                .setTitle('Status do Servidor FiveM')
                .setColor('#00FF00')
                .addFields(
                    { name: 'Status', value: '🟢 Online', inline: true },
                    { name: 'Jogadores', value: `${status.players}/${status.maxPlayers}`, inline: true },
                    { name: 'Nome', value: status.name, inline: false },
                    { name: 'Endereço', value: `${ip}:${porta}`, inline: false }
                )
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setTitle('Status do Servidor FiveM')
                .setColor('#FF0000')
                .addFields(
                    { name: 'Status', value: '🔴 Offline', inline: true },
                    { name: 'Endereço', value: `${ip}:${porta}`, inline: true }
                )
                .setDescription('O servidor não está respondendo ou está offline.')
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
