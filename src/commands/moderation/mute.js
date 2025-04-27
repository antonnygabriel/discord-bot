// src/commands/admin/mute.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Silencia um usuário no servidor')
    .addUserOption(option => 
      option
        .setName('usuario')
        .setDescription('O usuário que será silenciado')
        .setRequired(true))
    .addStringOption(option => 
      option
        .setName('motivo')
        .setDescription('Motivo do silenciamento')
        .setRequired(false))
    .addIntegerOption(option => 
      option
        .setName('duracao')
        .setDescription('Duração do silenciamento em minutos (deixe em branco para indefinido)')
        .setRequired(false)
        .setMinValue(1))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ModerateMembers', 'ManageRoles'],
  botPermissions: ['ModerateMembers', 'ManageRoles'],
  
  async execute(client, interaction) {
    // Obtém o usuário alvo e o motivo
    const targetUser = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('motivo') || 'Nenhum motivo fornecido';
    const duration = interaction.options.getInteger('duracao');
    
    // Verifica permissões do usuário
    if (!await PermissionUtil.checkUserPermissions(interaction, this.userPermissions)) return;
    
    // Verifica permissões do bot
    if (!await PermissionUtil.checkBotPermissions(interaction, this.botPermissions)) return;
    
    try {
      // Obtém o membro do servidor
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      // Verifica se o membro existe no servidor
      if (!targetMember) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`O usuário ${targetUser.tag} não está no servidor.`)
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Verifica hierarquia entre o executor e o alvo
      if (!PermissionUtil.checkHierarchy(interaction.member, targetMember)) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`Você não pode silenciar ${targetUser.tag} pois ele possui um cargo superior ou igual ao seu.`)
          .setTimestamp();
        
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
      
      // Procura o cargo "Muted" no servidor
      let mutedRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');
      
      // Se o cargo não existir, tenta criar um novo
      if (!mutedRole) {
        try {
          // Cria um novo cargo "Muted"
          mutedRole = await interaction.guild.roles.create({
            name: 'Muted',
            color: '#808080',
            reason: 'Cargo criado para silenciar usuários'
          });
          
          // Configura as permissões do cargo em todos os canais
          await interaction.guild.channels.cache.forEach(async (channel) => {
            await channel.permissionOverwrites.create(mutedRole, {
              SendMessages: false,
              AddReactions: false,
              Connect: false,
              Speak: false
            });
          });
          
        } catch (error) {
          console.error('Erro ao criar cargo Muted:', error);
          
          const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Erro')
            .setDescription('Não foi possível criar o cargo Muted.')
            .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
            .setTimestamp();
          
          return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      }
      
      // Adiciona o cargo Muted ao usuário
      await targetMember.roles.add(mutedRole, `${interaction.user.tag}: ${reason}`);
      
      // Se tiver duração, configura o timeout
      if (duration) {
        // Configura um timeout para remover o cargo após a duração especificada
        setTimeout(async () => {
          try {
            // Verifica se o membro ainda está no servidor e tem o cargo
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (member && member.roles.cache.has(mutedRole.id)) {
              await member.roles.remove(mutedRole, 'Tempo de silenciamento expirado');
              
              // Notifica no canal de logs, se existir
              if (process.env.LOG_CHANNEL_ID) {
                try {
                  const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
                  
                  const logEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🔊 Silenciamento Expirado')
                    .setDescription(`O silenciamento de ${targetUser.tag} expirou.`)
                    .setTimestamp();
                  
                  await logChannel.send({ embeds: [logEmbed] });
                } catch (error) {
                  console.error('Erro ao enviar log de expiração de silenciamento:', error);
                }
              }
            }
          } catch (error) {
            console.error('Erro ao remover silenciamento automático:', error);
          }
        }, duration * 60 * 1000); // Converte minutos para milissegundos
      }
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔇 Usuário Silenciado')
        .setDescription(`${targetUser.tag} foi silenciado no servidor.`)
        .addFields(
          { name: 'Silenciado por', value: interaction.user.tag },
          { name: 'Motivo', value: reason }
        )
        .setTimestamp();
      
      // Adiciona o campo de duração, se especificado
      if (duration) {
        successEmbed.addFields({ name: 'Duração', value: `${duration} minutos` });
      } else {
        successEmbed.addFields({ name: 'Duração', value: 'Indefinida' });
      }
      
      // Responde à interação
      await interaction.reply({ embeds: [successEmbed] });
      
    } catch (error) {
      // Trata erros inesperados
      console.error(`Erro ao silenciar usuário:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro')
        .setDescription(`Ocorreu um erro ao tentar silenciar ${targetUser.tag}.`)
        .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
