import React, { useRef, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLayout } from "../store";
import { LayoutNode } from "../types";
import { moduleRegistry } from "../../orchestrator/registry";
import { useOrchestrator } from "../../orchestrator/store";
import styles from "./LayoutEngine.module.css";

const NodeRenderer: React.FC<{ node: LayoutNode }> = ({ node }) => {
  const { updateSplitRatio } = useLayout();
  const { openModules, mountModule } = useOrchestrator();
  const containerRef = useRef<HTMLDivElement>(null);

  const ModuleComponent = node.moduleId ? moduleRegistry[node.moduleId]?.component : null;
  const instance = openModules.find(m => m.moduleId === node.moduleId && (!m.paneId || m.paneId === node.id));

  useEffect(() => {
    if (instance && node.type === "pane") {
      mountModule(instance.instanceId, node.id);
    }
  }, [instance?.instanceId, node.id, mountModule]);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!containerRef.current || node.type !== "split") return;
    const rect = containerRef.current.getBoundingClientRect();
    const newRatio = node.direction === "horizontal" 
      ? (e.clientX - rect.left) / rect.width 
      : (e.clientY - rect.top) / rect.height;
    updateSplitRatio(node.id, newRatio);
  }, [node, updateSplitRatio]);

  const stopResize = useCallback(() => {
    window.removeEventListener("mousemove", handleResize);
    window.removeEventListener("mouseup", stopResize);
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, [handleResize]);

  const startResize = useCallback(() => {
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", stopResize);
    document.body.style.cursor = node.type === "split" && node.direction === "horizontal" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  }, [handleResize, stopResize, node]);

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.type === "pane") {
      await invoke("trigger_context_menu", { 
        args: { 
          menuType: "LAYOUT", 
          targetId: node.id,
          moduleId: node.moduleId 
        } 
      });
    }
  };

  if (node.type === "split") {
    const isHorizontal = node.direction === "horizontal";
    return (
      <div 
        ref={containerRef}
        className={styles.splitContainer} 
        style={{ flexDirection: isHorizontal ? "row" : "column" }}
      >
        <div style={{ flex: node.ratio, overflow: 'hidden', position: 'relative' }}>
          <NodeRenderer node={node.first} />
        </div>
        <div className={styles.resizer} onMouseDown={startResize} />
        <div style={{ flex: 1 - node.ratio, overflow: 'hidden', position: 'relative' }}>
          <NodeRenderer node={node.second} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pane} onContextMenu={handleContextMenu}>
      {ModuleComponent ? (
        <div className={styles.moduleWrapper}>
          <ModuleComponent />
        </div>
      ) : node.moduleId ? (
        <div className={styles.moduleContent}>Módulo: {node.moduleId}</div>
      ) : (
        <div className={styles.emptyPane}>
          <p>Painel Vazio</p>
          <div className={styles.info}>Clique direito para opções</div>
        </div>
      )}
    </div>
  );
};

export const LayoutEngine: React.FC = () => {
  const root = useLayout((state) => state.root);
  return (
    <div className={styles.engineWrapper}>
      <NodeRenderer node={root} />
    </div>
  );
};
