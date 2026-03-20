import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NavState {
  showWindowControls: boolean;
  toggleWindowControls: () => void;
}

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      showWindowControls: true,
      toggleWindowControls: () => set((state) => ({ showWindowControls: !state.showWindowControls })),
    }),
    { name: "social-os-nav-settings" }
  )
);
