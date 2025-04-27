// src/components/modals/feedback.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  customId: 'feedback', // Parte inicial do customId (feedback_type)
  
  async execute(client, interaction, args) {
    const [feedbackType] = args;
    
    // Obtém os valores dos campos do modal
    const title = interaction.fields.getTextInputValue('feedbackTitle');
    const description = interaction.fields.getTextInputValue('feedbackDescription');
    
    // Responde ao usuário
    await interaction.reply({
      content: `Feedback do tipo ${feedbackType} recebido! Obrigado pela sua contribuição.`,
      ephemeral: true
    });
    
    // Envia o feedback para um canal específico
    if (process.env.FEEDBACK_CHANNEL_ID) {
      try {
        const feedbackChannel = await client.channels.fetch(process.env.FEEDBACK_CHANNEL_ID);
        
        const feedbackEmbed = new EmbedBuilder()
          .setColor('#0099FF')
          .setTitle(`Novo Feedback: ${title}`)
          .setDescription(description)
          .addFields(
            { name: 'Tipo', value: feedbackType },
            { name: 'Enviado por', value: `${interaction.user.tag} (${interaction.user.id})` }
          )
          .setTimestamp();
        
        await feedbackChannel.send({ embeds: [feedbackEmbed] });
      } catch (error) {
        console.error('Erro ao enviar feedback:', error);
      }
    }
  }
};
