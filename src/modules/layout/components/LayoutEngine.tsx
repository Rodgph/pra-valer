import React, { useRef, useCallback } from "react";
import { useLayout } from "../store";
import { LayoutNode } from "../types";
import styles from "./LayoutEngine.module.css";

const NodeRenderer: React.FC<{ node: LayoutNode }> = ({ node }) => {
  const { splitPane, updateSplitRatio } = useLayout();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!containerRef.current || node.type !== "split") return;

    const rect = containerRef.current.getBoundingClientRect();
    let newRatio = 0.5;

    if (node.direction === "horizontal") {
      newRatio = (e.clientX - rect.left) / rect.width;
    } else {
      newRatio = (e.clientY - rect.top) / rect.height;
    }

    updateSplitRatio(node.id, newRatio);
  }, [node, updateSplitRatio]);

  const stopResize = useCallback(() => {
    window.removeEventListener("mousemove", handleResize);
    window.removeEventListener("mouseup", stopResize);
    document.body.style.cursor = "default";
  }, [handleResize]);

  const startResize = useCallback(() => {
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", stopResize);
    document.body.style.cursor = node.type === "split" && node.direction === "horizontal" ? "col-resize" : "row-resize";
  }, [handleResize, stopResize, node]);

  if (node.type === "split") {
    const isHorizontal = node.direction === "horizontal";
    return (
      <div 
        ref={containerRef}
        className={styles.splitContainer} 
        style={{ flexDirection: isHorizontal ? "row" : "column" }}
      >
        <div style={{ flex: node.ratio, overflow: 'hidden' }}>
          <NodeRenderer node={node.first} />
        </div>
        <div className={styles.resizer} onMouseDown={startResize} />
        <div style={{ flex: 1 - node.ratio, overflow: 'hidden' }}>
          <NodeRenderer node={node.second} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pane}>
      {node.moduleId ? (
        <div className={styles.moduleContent}>Módulo: {node.moduleId}</div>
      ) : (
        <div className={styles.emptyPane}>
          <p>Painel Vazio</p>
          <div className={styles.actions}>
            <button onClick={() => splitPane(node.id, "horizontal")}>Dividir H</button>
            <button onClick={() => splitPane(node.id, "vertical")}>Dividir V</button>
          </div>
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
