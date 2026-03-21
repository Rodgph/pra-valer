import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import styles from "./Nav.module.css";

const appWindow = getCurrentWindow();

const WindowControls: React.FC<{ isVertical?: boolean }> = ({ isVertical }) => {
  return (
    <div className={`${styles.windowControls} ${isVertical ? styles.verticalControls : ""}`}>
      <button className={styles.winBtnOpen} onClick={() => appWindow.minimize()}>⚊</button>
      <button className={styles.winBtnMax} onClick={() => appWindow.toggleMaximize()}>🔳</button>
      <button className={styles.winBtnClose} onClick={() => appWindow.close()}>✕</button>
    </div>
  );
};

export default WindowControls;
