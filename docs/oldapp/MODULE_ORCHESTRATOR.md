# Social OS - Module Orchestrator

Este documento detalha o núcleo oficial de gerenciamento de módulos, responsável por controlar o registro, criação, ciclo de vida e estado das instâncias de módulos.

## 1. Objetivo
Atuar como um "gerenciador de processos" interno, mantendo o estado lógico dos módulos totalmente desacoplado da interface visual (UI) e do motor de layout.

## 2. Arquitetura
O sistema é composto por três pilares principais:
- **Registry (`registry.tsx`)**: Declaração centralizada de todos os módulos disponíveis no sistema, incluindo metadados como ícone, nome e se permite múltiplas instâncias.
- **Store (`store.ts`)**: Gerenciamento de estado global utilizando **Zustand** com middleware de persistência.
- **Types (`types.ts`)**: Definições rigorosas de interfaces para Módulos e Instâncias.

## 3. Modelo de Dados

### ModuleDefinition
Define as propriedades estáticas de um módulo:
- `id`: Identificador único.
- `component`: Componente React (suporta Lazy Loading).
- `allowMultiple`: Booleano que define se o sistema pode abrir várias cópias do mesmo módulo.
- `nav`: Configuração de visibilidade na barra de navegação global.

### ModuleInstance
Representa uma cópia ativa de um módulo na sessão atual:
- `instanceId`: Identificador único da instância (ex: `Clock-3j9f2k1`).
- `moduleId`: Referência ao ID do módulo original.
- `state`: Objeto de estado interno persistível.
- `layoutMeta`: Metadados abstratos de layout (posição, área, flags).

## 4. API de Controle (Actions)
Disponível através do hook `useOrchestrator()`:
- `openModule(moduleId, options)`: Cria uma nova instância. Se o módulo não permitir duplicatas e já estiver aberto, foca na instância existente.
- `closeModule(instanceId)`: Destrói a instância e limpa o estado.
- `toggleModule(moduleId)`: Abre ou fecha o módulo baseado no estado atual.
- `updateModuleState(instanceId, partial)`: Atualiza o estado lógico interno.
- `updateModuleLayout(instanceId, partial)`: Atualiza metadados de posicionamento.

## 5. Persistência
Toda a sessão (lista de módulos abertos, seus estados e metadados de layout) é serializada automaticamente como JSON no `localStorage` sob a chave `social-os-session`. A restauração ocorre instantaneamente no boot do aplicativo.

## 6. Independência de UI
O Orchestrator não renderiza nenhum componente e não acessa o DOM. Ele opera puramente através de transições de estado, permitindo que o Layout Engine e a NAV consumam esses dados para construir a interface visual correspondente.
