import React, { useRef, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useLayout } from "../store";
import { LayoutNode, SplitDirection } from "../types";
import { moduleRegistry } from "../../orchestrator/registry";
import { useOrchestrator } from "../../orchestrator/store";
import styles from "./LayoutEngine.module.css";
import { PhysicalSize } from "@tauri-apps/api/window";
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

const NodeRenderer: React.FC<{ node: LayoutNode }> = ({ node }) => {
  const { updateSplitRatio, setModule: setLayoutModule, splitPane, removePane } = useLayout();
  const { openModules, mountModule, openModule, draggingInstanceId, setDraggingInstance } = useOrchestrator();
  const [isDragOver, setIsOver] = React.useState(false);
  const [dropZone, setDropZone] = React.useState<"center" | "top" | "bottom" | "left" | "right" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ModuleComponent = node.moduleId ? moduleRegistry[node.moduleId]?.component : null;
  const instance = openModules.find(m => m.paneId === node.id);

  // CRIAÇÃO AUTOMÁTICA DE INSTÂNCIA PARA PAINÉIS NOVOS
  useEffect(() => {
    if (node.type === "pane" && node.moduleId && !instance) {
      const orphan = openModules.find(m => m.moduleId === node.moduleId && !m.paneId);
      if (orphan) mountModule(orphan.instanceId, node.id);
      else openModule(node.moduleId, false, node.id);
    }
  }, [node.moduleId, node.id, instance, openModules]);

  // HIGHLIGHT VISUAL DURANTE O DRAG
  useEffect(() => {
    if (!draggingInstanceId || node.type !== "pane") return;

    const onGlobalMove = (e: MouseEvent) => {
      const overlay = document.getElementById("drag-overlay");
      if (overlay) overlay.style.pointerEvents = "none";
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const paneEl = target?.closest("[data-pane-id]");
      if (overlay) overlay.style.pointerEvents = "auto";
      
      if (paneEl?.getAttribute("data-pane-id") === node.id) {
        const rect = paneEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const w = rect.width;
        const h = rect.height;
        const threshold = 0.25;

        if (y < h * threshold) setDropZone("top");
        else if (y > h * (1 - threshold)) setDropZone("bottom");
        else if (x < w * threshold) setDropZone("left");
        else if (x > w * (1 - threshold)) setDropZone("right");
        else setDropZone("center");
        setIsOver(true);
      } else {
        setIsOver(false);
        setDropZone(null);
      }
    };

    window.addEventListener("mousemove", onGlobalMove);
    return () => window.removeEventListener("mousemove", onGlobalMove);
  }, [draggingInstanceId, node.id, node.type]);

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
        args: { menuType: "LAYOUT", targetId: node.id, moduleId: node.moduleId } 
      });
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!instance?.instanceId) return;

    // CAPTURA ESTADO INICIAL (IMUNE A RE-RENDERS)
    const capturedInstanceId = instance.instanceId;
    const capturedModuleId = instance.moduleId;
    const capturedSourcePane = node.id;

    setDraggingInstance(capturedInstanceId, capturedSourcePane);

    const overlay = document.createElement("div");
    overlay.id = "drag-overlay";
    overlay.style.cssText = "position: fixed; inset: 0; z-index: 99999; cursor: grabbing; background: transparent;";
    document.body.appendChild(overlay);

    const ghost = document.createElement("div");
    ghost.id = "drag-ghost";
    ghost.style.cssText = `position: fixed; pointer-events: none; z-index: 100000; background: #00FF66; color: #000; font-family: monospace; font-size: 10px; font-weight: bold; padding: 6px 12px; opacity: 0.9; transform: translate(-50%, -50%); left: ${e.clientX}px; top: ${e.clientY}px; box-shadow: 0 0 20px rgba(0,255,102,0.4);`;
    ghost.innerText = `MOVE: ${capturedModuleId.toUpperCase()}`;
    document.body.appendChild(ghost);

    const onMouseMove = (ev: MouseEvent) => {
      ghost.style.left = `${ev.clientX}px`;
      ghost.style.top = `${ev.clientY}px`;
    };

    const onMouseUp = (ev: MouseEvent) => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.getElementById("drag-overlay")?.remove();
      document.getElementById("drag-ghost")?.remove();

      // ✅ ESTADO FRESCO DIRETO DAS STORES
      const { openModules, mountModule, setDraggingInstance: clearDrag } = useOrchestrator.getState();
      const { setModule: setLayoutModule, splitPane } = useLayout.getState();

      const target = document.elementFromPoint(ev.clientX, ev.clientY);
      const paneEl = target?.closest("[data-pane-id]") as HTMLElement | null;
      const targetPaneId = paneEl?.dataset.paneId;

      if (targetPaneId && targetPaneId !== capturedSourcePane) {
        const rect = paneEl!.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        const t = 0.25;

        let zone: "center" | "top" | "bottom" | "left" | "right" = "center";
        if (y < rect.height * t) zone = "top";
        else if (y > rect.height * (1 - t)) zone = "bottom";
        else if (x < rect.width * t) zone = "left";
        else if (x > rect.width * (1 - t)) zone = "right";

        if (zone === "center") {
          // SWAP
          const targetModuleId = paneEl!.dataset.moduleId || null;
          setLayoutModule(targetPaneId, capturedModuleId);
          
          const draggedInst = openModules.find(m => m.instanceId === capturedInstanceId);
          if (draggedInst) mountModule(draggedInst.instanceId, targetPaneId);

          if (targetModuleId) {
            setLayoutModule(capturedSourcePane, targetModuleId);
            const targetInst = openModules.find(m => m.moduleId === targetModuleId && m.paneId === targetPaneId);
            if (targetInst) mountModule(targetInst.instanceId, capturedSourcePane);
          } else {
            setLayoutModule(capturedSourcePane, null);
          }
        } else {
          // SNAP SPLIT
          const direction: SplitDirection = (zone === "top" || zone === "bottom") ? "vertical" : "horizontal";
          const insertAt = (zone === "top" || zone === "left") ? "first" : "second";
          const newPaneId = `pane-${Math.random().toString(36).substr(2, 9)}`;

          setLayoutModule(capturedSourcePane, null);
          splitPane(targetPaneId, direction, newPaneId, capturedModuleId, insertAt);
          
          const draggedInst = openModules.find(m => m.instanceId === capturedInstanceId);
          if (draggedInst) mountModule(draggedInst.instanceId, newPaneId);
        }

        setTimeout(() => {
          invoke("emit_global_event", { 
            args: { event: "sync-layout", payload: { action: "full-reset", data: useLayout.getState().root } } 
          });
        }, 50);
      }
      clearDrag(null);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  if (node.type === "split") {
    const isHorizontal = node.direction === "horizontal";
    return (
      <div 
        ref={containerRef}
        className={styles.splitContainer} 
        style={{ flexDirection: isHorizontal ? "row" : "column" }}
      >
        <div key={`${node.first.id}-container`} style={{ flex: node.ratio, overflow: 'hidden', position: 'relative' }}>
          <NodeRenderer node={node.first} />
        </div>
        <div className={styles.resizer} onMouseDown={startResize} />
        <div key={`${node.second.id}-container`} style={{ flex: 1 - node.ratio, overflow: 'hidden', position: 'relative' }}>
          <NodeRenderer node={node.second} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.pane} ${isDragOver ? styles.dragOver : ""}`} 
      onContextMenu={handleContextMenu}
      data-pane-id={node.id}
      data-module-id={node.moduleId || ""}
      data-drop-zone={dropZone}
    >
      {ModuleComponent && (
        <div 
          className={styles.moduleHandle} 
          onMouseDown={handleDragStart}
        >
          <div className={styles.handleIndicator} />
        </div>
      )}
      
      {ModuleComponent ? (
        <div className={styles.moduleWrapper}>
          <ModuleComponent paneId={node.id} instanceId={instance?.instanceId} />
        </div>
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
