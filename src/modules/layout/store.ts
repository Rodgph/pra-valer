import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LayoutState, LayoutNode, SplitDirection } from "./types";

interface LayoutActions {
  splitPane: (paneId: string, direction: SplitDirection) => void;
  setModule: (paneId: string, moduleId: string | null) => void;
  updateSplitRatio: (splitId: string, ratio: number) => void;
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

      splitPane: (paneId, direction) => {
        set((state) => {
          const newRoot = JSON.parse(JSON.stringify(state.root));
          
          const findAndSplit = (node: LayoutNode): LayoutNode => {
            if (node.id === paneId && node.type === "pane") {
              return {
                type: "split",
                id: `split-${Math.random().toString(36).substr(2, 9)}`,
                direction,
                ratio: 0.5,
                first: { ...node, id: `pane-${Math.random().toString(36).substr(2, 9)}` },
                second: { type: "pane", id: `pane-${Math.random().toString(36).substr(2, 9)}`, moduleId: null },
              };
            }
            if (node.type === "split") {
              node.first = findAndSplit(node.first);
              node.second = findAndSplit(node.second);
            }
            return node;
          };

          return { root: findAndSplit(newRoot) };
        });
      },

      updateSplitRatio: (splitId, ratio) => {
        set((state) => {
          const newRoot = JSON.parse(JSON.stringify(state.root));
          const findAndUpdate = (node: LayoutNode): LayoutNode => {
            if (node.id === splitId && node.type === "split") {
              return { ...node, ratio: Math.max(0.05, Math.min(0.95, ratio)) };
            }
            if (node.type === "split") {
              node.first = findAndUpdate(node.first);
              node.second = findAndUpdate(node.second);
            }
            return node;
          };
          return { root: findAndUpdate(newRoot) };
        });
      },

      setModule: (paneId, moduleId) => {
        set((state) => {
          const newRoot = JSON.parse(JSON.stringify(state.root));
          const findAndSet = (node: LayoutNode): LayoutNode => {
            if (node.id === paneId && node.type === "pane") {
              return { ...node, moduleId };
            }
            if (node.type === "split") {
              node.first = findAndSet(node.first);
              node.second = findAndSet(node.second);
            }
            return node;
          };
          return { root: findAndSet(newRoot) };
        });
      },
    }),
    { name: "social-os-layout" } // Persistência automática no LocalStorage
  )
);
