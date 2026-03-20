import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { LayoutEngine } from "./modules/layout/components/LayoutEngine";
import { useNavStore } from "./modules/nav/navStore";
import { useLayout } from "./modules/layout/store";
import Nav from "./modules/nav/Nav";
import "./App.css";

const appWindow = getCurrentWindow();

function App() {
  const [activeMenu, setActiveMenu] = useState<{ type: string; targetId?: string } | null>(null);
  const { showWindowControls, toggleWindowControls } = useNavStore();
  const { splitPane } = useLayout();
  
  const isMenu = appWindow.label === "context_menu";
  const isHandle = appWindow.label === "handle_win";

  useEffect(() => {
    const loadMenuConfig = async () => {
      if (isMenu) {
        const config = await invoke<{ type: string; targetId?: string }>("get_active_menu_config");
        setActiveMenu(config);
      }
    };
    loadMenuConfig();

    const unlistenMenu = listen<{ type: string; targetId?: string }>("setup-menu", (event) => {
      setActiveMenu(event.payload);
    });

    return () => { unlistenMenu.then(f => f()); };
  }, [isMenu]);

  const changeEffect = async (newEffect: "Mica" | "Acrylic" | "None") => {
    await invoke("apply_window_effect", { effect: newEffect });
    if (isMenu) await appWindow.hide();
  };

  const setSide = async (side: number) => {
    await invoke("set_handle_side", { side });
    if (isMenu) await appWindow.hide();
  };

  const renderMenuContent = () => {
    if (!activeMenu || activeMenu.type === "NONE") return <div className="menu-header">Aguardando...</div>;

    switch (activeMenu.type) {
      case "NAV":
        return (
          <>
            <div className="menu-header">Barra de Navegação</div>
            <button onClick={async () => { await invoke("emit_global_event", { event: "toggle-controls" }); appWindow.hide(); }}>
              Alternar Window Controls
            </button>
            <div className="divider" />
            <button onClick={() => appWindow.close()} style={{ color: '#ff4d4d' }}>✕ Sair do Sistema</button>
          </>
        );
      case "HANDLE":
        return (
          <>
            <div className="menu-header">Posição da Alça</div>
            <div className="menu-grid">
              <button onClick={() => setSide(0)}>Topo</button>
              <button onClick={() => setSide(1)}>Base</button>
              <button onClick={() => setSide(2)}>Esq.</button>
              <button onClick={() => setSide(3)}>Dir.</button>
            </div>
            <div className="divider" />
            <div className="menu-header">DNA Visual</div>
            <button onClick={() => changeEffect("Mica")}>Usar Mica</button>
            <button onClick={() => changeEffect("Acrylic")}>Usar Acrylic</button>
            <button onClick={() => changeEffect("None")} style={{ color: '#ff4d4d' }}>Desativar</button>
          </>
        );
      case "LAYOUT":
        return (
          <>
            <div className="menu-header">Gerenciar Painel</div>
            <button onClick={() => { splitPane(activeMenu.targetId!, "horizontal"); appWindow.hide(); }}>Dividir Horizontal</button>
            <button onClick={() => { splitPane(activeMenu.targetId!, "vertical"); appWindow.hide(); }}>Dividir Vertical</button>
            <div className="divider" />
            <div className="menu-header">Adicionar Módulo</div>
            <button style={{ opacity: 0.5 }}>Chat (Breve)</button>
            <button style={{ opacity: 0.5 }}>Relógio (Breve)</button>
          </>
        );
      default:
        return <div className="menu-header">Menu: {activeMenu.type}</div>;
    }
  };

  if (isHandle) {
    return (
      <div 
        className="handle-layout" 
        onMouseDown={async (e) => { if (e.button === 0) await invoke("start_drag_main"); }}
        onContextMenu={async (e) => { e.preventDefault(); await invoke("trigger_context_menu", { menuType: "HANDLE" }); }}
      >
        <div className="handle-dot" />
      </div>
    );
  }

  if (isMenu) {
    return (
      <div className="menu-box">
        {renderMenuContent()}
        <button onClick={() => appWindow.hide()} style={{ opacity: 0.3, marginTop: 'auto', fontSize: '10px' }}>Fechar Menu</button>
      </div>
    );
  }

  return (
    <div className="main-wrapper">
      <div className="layout-container">
        {appWindow.label === "main" && <Nav />}
        <div className="engine-content">
          <LayoutEngine />
        </div>
      </div>
    </div>
  );
}

export default App;
