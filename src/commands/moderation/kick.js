// src/commands/admin/kick.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa um usuário do servidor')
    .addUserOption(option => 
      option
        .setName('usuario')
        .setDescription('O usuário que será expulso')
        .setRequired(true))
    .addStringOption(option => 
      option
        .setName('motivo')
        .setDescription('Motivo da expulsão')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['KickMembers'],
  botPermissions: ['KickMembers'],
  
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
      
      // Verifica se o bot pode expulsar o usuário (hierarquia de cargos)
      if (!targetMember.kickable) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`Não tenho permissão para expulsar ${targetUser.tag}. Isso pode ocorrer se o usuário tiver um cargo superior ao meu.`)
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Verifica hierarquia entre o executor e o alvo
      if (!PermissionUtil.checkHierarchy(interaction.member, targetMember)) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`Você não pode expulsar ${targetUser.tag} pois ele possui um cargo superior ou igual ao seu.`)
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Executa a expulsão
      await targetMember.kick(`${interaction.user.tag}: ${reason}`);
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Usuário Expulso')
        .setDescription(`${targetUser.tag} foi expulso do servidor.`)
        .addFields(
          { name: 'Expulso por', value: interaction.user.tag },
          { name: 'Motivo', value: reason }
        )
        .setTimestamp();
      
      // Responde à interação
      await interaction.reply({ embeds: [successEmbed] });
      
    } catch (error) {
      // Trata erros inesperados
      console.error(`Erro ao expulsar usuário:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao tentar expulsar ${targetUser.tag}.`)
        .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
