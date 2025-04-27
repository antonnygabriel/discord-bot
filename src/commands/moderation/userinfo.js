/**
 * Comando UserInfo - Exibe informações detalhadas sobre um usuário
 * 
 * Este comando fornece uma visão completa das informações de um usuário no servidor,
 * incluindo dados da conta, cargos, permissões, status de presença e atividades.
 * Implementa tratamento de erros robusto e formatação visual elegante.
 * 
 * @author SeniorDeveloper
 * @version 1.0.0
 */

const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    ActivityType 
  } = require('discord.js');
  const moment = require('moment');
  const { formatDuration } = require('../../utils/formatters');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('userinfo')
      .setDescription('Exibe informações detalhadas de um usuário')
      .addUserOption(option => 
        option
          .setName('usuario')
          .setDescription('O usuário para exibir informações (padrão: você mesmo)')
          .setRequired(false)),
    
    cooldown: 5,
    category: 'admin',
    userPermissions: [],
    botPermissions: ['SendMessages', 'EmbedLinks'],
    
    /**
     * Executa o comando userinfo
     * @param {Client} client - Cliente do Discord
     * @param {CommandInteraction} interaction - Interação do comando
     * @returns {Promise<void>}
     */
    async execute(client, interaction) {
      try {
        // Obtém o usuário alvo (ou o próprio usuário que executou o comando)
        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        
        // Adia a resposta para ter tempo de coletar todas as informações
        await interaction.deferReply();
        
        // Busca informações completas do usuário (para obter banner, flags, etc.)
        const fetchedUser = await client.users.fetch(targetUser.id, { force: true })
          .catch(err => {
            console.error(`Erro ao buscar informações completas do usuário ${targetUser.id}:`, err);
            return targetUser; // Fallback para o usuário básico se falhar
          });
        
        // Tenta obter o membro do servidor
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        // Constrói o embed com as informações coletadas
        const userEmbed = await this.buildUserEmbed(interaction, fetchedUser, member);
        
        // Responde à interação
        await interaction.editReply({ embeds: [userEmbed] });
        
      } catch (error) {
        console.error(`[ERRO][UserInfo] Falha ao processar comando:`, error);
        
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro ao processar comando')
          .setDescription('Ocorreu um erro ao tentar exibir as informações do usuário.')
          .addFields({ 
            name: 'Detalhes técnicos', 
            value: `\`\`\`${error.message}\`\`\`` 
          })
          .setTimestamp();
        
        // Tenta responder com o erro, dependendo do estado da interação
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [errorEmbed] }).catch(console.error);
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(console.error);
        }
      }
    },
    
    /**
     * Constrói o embed com informações do usuário
     * @param {CommandInteraction} interaction - Interação do comando
     * @param {User} user - Usuário alvo
     * @param {GuildMember|null} member - Membro do servidor (se disponível)
     * @returns {EmbedBuilder} Embed com informações do usuário
     */
    async buildUserEmbed(interaction, user, member) {
      // Formata as datas
      const createdAt = moment(user.createdAt);
      const createdAtFormatted = createdAt.format('DD/MM/YYYY HH:mm:ss');
      const accountAge = formatDuration(createdAt);
      
      // Obtém as badges do usuário
      const badges = this.getUserBadges(user);
      
      // Cria o embed base com informações do usuário
      const userEmbed = new EmbedBuilder()
        .setColor(member ? member.displayHexColor : '#0099FF')
        .setTitle(`Informações do Usuário: ${user.tag}${user.bot ? ' 🤖' : ''}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { 
            name: '📋 Informações da Conta',
            value: [
              `**ID:** \`${user.id}\``,
              `**Tag:** ${user.tag}`,
              `**Criado em:** ${createdAtFormatted}`,
              `**Idade da conta:** ${accountAge}`,
              badges.length ? `**Badges:** ${badges.join(' ')}` : ''
            ].filter(Boolean).join('\n')
          }
        )
        .setFooter({ 
          text: `Solicitado por ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();
      
      // Adiciona informações do membro, se estiver no servidor
      if (member) {
        await this.addMemberFields(userEmbed, member, interaction.guild);
        
        // Adiciona o banner do usuário, se disponível
        if (user.banner) {
          userEmbed.setImage(user.bannerURL({ dynamic: true, size: 4096 }));
        }
      } else {
        // Se o usuário não estiver no servidor
        userEmbed.addFields({
          name: '⚠️ Aviso',
          value: 'Este usuário não é um membro deste servidor.'
        });
      }
      
      return userEmbed;
    },
    
    /**
     * Adiciona campos relacionados ao membro do servidor ao embed
     * @param {EmbedBuilder} embed - Embed a ser modificado
     * @param {GuildMember} member - Membro do servidor
     * @param {Guild} guild - Servidor
     */
    async addMemberFields(embed, member, guild) {
      // Formata a data de entrada
      const joinedAt = moment(member.joinedAt);
      const joinedAtFormatted = joinedAt.format('DD/MM/YYYY HH:mm:ss');
      const serverAge = formatDuration(joinedAt);
      
      // Obtém os cargos do membro (excluindo @everyone)
      const roles = member.roles.cache
        .filter(role => role.id !== guild.id)
        .sort((a, b) => b.position - a.position);
      
      // Formata a lista de cargos
      let roleList = 'Nenhum cargo';
      if (roles.size > 0) {
        const roleString = roles.map(role => `<@&${role.id}>`).join(', ');
        roleList = roleString.length > 1024 
          ? roleString.substring(0, 1020) + '...' 
          : roleString;
      }
      
      // Determina o status de presença
      const presenceInfo = this.getPresenceInfo(member);
      
      // Verifica permissões importantes
      const permissionInfo = this.getPermissionInfo(member, guild);
      
      // Adiciona as informações do membro ao embed
      embed.addFields(
        { 
          name: '🏷️ Informações no Servidor',
          value: [
            `**Apelido:** ${member.nickname || 'Nenhum'}`,
            `**Entrou em:** ${joinedAtFormatted}`,
            `**Membro há:** ${serverAge}`,
            `**Cargo principal:** ${roles.size > 0 ? roles.first().toString() : 'Nenhum'}`,
            permissionInfo.isOwner ? '**Cargo:** 👑 Dono do Servidor' : ''
          ].filter(Boolean).join('\n')
        },
        { 
          name: `${presenceInfo.emoji} Status`,
          value: presenceInfo.text
        },
        { 
          name: '🔑 Permissões Importantes',
          value: permissionInfo.text
        },
        { 
          name: `🔰 Cargos [${roles.size}]`,
          value: roleList
        }
      );
      
      // Adiciona informações de boost, se aplicável
      if (member.premiumSince) {
        const boostingSince = moment(member.premiumSince);
        const boostingFormatted = boostingSince.format('DD/MM/YYYY HH:mm:ss');
        const boostingDuration = formatDuration(boostingSince);
        
        embed.addFields({
          name: '🚀 Impulso do Servidor',
          value: `Impulsionando desde ${boostingFormatted} (${boostingDuration})`
        });
      }
      
      // Adiciona informações de atividade, se disponível
      this.addActivityField(embed, member);
    },
    
    /**
     * Obtém as badges do usuário
     * @param {User} user - Usuário
     * @returns {Array<string>} Array de emojis representando as badges
     */
    getUserBadges(user) {
      const badges = [];
      const flags = user.flags ? user.flags.toArray() : [];
      
      // Mapeia as flags para emojis
      if (flags.includes('Staff')) badges.push('👨‍💼');
      if (flags.includes('Partner')) badges.push('🤝');
      if (flags.includes('CertifiedModerator')) badges.push('🛡️');
      if (flags.includes('Hypesquad')) badges.push('🏠');
      if (flags.includes('HypeSquadOnlineHouse1')) badges.push('🏆'); // Bravery
      if (flags.includes('HypeSquadOnlineHouse2')) badges.push('🧠'); // Brilliance
      if (flags.includes('HypeSquadOnlineHouse3')) badges.push('⚖️'); // Balance
      if (flags.includes('BugHunterLevel1')) badges.push('🐛');
      if (flags.includes('BugHunterLevel2')) badges.push('🐞');
      if (flags.includes('VerifiedDeveloper')) badges.push('👨‍💻');
      if (flags.includes('VerifiedBot')) badges.push('✅');
      if (flags.includes('EarlySupporter')) badges.push('❤️');
      if (flags.includes('PremiumEarlySupporter')) badges.push('💎');
      if (flags.includes('Nitro')) badges.push('🚀');
      
      return badges;
    },
    
    /**
     * Obtém informações de presença do membro
     * @param {GuildMember} member - Membro do servidor
     * @returns {Object} Objeto com emoji e texto da presença
     */
    getPresenceInfo(member) {
      let status = 'Offline';
      let emoji = '⚫';
      let statusText = 'Não disponível';
      
      if (member.presence) {
        switch (member.presence.status) {
          case 'online':
            status = 'Online';
            emoji = '🟢';
            break;
          case 'idle':
            status = 'Ausente';
            emoji = '🟡';
            break;
          case 'dnd':
            status = 'Não Perturbe';
            emoji = '🔴';
            break;
          case 'invisible':
            status = 'Invisível';
            emoji = '⚪';
            break;
        }
        
        statusText = `${status}`;
        
        // Adiciona informações do cliente
        if (member.presence.clientStatus) {
          const clients = [];
          if (member.presence.clientStatus.desktop) clients.push('💻 Desktop');
          if (member.presence.clientStatus.mobile) clients.push('📱 Mobile');
          if (member.presence.clientStatus.web) clients.push('🌐 Web');
          
          if (clients.length > 0) {
            statusText += `\nDispositivos: ${clients.join(', ')}`;
          }
        }
      }
      
      return { emoji, text: statusText };
    },
    
    /**
     * Obtém informações de permissões do membro
     * @param {GuildMember} member - Membro do servidor
     * @param {Guild} guild - Servidor
     * @returns {Object} Objeto com informações de permissões
     */
    getPermissionInfo(member, guild) {
      const isOwner = guild.ownerId === member.id;
      const permissions = member.permissions;
      const keyPermissions = [];
      
      // Verifica permissões importantes
      if (permissions.has(PermissionFlagsBits.Administrator)) keyPermissions.push('👑 Administrador');
      if (permissions.has(PermissionFlagsBits.ManageGuild)) keyPermissions.push('🏠 Gerenciar Servidor');
      if (permissions.has(PermissionFlagsBits.BanMembers)) keyPermissions.push('🔨 Banir Membros');
      if (permissions.has(PermissionFlagsBits.KickMembers)) keyPermissions.push('👢 Expulsar Membros');
      if (permissions.has(PermissionFlagsBits.ManageChannels)) keyPermissions.push('📝 Gerenciar Canais');
      if (permissions.has(PermissionFlagsBits.ManageRoles)) keyPermissions.push('🔰 Gerenciar Cargos');
      if (permissions.has(PermissionFlagsBits.ManageMessages)) keyPermissions.push('✉️ Gerenciar Mensagens');
      if (permissions.has(PermissionFlagsBits.MentionEveryone)) keyPermissions.push('📢 Mencionar @everyone');
      if (permissions.has(PermissionFlagsBits.ManageWebhooks)) keyPermissions.push('🔌 Gerenciar Webhooks');
      if (permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) keyPermissions.push('😀 Gerenciar Emojis');
      
      // Texto de permissões
      let permissionText = isOwner 
        ? '👑 Dono do Servidor (todas as permissões)' 
        : keyPermissions.length > 0 
          ? keyPermissions.join('\n')
          : 'Nenhuma permissão administrativa';
      
      return { isOwner, text: permissionText };
    },
    
    /**
     * Adiciona campo de atividade ao embed, se disponível
     * @param {EmbedBuilder} embed - Embed a ser modificado
     * @param {GuildMember} member - Membro do servidor
     */
    addActivityField(embed, member) {
      if (!member.presence || !member.presence.activities || member.presence.activities.length === 0) {
        return;
      }
      
      // Processa cada atividade
      member.presence.activities.forEach(activity => {
        if (activity.type === ActivityType.Custom) {
          // Status personalizado
          let statusText = '';
          if (activity.emoji) {
            statusText += `${activity.emoji.name} `;
          }
          if (activity.state) {
            statusText += activity.state;
          }
          
          if (statusText.trim()) {
            embed.addFields({
              name: '💭 Status Personalizado',
              value: statusText
            });
          }
        } else {
          // Outras atividades (jogando, transmitindo, etc.)
          let activityType = '';
          switch (activity.type) {
            case ActivityType.Playing:
              activityType = '🎮 Jogando';
              break;
            case ActivityType.Streaming:
              activityType = '📺 Transmitindo';
              break;
            case ActivityType.Listening:
              activityType = '🎵 Ouvindo';
              break;
            case ActivityType.Watching:
              activityType = '👀 Assistindo';
              break;
            case ActivityType.Competing:
              activityType = '🏆 Competindo em';
              break;
          }
          
          let activityText = `${activity.name}`;
          
          // Adiciona detalhes da atividade, se disponíveis
          const details = [];
          if (activity.details) details.push(activity.details);
          if (activity.state) details.push(activity.state);
          
          if (details.length > 0) {
            activityText += `\n${details.join('\n')}`;
          }
          
          // Adiciona tempo de atividade, se disponível
          if (activity.timestamps && activity.timestamps.start) {
            const startTime = moment(activity.timestamps.start);
            const duration = formatDuration(startTime);
            activityText += `\nDuração: ${duration}`;
          }
          
          embed.addFields({
            name: activityType,
            value: activityText
          });
        }
      });
    }
  };
  