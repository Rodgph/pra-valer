# 🧠 Social OS — O Guia Definitivo de Arquitetura e Engenharia

Este documento é o mapa mestre do sistema. Ele registra a evolução técnica, os pilares da arquitetura e a **crônica de batalhas** contra as limitações do sistema operacional.

---

## 🏗️ 1. O Motor de DNA Visual (Rust + Win32 API)
O Social OS subverte o **DWM (Desktop Window Manager)** para forçar uma estética brutalista e translúcida.

- **Aggressive Borderless:** Usamos `DWMWA_BORDER_COLOR` e `DWMWA_CAPTION_COLOR` como `0xFFFFFFFE` para eliminar halos de foco e linhas de título nativas.
- **Brutalismo Geométrico:** Forçamos `DWMWCP_DONOTROUND`. O Social OS ignora a tendência de cantos arredondados em favor de linhas retas e vivas.
- **Mica/Acrylic Persistente (O Hack do WNDPROC):** Interceptamos a mensagem `WM_NCACTIVATE` e mentimos para o kernel, retornando sempre `WPARAM(1)` (Ativo).

---

## 🪟 2. Arquitetura de Múltiplas Janelas (The Quad-Core UI)
O Social OS é um ecossistema de janelas sincronizadas:
1.  **Main (`main`):** O núcleo da interface e do Layout Engine.
2.  **Teste (`test_dna`):** Janela para validação de módulos.
3.  **Handle (`handle_win`):** Alça de arraste stealth e fixa (150x20).
4.  **Context Menu (`context_menu`):** Janela sob demanda (on-click).

---

## 📐 3. Engine de Layout (Tiling Window Manager)
Implementamos um motor de janelas lado-a-lado inspirado em gerenciadores de janelas Linux (como i3 ou sway).

- **Árvore Recursiva:** O layout é uma estrutura de dados de árvore onde cada nó pode ser um `Split` (divisão H/V) ou um `Pane` (espaço para módulo).
- **Resizers Interativos:** Divisórias arrastáveis que permitem ajustar o `ratio` dos painéis em tempo real.
- **Persistência de Grid:** O estado do layout é salvo no LocalStorage, garantindo que o usuário retorne exatamente para sua configuração de divisões.

---

## ⚡ 4. Sincronia de Baixa Latência (Zero-Delay Sync)
- **Native Event Loop:** A alça segue a janela principal via loop de eventos nativo do Rust (`WindowEvent::Moved`).
- **Physical Coordinates:** Operamos com `PhysicalPosition` para ignorar escalas de DPI e garantir sincronia milimétrica no movimento entre Janela 1 e Janela 3.

---

## 📜 5. A Crônica de Desafios (Batalhas Superadas)

### ⚔️ A Batalha das Referências (Rust Borrowing)
- **Desafio:** Erros constantes de compilação `E0308` ao manipular múltiplas janelas.
- **Solução:** Refatoramos para usar referências explícitas (`&Window`) e extração correta via `.as_ref().window()`.

### ⚔️ O Fantasma do Windows 7 (Aero Fallback)
- **Desafio:** Desativar sombras causava retorno ao visual "Aero" legado.
- **Solução:** Mantivemos a política de renderização moderna, mas pintamos as bordas de transparente absoluta.

### ⚔️ O Conflito de Trilhos (Drag Conflict)
- **Desafio:** Tentar forçar um trilho invisível via Rust causava travamento no `startDragging` nativo.
- **Solução:** Consolidamos a alça como uma peça fixa de alta performance para o arraste global do app.

### ⚔️ O Bug de Escala (DPI Bug)
- **Desafio:** Menus apareciam deslocados em monitores de alta resolução.
- **Solução:** Rust captura a posição física do cursor diretamente via `GetCursorPos` da Win32 API.

---

## 💾 6. Orquestrador e Persistência de Longo Prazo
- **Zustand Brain:** Gerencia instâncias de módulos e o estado do Tiling Layout.
- **Disk Configs:** Salvamos `handle_side.txt` e `backdrop_type.txt` no diretório de configuração do usuário para persistir escolhas visuais e de interface além do LocalStorage.
- **Window State Plugin:** Salva e restaura a posição X/Y e tamanho de todas as janelas do ecossistema.

---
*Assinado: O Arquiteto do Sistema — Social OS Core Team*
