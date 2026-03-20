import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { LayoutEngine } from "./modules/layout/components/LayoutEngine";
import { useNavStore } from "./modules/nav/navStore";
import { useLayout } from "./modules/layout/store";
import { moduleRegistry } from "./modules/orchestrator/registry";
import Nav from "./modules/nav/Nav";
import "./App.css";

const appWindow = getCurrentWindow();

const WidgetView = ({ moduleName }: { moduleName: string }) => {
  const Component = moduleRegistry[moduleName]?.component;
  return (
    <div className="widget-wrapper" onMouseDown={() => invoke("start_drag_window")}>
      <div className="widget-content">
        {Component ? <Component /> : `Módulo ${moduleName} não encontrado`}
      </div>
    </div>
  );
};

const HandleView = () => (
  <div 
    className="handle-layout" 
    onMouseDown={(e) => { if (e.button === 0) invoke("start_drag_main"); }}
    onContextMenu={(e) => { e.preventDefault(); invoke("trigger_context_menu", { args: { menuType: "HANDLE" } }); }}
  >
    <div className="handle-dot" />
  </div>
);

function App() {
  const [activeMenu, setActiveMenu] = useState<{ type: string; targetId?: string } | null>(null);
  const { showWindowControls, toggleWindowControls } = useNavStore();
  const { splitPane, setModule, removePane, root } = useLayout();
  
  const query = new URLSearchParams(window.location.search);
  const type = query.get("type");
  const moduleParam = query.get("module");

  const isMenu = appWindow.label === "context_menu";
  const isHandle = appWindow.label === "handle_win";
  const isWidget = appWindow.label.startsWith("widget_") || type === "widget";

  useEffect(() => {
    // ESCUTA DE SINCRONIA: Ouve comandos de outras janelas e aplica no Store local
    const unlistenSync = listen<{ action: string; paneId: string; data?: any }>("sync-layout", (event) => {
      const { action, paneId, data } = event.payload;
      console.log(`[SYNC-EVENT] Aplicando ${action} em ${paneId}`);
      if (action === "setModule") setModule(paneId, data);
      else if (action === "split") splitPane(paneId, data);
      else if (action === "remove") removePane(paneId);
    });

    if (isMenu) {
      invoke<{ type: string; targetId?: string }>("get_active_menu_config").then(setActiveMenu);
      const unlistenSetup = listen<{ type: string; targetId?: string }>("setup-menu", (e) => setActiveMenu(e.payload));
      return () => { unlistenSync.then(f => f()); unlistenSetup.then(f => f()); };
    }

    return () => { unlistenSync.then(f => f()); };
  }, [isMenu, setModule, splitPane, removePane]);

  const broadcastAction = async (action: string, paneId: string, data?: any) => {
    if (isMenu) await appWindow.hide();
    
    // 1. Atualiza a própria janela
    if (action === "setModule") setModule(paneId, data);
    else if (action === "split") splitPane(paneId, data);
    else if (action === "remove") removePane(paneId);

    // 2. Avisa as outras via Rust (Corrigido: parâmetros agora dentro de 'args')
    await invoke("emit_global_event", { 
      args: {
        event: "sync-layout", 
        payload: { action, paneId, data } 
      }
    });
  };

  const detachToWidget = async (paneId: string) => {
    const findModule = (node: any): string | null => {
      if (node.id === paneId) return node.moduleId;
      if (node.type === "split") return findModule(node.first) || findModule(node.second);
      return null;
    };
    const moduleId = findModule(root);
    
    if (moduleId) {
      if (isMenu) await appWindow.hide();
      // Corrigido: parâmetros dentro de 'args'
      await invoke("spawn_widget_window", { args: { moduleId } });
      await broadcastAction("setModule", paneId, null);
    }
  };

  const changeEffect = async (newEffect: "Mica" | "Acrylic" | "None") => {
    await invoke("apply_window_effect", { effect: newEffect });
    if (isMenu) await appWindow.hide();
  };

  const setSide = async (side: number) => {
    await invoke("set_handle_side", { side });
    if (isMenu) await appWindow.hide();
  };

  if (isWidget && moduleParam) return <WidgetView moduleName={moduleParam} />;
  if (isHandle) return <HandleView />;

  if (isMenu) {
    return (
      <div className="menu-box">
        {activeMenu?.type === "NAV" && (
          <>
            <div className="menu-header">Navegação</div>
            <button onClick={async () => { 
              await appWindow.hide(); 
              await invoke("emit_global_event", { args: { event: "toggle-controls" } }); 
            }}>
              Alternar Window Controls
            </button>
            <div className="divider" />
            <button onClick={() => appWindow.close()} style={{ color: '#ff4d4d' }}>✕ Sair do Sistema</button>
          </>
        )}

        {activeMenu?.type === "HANDLE" && (
          <>
            <div className="menu-header">Posição</div>
            <div className="menu-grid">
              <button onClick={() => setSide(0)}>Topo</button><button onClick={() => setSide(1)}>Base</button>
              <button onClick={() => setSide(2)}>Esq.</button><button onClick={() => setSide(3)}>Dir.</button>
            </div>
            <div className="divider" />
            <button onClick={() => changeEffect("Mica")}>Mica</button>
            <button onClick={() => changeEffect("Acrylic")}>Acrylic</button>
          </>
        )}

        {activeMenu?.type === "LAYOUT" && (
          <>
            <div className="menu-header">Painel</div>
            <button onClick={() => broadcastAction("split", activeMenu.targetId!, "horizontal")}>Dividir H</button>
            <button onClick={() => broadcastAction("split", activeMenu.targetId!, "vertical")}>Dividir V</button>
            <button onClick={() => broadcastAction("remove", activeMenu.targetId!)} style={{ color: '#ff4d4d' }}>✕ Remover Divisão</button>
            <div className="divider" />
            <button onClick={() => broadcastAction("setModule", activeMenu.targetId!, "Clock")}>🕒 Relógio</button>
            <button onClick={() => broadcastAction("setModule", activeMenu.targetId!, null)}>Limpar Painel</button>
          </>
        )}
        <button onClick={() => appWindow.hide()} style={{ opacity: 0.3, marginTop: 'auto' }}>Fechar Menu</button>
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
