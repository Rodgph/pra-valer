import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { LayoutEngine } from "./modules/layout/components/LayoutEngine";
import { useNavStore, TelemetryItem, NavPosition } from "./modules/nav/navStore";
import { useLayout } from "./modules/layout/store";
import { moduleRegistry } from "./modules/orchestrator/registry";
import { useOrchestrator } from "./modules/orchestrator/store";
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openModule } = useOrchestrator();
  
  const results = Object.values(moduleRegistry).filter(m => 
    m.id !== "NAV" && (
      m.name.toLowerCase().includes(query.toLowerCase()) || 
      m.id.toLowerCase().includes(query.toLowerCase())
    )
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const selectModule = async (moduleId: string) => {
    openModule(moduleId);
    await invoke("emit_global_event", { 
      args: { event: "search-select", payload: { moduleId } } 
    });
    await appWindow.hide();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      selectModule(results[selectedIndex].id);
    } else if (e.key === "Escape") {
      appWindow.hide();
    }
  };

  return (
    <div className="search-container">
      <input 
        ref={inputRef}
        className="search-input"
        placeholder="BUSCAR MÓDULO..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="search-results">
        {results.map((m, index) => (
          <div 
            key={m.id} 
            className={`search-item ${index === selectedIndex ? "selected" : ""}`} 
            onClick={() => selectModule(m.id)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
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
  const [isNavVisible, setIsNavVisible] = useState(false);
  
  const { 
    telemetryVisibility, 
    showWindowControls, 
    autoHideNav,
    position: navPosition, 
    setPosition: setNavPosition,
    toggleAutoHide,
    toggleWindowControls
  } = useNavStore();
  
  const { splitPane, setModule, removePane, root } = useLayout();
  const { openModule } = useOrchestrator();
  
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
      if (root.type === "pane") setModule(root.id, event.payload.moduleId);
    });

    const unlistenNavPos = listen<{ position: NavPosition }>("set-nav-position", (event) => {
      setNavPosition(event.payload.position);
    });

    const unlistenControls = listen("toggle-controls", () => {
      toggleWindowControls();
    });

    const unlistenAutoHide = listen("toggle-autohide", () => {
      toggleAutoHide();
    });

    const unlistenEffect = listen<{ effect: "Mica" | "Acrylic" | "None" }>("sync-effect", (event) => {
      invoke("apply_window_effect", { effect: event.payload.effect });
    });

    if (isMenu) {
      invoke<{ type: string; targetId?: string }>("get_active_menu_config").then(setActiveMenu);
      const unlistenSetup = listen<{ type: string; targetId?: string }>("setup-menu", (e) => setActiveMenu(e.payload));
      return () => { 
        unlistenFocus.then(f => f());
        unlistenSync.then(f => f()); 
        unlistenSetup.then(f => f()); 
        unlistenSearch.then(f => f());
        unlistenNavPos.then(f => f());
        unlistenControls.then(f => f());
        unlistenAutoHide.then(f => f());
        unlistenEffect.then(f => f());
      };
    }

    return () => { 
      unlistenFocus.then(f => f());
      unlistenSync.then(f => f()); 
      unlistenSearch.then(f => f());
      unlistenNavPos.then(f => f());
      unlistenControls.then(f => f());
      unlistenAutoHide.then(f => f());
      unlistenEffect.then(f => f());
    };
  }, [isMenu, setModule, splitPane, removePane, root, isSearch, setNavPosition, toggleAutoHide, toggleWindowControls]);

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

  const setNavPos = async (pos: NavPosition) => {
    await invoke("emit_global_event", { args: { event: "set-nav-position", payload: { position: pos } } });
    if (isMenu) await appWindow.hide();
  };

  const setSide = async (side: number) => {
    await invoke("set_handle_side", { side });
    if (isMenu) await appWindow.hide();
  };

  const changeEffect = async (newEffect: "Mica" | "Acrylic" | "None") => {
    await invoke("apply_window_effect", { effect: newEffect });
    await invoke("emit_global_event", { 
      args: { event: "sync-effect", payload: { effect: newEffect } } 
    });
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
            <div className="menu-grid">
              <button onClick={() => setNavPos("top")} className={navPosition === "top" ? "active" : ""}>Topo</button>
              <button onClick={() => setNavPos("bottom")} className={navPosition === "bottom" ? "active" : ""}>Base</button>
              <button onClick={() => setNavPos("left")} className={navPosition === "left" ? "active" : ""}>Esq.</button>
              <button onClick={() => setNavPos("right")} className={navPosition === "right" ? "active" : ""}>Dir.</button>
            </div>
            <div className="divider" />
            <button onClick={async () => { 
              await appWindow.hide(); 
              await invoke("emit_global_event", { args: { event: "toggle-controls" } }); 
            }}>
              {showWindowControls ? "Ocultar" : "Mostrar"} Window Controls
            </button>
            <button onClick={async () => { 
              await appWindow.hide(); 
              await invoke("emit_global_event", { args: { event: "toggle-autohide" } }); 
            }}>
              {autoHideNav ? "Desativar" : "Ativar"} Auto-Hide NAV
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
            <button onClick={() => broadcastAction("setModule", activeMenu.targetId!, "KernelManager")}>🧠 Kernel Manager</button>
            <button onClick={() => broadcastAction("setModule", activeMenu.targetId!, "SystemMonitor")}>📈 System Monitor</button>
            <button onClick={() => broadcastAction("setModule", activeMenu.targetId!, null)}>Limpar Painel</button>
          </>
        )}
        <button onClick={() => appWindow.hide()} style={{ opacity: 0.3, marginTop: 'auto' }}>Fechar Menu</button>
      </div>
    );
  }

  const isVertical = navPosition === "left" || navPosition === "right";
  const isStart = navPosition === "top" || navPosition === "left";

  const renderNav = () => {
    if (appWindow.label !== "main") return null;
    return (
      <>
        <div 
          className={`nav-wrapper pos-${navPosition} ${(!autoHideNav || isNavVisible) ? 'visible' : ''}`}
          onMouseEnter={() => setIsNavVisible(true)}
          onMouseLeave={() => setIsNavVisible(false)}
          style={{ position: autoHideNav ? 'absolute' : 'relative' }}
        >
          <Nav />
        </div>

        {autoHideNav && !isNavVisible && (
          <div 
            className="nav-trigger"
            onMouseEnter={() => setIsNavVisible(true)}
            style={{
              top: navPosition === 'top' ? 0 : 'auto',
              bottom: navPosition === 'bottom' ? 0 : 'auto',
              left: navPosition === 'left' ? 0 : 'auto',
              right: navPosition === 'right' ? 0 : 'auto',
              width: isVertical ? '10px' : '100%',
              height: isVertical ? '100%' : '10px',
            }}
          />
        )}
      </>
    );
  };

  return (
    <div className="main-wrapper">
      <div 
        className="layout-container"
        style={{ 
          flexDirection: isVertical ? "row" : "column" 
        }}
      >
        {isStart && renderNav()}
        
        <div className="engine-content">
          <LayoutEngine />
        </div>

        {!isStart && renderNav()}
      </div>
    </div>
  );
}

export default App;
