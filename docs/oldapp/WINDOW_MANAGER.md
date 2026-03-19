# Social OS - Window Management (Final Phase 1)

Este documento detalha o sistema de movimentação nativa do Social OS, utilizando uma alça externa inteligente.

## 1. Arquitetura: WindowHandle Widget
O sistema de movimentação utiliza uma micro-janela Tauri independente (`window-handle`) que atua como um controle remoto para a janela principal.

## 2. Posicionamento e Estética
- **Localização**: Ancorada no topo da janela principal.
- **Offsets de Design**: 
    - Vertical: +5px de gap da borda superior.
    - Horizontal: +5px de deslocamento para a direita em relação ao centro.
- **Estética Stealth**:
    - Sem bordas nativas (`decorations: false`, `shadow: false`).
    - Fundo translúcido `rgba(25, 25, 25, 0.9)` com `blur(20px)`.
    - Ausência total de contornos de sistema via `setShadow(false)`.

## 3. Comportamento Inteligente
- **Sensor de Proximidade**: O `App.tsx` monitora o cursor. A alça só aparece quando o mouse está a menos de 5px do topo da aplicação.
- **Animação Slide-Down**: A alça desliza de trás da janela para baixo com uma curva `cubic-bezier(0.2, 0.8, 0.2, 1)`, proporcionando um efeito de mola suave.
- **Sincronização de Alta Frequência**: Utiliza coordenadas físicas (`PhysicalPosition`) enviadas via eventos Tauri em tempo real para eliminar qualquer atraso (tremor) entre a alça e o app.

## 4. Movimentação Nativa
Ao clicar e arrastar a alça, o comando `startDragging` é disparado na janela principal do Social OS, delegando o processamento do movimento ao kernel do Windows (DWM), garantindo performance de 144Hz+.

## 5. Lifecycle
A micro-janela é gerenciada pelo `App.tsx`, sendo criada na inicialização e destruída automaticamente no fechamento do app principal.
