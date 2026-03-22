import React from "react";
import { useOrchestrator } from "./store";
import { moduleRegistry } from "./registry";
import { invoke } from "@tauri-apps/api/core";
import styles from "./KernelManager.module.css";

export const KernelManager: React.FC = () => {
  const { openModules, closeModule } = useOrchestrator();

  const handleKill = async (instanceId: string, paneId?: string) => {
    // 1. Fecha o módulo no orquestrador
    closeModule(instanceId);

    // 2. Se o módulo estava em um painel, avisa o Layout Engine para limpar
    if (paneId) {
      await invoke("emit_global_event", { 
        args: { 
          event: "sync-layout", 
          payload: { action: "setModule", paneId, data: null } 
        } 
      });
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        SISTEMA // ORQUESTRADOR DE NÚCLEO
      </h2>

      <div className={styles.moduleList}>
        {openModules.length === 0 && (
          <div className={styles.noProcess}>NENHUM PROCESSO ATIVO</div>
        )}
        
        {openModules.map((inst) => {
          const def = moduleRegistry[inst.moduleId];
          return (
            <div key={inst.instanceId} className={styles.moduleItem}>
              <div>
                <div className={styles.moduleName}>
                  {def?.icon} {def?.name || inst.moduleId}
                </div>
                <div className={styles.moduleInfo}>
                  PID: {inst.instanceId.split('-')[1]} | PANE: {inst.paneId || 'FLOATING'}
                </div>
              </div>
              
              <button 
                onClick={() => handleKill(inst.instanceId, inst.paneId)}
                className={styles.killButton}
              >
                KILL
              </button>
            </div>
          );
        })}
      </div>

      <div className={styles.systemStatus}>
        ESTADO DO SISTEMA: NOMINAL // TOTAL_INSTANCES: {openModules.length}
      </div>
    </div>
  );
};

export default KernelManager;
