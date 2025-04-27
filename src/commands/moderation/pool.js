// src/commands/admin/poll.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Cria uma enquete com reações de votação')
    .addStringOption(option => 
      option
        .setName('pergunta')
        .setDescription('A pergunta da enquete')
        .setRequired(true))
    .addChannelOption(option => 
      option
        .setName('canal')
        .setDescription('O canal onde a enquete será enviada (padrão: canal atual)')
        .setRequired(false)
        .addChannelTypes(ChannelType.GuildText))
    .addStringOption(option => 
      option
        .setName('opcoes')
        .setDescription('Opções separadas por vírgula (deixe em branco para Sim/Não)')
        .setRequired(false))
    .addBooleanOption(option => 
      option
        .setName('mencionar')
        .setDescription('Mencionar @everyone na enquete?')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ManageMessages'],
  botPermissions: ['SendMessages', 'EmbedLinks', 'AddReactions'],
  
  async execute(client, interaction) {
    // Obtém os parâmetros do comando
    const question = interaction.options.getString('pergunta');
    const channel = interaction.options.getChannel('canal') || interaction.channel;
    const optionsString = interaction.options.getString('opcoes');
    const mentionEveryone = interaction.options.getBoolean('mencionar') || false;
    
    // Verifica permissões do usuário
    if (!await PermissionUtil.checkUserPermissions(interaction, this.userPermissions)) return;
    
    // Verifica permissões do bot
    if (!await PermissionUtil.checkBotPermissions(interaction, this.botPermissions)) return;
    
    try {
      // Processa as opções da enquete
      let options = [];
      let reactions = [];
      
      if (optionsString) {
        // Divide as opções por vírgula
        options = optionsString.split(',').map(option => option.trim()).filter(option => option.length > 0);
        
        // Limita a 10 opções
        if (options.length > 10) {
          const warnEmbed = new EmbedBuilder()
            .setColor('#FFFF00')
            .setTitle('⚠️ Aviso')
            .setDescription('Você forneceu mais de 10 opções. Apenas as 10 primeiras serão usadas.')
            .setTimestamp();
          
          await interaction.reply({ embeds: [warnEmbed], ephemeral: true });
          options = options.slice(0, 10);
        }
        
        // Define os emojis para as opções (1️⃣, 2️⃣, etc.)
        const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        reactions = numberEmojis.slice(0, options.length);
      } else {
        // Enquete simples de Sim/Não
        options = ['Sim', 'Não'];
        reactions = ['✅', '❌'];
      }
      
      // Cria o embed da enquete
      const pollEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📊 ' + question)
        .setTimestamp()
        .setFooter({ text: `Enquete criada por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
      
      // Adiciona as opções ao embed
      if (options.length > 0) {
        const description = options.map((option, index) => `${reactions[index]} ${option}`).join('\n\n');
        pollEmbed.setDescription(description);
      }
      
      // Prepara o conteúdo da mensagem (menção @everyone se solicitado)
      const messageContent = mentionEveryone ? '@everyone' : '';
      
      // Envia a enquete para o canal especificado
      const pollMessage = await channel.send({ content: messageContent, embeds: [pollEmbed] });
      
      // Adiciona as reações à mensagem
      for (const reaction of reactions) {
        await pollMessage.react(reaction);
      }
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Enquete Criada')
        .setDescription(`Sua enquete foi criada com sucesso no canal ${channel}.`)
        .setTimestamp();
      
      // Responde à interação
      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
      
    } catch (error) {
      // Trata erros inesperados
      console.error(`Erro ao criar enquete:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao tentar criar a enquete.`)
        .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
