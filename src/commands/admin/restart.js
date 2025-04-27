// src/commands/owner/restart.js
const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { exec } = require('child_process');
const { isOwner, notOwnerEmbed, errorEmbed, successEmbed } = require('../../utils/ownerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Reinicia o bot (apenas dono)'),
  
  // Definir como true para que apenas o dono possa usar
  ownerOnly: true,
  
  async execute(client, interaction) {
    // Verifica se o usuário é o dono do bot usando a função utilitária
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [notOwnerEmbed()],
        ephemeral: true
      });
    }
    
    // Cria botões de confirmação
    const confirmButton = new ButtonBuilder()
      .setCustomId('restart_confirm')
      .setLabel('Confirmar')
      .setStyle(ButtonStyle.Danger);
    
    const cancelButton = new ButtonBuilder()
      .setCustomId('restart_cancel')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
    
    // Embed de confirmação personalizado
    const confirmEmbed = {
      color: 0xFF0000,
      title: '⚠️ Confirmação de Reinicialização',
      description: 'Você tem certeza que deseja reiniciar o bot? Isso irá interromper temporariamente todos os serviços.',
      footer: { text: 'Esta ação não pode ser desfeita.' }
    };
    
    // Envia mensagem de confirmação
    const response = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      fetchReply: true
    });
    
    // Cria coletor para os botões
    const collector = response.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 30000 // 30 segundos para decidir
    });
    
    collector.on('collect', async i => {
      if (i.customId === 'restart_confirm') {
        // Atualiza a mensagem para mostrar que está reiniciando
        const restartingEmbed = {
          color: 0xFFA500,
          title: '🔄 Reiniciando...',
          description: 'O bot está sendo reiniciado. Por favor, aguarde alguns instantes.',
          timestamp: new Date().toISOString()
        };
        
        await i.update({ embeds: [restartingEmbed], components: [] });
        
        // Registra no console
        console.log(`[${new Date().toISOString()}] Bot sendo reiniciado por ${interaction.user.tag} (${interaction.user.id})`);
        
        // Espera 2 segundos para a mensagem ser enviada
        setTimeout(() => {
          try {
            // Em produção, você pode querer usar um script específico para seu ambiente
            // Por exemplo, PM2: exec('pm2 restart botProcessName')
            if (process.env.NODE_ENV === 'production') {
              // Para PM2
              exec('pm2 restart botProcessName', (error) => {
                if (error) {
                  console.error('Erro ao reiniciar via PM2:', error);
                  // O processo será encerrado de qualquer forma
                }
              });
            } else {
              // Desenvolvimento - apenas encerra o processo
              // O sistema de reinício (nodemon, pm2, etc.) irá reiniciá-lo
              process.exit(0);
            }
          } catch (error) {
            console.error('Erro ao reiniciar o bot:', error);
            // Tenta enviar mensagem de erro, mas pode não funcionar se o processo já estiver encerrando
            interaction.channel.send({ embeds: [errorEmbed('Ocorreu um erro ao reiniciar o bot. Verifique os logs.')] }).catch(() => {});
          }
        }, 2000);
      } else if (i.customId === 'restart_cancel') {
        // Cancela o reinício usando o successEmbed
        await i.update({ 
          embeds: [successEmbed('Reinicialização Cancelada', 'A operação de reinicialização foi cancelada.')], 
          components: [] 
        });
      }
    });
    
    collector.on('end', async (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        // Tempo esgotado sem resposta
        const timeoutEmbed = {
          color: 0x808080,
          title: '⏱️ Tempo Esgotado',
          description: 'A operação de reinicialização foi cancelada devido à inatividade.',
          timestamp: new Date().toISOString()
        };
        
        await interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      }
    });
  }
};
