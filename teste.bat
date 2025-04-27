@echo off
echo Criando estrutura para o EmbedBuilder...

:: Criar diretórios
mkdir src\components\embedBuilder
mkdir src\components\embedBuilder\handlers
mkdir src\components\embedBuilder\utils
mkdir src\components\embedBuilder\views

:: Criar arquivos principais
echo // Ponto de entrada do builder > src\components\embedBuilder\index.js
echo // Gerenciador de sessões por usuário > src\components\embedBuilder\EmbedManager.js

:: Criar handlers
echo // Manipuladores para botões > src\components\embedBuilder\handlers\buttonHandlers.js
echo // Manipuladores para modais > src\components\embedBuilder\handlers\modalHandlers.js
echo // Manipuladores para select menus > src\components\embedBuilder\handlers\selectHandlers.js

:: Criar utils
echo // Gerenciador de webhooks > src\components\embedBuilder\utils\webhookManager.js
echo // Validador de embeds > src\components\embedBuilder\utils\embedValidator.js

:: Criar views
echo // View principal com botões > src\components\embedBuilder\views\mainView.js
echo // Gerenciador de campos > src\components\embedBuilder\views\fieldManager.js
echo // View de pré-visualização > src\components\embedBuilder\views\previewView.js

echo Estrutura criada com sucesso!
pause