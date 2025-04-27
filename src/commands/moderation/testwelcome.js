// src/commands/utility/testwelcome.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../../utils/welcomeConfig');
const { createWelcomeImage } = require('../../utils/welcomeImage');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testwelcome')
    .setDescription('Testa o sistema de boas-vindas')
    .addUserOption(option => 
      option
        .setName('usuario')
        .setDescription('Usuário para testar (padrão: você mesmo)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      // Obtém o usuário alvo (ou o próprio usuário que executou o comando)
      const targetUser = interaction.options.getUser('usuario') || interaction.user;
      
      // Busca o membro do servidor
      const member = await interaction.guild.members.fetch(targetUser.id);
      if (!member) {
        return interaction.editReply('Não foi possível encontrar este membro no servidor.');
      }
      
      // Busca a configuração do servidor
      const config = getGuildConfig(interaction.guild.id);
      if (!config || !config.welcomeChannel) {
        return interaction.editReply('Canal de boas-vindas não configurado. Use `/setwelcome` primeiro.');
      }
      
      // Busca o canal configurado
      const welcomeChannel = interaction.guild.channels.cache.get(config.welcomeChannel);
      if (!welcomeChannel) {
        return interaction.editReply(`Canal de boas-vindas configurado (ID: ${config.welcomeChannel}) não encontrado. Reconfigure com \`/setwelcome\`.`);
      }
      
      // Cria a imagem de boas-vindas
      const image = await createWelcomeImage(member);
      
      // Cria o embed de boas-vindas
      const welcomeEmbed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setDescription(`${member} acabou de entrar no servidor!`)
        .setImage('attachment://welcome.png');
      
      // Envia a mensagem de boas-vindas
      await welcomeChannel.send({ embeds: [welcomeEmbed], files: [image] });
      
      // Responde ao comando
      await interaction.editReply(`✅ Mensagem de boas-vindas enviada para ${welcomeChannel} com sucesso!`);
    } catch (error) {
      console.error('Erro ao testar boas-vindas:', error);
      await interaction.editReply(`❌ Erro ao testar boas-vindas: ${error.message}`);
    }
  }
};
