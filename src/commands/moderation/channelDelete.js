// src/commands/admin/channelDelete.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channelcelete')
    .setDescription('Gerencia canais do servidor')
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Deleta um canal existente')
        .addChannelOption(option => 
          option
            .setName('canal')
            .setDescription('O canal a ser deletado')
            .setRequired(true)
            .addChannelTypes(
              ChannelType.GuildText, 
              ChannelType.GuildVoice, 
              ChannelType.GuildAnnouncement, 
              ChannelType.GuildStageVoice,
              ChannelType.GuildForum
            ))
        .addStringOption(option => 
          option
            .setName('motivo')
            .setDescription('Motivo para deletar o canal')
            .setRequired(false)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ManageChannels'],
  botPermissions: ['ManageChannels'],
  
  async execute(client, interaction) {
    // Verifica se é o subcomando 'delete'
    if (interaction.options.getSubcommand() === 'delete') {
      // Obtém os parâmetros do comando
      const channel = interaction.options.getChannel('canal');
      const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';
      
      // Verifica permissões do usuário
      if (!await PermissionUtil.checkUserPermissions(interaction, this.userPermissions)) return;
      
      // Verifica permissões do bot
      if (!await PermissionUtil.checkBotPermissions(interaction, this.botPermissions)) return;
      
      try {
        // Verifica se o canal é o mesmo onde o comando foi executado
        const isSameChannel = channel.id === interaction.channel.id;
        
        // Armazena informações do canal antes de deletá-lo
        const channelName = channel.name;
        const channelType = channel.type;
        
        // Mapeia o tipo para exibição
        let typeDisplay;
        switch (channelType) {
          case ChannelType.GuildText:
            typeDisplay = 'Texto';
            break;
          case ChannelType.GuildVoice:
            typeDisplay = 'Voz';
            break;
          case ChannelType.GuildAnnouncement:
            typeDisplay = 'Anúncio';
            break;
          case ChannelType.GuildStageVoice:
            typeDisplay = 'Palco';
            break;
          case ChannelType.GuildForum:
            typeDisplay = 'Fórum';
            break;
          default:
            typeDisplay = 'Desconhecido';
        }
        
        // Cria o embed de sucesso
        const successEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Canal Deletado')
          .setDescription(`O canal **${channelName}** foi deletado com sucesso.`)
          .addFields(
            { name: 'Deletado por', value: interaction.user.tag },
            { name: 'Tipo', value: typeDisplay },
            { name: 'Motivo', value: reason }
          )
          .setTimestamp();
        
        // Se o canal a ser deletado for o mesmo onde o comando foi executado,
        // responde primeiro e depois deleta o canal
        if (isSameChannel) {
          await interaction.reply({ embeds: [successEmbed], ephemeral: true });
          // Pequeno delay para garantir que a resposta seja enviada antes do canal ser deletado
          setTimeout(() => {
            channel.delete(`${interaction.user.tag}: ${reason}`).catch(console.error);
          }, 1000);
        } else {
          // Deleta o canal
          await channel.delete(`${interaction.user.tag}: ${reason}`);
          // Responde à interação
          await interaction.reply({ embeds: [successEmbed] });
        }
        
      } catch (error) {
        // Trata erros inesperados
        console.error(`Erro ao deletar canal:`, error);
        
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`Ocorreu um erro ao tentar deletar o canal ${channel.name}.`)
          .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
          .setTimestamp();
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};
