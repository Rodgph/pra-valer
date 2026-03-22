# 🧠 Social OS — O Guia Definitivo de Arquitetura e Engenharia

Este documento é a autoridade máxima do Social OS. Ele unifica a visão do produto, o manifesto estético, o mapa técnico, o registro histórico de batalhas e a estratégia de infraestrutura Git.

> **Protocolo de Auto-Instrução (Para a Próxima Instância de IA):**
> 1.  **Leia a Crônica de Desafios ANTES de codar:** O Social OS opera em um nível de manipulação de Win32 API que é frágil. Muitas soluções parecem "overkill", mas existem para contornar limitações específicas do Windows 11.
> 2.  **Documente o "Porquê", não apenas o "O quê":** Sempre que implementar algo fora do roteiro ou corrigir um bug que desafia a lógica comum, adicione uma entrada na Crônica de Desafios. Explique a falha técnica exata e o hack utilizado.
> 3.  **Respeite o DNA Visual:** Se uma sugestão de UI arredondar cantos ou usar cores padrão do sistema, ela está errada. O sistema deve ser reto, brutalista e agressivo.
> 4.  **Mantenha o Log Vivo:** Este arquivo é a memória de longo prazo do projeto. Sem ele, repetiremos erros de compilação de ponteiros brutos ou codificação de arquivos.

---

## 🏗️ 1. Visão e Showcase (Visual DNA)
O **Social OS** subverte as convenções do Windows 11 para entregar uma experiência **brutalista e de ultra-baixa latência**.

### ☢️ Os Mandamentos do DNA Visual (Inalienáveis)
- **Borda/Halo Zero Absoluto:** Atributo `DWMWA_BORDER_COLOR` é sempre `0xFFFFFFFE`. Nenhuma borda nativa ou simulada é permitida.
- **Cantos Vivos:** Atributo `DWMWA_WINDOW_CORNER_PREFERENCE` é sempre `DWMWCP_DONOTROUND`.
- **Mica Persistente:** Hack do `WNDPROC` que intercepta `WM_NCACTIVATE` para manter a transparência ativa mesmo sem foco.
- **Sincronia de Materiais:** Evento global `sync-effect` garante que todas as janelas (Main, Spotlight, Menus) usem o mesmo material (Mica/Acrylic) simultaneamente.

---

## 📐 2. Engine de Layout & Orquestração
- **Recursive Tiling:** Layout baseado em árvore binária (SplitNode vs PaneNode).
- **Orquestrador de Núcleo (Kernel):** Sistema de instâncias globais. Cada módulo é um "processo" rastreado por PID e vinculado a um `paneId`.
- **Janelas Flutuantes (Modo Overlay):** Suporte a instâncias independentes com `isFloating`. Gerenciamento de `zIndex` dinâmico e persistência de posição/tamanho via `localStorage`.
- **Kill-Link:** Ao encerrar um processo no Kernel Manager, o Layout Engine limpa o painel correspondente automaticamente via broadcast global.

---

## 🌐 3. Ecossistema de Navegação & Customização
- **Social Browser Pro:** Barra de ferramentas completa com Home (Google), Histórico (Voltar/Avançar) e Recarregar.
- **Interpretador de CSS Realtime:** Janela flutuante dedicada para injeção de CSS em qualquer domínio.
- **Auto-Styles Persistence:** O sistema detecta a mudança de domínio e reaplica automaticamente o CSS salvo para aquele site, garantindo que a personalidade visual (ex: transparência total) seja mantida mesmo após o reload.

---

## 🔍 4. Spotlight Search Pro (The Finder)
Invoque via `Ctrl + Shift + Space`.
- **Navegação de Elite:** Suporte completo a teclado (Setas ↑/↓, Enter para executar, Esc para cancelar).
- **Central de Comandos:** Suporte a comandos Power User começando com `/` (ex: `/google termo`, `/kill Relógio`, `/mica`, `/exit`).
- **Visual:** Animação de entrada `spotlight-in` (slide down + fade) e destaque verde brutalista no item selecionado.

---

## 📊 5. Telemetria e Monitoramento
- **Arquitetura Híbrida:** Backend Rust funde **DXGI**, **PDH** e **NVML** para monitoramento 100% confiável da RTX 3060.
- **Auto-Hide (Slide Over):** Barra de navegação com comportamento Windows-style. Ela vive fora da tela e desliza **por cima** do conteúdo ao encostar o mouse na borda correspondente, sem deslocar o layout.
- **System Monitor:** Módulo de alta performance que renderiza gráficos SVG em tempo real para CPU, GPU e VRAM com grid lines de precisão.

---

## 📜 6. A Crônica de Desafios (Batalhas Superadas)

### ⚔️ A Batalha da RTX 3060 (Zero-Stats Bug)
- **Falha:** Uso de GPU e VRAM apareciam como 0%. **Solução:** Implementamos NVML (Direct Driver Access) e PDH totalizado para motores 3D.

### ⚔️ O Conflito de Hierarquia (Nav Inversion)
- **Falha:** Ao ativar Auto-Hide, o NAV mudava de lado (ex: Topo para Base).
- **Solução:** Refatoramos o `App.tsx` para respeitar a ordem física do DOM (isStart render) independente do estado de visibilidade.

### ⚔️ O Fantasma do Windows 7 (Flash Visual)
- **Falha:** Janelas secundárias piscavam frames clássicos do Windows durante a inicialização.
- **Solução:** Implementamos o **Protocolo de Silêncio Total**: as janelas nascem com `ShowWindow(SW_HIDE)` e `WS_EX_LAYERED` com opacidade zero no nível Win32 nativo, sendo reveladas apenas quando o posicionamento está estabilizado.

### ⚔️ O Desafio da Transparência no WebView2
- **Falha:** Injetar `background: transparent` via CSS resultava em um fundo branco ou azul claro.
- **Solução:** Forçamos `.background_color((0,0,0,0))` no builder da janela e executamos um `InvalidateRect` via GDI após o `SetParent` para obrigar o redesenho da transparência alfa.

---

## 🧪 7. Estratégia Git (Cobaia vs. Base)
- **pra-valer (O Cobaia):** `https://github.com/Rodgph/pra-valer`. Para testes instáveis.
- **base (O Backup/Oficial):** `https://github.com/Rodgph/Base`. Fonte de verdade estável.
- **O Seletor:** Script `./push.ps1` gerencia a promoção de código.

---

## 🏁 FASE 2: EM PROGRESSO (Módulos e Interatividade).
*Assinado: O Arquiteto do Sistema — Social OS Core Team*
