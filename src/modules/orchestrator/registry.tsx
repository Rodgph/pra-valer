import { lazy, Suspense } from "react";
import { ModuleDefinition } from "./types";

const NavModule = lazy(() => import("../nav/Nav"));
const KernelManagerModule = lazy(() => import("./KernelManager"));
const SystemMonitorModule = lazy(() => import("./SystemMonitor"));

const withSuspense = (Component: any) => (props: any) => (
  <Suspense fallback={null}>
    <Component {...props} />
  </Suspense>
);

export const moduleRegistry: Record<string, ModuleDefinition> = {
  NAV: {
    id: "NAV",
    name: "Navegação",
    icon: "🧭",
    component: withSuspense(NavModule),
    allowMultiple: false,
  },
  KernelManager: {
    id: "KernelManager",
    name: "Kernel Manager",
    icon: "🧠",
    component: withSuspense(KernelManagerModule),
    allowMultiple: false,
  },
  SystemMonitor: {
    id: "SystemMonitor",
    name: "System Monitor",
    icon: "📈",
    component: withSuspense(SystemMonitorModule),
    allowMultiple: true,
  },
  // Placeholders para futuros módulos
  Chat: { id: "Chat", name: "Chat", icon: "💬", component: () => null, allowMultiple: false },
  Clock: { id: "Clock", name: "Relógio", icon: "🕒", component: () => null, allowMultiple: true },
};
