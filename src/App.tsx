import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { LayoutEngine } from "./modules/layout/components/LayoutEngine";
import Nav from "./modules/nav/Nav"; // Importar o NAV
import "./App.css";

const appWindow = getCurrentWindow();

function App() {
  const [lastMessage, setLastMessage] = useState<string>("");
  
  const isMenu = appWindow.label === "context_menu";
  const isHandle = appWindow.label === "handle_win";

  useEffect(() => {
    const unlisten = listen<{ message: string }>("hello-event", (event) => {
      setLastMessage(event.payload.message);
      setTimeout(() => setLastMessage(""), 5000);
    });

    const handleGlobalContextMenu = async (e: MouseEvent) => {
      e.preventDefault();
      if (!isMenu && !isHandle) {
        await invoke("trigger_context_menu");
      }
    };

    window.addEventListener("contextmenu", handleGlobalContextMenu);
    return () => {
      unlisten.then((f) => f());
      window.removeEventListener("contextmenu", handleGlobalContextMenu);
    };
  }, [isMenu, isHandle]);

  const changeEffect = async (newEffect: "Mica" | "Acrylic" | "None") => {
    await invoke("apply_window_effect", { effect: newEffect });
    if (isMenu) await appWindow.hide();
  };

  const setSide = async (side: number) => {
    await invoke("set_handle_side", { side });
    if (isMenu) await appWindow.hide();
  };

  // --- ALÇA (Janela 3) ---
  if (isHandle) {
    return (
      <div 
        className="handle-layout" 
        onMouseDown={async (e) => { if (e.button === 0) await invoke("start_drag_main"); }}
      >
        <div className="handle-dot" />
      </div>
    );
  }

  // --- MENU (Janela 4) ---
  if (isMenu) {
    return (
      <div className="menu-box">
        <div className="menu-header">Posição da Alça</div>
        <div className="menu-grid">
          <button onClick={() => setSide(0)}>Topo</button>
          <button onClick={() => setSide(1)}>Base</button>
          <button onClick={() => setSide(2)}>Esquerda</button>
          <button onClick={() => setSide(3)}>Direita</button>
        </div>
        <div className="divider" />
        <div className="menu-header">DNA Visual</div>
        <button onClick={() => changeEffect("Mica")}>Mica</button>
        <button onClick={() => changeEffect("Acrylic")}>Acrylic</button>
        <button onClick={() => changeEffect("None")} style={{ color: '#ff4d4d' }}>Desativar</button>
        <button onClick={() => appWindow.close()} style={{ opacity: 0.3, marginTop: 'auto' }}>Fechar</button>
      </div>
    );
  }

  // --- JANELA PRINCIPAL / TESTE ---
  return (
    <div className="main-wrapper">
      <div className="layout-container">
        {/* Renderiza o NAV apenas se não for a janela de teste (opcional) */}
        {appWindow.label === "main" && <Nav />}
        
        {lastMessage && <div className="toast">📩 {lastMessage}</div>}
        
        <div className="engine-content">
          <LayoutEngine />
        </div>
      </div>
    </div>
  );
}

export default App;
