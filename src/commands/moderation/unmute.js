// src/commands/admin/unmute.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove o silenciamento de um usuário')
    .addUserOption(option => 
      option
        .setName('usuario')
        .setDescription('O usuário que terá o silenciamento removido')
        .setRequired(true))
    .addStringOption(option => 
      option
        .setName('motivo')
        .setDescription('Motivo da remoção do silenciamento')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ModerateMembers', 'ManageRoles'],
  botPermissions: ['ManageRoles'],
  
  async execute(client, interaction) {
    // Obtém o usuário alvo e o motivo
    const targetUser = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';
    
    // Verifica permissões do usuário
    if (!await PermissionUtil.checkUserPermissions(interaction, this.userPermissions)) return;
    
    // Verifica permissões do bot
    if (!await PermissionUtil.checkBotPermissions(interaction, this.botPermissions)) return;
    
    try {
      // Obtém o membro do servidor
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      // Verifica se o membro existe no servidor
      if (!targetMember) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`O usuário ${targetUser.tag} não está no servidor.`)
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Procura o cargo "Muted" no servidor
      const mutedRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');
      
      // Verifica se o cargo existe e se o usuário o possui
      if (!mutedRole || !targetMember.roles.cache.has(mutedRole.id)) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`${targetUser.tag} não está silenciado.`)
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Remove o cargo Muted do usuário
      await targetMember.roles.remove(mutedRole, `${interaction.user.tag}: ${reason}`);
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔊 Silenciamento Removido')
        .setDescription(`O silenciamento de ${targetUser.tag} foi removido.`)
        .addFields(
          { name: 'Removido por', value: interaction.user.tag },
          { name: 'Motivo', value: reason }
        )
        .setTimestamp();
      
      // Responde à interação
      await interaction.reply({ embeds: [successEmbed] });
      
    } catch (error) {
      // Trata erros inesperados
      console.error(`Erro ao remover silenciamento:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao tentar remover o silenciamento de ${targetUser.tag}.`)
        .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
