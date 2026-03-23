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

---

## 📐 2. Orquestração de Núcleo (Kernel Engine)
O Social OS opera sob um modelo de **Gerenciador de Processos Virtual**. Cada módulo (Navegador, Monitor, Relógio) é tratado como um processo com PID único e ciclo de vida isolado.

### 🧩 Pilares da Orquestração
- **Registro Central (`registry.tsx`):** Declaração estática de módulos com suporte a *Lazy Loading* via `React.lazy`. Garante que o código do módulo só seja carregado quando instanciado.
- **Orchestrator Store:** Estado global (Zustand) que rastreia todas as instâncias ativas. 
    - **Tiling Instances:** Vinculadas a um `paneId` do Layout Engine.
    - **Floating Instances:** Janelas independentes com `isFloating: true`, gerenciando coordenadas (`x, y`) e profundidade (`zIndex`).
- **Sincronia Cross-Window:** O sistema utiliza o evento global `sync-orchestrator`. Isso permite que uma ação em uma janela (ex: fechar um processo no Kernel Manager) reflita instantaneamente em todas as outras janelas abertas.
- **Kill-Link & Garbage Collection:** Ao encerrar um processo (`closeModule`), o sistema dispara um sinal de limpeza para o Layout Engine, garantindo que nenhum painel órfão permaneça na árvore de renderização.

---

## 🏗️ 3. Engine de Layout (Tiling Manager)
- **Recursive Binary Tree:** A interface é uma árvore recursiva onde cada nó é um `SplitNode` (divisor) ou um `PaneNode` (container de módulo).
- **Serialização de Layout:** Toda a estrutura é serializável em JSON, permitindo a persistência total via `localStorage` na chave `social-os-layout`.
- **Workspaces:** Suporte a salvamento e carregamento de "snapshots" de layout via comandos `/save` e `/load`, permitindo trocar setups de trabalho instantaneamente.

---

## 🌐 4. Ecossistema de Navegação & Customização
- **Social Browser Pro:** Browser nativo blindado contra o visual clássico do Windows.
- **Auto-Styles Engine:** Cache de CSS no backend Rust (`DOMAIN_CSS_CACHE`). O sistema injeta o estilo personalizado via `initialization_script` no motor do WebView2 **antes** do carregamento do DOM, garantindo injeção 100% persistente e imune a reloads.
- **Navegação Histórica:** Controle de `window.history` via backend, permitindo comandos de retroceder, avançar e recarregar com injeção automática de CSS.

---

## 🔍 5. Spotlight Search Pro (The Finder)
Invoque via `Ctrl + Shift + Space`.
- **Navegação de Elite:** Suporte completo a teclado (Setas ↑/↓, Enter para executar, Esc para cancelar).
- **Central de Comandos:** Interpretador de strings que detecta o prefixo `/` e executa ações de sistema (ex: `/google termo`, `/kill Relógio`, `/mica`, `/exit`).
- **Visual:** Animação de entrada `spotlight-in` (slide down + fade) e destaque verde brutalista no item selecionado.

---

## 📊 6. Telemetria e Monitoramento
- **Arquitetura Híbrida:** Backend Rust funde **DXGI**, **PDH** e **NVML** para monitoramento 100% confiável da RTX 3060.
- **System Monitor:** Módulo de alta performance que renderiza gráficos SVG em tempo real com grid lines de precisão.
- **Auto-Hide NAV:** Barra de ferramentas com comportamento Windows-style (Slide Over) que não desloca o layout ao ser revelada.

---

## 📜 7. A Crônica de Desafios (Batalhas Superadas)

### ⚔️ O Desafio do DPI em 4K (Handle Offset)
- **Falha:** Em monitores 4K com escala de 150%+, a alça (Handle) nascia "dentro" da janela ou desalinhada.
- **Solução:** Implementamos o `calculate_handle_pos_absolute` no Rust que consome o `scale_factor` do Windows via Win32 e compensa os 8px de borda invisível de janelas maximizadas.

### ⚔️ A Batalha da RTX 3060 (Zero-Stats Bug)
- **Falha:** Uso de GPU e VRAM apareciam como 0%. **Solução:** Implementamos NVML (Direct Driver Access) e PDH totalizado para motores 3D.

### ⚔️ O Conflito de Hierarquia (Nav Inversion)
- **Falha:** Ao ativar Auto-Hide, o NAV mudava de lado (ex: Topo para Base).
- **Solução:** Refatoramos o `App.tsx` para respeitar a ordem física do DOM (isStart render) independente do estado de visibilidade.

### ⚔️ O Fantasma do Windows 7 (Flash Visual)
- **Falha:** Janelas secundárias piscavam frames clássicos do Windows durante a inicialização.
- **Solução:** Implementamos o **Protocolo de Silêncio Total**: as janelas nascem com `ShowWindow(SW_HIDE)` e `WS_EX_LAYERED` com opacidade zero no nível Win32 nativo.

### ⚔️ O Desafio da Transparência no WebView2
- **Falha:** Injetar `background: transparent` via CSS resultava em um fundo branco ou azul claro.
- **Solução:** Forçamos `.background_color((0,0,0,0))` no builder da janela e executamos um `InvalidateRect` via GDI para obrigar o redesenho da transparência alfa.

---

## 🎨 7. Identidade e Comportamento Visual
- **Handle Contextual:** A alça de arraste não é apenas um pixel; ela possui um menu de contexto nativo simulado para controle rápido de posição e efeitos de material.
- **Focus Pulsar:** O sistema emite um evento visual de pulsação na borda da alça e dos painéis ativos para indicar o foco do teclado, reforçando o feedback tátil-visual.
- **Sincronia de Materiais:** Evento global `sync-effect` garante que todas as janelas usem o mesmo material (Mica/Acrylic) simultaneamente.

---

## 🧪 8. Estratégia Git (Cobaia vs. Base)
- **pra-valer (O Cobaia):** `https://github.com/Rodgph/pra-valer`. Para testes instáveis.
- **base (O Backup/Oficial):** `https://github.com/Rodgph/Base`. Fonte de verdade estável.
- **O Seletor:** Script `./push.ps1` gerencia a promoção de código.

---

## 🏁 FASE 2: EM PROGRESSO (Módulos e Interatividade).
*Assinado: O Arquiteto do Sistema — Social OS Core Team*
