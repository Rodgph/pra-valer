import { getCurrentWindow } from "@tauri-apps/api/window";
import { useNavStore } from "./navStore";
import styles from "./WindowControls.module.css";

const appWindow = getCurrentWindow();

const WindowControls = () => {
  const { position } = useNavStore();
  const isVerticalNav = position === "left" || position === "right";

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.close();

  return (
    <div className={`${styles.container} ${isVerticalNav ? styles.vertical : styles.horizontal}`}>
      <button 
        onClick={handleClose}
        title="Fechar"
        className={`${styles.buttonBase} ${styles.close}`}
      />
      <button 
        onClick={handleMinimize}
        title="Minimizar"
        className={`${styles.buttonBase} ${styles.minimize}`}
      />
      <button 
        onClick={handleMaximize}
        title="Maximizar"
        className={`${styles.buttonBase} ${styles.maximize}`}
      />
    </div>
  );
};

export default WindowControls;
