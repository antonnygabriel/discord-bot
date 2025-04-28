const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { readServers } = require('../../utils/fivemUtils');
const { isOwner, errorEmbed } = require('../../utils/ownerUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listafivem')
        .setDescription('Lista todos os servidores FiveM salvos')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(client, interaction) {
        if (!isOwner(interaction.user.id) && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                embeds: [errorEmbed('Apenas administradores podem usar este comando.')],
                ephemeral: true
            });
        }

        const db = readServers();
        const nomes = Object.keys(db.servidores);
        if (!nomes.length) {
            return interaction.reply({
                embeds: [errorEmbed('Nenhum servidor FiveM salvo na database.')],
                ephemeral: true
            });
        }

        const servidoresList = nomes.map((nome, index) => {
            const server = db.servidores[nome];
            return `**${index + 1}.** \`${nome}\` - ${server.ip}:${server.porta}`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('🎮 Servidores FiveM Salvos')
            .setDescription(servidoresList)
            .setColor('#5865F2')
            .setFooter({ text: `Total: ${nomes.length} servidor(es)` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
