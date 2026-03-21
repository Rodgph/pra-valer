import React from "react";
import { useOrchestrator } from "./store";
import { moduleRegistry } from "./registry";

export const KernelManager: React.FC = () => {
  const { openModules, closeModule } = useOrchestrator();

  return (
    <div style={{
      height: '100%',
      width: '100%',
      padding: '20px',
      background: 'rgba(5, 5, 5, 0.8)',
      color: '#00FF66',
      fontFamily: 'monospace',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      <h2 style={{ 
        fontSize: '12px', 
        textTransform: 'uppercase', 
        letterSpacing: '2px',
        borderBottom: '1px solid rgba(0, 255, 102, 0.2)',
        paddingBottom: '10px',
        marginBottom: '20px'
      }}>
        SISTEMA // ORQUESTRADOR DE NÚCLEO
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {openModules.length === 0 && (
          <div style={{ opacity: 0.4, fontSize: '11px' }}>NENHUM PROCESSO ATIVO</div>
        )}
        
        {openModules.map((inst) => {
          const def = moduleRegistry[inst.moduleId];
          return (
            <div key={inst.instanceId} style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '12px',
              borderLeft: '2px solid #00FF66',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                  {def?.icon} {def?.name || inst.moduleId}
                </div>
                <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '4px' }}>
                  PID: {inst.instanceId.split('-')[1]} | PANE: {inst.paneId || 'FLOATING'}
                </div>
              </div>
              
              <button 
                onClick={() => closeModule(inst.instanceId)}
                style={{
                  background: 'rgba(199, 0, 27, 0.2)',
                  border: '1px solid #C7001B',
                  color: '#C7001B',
                  padding: '4px 8px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  borderRadius: '2px'
                }}
              >
                KILL
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '30px', fontSize: '9px', opacity: 0.3 }}>
        ESTADO DO SISTEMA: NOMINAL // TOTAL_INSTANCES: {openModules.length}
      </div>
    </div>
  );
};

export default KernelManager;
