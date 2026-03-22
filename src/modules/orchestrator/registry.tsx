import { lazy, Suspense } from "react";
import { ModuleDefinition } from "./types";

const NavModule = lazy(() => import("../nav/Nav"));
const KernelManagerModule = lazy(() => import("./KernelManager"));
const SystemMonitorModule = lazy(() => import("./SystemMonitor"));
const FavoriteGamesModule = lazy(() => import("../games/FavoriteGames"));
const SocialBrowserModule = lazy(() => import("../browser/SocialBrowser"));
const ClockModule = lazy(() => import("./Clock"));

const withSuspense = (Component: any) => (props: any) => (
  <Suspense fallback={null}>
    <Component {...props} />
  </Suspense>
);

export const moduleRegistry: Record<string, ModuleDefinition> = {
  NAV: {
    id: "NAV",
    name: "Barra de Navegação",
    icon: "🪟",
    component: withSuspense(NavModule),
    allowMultiple: false,
  },
  KernelManager: {
    id: "KernelManager",
    name: "Gerenciador de Processos",
    icon: "⚙️",
    component: withSuspense(KernelManagerModule),
    allowMultiple: false,
  },
  SystemMonitor: {
    id: "SystemMonitor",
    name: "Monitor de Sistema",
    icon: "📊",
    component: withSuspense(SystemMonitorModule),
    allowMultiple: false,
  },
  FavoriteGames: {
    id: "FavoriteGames",
    name: "Jogos Favoritos",
    icon: "🎮",
    component: withSuspense(FavoriteGamesModule),
    allowMultiple: false,
  },
  SocialBrowser: {
    id: "SocialBrowser",
    name: "Navegador",
    icon: "🌐",
    component: withSuspense(SocialBrowserModule),
    allowMultiple: true,
  },
  Chat: { id: "Chat", name: "Chat", icon: "💬", component: () => null, allowMultiple: false },
  Clock: { id: "Clock", name: "Relógio", icon: "🕒", component: withSuspense(ClockModule), allowMultiple: true },
};
