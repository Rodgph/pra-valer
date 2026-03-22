import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserStylesState {
  styles: Record<string, string>; // hostname -> css
  setStyle: (hostname: string, css: string) => void;
}

export const useUserStylesStore = create<UserStylesState>()(
  persist(
    (set) => ({
      styles: {},
      setStyle: (hostname, css) => set((state) => ({
        styles: { ...state.styles, [hostname]: css }
      })),
    }),
    { name: "social-os-user-styles" }
  )
);
