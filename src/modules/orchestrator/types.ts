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
  state: Record<string, any>;
}

export interface OrchestratorState {
  openModules: ModuleInstance[];
  focusedInstanceId: string | null;
}
