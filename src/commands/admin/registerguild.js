// src/commands/admin/registerguild.js
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { ensureVipConfig } = require('../../utils/vipUtils');

const VIP_CONFIG_PATH = path.join(__dirname, '../../../vipConfig.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('registerguild')
    .setDescription('Registra comandos para uma guild específica (apenas dono)')
    .addStringOption(option =>
      option.setName('guild_id')
        .setDescription('ID da guild para registrar comandos')
        .setRequired(true)),
  
  async execute(client, interaction) {
    // Verifica se é o dono do bot
    if (interaction.user.id !== client.application.owner.id) {
      return interaction.reply({ 
        content: '❌ Apenas o dono do bot pode registrar comandos para guilds.', 
        ephemeral: true 
      });
    }
    
    const guildId = interaction.options.getString('guild_id');
    
    // Verifica se a guild existe
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
      return interaction.reply({ 
        content: '❌ Guild não encontrada ou o bot não está presente nela.', 
        ephemeral: true 
      });
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
      // Atualiza a configuração
      const config = ensureVipConfig();
      if (!config.guildCommands[guildId]) {
        config.guildCommands[guildId] = true;
      }
      fs.writeFileSync(VIP_CONFIG_PATH, JSON.stringify(config, null, 2));
      
      // Registra os comandos para a guild
      const commands = Array.from(client.commands.values()).map(cmd => cmd.data);
      await guild.commands.set(commands);
      
      await interaction.editReply({ 
        content: `✅ Comandos registrados com sucesso para a guild: ${guild.name}`, 
      });
    } catch (error) {
      console.error('Erro ao registrar comandos:', error);
      await interaction.editReply({ 
        content: `❌ Erro ao registrar comandos: ${error.message}`, 
      });
    }
  }
};
