import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { LayoutEngine } from "./modules/layout/components/LayoutEngine";
import { useNavStore, TelemetryItem } from "./modules/nav/navStore";
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

const SearchView = () => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const results = Object.values(moduleRegistry).filter(m => 
    m.name.toLowerCase().includes(query.toLowerCase()) || 
    m.id.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const selectModule = async (moduleId: string) => {
    await invoke("emit_global_event", { 
      args: { event: "search-select", payload: { moduleId } } 
    });
    await appWindow.hide();
  };

  return (
    <div className="search-container">
      <input 
        ref={inputRef}
        className="search-input"
        placeholder="BUSCAR MÓDULO..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && results[0]) selectModule(results[0].id); }}
      />
      <div className="search-results">
        {results.map(m => (
          <div key={m.id} className="search-item" onClick={() => selectModule(m.id)}>
            <span className="search-icon">{m.icon}</span>
            <span className="search-name">{m.name}</span>
            <span className="search-id">{m.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [activeMenu, setActiveMenu] = useState<{ type: string; targetId?: string } | null>(null);
  const [isFocused, setIsFocused] = useState(true);
  const { telemetryVisibility, showWindowControls } = useNavStore();
  const { splitPane, setModule, removePane, root } = useLayout();
  
  const query = new URLSearchParams(window.location.search);
  const type = query.get("type");
  const moduleParam = query.get("module");

  const isMenu = appWindow.label === "context_menu" || type === "menu";
  const isHandle = appWindow.label === "handle_win" || type === "handle";
  const isSearch = appWindow.label === "search_global" || type === "search";
  const isWidget = appWindow.label.startsWith("widget_") || type === "widget";

  useEffect(() => {
    const unlistenFocus = appWindow.onFocusChanged(({ payload: focused }) => {
      setIsFocused(focused);
    });

    const unlistenSync = listen<{ action: string; paneId: string; data?: any }>("sync-layout", (event) => {
      const { action, paneId, data } = event.payload;
      if (action === "setModule") setModule(paneId, data);
      else if (action === "split") splitPane(paneId, data);
      else if (action === "remove") removePane(paneId);
    });

    const unlistenSearch = listen<{ moduleId: string }>("search-select", (event) => {
      // Por enquanto, abre o módulo no root se for um painel vazio
      // Futuramente podemos implementar lógica de "encontrar painel focado"
      if (root.type === "pane") {
        setModule(root.id, event.payload.moduleId);
      }
    });

    if (isMenu) {
      invoke<{ type: string; targetId?: string }>("get_active_menu_config").then(setActiveMenu);
      const unlistenSetup = listen<{ type: string; targetId?: string }>("setup-menu", (e) => setActiveMenu(e.payload));
      return () => { 
        unlistenFocus.then(f => f());
        unlistenSync.then(f => f()); 
        unlistenSetup.then(f => f()); 
        unlistenSearch.then(f => f());
      };
    }

    return () => { 
      unlistenFocus.then(f => f());
      unlistenSync.then(f => f()); 
      unlistenSearch.then(f => f());
    };
  }, [isMenu, setModule, splitPane, removePane, root]);

  const broadcastAction = async (action: string, paneId: string, data?: any) => {
    if (isMenu) await appWindow.hide();
    if (action === "setModule") setModule(paneId, data);
    else if (action === "split") splitPane(paneId, data);
    else if (action === "remove") removePane(paneId);

    await invoke("emit_global_event", { 
      args: { event: "sync-layout", payload: { action, paneId, data } }
    });
  };

  const toggleItem = async (item: TelemetryItem) => {
    await invoke("emit_global_event", { args: { event: "toggle-telemetry-item", payload: { item } } });
  };

  const setSide = async (side: number) => {
    await invoke("set_handle_side", { side });
    if (isMenu) await appWindow.hide();
  };

  const changeEffect = async (newEffect: "Mica" | "Acrylic" | "None") => {
    await invoke("apply_window_effect", { effect: newEffect });
    if (isMenu) await appWindow.hide();
  };

  if (isWidget && moduleParam) return <WidgetView moduleName={moduleParam} />;
  if (isHandle) return <HandleView />;
  if (isSearch) return <SearchView />;

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
              {showWindowControls ? "Ocultar" : "Mostrar"} Window Controls
            </button>
            
            <div className="divider" />
            <div className="menu-header">Telemetria</div>
            <div className="menu-grid">
              <button onClick={() => toggleItem("cpu")} className={telemetryVisibility.cpu ? "active" : ""}>CPU</button>
              <button onClick={() => toggleItem("ram")} className={telemetryVisibility.ram ? "active" : ""}>RAM</button>
              <button onClick={() => toggleItem("gpu")} className={telemetryVisibility.gpu ? "active" : ""}>GPU</button>
              <button onClick={() => toggleItem("vram")} className={telemetryVisibility.vram ? "active" : ""}>VRAM</button>
              <button onClick={() => toggleItem("net")} className={telemetryVisibility.net ? "active" : ""}>NET</button>
            </div>

            <div className="divider" />
            <div className="menu-header">Intervalo</div>
            <div className="menu-grid">
              <button onClick={async () => { 
                await appWindow.hide(); 
                await invoke("emit_global_event", { args: { event: "set-telemetry-interval", payload: { interval: 500 } } }); 
              }}>500ms</button>
              <button onClick={async () => { 
                await appWindow.hide(); 
                await invoke("emit_global_event", { args: { event: "set-telemetry-interval", payload: { interval: 1000 } } }); 
              }}>1s</button>
              <button onClick={async () => { 
                await appWindow.hide(); 
                await invoke("emit_global_event", { args: { event: "set-telemetry-interval", payload: { interval: 3000 } } }); 
              }}>3s</button>
            </div>

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
            <button onClick={() => changeEffect("None")}>Sem Efeito</button>
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
    <div className={`main-wrapper ${isFocused ? "focused" : ""}`}>
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
