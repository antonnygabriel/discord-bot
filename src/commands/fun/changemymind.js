// /comandos/api/changemymind.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('changemymind')
    .setDescription('Gera meme Change My Mind')
    .addStringOption(opt => opt.setName('texto').setDescription('Texto da placa').setRequired(true)),
  async execute(client, interaction) {
    const texto = interaction.options.getString('texto');
    const apiUrl = `https://nekobot.xyz/api/imagegen?type=changemymind&text=${encodeURIComponent(texto)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (!data.success) return interaction.reply({ content: 'Erro na API.', ephemeral: true });

    const imgRes = await fetch(data.message);
    const buffer = await imgRes.arrayBuffer();
    const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: 'changemymind.png' });
    await interaction.reply({ files: [attachment] });
  }
};
