import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { emit, listen } from "@tauri-apps/api/event";
import "./App.css";

const appWindow = getCurrentWindow();

function App() {
  const [effect, setEffect] = useState<"Mica" | "Acrylic" | "None">("Mica");
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
      await invoke("trigger_context_menu");
    };

    window.addEventListener("contextmenu", handleGlobalContextMenu);
    return () => {
      unlisten.then((f) => f());
      window.removeEventListener("contextmenu", handleGlobalContextMenu);
    };
  }, []);

  const changeEffect = async (newEffect: "Mica" | "Acrylic" | "None") => {
    setEffect(newEffect);
    await invoke("apply_window_effect", { effect: newEffect });
    if (isMenu) await appWindow.hide();
  };

  const setSide = async (side: number) => {
    await invoke("set_handle_side", { side });
    if (isMenu) await appWindow.hide();
  };

  const handleDragStart = async (e: React.MouseEvent) => {
    if (e.button === 0) { 
      await invoke("start_drag_main");
    }
  };

  // 1. ALÇA
  if (isHandle) {
    return (
      <div className="handle-layout" onMouseDown={handleDragStart}>
        <div className="handle-dot" />
      </div>
    );
  }

  // 2. MENU (OPÇÃO DE DESATIVAR RESTAURADA)
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
        <div className="menu-header">Estilo Visual</div>
        <button onClick={() => changeEffect("Mica")}>Mica</button>
        <button onClick={() => changeEffect("Acrylic")}>Acrylic</button>
        <button onClick={() => changeEffect("None")} style={{ color: '#ff4d4d' }}>Desabilitar Efeitos</button>
        <button onClick={() => appWindow.close()} style={{ opacity: 0.3, marginTop: 'auto' }}>Fechar</button>
      </div>
    );
  }

  return (
    <div className="main-wrapper">
      <main className="container">
        <h1>{appWindow.label === "main" ? "Principal" : "Janela de Teste"}</h1>
        {lastMessage && <div className="toast">📩 {lastMessage}</div>}
        <p>DNA Ativo • Visual Brutalista</p>
        <div className="info">Clique direito na alça para mudar posição</div>
      </main>
    </div>
  );
}

export default App;
