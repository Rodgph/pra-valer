import { lazy, Suspense } from "react";
import { ModuleDefinition } from "./types";

const NavModule = lazy(() => import("../nav/Nav"));

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
  // Placeholders para futuros módulos
  Chat: { id: "Chat", name: "Chat", icon: "💬", component: () => null, allowMultiple: false },
  Clock: { id: "Clock", name: "Relógio", icon: "🕒", component: () => null, allowMultiple: true },
};
