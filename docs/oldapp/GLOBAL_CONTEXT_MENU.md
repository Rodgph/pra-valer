# Social OS - Global Context Menu System

Este documento detalha o sistema unificado de menus de contexto do Social OS.

## 1. Objetivo
Fornecer uma interface de menu de contexto inteligente, acessível globalmente, que suporte submenus, ícones, divisores e que possua algoritmos de posicionamento para nunca ultrapassar os limites da tela (viewport).

## 2. Arquitetura (Nova: Micro-Janelas Tauri)
O sistema migrou de uma renderização baseada em Portal para uma arquitetura de múltiplas janelas:
- **`ContextMenuProvider`**: Gerencia o disparador na janela principal e armazena as callbacks de ação.
- **`WebviewWindow ("context-menu")`**: Uma nova janela nativa é criada para cada menu aberto. Ela é frameless, transparente e possui o atributo `alwaysOnTop`.
- **`ContextMenuWindow`**: Componente leve renderizado na micro-janela que recebe os dados via eventos e retorna o ID do item clicado.

## 3. Posicionamento e Comportamento Nativo
- **Overlay Absoluto**: Como o menu é uma janela independente, ele pode ser renderizado fora dos limites da janela principal do Social OS.
- **Auto-Resize**: A micro-janela ajusta seu tamanho automaticamente baseada no conteúdo renderizado.
- **Auto-Close**: O menu fecha instantaneamente se o usuário clicar fora dele ou se a micro-janela perder o foco (`blur`).
- **Comunicação Cross-Window**: Utiliza os eventos `setup-context-menu` (envio) e `context-menu-click` (retorno) para sincronizar ações entre janelas.

## 4. Funcionalidades Globais
Independentemente de onde o menu é disparado, ele sempre inclui suporte para:
- **Criação de Módulos**: Integrado com o `moduleRegistry`, permitindo listar e adicionar qualquer módulo disponível.
- **Fechamento Automático**: O menu fecha ao clicar fora dele, ao redimensionar a janela, ao scrollar ou ao pressionar a tecla `ESC`.

## 5. Como Usar
Para abrir o menu em um componente:

```tsx
const { openMenu } = useContextMenu();

const handleContextMenu = (e) => {
  e.preventDefault();
  openMenu(e.clientX, e.clientY, [
    {
      title: "Minha Seção",
      items: [
        { id: "item1", label: "Ação", icon: "🚀", action: () => console.log("Click") },
        { id: "sep", divider: true },
        { id: "sub", label: "Submenu", submenu: [...] }
      ]
    }
  ]);
};
```

## 6. Integrações Realizadas
- **EmptyPane**: Substituído o menu local pelo sistema global para divisão de painéis e adição de módulos.
- **NAV Module**: Utiliza o menu global para configurações de posicionamento e ações de sistema.
- **Global Listener**: O `App.tsx` possui um listener global que garante que cliques em áreas vazias também ofereçam opções básicas de sistema.
