import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NavState {
  showWindowControls: boolean;
  showTelemetry: boolean;
  telemetryInterval: number; // em ms
  toggleWindowControls: () => void;
  toggleTelemetry: () => void;
  setTelemetryInterval: (interval: number) => void;
}

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      showWindowControls: true,
      showTelemetry: true,
      telemetryInterval: 3000,
      toggleWindowControls: () => set((state) => ({ showWindowControls: !state.showWindowControls })),
      toggleTelemetry: () => set((state) => ({ showTelemetry: !state.showTelemetry })),
      setTelemetryInterval: (interval) => set({ telemetryInterval: interval }),
    }),
    { name: "social-os-nav-settings" }
  )
);
