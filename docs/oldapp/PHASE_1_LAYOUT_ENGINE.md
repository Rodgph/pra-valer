# Social OS - Fase 1: Layout Engine

Este documento documenta a implementação da infraestrutura estrutural do Social OS, focada no sistema de layout dinâmico.

## 1. Objetivo Geral
Implementação de um sistema de layout dinâmico baseado em árvore recursiva que permite a divisão infinita da interface em painéis independentes.

## 2. Modelo de Dados (Layout Tree)
A estrutura foi implementada em TypeScript (`src/layout/types.ts`) seguindo o modelo recursivo:

- **SplitNode**: Define divisões no espaço.
    - `type`: "split"
    - `direction`: "horizontal" | "vertical"
    - `ratio`: Proporção da divisão (0.05 a 0.95)
    - `first`: LayoutNode (filho 1)
    - `second`: LayoutNode (filho 2)
- **PaneNode**: Área final para módulos.
    - `type`: "pane"
    - `moduleId`: ID do módulo (ou `null` para vazio)
    - `id`: Identificador único para manipulação de estado.

## 3. Arquitetura do Motor de Layout
- **LayoutEngine**: Componente raiz que consome o estado global e inicia a renderização recursiva.
- **NodeRenderer**: Lógica recursiva que decide entre renderizar um `SplitPane` ou um `Pane`.
- **Estado Global**: Gerenciado via `LayoutProvider` (React Context + useReducer), garantindo que a árvore seja a única fonte de verdade para a UI.

## 4. Componentes de Interface
### Split Pane & Resize Handle
- Divisões baseadas em Flexbox.
- **ResizeHandle**: Barra interativa que permite ajustar o `ratio` em tempo real (funcionalidade estendida além do requisito base).
- Suporte a direções `horizontal` (col-resize) e `vertical` (row-resize).

### Pane (Empty Pane)
- Área neutra e centralizada para painéis sem módulos.
- Exibe a mensagem: *"Clique com o botão direito para adicionar módulo"*.
- Estilização com bordas tracejadas e fundo sutil para identificação visual.

### Context Menu
- Suporte a clique com botão direito em painéis vazios.
- Opções implementadas:
    - Adicionar módulo (Chat, Arquivos, Placeholder).
    - Dividir horizontalmente.
    - Dividir verticalmente.
- **Nota**: As ações já estão funcionais, atualizando a árvore de layout e persistindo as mudanças.

## 5. Regras Arquiteturais Seguidas
- **Zero React Router**: Toda a navegação e estrutura é baseada em estado.
- **Serialização**: Toda a árvore de layout é serializável em JSON.
- **Persistência**: Integração com `localStorage` sob a chave `user_settings.saved_layouts`.
- **Pureza**: Componentes focados apenas em renderizar a estrutura da árvore, sem acoplamento com a lógica interna dos módulos.

## 6. Próximos Passos (Fase 2)
- Implementação de Drag-and-Drop de módulos.
- Sistema de registro e carregamento dinâmico de módulos reais.
- Refinamento das animações de redimensionamento.
