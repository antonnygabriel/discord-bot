// Utils para verificar permissoes 
// src/utils/permissions.js
const { PermissionsBitField } = require('discord.js');
const EmbedUtil = require('./embeds');

/**
 * Utilitário para verificação de permissões
 */
class PermissionUtil {
  /**
   * Verifica se o usuário tem as permissões necessárias
   * @param {Interaction} interaction - Interação do Discord
   * @param {Array} permissions - Array de permissões necessárias
   * @returns {boolean} Se o usuário tem todas as permissões
   */
  static async checkUserPermissions(interaction, permissions) {
    if (!interaction.guild) return true;
    
    const member = interaction.member;
    
    // Verifica se o usuário é o dono do servidor
    if (interaction.guild.ownerId === member.id) return true;
    
    // Verifica as permissões do usuário
    const missingPermissions = permissions.filter(perm => !member.permissions.has(PermissionsBitField.Flags[perm]));
    
    if (missingPermissions.length > 0) {
      const formattedPermissions = missingPermissions.map(perm => `\`${perm}\``).join(', ');
      
      await interaction.reply({
        embeds: [
          EmbedUtil.error(
            'Permissões Insuficientes',
            `Você precisa das seguintes permissões para usar este comando: ${formattedPermissions}`
          )
        ],
        ephemeral: true
      });
      
      return false;
    }
    
    return true;
  }
  
  /**
   * Verifica se o bot tem as permissões necessárias
   * @param {Interaction} interaction - Interação do Discord
   * @param {Array} permissions - Array de permissões necessárias
   * @returns {boolean} Se o bot tem todas as permissões
   */
  static async checkBotPermissions(interaction, permissions) {
    if (!interaction.guild) return true;
    
    const me = interaction.guild.members.me;
    
    // Verifica as permissões do bot
    const missingPermissions = permissions.filter(perm => !me.permissions.has(PermissionsBitField.Flags[perm]));
    
    if (missingPermissions.length > 0) {
      const formattedPermissions = missingPermissions.map(perm => `\`${perm}\``).join(', ');
      
      await interaction.reply({
        embeds: [
          EmbedUtil.error(
            'Permissões do Bot Insuficientes',
            `Eu preciso das seguintes permissões para executar este comando: ${formattedPermissions}`
          )
        ],
        ephemeral: true
      });
      
      return false;
    }
    
    return true;
  }
  
  /**
   * Verifica a hierarquia de cargos entre dois membros
   * @param {GuildMember} executor - Membro que executa a ação
   * @param {GuildMember} target - Membro alvo da ação
   * @returns {boolean} Se o executor tem cargo superior ao alvo
   */
  static checkHierarchy(executor, target) {
    // Se o alvo for o dono do servidor, não pode ser afetado
    if (target.id === target.guild.ownerId) return false;
    
    // Se o executor for o dono do servidor, pode afetar qualquer um
    if (executor.id === executor.guild.ownerId) return true;
    
    // Compara as posições dos cargos mais altos
    return executor.roles.highest.position > target.roles.highest.position;
  }
}

module.exports = PermissionUtil;
