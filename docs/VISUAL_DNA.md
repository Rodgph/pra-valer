# Manifesto de Essência Visual - DNA Agressivo

Este documento define as regras inalienáveis para todas as janelas deste projeto. Qualquer nova janela criada **DEVE** seguir estes mandamentos técnicos.

## 1. Mandamentos Técnicos (DWM Attributes)
- **Borda/Halo Zero Absoluto:** O atributo `DWMWA_BORDER_COLOR` deve ser sempre `0xFFFFFFFE`. Nenhuma borda colorida, halo de foco ou contorno deve existir em nenhuma janela. **É proibido o uso de bordas nativas ou simuladas.**
- **Sombra Zero:** As sombras nativas do Windows devem ser desativadas via configuração (`shadow: false`) e via DWM se necessário.
- **Cantos Vivos:** O atributo `DWMWA_WINDOW_CORNER_PREFERENCE` deve ser `DWMWCP_DONOTROUND`. Janelas arredondadas são proibidas; a estética deve ser brutalista e reta.
- **Backdrop Persistente:** O efeito Mica ou Acrylic **NUNCA** deve ser desativado quando a janela perde o foco. O `WNDPROC` deve ser interceptado para manter a janela visualmente ativa para o sistema.

## 2. Regras de Interface (Frontend)
- **Borda Zero em CSS:** É expressamente proibido o uso de `border` em qualquer seletor CSS (`border: none !important`). A separação entre elementos deve ser feita apenas por cores, sombras suaves (se permitido), transparências ou contrastes de material.
- **Transparência Crítica:** O `body` e o `html` devem possuir `background: transparent !important`.
- **Modo Escuro Forçado:** O atributo `DWMWA_USE_IMMERSIVE_DARK_MODE` deve estar sempre ativo (1). A interface deve ser desenhada para contrastar com materiais escuros.

## 3. Automação de Herança
Toda nova janela disparada pelo comando `WebviewWindowBuilder` no Rust ou via API do Tauri no Frontend é automaticamente interceptada pelo `app.on_window_event` no `lib.rs` para receber a injeção do DNA Visual antes mesmo de ser exibida ao usuário.

---
*Assinado: O Arquiteto do Sistema*
