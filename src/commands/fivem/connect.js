const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const { readServers, writeServers, isValidIP, isValidHex } = require('../../utils/fivemUtils');
const { isOwner, errorEmbed } = require('../../utils/ownerUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fivemconnect')
        .setDescription('Cria e envia uma embed de conexão para um servidor FiveM')
        // OBRIGATÓRIOS PRIMEIRO
        .addStringOption(opt => opt.setName('nome').setDescription('Nome para identificar o servidor').setRequired(true))
        .addStringOption(opt => opt.setName('ip').setDescription('IP do servidor').setRequired(true))
        .addStringOption(opt => opt.setName('porta').setDescription('Porta do servidor').setRequired(true))
        .addStringOption(opt => opt.setName('titulo').setDescription('Título da embed').setRequired(true))
        .addStringOption(opt => opt.setName('descricao').setDescription('Descrição da embed').setRequired(true))
        .addStringOption(opt => opt.setName('cor').setDescription('Cor da embed (ex: #00FF00)').setRequired(true))
        .addStringOption(opt => opt.setName('botaotexto').setDescription('Texto do botão').setRequired(true))
        // OPCIONAIS DEPOIS
        .addStringOption(opt => opt.setName('imagem').setDescription('URL da imagem/banner').setRequired(false))
        .addStringOption(opt => opt.setName('linkbotao').setDescription('Link personalizado do botão').setRequired(false))
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
        const ip = interaction.options.getString('ip');
        const porta = interaction.options.getString('porta');
        const titulo = interaction.options.getString('titulo');
        const descricao = interaction.options.getString('descricao');
        const cor = interaction.options.getString('cor');
        const botaotexto = interaction.options.getString('botaotexto');
        const imagem = interaction.options.getString('imagem');
        const linkbotao = interaction.options.getString('linkbotao'); // novo campo

        if (!isValidIP(ip)) {
            return interaction.editReply({ embeds: [errorEmbed('IP inválido.')], ephemeral: true });
        }
        if (!/^\d{2,5}$/.test(porta)) {
            return interaction.editReply({ embeds: [errorEmbed('Porta inválida.')], ephemeral: true });
        }
        if (!isValidHex(cor)) {
            return interaction.editReply({ embeds: [errorEmbed('Cor HEX inválida.')], ephemeral: true });
        }

        // Se não informar link personalizado, usa o padrão
        const urlBotao = linkbotao && linkbotao.length > 0
            ? linkbotao
            : `fivem://connect/${ip}:${porta}`;

        const db = readServers();
        db.servidores[nome] = { ip, porta, titulo, descricao, imagem, cor, textoBotao: botaotexto, linkBotao: urlBotao };
        writeServers(db);

        const embed = new EmbedBuilder()
            .setTitle(titulo)
            .setDescription(descricao)
            .setColor(cor)
            .setFooter({ text: `Servidor salvo como: ${nome}` });
        if (imagem) embed.setImage(imagem);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(botaotexto)
                .setStyle(ButtonStyle.Link)
                .setURL(urlBotao)
        );

        return interaction.editReply({ embeds: [embed], components: [row] });
    }
};
