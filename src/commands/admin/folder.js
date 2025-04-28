const { SlashCommandBuilder } = require('discord.js');
const { isOwner } = require('../../utils/ownerUtils');
const { addDisabledFolder, removeDisabledFolder, isFolderDisabled } = require('../../utils/disabledFolders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('togglefolder')
    .setDescription('Ativa ou desativa uma pasta de comandos do bot')
    .addStringOption(opt => 
      opt.setName('pasta')
        .setDescription('Nome exato da pasta (ex: canvas, api, fivem)')
        .setRequired(true)),
  async execute(client, interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ content: 'Apenas o dono do bot pode usar este comando.', ephemeral: true });
    }
    const folder = interaction.options.getString('pasta');
    if (isFolderDisabled(folder)) {
      removeDisabledFolder(folder);
      return interaction.reply({ content: `A pasta \`${folder}\` foi **habilitada**!`, ephemeral: true });
    } else {
      addDisabledFolder(folder);
      return interaction.reply({ content: `A pasta \`${folder}\` foi **desabilitada**!`, ephemeral: true });
    }
  }
};
