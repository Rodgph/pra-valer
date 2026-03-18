import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";

const appWindow = getCurrentWindow();

function App() {
  const [effect, setEffect] = useState<"Mica" | "Acrylic" | "None">("Mica");

  const changeEffect = async (newEffect: "Mica" | "Acrylic" | "None") => {
    setEffect(newEffect);
    try {
      await invoke("apply_window_effect", { effect: newEffect });
    } catch (e) {
      console.error("Failed to apply window effect:", e);
    }
  };

  const handleClose = () => appWindow.close();
  const handleMinimize = () => appWindow.minimize();

  return (
    <div className="main-wrapper">
      <main className="container">
        <h1>WinUI 3 Experience</h1>
        <p className="status">
          Current effect: <strong>{effect}</strong>
        </p>
        <div className="button-group">
          <button onClick={() => changeEffect("Mica")}>Mica Effect</button>
          <button onClick={() => changeEffect("Acrylic")}>
            Acrylic Effect
          </button>
          <button onClick={() => changeEffect("None")}>Disable Effect</button>
        </div>
        <div style={{ marginTop: "40px", opacity: 0.8 }}>
          <p>Real DWM Attributes • Frameless • No Halo • No Shadow</p>
        </div>
      </main>
    </div>
  );
}

export default App;
