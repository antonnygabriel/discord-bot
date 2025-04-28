const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { readServers, writeServers } = require('../../utils/fivemUtils');
const { isOwner, errorEmbed, successEmbed } = require('../../utils/ownerUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletefivem')
        .setDescription('Deleta uma configuração de servidor FiveM')
        .addStringOption(opt => opt.setName('nome').setDescription('Nome do servidor salvo').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(client, interaction) {
        if (!isOwner(interaction.user.id) && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                embeds: [errorEmbed('Apenas administradores podem usar este comando.')],
                ephemeral: true
            });
        }

        const nome = interaction.options.getString('nome');
        const db = readServers();
        if (!db.servidores[nome]) {
            return interaction.reply({
                embeds: [errorEmbed(`Servidor "${nome}" não encontrado na database.`)],
                ephemeral: true
            });
        }

        delete db.servidores[nome];
        writeServers(db);

        return interaction.reply({
            embeds: [successEmbed('Servidor Removido', `O servidor **${nome}** foi removido com sucesso da database.`)],
            ephemeral: true
        });
    }
};
