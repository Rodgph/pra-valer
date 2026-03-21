import { create } from "zustand";
import { OrchestratorState, ModuleInstance } from "./types";
import { moduleRegistry } from "./registry";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface OrchestratorActions {
  openModule: (moduleId: string, paneId?: string, skipBroadcast?: boolean) => void;
  closeModule: (instanceId: string, skipBroadcast?: boolean) => void;
  mountModule: (instanceId: string, paneId: string, skipBroadcast?: boolean) => void;
}

export const useOrchestrator = create<OrchestratorState & OrchestratorActions>((set, get) => {
  // Listener de sincronia global
  listen<{ action: string; payload: any }>("sync-orchestrator", (event) => {
    const { action, payload } = event.payload;
    if (action === "open") get().openModule(payload.moduleId, payload.paneId, true);
    if (action === "close") get().closeModule(payload.instanceId, true);
    if (action === "mount") get().mountModule(payload.instanceId, payload.paneId, true);
  });

  return {
    openModules: [],
    focusedInstanceId: null,

    openModule: (moduleId, paneId, skipBroadcast) => {
      const def = moduleRegistry[moduleId];
      if (!def) return;

      set((state) => {
        if (!def.allowMultiple) {
          const existing = state.openModules.find(m => m.moduleId === moduleId);
          if (existing) return { focusedInstanceId: existing.instanceId };
        }

        const instanceId = `${moduleId}-${Math.random().toString(36).substr(2, 9)}`;
        const newInstance: ModuleInstance = { instanceId, moduleId, paneId, state: {} };

        if (!skipBroadcast) {
          invoke("emit_global_event", { 
            args: { event: "sync-orchestrator", payload: { action: "open", payload: { moduleId, paneId } } } 
          });
        }

        return {
          openModules: [...state.openModules, newInstance],
          focusedInstanceId: instanceId,
        };
      });
    },

    mountModule: (instanceId, paneId, skipBroadcast) => {
      set((state) => {
        if (!skipBroadcast) {
          invoke("emit_global_event", { 
            args: { event: "sync-orchestrator", payload: { action: "mount", payload: { instanceId, paneId } } } 
          });
        }
        return {
          openModules: state.openModules.map(m => 
            m.instanceId === instanceId ? { ...m, paneId } : m
          )
        };
      });
    },

    closeModule: (instanceId, skipBroadcast) => {
      set((state) => {
        if (!skipBroadcast) {
          invoke("emit_global_event", { 
            args: { event: "sync-orchestrator", payload: { action: "close", payload: { instanceId } } } 
          });
        }
        return {
          openModules: state.openModules.filter(m => m.instanceId !== instanceId),
          focusedInstanceId: state.focusedInstanceId === instanceId ? null : state.focusedInstanceId,
        };
      });
    },
  };
});
