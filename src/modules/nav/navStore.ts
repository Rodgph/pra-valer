import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TelemetryItem = "cpu" | "ram" | "gpu" | "vram" | "net";
export type NavPosition = "top" | "bottom" | "left" | "right";

interface NavState {
  showWindowControls: boolean;
  autoHideNav: boolean;
  position: NavPosition;
  telemetryVisibility: Record<TelemetryItem, boolean>;
  telemetryInterval: number;
  toggleWindowControls: () => void;
  toggleAutoHide: () => void;
  setPosition: (position: NavPosition) => void;
  toggleTelemetryItem: (item: TelemetryItem) => void;
  setTelemetryInterval: (interval: number) => void;
}

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      showWindowControls: true,
      autoHideNav: false,
      position: "top",
      telemetryVisibility: {
        cpu: true,
        ram: true,
        gpu: true,
        vram: true,
        net: true,
      },
      telemetryInterval: 3000,
      toggleWindowControls: () => set((state) => ({ showWindowControls: !state.showWindowControls })),
      toggleAutoHide: () => set((state) => ({ autoHideNav: !state.autoHideNav })),
      setPosition: (position) => set({ position }),
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
