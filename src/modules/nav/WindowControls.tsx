import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import styles from "./Nav.module.css";

const appWindow = getCurrentWindow();

const WindowControls: React.FC = () => {
  return (
    <div className={styles.windowControls}>
      <button className={styles.winBtn} onClick={() => appWindow.minimize()}>⚊</button>
      <button className={styles.winBtn} onClick={() => appWindow.toggleMaximize()}>🔳</button>
      <button className={styles.winBtnClose} onClick={() => appWindow.close()}>✕</button>
    </div>
  );
};

export default WindowControls;
