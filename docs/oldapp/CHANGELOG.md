# Changelog - Sistema de Busca e Menus de Contexto

Este documento registra a implementação e os refinamentos do Spotlight e do Sistema de Menus de Contexto Global.

## 1. Spotlight (Busca Global)
- **Implementação**: Janela de busca acionada globalmente via `Ctrl+Alt+Space`.
- **Ciclo de Vida Otimizado**: A janela é criada dinamicamente no primeiro acionamento, garantindo um boot limpo e rápido da aplicação principal.
- **Integração**: Conectado ao `Module Orchestrator`, permitindo buscar e abrir qualquer módulo do sistema instantaneamente.
- **UX**: Foco automático no input e fechamento inteligente ao perder o foco ou pressionar `Esc`.

## 2. Sistema de Menu de Contexto (Multi-Window)
- **Arquitetura**: Migração para um sistema nativo onde cada menu é uma janela Tauri independente, permitindo que os menus ultrapassem os limites da janela principal.
- **Posicionamento Preciso**: Implementada lógica de cálculo usando `innerPosition` da janela pai somado às coordenadas do mouse escaladas pelo `devicePixelRatio` do monitor. Isso garante que o menu apareça exatamente na ponta do cursor em qualquer nível de zoom do Windows.
- **Submenus**: Suporte a submenus infinitos com posicionamento dinâmico à direita do item pai.
- **Comunicação Nativa**: Uso de eventos Tauri (`emit`/`listen`) para sincronizar ações entre janelas independentes.

## 3. Melhorias de Infraestrutura (Backend & Frontend)
- **Rust/Tauri**: Inicialização do plugin `global-shortcut` no backend e configuração de permissões avançadas de janela (`unminimize`, `set_focus`, etc).
- **Persistência de Efeitos**: Implementado "subclassing" de janela no Windows (Win32 API) para garantir que efeitos como Mica e Acrylic persistam mesmo quando a janela perde o foco.
- **TypeScript & Vite**: Refatoração de importações dinâmicas (`lazy`) para evitar avisos de build e otimizar o carregamento de módulos.
- **Estabilidade**: Adicionado tratamento de erros robusto na criação e destruição de janelas temporárias (como o `window-handle`).

## 4. Refinamentos de Interface e UX (Nova Versão)
- **Limpeza de UI**: Removido o título "SOCIAL OS" da barra de navegação e limpo o título das janelas em modo widget para um visual mais minimalista.
- **Shorcuts de Teclado**: 
  - Implementada a tecla `Delete` / `Backspace` para remover o módulo do painel sob o mouse.
  - Implementada a tecla `Delete` / `Backspace` para remover itens da barra de navegação (Nav) ao passar o mouse.
  - Se o painel já estiver vazio, pressionar `Delete` remove o painel inteiro (split), reorganizando o layout automaticamente.
- **Sistema de Arraste (Drag-and-Drop)**:
  - Implementado `DragProvider` para gerenciar o estado global de arraste de módulos.
  - Suporte para deletar o módulo de origem durante o arraste pressionando `Delete`.
  - Adicionado "Drag Ghost" visual que acompanha o mouse durante o arraste de módulos.
- **Correções de Janela**: Alterada a configuração `alwaysOnTop` da janela principal para `false` no `tauri.conf.json` para evitar sobreposição indesejada sobre outras aplicações do sistema.
- **Menu de Contexto de Painel**: Refatorado o menu de contexto dos painéis vazios para facilitar a adição de qualquer módulo registrado e a remoção rápida do painel.

## 5. Módulos de Conteúdo e Persistência Avançada (Fase 2 - Início)
- **Novo Módulo: Marketplace**:
  - Central de personalização para Temas, Wallpapers e Widgets.
  - Interface baseada em grid com cards interativos e filtros por categoria.
- **Módulo: Favorite Games (Versão Evoluída)**:
  - **Customização de Glow**: 6 modos de animação de fundo (Pulse, Rotate, Spotlight, Glitch, Expand, RGB).
  - **Comportamentos de Ícone**: 5 modos de interação do poster (Estático, Parallax, Tilt 3D, Floating, Zoom).
  - **Spotlight Avançado**: Máscara radial dinâmica que segue o mouse iluminando a imagem de fundo.
  - **Tilt 3D**: Cálculo dinâmico de ângulo para inclinação do poster conforme a posição do cursor.
- **Refatoração do Sistema de Menus de Contexto (V3)**:
  - **Arquitetura Híbrida**: Transição de múltiplas janelas nativas para uma janela única com submenus via DOM (React).
  - **Performance**: Abertura instantânea e navegação em cascata sem latência de criação de janelas.
  - **Estabilidade**: Fim dos conflitos de foco e fechamentos acidentais durante a navegação em submenus.
  - **Redimensionamento Dinâmico**: Janela de menu invisível de 1200x800 para comportar qualquer profundidade de árvore.
- **Customização de Widgets (WidgetWrapper)**:
  - **Novo Menu Aparência**: Controle individual de cor de fundo (Deep Blue, Obsidian Purple, Crimson, etc).
  - **Controle de Opacidade**: Níveis selecionáveis (50% a 100%) com persistência por widget.
- **Núcleo Rust e Estabilidade**:
  - Refatoração do `lib.rs` para suporte a persistência de efeitos Mica/Acrylic independente por janela.
  - Implementação de proteção `isMounted` e debounces para zerar erros de terminal no log de dev.
