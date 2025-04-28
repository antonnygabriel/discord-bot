// src/commands/admin/vip.js
const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { isOwner, notOwnerEmbed, errorEmbed, successEmbed } = require('../../utils/ownerUtils');

const VIP_CONFIG_PATH = path.join(__dirname, '../../../vipConfig.json');

// Função para garantir que o arquivo de configuração VIP existe
function ensureVipConfig() {
  try {
    if (fs.existsSync(VIP_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(VIP_CONFIG_PATH, 'utf8'));
    } else {
      const defaultConfig = {
        vipUsers: [],
        guildCommands: {}
      };
      fs.writeFileSync(VIP_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
  } catch (error) {
    console.error('Erro ao carregar configuração VIP:', error);
    return { vipUsers: [], guildCommands: {} };
  }
}

// Função para verificar se um usuário é VIP
function isVipUser(userId) {
  const config = ensureVipConfig();
  return config.vipUsers.includes(userId);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vip')
    .setDescription('Gerencia usuários VIP (apenas dono do bot)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Adiciona um usuário à lista VIP')
        .addUserOption(option => 
          option.setName('usuario')
            .setDescription('Usuário para adicionar como VIP')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove um usuário da lista VIP')
        .addUserOption(option => 
          option.setName('usuario')
            .setDescription('Usuário para remover da lista VIP')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Lista todos os usuários VIP')),
  
  // Marcar como comando apenas para o dono
  ownerOnly: true,
  
  async execute(client, interaction) {
    // Verifica se é o dono do bot usando a função utilitária
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [notOwnerEmbed()],
        ephemeral: true
      });
    }
    
    const subcommand = interaction.options.getSubcommand();
    const config = ensureVipConfig();
    
    switch (subcommand) {
      case 'add': {
        const user = interaction.options.getUser('usuario');
        if (isVipUser(user.id)) {
          return interaction.reply({ 
            embeds: [errorEmbed(`${user.username} já é um usuário VIP.`)],
            ephemeral: true 
          });
        }
        
        try {
          config.vipUsers.push(user.id);
          fs.writeFileSync(VIP_CONFIG_PATH, JSON.stringify(config, null, 2));
          
          return interaction.reply({ 
            embeds: [successEmbed('Usuário VIP Adicionado', `${user.username} foi adicionado como usuário VIP.`)],
            ephemeral: true 
          });
        } catch (error) {
          console.error('Erro ao adicionar usuário VIP:', error);
          return interaction.reply({
            embeds: [errorEmbed('Ocorreu um erro ao adicionar o usuário VIP.')],
            ephemeral: true
          });
        }
      }
      
      case 'remove': {
        const user = interaction.options.getUser('usuario');
        if (!isVipUser(user.id)) {
          return interaction.reply({ 
            embeds: [errorEmbed(`${user.username} não é um usuário VIP.`)],
            ephemeral: true 
          });
        }
        
        try {
          config.vipUsers = config.vipUsers.filter(id => id !== user.id);
          fs.writeFileSync(VIP_CONFIG_PATH, JSON.stringify(config, null, 2));
          
          return interaction.reply({ 
            embeds: [successEmbed('Usuário VIP Removido', `${user.username} foi removido da lista VIP.`)],
            ephemeral: true 
          });
        } catch (error) {
          console.error('Erro ao remover usuário VIP:', error);
          return interaction.reply({
            embeds: [errorEmbed('Ocorreu um erro ao remover o usuário VIP.')],
            ephemeral: true
          });
        }
      }
      
      case 'list': {
        if (config.vipUsers.length === 0) {
          return interaction.reply({ 
            embeds: [errorEmbed('Não há usuários VIP registrados.')],
            ephemeral: true 
          });
        }
        
        try {
          // Usa Promise.all para buscar usuários em paralelo
          const userPromises = config.vipUsers.map(userId => 
            client.users.fetch(userId)
              .then(user => `- ${user.username} (${userId})`)
              .catch(() => `- ID: ${userId} (usuário não encontrado)`)
          );
          
          const userEntries = await Promise.all(userPromises);
          const vipList = userEntries.join('\n');
          
          return interaction.reply({ 
            embeds: [successEmbed('Usuários VIP', vipList)],
            ephemeral: true 
          });
        } catch (error) {
          console.error('Erro ao listar usuários VIP:', error);
          return interaction.reply({ 
            embeds: [errorEmbed('Ocorreu um erro ao listar os usuários VIP.')],
            ephemeral: true 
          });
        }
      }
    }
  }
};
