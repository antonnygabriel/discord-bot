// src/commands/admin/serverinfo.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const moment = require('moment');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Exibe informações gerais sobre o servidor'),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: [],
  botPermissions: ['SendMessages', 'EmbedLinks'],
  
  async execute(client, interaction) {
    try {
      // Adia a resposta para ter tempo de coletar todas as informações
      await interaction.deferReply();
      
      // Obtém o servidor
      const guild = interaction.guild;
      
      // Busca informações adicionais do servidor
      await guild.fetch();
      
      // Conta os canais por tipo
      const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
      const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
      const categoryChannels = guild.channels.cache.filter(c => c.type === 4).size;
      const announcementChannels = guild.channels.cache.filter(c => c.type === 5).size;
      const stageChannels = guild.channels.cache.filter(c => c.type === 13).size;
      const forumChannels = guild.channels.cache.filter(c => c.type === 15).size;
      
      // Conta os membros por status (aproximado, pois requer intent GUILD_PRESENCES)
      const totalMembers = guild.memberCount;
      const botCount = guild.members.cache.filter(member => member.user.bot).size;
      const humanCount = totalMembers - botCount;
      
      // Obtém informações de boost
      const boostLevel = guild.premiumTier;
      const boostCount = guild.premiumSubscriptionCount;
      
      // Formata a data de criação do servidor
      const createdAt = moment(guild.createdAt).format('DD/MM/YYYY HH:mm');
      const createdDaysAgo = moment().diff(guild.createdAt, 'days');
      
      // Obtém o dono do servidor
      const owner = await guild.fetchOwner();
      
      // Cria o embed com as informações
      const serverEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(`Informações do Servidor: ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: '📋 Informações Gerais', value: 
            `**ID:** ${guild.id}\n` +
            `**Dono:** ${owner.user.tag}\n` +
            `**Criado em:** ${createdAt} (${createdDaysAgo} dias atrás)\n` +
            `**Nível de Verificação:** ${getVerificationLevel(guild.verificationLevel)}\n` +
            `**Filtro de Conteúdo:** ${getContentFilterLevel(guild.explicitContentFilter)}`
          },
          { name: '👥 Membros', value: 
            `**Total:** ${totalMembers}\n` +
            `**Humanos:** ${humanCount}\n` +
            `**Bots:** ${botCount}`
          },
          { name: '💬 Canais', value: 
            `**Total:** ${guild.channels.cache.size}\n` +
            `**Texto:** ${textChannels}\n` +
            `**Voz:** ${voiceChannels}\n` +
            `**Anúncios:** ${announcementChannels}\n` +
            `**Palco:** ${stageChannels}\n` +
            `**Fórum:** ${forumChannels}\n` +
            `**Categorias:** ${categoryChannels}`
          },
          { name: '✨ Impulsos', value: 
            `**Nível:** ${getBoostLevel(boostLevel)}\n` +
            `**Quantidade:** ${boostCount} impulsos`
          },
          { name: '🏷️ Cargos', value: 
            `**Total:** ${guild.roles.cache.size - 1} (excluindo @everyone)`
          }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      // Adiciona o banner do servidor, se existir
      if (guild.banner) {
        serverEmbed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
      }
      
      // Responde à interação
      await interaction.editReply({ embeds: [serverEmbed] });
      
    } catch (error) {
      // Trata erros inesperados
      console.error(`Erro ao exibir informações do servidor:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao tentar exibir as informações do servidor.`)
        .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};

// Funções auxiliares para formatar informações
function getVerificationLevel(level) {
  const levels = {
    0: 'Nenhum',
    1: 'Baixo',
    2: 'Médio',
    3: 'Alto',
    4: 'Muito Alto'
  };
  return levels[level] || 'Desconhecido';
}

function getContentFilterLevel(level) {
  const levels = {
    0: 'Desativado',
    1: 'Membros sem cargo',
    2: 'Todos os membros'
  };
  return levels[level] || 'Desconhecido';
}

function getBoostLevel(level) {
  const levels = {
    0: 'Nenhum',
    1: 'Nível 1',
    2: 'Nível 2',
    3: 'Nível 3'
  };
  return levels[level] || 'Desconhecido';
}
