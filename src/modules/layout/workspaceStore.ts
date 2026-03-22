import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LayoutNode } from "./types";

interface Workspace {
  name: string;
  root: LayoutNode;
}

interface WorkspaceState {
  workspaces: Record<string, Workspace>;
  saveWorkspace: (name: string, root: LayoutNode) => void;
  loadWorkspace: (name: string) => LayoutNode | null;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: {},
      saveWorkspace: (name, root) => set((state) => ({
        workspaces: { ...state.workspaces, [name]: { name, root } }
      })),
      loadWorkspace: (name) => {
        const ws = get().workspaces[name];
        return ws ? ws.root : null;
      }
    }),
    { name: "social-os-workspaces" }
  )
);
