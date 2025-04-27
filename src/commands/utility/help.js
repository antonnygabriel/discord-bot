// src/commands/utility/help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Veja todos os comandos do bot organizados por categoria')
    .addStringOption(option =>
      option
        .setName('categoria')
        .setDescription('Filtrar por categoria')
        .setRequired(false)
    ),

  async execute(client, interaction) {
    // Caminho base das pastas de comandos
    const commandsPath = path.join(__dirname, '..');
    const categories = fs.readdirSync(commandsPath).filter(folder =>
      fs.statSync(path.join(commandsPath, folder)).isDirectory()
    );

    // Categoria opcional fornecida pelo usuário
    const selectedCategory = interaction.options.getString('categoria');
    let showCategories = categories;

    if (selectedCategory) {
      if (!categories.includes(selectedCategory)) {
        return interaction.reply({
          content: `❌ Categoria "${selectedCategory}" não encontrada. Categorias disponíveis: ${categories.join(', ')}`,
          ephemeral: true
        });
      }
      showCategories = [selectedCategory];
    }

    // Monta o embed
    const embed = new EmbedBuilder()
      .setTitle('📖 Comandos Disponíveis')
      .setColor('#0099FF')
      .setDescription(
        'Use `/help <categoria>` para ver comandos de uma categoria específica.\n\n'
        + `Categorias disponíveis: ${categories.map(c => `\`${c}\``).join(', ')}`
      )
      .setFooter({ text: 'Bot de Ajuda • Discord' });

    let totalCommands = 0;

    for (const category of showCategories) {
      const categoryPath = path.join(commandsPath, category);
      const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

      let commandList = '';
      for (const file of commandFiles) {
        const command = require(path.join(categoryPath, file));
        // Suporte a ambos: command.data.description ou command.description
        const name = command.data?.name || command.name || file.replace('.js', '');
        const description = command.data?.description || command.description || 'Sem descrição';
        commandList += `**/${name}** - ${description}\n`;
        totalCommands++;
      }

      if (commandList) {
        embed.addFields({
          name: `📂 ${capitalize(category)}`,
          value: commandList.length > 1024 ? commandList.slice(0, 1021) + '...' : commandList
        });
      }
    }

    if (totalCommands === 0) {
      embed.setDescription('Nenhum comando encontrado nesta categoria.');
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

// Função utilitária para capitalizar a primeira letra
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
