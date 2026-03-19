# SOCIAL OS — DOCUMENTAÇÃO ABSOLUTA E DEFINITIVA

> **ATENÇÃO:** Este arquivo contém **100% do conteúdo original** de todos os arquivos de documentação, sem ABSOLUTAMENTE NENHUM RESUMO.

## COMO O APP DEVE FICAR NO FINAL (VISÃO GERAL)
O Social OS é um Sistema Operacional Social rodando sobre o Desktop (Windows/macOS/Linux) construído com Tauri v2 e React. Ele possui comportamento de SO nativo: janelas independentes, motor de janelas lado-a-lado (Tiling Window Manager), barra de tarefas customizada e foco em performance.
- **Janela de Fundo (Wallpaper)**: Invisível, ancorada na área de trabalho, toca vídeos ou animações (Motion Wallpaper), reagindo ao uso de CPU.
- **Janela Principal (Main)**: Interface de vidro translúcido (Glassmorphism / Mica) com fundo #020202 onde painéis podem ser divididos infinitamente na vertical e horizontal.
- **Janela de Busca (Spotlight)**: Acionada por Ctrl+Alt+Space, flutua acima de tudo no SO, permitindo buscas em menos de 100ms.
- **Módulos**: Chat, Feed, Música, Games Favoritos, Live, etc. Cada módulo é arrastável.
- **Comunicação em Tempo Real**: Presença, atividade (Jogando X) e mensagens criptografadas ou efêmeras.

---



# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: ANIMATIONS.md
# ==========================================

# ANIMATIONS.md — Sistema de Animações

> **ATENÇÃO PARA A IA:** Todas as animações do app usam CSS puro (transitions e keyframes). NUNCA usar framer-motion, react-spring, anime.js ou qualquer lib de animação JS. NUNCA animar com JavaScript setInterval/setTimeout manipulando estilos diretamente. Todo valor de duração e easing deve vir das variáveis CSS definidas aqui.

---

## VARIÁVEIS CSS — adicionar em tokens.css

```css
/* src/styles/tokens.css */

/* Durações */
--duration-instant:  100ms;   /* Feedback imediato: hover de botão, toggle */
--duration-fast:     150ms;   /* Micro-interações: drag handle reveal, badges */
--duration-normal:   200ms;   /* Padrão: abrir menus, trocar telas */
--duration-slow:     300ms;   /* Elementos maiores: modais, painéis laterais */
--duration-skeleton: 1500ms;  /* Pulse do skeleton — sempre este valor */

/* Easings */
--ease-out:   cubic-bezier(0.0, 0.0, 0.2, 1);  /* Elementos entrando na tela */
--ease-in:    cubic-bezier(0.4, 0.0, 1.0, 1);  /* Elementos saindo da tela */
--ease-inout: cubic-bezier(0.4, 0.0, 0.2, 1);  /* Elementos que mudam de estado */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Efeito "mola" sutil — usar com moderação */
```

---

## O QUE ANIMA E O QUE NÃO ANIMA

### SEMPRE animar
- Drag handle reveal/hide → `height`, `opacity`, `transform`
- Abrir/fechar context menu → `opacity`, `transform: scale`
- Abrir/fechar toast → `transform: translateY`, `opacity`
- Hover em botões e cards → `background-color`, `opacity`
- Badge de não lidas aparecendo → `transform: scale`
- Trocar de tema → `background-color`, `color` (via transition no `:root`)
- Status de presença mudando → `background-color`
- Skeleton pulse → `opacity` (via keyframe)
- OfflineBanner aparecendo → `transform: translateY`
- FAB expandindo → `transform: rotate` no ícone, `opacity` nos itens
- Resize handle sendo arrastado → sem animação (deve ser instantâneo)
- Conteúdo do módulo quando handle revela → `transform: translateY`

### NUNCA animar
- Troca de módulo em painel (instantâneo — o usuário iniciou a ação)
- Scroll (nunca override de scroll behavior)
- Carregamento de imagens (fade-in opcional, mas nunca obrigatório)
- Resize de painel (instantâneo — segue o cursor)
- Texto digitado no input (nunca animar caracteres)
- Mensagens novas aparecendo no chat (só scroll, sem animação de entrada)

---

## ANIMAÇÕES ESPECÍFICAS

### Drag Handle Reveal
```css
/* DragHandle.module.css */
.handle {
  height: var(--drag-handle-height, 5px); /* usa constante do tokens */
  opacity: 0;
  transition:
    height var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);
}

.handle.revealed {
  height: 20px;
  opacity: 1;
}

/* Conteúdo do módulo desloca para baixo */
.moduleContent {
  transition: transform var(--duration-fast) var(--ease-out);
}

.moduleContent.shifted {
  transform: translateY(15px);
}
```

### Context Menu
```css
/* ContextMenu.module.css */
.menu {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
  transform-origin: top left; /* ou top right, depende da posição */
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
  pointer-events: none;
}

.menu.visible {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: all;
}
```

### Toast Notification
```css
/* Toast.module.css */
.toast {
  transform: translateY(100%);
  opacity: 0;
  transition:
    transform var(--duration-normal) var(--ease-out),
    opacity var(--duration-normal) var(--ease-out);
}

.toast.visible {
  transform: translateY(0);
  opacity: 1;
}

.toast.leaving {
  transform: translateX(110%);
  opacity: 0;
  transition:
    transform var(--duration-fast) var(--ease-in),
    opacity var(--duration-fast) var(--ease-in);
}
```

### Skeleton Pulse
```css
/* Skeleton.module.css */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.skeleton {
  background: var(--bg-module);
  animation: skeleton-pulse var(--duration-skeleton) ease-in-out infinite;
}
```

### FAB (Floating Action Button) expandindo
```css
/* FloatingActions.module.css */
.fab-icon {
  transition: transform var(--duration-fast) var(--ease-inout);
}

.fab-icon.open {
  transform: rotate(45deg);
}

.fab-item {
  opacity: 0;
  transform: translateY(8px) scale(0.9);
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

/* Cada item tem delay diferente para efeito cascata */
.fab-item:nth-child(1) { transition-delay: 0ms; }
.fab-item:nth-child(2) { transition-delay: 40ms; }
.fab-item:nth-child(3) { transition-delay: 80ms; }

.fab-item.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

### Trocar de Tema (Dark ↔ Light)
```css
/* global.module.css */
/* Aplicar no :root para que TODOS os elementos herdem a transição */
:root {
  transition:
    background-color var(--duration-slow) var(--ease-inout),
    color var(--duration-slow) var(--ease-inout);
}
```

### OfflineBanner
```css
/* OfflineBanner.module.css */
.banner {
  transform: translateY(-100%);
  transition: transform var(--duration-normal) var(--ease-out);
}

.banner.visible {
  transform: translateY(0);
}
```

### Badge de não lidas (aparece/desaparece)
```css
/* Badge.module.css */
.badge {
  transform: scale(0);
  opacity: 0;
  transition:
    transform var(--duration-fast) var(--ease-spring),
    opacity var(--duration-fast) var(--ease-out);
}

.badge.visible {
  transform: scale(1);
  opacity: 1;
}
```

### Hover em botões
```css
/* Button.module.css */
.button {
  /* Apenas background — nunca animar transform em botões */
  transition: background-color var(--duration-instant) var(--ease-out);
}

.button:hover {
  background-color: rgba(var(--bg-module-rgb), 0.8);
}

.button:active {
  /* Active é instantâneo — sem transition */
  opacity: 0.7;
}
```

---

## REGRAS ABSOLUTAS

1. **Nunca usar `all` em transition** — especificar propriedades individuais
   ```css
   /* ❌ Errado */
   transition: all 0.2s ease;

   /* ✅ Correto */
   transition: opacity 0.2s ease, transform 0.2s ease;
   ```

2. **Nunca animar `width` ou `height` diretamente** — causa reflow, usar `transform: scaleX/Y` ou `max-height` com limitação
   ```css
   /* ❌ Evitar */
   transition: height 0.2s ease;

   /* ✅ Preferir */
   transition: transform 0.2s ease;
   ```

3. **Sempre animar `opacity` e `transform` juntos quando possível** — GPU-accelerated, sem reflow

4. **Duração máxima de qualquer animação de interação: 300ms** — acima disso o app parece lento

5. **Respeitar `prefers-reduced-motion`**
   ```css
   /* Em global.module.css */
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: APP_INIT.md
# ==========================================

# APP_INIT.md — Ordem de Inicialização do App

> **ATENÇÃO PARA A IA:** Esta é a ordem EXATA em que o app inicializa. Race conditions acontecem quando componentes tentam usar dados antes de estarem disponíveis. Seguir esta ordem evita telas em branco, erros de "undefined is not a function" e loops de redirecionamento.

---

## VISÃO GERAL — Do clique no ícone até o usuário ver a tela

```
1. Tauri abre a janela main (main.rs)
2. Tauri cria a janela search (oculta)
3. Aplica efeito Mica/Acrylic (main + search)
4. Registra atalhos globais
5. Configura tray icon
6. Inicia background jobs (cold storage)
7. Carrega React (main.tsx)
8. Inicializa i18n
9. Inicializa Supabase client
10. Monta <App />
11. App verifica sessão do usuário
11a. Sem sessão → exibe tela de Login
11b. Com sessão → inicia carregamento de dados
12. Carrega user_settings (tema, idioma, layout)
13. Aplica tema salvo
14. Inicializa RealtimeProvider (abre WebSocket)
15. Carrega dados iniciais (conversas, notificações)
16. Exibe AppLayout com dados
```


---

## main.tsx — Ponto de entrada React

```tsx
// src/main.tsx
// ORDEM IMPORTA — não reordenar

import React from 'react'
import ReactDOM from 'react-dom/client'

// 1. i18n ANTES de qualquer componente React
import './i18n/index'

// 2. Estilos globais ANTES de componentes
import './styles/global.module.css'
import './styles/tokens.css'
import './styles/animations.css'

// 3. App
import App from './App'

// 4. Aplicar tema padrão no elemento raiz ANTES de montar
// (evita flash de tema errado)
document.documentElement.setAttribute('data-theme', 'dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## App.tsx — Roteamento e providers

```tsx
// src/App.tsx
// Ordem dos providers IMPORTA — providers internos dependem dos externos

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { RealtimeProvider } from '@/engine/realtime/RealtimeProvider'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthScreen } from '@/modules/Auth/AuthScreen'
import { Welcome } from '@/modules/Welcome'
import { useDeepLink } from '@/hooks/useDeepLink'
import { useShortcuts } from '@/hooks/useShortcuts'
import { useOffline } from '@/hooks/useOffline'

export default function App() {
  const { user, isLoading, initialize } = useAuthStore()
  const { applyTheme } = useThemeStore()
  const [appReady, setAppReady] = useState(false)

  // Hooks globais — inicializam uma vez, ficam ativos para sempre
  useDeepLink()    // Escuta deep links app://
  useShortcuts()   // Registra atalhos de teclado
  useOffline()     // Detecta conexão/desconexão

  useEffect(() => {
    const init = async () => {
      // 1. Verifica sessão salva
      await initialize()
      setAppReady(true)
    }
    init()
  }, [])

  // 2. Aplica tema quando usuário carregar (pode ter tema salvo)
  useEffect(() => {
    if (user?.settings?.theme) {
      applyTheme(user.settings.theme)
    }
  }, [user?.settings?.theme])

  // App ainda inicializando — mostrar nada (fundo preto do Mica)
  if (!appReady || isLoading) {
    return null
  }

  // Não autenticado → login
  if (!user) {
    return <AuthScreen />
  }

  // Autenticado mas não completou onboarding
  if (!user.username) {
    return <Welcome />
  }

  // Autenticado e com perfil completo → app principal
  return (
    // RealtimeProvider só monta quando usuário está autenticado
    // (garante que temos user.id para os canais)
    <RealtimeProvider userId={user.id}>
      <AppLayout />
    </RealtimeProvider>
  )
}
```

---

## auth.store.ts — initialize() em detalhe

```ts
// src/store/auth.store.ts

initialize: async () => {
  set({ isLoading: true })

  try {
    // 1. Verificar sessão salva localmente
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      set({ user: null, isLoading: false })
      return
    }

    // 2. Buscar dados do perfil do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('*, user_settings(*), user_status(*)')
      .eq('id', session.user.id)
      .single()

    set({
      user: userData,
      session,
      isLoading: false
    })

    // 3. Marcar usuário como online
    await supabase
      .from('user_status')
      .update({ status: 'online' })
      .eq('user_id', session.user.id)

    // 4. Escutar mudanças de auth (logout em outro dispositivo, token expirado)
    supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT') {
        set({ user: null, session: null })
      }
      if (event === 'TOKEN_REFRESHED' && newSession) {
        set({ session: newSession })
      }
    })

  } catch (error) {
    // Sessão inválida — limpar e ir para login
    await supabase.auth.signOut()
    set({ user: null, isLoading: false })
  }
}
```

---

## RealtimeProvider — O que inicializa e em que ordem

```tsx
// src/engine/realtime/RealtimeProvider.tsx

export function RealtimeProvider({
  userId,
  children
}: {
  userId: string
  children: React.ReactNode
}) {
  useEffect(() => {
    // Ordem de subscribe importa — mais críticos primeiro

    // 1. Presença global (outros usuários vendo meu status)
    const presenceChannel = supabase.channel('presence:global')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_status' },
        handlers.onPresenceChange)
      .subscribe()

    // 2. Minhas notificações
    const notifChannel = supabase.channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}` },
        handlers.onNotification)
      .subscribe()

    // 3. Minhas configurações (sincronização entre dispositivos)
    const settingsChannel = supabase.channel(`settings:${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_settings',
        filter: `user_id=eq.${userId}` },
        handlers.onSettingsChange)
      .subscribe()

    // 4. Feed global
    const feedChannel = supabase.channel('feed:global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' },
        handlers.onNewPost)
      .subscribe()

    // Cleanup obrigatório — sem isso, canais acumulam a cada remount
    return () => {
      supabase.removeChannel(presenceChannel)
      supabase.removeChannel(notifChannel)
      supabase.removeChannel(settingsChannel)
      supabase.removeChannel(feedChannel)
    }
  }, [userId])  // Re-inicializa se userId mudar (troca de conta)

  return <>{children}</>
}

// NOTA: Canais de conversa (messages) são abertos/fechados
// pelo chat.store ao abrir/fechar uma conversa — não aqui.
// Apenas canais globais ficam abertos o tempo todo.
```

---

## AppLayout — O que renderiza e em que ordem

```tsx
// src/layouts/AppLayout.tsx

export function AppLayout() {
  // Carregar dados iniciais ao montar
  const { loadConversations } = useChatStore()
  const { loadNotifications } = useNotificationStore()
  const { loadHardwareData } = useHardwareStore()

  useEffect(() => {
    // Paralelo — todos ao mesmo tempo
    Promise.all([
      loadConversations(),
      loadNotifications(),
    ])
  }, [])

  // Hardware polling — separado pois usa Tauri invoke
  useHardware()  // hook que faz polling a cada HARDWARE_POLL_INTERVAL_MS

  return (
    <div className={styles.layout}>
      {/* 1. OfflineBanner — no topo, fora do fluxo */}
      <OfflineBanner />

      {/* 2. Área principal — LayoutEngine ocupa todo o espaço restante */}
      <main className={styles.main}>
        <LayoutEngine />
      </main>

      {/* 3. BottomBar — sempre visível, fixada no fundo */}
      <BottomBar />
    </div>
  )
}
```

---

## Estados de inicialização — O que mostrar em cada estado

| Estado | O que renderizar |
|---|---|
| `appReady = false` | `null` — fundo preto do Mica (sem flash) |
| `isLoading = true` | `null` — mesmo motivo |
| `user = null` | Tela de Login |
| `user.username = ''` | Tela de Welcome (onboarding) |
| `user` completo | AppLayout |

**Por que `null` e não um spinner de carregamento?**
O app usa Mica/Acrylic — o fundo já é bonito. Mostrar um spinner por 200-300ms seria ruído visual. O tempo de verificação de sessão é rápido o suficiente para não precisar de feedback.

---

## Cleanup ao sair do app

```ts
// src/store/auth.store.ts — logout()

logout: async () => {
  // 1. Marcar como offline antes de sair
  const userId = get().user?.id
  if (userId) {
    await supabase
      .from('user_status')
      .update({ status: 'offline', last_seen_at: new Date().toISOString() })
      .eq('user_id', userId)
  }

  // 2. Fechar todos os canais Realtime
  await supabase.removeAllChannels()

  // 3. Limpar sessão
  await supabase.auth.signOut()

  // 4. Limpar stores
  set({ user: null, session: null })
}
```

```rust
// src-tauri/src/main.rs — ao fechar a janela principal
// Emitir evento para o frontend antes de fechar
// para que o logout possa ser executado

.on_window_event(|window, event| {
  if let tauri::WindowEvent::CloseRequested { api, .. } = event {
    if window.label() == "main" {
      window.emit("app:closing", ()).unwrap();
      // Dar tempo para o frontend executar cleanup (500ms)
      std::thread::sleep(std::time::Duration::from_millis(500));
    }
  }
})
```


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: DATABASE.md
# ==========================================

# DATABASE.md — Schema Supabase

> **ATENÇÃO PARA A IA:** Este é o schema EXATO do banco de dados. Não adicionar campos não listados. Não renomear campos. Não mudar tipos de dados. Não remover constraints. Se precisar de um campo novo, adicionar no final da tabela com comentário explicando o motivo.

---

## CONVENÇÕES GLOBAIS

- Todos os IDs são `uuid` gerados pelo Postgres: `DEFAULT gen_random_uuid()`
- Todos os campos de data são `timestamptz` (com timezone) — NUNCA `timestamp`
- `created_at DEFAULT now()` em todas as tabelas
- `updated_at DEFAULT now()` em todas as tabelas que podem ser editadas
- `updated_at` atualizado automaticamente por trigger (ver seção de Triggers)
- Soft delete via `deleted_at timestamptz DEFAULT NULL` — NUNCA deletar fisicamente
- RLS (Row Level Security) habilitado em TODAS as tabelas — `ALTER TABLE x ENABLE ROW LEVEL SECURITY`
- Nunca usar `SERIAL` ou `INT` como ID — sempre `uuid`

---

## CRIAÇÃO DO SCHEMA — ORDEM DE EXECUÇÃO

Executar as migrations nesta ordem (por dependências de FK):

1. `users`
2. `user_status`
3. `user_settings`
4. `follows`
5. `blocks`
6. `stories`
7. `story_views`
8. `posts`
9. `post_reactions`
10. `post_comments`
11. `conversations`
12. `conversation_members`
13. `messages`
14. `message_edits`
15. `message_reactions`
16. `message_reads`
17. `message_favorites`
18. `saved_conversation_excerpts`
19. `notifications`
20. `projects`
21. `project_boards`
22. `project_cards`
23. `marketplace_assets`
24. `marketplace_ratings`

---

## TABELAS

### users
Dados públicos de perfil. Extende `auth.users` do Supabase.
O Supabase cria automaticamente um registro em `auth.users` no signup.
Criar trigger para inserir em `users` quando `auth.users` recebe novo registro.

```sql
CREATE TABLE users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        text UNIQUE NOT NULL,         -- @username, sem o @, minúsculas
  display_name    text NOT NULL,                -- Nome de exibição
  bio             text,                         -- Biografia (pode ser NULL)
  location        text,                         -- Localização ou tag livre (pode ser NULL)

  -- Foto de perfil
  avatar_url      text,                         -- URL única no R2
  avatar_urls     text[] DEFAULT '{}',          -- Array de URLs para slide de fotos
  avatar_slide_times int[] DEFAULT '{}',        -- Tempo em ms por foto (mesmo tamanho de avatar_urls)
  avatar_alt_url  text,                         -- Imagem alternativa para não seguidores

  -- Banner
  banner_url      text,                         -- URL da mídia do banner no R2
  banner_type     text DEFAULT 'color'
                  CHECK (banner_type IN ('image','gif','video','color','gradient')),
  banner_value    text DEFAULT '#020202',       -- URL (image/gif/video) ou valor CSS (color/gradient)

  -- Privacidade
  is_public       boolean DEFAULT true,         -- Perfil público ou privado
  avatar_visibility text DEFAULT 'all'
                  CHECK (avatar_visibility IN ('all','followers','except','only')),
  banner_visibility text DEFAULT 'all'
                  CHECK (banner_visibility IN ('all','followers','except','only')),
  post_permission text DEFAULT 'all'
                  CHECK (post_permission IN ('all','followers')),

  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver perfis públicos
CREATE POLICY "users_select_public" ON users
  FOR SELECT USING (is_public = true OR auth.uid() = id);

-- Apenas o próprio usuário insere
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Apenas o próprio usuário atualiza
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);
```

---

### user_status
Presença em tempo real. Um registro por usuário.

```sql
CREATE TABLE user_status (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          text DEFAULT 'offline'
                  CHECK (status IN ('online','away','dnd','offline')),
  activity_type   text CHECK (activity_type IN ('playing','listening','watching',NULL)),
  activity_name   text,           -- Nome do jogo, música, live (pode ser NULL)
  activity_detail text,           -- Detalhe: artista, plataforma (pode ser NULL)
  status_visibility text DEFAULT 'all'
                  CHECK (status_visibility IN ('all','followers','none')),
  activity_visibility text DEFAULT 'all'
                  CHECK (activity_visibility IN ('all','followers','none')),
  last_seen_at    timestamptz,    -- Última vez que estava online
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;

-- Leitura baseada na visibilidade configurada pelo usuário
-- (simplificado — em produção verificar follows)
CREATE POLICY "status_select" ON user_status
  FOR SELECT USING (
    status_visibility = 'all'
    OR user_id = auth.uid()
  );

CREATE POLICY "status_update_own" ON user_status
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "status_insert_own" ON user_status
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

---

### user_settings
Preferências e configurações. Um registro por usuário.

```sql
CREATE TABLE user_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme           text DEFAULT 'dark',          -- 'dark' | 'light' | 'custom-{uuid}'
  theme_custom_id uuid,                         -- FK para marketplace_assets (tema customizado)
  language        text DEFAULT 'pt-BR'
                  CHECK (language IN ('pt-BR','en-US','es-ES')),
  active_modules  text[] DEFAULT '{"Chat","Feed","Music","FavoriteGames"}',
  saved_layouts   jsonb DEFAULT '{}',           -- { "Gaming": LayoutNode, "Trabalho": LayoutNode }
  active_layout   text DEFAULT 'default',       -- Nome do layout ativo

  -- Toggles de notificação
  notif_new_follower    boolean DEFAULT true,
  notif_new_post        boolean DEFAULT true,
  notif_new_story       boolean DEFAULT true,
  notif_new_message     boolean DEFAULT true,
  notif_mention         boolean DEFAULT true,

  -- Atalhos customizados: { "ctrl+alt+c": "focus_chat", ... }
  shortcuts       jsonb DEFAULT '{}',

  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- RLS: apenas o próprio usuário
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_own" ON user_settings
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### follows

```sql
CREATE TABLE follows (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)           -- Não pode seguir a si mesmo
);

-- RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select_public" ON follows FOR SELECT USING (true);

CREATE POLICY "follows_insert_own" ON follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "follows_delete_own" ON follows
  FOR DELETE USING (follower_id = auth.uid());
```

---

### blocks

```sql
CREATE TABLE blocks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- RLS: apenas o próprio usuário vê seus bloqueios
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks_own" ON blocks
  USING (blocker_id = auth.uid())
  WITH CHECK (blocker_id = auth.uid());
```

---

### stories

```sql
CREATE TABLE stories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_url       text NOT NULL,                -- URL no R2
  media_type      text NOT NULL
                  CHECK (media_type IN ('image','video','gif')),
  caption         text,                         -- Legenda editável
  duration_ms     int DEFAULT 5000,             -- Duração de exibição em ms
  expires_at      timestamptz NOT NULL,         -- Calculado: created_at + 24h
  deleted_at      timestamptz,                  -- Soft delete
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Seguidores (ou todos se perfil público) veem stories não expiradas
CREATE POLICY "stories_select" ON stories
  FOR SELECT USING (
    deleted_at IS NULL
    AND expires_at > now()
    AND (
      user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = stories.user_id)
      OR EXISTS (SELECT 1 FROM users WHERE id = stories.user_id AND is_public = true)
    )
  );

CREATE POLICY "stories_insert_own" ON stories
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Apenas soft delete pelo próprio usuário
CREATE POLICY "stories_update_own" ON stories
  FOR UPDATE USING (user_id = auth.uid());
```

---

### story_views

```sql
CREATE TABLE story_views (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id        uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at       timestamptz DEFAULT now() NOT NULL,
  UNIQUE (story_id, viewer_id)
);

ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Autor da story vê quem assistiu
CREATE POLICY "story_views_select_author" ON story_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM stories WHERE id = story_id AND user_id = auth.uid())
  );

-- Qualquer um que pode ver a story pode registrar view
CREATE POLICY "story_views_insert" ON story_views
  FOR INSERT WITH CHECK (viewer_id = auth.uid());
```

---

### posts

```sql
CREATE TABLE posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         text,                         -- Texto (pode ser NULL se só tiver mídia)
  media_urls      text[] DEFAULT '{}',          -- Array de URLs no R2
  media_types     text[] DEFAULT '{}',          -- 'image' | 'video' | 'gif' para cada URL
  visibility      text DEFAULT 'all'
                  CHECK (visibility IN ('all','followers')),
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select" ON posts
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      user_id = auth.uid()
      OR visibility = 'all'
      OR EXISTS (SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = posts.user_id)
    )
  );

CREATE POLICY "posts_insert_own" ON posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_update_own" ON posts
  FOR UPDATE USING (user_id = auth.uid());
```

---

### post_reactions

```sql
CREATE TABLE post_reactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji           text NOT NULL,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id, emoji)
);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_reactions_select" ON post_reactions FOR SELECT USING (true);

CREATE POLICY "post_reactions_own" ON post_reactions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### post_comments

```sql
CREATE TABLE post_comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id       uuid REFERENCES post_comments(id) ON DELETE CASCADE, -- NULL = comentário raiz
  content         text NOT NULL,
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_comments_select" ON post_comments
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "post_comments_insert" ON post_comments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "post_comments_update_own" ON post_comments
  FOR UPDATE USING (user_id = auth.uid());
```

---

### conversations

```sql
CREATE TABLE conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type            text NOT NULL CHECK (type IN ('dm','group','server')),
  name            text,           -- NULL para DMs, obrigatório para group/server
  avatar_url      text,           -- NULL para DMs
  created_by      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme           jsonb DEFAULT '{}', -- { type: 'color', value: '#020202' } ou gif/image/video
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Apenas membros da conversa podem ver
CREATE POLICY "conversations_select_members" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "conversations_update_admin" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
        AND role IN ('admin','owner')
    )
  );
```

---

### conversation_members

```sql
CREATE TABLE conversation_members (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id         uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role                    text DEFAULT 'member' CHECK (role IN ('member','admin','owner')),

  -- Preferências desta conversa
  is_pinned               boolean DEFAULT false,
  is_muted                boolean DEFAULT false,
  is_archived             boolean DEFAULT false,
  is_invisible            boolean DEFAULT false,   -- Invisível ao grupo (toggle do Chat)
  show_read_receipt       boolean DEFAULT true,    -- Toggle: confirmação de leitura
  bg_profile_photo        boolean DEFAULT false,   -- Toggle: foto de perfil como bg
  mixed_profile_photos    boolean DEFAULT false,   -- Toggle: fotos mixadas nas bolhas
  allow_calls             boolean DEFAULT true,
  allow_notifications     boolean DEFAULT true,
  last_read_at            timestamptz,             -- Para calcular badge de não lidas

  joined_at               timestamptz DEFAULT now() NOT NULL,
  UNIQUE (conversation_id, user_id)
);

ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

-- Membros veem os outros membros
CREATE POLICY "conv_members_select" ON conversation_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "conv_members_update_own" ON conversation_members
  FOR UPDATE USING (user_id = auth.uid());
```

---

### messages

```sql
CREATE TABLE messages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id       uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content               text,                       -- NULL quando migrado para cold storage
  media_urls            text[] DEFAULT '{}',
  media_types           text[] DEFAULT '{}',
  reply_to_id           uuid REFERENCES messages(id) ON DELETE SET NULL,
  sticker_id            text,                       -- ID da figurinha (NULL se não tem)
  type                  text DEFAULT 'text' CHECK (type IN ('text','code','sync_media','drawing','voice')),
  metadata              jsonb DEFAULT '{}',         -- Metadados: { language: 'js' } ou { media_id: 'uuid' }
  
  -- Funcionalidades Revolucionárias
  is_scheduled          boolean DEFAULT false,
  scheduled_for         timestamptz,                -- Cápsula do tempo / Agendada
  is_silent             boolean DEFAULT false,      -- Chega sem notificação
  burn_after_read       boolean DEFAULT false,      -- View once / Autodestruição
  unlock_at             timestamptz,                -- Só pode ser lida após X data/hora
  unlock_location       jsonb,                      -- Só abre em certas coordenadas {lat, lng, radius}
  private_content       text,                       -- Versão privada da mensagem (camadas)
  has_password          boolean DEFAULT false,
  password_hash         text,                       -- bcrypt hash
  
  is_deleted_for_all    boolean DEFAULT false,
  deleted_for_users     uuid[] DEFAULT '{}',        -- IDs que deletaram só para si
  is_pinned             boolean DEFAULT false,
  cold_ref              text,                       -- Path no R2 quando em cold storage (NULL = hot)
  deleted_at            timestamptz,                -- Soft delete
  created_at            timestamptz DEFAULT now() NOT NULL,
  updated_at            timestamptz DEFAULT now() NOT NULL
) PARTITION BY RANGE (created_at);  -- Particionamento mensal

-- Criar partição para o mês atual (e futuras mensalmente)
CREATE TABLE messages_2024_01 PARTITION OF messages
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- (adicionar novas partições mensalmente via job automático)

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_members" ON messages
  FOR SELECT USING (
    deleted_at IS NULL
    AND is_deleted_for_all = false
    AND NOT (auth.uid() = ANY(deleted_for_users))
    AND EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_members" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE USING (sender_id = auth.uid());
```

---

### message_reminders

```sql
CREATE TABLE message_reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id      uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  remind_at       timestamptz NOT NULL,
  is_completed    boolean DEFAULT false,
  created_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE message_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminders_own" ON message_reminders
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### message_edits

```sql
CREATE TABLE message_edits (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id          uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  editor_id           uuid NOT NULL REFERENCES users(id),
  content_before      text NOT NULL,          -- Conteúdo antes da edição
  edited_at           timestamptz DEFAULT now() NOT NULL,
  notified_recipient  boolean DEFAULT false   -- Se já notificou o recebedor desta edição
);

ALTER TABLE message_edits ENABLE ROW LEVEL SECURITY;

-- Membros da conversa veem o histórico de edições
CREATE POLICY "message_edits_select" ON message_edits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_edits.message_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "message_edits_insert_own" ON message_edits
  FOR INSERT WITH CHECK (editor_id = auth.uid());
```

---

### message_reactions

```sql
CREATE TABLE message_reactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji           text NOT NULL,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "msg_reactions_select" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "msg_reactions_own" ON message_reactions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### message_reads

```sql
CREATE TABLE message_reads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at         timestamptz DEFAULT now() NOT NULL,
  UNIQUE (message_id, user_id)
);

ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "msg_reads_select" ON message_reads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_reads.message_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "msg_reads_insert" ON message_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

---

### message_favorites

```sql
CREATE TABLE message_favorites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope           text DEFAULT 'me' CHECK (scope IN ('me','all')),
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (message_id, user_id)
);

ALTER TABLE message_favorites ENABLE ROW LEVEL SECURITY;

-- Apenas o próprio usuário vê seus favoritos
CREATE POLICY "msg_favorites_own" ON message_favorites
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### saved_conversation_excerpts

```sql
CREATE TABLE saved_conversation_excerpts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_ids     uuid[] NOT NULL,            -- IDs das mensagens do trecho salvo
  note            text,                       -- Nota do usuário (opcional)
  created_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE saved_conversation_excerpts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "excerpts_own" ON saved_conversation_excerpts
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### notifications

```sql
CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- Destinatário
  actor_id        uuid REFERENCES users(id) ON DELETE SET NULL,            -- Quem gerou
  type            text NOT NULL
                  CHECK (type IN ('follow','unfollow','post','story','message','mention','comment')),
  entity_type     text CHECK (entity_type IN ('post','message','story','comment',NULL)),
  entity_id       uuid,                       -- ID da entidade relacionada
  is_read         boolean DEFAULT false,
  created_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Apenas o destinatário vê e marca como lida
CREATE POLICY "notifications_own" ON notifications
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

### projects

```sql
CREATE TABLE projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  owner_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  members         uuid[] DEFAULT '{}',        -- Array de UUIDs dos membros
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_members" ON projects
  FOR SELECT USING (
    owner_id = auth.uid() OR auth.uid() = ANY(members)
  );

CREATE POLICY "projects_insert_own" ON projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "projects_update_members" ON projects
  FOR UPDATE USING (owner_id = auth.uid() OR auth.uid() = ANY(members));
```

---

### project_boards

```sql
CREATE TABLE project_boards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name            text NOT NULL,
  position        int NOT NULL DEFAULT 0,     -- Ordem de exibição
  created_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE project_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boards_project_members" ON project_boards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_boards.project_id
        AND (owner_id = auth.uid() OR auth.uid() = ANY(members))
    )
  );
```

---

### project_cards

```sql
CREATE TABLE project_cards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id        uuid NOT NULL REFERENCES project_boards(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  assignee_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  due_date        timestamptz,
  position        int NOT NULL DEFAULT 0,     -- Ordem dentro do board
  tags            text[] DEFAULT '{}',
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE project_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cards_project_members" ON project_cards
  FOR ALL USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM project_boards pb
      JOIN projects p ON p.id = pb.project_id
      WHERE pb.id = project_cards.board_id
        AND (p.owner_id = auth.uid() OR auth.uid() = ANY(p.members))
    )
  );
```

---

### marketplace_assets

```sql
CREATE TABLE marketplace_assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('wallpaper','theme','widget')),
  name            text NOT NULL,
  description     text,
  preview_url     text NOT NULL,              -- URL da imagem de preview no R2
  asset_url       text NOT NULL,              -- URL do arquivo do asset no R2
  tags            text[] DEFAULT '{}',
  rating_avg      numeric(3,2) DEFAULT 0,     -- Média calculada automaticamente
  rating_count    int DEFAULT 0,              -- Atualizado automaticamente
  download_count  int DEFAULT 0,
  is_published    boolean DEFAULT false,      -- Precisa aprovação para aparecer
  deleted_at      timestamptz,
  created_at      timestamptz DEFAULT now() NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE marketplace_assets ENABLE ROW LEVEL SECURITY;

-- Apenas assets publicados são visíveis para todos
CREATE POLICY "assets_select_published" ON marketplace_assets
  FOR SELECT USING (is_published = true AND deleted_at IS NULL OR author_id = auth.uid());

CREATE POLICY "assets_insert_own" ON marketplace_assets
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "assets_update_own" ON marketplace_assets
  FOR UPDATE USING (author_id = auth.uid());
```

---

### marketplace_ratings

```sql
CREATE TABLE marketplace_ratings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        uuid NOT NULL REFERENCES marketplace_assets(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating          int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         text,
  created_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE (asset_id, user_id)
);

ALTER TABLE marketplace_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_select" ON marketplace_ratings FOR SELECT USING (true);

CREATE POLICY "ratings_own" ON marketplace_ratings
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## TRIGGERS E FUNÇÕES

### updated_at automático (aplicar em todas as tabelas com updated_at)
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em cada tabela:
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_messages
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Repetir para: user_settings, conversations, posts, post_comments,
-- project_cards, marketplace_assets
```

### Criar user_status e user_settings ao criar usuário
```sql
CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir na tabela users (será populada depois pelo onboarding)
  INSERT INTO users (id, username, display_name)
  VALUES (NEW.id, '', '');

  -- Criar status inicial
  INSERT INTO user_status (user_id)
  VALUES (NEW.id);

  -- Criar settings com padrões
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION on_auth_user_created();
```

### Atualizar rating_avg ao avaliar asset
```sql
CREATE OR REPLACE FUNCTION update_asset_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_assets
  SET
    rating_avg = (SELECT ROUND(AVG(rating)::numeric, 2) FROM marketplace_ratings WHERE asset_id = NEW.asset_id),
    rating_count = (SELECT COUNT(*) FROM marketplace_ratings WHERE asset_id = NEW.asset_id)
  WHERE id = NEW.asset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rating_change
  AFTER INSERT OR UPDATE OR DELETE ON marketplace_ratings
  FOR EACH ROW EXECUTE FUNCTION update_asset_rating();
```

### Expirar stories automaticamente (via Supabase cron)
```sql
CREATE OR REPLACE FUNCTION expire_stories()
RETURNS void AS $$
BEGIN
  UPDATE stories
  SET deleted_at = now()
  WHERE expires_at < now() AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Agendar via Supabase Dashboard → Database → Cron Jobs
-- Frequência: a cada hora
```

---

## ÍNDICES

```sql
-- Mensagens por conversa (query mais frequente do app)
CREATE INDEX idx_messages_conversation_created
  ON messages(conversation_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_deleted_for_all = false;

-- Mensagens elegíveis para cold storage (background job diário)
CREATE INDEX idx_messages_hot
  ON messages(conversation_id, updated_at)
  WHERE cold_ref IS NULL AND deleted_at IS NULL AND is_pinned = false;

-- Badge de não lidas (query frequente)
CREATE INDEX idx_message_reads_user
  ON message_reads(user_id, message_id);

-- Posts do feed (por usuário seguido)
CREATE INDEX idx_posts_user_created
  ON posts(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Notificações não lidas
CREATE INDEX idx_notifications_unread
  ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

-- Stories ativos (exibir anel no avatar)
CREATE INDEX idx_stories_active
  ON stories(user_id, created_at DESC)
  WHERE deleted_at IS NULL AND expires_at > now();

-- Follows (para feed, visibilidade de posts/stories)
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Status de usuário (presença em tempo real)
CREATE INDEX idx_user_status ON user_status(user_id);

-- Membros de conversa (validar acesso)
CREATE INDEX idx_conv_members_user
  ON conversation_members(user_id, conversation_id);

-- Mensagens fixadas por conversa
CREATE INDEX idx_messages_pinned
  ON messages(conversation_id)
  WHERE is_pinned = true;
```

---

## REALTIME — CANAIS HABILITADOS

Habilitar Realtime nestas tabelas no Supabase Dashboard → Database → Replication:

| Tabela | Eventos | Canal Frontend |
|---|---|---|
| messages | INSERT, UPDATE, DELETE | `conversation:{id}` |
| message_reactions | INSERT, DELETE | `conversation:{id}` |
| message_reads | INSERT | `conversation:{id}` |
| user_status | UPDATE | `presence:global` |
| notifications | INSERT | `notifications:{user_id}` |
| posts | INSERT, UPDATE | `feed:global` |
| post_reactions | INSERT, DELETE | `post:{id}` |
| post_comments | INSERT, UPDATE, DELETE | `post:{id}` |
| stories | INSERT, DELETE | `stories:{user_id}` |
| project_cards | INSERT, UPDATE, DELETE | `project:{id}` |
| conversation_members | INSERT, UPDATE | `conversation:{id}` |
| user_settings | UPDATE | `settings:{user_id}` |


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: DEPENDENCIES.md
# ==========================================

# DEPENDENCIES.md — Versões Exatas dos Pacotes

> **ATENÇÃO PARA A IA:** Use EXATAMENTE estas versões. Não atualizar. Não substituir por alternativas. Estas versões foram escolhidas por serem compatíveis entre si. Usar versões diferentes pode quebrar o projeto de formas difíceis de debugar.

---

## package.json — Frontend

```json
{
  "name": "social-os",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "tauri": "tauri"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.3",
    "@tauri-apps/api": "^2.1.1",
    "@tauri-apps/plugin-deep-link": "^2.0.0",
    "@tauri-apps/plugin-global-shortcut": "^2.0.1",
    "@tauri-apps/plugin-window-state": "^2.0.1",
    "i18next": "^23.7.16",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^14.0.5",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.1.0",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.12"
  }
}
```

---

## Cargo.toml — Rust (src-tauri/Cargo.toml)

```toml
[package]
name = "social-os"
version = "0.1.0"
description = "Social OS Desktop App"
authors = ["you"]
edition = "2021"

[lib]
name = "social_os_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2.0.3", features = [] }

[dependencies]
tauri = { version = "2.1.1", features = ["tray-icon", "image-png"] }
tauri-plugin-window-state = "2.0.1"
tauri-plugin-global-shortcut = "2.0.1"
tauri-plugin-deep-link = "2.0.0"
window-vibrancy = "0.5.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
zstd = "0.13.0"          # compressão cold storage
sysinfo = "0.30.5"       # leitura de CPU, RAM, processos
tokio = { version = "1", features = ["full"] }   # async runtime

[features]
custom-protocol = ["tauri/custom-protocol"]
```

---

## vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // Tauri precisa de porta fixa
  server: {
    port: 1420,
    strictPort: true,
    host: '0.0.0.0',
  },
  // Tauri usa variáveis de ambiente com prefixo VITE_
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // Tauri suporta apenas ES modules
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "useDefineForClassFields": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Por que essas versões

| Pacote | Motivo da versão |
|---|---|
| `tauri ^2.1.1` | Tauri 2 estável com suporte a múltiplas janelas e plugins v2 |
| `window-vibrancy 0.5.0` | Compatível com Tauri 2 — versões anteriores são para Tauri 1 |
| `@supabase/supabase-js ^2.39` | Versão com Realtime v2 estável |
| `zustand ^4.5` | Versão com suporte nativo a TypeScript sem boilerplate |
| `react ^18.3` | Hooks estáveis, Concurrent Mode, sem breaking changes do React 19 ainda |
| `i18next ^23` | Versão com React hooks maduros |
| `sysinfo 0.30` | API estável para leitura de processos e hardware |
| `zstd 0.13` | Versão com API síncrona e assíncrona |

---

## Instalação

```bash
# 1. Instalar dependências Node
npm install

# 2. Instalar Rust (se não tiver)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 3. Instalar Tauri CLI
npm install -g @tauri-apps/cli@2.1.0

# 4. Rodar em desenvolvimento
npm run tauri dev
```

---

## PROIBIDO — Nunca instalar estas alternativas

| Proibido | Razão |
|---|---|
| `electron` | Projeto usa Tauri — não misturar |
| `react-dnd` ou `dnd-kit` | Drag implementado do zero (ver SCOPE.md seção 6) |
| `styled-components` ou `@emotion` | Projeto usa CSS Modules |
| `tailwindcss` | Projeto usa CSS Modules |
| `redux` ou `@reduxjs/toolkit` | Projeto usa Zustand |
| `axios` | Usar fetch nativo ou cliente Supabase |
| `react-query` ou `@tanstack/query` | Estado gerenciado pelo Zustand + Supabase Realtime |
| `socket.io` | Real-time via Supabase Realtime |
| `@radix-ui` ou `shadcn` | Componentes construídos do zero |
| `framer-motion` | Animações via CSS (ver ANIMATIONS.md) |
| `react-router-dom` | Navegação via Zustand store (não tem rotas de URL) |


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: ERROR_HANDLING.md
# ==========================================

# ERROR_HANDLING.md — Estratégia de Erros

> **ATENÇÃO PARA A IA:** Todo erro no app deve ser tratado. NUNCA deixar um `catch` vazio. NUNCA deixar um erro sem feedback para o usuário. NUNCA usar `console.error` como substituto de tratamento. Este documento define exatamente o que fazer com cada tipo de erro.

---

## PRINCÍPIOS

1. **Todo erro tem um dono** — cada camada trata o que é sua responsabilidade
2. **Erros de UI não derrubam o app** — Error Boundaries por módulo
3. **Erros de rede têm retry** — via offline queue (ver PATTERNS.md)
4. **Erros mostram feedback útil** — mensagem que o usuário entende, não stack trace
5. **Erros são logados** — para debugging, mas nunca expostos ao usuário

---

## CAMADAS DE TRATAMENTO

```
Erro acontece
    ↓
1. Service Layer (supabase/R2) → trata erros de rede e auth
    ↓
2. Store Layer (Zustand) → trata erros de negócio, optimistic rollback
    ↓
3. Hook Layer → transforma erros em estado
    ↓
4. Component Layer → exibe feedback (toast, empty state, erro inline)
    ↓
5. Error Boundary → captura erros inesperados que passaram por tudo acima
```

---

## 1. SERVICE LAYER — Erros do Supabase

```ts
// Em: src/services/message.service.ts
// Padrão para TODOS os services

import { supabase } from '@/config/supabase'
import type { Message } from '@/types/message.types'

// Tipo de retorno padronizado — NUNCA lançar exceções nos services
// Sempre retornar { data, error }
type ServiceResult<T> = { data: T; error: null } | { data: null; error: AppError }

export const messageService = {
  async send(
    conversationId: string,
    content: string
  ): Promise<ServiceResult<Message>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, content, sender_id: supabase.auth.getUser() })
        .select()
        .single()

      if (error) {
        return { data: null, error: mapSupabaseError(error) }
      }

      return { data, error: null }

    } catch (err) {
      // Erro de rede (sem conexão, timeout)
      return { data: null, error: { type: 'network', message: 'Sem conexão com o servidor' } }
    }
  }
}
```

### Mapeamento de erros do Supabase para mensagens do usuário

```ts
// Em: src/utils/errors.ts

export interface AppError {
  type: 'network' | 'auth' | 'permission' | 'not_found' | 'validation' | 'server' | 'unknown'
  message: string        // Mensagem para o usuário (em português)
  technical?: string     // Detalhes técnicos (para log, não para o usuário)
}

export function mapSupabaseError(error: { code?: string; message: string }): AppError {
  // Erros de autenticação
  if (error.code === 'PGRST301' || error.code === '401') {
    return { type: 'auth', message: 'Sessão expirada. Faça login novamente.', technical: error.message }
  }

  // Sem permissão (RLS bloqueou)
  if (error.code === '42501' || error.code === 'PGRST116') {
    return { type: 'permission', message: 'Você não tem permissão para esta ação.', technical: error.message }
  }

  // Registro não encontrado
  if (error.code === 'PGRST116') {
    return { type: 'not_found', message: 'Conteúdo não encontrado.', technical: error.message }
  }

  // Violação de constraint (único, FK)
  if (error.code === '23505') {
    return { type: 'validation', message: 'Este item já existe.', technical: error.message }
  }

  // Erro genérico do servidor
  return { type: 'server', message: 'Algo deu errado. Tente novamente.', technical: error.message }
}

// Log de erros (nunca expor ao usuário)
export function logError(context: string, error: AppError | Error): void {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error)
  }
  // Em produção: enviar para serviço de monitoramento (Sentry, etc.)
  // Por enquanto apenas suprimir em produção
}
```

---

## 2. STORE LAYER — Erros de negócio

```ts
// Em: src/store/modules/chat.store.ts
// Padrão de tratamento de erro no store

sendMessage: async (conversationId, content) => {
  const tempId = `temp_${crypto.randomUUID()}`

  // Optimistic update (ver PATTERNS.md)
  set(state => ({
    messages: [...state.messages, { id: tempId, content, status: 'sending' }]
  }))

  const { data, error } = await messageService.send(conversationId, content)

  if (error) {
    // Rollback do optimistic update
    set(state => ({
      messages: state.messages.map(m =>
        m.id === tempId ? { ...m, status: 'failed' } : m
      )
    }))

    // Log técnico
    logError('chat.store.sendMessage', error)

    // Se for erro de rede, adicionar à fila offline
    if (error.type === 'network') {
      useOfflineStore.getState().addToQueue({
        type: 'send_message',
        payload: { conversationId, content }
      })
      toast.warning('Sem conexão — mensagem será enviada quando reconectar')
      return
    }

    // Se for erro de auth, redirecionar para login
    if (error.type === 'auth') {
      useAuthStore.getState().logout()
      return
    }

    // Outros erros: mostrar toast
    toast.error(error.message)
    return
  }

  // Sucesso: substituir temp pelo real
  set(state => ({
    messages: state.messages.map(m =>
      m.id === tempId ? { ...data, status: 'sent' } : m
    )
  }))
}
```

---

## 3. ERROR BOUNDARIES — Erros de renderização React

```tsx
// Em: src/components/shared/ModuleErrorBoundary/ModuleErrorBoundary.tsx
// Envolve cada módulo para isolar crashes

import { Component, ReactNode, ErrorInfo } from 'react'
import { EmptyState } from '@/components/ui/EmptyState/EmptyState'
import { logError } from '@/utils/errors'

interface Props {
  moduleId: string
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(`ModuleErrorBoundary[${this.props.moduleId}]`, error)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <EmptyState
          icon="⚠️"
          title="Este módulo encontrou um erro"
          description="O resto do app continua funcionando normalmente"
          action={{ label: 'Tentar novamente', onClick: this.handleRetry }}
        />
      )
    }

    return this.props.children
  }
}
```

```tsx
// Usar em LayoutNode.tsx ao renderizar cada módulo
// NUNCA colocar apenas um Error Boundary para o app inteiro

<ModuleErrorBoundary moduleId={node.moduleId}>
  <ModuleWrapper moduleId={node.moduleId}>
    <DynamicModule moduleId={node.moduleId} />
  </ModuleWrapper>
</ModuleErrorBoundary>
```

---

## 4. TAURI COMMAND ERRORS — Erros do Rust

```ts
// Em: src/hooks/useHardware.ts
// Padrão para invoke() do Tauri

import { invoke } from '@tauri-apps/api/core'

export function useHardware() {
  const { setCpu, setGpu, setRam, setNetwork } = useHardwareStore()

  useEffect(() => {
    const poll = async () => {
      // Cada command tem seu próprio try/catch
      // Falha em um NÃO impede os outros de rodar

      try {
        const cpu = await invoke<number>('get_cpu_usage')
        setCpu(cpu)
      } catch (err) {
        // Hardware command falhou — manter último valor conhecido
        // NÃO mostrar toast (polling falha às vezes, não é crítico)
        logError('useHardware.getCpu', err as Error)
      }

      try {
        const gpu = await invoke<number>('get_gpu_usage')
        setGpu(gpu)
      } catch (err) {
        logError('useHardware.getGpu', err as Error)
      }

      // ... demais commands
    }

    const interval = setInterval(poll, HARDWARE_POLL_INTERVAL_MS)
    poll() // Primeira chamada imediata

    return () => clearInterval(interval)
  }, [])
}
```

```rust
// Padrão no Rust — todos os commands retornam Result<T, String>
// NUNCA usar unwrap() em commands — pode causar panic e matar o processo

#[tauri::command]
pub fn get_cpu_usage() -> Result<f32, String> {
    let mut system = sysinfo::System::new();
    system.refresh_cpu_all();

    let usage = system.global_cpu_usage();
    Ok(usage)
    // Se algo falhar internamente, retornar Err("mensagem descritiva")
    // O frontend receberá o Err como exception no invoke()
}
```

---

## 5. ERROS DE AUTH — Sessão expirada

```ts
// Em: src/config/supabase.ts
// Interceptor global para erros de auth

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Limpar estado e redirecionar para login
    useAuthStore.getState().clearSession()
    toast.info('Sua sessão expirou. Faça login novamente.')
  }
})
```

---

## 6. ERROS DE REDE — Estratégia completa

| Situação | Ação |
|---|---|
| Mutation offline (enviar msg, reagir) | Adicionar à fila offline + toast warning |
| Query offline (carregar msgs, feed) | Servir cache local + banner offline |
| Reconexão | Flush da fila + recarregar dados desatualizados |
| Ação na fila falha 3x | Descartar + toast error explicando |
| Ação na fila com 24h+ | Descartar silenciosamente |

---

## 7. ERROS DE UPLOAD (R2)

```ts
// Em: src/services/storage.service.ts

export async function uploadFile(
  path: string,
  file: File
): Promise<ServiceResult<string>> {
  // Validar tamanho antes de tentar upload
  const maxSize = getMaxSizeForPath(path)
  if (file.size > maxSize) {
    return {
      data: null,
      error: {
        type: 'validation',
        message: `Arquivo muito grande. Máximo: ${formatBytes(maxSize)}`
      }
    }
  }

  try {
    // Tentar upload
    const url = await uploadToR2(path, file, file.type)
    return { data: url, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        type: 'network',
        message: 'Falha ao enviar arquivo. Verifique sua conexão.',
        technical: String(err)
      }
    }
  }
}
```

---

## TABELA DE ERROS — O que mostrar para o usuário

| Tipo de erro | Toast | Ação automática |
|---|---|---|
| Rede (sem conexão) | "Sem conexão — ação salva para depois" (warning) | Adicionar à fila offline |
| Auth expirada | "Sessão expirada. Faça login novamente." (info) | Redirecionar para login |
| Sem permissão | "Você não tem permissão para esta ação." (error) | Nenhuma |
| Não encontrado | "Conteúdo não encontrado." (error) | Nenhuma |
| Validação (arquivo grande) | "Arquivo muito grande. Máximo: X MB." (error) | Nenhuma |
| Erro do servidor (5xx) | "Algo deu errado. Tente novamente." (error) | Nenhuma |
| Módulo crashou (React) | EmptyState com botão "Tentar novamente" | Nenhuma |
| Command Rust falhou | Nenhum (silencioso para hardware polling) | Manter último valor |

---

## O QUE NUNCA FAZER

```ts
// ❌ catch vazio
try {
  await sendMessage()
} catch {}

// ❌ console.error como tratamento
try {
  await sendMessage()
} catch (err) {
  console.error(err) // Isso não é tratamento
}

// ❌ Expor mensagem técnica ao usuário
toast.error(error.message) // error.message pode ser "violates foreign key constraint"

// ❌ Deixar estado inconsistente após erro
set({ messages: [...messages, tempMessage] })
await sendMessage() // se falhar, tempMessage fica para sempre no estado

// ❌ Múltiplos toasts para o mesmo erro
// (acontece quando o mesmo erro dispara em vários lugares)
// Solução: tratar no store, não nos componentes
```


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: GLOBAL_SEARCH.md
# ==========================================

GLOBAL_SEARCH.md — Janela Flutuante do Sistema

ATENÇÃO PARA A IA:
O Global Search é uma janela independente da main window.
NUNCA renderizar dentro de AppLayout.
NUNCA usar React Router.
NUNCA criar dinamicamente ao apertar atalho.
Ele deve existir desde o boot do app, apenas oculto.

1. ARQUITETURA

O Global Search é uma janela Tauri separada, com label: "search".

Ele não faz parte do layout tree, não pertence à main window e não é um overlay React.

Ele é um widget flutuante do sistema.

2. CRIAÇÃO DA JANELA
tauri.conf.json

A janela deve existir desde o startup.

{
  "label": "search",
  "title": "",
  "width": 680,
  "height": 500,
  "resizable": false,
  "decorations": false,
  "transparent": true,
  "alwaysOnTop": false,
  "visible": false,
  "skipTaskbar": true,
  "shadow": true,
  "center": true
}
Regras obrigatórias

visible: false

skipTaskbar: true

decorations: false

transparent: true

alwaysOnTop: false no boot

3. INICIALIZAÇÃO NO BOOT

A janela search deve ser criada junto com o app.

Ela NÃO deve ser criada dinamicamente ao pressionar o atalho.

No setup() do Tauri:

Aplicar Mica/Acrylic

Não dar foco

Não mostrar

4. ESTRUTURA DO FRONTEND

A janela search deve renderizar exclusivamente:

src/layouts/SearchOverlay/SearchOverlay.tsx
src/components/shared/GlobalSearch/GlobalSearch.tsx

Estrutura:

<SearchOverlay>
  <GlobalSearch />
</SearchOverlay>

Nunca usar React Router.

5. STORE GLOBAL

Criar:

src/store/search.store.ts
src/hooks/useSearch.ts

O store controla:

query

resultados

loading

histórico recente

A UI do search vive apenas na window search.

6. ATALHO GLOBAL

Atalho obrigatório:

Ctrl + Alt + Space

Registrado via tauri-plugin-global-shortcut.

7. COMPORTAMENTO DO TOGGLE
Ao abrir

show()

unminimize()

set_always_on_top(true)

set_focus()

posicionar horizontalmente centralizado

posicionar top: 20px

focar automaticamente o input

Ao fechar

hide()

set_always_on_top(false)

8. POSICIONAMENTO

A janela deve abrir:

Centralizada horizontalmente

20px abaixo do topo da tela

Exemplo lógico:

x = (screen_width - window_width) / 2
y = 20

Nunca usar CSS para posicionamento da window.

Posicionamento é responsabilidade do backend.

9. FECHAMENTO AUTOMÁTICO

A janela deve fechar quando:

Usuário pressiona ESC

Usuário clica fora

Usuário troca de foco para outra janela

10. PROIBIDO

❌ Renderizar dentro de AppLayout
❌ Usar React Router para /search
❌ Criar dinamicamente via WebviewWindow::new no atalho
❌ Deixar alwaysOnTop ativo permanentemente
❌ Mostrar no boot
❌ Aparecer na taskbar
❌ Depender do layout tree

11. FASE DO PROJETO

O Global Search faz parte da FASE 0 — Fundação do Projeto.

Ele é infraestrutura do sistema, não feature de produto.

12. MOTIVO ARQUITETURAL

O Global Search é um componente de sistema:

Funciona independente do módulo ativo

Funciona mesmo se layout estiver quebrado

Funciona mesmo se usuário estiver offline

É equivalente ao Spotlight (macOS) ou PowerToys Run (Windows)

Por isso ele não pertence à main window.

13. RESUMO DEFINITIVO

✔ Janela separada
✔ Criada no boot
✔ Inicia oculta
✔ Toggle via atalho global
✔ Foco automático
✔ Top 20px
✔ Não usa router
✔ Não é overlay React
✔ Parte da Fase 0

# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: PATTERNS.md
# ==========================================

# PATTERNS.md — Padrões Obrigatórios de Desenvolvimento

> **ATENÇÃO PARA A IA:** Estes padrões são OBRIGATÓRIOS. Todo código gerado deve seguir estes padrões sem exceção. Não inventar alternativas. Não "simplificar" removendo partes. Se tiver dúvida sobre como aplicar um padrão, consultar os exemplos de código aqui.

---

## 1. OPTIMISTIC UPDATES

### O que é
Quando o usuário faz uma ação (enviar mensagem, reagir, postar), a UI atualiza IMEDIATAMENTE sem esperar o servidor confirmar. Se o servidor falhar, a UI reverte.

### Por que usar
Faz o app parecer instantâneo mesmo com latência de rede. É o padrão de apps modernos como WhatsApp e Twitter.

### Quando usar
TODA ação que grava no banco de dados deve ser otimista. Sem exceção.

### Quando NÃO usar
Leituras de dados (GET) — essas não precisam de optimistic update.

### O fluxo obrigatório
```
1. Usuário executa ação
2. Gerar ID temporário: const tempId = `temp_${crypto.randomUUID()}`
3. Criar objeto com { ...dados, id: tempId, status: 'sending' }
4. Adicionar ao estado LOCAL imediatamente (sem await)
5. Fazer a chamada assíncrona ao Supabase
6. Sucesso: substituir o objeto temp pelo objeto real do servidor
7. Falha: remover o objeto temp do estado, exibir toast de erro
```

### Hook useOptimistic — implementação de referência
```ts
// Em: src/hooks/useOptimistic.ts

import { useState } from 'react'
import toast from '../utils/toast' // wrapper do sistema de toast do app

interface OptimisticOptions<T> {
  onSuccess?: (result: T) => void
  onError?: (error: Error) => void
  errorMessage?: string
}

export function useOptimistic<T>(
  serverAction: () => Promise<T>,
  rollback: () => void,
  options?: OptimisticOptions<T>
) {
  const [isPending, setIsPending] = useState(false)

  const execute = async () => {
    setIsPending(true)
    try {
      const result = await serverAction()
      options?.onSuccess?.(result)
      return result
    } catch (error) {
      rollback()
      toast.error(options?.errorMessage ?? 'Algo deu errado. Tente novamente.')
      options?.onError?.(error as Error)
    } finally {
      setIsPending(false)
    }
  }

  return { execute, isPending }
}
```

### Exemplo de uso: enviar mensagem
```ts
// Em: src/store/modules/chat.store.ts

sendMessage: async (conversationId: string, content: string) => {
  const tempId = `temp_${crypto.randomUUID()}`

  // PASSO 1: Adiciona na UI imediatamente
  const tempMessage: Message = {
    id: tempId,
    conversation_id: conversationId,
    sender_id: get().currentUserId,
    content,
    created_at: new Date().toISOString(),
    status: 'sending', // UI mostra indicador de carregamento
    // demais campos...
  }
  set(state => ({ messages: [...state.messages, tempMessage] }))

  try {
    // PASSO 2: Persiste no servidor
    const savedMessage = await messageService.send(conversationId, content)

    // PASSO 3: Substitui o temp pelo real
    set(state => ({
      messages: state.messages.map(m =>
        m.id === tempId ? { ...savedMessage, status: 'sent' } : m
      )
    }))
  } catch (error) {
    // PASSO 4: Reverte e notifica
    set(state => ({
      messages: state.messages.map(m =>
        m.id === tempId ? { ...m, status: 'failed' } : m
      )
    }))
    // status: 'failed' → UI mostra botão "Toque para reenviar"
  }
}
```

### Status de mensagem na UI
| Status | O que mostrar |
|---|---|
| `sending` | Relógio pequeno ou spinner ao lado do horário |
| `sent` | ✓ (checkmark único) |
| `read` | ✓✓ (dois checkmarks) |
| `failed` | Ícone de erro + "Toque para reenviar" |

---

## 2. OFFLINE MODE

### Detecção de conexão
```ts
// Em: src/hooks/useOffline.ts
// NUNCA usar navigator.onLine diretamente — é pouco confiável
// Usar combinação de navigator.onLine + teste de conexão real

import { useEffect } from 'react'
import { useOfflineStore } from '@/store/offline.store'

export function useOffline() {
  const { setOnline, setOffline, flushQueue } = useOfflineStore()

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Tenta conectar ao Supabase — se falhar, está offline
        await fetch('https://seu-projeto.supabase.co/health', {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(3000)
        })
        setOnline()
        await flushQueue() // Processa ações pendentes
      } catch {
        setOffline()
      }
    }

    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', setOffline)

    return () => {
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('offline', setOffline)
    }
  }, [])
}
```

### Fila de ações offline
```ts
// Em: src/store/offline.store.ts

interface QueuedAction {
  id: string
  type: 'send_message' | 'edit_message' | 'send_reaction' | 'create_post' | 'update_card'
  payload: Record<string, unknown>
  created_at: number   // timestamp em ms
  retry_count: number  // quantas vezes tentou reenviar
}

interface OfflineState {
  isOnline: boolean
  isSyncing: boolean
  queue: QueuedAction[]

  setOnline: () => void
  setOffline: () => void
  addToQueue: (action: Omit<QueuedAction, 'id' | 'created_at' | 'retry_count'>) => void
  flushQueue: () => Promise<void>  // Processa a fila ao reconectar
  removeFromQueue: (id: string) => void
}
```

### Persistência da fila no Tauri filesystem
```ts
// A fila deve ser persistida em disco para sobreviver a reinicializações do app
// Usar invoke() do Tauri para ler/escrever arquivo JSON

import { invoke } from '@tauri-apps/api/core'

// Salvar fila
await invoke('save_offline_queue', { queue: JSON.stringify(queue) })

// Carregar fila ao iniciar o app
const saved = await invoke<string>('load_offline_queue')
const queue: QueuedAction[] = JSON.parse(saved || '[]')
```

### Regras da fila
- Ações com mais de 24h na fila são DESCARTADAS com toast de aviso
- Máximo de 3 tentativas por ação
- Processar em ordem FIFO (primeiro a entrar, primeiro a sair)
- Se uma ação falhar 3x, descartar e notificar o usuário

### Módulos por comportamento offline
| Módulo | Comportamento offline |
|---|---|
| Chat | Lê cache local. Msgs novas vão para a fila. |
| Feed | Lê posts em cache. Não carrega novos. |
| Music | Toca músicas baixadas localmente. |
| MotionWallpaper | Usa wallpapers já instalados. |
| Performance Governor | Funciona normalmente (local). |
| Projects | Lê boards em cache. Edições vão para a fila. |
| Browser | Não funciona — mostra EmptyState de sem conexão. |
| Live | Não funciona — mostra EmptyState. |
| RemoteShare | Não funciona — mostra EmptyState. |
| ScreenShare | Não funciona — mostra EmptyState. |

### Indicador visual de conexão
```tsx
// Em: src/components/shared/OfflineBanner/OfflineBanner.tsx
// Renderizado no AppLayout.tsx, acima do conteúdo principal

// Estados:
// isOnline = true → não renderizar nada (estado normal)
// isOnline = false → "Sem conexão — trabalhando offline"
// isOnline = true && isSyncing = true → "Sincronizando X ações pendentes..."
// reconectando → "Reconectando..."
```

---

## 3. EMPTY STATES & LOADING

### Skeleton Screens — regras obrigatórias
- Todo componente que carrega dados DEVE mostrar skeleton enquanto carrega
- NUNCA mostrar tela em branco, loader girando ou "Carregando..."
- O skeleton deve ter a mesma forma visual do conteúdo real (mesmo height, mesmo layout)
- Animação: pulse de opacidade, de `#0a0a0a` para `#141414`, ciclo de 1.5s

```tsx
// Em: src/components/ui/Skeleton/Skeleton.tsx

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 'var(--radius-module)',
  className
}: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{ width, height, borderRadius }}
    />
  )
}
```

```css
/* Skeleton.module.css */
.skeleton {
  background: #0a0a0a;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { background: #0a0a0a; }
  50% { background: #141414; }
}
```

### Empty States — componente obrigatório
Quando não há dados, SEMPRE usar o componente EmptyState. Nunca renderizar null ou div vazia.

```tsx
// Em: src/components/ui/EmptyState/EmptyState.tsx

interface EmptyStateProps {
  icon: string           // emoji ou componente de ícone
  title: string          // texto principal
  description?: string   // texto secundário opcional
  action?: {
    label: string
    onClick: () => void
  }
}
```

### Tabela de empty states do app
| Contexto | icon | title | description | action |
|---|---|---|---|---|
| Sem conversas | 💬 | "Nenhuma conversa ainda" | "Busque alguém para começar" | "Iniciar conversa" |
| Sem msgs na DM | 👋 | "Início da conversa" | "Diga oi!" | — |
| Busca sem resultado | 🔍 | `Nenhum resultado para "{query}"` | — | — |
| Sem posts no feed | 📰 | "Nada por aqui ainda" | "Siga pessoas para ver posts" | "Explorar" |
| Sem stories | ○ | "Sem stories hoje" | — | "Criar story" |
| Sem notificações | 🔔 | "Você está em dia!" | — | — |
| Sem projetos | 📋 | "Nenhum projeto ainda" | — | "Criar projeto" |
| Excluídos vazio | 🗑️ | "Nenhuma mensagem excluída" | — | — |
| Sem conexão (módulo) | 📡 | "Sem conexão" | "Este módulo precisa de internet" | — |
| Erro genérico | ⚠️ | "Algo deu errado" | "Tente novamente" | "Tentar novamente" |

---

## 4. COMUNICAÇÃO ENTRE MÓDULOS — EVENT BUS

### A regra mais importante
**Módulos NUNCA se comunicam diretamente.** Nenhum módulo importa de outro. Toda comunicação cross-módulo passa pelo `events.store.ts`.

### Por que isso é crítico
Sem esse padrão, o código vira uma teia de importações circulares impossível de manter. Com o event bus, cada módulo só conhece os eventos, nunca os outros módulos.

### events.store.ts — implementação completa
```ts
// Em: src/store/events.store.ts
// NUNCA usar EventEmitter do Node, CustomEvent do DOM, ou qualquer outra solução
// Usar APENAS este store para eventos cross-módulo

import { create } from 'zustand'
import type { AppEvent, EventType } from '@/types/event.types'

interface EventsState {
  emit: (type: EventType, payload?: unknown) => void
  on: (type: EventType, handler: (payload: unknown) => void) => () => void
  // retorna função de cleanup para usar no useEffect
}

export const useEventsStore = create<EventsState>((set, get) => {
  const listeners = new Map<EventType, Set<(payload: unknown) => void>>()

  return {
    emit: (type, payload) => {
      const handlers = listeners.get(type)
      handlers?.forEach(handler => handler(payload))
    },
    on: (type, handler) => {
      if (!listeners.has(type)) {
        listeners.set(type, new Set())
      }
      listeners.get(type)!.add(handler)

      // Retorna função de cleanup
      return () => {
        listeners.get(type)?.delete(handler)
      }
    }
  }
})
```

### event.types.ts — todos os eventos do app
```ts
// Em: src/types/event.types.ts
// Adicionar novo EventType AQUI quando precisar de nova comunicação cross-módulo
// NUNCA criar eventos fora deste tipo

export type EventType =
  // Música
  | 'music:playing'             // Music inicia → Profile Core, BottomBar
  | 'music:paused'              // Music pausa → Profile Core
  | 'music:stopped'             // Music para → Profile Core, BottomBar

  // Games
  | 'games:detected'            // Rust detecta jogo → Profile Core, BottomBar, Governor
  | 'games:closed'              // Jogo fechado → Profile Core, BottomBar, Governor

  // Live
  | 'live:watching'             // Usuário assistindo live → Profile Core
  | 'live:stopped'              // Parou de assistir → Profile Core

  // Screen / Remote Share
  | 'screenshare:started'       // ScreenShare inicia → BottomBar, ChatDM
  | 'screenshare:stopped'       // ScreenShare para → BottomBar, ChatDM
  | 'remoteshare:started'       // RemoteShare inicia → BottomBar
  | 'remoteshare:stopped'       // RemoteShare para → BottomBar

  // Presença
  | 'presence:changed'          // Status mudou → Profile Core, BottomBar

  // Tema
  | 'theme:changed'             // Tema trocado → aplica em todo o app

  // Layout
  | 'module:open-as-widget'     // Abre módulo como janela separada
  | 'module:dock'               // Recolhe módulo de volta ao layout

  // Offline
  | 'offline:queue:action'      // Ação adicionada à fila offline
  | 'offline:queue:flush'       // Reconectou — processar fila

  // Performance Governor
  | 'governor:high-cpu'         // CPU alta → MotionWallpaper pausa
  | 'governor:cpu-normal'       // CPU voltou ao normal → MotionWallpaper retoma

export interface AppEvent {
  type: EventType
  payload?: unknown
  timestamp: number
}

// Tipos dos payloads por evento
export interface MusicPlayingPayload {
  name: string
  artist: string
  albumArt?: string
}

export interface GamesDetectedPayload {
  name: string
  processId: number
  cpuUsage: number
}

export interface ThemeChangedPayload {
  theme: 'dark' | 'light' | `custom-${string}`
}
```

### Como emitir um evento (exemplo no módulo Music)
```ts
// Em: src/store/modules/music.store.ts
import { useEventsStore } from '@/store/events.store'
import type { MusicPlayingPayload } from '@/types/event.types'

// Ao iniciar reprodução:
const { emit } = useEventsStore.getState()
emit('music:playing', {
  name: 'God\'s Plan',
  artist: 'Drake',
  albumArt: 'https://...'
} as MusicPlayingPayload)
```

### Como escutar um evento (exemplo no Profile Core)
```ts
// Em: src/components/profile/ProfileStatus/ProfileStatus.tsx
import { useEffect } from 'react'
import { useEventsStore } from '@/store/events.store'
import type { MusicPlayingPayload } from '@/types/event.types'

export function ProfileStatus({ userId }: { userId: string }) {
  const { on } = useEventsStore()

  useEffect(() => {
    // Escutar e retornar cleanup (OBRIGATÓRIO para evitar memory leak)
    const unsubscribe = on('music:playing', (payload) => {
      const { name, artist } = payload as MusicPlayingPayload
      // Atualizar status local
    })

    return unsubscribe // Zustand cleanup automático ao desmontar
  }, [on])
}
```

---

## 5. DEEP LINKING

### Protocolo: `app://`

O app registra o protocolo `app://` no Tauri. Links neste formato abrem o módulo correto.

### Tabela completa de rotas
| URL | Destino | Parâmetros |
|---|---|---|
| `app://chat` | Chat — Home | — |
| `app://chat/@{username}` | ChatDM com o usuário | username |
| `app://profile/@{username}` | ChatProfile do usuário | username |
| `app://post/{id}` | Post específico no Feed | id |
| `app://story/{id}` | Story específico | id |
| `app://project/{id}` | Projeto específico | id |
| `app://project/{id}/card/{card_id}` | Card específico | id, card_id |
| `app://marketplace/{id}` | Asset no Marketplace | id |
| `app://settings` | Settings — primeira seção | — |
| `app://settings/{section}` | Settings — seção específica | section |

### Implementação no Rust (tauri.conf.json)
```json
{
  "plugins": {
    "deep-link": {
      "mobile": [],
      "desktop": ["app"]
    }
  }
}
```

### Handler no frontend
```ts
// Em: src/hooks/useDeepLink.ts
import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { deepLinkParser } from '@/utils/deep-link'

export function useDeepLink() {
  useEffect(() => {
    const unlisten = onOpenUrl((urls) => {
      urls.forEach(url => {
        const route = deepLinkParser(url) // Parseia app://chat/@ana → { module: 'chat', params: { username: 'ana' } }
        // Emitir evento para abrir o módulo correto
        useEventsStore.getState().emit('module:navigate', route)
      })
    })

    return () => { unlisten.then(fn => fn()) }
  }, [])
}
```

---

## 6. ATALHOS DE TECLADO

### Atalhos globais (funcionam em qualquer contexto, mesmo app em background)
Registrados via `tauri-plugin-global-shortcut` no Rust.

| Atalho | Ação |
|---|---|
| `Ctrl + Alt + Space` | Abre/fecha Global Search |

### Atalhos dentro do app (quando app está focado)
Registrados via `useShortcuts.ts` no frontend.

**Globais dentro do app:**
| Atalho | Ação |
|---|---|
| `Ctrl + Alt + C` | Focar módulo Chat |
| `Ctrl + Alt + F` | Focar módulo Feed |
| `Ctrl + Alt + M` | Focar módulo Music |
| `Ctrl + Alt + G` | Focar módulo Games |
| `Ctrl + Alt + N` | Abrir Notifications |
| `Ctrl + Alt + S` | Abrir Settings |
| `Ctrl + /` | Abrir menu de atalhos |

**Dentro do Chat:**
| Atalho | Ação |
|---|---|
| `Ctrl + K` | Buscar conversa |
| `Enter` | Enviar mensagem |
| `Shift + Enter` | Quebra de linha no input |
| `Esc` | Fechar contexto atual / voltar |
| `Ctrl + F` | Buscar dentro da conversa |

**Dentro do Layout:**
| Atalho | Ação |
|---|---|
| `Ctrl + \` | Dividir painel ativo verticalmente |
| `Ctrl + Shift + \` | Dividir painel ativo horizontalmente |
| `Ctrl + W` | Fechar painel ativo |
| `Ctrl + Shift + S` | Salvar layout atual |

### Como registrar atalhos no frontend
```ts
// Em: src/hooks/useShortcuts.ts
// Centralizar TODOS os atalhos aqui — nunca usar onKeyDown em componentes individuais

import { useEffect } from 'react'

type ShortcutHandler = () => void

const shortcuts: Record<string, ShortcutHandler> = {}

export function useShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = buildShortcutKey(e) // ex: 'ctrl+alt+c'
      shortcuts[key]?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}

export function registerShortcut(key: string, handler: ShortcutHandler) {
  shortcuts[key] = handler
}
```

### Menu de atalhos
- Acessível via `Ctrl + /` ou botão na BottomBar
- Lista todos os atalhos disponíveis no contexto atual
- Usuário pode customizar atalhos em Settings → Atalhos
- Atalhos customizados salvos em `user_settings.shortcuts` no Supabase

---

## 7. SISTEMA DE TEMAS

### Como trocar de tema
```ts
// Em: src/hooks/useTheme.ts
// NUNCA manipular classList diretamente fora deste hook

export function useTheme() {
  const { theme, setTheme } = useThemeStore()

  const applyTheme = (newTheme: string) => {
    // Troca o atributo data-theme no elemento raiz
    document.documentElement.setAttribute('data-theme', newTheme)
    setTheme(newTheme)
    // Salvar no Supabase via user_settings
  }

  const applyCustomTheme = (themeId: string, cssVars: string) => {
    // Injeta CSS do tema do Marketplace dinamicamente
    let styleEl = document.getElementById(`theme-${themeId}`)
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = `theme-${themeId}`
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = cssVars
    applyTheme(`custom-${themeId}`)
  }

  return { theme, applyTheme, applyCustomTheme }
}
```

---

## 8. TOAST NOTIFICATIONS — SISTEMA DE FEEDBACK

### Posição e comportamento
- Posição: canto inferior esquerdo, acima da BottomBar
- Máximo 3 toasts simultâneos (empilhados)
- Duração: success/info = 3s, error/warning = 5s
- Nunca bloquear interação do usuário
- Nunca usar `alert()` ou `confirm()` do browser

### API do sistema de toast
```ts
// Em: src/utils/toast.ts

const toast = {
  success: (message: string) => { /* ... */ },
  error: (message: string) => { /* ... */ },
  info: (message: string) => { /* ... */ },
  warning: (message: string) => { /* ... */ },
}

export default toast

// Uso:
toast.success('Mensagem enviada')
toast.error('Falha ao enviar. Toque para reenviar.')
toast.warning('Sem conexão — mensagem salva para envio posterior')
```

### Ações destrutivas — confirmação obrigatória
Para ações irreversíveis (excluir conversa, deletar conta, excluir post), SEMPRE pedir confirmação:

```
Modal simples:
- Título: "Excluir conversa?"
- Descrição: breve explicação do que vai acontecer
- Botão "Cancelar" (secundário)
- Botão "Excluir" (destrutivo, cor --status-dnd)
```

**NUNCA usar:**
- `window.confirm()`
- Checkboxes de confirmação "Tem certeza?"
- Múltiplos cliques de confirmação

---

## 9. TAURI COMMANDS — PADRÃO DE COMUNICAÇÃO COM RUST

### Como chamar um command Rust do frontend
```ts
// SEMPRE usar invoke com tipagem explícita
import { invoke } from '@tauri-apps/api/core'

// Buscar CPU usage
const cpuUsage = await invoke<number>('get_cpu_usage')

// Buscar jogos ativos
const activeGame = await invoke<string | null>('get_active_game')

// NUNCA deixar sem tratamento de erro
try {
  const result = await invoke<T>('command_name', { param: value })
} catch (error) {
  // Tratar o erro — nunca silenciar com catch vazio
  console.error('Command failed:', error)
  toast.error('Falha ao comunicar com o sistema.')
}
```

### Padrão dos commands no Rust
```rust
// Em: src-tauri/src/commands/hardware.rs
// Sempre retornar Result<T, String> — nunca panick

#[tauri::command]
pub fn get_cpu_usage() -> Result<f32, String> {
  // implementação
  Ok(cpu_percent)
}

#[tauri::command]
pub fn get_active_game() -> Result<Option<String>, String> {
  // implementação
  Ok(game_name)
}
```

---

## 11. NAVEGAÇÃO — FLOWS INTERNOS (SEM ROTAS)

> **Regra:** Dentro do app principal, navegação não é feita por React Router.  
> A UI muda por **estado do módulo** e por **eventos globais** (`events.store.ts`).

### Quando usar "rotas"
- Apenas para **contextos globais** do app (ex: AuthScreen, Welcome/Onboarding, AppLayout).
- Nunca para telas internas de módulos (ex: "criar post", "criar story", "adicionar música").

### Padrão obrigatório: Flow state por módulo
Cada módulo que tem múltiplas telas internas deve ter um estado `view/flow` no store do próprio módulo:

- `Feed`: `home | compose | post`
- `Stories`: `home | compose | editor | viewer`
- `Music`: `home | library | add | playlist`
- `FavoriteGames`: `grid | details | add`

### Padrão obrigatório: Eventos de navegação
Os módulos não importam uns aos outros. Para abrir flows internos ou saltar entre módulos, usar eventos.

**Nomenclatura:**
- `feed:open`
- `feed:compose`
- `stories:compose`
- `music:add`
- `games:pin`
- `module:focus` (troca foco do painel para um módulo específico)

**Exemplo (conceitual):**
- Global Search seleciona "Criar post" → emite `feed:compose`
- Feed recebe evento → `feed.store.setView('compose')`

### Deep links
Deep links `socialos://...` são traduzidos em eventos internos (nunca em rotas internas).


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: phase-0.md
# ==========================================

# PHASE_0_FINAL.md — Fase 0 à Prova de Erros

> Baseado nos erros reais que aconteceram na execução anterior. Cada aviso abaixo
> é baseado em uma falha real documentada no log.

---

## OS 4 ERROS QUE ACONTECERAM — leia antes de começar

### ERRO 1 — tokens.css com conteúdo antes do @import
**Sintoma:** `[vite:css] @import must precede all other statements`  
**Causa:** AI colocou variáveis CSS antes do `@import` no tokens.css  
**Fix:** tokens.css deve ter EXATAMENTE 1 linha. Só o @import. Nada mais.

### ERRO 2 — dark.css corrompido pela ferramenta de patch
**Sintoma:** `Unclosed string` em dark.css linha 16  
**Causa:** A ferramenta de patch do Windsurf appenda texto como `*** End Patch***` após o `}` final  
**Fix:** Nunca usar patch parcial em arquivos CSS. Sempre deletar e recriar o arquivo inteiro.

### ERRO 3 — capabilities com `opener:default` inexistente
**Sintoma:** `Permission opener:default not found`  
**Causa:** AI adicionou `opener:default` que não existe no Tauri 2  
**Fix:** Usar APENAS as permissões listadas neste documento. Zero adições.

### ERRO 4 — tauri.conf.json com formatos errados
**Sintoma 4a:** `invalid type: map, expected unit` → `window-state` estava como objeto `{stateFlags: 31}`  
**Sintoma 4b:** `data did not match any variant of untagged enum DesktopProtocol` → `deep-link.desktop` era `["socialos"]` em vez de `{"schemes": ["socialos"]}`  
**Fix:** Copiar o tauri.conf.json EXATO deste documento. Sem alterar nenhum valor.

---

## REGRAS ABSOLUTAS

1. Cada passo cria/substitui **um único arquivo**
2. Copiar o conteúdo **exatamente** — sem adicionar comentários, sem remover linhas
3. CSS files: **nunca usar patch parcial** — sempre deletar e recriar completo
4. Após cada arquivo criado, rodar a **verificação indicada**
5. **Não avançar** se a verificação falhou

---

## PASSO 1 — Scaffold

```bash
cd D:\hub
npm create tauri-app@latest social-os -- --template react-ts
```

Quando pedir `Identifier`: digitar `com.socialos.app`  
Tudo mais: pressionar Enter (aceitar padrão)

**Verificação:**
```bash
dir D:\hub\social-os\src-tauri\tauri.conf.json
```
Deve listar o arquivo. Se não existir, o scaffold falhou — repetir.

---

## PASSO 2 — Instalar pacotes

```bash
cd D:\hub\social-os
npm install zustand@4.5.0 i18next@23.7.16 react-i18next@14.0.5 @supabase/supabase-js@2.39.3 @tauri-apps/plugin-global-shortcut@2.0.1 @tauri-apps/plugin-window-state@2.0.1 @tauri-apps/plugin-deep-link@2.0.0
```

**Verificação:**
```bash
findstr "zustand" D:\hub\social-os\package.json
```
Deve mostrar `"zustand": "4.5.0"`.

---

## PASSO 3 — package.json

Deletar o arquivo existente. Criar `D:\hub\social-os\package.json`.  
Conteúdo exato:

```json
{
  "name": "social-os",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "tauri": "tauri"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.3",
    "@tauri-apps/api": "^2.1.1",
    "@tauri-apps/plugin-deep-link": "^2.0.0",
    "@tauri-apps/plugin-global-shortcut": "^2.0.1",
    "@tauri-apps/plugin-window-state": "^2.0.1",
    "i18next": "^23.7.16",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-i18next": "^14.0.5",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.1.0",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.12"
  }
}
```

```bash
cd D:\hub\social-os && npm install
```

---

## PASSO 4 — vite.config.ts

Deletar o arquivo existente. Criar `D:\hub\social-os\vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: '0.0.0.0',
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
})
```

---

## PASSO 5 — tsconfig.json

Deletar o arquivo existente. Criar `D:\hub\social-os\tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "useDefineForClassFields": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## PASSO 6 — Criar pastas

```bash
mkdir D:\hub\social-os\src\styles\themes
mkdir D:\hub\social-os\src\i18n\locales
mkdir D:\hub\social-os\src\config
mkdir D:\hub\social-os\src\layouts\BottomBar
mkdir D:\hub\social-os\src\layouts\SearchOverlay
mkdir D:\hub\social-os\src\components\shared\GlobalSearch
mkdir D:\hub\social-os\src-tauri\capabilities
```

**Verificação:**
```bash
dir D:\hub\social-os\src\styles\themes
dir D:\hub\social-os\src-tauri\capabilities
```
Ambas as pastas devem existir.

---

## PASSO 7 — dark.css

> ⚠️ ATENÇÃO ESPECIAL — ERRO 2 ACONTECEU AQUI  
> Se usar patch parcial, a ferramenta vai appender lixo após o `}` quebrando o CSS.  
> **OBRIGATÓRIO:** Deletar qualquer dark.css existente. Criar o arquivo do zero.  
> O arquivo deve terminar exatamente no `}` da última linha. Nada depois.

Criar `D:\hub\social-os\src\styles\themes\dark.css`:

```css
:root[data-theme="dark"] {
  --bg-base: #000000;
  --bg-module: #020202;
  --bg-module-rgb: 2, 2, 2;
  --color-title: #FFFFFF;
  --color-subtitle: #7A7A7A;
  --status-online: #00FF66;
  --status-away: #FF7F50;
  --status-dnd: #C7001B;
  --status-offline: #7A7A7A;
  --radius-module: 20px;
  --radius-interactive: 100px;
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-skeleton: 1500ms;
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0.0, 1.0, 1);
  --ease-inout: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

**Verificação — rodar e inspecionar visualmente:**
```bash
type D:\hub\social-os\src\styles\themes\dark.css
```
A última linha visível deve ser `}`. Se aparecer qualquer texto depois (especialmente `*** End Patch***` ou `Function Execution`), o arquivo está corrompido. Deletar e recriar.

---

## PASSO 8 — light.css

Criar `D:\hub\social-os\src\styles\themes\light.css`:

```css
:root[data-theme="light"] {
  --bg-base: #F5F5F5;
  --bg-module: #FFFFFF;
  --bg-module-rgb: 255, 255, 255;
  --color-title: #0A0A0A;
  --color-subtitle: #6B6B6B;
  --status-online: #00CC55;
  --status-away: #E8722A;
  --status-dnd: #B00018;
  --status-offline: #9A9A9A;
  --radius-module: 20px;
  --radius-interactive: 100px;
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-skeleton: 1500ms;
  --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0.0, 1.0, 1);
  --ease-inout: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

**Verificação:**
```bash
type D:\hub\social-os\src\styles\themes\light.css
```
Última linha visível: `}`. Nada depois.

---

## PASSO 9 — tokens.css

> ⚠️ ATENÇÃO ESPECIAL — ERRO 1 ACONTECEU AQUI  
> Este arquivo deve ter EXATAMENTE 1 LINHA.  
> Apenas o `@import`. Sem variáveis. Sem comentários. Sem linhas em branco extras.  
> O erro `@import must precede all other statements` acontece quando tem qualquer  
> coisa antes do @import — incluindo linhas em branco no início do arquivo.

Criar `D:\hub\social-os\src\styles\tokens.css`:

```css
@import './themes/dark.css';
```

**Verificação:**
```bash
type D:\hub\social-os\src\styles\tokens.css
```
Deve mostrar APENAS a linha: `@import './themes/dark.css';`  
Se mostrar mais alguma coisa, deletar e recriar.

---

## PASSO 10 — global.module.css

Criar `D:\hub\social-os\src\styles\global.module.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--color-title);
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar {
  width: 0;
  height: 0;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## PASSO 11 — animations.css

Criar `D:\hub\social-os\src\styles\animations.css`:

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: translateY(0);   opacity: 1; }
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
```

---

## PASSO 12 — VERIFICAÇÃO CSS ← não pular

```bash
cd D:\hub\social-os && npm run build
```

**Esperado:** `✓ built in X.XXs`

**Se aparecer `@import must precede`:** tokens.css tem conteúdo antes do import → deletar e recriar o passo 9.  
**Se aparecer `Unclosed string` em dark.css:** dark.css tem lixo após o `}` → deletar e recriar o passo 7.  
**Qualquer outro erro de CSS:** identificar o arquivo no erro → deletar e recriar aquele arquivo.

**Não avançar se o build falhar.**

---

## PASSO 13 — .env

Criar `D:\hub\social-os\.env`:

```
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-key
VITE_R2_PUBLIC_URL=https://placeholder.r2.dev
```

---

## PASSO 14 — constants.ts

Criar `D:\hub\social-os\src\config\constants.ts`:

```ts
export const DRAG_THRESHOLD_PX = 8
export const DRAG_HANDLE_HEIGHT_DEFAULT = 5
export const DRAG_HANDLE_HEIGHT_REVEALED = 20
export const DRAG_HANDLE_CONTENT_SHIFT = 15
export const HARDWARE_POLL_INTERVAL_MS = 2000
export const TOAST_DURATION_SHORT = 3000
export const TOAST_DURATION_LONG = 5000
export const TOAST_MAX_VISIBLE = 3
export const STORY_EXPIRY_HOURS = 24
export const STORY_DEFAULT_DURATION_MS = 5000
export const LAYOUT_MIN_RATIO = 0.15
export const LAYOUT_MAX_RATIO = 0.85
export const PRESENCE_AWAY_AFTER_MS = 5 * 60 * 1000
export const COLD_STORAGE_DAYS = 30
export const MAX_MESSAGES_CACHE = 100
export const MAX_FEED_CACHE = 50
export const MAX_RETRY_COUNT = 3
export const QUEUE_EXPIRY_HOURS = 24
```

---

## PASSO 15 — supabase.ts

Criar `D:\hub\social-os\src\config\supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co'
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder'

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})
```

---

## PASSO 16 — i18n locales (3 arquivos)

Criar `D:\hub\social-os\src\i18n\locales\pt-BR.json`:

```json
{
  "search": {
    "placeholder": "Buscar pessoas, mensagens, músicas...",
    "navigate": "navegar",
    "open": "abrir",
    "close": "fechar"
  },
  "common": {
    "loading": "Carregando...",
    "error": "Algo deu errado. Tente novamente.",
    "retry": "Tentar novamente"
  }
}
```

Criar `D:\hub\social-os\src\i18n\locales\en-US.json`:

```json
{
  "search": {
    "placeholder": "Search people, messages, music...",
    "navigate": "navigate",
    "open": "open",
    "close": "close"
  },
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong. Try again.",
    "retry": "Try again"
  }
}
```

Criar `D:\hub\social-os\src\i18n\locales\es-ES.json`:

```json
{
  "search": {
    "placeholder": "Buscar personas, mensajes, música...",
    "navigate": "navegar",
    "open": "abrir",
    "close": "cerrar"
  },
  "common": {
    "loading": "Cargando...",
    "error": "Algo salió mal. Inténtalo de nuevo.",
    "retry": "Intentar de nuevo"
  }
}
```

---

## PASSO 17 — i18n/index.ts

Criar `D:\hub\social-os\src\i18n\index.ts`:

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ptBR from './locales/pt-BR.json'
import enUS from './locales/en-US.json'
import esES from './locales/es-ES.json'

i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    'en-US': { translation: enUS },
    'es-ES': { translation: esES },
  },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
})

export default i18n
```

---

## PASSO 18 — BottomBar.tsx

Criar `D:\hub\social-os\src\layouts\BottomBar\BottomBar.tsx`:

```tsx
export function BottomBar() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '48px',
        background: 'rgba(2, 2, 2, 0.95)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        zIndex: 1000,
      }}
    />
  )
}
```

---

## PASSO 19 — AppLayout.tsx

Criar `D:\hub\social-os\src\layouts\AppLayout.tsx`:

```tsx
import { BottomBar } from './BottomBar/BottomBar'

export function AppLayout() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'var(--bg-base, #000000)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <main style={{ flex: 1, overflow: 'hidden' }} />
      <BottomBar />
    </div>
  )
}
```

---

## PASSO 20 — GlobalSearch.module.css

Criar `D:\hub\social-os\src\components\shared\GlobalSearch\GlobalSearch.module.css`:

```css
.container {
  width: 640px;
  background: rgba(2, 2, 2, 0.88);
  border-radius: 20px;
  overflow: hidden;
}

.inputWrapper {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 56px;
  gap: 12px;
}

.icon {
  font-size: 22px;
  color: var(--color-subtitle, #7A7A7A);
  flex-shrink: 0;
}

.input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: var(--color-title, #ffffff);
  caret-color: var(--color-title, #ffffff);
}

.input::placeholder {
  color: var(--color-subtitle, #7A7A7A);
}

.clear {
  background: transparent;
  border: none;
  color: var(--color-subtitle, #7A7A7A);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  line-height: 1;
}

.clear:hover {
  color: var(--color-title, #ffffff);
}

.results {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  max-height: 380px;
  overflow-y: auto;
}

.resultsPlaceholder {
  padding: 16px;
  color: var(--color-subtitle, #7A7A7A);
  font-size: 14px;
}

.hints {
  display: flex;
  gap: 20px;
  padding: 10px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.hints span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-subtitle, #7A7A7A);
}

.hints kbd {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: monospace;
  border: none;
  color: var(--color-subtitle, #7A7A7A);
}
```

---

## PASSO 21 — GlobalSearch.tsx

Criar `D:\hub\social-os\src\components\shared\GlobalSearch\GlobalSearch.tsx`:

```tsx
import { RefObject, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import styles from './GlobalSearch.module.css'

interface GlobalSearchProps {
  inputRef: RefObject<HTMLInputElement>
}

export function GlobalSearch({ inputRef }: GlobalSearchProps) {
  const [query, setQuery] = useState('')

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('')
      try {
        await getCurrentWindow().hide()
      } catch {
        // fora do Tauri (browser dev) — ignorar
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <span className={styles.icon}>⌕</span>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Buscar pessoas, mensagens, músicas..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button className={styles.clear} onClick={() => setQuery('')}>
            ✕
          </button>
        )}
      </div>

      {query.length > 0 && (
        <div className={styles.results}>
          <p className={styles.resultsPlaceholder}>
            Buscando por "{query}"…
          </p>
        </div>
      )}

      <div className={styles.hints}>
        <span><kbd>↑↓</kbd> navegar</span>
        <span><kbd>Enter</kbd> abrir</span>
        <span><kbd>Esc</kbd> fechar</span>
      </div>
    </div>
  )
}
```

---

## PASSO 22 — SearchOverlay.module.css

Criar `D:\hub\social-os\src\layouts\SearchOverlay\SearchOverlay.module.css`:

```css
.overlay {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
  box-sizing: border-box;
  background: transparent;
}
```

---

## PASSO 23 — SearchOverlay.tsx

Criar `D:\hub\social-os\src\layouts\SearchOverlay\SearchOverlay.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import { GlobalSearch } from '@/components/shared/GlobalSearch/GlobalSearch'
import styles from './SearchOverlay.module.css'

export function SearchOverlay() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let unlisten: (() => void) | null = null

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event')
        unlisten = await listen('search:focused', () => {
          setTimeout(() => {
            inputRef.current?.focus()
            inputRef.current?.select()
          }, 50)
        })
      } catch {
        // fora do Tauri — ignorar
      }
    }

    setup()
    return () => { if (unlisten) unlisten() }
  }, [])

  return (
    <div className={styles.overlay}>
      <GlobalSearch inputRef={inputRef} />
    </div>
  )
}
```

---

## PASSO 24 — App.tsx

Deletar o arquivo existente. Criar `D:\hub\social-os\src\App.tsx`:

```tsx
// Placeholder — auth implementada na Fase 4
export default function App() {
  return null
}
```

---

## PASSO 25 — main.tsx

Deletar o arquivo existente. Criar `D:\hub\social-os\src\main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'

import './i18n/index'
import './styles/global.module.css'
import './styles/tokens.css'
import './styles/animations.css'

import { AppLayout } from './layouts/AppLayout'
import { SearchOverlay } from './layouts/SearchOverlay/SearchOverlay'

document.documentElement.setAttribute('data-theme', 'dark')

async function main() {
  let windowLabel = 'main'
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    windowLabel = (await getCurrentWindow()).label
  } catch {
    windowLabel = 'main'
  }

  const root = document.getElementById('root')!

  if (windowLabel === 'search') {
    ReactDOM.createRoot(root).render(
      <React.StrictMode><SearchOverlay /></React.StrictMode>
    )
  } else {
    ReactDOM.createRoot(root).render(
      <React.StrictMode><AppLayout /></React.StrictMode>
    )
  }
}

main()
```

---

## PASSO 26 — VERIFICAÇÃO FRONTEND ← não pular

```bash
cd D:\hub\social-os && npm run build
```

**Esperado:** `✓ built in X.XXs`  
**Não avançar para o BLOCO RUST se falhar.**

---

## PASSO 27 — Cargo.toml

> ⚠️ Deletar o arquivo existente. Criar do zero. Não fazer merge.

Criar `D:\hub\social-os\src-tauri\Cargo.toml`:

```toml
[package]
name = "social-os"
version = "0.1.0"
description = "Social OS Desktop App"
authors = ["you"]
edition = "2021"

[lib]
name = "social_os_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
tauri = { version = "2.1", features = ["tray-icon"] }
tauri-plugin-window-state = "2.0"
tauri-plugin-global-shortcut = "2.0"
tauri-plugin-deep-link = "2.0"
window-vibrancy = "0.5"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
sysinfo = "0.30"
tokio = { version = "1", features = ["full"] }
```

---

## PASSO 28 — tauri.conf.json

> ⚠️ ATENÇÃO ESPECIAL — ERROS 3 E 4 ACONTECERAM AQUI  
>
> **REGRA 1:** `window-state` deve ser `null` — não um objeto, não `{}`, não `{stateFlags: 31}`  
> **REGRA 2:** `global-shortcut` deve ser `null`  
> **REGRA 3:** `deep-link.desktop` deve ser `{"schemes": ["socialos"]}` — não `["socialos"]`  
> **REGRA 4:** A janela `search` NÃO existe aqui — é criada em runtime no Rust  
>
> Deletar o arquivo existente. Criar do zero com o conteúdo EXATO abaixo:

Criar `D:\hub\social-os\src-tauri\tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "SocialOS",
  "version": "0.1.0",
  "identifier": "com.socialos.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "SocialOS",
        "width": 1280,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": false,
        "transparent": true,
        "shadow": true,
        "center": true,
        "visible": true,
        "skipTaskbar": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "plugins": {
    "window-state": null,
    "global-shortcut": null,
    "deep-link": {
      "desktop": {
        "schemes": ["socialos"]
      }
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

**Verificação — conferir os 3 valores críticos:**
```bash
findstr "window-state" D:\hub\social-os\src-tauri\tauri.conf.json
findstr "schemes" D:\hub\social-os\src-tauri\tauri.conf.json
```
Linha 1 deve mostrar: `"window-state": null,`  
Linha 2 deve mostrar: `"schemes": ["socialos"]`

---

## PASSO 29 — capabilities/default.json

> ⚠️ ATENÇÃO ESPECIAL — ERRO 3 ACONTECEU AQUI  
>
> A lista abaixo contém APENAS permissões que existem no Tauri 2.  
> `opener:default` NÃO existe — remover se aparecer.  
> Não adicionar nenhuma permissão que não esteja nesta lista.  
> Não remover nenhuma permissão desta lista.

Criar `D:\hub\social-os\src-tauri\capabilities\default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Permissoes padrao para janelas main e search",
  "windows": ["main", "search"],
  "permissions": [
    "core:default",
    "core:event:default",
    "core:window:default",
    "core:window:allow-hide",
    "core:window:allow-show",
    "core:window:allow-set-focus",
    "core:window:allow-set-always-on-top",
    "core:window:allow-set-position",
    "core:window:allow-inner-size",
    "core:window:allow-current-monitor",
    "core:window:allow-available-monitors",
    "core:window:allow-is-visible",
    "core:window:allow-is-minimized",
    "core:window:allow-unminimize",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "global-shortcut:allow-is-registered",
    "window-state:default",
    "deep-link:default",
    "deep-link:allow-get-current"
  ]
}
```

---

## PASSO 30 — main.rs

> Este arquivo cria a janela `search` em runtime — não no tauri.conf.json.  
> Isso resolve o bug do Windows com `transparent + always_on_top` em janelas estáticas.

Deletar o arquivo existente. Criar `D:\hub\social-os\src-tauri\src\main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use window_vibrancy::{apply_acrylic, apply_mica};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let main_window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "windows")]
            {
                if apply_mica(&main_window, Some(true)).is_err() {
                    let _ = apply_acrylic(&main_window, Some((0, 0, 0, 120)));
                }
            }

            create_search_window(app.handle())?;

            let handle = app.handle().clone();
            app.global_shortcut().register(
                Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::Space),
                move |_app, _shortcut, _event| {
                    toggle_search(&handle);
                },
            )?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o app");
}

fn create_search_window(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let main_win = app
        .get_webview_window("main")
        .ok_or("janela main nao encontrada")?;

    let monitor = main_win
        .current_monitor()?
        .ok_or("monitor nao encontrado")?;

    let screen_size = monitor.size();
    let screen_pos = monitor.position();

    let win_w: i32 = 680;
    let win_h: i32 = 500;

    let x = screen_pos.x + (screen_size.width as i32 - win_w) / 2;
    let y = screen_pos.y + 20;

    let search_win = WebviewWindowBuilder::new(
        app,
        "search",
        WebviewUrl::App("index.html".into()),
    )
    .title("")
    .inner_size(win_w as f64, win_h as f64)
    .position(x as f64, y as f64)
    .resizable(false)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .shadow(true)
    .visible(false)
    .build()?;

    #[cfg(target_os = "windows")]
    {
        if apply_mica(&search_win, Some(true)).is_err() {
            let _ = apply_acrylic(&search_win, Some((0, 0, 0, 200)));
        }
    }

    let win_clone = search_win.clone();
    search_win.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(false) = event {
            let _ = win_clone.hide();
        }
    });

    Ok(())
}

fn toggle_search(app: &AppHandle) {
    let Some(win) = app.get_webview_window("search") else {
        return;
    };

    if win.is_visible().unwrap_or(false) {
        let _ = win.hide();
    } else {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
        let _ = win.set_focus(); // intencional: fix bug Windows
        let _ = win.emit("search:focused", ());
    }
}
```

---

## PASSO 31 — VERIFICAÇÃO RUST ← não pular

```bash
cd D:\hub\social-os\src-tauri && cargo check 2>&1
```

**Esperado:** `Finished checking` sem nenhuma linha começando com `error[`

**Erros conhecidos e solução:**

| Erro | Causa | Solução |
|---|---|---|
| `Permission opener:default not found` | capabilities tem permissão inválida | Verificar passo 29 — remover `opener:default` se existir |
| `invalid type: map, expected unit` | `window-state` está como objeto | Verificar passo 28 — deve ser `null` |
| `data did not match any variant of untagged enum` | deep-link formato errado | Verificar passo 28 — `desktop` deve ser `{"schemes": [...]}` |
| `unresolved import tauri_plugin_global_shortcut` | crate não baixou | Rodar `cargo update` |

**Não avançar para o passo 32 se houver erros.**

---

## PASSO 32 — Rodar o app

Se a porta 1420 estiver em uso:
```bash
npx kill-port 1420
```

Rodar o app:
```bash
cd D:\hub\social-os && npm run tauri dev
```

**Teste manual — confirmar todos os itens:**

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | App abre | Janela principal com fundo Mica/transparente |
| 2 | `Ctrl+Alt+Space` | Janela de search aparece centralizada no topo |
| 3 | Digitar qualquer texto | Texto aparece no input |
| 4 | `Esc` | Janela de search some |
| 5 | `Ctrl+Alt+Space` de novo | Janela de search aparece novamente |
| 6 | Clicar fora da janela search | Janela some automaticamente |

**Se `Ctrl+Alt+Space` não funcionar:**
- Fechar PowerToys ou qualquer app que use o mesmo atalho
- Verificar no terminal se aparece erro de registro do shortcut
- O atalho funciona mesmo sem foco no app

---

## CHECKLIST COMPLETO

```
[ ] Passo 1  — Scaffold
[ ] Passo 2  — npm install pacotes
[ ] Passo 3  — package.json + npm install
[ ] Passo 4  — vite.config.ts
[ ] Passo 5  — tsconfig.json
[ ] Passo 6  — Criar pastas
[ ] Passo 7  — dark.css         ← verificar que termina em }
[ ] Passo 8  — light.css
[ ] Passo 9  — tokens.css       ← APENAS 1 linha
[ ] Passo 10 — global.module.css
[ ] Passo 11 — animations.css
[ ] Passo 12 — npm run build ✓  ← não avançar se falhar
[ ] Passo 13 — .env
[ ] Passo 14 — constants.ts
[ ] Passo 15 — supabase.ts
[ ] Passo 16 — 3 arquivos JSON de locale
[ ] Passo 17 — i18n/index.ts
[ ] Passo 18 — BottomBar.tsx
[ ] Passo 19 — AppLayout.tsx
[ ] Passo 20 — GlobalSearch.module.css
[ ] Passo 21 — GlobalSearch.tsx
[ ] Passo 22 — SearchOverlay.module.css
[ ] Passo 23 — SearchOverlay.tsx
[ ] Passo 24 — App.tsx
[ ] Passo 25 — main.tsx
[ ] Passo 26 — npm run build ✓  ← não avançar se falhar
[ ] Passo 27 — Cargo.toml
[ ] Passo 28 — tauri.conf.json  ← window-state: null, deep-link com schemes
[ ] Passo 29 — capabilities/default.json ← sem opener:default
[ ] Passo 30 — main.rs
[ ] Passo 31 — cargo check ✓   ← não avançar se houver erros
[ ] Passo 32 — npm run tauri dev + testar Ctrl+Alt+Space ✓
```


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: PLAN.md
# ==========================================

# PLAN.md — Plano de Desenvolvimento 0% → 100%

> **ATENÇÃO PARA A IA:** Execute as fases NESTA ORDEM. Não pular fases. Não começar uma fase sem a anterior estar completa. Cada fase lista exatamente o que precisa ser criado, em qual arquivo, e o que fazer. Consulte SCOPE.md, STRUCTURE.md, PATTERNS.md e DATABASE.md para detalhes de implementação.

---

## FILOSOFIA DO PLANO

- **Fundação primeiro** — nenhum módulo de produto antes da infraestrutura estar sólida
- **Cada fase entrega algo funcional** — ao final de cada fase, o app deve rodar sem erros
- **Dependências respeitadas** — Chat depende de Profile Core, Profile Core vem antes
- **Real-time desde o início** — não é adicionado depois, faz parte da fundação (Fase 3)
- **Padrões desde o início** — optimistic updates, offline, empty states desde a Fase 0

---

## FASE 0 — Fundação do Projeto
> **Objetivo:** App Tauri + React rodando, estrutura de pastas criada, design tokens funcionando, nenhuma feature de produto ainda.
> **Resultado esperado:** Janela do app abre mostrando um fundo preto com BottomBar vazia.

### 0.1 — Scaffold
- [ ] Criar projeto com `npm create tauri-app` — template React + TypeScript + Vite
- [ ] Instalar dependências: `zustand`, `i18next`, `react-i18next`, `@supabase/supabase-js`, `window-vibrancy`, `tauri-plugin-window-state`, `tauri-plugin-global-shortcut`
- [ ] Configurar aliases de path no `vite.config.ts`: `@/` aponta para `src/`
- [ ] Configurar `tsconfig.json` com paths correspondentes

### 0.2 — Design Tokens
- [ ] Criar `src/styles/themes/dark.css` com TODAS as variáveis CSS da seção 27 do SCOPE.md
- [ ] Criar `src/styles/themes/light.css` com variáveis do tema claro
- [ ] Criar `src/styles/themes/custom.css` como template vazio
- [ ] Criar `src/styles/global.module.css` com reset CSS + estilos do body + scrollbar oculta
- [ ] Criar `src/styles/animations.css` com keyframes globais (fadeIn, pulse, slideUp)
- [ ] Aplicar `data-theme="dark"` no `document.documentElement` por padrão no `main.tsx`

### 0.3 — i18n
- [ ] Criar `src/i18n/index.ts` com configuração do i18next (idioma padrão: pt-BR)
- [ ] Criar `src/i18n/locales/pt-BR.json` com todas as strings do app (começar com as da Fase 0)
- [ ] Criar `src/i18n/locales/en-US.json` com as mesmas chaves em inglês
- [ ] Criar `src/i18n/locales/es-ES.json` com as mesmas chaves em espanhol
- [ ] Inicializar i18next no `main.tsx` antes de montar o React

### 0.4 — Configurações e Clientes
- [ ] Criar `src/config/supabase.ts` — exporta instância única do cliente Supabase
  - Ler URL e anon key de variáveis de ambiente Vite (`.env`)
  - NUNCA hardcodar as keys no código
- [ ] Criar `src/config/r2.ts` — exporta cliente do R2 (S3-compatible)
- [ ] Criar `src/config/constants.ts` — exportar `COLD_STORAGE_DAYS = 30`, `MAX_RETRY_COUNT = 3`, etc.
- [ ] Criar `.env.example` com as variáveis necessárias documentadas

### 0.5 — Types globais
Criar todos os tipos em `src/types/` conforme listado no STRUCTURE.md:
- [ ] `user.types.ts` — `User`, `UserStatus`, `UserSettings`
- [ ] `message.types.ts` — `Message`, `MessageEdit`, `MessageReaction`, `MessageStatus`
- [ ] `module.types.ts` — `ModuleId` (enum com todos os módulos), `ModuleConfig`, `ModuleMode`
- [ ] `layout.types.ts` — `LayoutNode` (union type de LayoutModule | LayoutSplit)
- [ ] `status.types.ts` — `PresenceStatus`, `ActivityType`, `ActivityStatus`
- [ ] `event.types.ts` — `EventType` (todos os eventos), payloads de cada evento
- [ ] `index.ts` — re-exporta tudo

### 0.6 — Stores Zustand (vazios)
Criar os stores com estado inicial mas sem lógica ainda:
- [ ] `src/store/auth.store.ts`
- [ ] `src/store/layout.store.ts`
- [ ] `src/store/theme.store.ts`
- [ ] `src/store/presence.store.ts`
- [ ] `src/store/events.store.ts` — implementar COMPLETO (ver PATTERNS.md seção 4)
- [ ] `src/store/offline.store.ts` — implementar COMPLETO (ver PATTERNS.md seção 2)
- [ ] `src/store/notification.store.ts`
- [ ] `src/store/search.store.ts`
- [ ] `src/store/hardware.store.ts`
- [ ] `src/store/modules/chat.store.ts` (vazio)
- [ ] `src/store/index.ts` — re-exporta tudo

### 0.7 — Componentes Base
Criar componentes que serão usados em TODA a fase de desenvolvimento:
- [ ] `src/components/ui/Skeleton/` — ver implementação em PATTERNS.md seção 3
- [ ] `src/components/ui/EmptyState/` — ver implementação em PATTERNS.md seção 3
- [ ] `src/components/ui/Toast/` e `ToastContainer` — ver PATTERNS.md seção 8
- [ ] `src/components/ui/Button/` — radius `--radius-interactive`, sem borda de accent
- [ ] `src/components/ui/Input/` — radius `--radius-interactive`, sem borda de accent

### 0.8 — AppLayout e estrutura inicial
- [ ] Criar `src/layouts/AppLayout.tsx` — área central vazia + BottomBar placeholder
- [ ] Criar `src/layouts/BottomBar/BottomBar.tsx` — barra vazia no fundo, altura 48px
- [ ] Criar `src/App.tsx` — por enquanto renderiza sempre AppLayout (Welcome será Fase 19)
- [ ] Configurar janelas no `src-tauri/tauri.conf.json`:
  - Janela `main`: sem decorações, transparente, tamanho inicial 1280x800
  - Janela `search`: ver configuração exata no SCOPE.md seção 8
- [ ] Aplicar Mica na janela principal via `window-vibrancy` no `src-tauri/src/main.rs`

### 0.9 — Tauri Commands básicos (Rust)
- [ ] Criar `src-tauri/src/commands/hardware.rs` com funções vazias:
  - `get_cpu_usage() -> Result<f32, String>`
  - `get_gpu_usage() -> Result<f32, String>`
  - `get_ram_usage() -> Result<f32, String>`
  - `get_network_speed() -> Result<(f64, f64), String>` — (download, upload) em MB/s
- [ ] Registrar todos os commands em `src-tauri/src/lib.rs`


### 0.10 — Global Search (janela do sistema)
- [ ] Janela `search` criada no boot e inicia oculta
- [ ] Toggle via Ctrl+Alt+Space (backend)
- [ ] Show/Hide robusto: show → unminimize → focus
- [ ] Posicionar top 20px e centralizar horizontalmente
- [ ] Auto-hide ao perder foco e ao pressionar ESC
- [ ] Frontend exclusivo: `SearchOverlay` + `GlobalSearch`

---

## FASE 1 — Layout Engine (Tiling Tree Split)
> **Objetivo:** Sistema de painéis funcionando: criar splits, redimensionar, fechar painéis.
> **Resultado esperado:** Usuário consegue dividir a tela e redimensionar os painéis com o mouse.
> **Dependências:** Fase 0 completa.

- [ ] Criar `src/utils/layout-tree.ts` com funções puras:
  - `insertNode(tree, targetId, node, position)` — inserir módulo ou split
  - `removeNode(tree, nodeId)` — remover nó e limpar nó pai
  - `updateRatio(tree, nodeId, ratio)` — atualizar proporção de um split
  - `findNode(tree, nodeId)` — buscar nó por ID
  - `getLeafNodes(tree)` — retornar todos os painéis folha (módulos)
  - `calculateMinSize(node, minSizes)` — calcular tamanho mínimo respeitando os módulos filhos

- [ ] Implementar `src/store/layout.store.ts`:
  - Estado: `tree: LayoutNode`, `activeNodeId: string | null`
  - Actions: `splitNode`, `removeNode`, `updateRatio`, `setActiveNode`, `saveLayout`, `loadLayout`, `resetLayout`

- [ ] Criar `src/engine/layout/LayoutEngine.tsx`:
  - Renderiza a árvore recursivamente
  - Cada `LayoutModule` renderiza o módulo correspondente dentro de `ModuleWrapper`
  - Cada `LayoutSplit` renderiza `SplitPane` com dois filhos e `ResizeHandle` no meio

- [ ] Criar `src/engine/layout/SplitPane.tsx`:
  - Props: `direction: 'horizontal' | 'vertical'`, `ratio: number`, `first: ReactNode`, `second: ReactNode`
  - Não permite ratio menor que o mínimo dos módulos filhos

- [ ] Criar `src/engine/layout/ResizeHandle.tsx`:
  - Faixa de 4px entre dois painéis, cursor `col-resize` ou `row-resize`
  - Durante drag: atualiza ratio em tempo real via `layout.store.updateRatio`
  - NÃO usa `onMouseDown` nos painéis filhos — apenas no próprio handle

- [ ] Criar `src/engine/layout/EmptyPane.tsx`:
  - Mostra `EmptyState` com "Clique com o botão direito para adicionar módulo"
  - Context menu com opções do layout (ver SCOPE.md seção 5)

- [ ] Criar `src/components/shared/ContextMenu/`:
  - Abre na posição do cursor via `position: fixed`
  - Fecha ao clicar fora ou pressionar Esc
  - Suporte a items com ícone, label, separadores e items destrutivos

- [ ] Persistência do layout:
  - Salvar `tree` serializado em `user_settings.saved_layouts` no Supabase
  - Carregar ao iniciar o app
  - Sincronizar via Supabase Realtime canal `settings:{user_id}`

---

## FASE 2 — Drag Handle System
> **Objetivo:** Arrastar módulos entre painéis funcionando SEM interferir com cliques normais.
> **Resultado esperado:** Passar o mouse no topo de um módulo revela o handle. Arrastar move o módulo.
> **Dependências:** Fase 1 completa.

- [ ] Criar `src/engine/drag/DragHandle.tsx` — ver implementação EXATA no SCOPE.md seção 6
  - NÃO usar `draggable={true}` HTML nativo
  - NÃO usar react-dnd, dnd-kit ou similares
  - Threshold de 8px antes de iniciar drag (`Math.hypot(dx, dy) > 8`)

- [ ] Criar `src/engine/drag/DragOverlay.tsx`:
  - Overlay translúcido que aparece sobre o painel alvo durante drag
  - Divide o painel em 5 zonas: centro, topo, baixo, esquerda, direita
  - Centro = substituir, bordas = criar split na direção correspondente
  - Destaca a zona que vai receber o módulo

- [ ] Criar `src/components/shared/ModuleWrapper/ModuleWrapper.tsx` — ver SCOPE.md seção 6
  - Todo módulo DEVE ser envolvido por este componente
  - Contém DragHandle no topo
  - `pointer-events: none` no conteúdo APENAS durante drag ativo

- [ ] Testes manuais obrigatórios antes de avançar:
  - [ ] Clicar em botão dentro do módulo → não inicia drag
  - [ ] Clicar em input dentro do módulo → não inicia drag, input recebe foco
  - [ ] Scroll dentro do módulo → não inicia drag
  - [ ] Hover no topo do módulo → handle revela
  - [ ] Arrastar pelo handle → módulo se move
  - [ ] Soltar no centro de outro painel → módulos trocam de lugar
  - [ ] Soltar na borda → cria split

---

## FASE 3 — Real-time Engine + Offline Mode
> **Objetivo:** WebSocket e Supabase Realtime funcionando. Modo offline com fila de ações.
> **Resultado esperado:** App detecta quando perde conexão, enfileira ações, reprocessa ao reconectar.
> **Dependências:** Fase 0 (events.store, offline.store).

- [ ] Criar `src/engine/realtime/channels.ts`:
  - Definir TODOS os canais Realtime do app (ver DATABASE.md seção final)
  - Cada canal como constante: `CHANNELS.conversation(id)`, `CHANNELS.feed()`, etc.

- [ ] Criar `src/engine/realtime/handlers.ts`:
  - Handler para cada tipo de evento recebido
  - Cada handler atualiza o store correto E emite evento via `events.store`

- [ ] Criar `src/engine/realtime/RealtimeProvider.tsx`:
  - Context provider que inicializa conexões ao montar
  - Subscribe nos canais relevantes para o usuário logado
  - Unsubscribe ao desmontar (cleanup obrigatório)

- [ ] Criar `src/services/realtime.service.ts`:
  - `subscribe(channel, handler)` — retorna função de cleanup
  - `unsubscribe(channel)` — desinscreve do canal

- [ ] Implementar `src/hooks/useOffline.ts` — ver PATTERNS.md seção 2:
  - Detectar conexão com teste real (não só `navigator.onLine`)
  - Chamar `offline.store.flushQueue()` ao reconectar

- [ ] Implementar `src/store/offline.store.ts` — ver PATTERNS.md seção 2:
  - Fila persistida no Tauri filesystem via command Rust
  - Criar `src-tauri/src/commands/storage.rs` com `save_offline_queue` e `load_offline_queue`

- [ ] Criar `src/components/shared/OfflineBanner/OfflineBanner.tsx`:
  - Banner no topo do AppLayout
  - Estados: sem conexão / reconectando / sincronizando X ações

- [ ] Criar `src/hooks/useOptimistic.ts` — ver PATTERNS.md seção 1

- [ ] Implementar `src/hooks/usePresence.ts`:
  - Atualiza `user_status` ao montar (online) e ao desmontar (offline)
  - Atualiza a cada mudança de atividade via `events.store.on('music:playing', ...)`

---

## FASE 4 — Autenticação + User Profile Core + Stories
> **Objetivo:** Login funcionando. Componentes de perfil prontos para uso em todos os módulos.
> **Resultado esperado:** Usuário consegue fazer login/cadastro. Perfil renderiza com variantes mini/medium/full.
> **Dependências:** Fase 3. Database configurado no Supabase (tabelas users, user_status, user_settings, follows, stories).

### 4.1 — Autenticação
- [ ] Criar tela de login (email + senha)
- [ ] Criar tela de cadastro
- [ ] Implementar `src/services/auth.service.ts`:
  - `login(email, password)`
  - `signup(email, password)`
  - `logout()`
  - `getSession()` — retorna sessão atual
- [ ] Implementar `src/store/auth.store.ts`:
  - Estado: `user: User | null`, `isLoading: boolean`
  - Escutar `supabase.auth.onAuthStateChange`
- [ ] `src/App.tsx` — mostrar login se não autenticado, AppLayout se autenticado
- [ ] Tray icon com status de presença (via `src-tauri/src/tray/mod.rs`)

### 4.2 — User Profile Core
- [ ] Criar `src/services/user.service.ts`:
  - `getUser(userId)`, `updateUser(data)`, `getUserStatus(userId)`
- [ ] Criar `src/components/profile/ProfileAvatar/ProfileAvatar.tsx`:
  - Props: `userId: string`, `variant: 'mini' | 'medium' | 'full'`
  - Variante `mini`: 32px, sem nome
  - Variante `medium`: 48px, com nome
  - Variante `full`: 80px+, com nome e username
  - Exibir anel de story (gradiente se novo, cinza se assistido)
  - Exibir indicador de status online
  - Exibir `avatar_alt_url` se usuário não é seguidor
- [ ] Criar `src/components/profile/ProfileBanner/ProfileBanner.tsx`:
  - Props: `userId: string`, `variant: 'card' | 'chat' | 'profile'`
  - Variante `card`: altura 60px, blur 20px, overlay 60% opacidade
  - Variante `chat`: altura 120px, blur 10px, overlay 40% opacidade
  - Variante `profile`: altura 200px, sem blur, overlay 20% opacidade
  - Suportar todos os `banner_type`: image, gif, video (autoplay muted loop), color, gradient
- [ ] Criar `src/components/profile/ProfileStatus/ProfileStatus.tsx`:
  - Escuta eventos via `events.store` para atividade em tempo real
  - Exibe status de presença com cor correta (usar variáveis CSS)
  - Exibe atividade: "PLAYING — EA FC 24" ou "LISTENING — Drake"
- [ ] Criar `src/components/profile/ProfileMetrics/ProfileMetrics.tsx`:
  - Posts / Seguidores / Seguindo clicáveis
  - Atualiza em tempo real via Supabase Realtime
- [ ] Criar `src/components/profile/ProfileCard/ProfileCard.tsx`:
  - Composição de Avatar + Status + Metrics
  - Aceita todas as variantes dos componentes filhos

### 4.3 — Stories Core
- [ ] Criar `src/components/shared/StoriesLine/StoriesLine.tsx`:
  - Linha horizontal com scroll, sem scrollbar visível
  - Primeiro item: story do próprio usuário com botão "+"
- [ ] Criar `src/components/shared/StoriesLine/StoryItem.tsx`:
  - Anel de gradiente para story novo, cinza para assistido
  - Clique abre visualizador de story
- [ ] Implementar visualizador de story (tela fullscreen com timer)
- [ ] Upload de story (foto e vídeo) com edição: crop, proporção, texto, legenda
- [ ] Expiração automática em 24h (via campo `expires_at` na query)
- [ ] Soft delete de story

---

## FASE 5 — Global Search + Atalhos + Deep Links
> **Objetivo:** Search global funcionando como PowerToys Run. Atalhos de teclado e deep links ativos.
> **Resultado esperado:** Ctrl+Alt+Space abre janela com efeito Mica sobre qualquer janela do Windows.
> **Dependências:** Fase 0 (janela search configurada no tauri.conf.json).

### 5.1 — Global Search
- [ ] Registrar atalho global `Ctrl+Alt+Space` no Rust via `tauri-plugin-global-shortcut` (ver SCOPE.md seção 8)
- [ ] Implementar lógica de mostrar/esconder janela `search` ao pressionar atalho
- [ ] Criar `src/layouts/SearchOverlay/SearchOverlay.tsx` (roda na janela `search`)
- [ ] Criar `src/components/shared/GlobalSearch/GlobalSearch.tsx`:
  - Input com foco automático ao abrir
  - Fechar ao pressionar Esc ou clicar fora
- [ ] Criar `src/components/shared/GlobalSearch/SearchResults.tsx`:
  - Resultados em tempo real por categoria (ver SCOPE.md seção 8)
  - Busca local primeiro (Zustand stores), depois Supabase se sem resultado local
- [ ] Criar `src/store/search.store.ts`:
  - Gerenciar query, resultados, histórico de buscas
- [ ] Implementar `src/hooks/useSearch.ts`
- [ ] Navegação por teclado: setas ↑↓ navegam entre resultados, Enter abre

### 5.2 — Atalhos de teclado
- [ ] Implementar `src/hooks/useShortcuts.ts` — ver PATTERNS.md seção 6
- [ ] Registrar todos os atalhos da tabela do PATTERNS.md seção 6
- [ ] Criar componente de menu de atalhos (acessível via Ctrl+/)

### 5.3 — Deep Links
- [ ] Configurar protocolo `app://` no `tauri.conf.json`
- [ ] Criar `src/utils/deep-link.ts` — parser de URLs `app://`
- [ ] Implementar `src/hooks/useDeepLink.ts` — ver PATTERNS.md seção 5
- [ ] Testar todos os destinos listados na tabela do PATTERNS.md seção 5

---

## FASE 6 — Módulo Chat (0% → 100%)
> **Objetivo:** Chat funcional com todas as features do escopo.
> **Dependências:** Fases 1-5. Tabelas conversations, conversation_members, messages, message_edits, message_reads, message_reactions, message_favorites no Supabase.

### 6.1 — Chat Home
- [ ] Criar `src/modules/Chat/screens/Home/HomeHeader.tsx`:
  - StoriesLine completo com scroll
  - Barra de busca de conversas (busca em `chat.store.conversations`)
  - Filtros em pills: Todos / Não lidas / Grupos / Favoritos
- [ ] Criar `src/modules/Chat/screens/Home/HomeSection.tsx`:
  - Lista de conversas com `ChatCard` por item
  - Ordenação: fixadas primeiro, depois por última mensagem
  - Context menu por conversa: Fixar / Favoritar / Silenciar / Arquivar / Excluir
  - Badge de não lidas em tempo real via Supabase Realtime
  - Hover no card: botão de expandir para resposta rápida
- [ ] Criar `src/modules/Chat/components/ChatCard/ChatCard.tsx`:
  - Avatar com status online + banner como fundo sutil (variante `card`)
  - @username em negrito, preview da última msg, timestamp, badge de não lidas
  - Ícone de fixado se `is_pinned = true`
- [ ] Criar `src/modules/Chat/screens/Home/HomeFooter.tsx`:
  - Botões: MY-PROFILE, CONFIG, FAVORITES, QUIT
  - FAB (+) que gira 45° ao abrir submenu
  - Submenu do FAB: CREATE-STORIES, CREATE-GROUP, CREATE-SERVIDOR
  - BTN-TRASH: abre histórico de mensagens excluídas
- [ ] Implementar `src/store/modules/chat.store.ts`:
  - Carregar conversas do Supabase ao montar
  - Subscribe no canal Realtime de mensagens
  - Actions: `sendMessage`, `editMessage`, `deleteMessage`, etc.
  - Todos os `sendMessage` e `editMessage` com optimistic updates (ver PATTERNS.md seção 1)
- [ ] Toggles nas configurações do Chat:
  - Mostrar/ocultar preview de mensagens
  - Invisível para grupos

### 6.2 — ChatDM
- [ ] Criar `src/modules/Chat/screens/ChatDM/ChatDMHeader.tsx`:
  - StoriesLine dos participantes da conversa
  - ProfileCard clicável (abre ChatProfile)
  - BTN-CALL, BTN-VIDEO, BTN-MORE
- [ ] Criar `src/modules/Chat/screens/ChatDM/ChatDMSection.tsx`:
  - Renderiza lista de mensagens com auto-scroll para a última
  - Agrupamento: msgs sequenciais do mesmo autor em `MessageGroup`
  - Subscribe em Realtime do canal `conversation:{id}`
  - Indicador "digitando..." em tempo real
- [ ] Criar `src/modules/Chat/components/MessageBubble/MessageBubble.tsx`:
  - Props: mensagem, se é do usuário atual, se é continuação de grupo
  - Status: sending (🕐) / sent (✓) / read (✓✓) / failed (⚠️ + botão reenviar)
  - Context menu ao clicar com botão direito (ver SCOPE.md seção 10)
- [ ] Criar `src/modules/Chat/components/MessageGroup/MessageGroup.tsx`:
  - Agrupa msgs sequenciais do mesmo autor
  - Mostrando somente o avatar na primeira msg do grupo
- [ ] Criar `src/modules/Chat/screens/ChatDM/ChatDMFooter.tsx`:
  - INPUT-WRITE-MESSAGE com radius `--radius-interactive`
  - BTN-SEND aparece quando há texto, BTN-RECORD-VOICE quando vazio
  - BTN-EMOTE, BTN-ATTACH
- [ ] Implementar todas as funcionalidades do Context Menu de mensagem (ver SCOPE.md seção 10)
- [ ] Implementar configurações de DM com todos os toggles

### 6.3 — ChatProfile
- [ ] Criar `src/modules/Chat/screens/ChatProfile/ChatProfileHeader.tsx`:
  - StoriesLine
  - ProfileBanner variante `profile` com foto sobreposta
  - Status de presença + atividade em tempo real
  - Tabs: POSTS / FOLLOWERS / FOLLOWING / BIO
- [ ] Criar `src/modules/Chat/screens/ChatProfile/ChatProfileSection.tsx`:
  - Cards de atividades recentes com imagem de background contextual
  - Integração com `events.store` para atualizar em tempo real
- [ ] Criar `src/modules/Chat/screens/ChatProfile/ChatProfileFooter.tsx`:
  - INPUT-WRITE-MESSAGE
  - BTN-SHOW/HIDE, BTN-MOVE, BTN-CONFIG, BTN-VOLUME

### 6.4 — Hot/Cold Storage
- [ ] Criar background job Rust em `src-tauri/src/jobs/cold_storage.rs`:
  - Roda diariamente (via timer no Tauri)
  - Implementar lógica de migração (ver SCOPE.md seção 26)
  - Upload para R2 com zstd
  - UPDATE messages SET cold_ref = path, content = NULL

---

## FASE 6.5 — Advanced Chat Interactions
> **Objetivo:** Transformar o chat em uma ferramenta social de alta performance com interações ricas.
> **Dependências:** Fase 6 completa.

- [ ] **SyncShare:** Implementar sincronização de estado de player (Play/Pause/Seek) via canais Realtime específicos para ouvir música ou ver vídeos juntos.
- [ ] **Code Snippets:** Integrar Monaco Editor ou Prism.js para renderização de blocos de código com highlight e botão "Copiar".
- [ ] **Quick Reminders:** Implementar sistema de notificações agendadas via Tauri no Rust para lembretes sobre mensagens específicas.
- [ ] **Shared Whiteboard:** Criar componente Canvas para desenho rápido (300x300) e exportação em .webp para rascunhos instantâneos.
- [ ] **Screen Snip & Annotate:** Implementar captura de tela nativa no Rust e ferramentas de anotação no frontend.
- [ ] **Nudge (Janela Tremer):** Criar comando Rust `window_nudge` que manipula a posição da janela para simular o efeito de tremer.
- [ ] **Voice Transcription:** Integrar serviço de transcrição (local ou API) para transformar áudios em texto visível abaixo da bolha.

---

## FASE 6.6 — Chat Revolution (Experimental)
> **Objetivo:** Implementar as mecânicas que mudam o paradigma de como um chat funciona, tornando-o orgânico e gamificado.

- [ ] **Conversa Viva (Dynamic UI):** Motor que calcula a "temperatura" da conversa baseado no intervalo de mensagens e muda as variáveis CSS do tema localmente.
- [ ] **Identidade Camaleão:** Permitir override de `avatar_url` e `display_name` a nível de `conversation_members`.
- [ ] **Burn After Read:** Implementar componente de bolha que detecta o "Intersection Observer" e deleta a mensagem após X segundos de visualização.
- [ ] **Mensagens Trancadas (Tempo/Local):** UI de "Cadeado" para mensagens que têm `unlock_at` ou `unlock_location`. Bloqueio validado no frontend e backend.
- [ ] **Silent Messages & Vault:** Implementar envio de mensagem que ignora a fila de notificações e o "Cofre" local para esconder DMs.

---

## FASE 26 — Ghost Files (Social Cloud P2P)
- [ ] **Privacy Stripper (Rust):** Implementar biblioteca para limpar metadados de arquivos antes do stream.
- [ ] **Ghost Send Engine:** Lógica de streaming P2P com trigger de auto-deleção no receptor via Tauri FS.
- [ ] **Social Folder:** Sincronização de eventos de diretório (Watcher) com notificações Realtime.

## FASE 27 — Squad Launcher & Social Macros
- [ ] **Preset Engine:** Sistema de salvar estados (apps abertos, volume, performance).
- [ ] **Global Sync:** Disparo de presets para múltiplos clientes via canais de grupo.

---

## FASE 7 — BottomBar Global
> **Objetivo:** Barra inferior com todos os indicadores em tempo real.
> **Dependências:** Fases 3 (presença), 4 (perfil), 6 (chat), Rust commands de hardware.

- [ ] Implementar `src-tauri/src/commands/hardware.rs` com dados reais do sistema
- [ ] Implementar `src/hooks/useHardware.ts`:
  - Chama `invoke('get_cpu_usage')` e outros a cada 2 segundos via `setInterval`
  - Atualiza `hardware.store`
- [ ] Implementar `src/layouts/BottomBar/BottomBar.tsx` completo:
  - Ícones de câmera, mic, screenshare (ativos quando em uso)
  - Nome do grupo/tropa conectada
  - Download/Upload speed
  - CPU% e GPU%
  - MiniPlayer de música (placeholder até Fase 9)
  - Seletor de status de presença clicável

---

## FASE 8 — Módulo Feed (0% → 100%)
> **Dependências:** Fases 1-4. Tabelas posts, post_reactions, post_comments no Supabase.

### 8.1 — FeedHome (lista + realtime)
- [ ] FeedHome com lista de posts em tempo real
- [ ] PostCard com mídia (imagem/gif/vídeo) e ações (like/comment/share)
- [ ] Paginação por cursor (infinite scroll)
- [ ] Reactions e contadores em tempo real (Supabase Realtime)

### 8.2 — Flow Criar Post (compose)
- [ ] PostComposer (texto + anexos)
- [ ] Upload de mídia no Cloudflare R2 seguindo R2_STRUCTURE.md
- [ ] Salvar metadados no Supabase (url + type + dims + duration)
- [ ] Visibilidade do post: all | followers
- [ ] Optimistic update (status posting → posted / rollback com toast)

### 8.3 — Comentários e edição
- [ ] CommentsDrawer (lista + enviar comentário)
- [ ] Edição de post com versionamento (post_versions) e label “editado”
- [ ] Soft delete (deleted_at) + UI de “post removido”
## FASE 9 — Módulo Music (0% → 100%)
> **Dependências:** Fases 1-4.

### 9.1 — Player + Library base
- [ ] MusicHome com lista de playlists, artistas e músicas curtidas
- [ ] MiniPlayer integrado na BottomBar (play/pause/next)
- [ ] Estado global do player em `music.store.ts`

### 9.2 — Flow Adicionar Músicas (add)
- [ ] UI de adicionar (dropzone + seletor de arquivos)
- [ ] Indexar localmente (metadados) sem travar UI
- [ ] Criar playlist e adicionar faixas
- [ ] Evento: `music:add` abre o flow

### 9.3 — Integração com Presence
- [ ] Atualizar presence/activity: `LISTENING — {track}`
- [ ] Realtime: status de música visível conforme settings
## FASE 10 — Módulo Favorite Games & Apps (0% → 100%)
> **Dependências:** Fases 1-4.

### 10.1 — Grid + Detecção
- [ ] FavoriteGamesHome com grid de cards
- [ ] Detecção de app/jogo ativo via Rust (processes.rs)
- [ ] Atualizar activity: `PLAYING — {game}`

### 10.2 — Pinning (Drag & Drop)
- [ ] Aceitar drag & drop de `.lnk` e `.exe` para “pin”
- [ ] Reordenar cards por drag
- [ ] Persistir favoritos no user_settings e sincronizar via Realtime

### 10.3 — Steam (import local)
- [ ] Importar biblioteca Steam instalada (apenas leitura local)
- [ ] Listar jogos Steam instalados como sugestões
- [ ] Ação “Adicionar aos Favoritos” cria item pinned
- [ ] Metadata avançada (capas/descrições) é fase posterior
## FASE 11 — Módulo Live (0% → 100%)
> **Dependências:** Fases 1-4.

- [ ] LivePlayer com badge LIVE ON e contador em tempo real
- [ ] LiveChat com mensagens em tempo real
- [ ] Widget Picture-in-Picture (janela sem chrome)
- [ ] Ao assistir: `emit('live:watching')`

---

## FASE 12 — Performance Governor (0% → 100%)
> **Dependências:** Fase 7 (hardware hooks). events.store.

- [ ] HardwareGraph com histórico de 5 minutos
- [ ] Temperaturas de CPU/GPU via Rust
- [ ] ModeSelector: Balanceado / Performance / Economia
- [ ] Escutar `games:detected` → aplicar modo Performance
- [ ] Emitir `governor:high-cpu` quando CPU > 85%
- [ ] Emitir `governor:cpu-normal` quando CPU < 50%

---

## FASE 13 — MotionWallpaper (0% → 100%)
> **Dependências:** Fase 12. Rust command para aplicar wallpaper no Windows.

- [ ] Implementar `src-tauri/src/commands/wallpaper.rs`:
  - `set_wallpaper(path)` — aplica vídeo/gif como wallpaper no Windows
  - `pause_wallpaper()` — pausa sem remover
  - `resume_wallpaper()`
- [ ] WallpaperGrid e WallpaperPreview
- [ ] Escutar `governor:high-cpu` → `invoke('pause_wallpaper')`
- [ ] Escutar `governor:cpu-normal` → `invoke('resume_wallpaper')`
- [ ] Escutar `games:detected` → pausar wallpaper automaticamente

---

## FASE 14 — Browser (0% → 100%)
> **Dependências:** Fases 1-2.

- [ ] BrowserBar com URL, navegação, tabs
- [ ] BrowserView via WebView do Tauri
- [ ] Modo dock e modo widget

---

## FASE 15 — Videos & Films (0% → 100%)
> **Dependências:** Fases 1-2.

- [ ] VideoPlayer com controles completos
- [ ] Widget Picture-in-Picture (igual Live)
- [ ] Films: catálogo e player

---

## FASE 16 — ScreenShare & RemoteShare (0% → 100%)
> **Dependências:** Fase 6 (Chat). Rust commands.

- [ ] `src-tauri/src/commands/remote.rs`:
  - `start_screen_capture()` — captura frames da tela
  - `start_remote_control(targetId)` — inicia sessão remota
  - `stop_remote_control()`
- [ ] ScreenShare: captura + transmissão via WebSocket
- [ ] Integrar botão de ScreenShare no footer do ChatDM
- [ ] RemoteShare: controle remoto com seletor de permissões
- [ ] Ao iniciar: `emit('screenshare:started')` / `emit('remoteshare:started')`

---

## FASE 17 — Settings (0% → 100%)
> **Dependências:** Fases 4, 7.

- [ ] SettingsAccount — alterar todos os dados do perfil, deletar conta, exportar dados
- [ ] SettingsAppearance — seletor de tema com preview em tempo real
- [ ] SettingsPrivacy — todos os toggles de visibilidade
- [ ] SettingsNotifications — toggles por tipo
- [ ] SettingsLanguage — troca idioma sem reload
- [ ] SettingsModules — ativar/desativar módulos
- [ ] SettingsShortcuts — visualizar e customizar atalhos

---

## FASE 18 — Sistema de Temas (0% → 100%)
> **Dependências:** Fase 0 (tokens CSS), Fase 17 (Settings).

- [ ] Implementar `src/hooks/useTheme.ts` — ver PATTERNS.md seção 7
- [ ] Implementar `src/store/theme.store.ts` com persistência no Supabase
- [ ] Troca Dark ↔ Light funciona sem reload
- [ ] Temas do Marketplace injetados dinamicamente via `<style>` tag
- [ ] Tema salvo em `user_settings.theme` e sincronizado entre dispositivos

---

## FASE 19 — Multi-Janela (0% → 100%)
> **Dependências:** Todos os módulos implementados.

- [ ] Cada módulo exporta versão standalone para rodar em janela separada
- [ ] Implementar abertura de janela de widget via `emit('module:open-as-widget')`
- [ ] `tauri-plugin-window-state` persistindo posição/tamanho de cada widget
- [ ] Sincronização de estado entre janelas via Tauri events
- [ ] Live e Videos como Picture-in-Picture (janela sem decorações, sempre no topo)

---

## FASE 20 — Notifications (0% → 100%)
> **Detalhamento de layout em aberto — definir antes de implementar.**

- [ ] Definir layout do módulo Notifications
- [ ] NotificationItem por tipo
- [ ] NotificationGroup por data
- [ ] Marcar como lido / limpar tudo
- [ ] Badge no ícone de notificações da BottomBar

---

## FASE 21 — Projects (0% → 100%)
> **Dependências:** Fases 1-4. Tabelas projects, project_boards, project_cards.

- [ ] Board com colunas arrastáveis
- [ ] Cards com drag entre colunas
- [ ] Edição de card: título, descrição, assignee, prazo, tags
- [ ] Colaboração em tempo real via Supabase Realtime
- [ ] Mencionar card em DM via deep link `app://project/{id}/card/{card_id}`

---

## FASE 22 — Marketplace / Workshop (0% → 100%)
> **Dependências:** Fases 13 (wallpapers), 18 (temas).

- [ ] AssetGrid com filtros por tipo (wallpaper/tema/widget)
- [ ] AssetCard com preview, rating, contador de downloads
- [ ] Download de asset + instalação local
- [ ] Upload de conteúdo da comunidade
- [ ] Sistema de avaliações (1-5 estrelas + comentário)
- [ ] Aplicar tema baixado via `useTheme.applyCustomTheme()`

---

## FASE 23 — Welcome & Onboarding (0% → 100%)
> **Dependências:** Fase 4 (auth, perfil).

- [ ] StepProfile: foto, username, bio
- [ ] StepModules: checkboxes dos módulos a ativar
- [ ] StepWallpaper: galeria de wallpapers iniciais
- [ ] StepTour: tour interativo pelos módulos
- [ ] Após onboarding: redirecionar para AppLayout e marcar `is_onboarded = true` no Supabase

---

## FASE 24 — Polish & Produção
> **Objetivo:** App pronto para distribuição.

- [ ] Testes de performance (medir FPS, tempo de carregamento, uso de memória)
- [ ] Otimização de bundle Vite (code splitting por módulo)
- [ ] Revisar todos os empty states — nenhum componente renderiza vazio
- [ ] Revisar todas as strings — todas usando i18n, nenhum texto hardcoded
- [ ] Tray icon completo com todas as ações
- [ ] Autostart configurável nas configurações
- [ ] Sistema de updates automáticos via Tauri updater
- [ ] Build de produção: Windows (.msi), macOS (.dmg), Linux (.AppImage)
- [ ] Assinatura do app (Windows: code signing certificate)

---

## RESUMO — ORDEM DE EXECUÇÃO

```
FASE 0  → Fundação (scaffold, tokens, types, stores, componentes base)
FASE 1  → Layout Engine (tiling tree split)
FASE 2  → Drag Handle System
FASE 3  → Real-time Engine + Offline Mode
FASE 4  → Auth + Profile Core + Stories
FASE 5  → Global Search + Atalhos + Deep Links
FASE 6  → Chat (módulo principal — mais complexo)
FASE 7  → BottomBar Global
FASE 8  → Feed
FASE 9  → Music
FASE 10 → Favorite Games
FASE 11 → Live
FASE 12 → Performance Governor
FASE 13 → MotionWallpaper
FASE 14 → Browser
FASE 15 → Videos & Films
FASE 16 → ScreenShare & RemoteShare
FASE 17 → Settings
FASE 18 → Sistema de Temas
FASE 19 → Multi-Janela
FASE 20 → Notifications
FASE 21 → Projects
FASE 22 → Marketplace
FASE 23 → Welcome & Onboarding
FASE 24 → Polish & Produção
```


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: PROGRESS.md
# ==========================================

# Status de Progresso — Social OS

Este documento reflete o estado atual de implementação baseado na análise do código-fonte e dos arquivos de infraestrutura.

---

## 📊 Resumo Executivo
- **Infraestrutura Global:** 95%
- **Core Systems (Layout/Auth/Realtime):** 85%
- **Módulo Chat:** 60%
- **Módulos Secundários:** 15%
- **Progresso Total Estimado:** 45%

---

## ✅ FASE 0 — Fundação (95%)
- [x] Scaffold Tauri + React + Vite.
- [x] Design Tokens (dark.css, light.css, tokens.css).
- [x] Sistema de i18n (PT-BR, EN-US, ES-ES).
- [x] Configurações de Clientes (Supabase, R2, Constants).
- [x] Types Globais (User, Message, Layout, Module).
- [x] Stores Base (Auth, Layout, Presence, Events, Offline).
- [x] Componentes UI Base (Button, Input, Skeleton).

## ✅ FASE 1 — Layout Engine (100%)
- [x] Lógica de Árvore (`layout-tree.ts`) com suporte a Split, Tabs e Dock.
- [x] Store de Layout com persistência no Supabase.
- [x] `LayoutEngine.tsx` renderizando a árvore recursivamente.
- [x] `SplitPane` e `ResizeHandle` funcionais (Resizing funcional).
- [x] `EmptyPane` com Context Menu base.

## ✅ FASE 2 — Drag Handle System (90%)
- [x] `DragHandle` customizado (sem drag nativo do HTML).
- [x] `DragOverlay` com 5 zonas de drop (centro, topo, baixo, esquerda, direita).
- [x] `ModuleWrapper` integrando o sistema de drag.
- [ ] *Pendente:* Polimento fino no cálculo de zonas de drop em telas de alta densidade.

## 🟡 FASE 3 — Real-time & Offline (80%)
- [x] `RealtimeProvider` configurado para canais do Supabase.
- [x] Hook `useOffline` detectando estado de conexão.
- [x] Fila de ações offline (`offline.store.ts`).
- [x] `usePresence` atualizando status online/offline.
- [ ] *Pendente:* Implementar `flushQueue()` real para reprocessar ações ao reconectar.

## 🟡 FASE 4 — Auth & Profile Core (85%)
- [x] Fluxo de Login/Signup integrado ao Supabase.
- [x] `auth.store.ts` gerenciando sessões.
- [x] Componentes `ProfileAvatar`, `ProfileBanner` e `ProfileStatus`.
- [x] Sistema de Stories (UI de StoriesLine).
- [ ] *Pendente:* Upload de mídia real para Stories via R2.

## 🟡 FASE 5 — Global Search (95%)
- [x] Janela `search` criada via Rust com efeito Mica/Acrylic.
- [x] Atalho Global `Ctrl+Alt+Space` funcional.
- [x] `SearchOverlay` com foco automático no input.
- [x] Lógica de Show/Hide robusta no `main.rs`.

## 🟠 FASE 6 — Módulo Chat (55%)
- [x] `chat.store.ts` com Optimistic Updates.
- [x] Interface de DM e Listagem de Conversas.
- [x] Real-time para novas mensagens.
- [ ] **URGENTE:** Lógica real do `Cold Storage` no Rust (`cold_storage.rs`).
- [ ] **URGENTE:** Agrupamento de mensagens por autor (`MessageGroup`).
- [ ] *Pendente:* Reações e Favoritos.

## 🔴 PRÓXIMAS ETAPAS (Fases 7-24)
- [ ] **Fase 7:** BottomBar Global (Hardware Stats Reais).
- [ ] **Fase 8:** Módulo Feed (Posts e Comentários).
- [ ] **Fase 9:** Módulo Music (Player e Integração Local).
- [ ] **Fase 10:** Favorite Games (Detecção de Processos via Rust).
- [ ] **Fase 12:** Performance Governor (Gráficos de CPU/GPU).
- [ ] **Fase 13:** Motion Wallpaper (Vídeo como Wallpaper via Rust).

---
*Última atualização: Março de 2026*


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: R2_STRUCTURE.md
# ==========================================

# R2_STRUCTURE.md — Estrutura de Paths no Cloudflare R2

> **ATENÇÃO PARA A IA:** Todo arquivo enviado ao R2 DEVE seguir exatamente os paths definidos aqui. Não inventar paths. Não usar nomes diferentes. Usar SEMPRE a função `buildR2Path()` definida no final deste documento para gerar paths — nunca construir strings de path manualmente.

---

## CONVENÇÕES GERAIS

- Todos os IDs usados nos paths são UUIDs sem hífens: `550e8400e29b41d4a716446655440000`
- Nomes de arquivo em minúsculas com hífens: `profile-photo.webp`
- Datas em formato `YYYY-MM`: `2024-01`
- Extensões sempre explícitas
- Nunca usar espaços ou caracteres especiais nos paths
- Imagens sempre convertidas para `.webp` antes de fazer upload
- Vídeos sempre em `.mp4` (H.264)
- Áudios sempre em `.ogg`

---

## ESTRUTURA COMPLETA DE PATHS

```
social-os-media/                              ← nome do bucket R2
│
├── avatars/
│   └── {userId}/
│       ├── main.webp                         ← foto principal de perfil
│       ├── slide-{index}.webp                ← fotos do slide (slide-0.webp, slide-1.webp...)
│       └── alt.webp                          ← imagem alternativa para não seguidores
│
├── banners/
│   └── {userId}/
│       └── banner.{ext}                      ← ext: webp | mp4 | gif
│
├── stories/
│   └── {userId}/
│       └── {storyId}.{ext}                   ← ext: webp | mp4 | gif
│
├── posts/
│   └── {userId}/
│       └── {postId}/
│           ├── media-0.{ext}                 ← primeira mídia do post
│           ├── media-1.{ext}                 ← segunda mídia (se houver)
│           └── media-{n}.{ext}
│
├── messages/
│   └── {conversationId}/
│       └── {messageId}/
│           ├── media-0.{ext}                 ← primeira mídia da mensagem
│           └── media-{n}.{ext}
│
├── cold/
│   └── {conversationId}/
│       └── {YYYY-MM}.zst                     ← ex: 2024-01.zst
│                                             ← bloco comprimido de msgs do mês
│
├── wallpapers/
│   └── {assetId}/
│       ├── preview.webp                      ← preview estático
│       └── wallpaper.{ext}                   ← ext: mp4 | gif | webp
│
├── themes/
│   └── {assetId}/
│       ├── preview.webp                      ← screenshot do tema
│       └── theme.css                         ← arquivo CSS do tema
│
└── marketplace/
    └── {assetId}/
        ├── preview.webp
        └── asset.{ext}                       ← extensão varia por tipo de asset
```

---

## TABELA DE PATHS POR CONTEXTO

| Contexto | Path | Extensão | Observação |
|---|---|---|---|
| Foto principal de perfil | `avatars/{userId}/main.webp` | webp | Sempre webp |
| Slide de perfil (índice n) | `avatars/{userId}/slide-{n}.webp` | webp | n começa em 0 |
| Foto alternativa de perfil | `avatars/{userId}/alt.webp` | webp | Para não seguidores |
| Banner de usuário | `banners/{userId}/banner.{ext}` | webp/mp4/gif | Depende do tipo |
| Story | `stories/{userId}/{storyId}.{ext}` | webp/mp4/gif | |
| Mídia de post | `posts/{userId}/{postId}/media-{n}.{ext}` | webp/mp4/gif | n começa em 0 |
| Mídia de mensagem | `messages/{convId}/{msgId}/media-{n}.{ext}` | webp/mp4/ogg | ogg para áudio |
| Cold storage | `cold/{convId}/{YYYY-MM}.zst` | zst | Agrupado por mês |
| Preview de wallpaper | `wallpapers/{assetId}/preview.webp` | webp | |
| Arquivo de wallpaper | `wallpapers/{assetId}/wallpaper.{ext}` | mp4/gif/webp | |
| Preview de tema | `themes/{assetId}/preview.webp` | webp | |
| CSS de tema | `themes/{assetId}/theme.css` | css | |
| Asset de marketplace | `marketplace/{assetId}/asset.{ext}` | varia | |

---

## FUNÇÃO buildR2Path — usar sempre esta função

```ts
// Em: src/utils/r2-paths.ts
// NUNCA construir paths R2 fora desta função

type R2PathContext =
  | { type: 'avatar-main';    userId: string }
  | { type: 'avatar-slide';   userId: string; index: number }
  | { type: 'avatar-alt';     userId: string }
  | { type: 'banner';         userId: string; ext: 'webp' | 'mp4' | 'gif' }
  | { type: 'story';          userId: string; storyId: string; ext: 'webp' | 'mp4' | 'gif' }
  | { type: 'post-media';     userId: string; postId: string; index: number; ext: 'webp' | 'mp4' | 'gif' }
  | { type: 'message-media';  conversationId: string; messageId: string; index: number; ext: 'webp' | 'mp4' | 'ogg' }
  | { type: 'cold-storage';   conversationId: string; yearMonth: string }  // yearMonth: '2024-01'
  | { type: 'wallpaper-preview'; assetId: string }
  | { type: 'wallpaper-file'; assetId: string; ext: 'mp4' | 'gif' | 'webp' }
  | { type: 'theme-preview';  assetId: string }
  | { type: 'theme-css';      assetId: string }
  | { type: 'marketplace-asset'; assetId: string; ext: string }

export function buildR2Path(ctx: R2PathContext): string {
  switch (ctx.type) {
    case 'avatar-main':
      return `avatars/${ctx.userId}/main.webp`

    case 'avatar-slide':
      return `avatars/${ctx.userId}/slide-${ctx.index}.webp`

    case 'avatar-alt':
      return `avatars/${ctx.userId}/alt.webp`

    case 'banner':
      return `banners/${ctx.userId}/banner.${ctx.ext}`

    case 'story':
      return `stories/${ctx.userId}/${ctx.storyId}.${ctx.ext}`

    case 'post-media':
      return `posts/${ctx.userId}/${ctx.postId}/media-${ctx.index}.${ctx.ext}`

    case 'message-media':
      return `messages/${ctx.conversationId}/${ctx.messageId}/media-${ctx.index}.${ctx.ext}`

    case 'cold-storage':
      return `cold/${ctx.conversationId}/${ctx.yearMonth}.zst`

    case 'wallpaper-preview':
      return `wallpapers/${ctx.assetId}/preview.webp`

    case 'wallpaper-file':
      return `wallpapers/${ctx.assetId}/wallpaper.${ctx.ext}`

    case 'theme-preview':
      return `themes/${ctx.assetId}/preview.webp`

    case 'theme-css':
      return `themes/${ctx.assetId}/theme.css`

    case 'marketplace-asset':
      return `marketplace/${ctx.assetId}/asset.${ctx.ext}`
  }
}

// Exemplos de uso:
// buildR2Path({ type: 'avatar-main', userId: 'abc123' })
//   → 'avatars/abc123/main.webp'

// buildR2Path({ type: 'cold-storage', conversationId: 'xyz', yearMonth: '2024-01' })
//   → 'cold/xyz/2024-01.zst'

// buildR2Path({ type: 'message-media', conversationId: 'xyz', messageId: 'abc', index: 0, ext: 'webp' })
//   → 'messages/xyz/abc/media-0.webp'
```

---

## REGRAS DE UPLOAD

### Antes de fazer upload, sempre:
1. Converter imagens para `.webp` (melhor compressão, suporte universal)
2. Converter vídeos para `.mp4` H.264 (compatível com WebView do Tauri)
3. Converter áudios para `.ogg` (menor tamanho)
4. Remover metadata EXIF de imagens (privacidade)
5. Validar tamanho máximo por tipo:

| Tipo | Tamanho máximo |
|---|---|
| Avatar / banner (imagem) | 5MB |
| Story (imagem) | 10MB |
| Story (vídeo) | 50MB |
| Mídia de mensagem (imagem) | 20MB |
| Mídia de mensagem (vídeo) | 100MB |
| Mídia de mensagem (áudio) | 20MB |
| Post (imagem) | 20MB |
| Post (vídeo) | 200MB |
| Wallpaper (vídeo) | 500MB |
| Tema (CSS) | 100KB |

### Ao deletar conteúdo, sempre deletar o arquivo no R2 também
- Deletar avatar → remover `avatars/{userId}/main.webp` do R2
- Deletar story → remover `stories/{userId}/{storyId}.{ext}` do R2
- Deletar mensagem para todos → remover `messages/{convId}/{msgId}/` do R2
- Soft delete (apenas `deleted_at`) → NÃO remover do R2 ainda (aguardar cleanup job)


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: SCOPE.md
# ==========================================

# SCOPE.md — Desktop Social OS

Este documento é a fonte da verdade do projeto.

---

## 10. MÓDULOS DETALHADOS

### Chat

**Home — Header**
- Linha de stories horizontais com scroll.
- Story do usuário com botão "+" para criar.
- Stories com story novo têm anel de gradiente.
- Barra de busca de conversas local/Supabase.

**ChatDM — Funcionalidades Core**
- Bolhas de mensagem com agrupamento sequencial.
- Enviar com senha de acesso e agendamento.
- Apagar mensagem mantendo histórico.
- ScreenShare direto da DM.
- Context Menu: Responder, Editar, Reenviar imagem, Fixar, Favoritar, Salvar trecho.

---

### 11. RESERVADOS / FUTURO (Ideias de Próxima Geração)

> **Nota:** Repositório absoluto de ideias (153 itens).

**A. Omniverse Approved (Movidos para Reserva)**
- **Soundboard Social:** Reações sonoras remotas (Uêpa, Cavalo, etc.).
- **Social Macro:** Automações de sistema coletivas ("Bora Jogar").
- **Auto-Bio Dinâmica (Rust):** Bio muda conforme app em foco.

**B. Advanced Chat (Sugestões Adiadas)**
- SyncShare, Monaco Engine, Quick Reminders, Whiteboard, Screen Snip, Voice Transcription, Contextual Status, Nudge.

**C. Omniverse Backlog (1-100)**
- Social Clipboard, Battery Pulse, Ghost Mouse, Focus Bubble, App Sync-Link, Desktop Peek, Gamification, etc.

**D. Omniverse Tier Two (101-150)**
- Squad Ledger, Local AI Proxy, Benchmarking, BIOS Recados, Soundscapes, Graffiti, VPN P2P, Hardware Diagnostics, etc.

**E. Chat Omniverse (Ideias GPT - Backlog)**
- Enquetes, Tradução, Modo Anônimo, Bloqueio de Print, PiP, Heatmaps, etc.

---

### Feed
- Lista de posts em tempo real.
- Flow de criação com upload para R2.
- Visibilidade All/Followers.


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: SEARCH.md
# ==========================================

# SEARCH_WINDOW_FIX.md — Solução Completa: Janela de Search Global

> **CONTEXTO DO PROBLEMA:** A janela de search abre como aba oculta no Windows e não responde ao atalho global. Isso acontece por 3 razões combinadas:
> 1. Tauri 2 no Windows não aceita `visible: false` + `transparent: true` na config estática — a janela precisa ser **criada em runtime**, não declarada no `tauri.conf.json`
> 2. A janela precisa de `focus()` explícito depois de `show()` no Windows
> 3. O React precisa saber que está rodando na janela `search` para renderizar o componente correto (não o AppLayout inteiro)

---

## PASSO 1 — Remover a janela search do tauri.conf.json

```json
// src-tauri/tauri.conf.json
// REMOVER o objeto da janela "search" do array "windows"
// Deixar APENAS a janela "main"

{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "SocialOS",
        "width": 1280,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": false,
        "transparent": true,
        "shadow": true,
        "center": true,
        "visible": true,
        "skipTaskbar": false
      }
      // ← SEM a janela "search" aqui
    ]
  }
}
```

---

## PASSO 2 — Criar a janela search em runtime no Rust

```rust
// src-tauri/src/windows/mod.rs
// A janela search é criada na primeira vez que o atalho é pressionado
// e depois apenas mostrada/escondida

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use window_vibrancy::{apply_mica, apply_acrylic};

pub fn toggle_search_window(app: &AppHandle) {
    // Tenta encontrar a janela search já criada
    if let Some(window) = app.get_webview_window("search") {
        // Janela já existe — apenas mostrar ou esconder
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            show_search_window(&window);
        }
        return;
    }

    // Janela não existe ainda — criar pela primeira vez
    match create_search_window(app) {
        Ok(window) => show_search_window(&window),
        Err(e) => eprintln!("Erro ao criar janela search: {}", e),
    }
}

fn create_search_window(app: &AppHandle) -> Result<tauri::WebviewWindow, Box<dyn std::error::Error>> {
    // Pegar o monitor onde a janela principal está
    let main_window = app.get_webview_window("main")
        .ok_or("janela main não encontrada")?;

    let monitor = main_window.current_monitor()?
        .ok_or("monitor não encontrado")?;

    let monitor_size = monitor.size();
    let monitor_pos = monitor.position();

    // Calcular posição centralizada no monitor
    let window_width: u32 = 680;
    let window_height: u32 = 500;
    let x = monitor_pos.x + ((monitor_size.width as i32 - window_width as i32) / 2);
    let y = monitor_pos.y + ((monitor_size.height as i32 - window_height as i32) / 3); // 1/3 do topo

    let window = WebviewWindowBuilder::new(
        app,
        "search",
        WebviewUrl::App("search.html".into()), // ← PONTO CHAVE: URL separada
    )
    .title("")
    .inner_size(window_width as f64, window_height as f64)
    .position(x as f64, y as f64)
    .resizable(false)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .shadow(true)
    .visible(false) // começa escondida
    .build()?;

    // Aplicar Mica/Acrylic na janela de search
    #[cfg(target_os = "windows")]
    {
        apply_mica(&window, Some(true))
            .unwrap_or_else(|_| {
                let _ = apply_acrylic(&window, Some((0, 0, 0, 180)));
            });
    }

    // Fechar ao perder foco (clicar fora)
    let window_clone = window.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(false) = event {
            let _ = window_clone.hide();
        }
    });

    Ok(window)
}

fn show_search_window(window: &tauri::WebviewWindow) {
    // Sequência EXATA para Windows — cada passo é necessário
    let _ = window.show();

    // No Windows, set_focus() pode falhar na primeira chamada
    // Chamar duas vezes garante que funciona
    let _ = window.set_focus();

    // Emitir evento para o React focar o input
    let _ = window.emit("search:focused", ());
}
```

---

## PASSO 3 — Atualizar shortcuts/mod.rs

```rust
// src-tauri/src/shortcuts/mod.rs

use tauri::{AppHandle};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use crate::windows;

pub fn register_all(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(
        Some(Modifiers::CONTROL | Modifiers::ALT),
        Code::Space
    );

    app.global_shortcut().register(shortcut, |app, _shortcut, _event| {
        windows::toggle_search_window(app);
    })?;

    Ok(())
}
```

---

## PASSO 4 — Atualizar lib.rs para registrar o módulo windows

```rust
// src-tauri/src/lib.rs

mod commands;
mod shortcuts;
mod tray;
pub mod windows; // ← tornar pub para usar em shortcuts
mod jobs;

// ... resto do lib.rs igual ao SETUP.md
```

---

## PASSO 5 — Criar search.html como entry point separado

O Vite precisa gerar um HTML separado para a janela de search.
Isso é o que resolve o problema de "segunda aba" — cada janela carrega seu próprio HTML.

```ts
// vite.config.ts — ATUALIZAR para build multi-page

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: '0.0.0.0',
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,

    // ADICIONADO: build multi-page
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),        // janela principal
        search: resolve(__dirname, 'search.html'),       // janela de search
      },
    },
  },
})
```

---

## PASSO 6 — Criar search.html na raiz do projeto

```html
<!-- search.html — na raiz do projeto, ao lado do index.html -->
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Search</title>
    <!-- Fundo transparente para o Mica aparecer -->
    <style>
      html, body, #root {
        background: transparent !important;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/search-main.tsx"></script>
  </body>
</html>
```

---

## PASSO 7 — Criar src/search-main.tsx (entry point da janela search)

```tsx
// src/search-main.tsx
// Entry point SEPARADO para a janela de search
// NÃO importar AppLayout, stores de chat, etc.
// Apenas o necessário para o search funcionar

import React from 'react'
import ReactDOM from 'react-dom/client'

import './i18n/index'
import './styles/global.module.css'
import './styles/tokens.css'
import './styles/animations.css'

import { SearchApp } from './layouts/SearchOverlay/SearchApp'

// Aplicar tema salvo (lido do localStorage da janela principal via Tauri event)
document.documentElement.setAttribute('data-theme', 'dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SearchApp />
  </React.StrictMode>
)
```

---

## PASSO 8 — Criar src/layouts/SearchOverlay/SearchApp.tsx

```tsx
// src/layouts/SearchOverlay/SearchApp.tsx
// Componente raiz da janela de search
// Gerencia: foco no input, fechar com Esc, sincronizar tema

import { useEffect, useRef, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { GlobalSearch } from '@/components/shared/GlobalSearch/GlobalSearch'
import styles from './SearchApp.module.css'

export function SearchApp() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  // Focar input quando a janela ganhar foco
  useEffect(() => {
    // Escutar evento emitido pelo Rust ao mostrar a janela
    const unlistenFocus = listen('search:focused', () => {
      setQuery('') // limpar query anterior
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50) // pequeno delay para garantir que a janela está visível
    })

    // Fechar com Esc
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        getCurrentWindow().hide()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      unlistenFocus.then(fn => fn())
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className={styles.searchApp}>
      <GlobalSearch
        inputRef={inputRef}
        query={query}
        onQueryChange={setQuery}
        onClose={() => getCurrentWindow().hide()}
      />
    </div>
  )
}
```

```css
/* src/layouts/SearchOverlay/SearchApp.module.css */
.searchApp {
  width: 100vw;
  height: 100vh;
  background: transparent;  /* Deixa o Mica aparecer */
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
}
```

---

## PASSO 9 — Criar GlobalSearch.tsx

```tsx
// src/components/shared/GlobalSearch/GlobalSearch.tsx

import { RefObject } from 'react'
import styles from './GlobalSearch.module.css'

interface GlobalSearchProps {
  inputRef: RefObject<HTMLInputElement>
  query: string
  onQueryChange: (q: string) => void
  onClose: () => void
}

export function GlobalSearch({
  inputRef,
  query,
  onQueryChange,
  onClose
}: GlobalSearchProps) {
  return (
    <div className={styles.container}>
      {/* Input principal */}
      <div className={styles.inputWrapper}>
        <span className={styles.icon}>⌕</span>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="Buscar pessoas, mensagens, músicas..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button className={styles.clear} onClick={() => onQueryChange('')}>
            ✕
          </button>
        )}
      </div>

      {/* Resultados aparecem quando há query */}
      {query.length > 0 && (
        <div className={styles.results}>
          {/* SearchResults component aqui */}
          <p style={{ color: 'var(--color-subtitle)', padding: '16px' }}>
            Buscando por "{query}"...
          </p>
        </div>
      )}

      {/* Footer com dica de atalhos */}
      {query.length === 0 && (
        <div className={styles.hints}>
          <span><kbd>↑↓</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
          <span><kbd>Esc</kbd> fechar</span>
        </div>
      )}
    </div>
  )
}
```

```css
/* src/components/shared/GlobalSearch/GlobalSearch.module.css */

.container {
  width: 100%;
  max-width: 640px;
  background: rgba(var(--bg-module-rgb, 2,2,2), 0.75);
  border-radius: var(--radius-module);
  overflow: hidden;
  /* Sem border — profundidade vem do Mica atrás */
}

.inputWrapper {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 56px;
  gap: 12px;
}

.icon {
  font-size: 20px;
  color: var(--color-subtitle);
  flex-shrink: 0;
}

.input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: var(--color-title);
  caret-color: var(--color-title);
}

.input::placeholder {
  color: var(--color-subtitle);
}

.clear {
  background: transparent;
  border: none;
  color: var(--color-subtitle);
  cursor: pointer;
  font-size: 14px;
  padding: 4px;
  border-radius: 50%;
  transition: color var(--duration-instant, 100ms) ease;
}

.clear:hover {
  color: var(--color-title);
}

.results {
  border-top: 1px solid rgba(255,255,255,0.06);
  max-height: 400px;
  overflow-y: auto;
}

.hints {
  display: flex;
  gap: 24px;
  padding: 12px 20px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.hints span {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-subtitle);
}

.hints kbd {
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: monospace;
  color: var(--color-subtitle);
}
```

---

## RESUMO — O que cada passo resolve

| Passo | Problema que resolve |
|---|---|
| Remover search do conf | Janela não aparece mais como "segunda aba oculta" |
| Criar janela em runtime | Windows aceita `transparent + always_on_top` só em janelas criadas dinamicamente |
| `search.html` separado | Cada janela carrega seu próprio React — sem conflito de estado |
| `search-main.tsx` separado | Search não carrega stores do Chat, Music, etc. — inicialização rápida |
| `show()` + `set_focus()` duas vezes | Fix do bug do Windows onde foco falha na primeira chamada |
| `on_window_event(Focused(false))` | Fecha ao clicar fora automaticamente |
| Emit `search:focused` do Rust | React sabe exatamente quando focar o input |

---

## ORDEM DE EXECUÇÃO

1. Substituir `tauri.conf.json` (remover janela search)
2. Criar `src-tauri/src/windows/mod.rs`
3. Atualizar `src-tauri/src/lib.rs`
4. Atualizar `src-tauri/src/shortcuts/mod.rs`
5. Atualizar `vite.config.ts`
6. Criar `search.html` na raiz
7. Criar `src/search-main.tsx`
8. Criar `src/layouts/SearchOverlay/SearchApp.tsx`
9. Criar `src/components/shared/GlobalSearch/GlobalSearch.tsx`
10. Rodar `npm run tauri dev` e testar `Ctrl+Alt+Space`


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: SETUP.md
# ==========================================

# SETUP.md — Configuração Completa do Projeto

> **ATENÇÃO PARA A IA:** Este arquivo contém os arquivos de configuração COMPLETOS e EXATOS. Não modificar valores sem razão explícita. Não adicionar campos não listados.

---

## .env (variáveis de ambiente — nunca commitar este arquivo)

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
VITE_R2_ACCOUNT_ID=seu-account-id
VITE_R2_ACCESS_KEY_ID=sua-access-key
VITE_R2_SECRET_ACCESS_KEY=sua-secret-key
VITE_R2_BUCKET_NAME=social-os-media
VITE_R2_PUBLIC_URL=https://media.seudominio.com
```

## .env.example (versão sem valores — commitar este)

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_R2_ACCOUNT_ID=
VITE_R2_ACCESS_KEY_ID=
VITE_R2_SECRET_ACCESS_KEY=
VITE_R2_BUCKET_NAME=
VITE_R2_PUBLIC_URL=
```

---

## src-tauri/tauri.conf.json — COMPLETO

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "SocialOS",
  "version": "0.1.0",
  "identifier": "com.socialos.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "SocialOS",
        "width": 1280,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "decorations": false,
        "transparent": true,
        "shadow": true,
        "center": true,
        "visible": true,
        "skipTaskbar": false
      },
      {
        "label": "search",
        "title": "",
        "width": 680,
        "height": 500,
        "resizable": false,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": false,
        "center": true,
        "visible": false,
        "skipTaskbar": true,
        "shadow": true,
}
    ],
    "security": {
      "csp": null
    },
    "trayIcon": {
      "iconPath": "icons/tray.png",
      "title": "SocialOS",
      "tooltip": "SocialOS"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  },
  "plugins": {
    "window-state": {
      "stateFlags": 31
    },
    "deep-link": {
      "mobile": [],
      "desktop": ["socialos"]
    },
    "global-shortcut": {}
  }
}
```

---

## src-tauri/src/main.rs — COMPLETO

```rust
// src-tauri/src/main.rs
// Ponto de entrada do processo Tauri
// NÃO adicionar lógica aqui — apenas configuração

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    social_os_lib::run()
}
```

---

## src-tauri/src/lib.rs — COMPLETO

```rust
// src-tauri/src/lib.rs
// Registra todos os plugins, commands e handlers

mod commands;
mod shortcuts;
mod tray;
mod windows;
mod jobs;

use tauri::Manager;
use window_vibrancy::{apply_mica, apply_acrylic};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Plugins
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        // Commands expostos ao frontend
        .invoke_handler(tauri::generate_handler![
            commands::hardware::get_cpu_usage,
            commands::hardware::get_gpu_usage,
            commands::hardware::get_ram_usage,
            commands::hardware::get_network_speed,
            commands::processes::get_active_game,
            commands::processes::get_process_cpu_usage,
            commands::storage::save_offline_queue,
            commands::storage::load_offline_queue,
            commands::wallpaper::set_wallpaper,
            commands::wallpaper::pause_wallpaper,
            commands::wallpaper::resume_wallpaper,
        ])
        .setup(|app| {
            let main_window = app.get_webview_window("main").unwrap();

            // Aplicar efeito Mica no Windows 11
            #[cfg(target_os = "windows")]
            {
                apply_mica(&main_window, Some(true))
                    .unwrap_or_else(|_| {
                        // Fallback para Windows 10: usar Acrylic
                        apply_acrylic(&main_window, Some((0, 0, 0, 120)))
                            .unwrap_or(());
                    });
            }

            // Configurar janela de search com Mica também
            if let Some(search_window) = app.get_webview_window("search") {
                #[cfg(target_os = "windows")]
                {
                    apply_mica(&search_window, Some(true))
                        .unwrap_or_else(|_| {
                            apply_acrylic(&search_window, Some((0, 0, 0, 180)))
                                .unwrap_or(());
                        });
                }
            }

            // Registrar atalhos globais
            shortcuts::register_all(app.handle())?;

            // Configurar tray icon
            tray::setup(app)?;

            // Iniciar background jobs
            let app_handle = app.handle().clone();
            tokio::spawn(async move {
                jobs::cold_storage::start(app_handle).await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o app");
}
```

---

## src-tauri/src/shortcuts/mod.rs — COMPLETO

```rust
// src-tauri/src/shortcuts/mod.rs
// Registra TODOS os atalhos globais (funcionam mesmo com app em background)

use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

pub fn register_all(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Ctrl+Alt+Space → mostrar/esconder Global Search
    let shortcut = Shortcut::new(
        Some(Modifiers::CONTROL | Modifiers::ALT),
        Code::Space
    );

    app.global_shortcut().register(shortcut, |app, _shortcut, _event| {
        if let Some(window) = app.get_webview_window("search") {
            if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
            } else {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    })?;

    Ok(())
}
```

---

## src/config/supabase.ts — COMPLETO

```ts
// src/config/supabase.ts
// Instância única do cliente Supabase
// IMPORTAR APENAS DESTE ARQUIVO — nunca criar outro cliente

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase.types' // gerado pelo Supabase CLI

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar definidos no .env'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,         // Sessão persiste entre reinicializações do app
    autoRefreshToken: true,       // Renova token automaticamente
    detectSessionInUrl: false,    // App desktop não usa URL para auth
  },
  realtime: {
    params: {
      eventsPerSecond: 10,        // Limite de eventos por segundo
    },
  },
})
```

---

## src/config/r2.ts — COMPLETO

```ts
// src/config/r2.ts
// Cliente Cloudflare R2 (compatível com S3)
// Cloudflare R2 não tem SDK próprio — usa AWS SDK S3 com endpoint customizado

// ATENÇÃO: Upload de arquivos grandes deve ser feito via multipart upload
// NÃO usar este cliente para uploads acima de 100MB

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL

// Gera URL pública de um arquivo no R2
// Usar sempre esta função ao montar URLs de mídia
export function getR2Url(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path  // já é URL completa
  return `${R2_PUBLIC_URL}/${path}`
}

// Upload via fetch para endpoint R2
export async function uploadToR2(
  path: string,
  file: File | Blob,
  contentType: string
): Promise<string> {
  // Upload via Supabase Storage como proxy para R2
  // ou via presigned URL gerada pelo backend
  // Implementar conforme estratégia de auth escolhida
  throw new Error('Implementar upload para R2')
}
```

---

## src/config/constants.ts — COMPLETO

```ts
// src/config/constants.ts
// Constantes globais do app
// Qualquer valor "mágico" no código deve vir daqui

// Storage
export const COLD_STORAGE_DAYS = 30          // Dias antes de migrar para cold storage
export const MAX_MESSAGES_CACHE = 100        // Máx mensagens em cache local por conversa
export const MAX_FEED_CACHE = 50             // Máx posts em cache local

// Retry
export const MAX_RETRY_COUNT = 3             // Tentativas máximas na fila offline
export const QUEUE_EXPIRY_HOURS = 24         // Horas até ação expirar na fila

// UI
export const DRAG_THRESHOLD_PX = 8           // Pixels de movimento para ativar drag
export const DRAG_HANDLE_HEIGHT_DEFAULT = 5  // px — altura padrão do handle
export const DRAG_HANDLE_HEIGHT_REVEALED = 20 // px — altura ao revelar
export const DRAG_HANDLE_CONTENT_SHIFT = 15  // px — translateY do conteúdo

// Hardware polling
export const HARDWARE_POLL_INTERVAL_MS = 2000 // Intervalo de leitura de CPU/GPU/RAM

// Toast
export const TOAST_DURATION_SHORT = 3000     // ms — success, info
export const TOAST_DURATION_LONG = 5000      // ms — error, warning
export const TOAST_MAX_VISIBLE = 3           // Máx toasts simultâneos

// Stories
export const STORY_EXPIRY_HOURS = 24         // Horas até story expirar
export const STORY_DEFAULT_DURATION_MS = 5000 // Duração padrão por story

// Layout
export const LAYOUT_MIN_RATIO = 0.15         // Ratio mínimo de split (15%)
export const LAYOUT_MAX_RATIO = 0.85         // Ratio máximo de split (85%)

// Presença
export const PRESENCE_AWAY_AFTER_MS = 5 * 60 * 1000  // 5 min sem interação → Away

// Módulos — tamanhos mínimos
export const MODULE_MIN_SIZES: Record<string, { width: number; height: number }> = {
  Chat:                { width: 400, height: 0 },
  Feed:                { width: 400, height: 0 },
  Music:               { width: 400, height: 0 },
  Live:                { width: 400, height: 0 },
  Videos:              { width: 400, height: 0 },
  Films:               { width: 400, height: 0 },
  Browser:             { width: 400, height: 0 },
  FavoriteGames:       { width: 0,   height: 375 },
  RemoteShare:         { width: 400, height: 0 },
  ScreenShare:         { width: 400, height: 0 },
  MotionWallpaper:     { width: 400, height: 0 },
  PerformanceGovernor: { width: 400, height: 0 },
  Marketplace:         { width: 400, height: 0 },
  Projects:            { width: 400, height: 0 },
  Settings:            { width: 400, height: 0 },
  Notifications:       { width: 400, height: 0 },
}
```

---

## .gitignore

```
# Dependências
node_modules/
target/

# Ambiente
.env
.env.local

# Build
dist/
dist-ssr/

# Tauri
src-tauri/target/
src-tauri/gen/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Cache local do app (gerado em runtime)
*.cache.json
```


# ==========================================
# CONTEÚDO ORIGINAL DO ARQUIVO: STRUCTURE.md
# ==========================================

# STRUCTURE.md — Organização de Pastas

> **ATENÇÃO PARA A IA:** Siga esta estrutura de pastas EXATAMENTE como definida. Não criar pastas fora desta estrutura. Não renomear pastas ou arquivos. Se um arquivo não está listado aqui e você precisa criar um, criar dentro da pasta mais próxima do contexto descrito.

---

## REGRAS FUNDAMENTAIS DE ORGANIZAÇÃO

### 1. Módulos são ilhas isoladas
- Um módulo NUNCA importa diretamente de outro módulo
- `modules/Chat/` nunca faz `import from '../Music/'`
- Comunicação entre módulos APENAS via `events.store.ts`

### 1.1 Navegação interna é por Flow (sem React Router)
- Telas internas de módulos (ex: criar post/story, adicionar música, detalhes de jogo) **NUNCA** viram rotas
- Módulos controlam telas internas por estado `view/flow` no store do próprio módulo
- Cruzar módulos ou acionar flows via `events.store.ts` (eventos), nunca import direto


### 2. Componentes têm hierarquia clara
- `components/ui/` → primitivos (Button, Input, Avatar) — sem lógica de negócio
- `components/shared/` → compostos reutilizáveis por 2+ módulos — podem ter lógica
- `components/profile/` → componentes do User Profile Core — usados em todo o app
- `modules/X/components/` → componentes exclusivos do módulo X — nunca usados fora dele

### 3. CSS sempre em módulo próprio
- Todo componente tem seu `.module.css` junto (mesmo diretório)
- Nunca CSS global exceto em `styles/`
- Nunca inline styles
- Nunca Tailwind

### 4. Stores são por domínio
- Um store por domínio de negócio
- Stores de módulo ficam em `store/modules/`
- Stores globais ficam em `store/`

### 5. Convenções de nomenclatura
- Componentes React → `PascalCase` (ex: `MessageBubble.tsx`)
- Hooks → `camelCase` com prefixo `use` (ex: `usePresence.ts`)
- Stores → `camelCase` com sufixo `.store.ts` (ex: `chat.store.ts`)
- Services → `camelCase` com sufixo `.service.ts` (ex: `message.service.ts`)
- Types → `PascalCase` com sufixo `.types.ts` (ex: `message.types.ts`)
- CSS Modules → mesmo nome do componente com `.module.css` (ex: `MessageBubble.module.css`)
- Constantes → `SCREAMING_SNAKE_CASE` (ex: `MAX_MESSAGE_LENGTH`)

### 6. Ordem de imports em todo arquivo .tsx/.ts
```ts
// 1. React e hooks do React
import { useState, useEffect } from 'react'

// 2. Libs externas (tauri, supabase, etc)
import { invoke } from '@tauri-apps/api/core'

// 3. Types
import type { Message } from '@/types/message.types'

// 4. Stores
import { useChatStore } from '@/store/modules/chat.store'

// 5. Hooks customizados
import { usePresence } from '@/hooks/usePresence'

// 6. Services
import { messageService } from '@/services/message.service'

// 7. Componentes
import { Avatar } from '@/components/ui/Avatar/Avatar'

// 8. Estilos (sempre por último)
import styles from './ComponentName.module.css'
```

---

## ESTRUTURA RAIZ

```
/
├── src-tauri/                  # Backend Rust (Tauri)
├── src/                        # Frontend React + Vite
├── public/                     # Assets estáticos (favicon, etc)
├── SCOPE.md                    # Escopo completo do projeto
├── STRUCTURE.md                # Este arquivo
├── PLAN.md                     # Plano de desenvolvimento por fases
├── PATTERNS.md                 # Padrões obrigatórios de código
├── DATABASE.md                 # Schema do Supabase
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## SRC-TAURI/

```
src-tauri/
├── src/
│   ├── main.rs                 # Entry point Tauri — configura janelas e plugins
│   ├── lib.rs                  # Registra todos os commands do Tauri
│   │
│   ├── commands/               # Funções Rust expostas ao frontend via invoke()
│   │   ├── mod.rs              # Re-exporta todos os commands
│   │   ├── hardware.rs         # CPU %, GPU %, RAM, velocidade de rede
│   │   ├── processes.rs        # Detecta jogos/apps ativos no sistema
│   │   ├── storage.rs          # Migração Hot→Cold (compressão zstd)
│   │   ├── wallpaper.rs        # Aplica wallpaper no desktop do Windows
│   │   └── remote.rs           # RemoteShare: captura e controle remoto
│   │
│   ├── shortcuts/
│   │   └── mod.rs              # Registra Ctrl+Alt+Space e outros atalhos globais
│   │                           # via tauri-plugin-global-shortcut
│   │
│   ├── tray/
│   │   └── mod.rs              # Ícone na bandeja do sistema + menu de contexto
│   │
│   ├── windows/
│   │   └── mod.rs              # Helpers para criar/mostrar/esconder janelas
│   │                           # Aplica Mica/Acrylic via window-vibrancy
│   │
│   └── jobs/
│       └── cold_storage.rs     # Job diário: migra mensagens antigas para R2 (zstd)
│
├── icons/                      # Ícones do app para todas as plataformas
├── tauri.conf.json             # Configuração de janelas, permissões, plugins
└── Cargo.toml                  # Dependências Rust
```

---

## SRC/ — VISÃO GERAL

```
src/
├── main.tsx                    # Entry point React — monta <App />
├── App.tsx                     # Router raiz — Welcome ou AppLayout
├── vite-env.d.ts
│
├── assets/                     # Assets importados pelo código
│   ├── fonts/                  # Arquivos de fonte
│   └── images/                 # Imagens estáticas do app (logos, etc)
│
├── styles/                     # Estilos globais — NADA de estilos de componente aqui
│   ├── global.module.css       # Reset CSS, estilos do body, scrollbar
│   ├── tokens.css              # Importa o tema ativo (dark por padrão)
│   ├── animations.css          # @keyframes globais reutilizáveis
│   └── themes/
│       ├── dark.css            # Variáveis CSS do tema escuro (padrão)
│       ├── light.css           # Variáveis CSS do tema claro
│       └── custom.css          # Template vazio para temas do Marketplace
│
├── i18n/                       # Internacionalização
│   ├── index.ts                # Configura i18next
│   └── locales/
│       ├── pt-BR.json          # Idioma padrão
│       ├── en-US.json
│       └── es-ES.json
│
├── config/                     # Configurações e clientes de serviços externos
│   ├── supabase.ts             # Cria e exporta o cliente Supabase
│   │                           # NUNCA importar supabase de outro lugar
│   ├── r2.ts                   # Cria e exporta o cliente Cloudflare R2
│   └── constants.ts            # Constantes globais (ex: COLD_STORAGE_DAYS = 30)
│
├── types/                      # TypeScript types globais
│   ├── user.types.ts           # User, UserStatus, UserSettings
│   ├── message.types.ts        # Message, MessageEdit, MessageReaction
│   ├── module.types.ts         # ModuleId, ModuleConfig, ModuleMode
│   ├── layout.types.ts         # LayoutNode, LayoutSplit, LayoutModule
│   ├── status.types.ts         # PresenceStatus, ActivityStatus
│   ├── event.types.ts          # AppEvent, EventType (todos os eventos do app)
│   └── index.ts                # Re-exporta tudo
│
├── store/                      # Zustand stores
│   ├── index.ts                # Re-exporta todos os stores
│   ├── auth.store.ts           # Sessão do usuário autenticado
│   ├── layout.store.ts         # Árvore de layout (LayoutNode tree)
│   ├── theme.store.ts          # Tema ativo: dark | light | custom-{id}
│   ├── presence.store.ts       # Status de presença do usuário atual
│   ├── events.store.ts         # Event bus cross-módulo (ver PATTERNS.md seção 4)
│   ├── offline.store.ts        # Fila de ações offline + estado de conexão
│   ├── notification.store.ts   # Lista de notificações não lidas
│   ├── search.store.ts         # Estado do Global Search
│   ├── hardware.store.ts       # CPU%, GPU%, RAM, velocidade de rede
│   └── modules/                # Store por módulo — isolados entre si
│       ├── chat.store.ts       # Estado do módulo Chat
│       ├── feed.store.ts       # Estado do módulo Feed
│       ├── music.store.ts      # Estado do módulo Music
│       ├── live.store.ts       # Estado do módulo Live
│       ├── games.store.ts      # Estado do módulo Games
│       └── projects.store.ts   # Estado do módulo Projects
│
├── hooks/                      # Hooks React customizados globais
│   ├── useRealtime.ts          # Subscribe/unsubscribe em canais Supabase Realtime
│   ├── usePresence.ts          # Lê e atualiza status de presença
│   ├── useHardware.ts          # Lê CPU/GPU/RAM via invoke() do Tauri
│   ├── useLayout.ts            # Manipula a árvore de layout
│   ├── useDragHandle.ts        # Lógica do drag handle hover reveal
│   ├── useContextMenu.ts       # Abre/fecha context menu global
│   ├── useSearch.ts            # Lógica do Global Search
│   ├── useStorage.ts           # Upload/download R2, hot→cold
│   ├── useOffline.ts           # Detecta offline, gerencia fila de reenvio
│   ├── useOptimistic.ts        # Padrão de optimistic updates (ver PATTERNS.md seção 1)
│   ├── useDeepLink.ts          # Escuta eventos de deep link app://
│   ├── useShortcuts.ts         # Registra e gerencia atalhos de teclado
│   ├── useTheme.ts             # Troca de tema sem reload
│   └── useI18n.ts              # Wrapper do i18next
│
├── services/                   # Camada de acesso a dados — toda chamada ao Supabase/R2 passa por aqui
│   ├── auth.service.ts         # Login, logout, sessão
│   ├── user.service.ts         # CRUD de perfil, follows, blocks
│   ├── message.service.ts      # CRUD de mensagens, edições, favoritos
│   ├── feed.service.ts         # Posts, reações, comentários
│   ├── music.service.ts        # Tracks, histórico
│   ├── live.service.ts         # Lives, viewers
│   ├── storage.service.ts      # Upload/download arquivos no R2
│   ├── notification.service.ts # Leitura e marcação de notificações
│   └── realtime.service.ts     # Gerencia inscrições em canais Realtime
│
├── utils/                      # Funções puras sem side effects
│   ├── format.ts               # Formatar datas, números, bytes, durações
│   ├── compress.ts             # Helpers de compressão zstd (cold storage)
│   ├── layout-tree.ts          # Operações na árvore binária de layout
│   │                           # (inserir nó, remover, dividir, calcular tamanhos)
│   ├── presence.ts             # Helpers de status de presença (label, cor)
│   ├── media.ts                # Helpers de mídia (tipo de arquivo, thumbnail)
│   └── deep-link.ts            # Parser de URLs app://
│
├── engine/                     # Sistemas core do app — não são módulos de produto
│   │
│   ├── layout/                 # Tiling Tree Split Engine
│   │   ├── LayoutEngine.tsx    # Componente raiz — renderiza a árvore de layout
│   │   ├── LayoutNode.tsx      # Renderiza um nó: módulo ou split
│   │   ├── SplitPane.tsx       # Painel dividido com ResizeHandle no meio
│   │   ├── ResizeHandle.tsx    # Handle de resize entre dois painéis
│   │   ├── EmptyPane.tsx       # Placeholder para painel vazio com context menu
│   │   └── layout.module.css
│   │
│   ├── drag/                   # Sistema de drag de módulos
│   │   ├── DragHandle.tsx      # Faixa invisível hover reveal (ver SCOPE.md seção 6)
│   │   ├── DragOverlay.tsx     # Overlay que mostra onde o módulo vai cair
│   │   └── drag.module.css
│   │
│   └── realtime/               # Motor de real-time
│       ├── RealtimeProvider.tsx # Context provider — inicializa conexões
│       ├── channels.ts          # Define TODOS os canais Supabase Realtime do app
│       └── handlers.ts          # Handlers por tipo de evento recebido
│
├── components/                 # Componentes React reutilizáveis
│   │
│   ├── ui/                     # Primitivos de UI — sem lógica de negócio
│   │   ├── Avatar/
│   │   │   ├── Avatar.tsx
│   │   │   └── Avatar.module.css
│   │   ├── Banner/
│   │   │   ├── Banner.tsx
│   │   │   └── Banner.module.css
│   │   ├── Button/
│   │   │   ├── Button.tsx      # Sempre radius --radius-interactive
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   │   ├── Input.tsx       # Sempre radius --radius-interactive
│   │   │   └── Input.module.css
│   │   ├── Badge/
│   │   │   ├── Badge.tsx
│   │   │   └── Badge.module.css
│   │   ├── Toggle/
│   │   │   ├── Toggle.tsx
│   │   │   └── Toggle.module.css
│   │   ├── Pill/
│   │   │   ├── Pill.tsx        # Filtros (Todos, Não lidas, etc)
│   │   │   └── Pill.module.css
│   │   ├── Skeleton/
│   │   │   ├── Skeleton.tsx    # Placeholder de carregamento — pulse de opacidade
│   │   │   └── Skeleton.module.css
│   │   ├── EmptyState/
│   │   │   ├── EmptyState.tsx  # Estado vazio com ícone, título, descrição e CTA opcional
│   │   │   └── EmptyState.module.css
│   │   └── Toast/
│   │       ├── Toast.tsx       # Notificações de feedback (success, error, info, warning)
│   │       ├── ToastContainer.tsx
│   │       └── Toast.module.css
│   │
│   ├── shared/                 # Componentes compostos usados por 2+ módulos
│   │   ├── ContextMenu/
│   │   │   ├── ContextMenu.tsx         # Menu de contexto global do app
│   │   │   ├── ContextMenuItem.tsx     # Item individual do menu
│   │   │   └── ContextMenu.module.css
│   │   ├── GlobalSearch/
│   │   │   ├── GlobalSearch.tsx        # Janela de search (roda na janela 'search')
│   │   │   ├── SearchResults.tsx       # Lista de resultados por categoria
│   │   │   ├── SearchResultItem.tsx    # Item individual de resultado
│   │   │   └── GlobalSearch.module.css
│   │   ├── StatusIndicator/
│   │   │   ├── StatusIndicator.tsx     # Ponto colorido de status de presença
│   │   │   └── StatusIndicator.module.css
│   │   ├── StoriesLine/
│   │   │   ├── StoriesLine.tsx         # Linha horizontal de stories com scroll
│   │   │   ├── StoryItem.tsx           # Item individual da linha
│   │   │   └── StoriesLine.module.css
│   │   ├── ModuleWrapper/
│   │   │   ├── ModuleWrapper.tsx       # Wrapper obrigatório para todo módulo
│   │   │   │                           # Contém DragHandle + radius + z-index correto
│   │   │   └── ModuleWrapper.module.css
│   │   └── OfflineBanner/
│   │       ├── OfflineBanner.tsx       # Banner "Sem conexão" no topo do app
│   │       └── OfflineBanner.module.css
│   │
│   └── profile/                # User Profile Core — usados em todo o app
│       ├── ProfileAvatar/
│       │   ├── ProfileAvatar.tsx       # Props: variant (mini|medium|full), userId
│       │   └── ProfileAvatar.module.css
│       ├── ProfileBanner/
│       │   ├── ProfileBanner.tsx       # Props: variant (card|chat|profile), userId
│       │   └── ProfileBanner.module.css
│       ├── ProfileStatus/
│       │   ├── ProfileStatus.tsx       # Status + atividade em tempo real
│       │   └── ProfileStatus.module.css
│       ├── ProfileMetrics/
│       │   ├── ProfileMetrics.tsx      # Posts, Seguidores, Seguindo clicáveis
│       │   └── ProfileMetrics.module.css
│       └── ProfileCard/
│           ├── ProfileCard.tsx         # Composição de Avatar + Status + Metrics
│           └── ProfileCard.module.css
│
├── modules/                    # Módulos de produto do app
│   │
│   ├── _base/                  # Componentes base compartilhados entre módulos
│   │   ├── ModuleHeader.tsx    # Header padrão com título e ações
│   │   ├── ModuleSection.tsx   # Área de conteúdo scrollável
│   │   ├── ModuleFooter.tsx    # Footer fixo na base do módulo
│   │   └── base.module.css
│   │
│   ├── Chat/
│   │   ├── index.tsx           # Entry point — gerencia qual tela mostrar
│   │   ├── Chat.module.css
│   │   ├── screens/
│   │   │   ├── Home/
│   │   │   │   ├── HomeScreen.tsx
│   │   │   │   ├── HomeHeader.tsx     # Stories + busca + filtros
│   │   │   │   ├── HomeSection.tsx    # Lista de conversas
│   │   │   │   ├── HomeFooter.tsx     # Botões + FAB
│   │   │   │   └── Home.module.css
│   │   │   ├── ChatDM/
│   │   │   │   ├── ChatDMScreen.tsx
│   │   │   │   ├── ChatDMHeader.tsx   # StoriesLine + card de perfil + ações
│   │   │   │   ├── ChatDMSection.tsx  # Área de mensagens
│   │   │   │   ├── ChatDMFooter.tsx   # Input + botões
│   │   │   │   └── ChatDM.module.css
│   │   │   └── ChatProfile/
│   │   │       ├── ChatProfileScreen.tsx
│   │   │       ├── ChatProfileHeader.tsx   # Foto + tabs
│   │   │       ├── ChatProfileSection.tsx  # Atividades recentes
│   │   │       ├── ChatProfileFooter.tsx   # Input + botões de controle
│   │   │       └── ChatProfile.module.css
│   │   └── components/         # Componentes exclusivos do Chat
│   │       ├── MessageBubble/  # Bolha de mensagem individual
│   │       ├── MessageGroup/   # Grupo colapsado de mensagens do mesmo autor
│   │       ├── MessageInput/   # Campo de texto com todos os botões
│   │       ├── ChatCard/       # Item da lista de conversas na Home
│   │       ├── StoryRing/      # Anel de story em volta do avatar
│   │       └── FloatingActions/ # FAB e submenu do footer da Home
│   │
│   ├── Feed/
│   │   ├── index.tsx
│   │   ├── Feed.module.css
│   │   ├── screens/
│   │   │   ├── FeedHome/
│   │   │   └── FeedPost/
│   │   └── components/
│   │       ├── PostCard/
│   │       ├── PostComposer/
│   │       └── ReactionBar/
│   │
│   ├── Music/
│   │   ├── index.tsx
│   │   ├── Music.module.css
│   │   ├── screens/
│   │   │   ├── MusicHome/
│   │   │   ├── MusicLibrary/
│   │   │   └── MusicPlayer/
│   │   └── components/
│   │       ├── TrackCard/
│   │       ├── PlayerControls/
│   │       └── MiniPlayer/     # Versão compacta para a BottomBar
│   │
│   ├── Live/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── LivePlayer/
│   │       ├── LiveChat/
│   │       └── PictureInPicture/
│   │
│   ├── Videos/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── VideoPlayer/
│   │       └── PictureInPicture/
│   │
│   ├── Films/
│   │   ├── index.tsx
│   │   └── components/
│   │
│   ├── Browser/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── BrowserBar/     # Barra de URL + navegação + tabs
│   │       └── BrowserView/    # WebView via Tauri
│   │
│   ├── FavoriteGames/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── GameCard/       # Capa + nome + status ativo + % uso
│   │       └── GameGrid/
│   │
│   ├── RemoteShare/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── RemoteView/
│   │       └── PermissionSelector/
│   │
│   ├── ScreenShare/
│   │   ├── index.tsx
│   │   └── components/
│   │       └── ScreenView/
│   │
│   ├── MotionWallpaper/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── WallpaperGrid/
│   │       └── WallpaperPreview/
│   │
│   ├── PerformanceGovernor/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── HardwareGraph/  # Gráfico histórico de CPU/GPU/RAM
│   │       ├── HardwareMini/   # Versão compacta para BottomBar
│   │       └── ModeSelector/   # Balanceado / Performance / Economia
│   │
│   ├── Marketplace/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── AssetCard/
│   │       └── AssetGrid/
│   │
│   ├── Projects/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── Board/
│   │       ├── ProjectColumn/
│   │       └── ProjectCard/
│   │
│   ├── Settings/
│   │   ├── index.tsx
│   │   ├── Settings.module.css
│   │   └── sections/
│   │       ├── SettingsAccount.tsx
│   │       ├── SettingsAppearance.tsx
│   │       ├── SettingsPrivacy.tsx
│   │       ├── SettingsNotifications.tsx
│   │       ├── SettingsLanguage.tsx
│   │       ├── SettingsModules.tsx
│   │       └── SettingsShortcuts.tsx
│   │
│   ├── Notifications/
│   │   ├── index.tsx
│   │   ├── Notifications.module.css
│   │   └── components/
│   │       ├── NotificationItem/
│   │       └── NotificationGroup/
│   │
│   └── Welcome/
│       ├── index.tsx
│       └── steps/
│           ├── StepProfile.tsx     # Foto, username, bio
│           ├── StepModules.tsx     # Escolha de módulos
│           ├── StepWallpaper.tsx   # Wallpaper inicial
│           └── StepTour.tsx        # Tour pelos módulos
│
└── layouts/                    # Layouts da aplicação
    ├── AppLayout.tsx           # Layout principal: LayoutEngine + BottomBar
    ├── BottomBar/
    │   ├── BottomBar.tsx       # Barra inferior global sempre visível
    │   └── BottomBar.module.css
    └── SearchOverlay/
        ├── SearchOverlay.tsx   # Wrapper do GlobalSearch na janela 'search'
        └── SearchOverlay.module.css
```

---

## CACHE LOCAL (Tauri Filesystem)

Arquivos persistidos localmente pelo app para funcionamento offline:

```
~/.app-name/cache/
├── messages/
│   └── {conversation_id}.json   # Últimas 100 mensagens da conversa
├── feed.json                    # Últimos 50 posts do feed
├── users/
│   └── {user_id}.json           # Perfis visitados recentemente
└── projects/
    └── {project_id}.json        # Boards em cache
```

Gerenciado pelo hook `useOffline.ts` e pelo `offline.store.ts`.
