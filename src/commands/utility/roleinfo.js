// src/commands/utility/roleinfo.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Mostra informações sobre um cargo específico')
    .addRoleOption(option => 
      option
        .setName('cargo')
        .setDescription('O cargo para mostrar informações')
        .setRequired(true)),
  
  cooldown: 5,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Obtém o cargo
      const role = interaction.options.getRole('cargo');
      
      // Verifica se o cargo existe
      if (!role) {
        return interaction.reply({ 
          content: 'Cargo não encontrado.', 
          ephemeral: true 
        });
      }
      
      // Formata a data de criação
      const createdAt = `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`;
      const createdRelative = `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`;
      
      // Conta quantos membros têm o cargo
      const memberCount = role.members.size;
      
      // Verifica se o cargo é mencionável
      const mentionable = role.mentionable ? 'Sim' : 'Não';
      
      // Verifica se o cargo é exibido separadamente na lista de membros
      const hoisted = role.hoist ? 'Sim' : 'Não';
      
      // Verifica se o cargo é gerenciado por integração
      const managed = role.managed ? 'Sim' : 'Não';
      
      // Lista de permissões importantes
      const permissions = [];
      if (role.permissions.has('Administrator')) permissions.push('Administrador');
      if (role.permissions.has('ManageGuild')) permissions.push('Gerenciar Servidor');
      if (role.permissions.has('BanMembers')) permissions.push('Banir Membros');
      if (role.permissions.has('KickMembers')) permissions.push('Expulsar Membros');
      if (role.permissions.has('ManageChannels')) permissions.push('Gerenciar Canais');
      if (role.permissions.has('ManageRoles')) permissions.push('Gerenciar Cargos');
      if (role.permissions.has('ManageMessages')) permissions.push('Gerenciar Mensagens');
      
      const permissionText = permissions.length > 0 
        ? permissions.join(', ')
        : 'Nenhuma permissão importante';
      
      // Cria o embed com as informações
      const roleEmbed = new EmbedBuilder()
        .setColor(role.color || '#000000')
        .setTitle(`Informações do Cargo: ${role.name}`)
        .addFields(
          { name: '📋 Informações Gerais', value: 
            `**ID:** ${role.id}\n` +
            `**Cor:** ${role.hexColor}\n` +
            `**Posição:** ${role.position}\n` +
            `**Criado em:** ${createdAt}\n` +
            `**Criado há:** ${createdRelative}`
          },
          { name: '👥 Membros', value: `${memberCount} membro${memberCount !== 1 ? 's' : ''}` },
          { name: '⚙️ Configurações', value: 
            `**Mencionável:** ${mentionable}\n` +
            `**Exibido Separadamente:** ${hoisted}\n` +
            `**Gerenciado por Integração:** ${managed}`
          },
          { name: '🔑 Permissões Importantes', value: permissionText }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [roleEmbed] });
    } catch (error) {
      console.error('Erro no comando roleinfo:', error);
      await interaction.reply({ 
        content: 'Ocorreu um erro ao buscar informações do cargo.', 
        ephemeral: true 
      });
    }
  }
};
