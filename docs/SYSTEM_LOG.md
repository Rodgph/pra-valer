# 🧠 Social OS — O Guia Definitivo de Arquitetura e Engenharia

Este documento é a autoridade máxima do Social OS. Ele unifica a visão do produto, o manifesto estético, o mapa técnico, o registro histórico de batalhas e a estratégia de infraestrutura Git.

> **Protocolo de Auto-Instrução (Para a Próxima Instância de IA):**
> 1.  **Leia a Crônica de Desafios ANTES de codar:** O Social OS opera em um nível de manipulação de Win32 API que é frágil. Muitas soluções parecem "overkill", mas existem para contornar limitações específicas do Windows 11.
> 2.  **Documente o "Porquê", não apenas o "O quê":** Sempre que implementar algo fora do roteiro ou corrigir um bug que desafia a lógica comum, adicione uma entrada na Crônica de Desafios. Explique a falha técnica exata e o hack utilizado.
> 3.  **Respeite o DNA Visual:** Se uma sugestão de UI arredondar cantos ou usar cores padrão do sistema, ela está errada. O sistema deve ser reto, brutalista e agressivo.
> 4.  **Mantenha o Log Vivo:** Este arquivo é a memória de longo prazo do projeto. Sem ele, repetiremos erros de compilação de ponteiros brutos ou codificação de arquivos.

---

## ☢️ 1. Manifesto de Essência Visual (DNA Agressivo)
Define as regras inalienáveis para todas as janelas. Qualquer nova janela **DEVE** seguir estes mandamentos:

### Mandamentos Técnicos (DWM & Win32)
- **Borda/Halo Zero Absoluto:** O atributo `DWMWA_BORDER_COLOR` deve ser sempre `0xFFFFFFFE`. Nenhuma borda colorida ou halo de foco nativo é permitido.
- **Sombra Zero:** Sombras nativas são desativadas via config (`shadow: false`) e DWM.
- **Cantos Vivos:** Forçamos `DWMWCP_DONOTROUND`. Janelas arredondadas são proibidas.
- **Backdrop Persistente:** O efeito Mica/Acrylic **NUNCA** desativa. O `WNDPROC` é interceptado para mentir ao kernel sobre o estado de foco.

### Regras de Interface (Frontend)
- **Borda Zero CSS:** Proibido o uso de `border` (`border: none !important`). Separação via cores e transparência.
- **Transparência Crítica:** `body` e `html` com `background: transparent !important`.
- **Modo Escuro Forçado:** `DWMWA_USE_IMMERSIVE_DARK_MODE` sempre ativo.

---

## 📐 2. Engine de Layout (Recursive Tiling Manager)
- **Árvore Binária Recursiva:** O layout é uma estrutura de árvore onde cada nó pode ser um `Split` (divisão H/V) ou um `Pane` (espaço para módulo).
- **Resizer Furtivo (Hitbox-UX):** Linha de 1px (transparente/preta) com hitbox de 10px para arraste preciso sem poluir a UI.
- **Sincronia Cross-Window:** Toda alteração é transmitida via barramento de eventos Rust (evento `sync-layout`), permitindo controle via janelas externas.

---

## 🔍 3. Spotlight Search (The Finder)
Invoque via `Ctrl + Shift + Space`.
- **Janela dedicada:** `search_global` configurada no Rust com `always_on_top` e sem decorações.
- **Filtro Real-time:** Varre o `moduleRegistry` para spawn instantâneo de módulos via evento `search-select`.

---

## 📊 4. Telemetria Nível Kernel (Hardcore Monitoring)
- **Arquitetura Híbrida:** Backend Rust decide entre **DXGI** (identificação), **PDH** (carga global) e **NVML** (NVIDIA Driver Level).
- **NVIDIA Driver Link:** Carregamos a `nvml.dll` dinamicamente para ler diretamente da RTX 3060.
- **Controle Cirúrgico:** Visibilidade granulada por item (CPU, RAM, GPU, VRAM, NET) e intervalos configuráveis (500ms a 3s).

---

## 🧪 5. Estratégia Git (Cobaia vs. Base)
Dois remotos sincronizados para segurança e liberdade:
1.  **pra-valer (O Cobaia):** `https://github.com/Rodgph/pra-valer`. Ambiente de testes instáveis.
2.  **base (O Backup/Oficial):** `https://github.com/Rodgph/Base`. Fonte de verdade estável.
- **O Seletor:** Utilizamos o script `./push.ps1` para gerenciar o destino.
- **Regra de Ouro:** Apenas código funcional e testado é promovido para a `base`.

---

## 📜 6. A Crônica de Desafios (Batalhas Superadas)

### ⚔️ A Batalha das Referências (Rust Borrowing)
- **Falha:** Erros `E0308` ao manipular janelas. **Solução:** Normalizamos o uso de `tauri::Window` e extração via `.as_ref().window()`.

### ⚔️ O Fantasma do UTF-16 (Binary CSS Bug)
- **Falha:** Vite tratava CSS como binário (Erro 500). **Solução:** Forçamos reescrita em UTF-8 puro, ignorando o padrão UTF-16 do PowerShell.

### ⚔️ O Desafio do Send/Sync (Ponteiros Brutos)
- **Falha:** Compilador Rust barrava Handles PDH em Mutexes globais. **Solução:** Criamos o wrapper `struct SendRaw<T>(T);` com impl manual de `Send/Sync`.

### ⚔️ A Batalha da RTX 3060 (Zero-Stats Bug)
- **Falha:** Uso de GPU e VRAM apareciam como 0%. **Solução:** Abandonamos APIs de alto nível por NVML (Direct Driver Access) e PDH totalizado para motores 3D.

---

## 🚀 7. Como Iniciar
1. `npm install`
2. `npm run tauri dev`
3. Atalhos: `Ctrl+Shift+Space` (Busca), `Botão Direito no NAV` (Configurações).

---
*Assinado: O Arquiteto do Sistema — Social OS Core Team*
