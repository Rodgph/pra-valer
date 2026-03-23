import React, { useRef, useState, useCallback } from "react";
import { useOrchestrator } from "./store";
import { moduleRegistry } from "./registry";
import styles from "./FloatingManager.module.css";

const FloatingWindow: React.FC<{ instanceId: string }> = ({ instanceId }) => {
  const { openModules, focusInstance, closeModule, updateInstanceBounds, focusedInstanceId } = useOrchestrator();
  const instance = openModules.find(m => m.instanceId === instanceId);
  const def = instance ? moduleRegistry[instance.moduleId] : null;
  const isFocused = focusedInstanceId === instanceId;

  const [snapPreview, setSnapPreview] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    focusInstance(instanceId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      winX: instance?.x || 0,
      winY: instance?.y || 0,
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = dragRef.current.winX + dx;
    const newY = dragRef.current.winY + dy;

    updateInstanceBounds(instanceId, { x: newX, y: newY });

    // LÓGICA DE SNAP PREVIEW
    const threshold = 30; // pixels da borda
    const { innerWidth: sw, innerHeight: sh } = window;

    if (e.clientY < threshold) {
      setSnapPreview({ x: 0, y: 0, w: sw, h: sh }); // Full
    } else if (e.clientX < threshold) {
      setSnapPreview({ x: 0, y: 0, w: sw / 2, h: sh }); // Left
    } else if (e.clientX > sw - threshold) {
      setSnapPreview({ x: sw / 2, y: 0, w: sw / 2, h: sh }); // Right
    } else {
      setSnapPreview(null);
    }
  }, [instanceId, updateInstanceBounds]);

  const handleMouseUp = useCallback(() => {
    if (snapPreview) {
      updateInstanceBounds(instanceId, {
        x: snapPreview.x,
        y: snapPreview.y,
        width: snapPreview.w,
        height: snapPreview.h
      });
      setSnapPreview(null);
    }
    dragRef.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [instanceId, snapPreview, updateInstanceBounds, handleMouseMove]);

  if (!instance || !def) return null;

  const Component = def.component;

  return (
    <>
      {snapPreview && (
        <div 
          className={styles.snapPreview}
          style={{
            left: snapPreview.x,
            top: snapPreview.y,
            width: snapPreview.w,
            height: snapPreview.h,
            zIndex: instance.zIndex - 1
          }}
        />
      )}
      <div 
        className={`${styles.window} ${isFocused ? styles.focused : ""}`}
        style={{
          transform: `translate(${instance.x}px, ${instance.y}px)`,
          width: instance.width,
          height: instance.height,
          zIndex: instance.zIndex,
        }}
        onMouseDown={() => focusInstance(instanceId)}
      >
        <div className={styles.titleBar} onMouseDown={handleMouseDown}>
          <span className={styles.icon}>{def.icon}</span>
          <span className={styles.title}>{def.name}</span>
          <button className={styles.closeBtn} onClick={() => closeModule(instanceId)}>✕</button>
        </div>
        <div className={styles.content}>
          <Component instanceId={instanceId} isFloating={true} />
        </div>
      </div>
    </>
  );
};

export const FloatingManager: React.FC = () => {
  const openModules = useOrchestrator(state => state.openModules);
  const floatingModules = openModules.filter(m => m.isFloating);

  return (
    <div className={styles.container}>
      {floatingModules.map(m => (
        <FloatingWindow key={m.instanceId} instanceId={m.instanceId} />
      ))}
    </div>
  );
};
