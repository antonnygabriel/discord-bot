// src/commands/admin/roleDelete.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roledelete')
    .setDescription('Gerencia cargos do servidor')
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Deleta um cargo do servidor')
        .addRoleOption(option => 
          option
            .setName('cargo')
            .setDescription('O cargo a ser deletado')
            .setRequired(true))
        .addStringOption(option => 
          option
            .setName('motivo')
            .setDescription('Motivo para deletar o cargo')
            .setRequired(false)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ManageRoles'],
  botPermissions: ['ManageRoles'],
  
  async execute(client, interaction) {
    // Verifica se é o subcomando 'delete'
    if (interaction.options.getSubcommand() === 'delete') {
      // Obtém os parâmetros do comando
      const role = interaction.options.getRole('cargo');
      const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';
      
      // Verifica permissões do usuário
      if (!await PermissionUtil.checkUserPermissions(interaction, this.userPermissions)) return;
      
      // Verifica permissões do bot
      if (!await PermissionUtil.checkBotPermissions(interaction, this.botPermissions)) return;
      
      try {
        // Verifica se o cargo é o @everyone (que não pode ser deletado)
        if (role.id === interaction.guild.id) {
          const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Erro')
            .setDescription('O cargo @everyone não pode ser deletado.')
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
        
        // Verifica hierarquia entre o executor e o cargo
        if (interaction.member.roles.highest.position <= role.position && interaction.guild.ownerId !== interaction.user.id) {
          const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Erro')
            .setDescription(`Você não pode deletar o cargo ${role.name} pois ele é superior ou igual ao seu cargo mais alto.`)
            .setTimestamp();
          
          return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        
        // Armazena informações do cargo antes de deletá-lo
        const roleName = role.name;
        const roleColor = role.hexColor;
        const roleMemberCount = role.members.size;
        
        // Deleta o cargo
        await role.delete(`${interaction.user.tag}: ${reason}`);
        
        // Cria o embed de sucesso
        const successEmbed = new EmbedBuilder()
          .setColor(roleColor)
          .setTitle('✅ Cargo Deletado')
          .setDescription(`O cargo **${roleName}** foi deletado com sucesso.`)
          .addFields(
            { name: 'Deletado por', value: interaction.user.tag },
            { name: 'Motivo', value: reason },
            { name: 'Membros afetados', value: roleMemberCount.toString() }
          )
          .setTimestamp();
        
        // Responde à interação
        await interaction.reply({ embeds: [successEmbed] });
        
      } catch (error) {
        // Trata erros inesperados
        console.error(`Erro ao deletar cargo:`, error);
        
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`Ocorreu um erro ao tentar deletar o cargo ${role.name}.`)
          .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
          .setTimestamp();
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};
