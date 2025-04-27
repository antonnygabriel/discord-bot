// src/commands/utility/userinfo.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfos')
    .setDescription('Mostra informações detalhadas sobre um usuário')
    .addUserOption(option => 
      option
        .setName('usuario')
        .setDescription('O usuário para exibir informações (padrão: você mesmo)')
        .setRequired(false)),
  
  cooldown: 5,
  category: 'utility',
  
  async execute(client, interaction) {
    try {
      // Obtém o usuário alvo (ou o próprio usuário que executou o comando)
      const targetUser = interaction.options.getUser('usuario') || interaction.user;
      
      // Adia a resposta para ter tempo de coletar todas as informações
      await interaction.deferReply();
      
      // Busca informações completas do usuário
      const fetchedUser = await client.users.fetch(targetUser.id, { force: true })
        .catch(() => targetUser);
      
      // Tenta obter o membro do servidor
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      // Formata as datas
      const createdAt = `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`;
      const createdRelative = `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`;
      
      // Cria o embed base com informações do usuário
      const userEmbed = new EmbedBuilder()
        .setColor(member ? member.displayHexColor : '#0099FF')
        .setTitle(`Informações do Usuário: ${targetUser.tag}${targetUser.bot ? ' 🤖' : ''}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
        .addFields(
          { name: '📋 Informações da Conta', value: 
            `**ID:** \`${targetUser.id}\`\n` +
            `**Tag:** ${targetUser.tag}\n` +
            `**Criado em:** ${createdAt}\n` +
            `**Criado há:** ${createdRelative}`
          }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp();
      
      // Adiciona informações do membro, se estiver no servidor
      if (member) {
        const joinedAt = `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`;
        const joinedRelative = `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`;
        
        // Obtém os cargos do membro (excluindo @everyone)
        const roles = member.roles.cache
          .filter(role => role.id !== interaction.guild.id)
          .sort((a, b) => b.position - a.position);
        
        const roleList = roles.size 
          ? roles.map(role => `<@&${role.id}>`).join(', ')
          : 'Nenhum cargo';
        
        // Verifica permissões importantes
        const permissions = [];
        if (member.permissions.has(PermissionFlagsBits.Administrator)) permissions.push('Administrador');
        if (member.permissions.has(PermissionFlagsBits.ManageGuild)) permissions.push('Gerenciar Servidor');
        if (member.permissions.has(PermissionFlagsBits.BanMembers)) permissions.push('Banir Membros');
        if (member.permissions.has(PermissionFlagsBits.KickMembers)) permissions.push('Expulsar Membros');
        if (member.permissions.has(PermissionFlagsBits.ManageChannels)) permissions.push('Gerenciar Canais');
        if (member.permissions.has(PermissionFlagsBits.ManageRoles)) permissions.push('Gerenciar Cargos');
        
        const permissionText = permissions.length > 0 
          ? permissions.join(', ')
          : 'Nenhuma permissão importante';
        
        // Adiciona as informações do membro ao embed
        userEmbed.addFields(
          { name: '🏷️ Apelido', value: member.nickname || 'Nenhum apelido' },
          { name: '📅 Entrou no servidor em', value: `${joinedAt}\n${joinedRelative}` },
          { name: '🔑 Permissões Importantes', value: permissionText },
          { name: `🔰 Cargos [${roles.size}]`, value: roleList }
        );
        
        // Adiciona informações de boost, se aplicável
        if (member.premiumSince) {
          const boostingSince = `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:F>`;
          const boostingRelative = `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>`;
          
          userEmbed.addFields({
            name: '🚀 Impulsionando desde',
            value: `${boostingSince}\n${boostingRelative}`
          });
        }
      } else {
        // Se o usuário não estiver no servidor
        userEmbed.addFields({
          name: '⚠️ Aviso',
          value: 'Este usuário não é um membro deste servidor.'
        });
      }
      
      // Adiciona o banner do usuário, se disponível
      if (fetchedUser.banner) {
        userEmbed.setImage(fetchedUser.bannerURL({ dynamic: true, size: 4096 }));
      }
      
      await interaction.editReply({ embeds: [userEmbed] });
    } catch (error) {
      console.error('Erro no comando userinfo:', error);
      await interaction.editReply({ 
        content: 'Ocorreu um erro ao buscar informações do usuário.', 
        ephemeral: true 
      });
    }
  }
};
