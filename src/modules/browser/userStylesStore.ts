import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserStylesState {
  styles: Record<string, string>; // hostname -> css
  enabled: Record<string, boolean>; // hostname -> is_enabled
  setStyle: (hostname: string, css: string) => void;
  toggleStyle: (hostname: string) => void;
}

export const useUserStylesStore = create<UserStylesState>()(
  persist(
    (set) => ({
      styles: {},
      enabled: {},
      setStyle: (hostname, css) => set((state) => ({
        styles: { ...state.styles, [hostname]: css },
        // Habilita automaticamente se estiver salvando um novo estilo e não houver estado anterior
        enabled: { ...state.enabled, [hostname]: state.enabled[hostname] ?? true }
      })),
      toggleStyle: (hostname) => set((state) => ({
        enabled: { ...state.enabled, [hostname]: !(state.enabled[hostname] ?? true) }
      })),
    }),
    { name: "social-os-user-styles" }
  )
);
