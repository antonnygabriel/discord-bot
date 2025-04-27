// src/commands/owner/eval.js
/**
 * Comando Eval - Executa código JavaScript diretamente no bot
 * 
 * Este comando permite ao dono do bot executar código JavaScript arbitrário.
 * Implementa medidas de segurança para prevenir vazamento de informações sensíveis.
 * 
 * @module commands/owner/eval
 */

const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { inspect } = require('util');
const { isOwner, notOwnerEmbed, errorEmbed } = require('../../utils/ownerUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Executa código JavaScript (apenas owner)')
    .addStringOption(option => 
      option
        .setName('código')
        .setDescription('Código JavaScript a ser executado')
        .setRequired(true))
    .addBooleanOption(option =>
      option
        .setName('ephemeral')
        .setDescription('Tornar resposta visível apenas para você?')
        .setRequired(false)),
  
  cooldown: 5,
  category: 'owner',
  
  /**
   * Executa o comando eval
   * @param {Client} client - Cliente do Discord
   * @param {CommandInteraction} interaction - Interação do comando
   */
  async execute(client, interaction) {
    // Verifica se o usuário é um owner autorizado
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({ embeds: [notOwnerEmbed()], ephemeral: true });
    }
    
    const code = interaction.options.getString('código');
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;
    
    try {
      // Adia a resposta para ter tempo de processar
      await interaction.deferReply({ ephemeral });
      
      // Verifica se o código contém palavras-chave perigosas
      if (this.containsDangerousCode(code)) {
        const dangerEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('⚠️ Código Potencialmente Perigoso')
          .setDescription('O código contém palavras-chave que podem comprometer a segurança do bot.')
          .addFields({ name: 'Código Bloqueado', value: `\`\`\`js\n${code}\`\`\`` })
          .setTimestamp();
        
        return interaction.editReply({ embeds: [dangerEmbed] });
      }
      
      // Define um timeout para evitar loops infinitos
      const timeout = setTimeout(() => {
        throw new Error('Tempo de execução excedido (5 segundos). Possível loop infinito.');
      }, 5000);
      
      // Executa o código
      let evaled;
      try {
        // Executa o código em um contexto controlado
        evaled = await eval(`
          (async () => {
            ${code}
          })()
        `);
        clearTimeout(timeout);
      } catch (err) {
        clearTimeout(timeout);
        throw err;
      }
      
      // Formata a saída
      const output = this.formatOutput(evaled);
      
      // Verifica se a saída é muito longa
      if (output.length > 2000) {
        // Cria um arquivo com a saída completa
        const buffer = Buffer.from(output);
        const attachment = new AttachmentBuilder(buffer, { name: 'output.js' });
        
        const longOutputEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Código Executado')
          .setDescription('A saída é muito longa para ser exibida. Veja o arquivo anexado.')
          .addFields({ name: '📥 Entrada', value: `\`\`\`js\n${code.length > 1000 ? code.slice(0, 997) + '...' : code}\n\`\`\`` })
          .setTimestamp();
        
        return interaction.editReply({ embeds: [longOutputEmbed], files: [attachment] });
      }
      
      // Cria o embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Código Executado')
        .addFields(
          { name: '📥 Entrada', value: `\`\`\`js\n${code.length > 1000 ? code.slice(0, 997) + '...' : code}\n\`\`\`` },
          { name: '📤 Saída', value: `\`\`\`js\n${output}\n\`\`\`` }
        )
        .setFooter({ text: `Executado por ${interaction.user.tag}` })
        .setTimestamp();
      
      // Responde à interação
      await interaction.editReply({ embeds: [successEmbed] });
      
    } catch (error) {
      console.error(`[ERRO][Eval] Falha ao executar código:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro na Execução')
        .addFields(
          { name: '📥 Entrada', value: `\`\`\`js\n${code.length > 1000 ? code.slice(0, 997) + '...' : code}\n\`\`\`` },
          { name: '❌ Erro', value: `\`\`\`js\n${error.message}\n\`\`\`` }
        )
        .setFooter({ text: `Executado por ${interaction.user.tag}` })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
  
  /**
   * Verifica se o código contém palavras-chave perigosas
   * @param {string} code - Código a ser verificado
   * @returns {boolean} Se o código contém palavras-chave perigosas
   */
  containsDangerousCode(code) {
    const dangerousPatterns = [
      /process\.env/i,
      /client\.token/i,
      /config\.token/i,
      /token/i,
      /process\.exit/i,
      /rm -rf/i,
      /require\s*\(\s*['"]child_process['"]\s*\)/i,
      /exec\s*\(/i,
      /spawn\s*\(/i,
      /fs\s*\.\s*(?:write|unlink|rm|delete)/i,
      /require\s*\(\s*['"]fs['"]\s*\)/i,
      /client\.destroy\s*\(/i
    ];
    
    return dangerousPatterns.some(pattern => pattern.test(code));
  },
  
  /**
   * Formata a saída do eval para exibição segura
   * @param {any} output - Saída do eval
   * @returns {string} Saída formatada
   */
  formatOutput(output) {
    let formattedOutput;
    
    if (output instanceof Promise) {
      formattedOutput = 'Promise { ... }';
    } else {
      formattedOutput = typeof output !== 'string' 
        ? inspect(output, { depth: 1 }) 
        : output;
    }
    
    // Sanitiza a saída para remover possíveis tokens ou informações sensíveis
    formattedOutput = formattedOutput
      .replace(/[\w-]{24}\.[\w-]{6}\.[\w-]{27}/g, '[TOKEN REDACTED]')
      .replace(/[\w-]{24}\.[\w-]{6}\.[\w-]{38}/g, '[TOKEN REDACTED]')
      .replace(/process\.env\.[A-Z_]+/g, '[ENV REDACTED]')
      .replace(/config\.token/gi, '[TOKEN REDACTED]')
      .replace(/client\.token/gi, '[TOKEN REDACTED]');
    
    // Limita o tamanho da saída
    if (formattedOutput.length > 2000) {
      return formattedOutput;
    }
    
    return formattedOutput;
  }
};
