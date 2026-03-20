import React, { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useNavStore } from "./navStore";
import WindowControls from "./WindowControls";
import styles from "./Nav.module.css";

const appWindow = getCurrentWindow();

const Nav: React.FC = () => {
  const { showWindowControls, toggleWindowControls } = useNavStore();

  useEffect(() => {
    // Ouvir o sinal vindo de outras janelas (ex: Menu de Contexto)
    const unlisten = listen("toggle-controls", () => {
      toggleWindowControls();
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [toggleWindowControls]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains(styles.navBar) || 
        (e.target as HTMLElement).classList.contains(styles.sectionCenter)) {
      appWindow.startDragging();
    }
  };

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    // Disparar menu tipo NAV
    await invoke("trigger_context_menu", { menuType: "NAV" });
  };

  return (
    <nav 
      className={styles.navBar} 
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.sectionLeft}>
        <button className={styles.navItem}>Módulos</button>
      </div>
      
      <div className={styles.sectionCenter}>
        {/* Espaço limpo para arraste */}
      </div>

      <div className={styles.sectionRight}>
        {showWindowControls && <WindowControls />}
      </div>
    </nav>
  );
};

export default Nav;
