# Social OS — Framework de DNA Visual Agressivo

O Social OS é uma base tecnológica para criação de aplicativos desktop nativos com Windows 11 utilizando **Tauri v2**, **React 19** e **Rust**. Este projeto foca em uma estética brutalista, translúcida e persistente.

## 🧬 DNA Visual (Mica/Acrylic)
Este projeto implementa manipulações de baixo nível no **DWM (Desktop Window Manager)** do Windows para garantir:
- **Janelas Frameless:** Remoção total de bordas e halos de foco.
- **Sombra Zero:** Estética limpa e seca sem sombras nativas.
- **Cantos Retos:** Proibição de arredondamento nativo (Brutalismo).
- **Persistência Total:** Efeitos Mica e Acrylic permanecem ativos mesmo quando a janela está em segundo plano.

Consulte o arquivo [VISUAL_DNA.md](./VISUAL_DNA.md) para detalhes técnicos.

## 🧪 Estratégia de Desenvolvimento
Operamos com dois repositórios sincronizados:
1. **pra-valer (Cobaia):** Onde os testes e quebras acontecem.
2. **Base (Oficial):** Onde a essência estável e testada é guardada.

Para gerenciar os envios, utilize o script interativo:
```powershell
.\push.ps1
```
Consulte o arquivo [GIT_STRATEGY.md](./GIT_STRATEGY.md) para mais informações.

## 🚀 Como Iniciar
1. Instale as dependências: `npm install`
2. Inicie o ambiente de desenvolvimento: `npm run tauri dev`

---
*Desenvolvido com foco em UI Nativa de Próxima Geração.*
