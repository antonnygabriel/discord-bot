// src/commands/admin/roleRemove.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleremove')
    .setDescription('Gerencia cargos do servidor')
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove um cargo de um membro')
        .addUserOption(option => 
          option
            .setName('usuario')
            .setDescription('O usuário que perderá o cargo')
            .setRequired(true))
        .addRoleOption(option => 
          option
            .setName('cargo')
            .setDescription('O cargo a ser removido')
            .setRequired(true))
        .addStringOption(option => 
          option
            .setName('motivo')
            .setDescription('Motivo para remover o cargo')
            .setRequired(false)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ManageRoles'],
  botPermissions: ['ManageRoles'],
  
  async execute(client, interaction) {
    // Verifica se é o subcomando 'remove'
    if (interaction.options.getSubcommand() === 'remove') {
      // Obtém os parâmetros do comando
      const targetUser = interaction.options.getUser('usuario');
      const role = interaction.options.getRole('cargo');
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
        
        // Verifica se o cargo é gerenciável pelo bot
        if (!role.editable) {
          const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Erro')
            .setDescription(`Não tenho permissão para gerenciar o cargo ${role.name}. Isso pode ocorrer se o cargo for superior ao meu cargo mais alto.`)
            .setTimestamp();
          
          return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        // Verifica se o usuário possui o cargo
        if (!targetMember.roles.cache.has(role.id)) {
          const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Erro')
            .setDescription(`${targetUser.tag} não possui o cargo ${role.name}.`)
            .setTimestamp();
          
          return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        // Verifica hierarquia entre o executor e o cargo
        if (interaction.member.roles.highest.position <= role.position && interaction.guild.ownerId !== interaction.user.id) {
          const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Erro')
            .setDescription(`Você não pode remover o cargo ${role.name} pois ele é superior ou igual ao seu cargo mais alto.`)
            .setTimestamp();
          
          return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        // Remove o cargo do membro
        await targetMember.roles.remove(role, `${interaction.user.tag}: ${reason}`);
        
        // Cria o embed de sucesso
        const successEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Cargo Removido')
          .setDescription(`O cargo ${role} foi removido de ${targetUser.tag}.`)
          .addFields(
            { name: 'Removido por', value: interaction.user.tag },
            { name: 'Motivo', value: reason }
          )
          .setTimestamp();
        
        // Responde à interação
        await interaction.reply({ embeds: [successEmbed] });
        
      } catch (error) {
        // Trata erros inesperados
        console.error(`Erro ao remover cargo:`, error);
        
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`Ocorreu um erro ao tentar remover o cargo ${role.name} de ${targetUser.tag}.`)
          .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
          .setTimestamp();
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};
