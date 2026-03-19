# Estratégia de Repositórios: Cobaia vs. Base

Este projeto opera sob uma arquitetura de dois remotos sincronizados para garantir segurança e liberdade de experimentação.

## 🧪 Repositório: `pra-valer` (O Cobaia)
- **URL:** `https://github.com/Rodgph/pra-valer`
- **Função:** Ambiente de testes agressivos e instáveis.
- **Regra:** Todo código novo deve ser enviado para cá primeiro. Se "quebrar", não há problema, pois a Base estará segura.

## 🏛️ Repositório: `base` (O Backup/Oficial)
- **URL:** `https://github.com/Rodgph/Base`
- **Função:** Fonte de verdade e backup estável.
- **Regra:** Apenas código 100% testado e funcional deve ser "promovido" para este repositório. Ele guarda a essência do projeto (DNA Visual).

---

## 🛠️ Como Enviar (O Seletor de Destino)

Para evitar envios acidentais para o repositório errado, utilize o comando customizado abaixo:

### No Terminal (PowerShell/CMD):
Execute o comando de envio conforme sua escolha:

1. **Para o Cobaia (Testes):**
   ```powershell
   git push pra-valer main
   ```

2. **Para a Base (Backup):**
   ```powershell
   git push base main
   ```

### Automatização de Escolha (Recomendado)
Para que o Git sempre te pergunte, você pode usar este atalho (Alias) que acabei de configurar para você:
```powershell
git push-choice
```

---
*Nota: Este sistema garante que seu DNA Visual nunca seja perdido em um experimento mal sucedido no repositório cobaia.*
