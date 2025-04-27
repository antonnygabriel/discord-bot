// src/commands/admin/channelCreate.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('channelcreate')
    .setDescription('Gerencia canais do servidor')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Cria um novo canal')
        .addStringOption(option => 
          option
            .setName('nome')
            .setDescription('Nome do novo canal')
            .setRequired(true))
        .addStringOption(option => 
          option
            .setName('tipo')
            .setDescription('Tipo de canal a ser criado')
            .setRequired(true)
            .addChoices(
              { name: 'Texto', value: 'text' },
              { name: 'Voz', value: 'voice' },
              { name: 'Anúncio', value: 'announcement' },
              { name: 'Palco', value: 'stage' },
              { name: 'Fórum', value: 'forum' }
            ))
        .addChannelOption(option => 
          option
            .setName('categoria')
            .setDescription('Categoria onde o canal será criado')
            .setRequired(false)
            .addChannelTypes(ChannelType.GuildCategory))
        .addStringOption(option => 
          option
            .setName('topico')
            .setDescription('Tópico do canal (apenas para canais de texto e anúncio)')
            .setRequired(false)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ManageChannels'],
  botPermissions: ['ManageChannels'],
  
  async execute(client, interaction) {
    // Verifica se é o subcomando 'create'
    if (interaction.options.getSubcommand() === 'create') {
      // Obtém os parâmetros do comando
      const name = interaction.options.getString('nome');
      const type = interaction.options.getString('tipo');
      const category = interaction.options.getChannel('categoria');
      const topic = interaction.options.getString('topico');
      
      // Verifica permissões do usuário
      if (!await PermissionUtil.checkUserPermissions(interaction, this.userPermissions)) return;
      
      // Verifica permissões do bot
      if (!await PermissionUtil.checkBotPermissions(interaction, this.botPermissions)) return;
      
      try {
        // Mapeia o tipo de canal para o enum ChannelType
        let channelType;
        switch (type) {
          case 'text':
            channelType = ChannelType.GuildText;
            break;
          case 'voice':
            channelType = ChannelType.GuildVoice;
            break;
          case 'announcement':
            channelType = ChannelType.GuildAnnouncement;
            break;
          case 'stage':
            channelType = ChannelType.GuildStageVoice;
            break;
          case 'forum':
            channelType = ChannelType.GuildForum;
            break;
          default:
            channelType = ChannelType.GuildText;
        }
        
        // Opções para criação do canal
        const channelOptions = {
          name: name,
          type: channelType,
          reason: `Canal criado por ${interaction.user.tag}`
        };
        
        // Adiciona o tópico se fornecido e se for um canal de texto ou anúncio
        if (topic && (channelType === ChannelType.GuildText || channelType === ChannelType.GuildAnnouncement)) {
          channelOptions.topic = topic;
        }
        
        // Cria o canal
        let newChannel;
        if (category) {
          // Cria o canal dentro da categoria
          newChannel = await interaction.guild.channels.create(channelOptions);
          await newChannel.setParent(category.id, { lockPermissions: true });
        } else {
          // Cria o canal sem categoria
          newChannel = await interaction.guild.channels.create(channelOptions);
        }
        
        // Mapeia o tipo para exibição
        let typeDisplay;
        switch (type) {
          case 'text':
            typeDisplay = 'Texto';
            break;
          case 'voice':
            typeDisplay = 'Voz';
            break;
          case 'announcement':
            typeDisplay = 'Anúncio';
            break;
          case 'stage':
            typeDisplay = 'Palco';
            break;
          case 'forum':
            typeDisplay = 'Fórum';
            break;
          default:
            typeDisplay = 'Desconhecido';
        }
        
        // Cria o embed de sucesso
        const successEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Canal Criado')
          .setDescription(`O canal ${newChannel} foi criado com sucesso.`)
          .addFields(
            { name: 'Nome', value: name },
            { name: 'Tipo', value: typeDisplay }
          )
          .setTimestamp();
        
        // Adiciona campos opcionais se fornecidos
        if (category) {
          successEmbed.addFields({ name: 'Categoria', value: category.name });
        }
        
        if (topic && (channelType === ChannelType.GuildText || channelType === ChannelType.GuildAnnouncement)) {
          successEmbed.addFields({ name: 'Tópico', value: topic });
        }
        
        // Responde à interação
        await interaction.reply({ embeds: [successEmbed] });
        
      } catch (error) {
        // Trata erros inesperados
        console.error(`Erro ao criar canal:`, error);
        
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`Ocorreu um erro ao tentar criar o canal ${name}.`)
          .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
          .setTimestamp();
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};
