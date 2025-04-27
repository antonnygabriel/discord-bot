// src/commands/owner/guilds.js
/**
 * Comando Guilds - Lista todos os servidores em que o bot está
 * 
 * Este comando permite ao dono do bot visualizar todos os servidores em que o bot está,
 * mostrando informações como nome, ID, membros e região.
 * 
 * @module commands/owner/guilds
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwner, notOwnerEmbed, errorEmbed } = require('../../utils/ownerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guilds')
    .setDescription('Lista todos os servidores que o bot está (apenas owner)')
    .addIntegerOption(option =>
      option
        .setName('página')
        .setDescription('Página da lista de servidores (padrão: 1)')
        .setRequired(false)
        .setMinValue(1)),
  
  cooldown: 5,
  category: 'owner',
  
  /**
   * Executa o comando guilds
   * @param {Client} client - Cliente do Discord
   * @param {CommandInteraction} interaction - Interação do comando
   */
  async execute(client, interaction) {
    // Verifica se o usuário é um owner autorizado
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ embeds: [notOwnerEmbed()], ephemeral: true });
    }
    
    try {
      await interaction.deferReply({ ephemeral: true });
      
      // Obtém todos os servidores e ordena por quantidade de membros
      const guilds = [...client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount);
      
      if (guilds.length === 0) {
        const noGuildsEmbed = new EmbedBuilder()
          .setColor('#FFFF00')
          .setTitle('⚠️ Nenhum Servidor')
          .setDescription('O bot não está em nenhum servidor.')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [noGuildsEmbed] });
      }
      
      // Configuração de paginação
      const itemsPerPage = 10;
      const page = interaction.options.getInteger('página') || 1;
      const totalPages = Math.ceil(guilds.length / itemsPerPage);
      
      // Valida a página solicitada
      if (page > totalPages) {
        const invalidPageEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Página Inválida')
          .setDescription(`A página ${page} não existe. O total de páginas é ${totalPages}.`)
          .setTimestamp();
        
        return interaction.editReply({ embeds: [invalidPageEmbed] });
      }
      
      // Calcula o intervalo de servidores para a página atual
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, guilds.length);
      const pageGuilds = guilds.slice(startIndex, endIndex);
      
      // Cria o embed principal
      const guildsEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('🌐 Lista de Servidores')
        .setDescription(`O bot está em **${guilds.length}** servidores.\nExibindo página ${page}/${totalPages}.`)
        .setFooter({ text: `Use /guilds página:<número> para navegar` })
        .setTimestamp();
      
      // Adiciona os servidores como campos
      for (let i = 0; i < pageGuilds.length; i++) {
        const guild = pageGuilds[i];
        const guildIndex = startIndex + i + 1;
        
        // Obtém o dono do servidor
        const owner = await client.users.fetch(guild.ownerId).catch(() => ({ tag: 'Desconhecido' }));
        
        // Obtém a região do servidor (se disponível)
        const region = guild.preferredLocale || 'Desconhecida';
        
        guildsEmbed.addFields({
          name: `${guildIndex}. ${guild.name}`,
          value: [
            `**ID:** \`${guild.id}\``,
            `**Membros:** ${guild.memberCount}`,
            `**Dono:** ${owner.tag} (\`${guild.ownerId}\`)`,
            `**Região:** ${region}`,
            `**Criado em:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`
          ].join('\n')
        });
      }
      
      await interaction.editReply({ embeds: [guildsEmbed] });
      
    } catch (error) {
      console.error(`[ERRO][Guilds] Falha ao listar servidores:`, error);
      await interaction.editReply({ embeds: [errorEmbed(error)] });
    }
  }
};
