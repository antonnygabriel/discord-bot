// src/commands/admin/roleCreate.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const PermissionUtil = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolecreate')
    .setDescription('Gerencia cargos do servidor')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Cria um novo cargo')
        .addStringOption(option => 
          option
            .setName('nome')
            .setDescription('Nome do novo cargo')
            .setRequired(true))
        .addStringOption(option => 
          option
            .setName('cor')
            .setDescription('Cor do cargo em formato hexadecimal (ex: #FF0000)')
            .setRequired(false))
        .addBooleanOption(option => 
          option
            .setName('mostrar_separadamente')
            .setDescription('Mostrar membros separadamente na lista de membros')
            .setRequired(false))
        .addBooleanOption(option => 
          option
            .setName('mencionavel')
            .setDescription('Permitir que qualquer um mencione este cargo')
            .setRequired(false)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  // Cooldown em segundos
  cooldown: 5,
  
  // Permissões necessárias
  userPermissions: ['ManageRoles'],
  botPermissions: ['ManageRoles'],
  
  async execute(client, interaction) {
    // Verifica se é o subcomando 'create'
    if (interaction.options.getSubcommand() === 'create') {
      // Obtém os parâmetros do comando
      const name = interaction.options.getString('nome');
      const color = interaction.options.getString('cor') || '#99AAB5'; // Cor padrão do Discord
      const hoist = interaction.options.getBoolean('mostrar_separadamente') || false;
      const mentionable = interaction.options.getBoolean('mencionavel') || false;
      
      // Verifica permissões do usuário
      if (!await PermissionUtil.checkUserPermissions(interaction, this.userPermissions)) return;
      
      // Verifica permissões do bot
      if (!await PermissionUtil.checkBotPermissions(interaction, this.botPermissions)) return;
      
      try {
        // Valida a cor hexadecimal
        const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
        let validColor = '#99AAB5';
        
        if (colorRegex.test(color)) {
          validColor = color;
        } else {
          const warnEmbed = new EmbedBuilder()
            .setColor('#FFFF00')
            .setTitle('⚠️ Aviso')
            .setDescription('A cor fornecida não é um código hexadecimal válido. Usando a cor padrão (#99AAB5).')
            .setTimestamp();
          
          await interaction.reply({ embeds: [warnEmbed], ephemeral: true });
          return;
        }
        
        // Cria o novo cargo
        const newRole = await interaction.guild.roles.create({
          name: name,
          color: validColor,
          hoist: hoist,
          mentionable: mentionable,
          reason: `Cargo criado por ${interaction.user.tag}`
        });
        
        // Cria o embed de sucesso
        const successEmbed = new EmbedBuilder()
          .setColor(validColor)
          .setTitle('✅ Cargo Criado')
          .setDescription(`O cargo ${newRole} foi criado com sucesso.`)
          .addFields(
            { name: 'Nome', value: name },
            { name: 'Cor', value: validColor },
            { name: 'Mostrar separadamente', value: hoist ? 'Sim' : 'Não' },
            { name: 'Mencionável', value: mentionable ? 'Sim' : 'Não' }
          )
          .setTimestamp();
        
        // Responde à interação
        await interaction.reply({ embeds: [successEmbed] });
        
      } catch (error) {
        // Trata erros inesperados
        console.error(`Erro ao criar cargo:`, error);
        
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Erro')
          .setDescription(`Ocorreu um erro ao tentar criar o cargo ${name}.`)
          .addFields({ name: 'Detalhes', value: `\`\`\`${error.message}\`\`\`` })
          .setTimestamp();
        
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};
