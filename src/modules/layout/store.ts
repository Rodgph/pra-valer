import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LayoutState, LayoutNode, SplitDirection } from "./types";
interface LayoutActions {
  splitPane: (paneId: string, direction: SplitDirection, newPaneId: string, initialModuleId?: string | null, insertAt?: "first" | "second") => void;
  setModule: (paneId: string, moduleId: string | null) => void;
  updateSplitRatio: (splitId: string, ratio: number) => void;
  removePane: (paneId: string) => void;
}

const initialLayout: LayoutNode = {
  type: "pane",
  id: "root-pane",
  moduleId: null,
};

export const useLayout = create<LayoutState & LayoutActions>()(
  persist(
    (set) => ({
      root: initialLayout,

      splitPane: (paneId, direction, newPaneId, initialModuleId = null, insertAt = "second") => {
        set((state) => {
          const findAndSplit = (node: LayoutNode): LayoutNode => {
            if (node.id === paneId && node.type === "pane") {
              const newNode: LayoutNode = { type: "pane", id: newPaneId, moduleId: initialModuleId };
              const originalNode: LayoutNode = { ...node };

              return {
                type: "split",
                id: `split-${Math.random().toString(36).substr(2, 9)}`,
                direction,
                ratio: 0.5,
                first: insertAt === "first" ? newNode : originalNode,
                second: insertAt === "second" ? newNode : originalNode,
              };
            }
            if (node.type === "split") {
              return {
                ...node,
                first: findAndSplit(node.first),
                second: findAndSplit(node.second),
              };
            }
            return node;
          };
          return { root: findAndSplit(state.root) };
        });
      },

      removePane: (paneId) => {
        set((state) => {
          // Se for o nó raiz, não podemos remover
          if (state.root.id === paneId) return state;

          const findAndRemove = (node: LayoutNode): LayoutNode => {
            if (node.type === "split") {
              // Se um dos filhos for o alvo, retornamos o OUTRO filho (o irmão)
              if (node.first.id === paneId) return node.second;
              if (node.second.id === paneId) return node.first;

              // Caso contrário, continua descendo na árvore
              return {
                ...node,
                first: findAndRemove(node.first),
                second: findAndRemove(node.second),
              };
            }
            return node;
          };

          return { root: findAndRemove(state.root) };
        });
      },

      updateSplitRatio: (splitId, ratio) => {
        set((state) => {
          const findAndUpdate = (node: LayoutNode): LayoutNode => {
            if (node.id === splitId && node.type === "split") {
              return { ...node, ratio: Math.max(0.05, Math.min(0.95, ratio)) };
            }
            if (node.type === "split") {
              return { ...node, first: findAndUpdate(node.first), second: findAndUpdate(node.second) };
            }
            return node;
          };
          return { root: findAndUpdate(state.root) };
        });
      },

      setModule: (paneId, moduleId) => {
        set((state) => {
          const findAndSet = (node: LayoutNode): LayoutNode => {
            if (node.id === paneId && node.type === "pane") {
              return { ...node, moduleId };
            }
            if (node.type === "split") {
              return { ...node, first: findAndSet(node.first), second: findAndSet(node.second) };
            }
            return node;
          };
          return { root: findAndSet(state.root) };
        });
      },
    }),
    { name: "social-os-layout" }
  )
);
