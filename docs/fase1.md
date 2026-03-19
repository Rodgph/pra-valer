# Fase 1: Motor de Interface e Navegação

Este documento detalha as tarefas necessárias para que o sistema de Navegação (NAV) e o Layout Engine estejam funcionais nesta nova arquitetura.

## 1. Engine de Layout (Tiling Window Manager)
- [ ] Criar o `LayoutProvider` para gerenciar a árvore recursiva de divisões.
- [ ] Implementar o componente `SplitPane` com suporte a redimensionamento em tempo real.
- [ ] Criar o `Pane` (Empty Pane) com menu de contexto nativo para adicionar módulos.
- [ ] Garantir a **Persistência de Layout** no LocalStorage.

## 2. Sistema NAV (Navigation System)
- [ ] Implementar a lógica de **Docking** (Encaixe nas bordas).
- [ ] Integrar o NAV com o `OrchestratorStore` para listar módulos abertos.
- [ ] Adicionar indicadores de status (CPU, RAM, Rede) consumindo dados do Rust.
- [ ] Criar controles de janela customizados dentro da barra (Fechar, Minimizar).

## 3. Módulos Iniciais (Base de Teste)
- [ ] **Relógio:** Módulo simples para testar o sistema de instâncias múltiplas.
- [ ] **Gerenciador de Janelas:** Módulo para listar e focar em qualquer janela aberta.

## 4. Refinamento da Handle (Alça de Arraste)
- [ ] Implementar o **Menu de Contexto Nativo** dentro da Handle (Janela 3).
- [ ] Adicionar um efeito visual de "pulsar" quando a janela principal ganha foco.
- [ ] Resolver a escala de DPI no Rust para o posicionamento da Handle em monitores 4K.

---
*Próxima Tarefa Imediata: Implementação do LayoutEngine recursivo no App.tsx.*
