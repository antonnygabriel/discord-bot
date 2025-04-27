// src/commands/admin/setnick.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setnick')
    .setDescription('Altera o apelido de um usuário')
    .addUserOption(option => 
      option
        .setName('usuario')
        .setDescription('O usuário que terá o apelido alterado')
        .setRequired(true))
    .addStringOption(option => 
      option
        .setName('apelido')
        .setDescription('O novo apelido (deixe em branco para remover)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ManageNicknames'],
  botPermissions: ['ManageNicknames'],
  
  async execute(client, interaction) {
    // Obtém o usuário e o novo apelido
    const targetUser = interaction.options.getUser('usuario');
    const newNickname = interaction.options.getString('apelido') || null; // null remove o apelido
    
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
      
      // Verifica se o bot pode alterar o apelido do usuário (hierarquia de cargos)
      if (!targetMember.manageable) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`Não tenho permissão para alterar o apelido de ${targetUser.tag}. Isso pode ocorrer se o usuário tiver um cargo superior ao meu.`)
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Verifica hierarquia entre o executor e o alvo (exceto para o dono do servidor)
      if (interaction.guild.ownerId !== interaction.user.id && !PermissionUtil.checkHierarchy(interaction.member, targetMember)) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`Você não pode alterar o apelido de ${targetUser.tag} pois ele possui um cargo superior ou igual ao seu.`)
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Armazena o apelido antigo para exibir na resposta
      const oldNickname = targetMember.nickname || targetUser.username;
      
      // Altera o apelido
      await targetMember.setNickname(newNickname, `Alterado por ${interaction.user.tag}`);
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✏️ Apelido Alterado')
        .setDescription(`O apelido de ${targetUser.tag} foi alterado com sucesso.`)
        .addFields(
          { name: 'Alterado por', value: interaction.user.tag },
          { name: 'Apelido anterior', value: oldNickname }
        )
        .setTimestamp();
      
      // Adiciona o campo de novo apelido, se especificado
      if (newNickname) {
        successEmbed.addFields({ name: 'Novo apelido', value: newNickname });
      } else {
        successEmbed.addFields({ name: 'Novo apelido', value: 'Removido' });
      }
      
      // Responde à interação
      await interaction.reply({ embeds: [successEmbed] });
      
    } catch (error) {
      // Trata erros inesperados
      console.error(`Erro ao alterar apelido:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao tentar alterar o apelido de ${targetUser.tag}.`)
        .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
