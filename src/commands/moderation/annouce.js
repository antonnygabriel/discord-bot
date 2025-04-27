// src/commands/admin/announce.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Envia um anúncio embedado para um canal específico')
    .addChannelOption(option => 
      option
        .setName('canal')
        .setDescription('O canal onde o anúncio será enviado')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
    .addStringOption(option => 
      option
        .setName('titulo')
        .setDescription('Título do anúncio')
        .setRequired(true))
    .addStringOption(option => 
      option
        .setName('mensagem')
        .setDescription('Conteúdo do anúncio')
        .setRequired(true))
    .addStringOption(option => 
      option
        .setName('cor')
        .setDescription('Cor da borda do anúncio (em hexadecimal)')
        .setRequired(false))
    .addStringOption(option => 
      option
        .setName('imagem')
        .setDescription('URL da imagem para o anúncio (opcional)')
        .setRequired(false))
    .addBooleanOption(option => 
      option
        .setName('mencionar')
        .setDescription('Mencionar @everyone no anúncio?')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ManageMessages'],
  botPermissions: ['SendMessages', 'EmbedLinks'],
  
  async execute(client, interaction) {
    // Obtém os parâmetros do comando
    const channel = interaction.options.getChannel('canal');
    const title = interaction.options.getString('titulo');
    const message = interaction.options.getString('mensagem');
    const color = interaction.options.getString('cor') || '#0099FF';
    const imageUrl = interaction.options.getString('imagem');
    const mentionEveryone = interaction.options.getBoolean('mencionar') || false;
    
    // Verifica permissões do usuário
    if (!await PermissionUtil.checkUserPermissions(interaction, this.userPermissions)) return;
    
    // Verifica permissões do bot
    if (!await PermissionUtil.checkBotPermissions(interaction, this.botPermissions)) return;
    
    try {
      // Valida a cor hexadecimal
      const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
      let validColor = '#0099FF';
      
      if (color && colorRegex.test(color)) {
        validColor = color;
      } else if (color) {
        const warnEmbed = new EmbedBuilder()
          .setColor('#FFFF00')
          .setTitle('⚠️ Aviso')
          .setDescription('A cor fornecida não é um código hexadecimal válido. Usando a cor padrão (#0099FF).')
          .setTimestamp();
        
        await interaction.reply({ embeds: [warnEmbed], ephemeral: true });
        return;
      }
      
      // Cria o embed do anúncio
      const announceEmbed = new EmbedBuilder()
        .setColor(validColor)
        .setTitle(title)
        .setDescription(message)
        .setTimestamp()
        .setFooter({ text: `Anúncio por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
      
      // Adiciona imagem se fornecida
      if (imageUrl) {
        try {
          announceEmbed.setImage(imageUrl);
        } catch (error) {
          // Se a URL da imagem for inválida, ignora e continua
          console.error('URL de imagem inválida:', error);
        }
      }
      
      // Prepara o conteúdo da mensagem (menção @everyone se solicitado)
      const messageContent = mentionEveryone ? '@everyone' : '';
      
      // Envia o anúncio para o canal especificado
      await channel.send({ content: messageContent, embeds: [announceEmbed] });
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Anúncio Enviado')
        .setDescription(`Seu anúncio foi enviado com sucesso para o canal ${channel}.`)
        .setTimestamp();
      
      // Responde à interação
      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      
    } catch (error) {
      // Trata erros inesperados
      console.error(`Erro ao enviar anúncio:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao tentar enviar o anúncio.`)
        .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
