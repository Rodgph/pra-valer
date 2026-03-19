# Módulo de Favorite Games

O módulo **FavoriteGames** é o componente central de gerenciamento e inicialização de jogos da aplicação. Ele integra profundamente com a **Steam**, oferecendo uma interface visual rica para organizar favoritos, acompanhar downloads em tempo real e compartilhar convites com outros usuários.

## 🚀 Funcionalidades

### 1. Grade de Favoritos Personalizável
- **Visualização:** Exibe jogos salvos em uma grade responsiva com pôsteres de alta qualidade.
- **Scroll Dinâmico:** Suporta modos de rolagem **Vertical** e **Horizontal**, ajustável nas configurações do módulo.
- **Feedback Visual:** Interações de hover com efeitos de escala, brilho e exibição de botões de ação rápida (compartilhar e remover).

### 2. Integração com Steam
- **Sincronização de Biblioteca:** Permite importar jogos diretamente da conta Steam via API ou varredura local.
- **Perfil do Usuário:** Exibe o avatar e nome da conta Steam conectada em um badge no topo.
- **API de Imagens (Posters):** 
    - **Resolução Nativa:** Busca posters no formato **600x900 (2x)** para alta densidade de pixels (`library_600x900_2x.jpg`).
    - **Sistema de Fallback:** Se o poster vertical falhar, o sistema tenta carregar o `header.jpg` (600x215) automaticamente.
    - **Cache Inteligente:** O backend está preparado para baixar e servir imagens localmente, reduzindo o consumo de banda.
- **Gerenciamento:** Opções para instalar/desinstalar jogos Steam diretamente pelo menu de contexto utilizando o protocolo `steam://`.

### 3. Monitoramento de Downloads
- **Overlay de Progresso:** Interface sobreposta nos cards dos jogos que estão sendo baixados na Steam.
- **Métricas:** Exibe progresso percentual, velocidade de download (MB/s) e uma barra de progresso animada.
- **Polling Dinâmico:** O sistema consulta o estado do disco e manifestos `.acf` a cada 2 segundos para precisão total.
- **Controles:** Botões rápidos para retomar download ou abrir o gerenciador da Steam.

### 4. Sistema de Drag & Drop
- **Adição Rápida:** Suporta o drop de arquivos `.exe`, `.lnk` ou `.url` do Windows para fixar novos jogos.
- **Social Drag:** Jogos podem ser arrastados para iniciar um compartilhamento visual.

### 5. Compartilhamento e Social
- **Convites:** Menu de contexto que lista conversas recentes do chat para envio rápido de "Game Invites".
- **Integração de Chat:** Envia metadados do jogo (ID, nome, imagem) como mensagens estruturadas no sistema de chat.

## 🛠️ Detalhes Técnicos

### Componentes Principais
- `FavoriteGamesModule.tsx`: Container principal que gerencia o estado da biblioteca, downloads e eventos de drag.
- `GamePoster`: Sub-componente responsável pelo tratamento de imagens e fallback de ícones.
- `LibraryOverlay`: Interface de navegação para selecionar jogos da biblioteca Steam completa para "pinar" nos favoritos.

### Stores Relacionados
- `useGamesStore`: Persistência da lista de jogos e configurações de layout.
- `useDragStore`: Estado global de arrastamento de convites.
- `useChatStore`: Integração com as conversas para a funcionalidade de compartilhar.

### Comandos Tauri (Backend Rust)
- `get_steam_download_info`: Recupera status do download ativo no cliente Steam.
- `get_steam_user_profile`: Obtém dados da conta logada.
- `launch_game`: Executa o jogo através do caminho local ou protocolo `steam://`.
- `download_game_image`: Faz o download e armazena capas de jogos localmente.
