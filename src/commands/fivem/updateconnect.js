const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const { readServers, writeServers, isValidIP, isValidHex } = require('../../utils/fivemUtils');
const { isOwner, errorEmbed, successEmbed } = require('../../utils/ownerUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updatefivemconnect')
        .setDescription('Atualiza uma embed de conexão já salva')
        // OBRIGATÓRIO PRIMEIRO
        .addStringOption(opt => opt.setName('nome').setDescription('Nome do servidor salvo').setRequired(true))
        // OPCIONAIS DEPOIS
        .addStringOption(opt => opt.setName('ip').setDescription('Novo IP').setRequired(false))
        .addStringOption(opt => opt.setName('porta').setDescription('Nova Porta').setRequired(false))
        .addStringOption(opt => opt.setName('titulo').setDescription('Novo Título').setRequired(false))
        .addStringOption(opt => opt.setName('descricao').setDescription('Nova Descrição').setRequired(false))
        .addStringOption(opt => opt.setName('imagem').setDescription('Nova Imagem').setRequired(false))
        .addStringOption(opt => opt.setName('cor').setDescription('Nova Cor HEX').setRequired(false))
        .addStringOption(opt => opt.setName('botaotexto').setDescription('Novo texto do botão').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(client, interaction) {
        if (!isOwner(interaction.user.id) && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                embeds: [errorEmbed('Apenas administradores podem usar este comando.')],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const nome = interaction.options.getString('nome');
        const db = readServers();
        const server = db.servidores[nome];
        if (!server) {
            return interaction.editReply({ embeds: [errorEmbed('Servidor não encontrado.')], ephemeral: true });
        }

        const campos = ['ip', 'porta', 'titulo', 'descricao', 'imagem', 'cor', 'botaotexto'];
        let atualizados = [];
        for (const campo of campos) {
            const novo = interaction.options.getString(campo);
            if (novo) {
                if (campo === 'ip' && !isValidIP(novo)) {
                    return interaction.editReply({ embeds: [errorEmbed('IP inválido.')], ephemeral: true });
                }
                if (campo === 'porta' && !/^\d{2,5}$/.test(novo)) {
                    return interaction.editReply({ embeds: [errorEmbed('Porta inválida.')], ephemeral: true });
                }
                if (campo === 'cor' && !isValidHex(novo)) {
                    return interaction.editReply({ embeds: [errorEmbed('Cor HEX inválida.')], ephemeral: true });
                }
                if (campo === 'botaotexto') server.textoBotao = novo;
                else server[campo] = novo;
                atualizados.push(campo);
            }
        }
        writeServers(db);

        const embed = new EmbedBuilder()
            .setTitle(server.titulo)
            .setDescription(server.descricao)
            .setColor(server.cor)
            .setFooter({ text: `Servidor atualizado: ${nome}` });
        if (server.imagem) embed.setImage(server.imagem);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(server.textoBotao)
                .setStyle(ButtonStyle.Link)
                .setURL(`fivem://connect/${server.ip}:${server.porta}`)
        );

        return interaction.editReply({ 
            embeds: [embed], 
            components: [row] 
        });
    }
};
