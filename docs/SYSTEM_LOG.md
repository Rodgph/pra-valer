# 🧠 Social OS — O Guia Definitivo de Arquitetura e Engenharia

Este documento é o mapa mestre do sistema. Ele registra a evolução técnica, os pilares da arquitetura e a **crônica de batalhas** contra as limitações do sistema operacional.

---

## 🏗️ 1. O Motor de DNA Visual (Rust + Win32 API)
O Social OS subverte o **DWM (Desktop Window Manager)** para forçar uma estética brutalista e translúcida.

- **Aggressive Borderless:** Usamos `DWMWA_BORDER_COLOR` e `DWMWA_CAPTION_COLOR` como `0xFFFFFFFE` para eliminar halos de foco e linhas de título nativas.
- **Brutalismo Geométrico:** Forçamos `DWMWCP_DONOTROUND`. O Social OS ignora a tendência de cantos arredondados em favor de linhas retas e vivas.
- **Mica/Acrylic Persistente (O Hack do WNDPROC):** 
    - **O Problema:** O Windows desativa transparências em janelas inativas.
    - **A Solução:** Implementamos "Subclassing" de janela. Interceptamos a mensagem `WM_NCACTIVATE` e mentimos para o kernel, retornando sempre `WPARAM(1)` (Ativo).

---

## 🪟 2. Arquitetura de Múltiplas Janelas (The Quad-Core UI)
O Social OS é um ecossistema de janelas sincronizadas:
1.  **Main (`main`):** O núcleo da interface.
2.  **Teste (`test_dna`):** Janela para validação de módulos.
3.  **Handle (`handle_win`):** Alça de arraste stealth e fixa.
4.  **Context Menu (`context_menu`):** Janela sob demanda (on-click).

---

## ⚡ 3. Sincronia de Baixa Latência (Zero-Delay Sync)
- **Native Event Loop:** A alça segue a janela principal via loop de eventos nativo do Rust (`WindowEvent::Moved`).
- **Physical Coordinates:** Operamos com `PhysicalPosition` para ignorar escalas de DPI e garantir que a alça se mova no mesmo milissegundo que o app, sem tremor (jitter).

---

## 🧭 4. O Sistema de Alça Dinâmica (Stealth Handle)
- **Arraste Remoto:** O comando `start_drag_main` delega o movimento da janela principal ao kernel a partir de um clique na janela da alça.
- **Trilhos Dinâmicos:** A alça pode ser ancorada em 4 posições (Topo, Base, Esquerda, Direita) com ajuste automático de orientação (150x20 vs 20x150).

---

## 📜 5. A Crônica de Desafios (Batalhas Superadas)

Nesta jornada, enfrentamos problemas complexos que exigiram soluções criativas:

### ⚔️ A Batalha das Referências (Rust Borrowing)
- **Desafio:** Erros constantes de compilação `E0308` ao tentar aplicar o DNA Visual em múltiplas janelas.
- **Causa:** Estávamos passando o objeto da janela por "valor", mas o Rust exige "referência" (`&Window`) para funções de manipulação.
- **Solução:** Refatoramos todas as chamadas para usar o operador de referência e garantimos a extração correta da Window interna a partir da WebviewWindow via `.as_ref().window()`.

### ⚔️ A Insegurança do Kernel (SetPropW Safety)
- **Desafio:** Erro `E0133` (Call to unsafe function).
- **Causa:** O uso de `SetPropW` do Windows para marcar janelas (ex: `is_handle`) é uma operação de memória direta.
- **Solução:** Envolvemos as chamadas em blocos `unsafe` controlados e ajustamos a tipagem de dados para `Some(HANDLE)`, atendendo aos rigorosos padrões de segurança do Rust moderno.

### ⚔️ O Fantasma do Windows 7 (Aero Fallback)
- **Desafio:** Ao tentar remover sombras agressivamente, as janelas voltavam ao visual "Aero" do Windows 7.
- **Causa:** Desativar o `Non-Client Rendering` quebra a composição moderna do Windows 11.
- **Solução:** Mantivemos a política de renderização ativa, mas forçamos as cores das bordas e do título para transparência absoluta (`0xFFFFFFFE`).

### ⚔️ O Menu Invisível (Race Conditions)
- **Desafio:** O menu de contexto abria vazio ou travado na última posição.
- **Causa:** O React não detectava o tipo da janela rápido o suficiente via URL, e o Rust estava destruindo/criando janelas em loop.
- **Solução:** Mudamos a detecção para `appWindow.label` (instantânea) e transformamos o menu em uma janela persistente que apenas se move e se mostra, eliminando o custo de criação.

### ⚔️ O Erro de Escala (DPI Bug)
- **Desafio:** Em monitores 4K, a alça e o menu apareciam em lugares aleatórios.
- **Causa:** O JavaScript enviava coordenadas lógicas, mas o Windows trabalha com coordenadas físicas.
- **Solução:** Implementamos `GetCursorPos` diretamente no Rust. O menu agora nasce na ponta do mouse em nível de hardware, ignorando qualquer erro de escala do navegador.

---

## 🎼 6. Orquestrador e Persistência
- **Zustand Brain:** Estado global para gerenciar instâncias de módulos e foco.
- **Persistent Memory:** Salvamento manual de configurações (`handle_side.txt`, `backdrop_type.txt`) e uso do `window-state` para lembrar tamanhos e posições X/Y.

---
*Assinado: O Arquiteto do Sistema — Social OS Core Team*
