import { create } from "zustand";
import { OrchestratorState, ModuleInstance } from "./types";
import { moduleRegistry } from "./registry";

interface OrchestratorActions {
  openModule: (moduleId: string) => void;
  closeModule: (instanceId: string) => void;
}

export const useOrchestrator = create<OrchestratorState & OrchestratorActions>((set) => ({
  openModules: [],
  focusedInstanceId: null,

  openModule: (moduleId) => {
    const def = moduleRegistry[moduleId];
    if (!def) return;

    set((state) => {
      // Se não permitir múltiplos, foca no existente
      if (!def.allowMultiple) {
        const existing = state.openModules.find(m => m.moduleId === moduleId);
        if (existing) return { focusedInstanceId: existing.instanceId };
      }

      const instanceId = `${moduleId}-${Math.random().toString(36).substr(2, 9)}`;
      const newInstance: ModuleInstance = {
        instanceId,
        moduleId,
        state: {},
      };

      return {
        openModules: [...state.openModules, newInstance],
        focusedInstanceId: instanceId,
      };
    });
  },

  closeModule: (instanceId) => {
    set((state) => ({
      openModules: state.openModules.filter(m => m.instanceId !== instanceId),
      focusedInstanceId: state.focusedInstanceId === instanceId ? null : state.focusedInstanceId,
    }));
  },
}));
