import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OrchestratorState, ModuleInstance } from "./types";
import { moduleRegistry } from "./registry";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface OrchestratorActions {
  openModule: (moduleId: string, isFloating?: boolean, paneId?: string, skipBroadcast?: boolean) => void;
  closeModule: (instanceId: string, skipBroadcast?: boolean) => void;
  mountModule: (instanceId: string, paneId: string, skipBroadcast?: boolean) => void;
  focusInstance: (instanceId: string) => void;
  updateInstanceBounds: (instanceId: string, bounds: { x?: number, y?: number, width?: number, height?: number }) => void;
  setDraggingInstance: (instanceId: string | null, sourcePaneId?: string | null) => void;
}

export const useOrchestrator = create<OrchestratorState & OrchestratorActions>()(
  persist(
    (set, get) => {
      // Listener de sincronia global
      listen<{ action: string; payload: any }>("sync-orchestrator", (event) => {
        const { action, payload } = event.payload;
        if (action === "open") get().openModule(payload.moduleId, payload.isFloating, payload.paneId, true);
        if (action === "close") get().closeModule(payload.instanceId, true);
        if (action === "mount") get().mountModule(payload.instanceId, payload.paneId, true);
        if (action === "focus") get().focusInstance(payload.instanceId);
      });

      return {
        openModules: [],
        focusedInstanceId: null,
        draggingInstanceId: null,
        draggingSourcePaneId: null,
        nextZIndex: 10,

        openModule: (moduleId, isFloating = false, paneId, skipBroadcast) => {
          const def = moduleRegistry[moduleId];
          if (!def) return;

          set((state) => {
            if (!def.allowMultiple) {
              const existing = state.openModules.find(m => m.moduleId === moduleId);
              if (existing) {
                get().focusInstance(existing.instanceId);
                return state;
              }
            }

            const instanceId = `${moduleId}-${Math.random().toString(36).substr(2, 9)}`;
            const newInstance: ModuleInstance = { 
              instanceId, 
              moduleId, 
              paneId, 
              isFloating,
              x: isFloating ? 100 + (state.openModules.length * 20) : undefined,
              y: isFloating ? 100 + (state.openModules.length * 20) : undefined,
              width: isFloating ? 400 : undefined,
              height: isFloating ? 300 : undefined,
              zIndex: state.nextZIndex,
              state: {} 
            };

            if (!skipBroadcast) {
              invoke("emit_global_event", { 
                args: { event: "sync-orchestrator", payload: { action: "open", payload: { moduleId, isFloating, paneId } } } 
              });
            }

            return {
              openModules: [...state.openModules, newInstance],
              focusedInstanceId: instanceId,
              nextZIndex: state.nextZIndex + 1
            };
          });
        },

        focusInstance: (instanceId) => {
          set((state) => {
            const instance = state.openModules.find(m => m.instanceId === instanceId);
            if (!instance || state.focusedInstanceId === instanceId) return state;

            return {
              focusedInstanceId: instanceId,
              nextZIndex: state.nextZIndex + 1,
              openModules: state.openModules.map(m => 
                m.instanceId === instanceId ? { ...m, zIndex: state.nextZIndex } : m
              )
            };
          });
        },

        updateInstanceBounds: (instanceId, bounds) => {
          set((state) => ({
            openModules: state.openModules.map(m => 
              m.instanceId === instanceId ? { ...m, ...bounds } : m
            )
          }));
        },

        setDraggingInstance: (instanceId, sourcePaneId = null) => 
          set({ draggingInstanceId: instanceId, draggingSourcePaneId: sourcePaneId }),

        mountModule: (instanceId, paneId, skipBroadcast) => {
          set((state) => {
            if (!skipBroadcast) {
              invoke("emit_global_event", { 
                args: { event: "sync-orchestrator", payload: { action: "mount", payload: { instanceId, paneId } } } 
              });
            }
            return {
              openModules: state.openModules.map(m => 
                m.instanceId === instanceId ? { ...m, paneId, isFloating: false } : m
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
    },
    { 
      name: "social-os-orchestrator",
      partialize: (state) => ({ 
        openModules: state.openModules, 
        focusedInstanceId: state.focusedInstanceId,
        nextZIndex: state.nextZIndex 
      })
    }
  )
);
