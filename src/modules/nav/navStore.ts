import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TelemetryItem = "cpu" | "ram" | "gpu" | "vram" | "net";

interface NavState {
  showWindowControls: boolean;
  telemetryVisibility: Record<TelemetryItem, boolean>;
  telemetryInterval: number;
  toggleWindowControls: () => void;
  toggleTelemetryItem: (item: TelemetryItem) => void;
  setTelemetryInterval: (interval: number) => void;
}

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      showWindowControls: true,
      telemetryVisibility: {
        cpu: true,
        ram: true,
        gpu: true,
        vram: true,
        net: true,
      },
      telemetryInterval: 3000,
      toggleWindowControls: () => set((state) => ({ showWindowControls: !state.showWindowControls })),
      toggleTelemetryItem: (item) => set((state) => ({
        telemetryVisibility: {
          ...state.telemetryVisibility,
          [item]: !state.telemetryVisibility[item],
        }
      })),
      setTelemetryInterval: (interval) => set({ telemetryInterval: interval }),
    }),
    { name: "social-os-nav-settings" }
  )
);
