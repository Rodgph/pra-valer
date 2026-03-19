import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { emit, listen } from "@tauri-apps/api/event";
import "./App.css";

const appWindow = getCurrentWindow();

function App() {
  const [effect, setEffect] = useState<"Mica" | "Acrylic" | "None">("Mica");
  const [lastMessage, setLastMessage] = useState<string>("");
  
  // Detecção via Label Nativa
  const isMenu = appWindow.label === "context_menu";
  const isHandle = appWindow.label === "handle_win";

  useEffect(() => {
    const unlisten = listen<{ message: string }>("hello-event", (event) => {
      setLastMessage(event.payload.message);
      setTimeout(() => setLastMessage(""), 5000);
    });

    const handleGlobalContextMenu = async (e: MouseEvent) => {
      e.preventDefault();
      // Somente janelas normais podem chamar o menu
      if (!isMenu && !isHandle) {
        try {
          await invoke("trigger_context_menu");
        } catch (err) {
          console.error("Menu trigger failed:", err);
        }
      }
    };

    window.addEventListener("contextmenu", handleGlobalContextMenu);
    return () => {
      unlisten.then((f) => f());
      window.removeEventListener("contextmenu", handleGlobalContextMenu);
    };
  }, [isMenu, isHandle]);

  const changeEffect = async (newEffect: "Mica" | "Acrylic" | "None") => {
    setEffect(newEffect);
    await invoke("apply_window_effect", { effect: newEffect });
    if (isMenu) await appWindow.hide();
  };

  const sendHello = async () => {
    await emit("hello-event", { message: `Hello from ${appWindow.label}!` });
    if (isMenu) await appWindow.hide();
  };

  // --- RENDERIZAÇÃO DA ALÇA ---
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

  // --- RENDERIZAÇÃO DO MENU ---
  if (isMenu) {
    return (
      <div className="menu-box">
        <div className="menu-header">Menu Social OS</div>
        <div className="menu-content">
          <button onClick={() => changeEffect("Mica")}>Mica Mode</button>
          <button onClick={() => changeEffect("Acrylic")}>Acrylic Mode</button>
          <div className="divider" />
          <button onClick={sendHello} className="accent">Broadcast Hello</button>
          <button onClick={() => appWindow.hide()} style={{ opacity: 0.3, marginTop: '10px' }}>Fechar</button>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO NORMAL ---
  return (
    <div className="main-wrapper">
      <main className="container">
        <h1>{appWindow.label === "main" ? "Principal" : "Janela de Teste"}</h1>
        {lastMessage && <div className="toast">📩 {lastMessage}</div>}
        <p>DNA Ativo • Visual Brutalista</p>
        <div className="info">Clique direito para menu limpo</div>
      </main>
    </div>
  );
}

export default App;
