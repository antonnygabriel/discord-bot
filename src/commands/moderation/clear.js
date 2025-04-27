// src/commands/admin/clear.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpa mensagens de um canal')
    .addIntegerOption(option => 
      option
        .setName('quantidade')
        .setDescription('Quantidade de mensagens a serem apagadas (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(option => 
      option
        .setName('usuario')
        .setDescription('Filtrar mensagens apenas deste usuário')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ManageMessages'],
  botPermissions: ['ManageMessages'],
  
  async execute(client, interaction) {
    // Obtém a quantidade e o usuário opcional
    const amount = interaction.options.getInteger('quantidade');
    const targetUser = interaction.options.getUser('usuario');
    
    // Verifica permissões do usuário
    if (!await PermissionUtil.checkUserPermissions(interaction, this.userPermissions)) return;
    
    // Verifica permissões do bot
    if (!await PermissionUtil.checkBotPermissions(interaction, this.botPermissions)) return;
    
    // Adia a resposta para ter tempo de processar
    await interaction.deferReply({ ephemeral: true });
    
    try {
      // Busca as mensagens
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      
      // Filtra as mensagens
      let messagesToDelete = messages;
      
      // Filtra por usuário, se especificado
      if (targetUser) {
        messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
      }
      
      // Filtra mensagens com menos de 14 dias (limitação da API do Discord)
      messagesToDelete = messagesToDelete.filter(msg => {
        return (Date.now() - msg.createdTimestamp) < 1209600000; // 14 dias em milissegundos
      });
      
      // Limita à quantidade solicitada
      messagesToDelete = Array.from(messagesToDelete.values()).slice(0, amount);
      
      // Verifica se há mensagens para apagar
      if (messagesToDelete.length === 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription('Não foram encontradas mensagens para apagar. Lembre-se que mensagens com mais de 14 dias não podem ser apagadas em massa.')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }
      
      // Apaga as mensagens
      const deleted = await interaction.channel.bulkDelete(messagesToDelete, true);
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🧹 Mensagens Apagadas')
        .setDescription(`${deleted.size} mensagens foram apagadas com sucesso.`)
        .setTimestamp();
      
      // Adiciona informação sobre filtro de usuário, se aplicável
      if (targetUser) {
        successEmbed.addFields({ name: 'Filtrado por usuário', value: targetUser.tag });
      }
      
      // Responde à interação
      await interaction.editReply({ embeds: [successEmbed] });
      
    } catch (error) {
      // Trata erros específicos
      let errorMessage = `Ocorreu um erro ao tentar apagar as mensagens.`;
      
      if (error.code === 10008) {
        errorMessage = 'Não foi possível apagar algumas mensagens. Mensagens com mais de 14 dias não podem ser apagadas em massa.';
      }
      
      // Trata erros inesperados
      console.error(`Erro ao apagar mensagens:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro')
        .setDescription(errorMessage)
        .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
