# Fase 1: Motor de Interface e Navegação

Este documento detalha as tarefas necessárias para que o sistema de Navegação (NAV) e o Layout Engine estejam funcionais nesta nova arquitetura.

## 1. Engine de Layout (Tiling Window Manager)
- [x] Criar o `LayoutProvider` para gerenciar a árvore recursiva de divisões.
- [x] Implementar o componente `SplitPane` com suporte a redimensionamento em tempo real.
- [x] Criar o `Pane` (Empty Pane) com menu de contexto nativo para adicionar módulos.
- [x] Garantir a **Persistência de Layout** no LocalStorage.

## 2. Sistema NAV (Navigation System)
- [x] Implementar a lógica de **Docking** (Encaixe nas bordas).
- [x] Integrar o NAV com o `OrchestratorStore` para listar módulos abertos.
- [x] Adicionar indicadores de status (CPU, RAM, Rede) consumindo dados do Rust.
- [x] Criar controles de janela customizados dentro da barra (Fechar, Minimizar).

## 3. Módulos Iniciais (Base de Teste)
- [x] **Relógio:** Módulo simples para testar o sistema de instâncias múltiplas.
- [x] **Gerenciador de Janelas:** Módulo para listar e focar em qualquer janela aberta.

## 4. Refinamento da Handle (Alça de Arraste)
- [x] Implementar o **Menu de Contexto Nativo** dentro da Handle (Janela 3).
- [x] Adicionar um efeito visual de "pulsar" quando a janela principal ganha foco.
- [x] Resolver a escala de DPI no Rust para o posicionamento da Handle em monitores 4K.

---
*Status: FASE 1 CONCLUÍDA.*
