export type SplitDirection = "horizontal" | "vertical";

export interface SplitNode {
  type: "split";
  id: string;
  direction: SplitDirection;
  ratio: number; // 0.0 a 1.0 (ex: 0.5 é meio a meio)
  first: LayoutNode;
  second: LayoutNode;
}

export interface PaneNode {
  type: "pane";
  id: string;
  moduleId: string | null; // ID do módulo aberto aqui (ex: 'Chat')
}

export type LayoutNode = SplitNode | PaneNode;

export interface LayoutState {
  root: LayoutNode;
}
