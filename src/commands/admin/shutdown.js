// src/commands/owner/shutdown.js
/**
 * Comando Shutdown - Desliga o bot de forma segura
 * 
 * Este comando permite ao dono do bot desligar o bot de forma segura e elegante,
 * garantindo que todas as conexões sejam fechadas corretamente.
 * 
 * @module commands/owner/shutdown
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isOwner, notOwnerEmbed, errorEmbed } = require('../../utils/ownerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shutdown')
    .setDescription('Desliga o bot de forma segura (apenas owner)')
    .addBooleanOption(option =>
      option
        .setName('confirmação')
        .setDescription('Confirmar desligamento')
        .setRequired(true)),
  
  cooldown: 60, // Cooldown longo para evitar execuções acidentais
  category: 'owner',
  
  /**
   * Executa o comando shutdown
   * @param {Client} client - Cliente do Discord
   * @param {CommandInteraction} interaction - Interação do comando
   */
  async execute(client, interaction) {
    // Verifica se o usuário é um owner autorizado
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ embeds: [notOwnerEmbed()], ephemeral: true });
    }
    
    const confirmation = interaction.options.getBoolean('confirmação');
    
    if (!confirmation) {
      const cancelEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('⚠️ Operação Cancelada')
        .setDescription('Desligamento cancelado pelo usuário.')
        .setTimestamp();
      
      return interaction.reply({ embeds: [cancelEmbed] });
    }
    
    try {
      const shutdownEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🔌 Desligando')
        .setDescription('O bot está sendo desligado de forma segura...')
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [shutdownEmbed] });
      
      // Registra no console
      console.log(`[INFO] Bot desligado por ${interaction.user.tag} (${interaction.user.id}) em ${new Date().toISOString()}`);
      
      // Pequeno delay para garantir que a mensagem seja enviada
      setTimeout(() => {
        // Desconecta o cliente do Discord
        client.destroy();
        
        // Encerra o processo Node.js
        process.exit(0);
      }, 2000);
      
    } catch (error) {
      console.error(`[ERRO][Shutdown] Falha ao desligar o bot:`, error);
      await interaction.reply({ embeds: [errorEmbed(error)] });
    }
  }
};
