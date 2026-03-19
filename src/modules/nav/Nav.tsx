import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import styles from "./Nav.module.css";

const appWindow = getCurrentWindow();

const Nav: React.FC = () => {
  const handleMouseDown = (e: React.MouseEvent) => {
    // Se clicou na barra (e não em um botão), inicia o arraste nativo do Windows
    if ((e.target as HTMLElement).classList.contains(styles.navBar)) {
      appWindow.startDragging();
    }
  };

  return (
    <nav className={styles.navBar} onMouseDown={handleMouseDown}>
      <div className={styles.sectionLeft}>
        <span className={styles.logo}>S</span>
        <button className={styles.navItem}>Módulos</button>
      </div>
      
      <div className={styles.sectionCenter}>
        <div className={styles.dragHandle}>SOCIAL OS</div>
      </div>

      <div className={styles.sectionRight}>
        <button className={styles.winBtn} onClick={() => appWindow.minimize()}>⚊</button>
        <button className={styles.winBtn} onClick={() => appWindow.close()}>✕</button>
      </div>
    </nav>
  );
};

export default Nav;
