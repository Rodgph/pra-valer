# Social OS - Módulo NAV (Navigation System Module)

Este documento detalha a implementação do sistema de navegação global (NAV) do Social OS.

## 1. Objetivo
O NAV atua como a barra de sistema central, gerenciando o acesso a módulos, status do sistema, configurações e controles de janela. Ele foi implementado como um módulo independente que pode ser inserido em qualquer painel (Pane) do layout.

## 2. Estrutura Visual
A barra é dividida em três seções principais:

-   **ESQUERDA**: Contém o menu do sistema e itens favoritos/fixos (ex: Chat, Arquivos).
-   **CENTRO**: Área flexível exibindo o identificador "SOCIAL OS".
-   **DIREITA**: Indicadores de status (Conectividade, Sync), itens de ação rápida (Configurações) e controles de janela.

## 3. Gerenciamento de Dados
-   **Localização**: `src/modules/nav/`
-   **Estado Global**: Gerenciado via `NavProvider` com `useReducer`.
-   **Configuração**: Os itens não são hardcoded; seguem uma estrutura definida em `types.ts`:
    - `id`: string única.
    - `icon`: ReactNode (emoji/ícone).
    - `label`: Nome para tooltip.
    - `action`: Função disparada no clique.
    - `location`: "left" | "right".
    - `visible`: booleano.

## 4. Window Controls (Desktop)
Integração nativa com `@tauri-apps/api/window`:
-   **Minimizar**: `appWindow.minimize()`
-   **Maximizar/Restaurar**: `appWindow.toggleMaximize()`
-   **Fechar**: `appWindow.close()`

## 5. Menu de Contexto Avançado
Acessível via clique direito em qualquer área do NAV, dividido em seções:
-   **Módulos**: Ações para gerenciar módulos no layout.
-   **Layout**: Salvar, restaurar e resetar (limpa localStorage e recarrega).
-   **Janela**: Atalhos para controle de janela.
-   **Avançado**: Modo desenvolvedor e logs.

## 6. Integração Modular
O NAV foi registrado no `moduleRegistry` (`src/modules/registry.tsx`), permitindo que:
1.  Seja adicionado via menu de contexto de qualquer Pane vazio.
2.  Funcione de forma isolada e previsível dentro da árvore de layout.
3.  Utilize o `Suspense` para carregamento dinâmico (Lazy Loading).

## 8. Modos de Posicionamento Dinâmico
O NAV suporta múltiplos modos de exibição controlados via configuração:

- **Global Topo (Padrão)**: Barra horizontal fixa no topo da janela.
- **Global Inferior**: Barra horizontal fixa na base da janela.
- **Lateral Esquerda/Direita**: Barra vertical ocupando a altura total. O texto e os itens se adaptam para orientação vertical.
- **Flutuante**: Barra centralizada no topo com bordas arredondadas e sombra, sobrepondo o layout.
- **Módulo de Painel**: O NAV se comporta como um módulo comum, podendo ser inserido em qualquer `Pane` da árvore de layout.

### Adaptação Automática de Layout
O sistema (`App.tsx`) utiliza um container Flexbox dinâmico que recalcula o espaço disponível para o `LayoutEngine` automaticamente conforme a posição do NAV global.

## 9. System Dockable Module (Drag & Drop)
O NAV agora suporta manipulação direta via arraste (drag and drop), permitindo que o usuário reconfigure o layout do sistema visualmente.

### Mecânica de Arraste (Aprimorada)
- **Ativação**: Clique e arraste em qualquer área livre da barra (detectado via `.closest()`, ignorando botões e inputs).
- **Estabilidade**: O componente `NAV` é renderizado em um nó estável no `App.tsx`, prevenindo remontagens durante a troca entre modos global e flutuante.
- **Precisão**: Utiliza cálculo de offset relativo ao componente para evitar saltos (snapping) no início do movimento.
- **Persistência**: Coordenadas exatas `(x, y)` e o modo de posicionamento são salvos continuamente.

### Zonas de Encaixe (Docking Zones)
Durante o arraste, áreas reativas (Docking Zones) surgem nas bordas e no centro da tela:
- **TOPO**: Encaixa como barra global superior.
- **BASE**: Encaixa como barra global inferior.
- **ESQUERDA/DIREITA**: Encaixa como barras laterais.
- **CENTRO**: Converte para o modo **Flutuante** ou permite o encaixe como **Módulo de Painel** (se solto sobre o Layout Engine).

## 10. Windows Widget Mode (Detached)
O NAV suporta agora o modo de "Widget Destacado", transformando-se em uma janela nativa do Windows independente da janela principal.

### Como Destacar
- **Arrastar para Fora**: Ao arrastar a barra para além dos limites da janela principal, o sistema automaticamente cria uma nova janela Tauri frameless e transparente no local do cursor.
- **Menu de Contexto**: Opção "Destacar Widget" disponível no menu de posicionamento.

### Comportamento do Widget
- **Movimentação Nativa**: No modo widget, o arraste da barra utiliza a API nativa do SO (`startDragging`), permitindo mover a janela fluida e rapidamente.
- **Always on Top**: O widget permanece sempre sobreposto a outras janelas para acesso rápido.

### Como Re-encaixar
- **CTRL + Drop**: Para trazer o NAV de volta à janela principal, arraste o widget para dentro da área da janela principal e solte o mouse enquanto mantém a tecla **CTRL** pressionada. O widget será fechado e o NAV reaparecerá instantaneamente no modo flutuante dentro do app.

