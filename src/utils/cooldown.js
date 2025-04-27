// Sistema de cooldown de comandos 
// src/utils/cooldown.js
const { Collection } = require('discord.js');
const EmbedUtil = require('./embeds');

/**
 * Utilitário para gerenciar cooldowns de comandos
 */
class CooldownUtil {
  /**
   * Verifica e aplica cooldown para um comando
   * @param {Interaction} interaction - Interação do Discord
   * @param {Object} command - Comando sendo executado
   * @param {Collection} cooldowns - Coleção de cooldowns do cliente
   * @returns {boolean} Se o comando pode ser executado (false se em cooldown)
   */
  static async check(interaction, command, cooldowns) {
    // Se o comando não tiver cooldown definido, usa 3 segundos como padrão
    const cooldownAmount = (command.cooldown || 3) * 1000;
    
    // Inicializa a coleção para o comando se não existir
    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const userId = interaction.user.id;
    
    // Verifica se o usuário está em cooldown
    if (timestamps.has(userId)) {
      const expirationTime = timestamps.get(userId) + cooldownAmount;
      
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        
        // Responde com o tempo restante de cooldown
        await interaction.reply({
          embeds: [
            EmbedUtil.warning(
              'Aguarde',
              `Por favor, aguarde ${timeLeft.toFixed(1)} segundos antes de usar o comando \`${command.data.name}\` novamente.`
            )
          ],
          ephemeral: true
        });
        
        return false;
      }
    }
    
    // Define o timestamp para o usuário
    timestamps.set(userId, now);
    
    // Remove o usuário da lista após o período de cooldown
    setTimeout(() => timestamps.delete(userId), cooldownAmount);
    
    return true;
  }
}

module.exports = CooldownUtil;
