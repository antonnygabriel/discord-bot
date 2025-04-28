const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

// Definição de cores e ícones para categorias
const categoryThemes = {
  utility: { color: '#4287f5', emoji: '🔧' },
  moderation: { color: '#ff5555', emoji: '🛡️' },
  fun: { color: '#ff9966', emoji: '🎮' },
  music: { color: '#9b59b6', emoji: '🎵' },
  economy: { color: '#2ecc71', emoji: '💰' },
  info: { color: '#3498db', emoji: '📊' },
  // Adicione mais categorias conforme necessário
};

// Fallback para categorias não definidas
const defaultTheme = { color: '#0099FF', emoji: '📁' };

// Obter configurações do .env
const BOT_NAME = process.env.BOT_NAME || 'Discord Bot';
const DEFAULT_COLOR = process.env.DEFAULT_COLOR || '#0099FF';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Veja todos os comandos do bot organizados por categoria')
    .addStringOption(option =>
      option
        .setName('categoria')
        .setDescription('Filtrar por categoria')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addBooleanOption(option =>
      option
        .setName('detalhes')
        .setDescription('Mostrar descrição detalhada dos comandos')
        .setRequired(false)
    ),

  async autocomplete(interaction) {
    const commandsPath = path.join(__dirname, '..');
    const categories = fs.readdirSync(commandsPath)
      .filter(folder => fs.statSync(path.join(commandsPath, folder)).isDirectory());
    
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const filtered = categories.filter(category => category.toLowerCase().includes(focusedValue));
    await interaction.respond(
      filtered.map(choice => ({ name: capitalize(choice), value: choice }))
    );
  },
  
  async execute(client, interaction) {
    // Caminho base das pastas de comandos
    const commandsPath = path.join(__dirname, '..');
    const categories = fs.readdirSync(commandsPath).filter(folder =>
      fs.statSync(path.join(commandsPath, folder)).isDirectory()
    );
    
    // Opções fornecidas pelo usuário
    const selectedCategory = interaction.options.getString('categoria');
    const showDetails = interaction.options.getBoolean('detalhes') || false;
    
    let showCategories = categories;
    if (selectedCategory) {
      if (!categories.includes(selectedCategory)) {
        return interaction.reply({
          content: `❌ Categoria **"${selectedCategory}"** não encontrada.\nCategorias disponíveis: ${categories.map(c => `\`${c}\``).join(', ')}`,
          ephemeral: true
        });
      }
      showCategories = [selectedCategory];
    }
    
    // Determina a cor principal com base na categoria selecionada ou padrão
    const mainColor = selectedCategory 
      ? (categoryThemes[selectedCategory]?.color || defaultTheme.color)
      : DEFAULT_COLOR;
    
    // Cria o embed principal
    const embed = new EmbedBuilder()
      .setTitle(`${selectedCategory ? `${getCategoryEmoji(selectedCategory)} ` : '📖 '}Comandos${selectedCategory ? ` - ${capitalize(selectedCategory)}` : ' Disponíveis'}`)
      .setColor(mainColor)
      .setDescription(
        selectedCategory 
          ? `Mostrando os comandos da categoria **${capitalize(selectedCategory)}**.\n`
          : 'Selecione uma categoria específica para ver seus comandos detalhados.\n'
      )
      .setTimestamp()
      .setFooter({ 
        text: `${BOT_NAME} • ${showDetails ? 'Modo detalhado' : 'Visão geral'}`,
        iconURL: client.user.displayAvatarURL()
      });
      
    // Se não tiver categoria específica, mostre todas as categorias
    if (!selectedCategory) {
      embed.addFields({
        name: '📂 Categorias Disponíveis',
        value: categories.map(cat => {
          const emoji = getCategoryEmoji(cat);
          const commandCount = getCommandCount(path.join(commandsPath, cat));
          return `${emoji} **${capitalize(cat)}** - ${commandCount} comando${commandCount !== 1 ? 's' : ''}`;
        }).join('\n')
      });
      
      // Adiciona uma nota de uso
      embed.addFields({
        name: '💡 Como usar',
        value: '• Use `/help <categoria>` para ver comandos de uma categoria específica\n' +
               '• Use `/help <categoria> detalhes:true` para ver detalhes dos comandos'
      });
    } else {
      // Mostra comandos da categoria selecionada
      let totalCommands = 0;
      const categoryPath = path.join(commandsPath, selectedCategory);
      const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
      
      // Para muitos comandos, podemos mostrar por páginas
      if (commandFiles.length > 0) {
        if (showDetails) {
          // Modo detalhado: mostra cada comando com descrição completa
          for (const file of commandFiles) {
            const command = require(path.join(categoryPath, file));
            const name = command.data?.name || command.name || file.replace('.js', '');
            const description = command.data?.description || command.description || 'Sem descrição';
            
            // Obtém opções do comando, se existirem
            let options = '';
            if (command.data?.options && command.data.options.length > 0) {
              options = '\n**Opções:**\n' + command.data.options.map(opt => 
                `• \`${opt.name}\` - ${opt.description}${opt.required ? ' *(obrigatório)*' : ''}`
              ).join('\n');
            }
            
            embed.addFields({
              name: `/${name}`,
              value: `${description}${options}`,
              inline: false
            });
            
            totalCommands++;
          }
        } else {
          // Modo compacto: lista simples
          let commandList = '';
          for (const file of commandFiles) {
            const command = require(path.join(categoryPath, file));
            const name = command.data?.name || command.name || file.replace('.js', '');
            const description = command.data?.description || command.description || 'Sem descrição';
            const shortDesc = description.length > 60 ? description.substring(0, 57) + '...' : description;
            
            commandList += `**/${name}** - ${shortDesc}\n`;
            totalCommands++;
          }
          
          if (commandList) {
            embed.addFields({
              name: `Comandos (${totalCommands})`,
              value: commandList.length > 1024 ? commandList.slice(0, 1021) + '...' : commandList
            });
          }
        }
      }
      
      if (totalCommands === 0) {
        embed.addFields({
          name: '❌ Nenhum comando encontrado',
          value: 'Esta categoria não possui comandos disponíveis.'
        });
      }
    }
    
    // Criar botões para navegação entre categorias
    const row = new ActionRowBuilder();
    
    if (categories.length > 1) {
      // Se tiver categoria selecionada, mostra botão para voltar
      if (selectedCategory) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('help_all')
            .setLabel('Ver Todas Categorias')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('📋')
        );
      }
      
      // Se não tiver categoria ou tiver muitas, adiciona botões de navegação
      if (!selectedCategory || categories.length > 3) {
        // Adiciona até 4 categorias como botões rápidos
        const buttonsToShow = selectedCategory 
          ? categories.filter(c => c !== selectedCategory).slice(0, 4)
          : categories.slice(0, 4);
          
        for (const cat of buttonsToShow) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`help_${cat}`)
              .setLabel(capitalize(cat))
              .setStyle(ButtonStyle.Primary)
              .setEmoji(getCategoryEmoji(cat))
          );
        }
      }
    }
    
    // Responde com o embed e botões (se houver)
    if (row.components.length > 0) {
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    // Configurar o coletor de interações para os botões
    if (row.components.length > 0) {
      const filter = i => i.user.id === interaction.user.id && i.customId.startsWith('help_');
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });
      
      collector.on('collect', async i => {
        const categoryId = i.customId.replace('help_', '');
        
        // Se clicou no botão "Ver Todas Categorias"
        if (categoryId === 'all') {
          // Recria o comando sem categoria
          const helpCommand = require('./help.js');
          await i.update({ content: 'Carregando todas as categorias...' });
          await helpCommand.execute(client, interaction);
        } else {
          // Recria o comando com a categoria selecionada
          const helpCommand = require('./help.js');
          await i.update({ content: `Carregando categoria ${categoryId}...` });
          
          // Simula uma nova interação com a categoria selecionada
          interaction.options._hoistedOptions = [
            { name: 'categoria', type: 'STRING', value: categoryId }
          ];
          
          await helpCommand.execute(client, interaction);
        }
      });
      
      collector.on('end', collected => {
        // Desabilita os botões após o tempo expirar
        if (collected.size === 0) {
          row.components.forEach(button => button.setDisabled(true));
          interaction.editReply({ components: [row] }).catch(console.error);
        }
      });
    }
  }
};

// Função para obter o emoji da categoria
function getCategoryEmoji(category) {
  return categoryThemes[category]?.emoji || defaultTheme.emoji;
}

// Função para contar comandos em uma categoria
function getCommandCount(categoryPath) {
  return fs.readdirSync(categoryPath).filter(file => file.endsWith('.js')).length;
}

// Função utilitária para capitalizar a primeira letra
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}