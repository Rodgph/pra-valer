import { ComponentType } from "react";

export interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  component: ComponentType<any>;
  allowMultiple: boolean;
}

export interface ModuleInstance {
  instanceId: string;
  moduleId: string;
  paneId?: string; // ID do painel onde está renderizado (se tiling)
  isFloating: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex: number;
  state: Record<string, any>;
}

export interface OrchestratorState {
  openModules: ModuleInstance[];
  focusedInstanceId: string | null;
  nextZIndex: number;
}
