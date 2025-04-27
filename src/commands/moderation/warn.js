// src/commands/admin/warn.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

// Mock de banco de dados para armazenar avisos
// Em uma implementação real, isso seria substituído por um banco de dados
if (!global.warnings) {
  global.warnings = new Map();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avisa formalmente um usuário')
    .addUserOption(option => 
      option
        .setName('usuario')
        .setDescription('O usuário que receberá o aviso')
        .setRequired(true))
    .addStringOption(option => 
      option
        .setName('motivo')
        .setDescription('Motivo do aviso')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ModerateMembers'],
  botPermissions: ['SendMessages'],
  
  async execute(client, interaction) {
    // Obtém o usuário alvo e o motivo
    const targetUser = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('motivo');
    
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
      
      // Verifica hierarquia entre o executor e o alvo
      if (!PermissionUtil.checkHierarchy(interaction.member, targetMember)) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`Você não pode avisar ${targetUser.tag} pois ele possui um cargo superior ou igual ao seu.`)
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Inicializa o array de avisos para o servidor se não existir
      const guildId = interaction.guild.id;
      if (!global.warnings.has(guildId)) {
        global.warnings.set(guildId, new Map());
      }
      
      const guildWarnings = global.warnings.get(guildId);
      
      // Inicializa o array de avisos para o usuário se não existir
      if (!guildWarnings.has(targetUser.id)) {
        guildWarnings.set(targetUser.id, []);
      }
      
      // Adiciona o novo aviso
      const warning = {
        moderator: interaction.user.id,
        reason: reason,
        timestamp: Date.now()
      };
      
      guildWarnings.get(targetUser.id).push(warning);
      
      // Conta o número total de avisos
      const warningCount = guildWarnings.get(targetUser.id).length;
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('⚠️ Usuário Avisado')
        .setDescription(`${targetUser.tag} recebeu um aviso formal.`)
        .addFields(
          { name: 'Avisado por', value: interaction.user.tag },
          { name: 'Motivo', value: reason },
          { name: 'Total de avisos', value: warningCount.toString() }
        )
        .setTimestamp();
      
      // Responde à interação
      await interaction.reply({ embeds: [successEmbed] });
      
      // Tenta enviar uma mensagem privada para o usuário avisado
      try {
        const dmEmbed = new EmbedBuilder()
          .setColor('#FFFF00')
          .setTitle(`⚠️ Você recebeu um aviso em ${interaction.guild.name}`)
          .setDescription(`Você recebeu um aviso formal de um moderador.`)
          .addFields(
            { name: 'Motivo', value: reason },
            { name: 'Total de avisos', value: warningCount.toString() }
          )
          .setTimestamp();
        
        await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
          // Ignora erros ao enviar DM (usuário pode ter DMs desativadas)
        });
      } catch (dmError) {
        // Ignora erros ao enviar DM
      }
      
    } catch (error) {
      // Trata erros inesperados
      console.error(`Erro ao avisar usuário:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao tentar avisar ${targetUser.tag}.`)
        .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
