// src/commands/utility/serverinfo.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinformation')
    .setDescription('Mostra informações detalhadas sobre o servidor'),
  
  cooldown: 10,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Adia a resposta para ter tempo de coletar os dados
      await interaction.deferReply();
      
      const guild = interaction.guild;
      
      // Busca informações completas do servidor
      await guild.fetch();
      
      // Conta os tipos de canais
      const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
      const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
      const categoryChannels = guild.channels.cache.filter(c => c.type === 4).size;
      
      // Conta os membros
      const totalMembers = guild.memberCount;
      const botCount = guild.members.cache.filter(member => member.user.bot).size;
      const humanCount = totalMembers - botCount;
      
      // Obtém informações de boost
      const boostLevel = guild.premiumTier;
      const boostCount = guild.premiumSubscriptionCount;
      
      // Formata a data de criação
      const createdAt = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;
      const createdRelative = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;
      
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
            `**Dono:** ${owner.user.tag} (${owner.id})\n` +
            `**Criado em:** ${createdAt}\n` +
            `**Criado há:** ${createdRelative}\n` +
            `**Nível de Verificação:** ${getVerificationLevel(guild.verificationLevel)}`
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
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      // Adiciona o banner do servidor, se existir
      if (guild.banner) {
        serverEmbed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
      }
      
      await interaction.editReply({ embeds: [serverEmbed] });
    } catch (error) {
      console.error('Erro no comando serverinfo:', error);
      await interaction.editReply({ 
        content: 'Ocorreu um erro ao buscar informações do servidor.', 
        ephemeral: true 
      });
    }
  }
};

// Funções auxiliares
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

function getBoostLevel(level) {
  const levels = {
    0: 'Nenhum',
    1: 'Nível 1',
    2: 'Nível 2',
    3: 'Nível 3'
  };
  return levels[level] || 'Desconhecido';
}
