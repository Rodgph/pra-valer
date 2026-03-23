import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { LayoutEngine } from "./modules/layout/components/LayoutEngine";
import { FloatingManager } from "./modules/orchestrator/FloatingManager";
import { useNavStore, TelemetryItem, NavPosition } from "./modules/nav/navStore";
import { useLayout } from "./modules/layout/store";
import { moduleRegistry } from "./modules/orchestrator/registry";
import { useOrchestrator } from "./modules/orchestrator/store";
import Nav from "./modules/nav/Nav";
import { useBrowserStore } from "./modules/browser/browserStore";
import { useUserStylesStore } from "./modules/browser/userStylesStore";
import { useWorkspaceStore } from "./modules/layout/workspaceStore";
import "./App.css";
import styles from "./App.module.css";

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

const CSSInjectorView = ({ targetPaneId }: { targetPaneId: string }) => {
  const { urls } = useBrowserStore();
  const { styles: userStyles, enabled: stylesEnabled, setStyle, toggleStyle } = useUserStylesStore();

  const targetUrl = urls[targetPaneId] || "";

  // Cálculo seguro do domínio
  let domain = "GLOBAL";
  try {
    if (targetUrl && targetUrl.startsWith("http")) {
      domain = new URL(targetUrl).hostname;
    }
  } catch (e) {
    console.error("Erro ao processar URL:", targetUrl);
  }

  const isEnabled = stylesEnabled[domain] ?? true;
  const [localCss, setLocalCss] = useState("");
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Carrega o CSS salvo para este domínio sempre que o domínio mudar
    const saved = userStyles[domain] || "";
    setLocalCss(saved);
    // Aplica se estiver habilitado
    if (targetPaneId) {
      invoke("apply_browser_css", { 
        paneId: targetPaneId, 
        css: isEnabled ? saved : "" 
      });
    }
  }, [domain, targetPaneId, userStyles, isEnabled]);

  const handleCssChange = (value: string) => {
    setLocalCss(value);

    // 1. Injeta em tempo real se habilitado
    if (isEnabled) {
      invoke("apply_browser_css", { paneId: targetPaneId, css: value });
    }

    // 2. Debounce para salvar na store
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      if (domain !== "GLOBAL") {
        setStyle(domain, value);
      }
    }, 500);
  };

  const onToggle = () => {
    const nextState = !isEnabled;
    toggleStyle(domain);
    
    // Comunicação imediata com o browser
    if (targetPaneId) {
      invoke("apply_browser_css", { 
        paneId: targetPaneId, 
        css: nextState ? localCss : "" 
      });
    }
  };

  return (
    <div className={styles.cssEditorContainer}>
      <div onMouseDown={() => appWindow.startDragging()} className={styles.cssEditorHeader}>
        <div className={styles.cssEditorTitleGroup}>
          <div className={styles.cssEditorSubtitle}>REALTIME_CSS_INJECTOR // PANE: {targetPaneId}</div>
          <div className={styles.cssEditorTitle}>
            DOMAIN: <span style={{ color: '#00FF66' }}>{domain.toUpperCase()}</span>
          </div>
        </div>
        <div className={styles.cssEditorHeaderActions}>
          <button 
            onClick={onToggle}
            className={isEnabled ? styles.cssToggleActive : styles.cssToggleInactive}
            title={isEnabled ? "Desativar CSS para este site" : "Ativar CSS para este site"}
          >
            {isEnabled ? "ENABLED" : "DISABLED"}
          </button>
          <button onClick={() => appWindow.close()} className={styles.cssEditorClose}>✕</button>
        </div>
      </div>
      <textarea 
        autoFocus
        value={localCss}
        onChange={(e) => handleCssChange(e.target.value)}
        placeholder="/* DIGITE SEU CSS BRUTALISTA AQUI... */"
        className={styles.cssEditorTextarea}
        disabled={!isEnabled}
        style={{ opacity: isEnabled ? 1 : 0.3 }}
      />
      <div className={styles.cssEditorFooter}>
        STATUS: {!isEnabled ? "OFFLINE" : (localCss.length > 0 ? "INJECTING_ACTIVE" : "IDLE")} // PERSISTENCE: ENABLED
      </div>
    </div>
  );
};
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
    // TRATAMENTO DE COMANDOS POWER USER
    const input = query.trim();
    
    if (input.startsWith("/")) {
      const [cmd, ...args] = input.slice(1).split(" ");
      const fullArgs = args.join(" ");

      switch (cmd.toLowerCase()) {
        case "save":
          if (fullArgs) {
            const currentRoot = useLayout.getState().root;
            useWorkspaceStore.getState().saveWorkspace(fullArgs, currentRoot);
          }
          break;
        
        case "load":
          if (fullArgs) {
            const savedRoot = useWorkspaceStore.getState().loadWorkspace(fullArgs);
            if (savedRoot) {
              useLayout.setState({ root: savedRoot });
              invoke("emit_global_event", { 
                args: { event: "sync-layout", payload: { action: "full-reset", paneId: "root", data: savedRoot } } 
              });
            }
          }
          break;

        case "g":
        case "google":
          if (fullArgs) {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(fullArgs)}`;
            const searchInstanceId = `browser-search-${Math.random().toString(36).substr(2, 5)}`;
            
            // 1. Define a URL na store para este novo ID
            useBrowserStore.getState().setPaneUrl(searchInstanceId, searchUrl);
            
            // 2. Abre o módulo passando o instanceId (isso requer que a store suporte receber ID ou usemos o evento sync)
            openModule("SocialBrowser", true);
            
            // Pequeno hack: o openModule gera um ID aleatório. 
            // Vou ajustar para que o comando Power User use o sistema de eventos globais de forma mais direta.
            invoke("emit_global_event", { 
              args: { 
                event: "sync-orchestrator", 
                payload: { 
                  action: "open", 
                  payload: { moduleId: "SocialBrowser", isFloating: true } 
                } 
              } 
            });
          }
          break;
        
        case "mica": await invoke("apply_window_effect", { effect: "Mica" }); break;
        case "acrylic": await invoke("apply_window_effect", { effect: "Acrylic" }); break;
        case "none": await invoke("apply_window_effect", { effect: "None" }); break;
        
        case "kill":
          if (fullArgs) {
            const { openModules, closeModule } = useOrchestrator.getState();
            openModules.filter(m => m.moduleId.toLowerCase().includes(fullArgs.toLowerCase()))
                       .forEach(m => closeModule(m.instanceId));
          }
          break;

        case "exit":
        case "quit":
          appWindow.close();
          break;
      }
      await appWindow.hide();
      setQuery("");
      return;
    }

    openModule(moduleId);
    await invoke("emit_global_event", { 
      args: { event: "search-select", payload: { moduleId } } 
    });
    await appWindow.hide();
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex(prev => (prev + 1) % (results.length || 1));
    } else if (e.key === "ArrowUp") {
      setSelectedIndex(prev => (prev - 1 + results.length) % (results.length || 1));
    } else if (e.key === "Enter") {
      if (query.startsWith("/")) {
        selectModule("COMMAND");
      } else if (results[selectedIndex]) {
        selectModule(results[selectedIndex].id);
      }
    } else if (e.key === "Escape") {
      appWindow.hide();
    }
  };

  const isCommand = query.startsWith("/");

  return (
    <div className="search-container">
      <input 
        ref={inputRef}
        className="search-input"
        placeholder={isCommand ? "EXECUTAR COMANDO..." : "BUSCAR MÓDULO..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{ color: isCommand ? "#00FF66" : "#fff", borderBottomColor: isCommand ? "#00FF66" : "" }}
      />
      <div className="search-results">
        {isCommand ? (
          <div className="search-item selected">
            <span className="search-icon">⚡</span>
            <span className="search-name">EXECUTAR: {query}</span>
            <span className="search-id">SYSTEM_CMD</span>
          </div>
        ) : (
          results.map((m, index) => (
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
          ))
        )}
      </div>
    </div>
  );
};

const LoaderView = () => (
  <div className={styles.loaderRoot}>
    <div className={styles.loaderLine} />
  </div>
);

function App() {
  const [activeMenu, setActiveMenu] = useState<{ type: string; targetId?: string } | null>(null);
  const [, setIsFocused] = useState(true);
  const [isNavVisible, setIsNavVisible] = useState(false);
  
  const { 
    telemetryVisibility, 
    showWindowControls, 
    showClock,
    autoHideNav,
    position: navPosition, 
    setPosition: setNavPosition,
    toggleAutoHide,
    toggleWindowControls,
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
  const isCSSEditor = appWindow.label.startsWith("css_injector_") || type === "css_injector";
  const isLoader = appWindow.label === "browser_loader" || type === "browser_loader";

  useEffect(() => {
    const unlistenFocus = appWindow.onFocusChanged(({ payload: focused }) => {
      setIsFocused(focused);
    });

    const unlistenSync = listen<{ action: string; paneId: string; data?: any }>("sync-layout", (event) => {
      const { action, paneId, data } = event.payload;
      console.log("SYNC_LAYOUT_EVENT:", { action, paneId, data });
      
      if (action === "setModule") {
        setModule(paneId, data);
      } else if (action === "split") {
        console.log("EXECUTING_SPLIT:", paneId, data);
        // data agora pode ser um objeto: { direction, newPaneId, initialModuleId, insertAt }
        if (typeof data === "object") {
          splitPane(paneId, data.direction, data.newPaneId, data.initialModuleId, data.insertAt);
        } else {
          // Fallback para o menu de contexto antigo que enviava apenas a direção como string
          const newId = `pane-${Math.random().toString(36).substr(2, 9)}`;
          splitPane(paneId, data, newId, null, "second");
        }
      } else if (action === "remove") {
        removePane(paneId);
      } else if (action === "full-reset") {
        useLayout.setState({ root: data });
      }
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
      };
    }

    return () => { 
      unlistenFocus.then(f => f());
      unlistenSync.then(f => f()); 
      unlistenSearch.then(f => f());
      unlistenNavPos.then(f => f());
      unlistenControls.then(f => f());
      unlistenAutoHide.then(f => f());
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
    if (isMenu) await appWindow.hide();
  };

  if (isLoader) return <LoaderView />;
  if (isCSSEditor) return <CSSInjectorView targetPaneId={query.get("target") || ""} />;
  if (isWidget && moduleParam) return <WidgetView moduleName={moduleParam} />;
  if (isHandle) return <HandleView />;
  if (isSearch) return <SearchView />;

  if (isMenu) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPath, setMenuPath] = useState<string[]>(["root"]);

    useEffect(() => {
      if (menuRef.current) {
        const resizeMenu = async () => {
          requestAnimationFrame(async () => {
            const width = menuRef.current?.scrollWidth || 180;
            const height = menuRef.current?.scrollHeight || 100;
            const factor = await appWindow.scaleFactor();
            await appWindow.setSize(new PhysicalSize(Math.round(width * factor), Math.round(height * factor)));
            await appWindow.show();
            await appWindow.setFocus();
          });
        };
        resizeMenu();
      }
    }, [activeMenu, menuPath]);

    const currentLevel = menuPath[menuPath.length - 1];

    const renderRootMenu = () => {
      if (!activeMenu) return null;

      if (activeMenu.type === "NAV") {
        return (
          <>
            <div className="menu-header">Navegação</div>
            <div className="menu-grid">
              <button onClick={() => setNavPos("top")} className={navPosition === "top" ? "active" : ""}>Topo</button>
              <button onClick={() => setNavPos("bottom")} className={navPosition === "bottom" ? "active" : ""}>Base</button>
              <button onClick={() => setNavPos("left")} className={navPosition === "left" ? "active" : ""}>Esq.</button>
              <button onClick={() => setNavPos("right")} className={navPosition === "right" ? "active" : ""}>Dir.</button>
            </div>
            <div className="divider" />
            <button onClick={async () => { await appWindow.hide(); await invoke("emit_global_event", { args: { event: "toggle-controls" } }); }}>{showWindowControls ? "Ocultar" : "Mostrar"} Window Controls</button>
            <button onClick={async () => { await appWindow.hide(); await invoke("emit_global_event", { args: { event: "toggle-nav-clock" } }); }}>{showClock ? "Ocultar" : "Mostrar"} Relógio</button>
            <button onClick={async () => { await appWindow.hide(); await invoke("emit_global_event", { args: { event: "toggle-autohide" } }); }}>{autoHideNav ? "Desativar" : "Ativar"} Auto-Hide NAV</button>
            <div className="divider" /><div className="menu-header">Telemetria</div>
            <div className="menu-grid">
              <button onClick={() => toggleItem("cpu")} className={telemetryVisibility.cpu ? "active" : ""}>CPU</button>
              <button onClick={() => toggleItem("ram")} className={telemetryVisibility.ram ? "active" : ""}>RAM</button>
              <button onClick={() => toggleItem("gpu")} className={telemetryVisibility.gpu ? "active" : ""}>GPU</button>
              <button onClick={() => toggleItem("vram")} className={telemetryVisibility.vram ? "active" : ""}>VRAM</button>
              <button onClick={() => toggleItem("net")} className={telemetryVisibility.net ? "active" : ""}>NET</button>
            </div>
            <div className="divider" /><div className="menu-header">Intervalo</div>
            <div className="menu-grid">
              <button onClick={async () => { await appWindow.hide(); await invoke("emit_global_event", { args: { event: "set-telemetry-interval", payload: { interval: 500 } } }); }}>500ms</button>
              <button onClick={async () => { await appWindow.hide(); await invoke("emit_global_event", { args: { event: "set-telemetry-interval", payload: { interval: 1000 } } }); }}>1s</button>
              <button onClick={async () => { await appWindow.hide(); await invoke("emit_global_event", { args: { event: "set-telemetry-interval", payload: { interval: 3000 } } }); }}>3s</button>
            </div>
            <div className="divider" /><button onClick={() => appWindow.close()} className={styles.exitButton}>✕ Sair do Sistema</button>
          </>
        );
      }

      if (activeMenu.type === "HANDLE") {
        return (
          <>
            <div className="menu-header">Posição</div>
            <div className="menu-grid"><button onClick={() => setSide(0)}>Topo</button><button onClick={() => setSide(1)}>Base</button><button onClick={() => setSide(2)}>Esq.</button><button onClick={() => setSide(3)}>Dir.</button></div>
            <div className="divider" /><button onClick={() => changeEffect("Mica")}>Mica</button><button onClick={() => changeEffect("Acrylic")}>Acrylic</button><button onClick={() => changeEffect("None")}>Sem Efeito</button>
          </>
        );
      }

      if (activeMenu.type === "LAYOUT") {
        return (
          <>
            <div className="menu-header">Painel</div>
            <button onClick={() => broadcastAction("split", activeMenu.targetId!, "horizontal")}>Dividir H</button>
            <button onClick={() => broadcastAction("split", activeMenu.targetId!, "vertical")}>Dividir V</button>
            <button onClick={() => broadcastAction("remove", activeMenu.targetId!)} className={styles.exitButton}>✕ Remover Divisão</button>
            <div className="divider" />
            <button onClick={() => setMenuPath([...menuPath, "add-module"])} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Adicionar Módulo</span>
              <span>›</span>
            </button>
            <button onClick={() => setMenuPath([...menuPath, "floating-module"])} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Modo Flutuante</span>
              <span>›</span>
            </button>
            <div className="divider" />
            <button onClick={() => broadcastAction("setModule", activeMenu.targetId!, null)}>Limpar Painel</button>
          </>
        );
      }
      return null;
    };

    const renderAddModuleMenu = (isFloating: boolean) => (
      <>
        <div className="menu-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setMenuPath(["root"])} style={{ padding: '0 4px', fontSize: '14px', width: 'auto' }}>‹</button>
          <span>{isFloating ? "FLUTUANTE" : "FIXO"}</span>
        </div>
        {Object.values(moduleRegistry).filter(m => m.id !== "NAV").map(m => (
          <button key={m.id} onClick={async () => {
            if (isFloating) {
              await appWindow.hide();
              openModule(m.id, true);
            } else {
              broadcastAction("setModule", activeMenu!.targetId!, m.id);
            }
          }}>
            {m.icon} {m.name}
          </button>
        ))}
      </>
    );

    return (
      <div ref={menuRef} className={`menu-box ${styles.menuBox}`}>
        {currentLevel === "root" && renderRootMenu()}
        {currentLevel === "add-module" && renderAddModuleMenu(false)}
        {currentLevel === "floating-module" && renderAddModuleMenu(true)}
      </div>
    );
  }

  const isVertical = navPosition === "left" || navPosition === "right";
  const isStart = navPosition === "top" || navPosition === "left";

  const renderNav = () => {
    if (appWindow.label !== "main") return null;
    
    let triggerClass = "";
    if (navPosition === "top") triggerClass = styles.navTriggerTop;
    else if (navPosition === "bottom") triggerClass = styles.navTriggerBottom;
    else if (navPosition === "left") triggerClass = styles.navTriggerLeft;
    else if (navPosition === "right") triggerClass = styles.navTriggerRight;

    return (
      <>
        <div 
          className={`nav-wrapper pos-${navPosition} ${(!autoHideNav || isNavVisible) ? 'visible' : ''} ${autoHideNav ? styles.posAbsolute : styles.posRelative}`} 
          onMouseEnter={() => setIsNavVisible(true)} 
          onMouseLeave={() => setIsNavVisible(false)}
        >
          <Nav />
        </div>
        {autoHideNav && !isNavVisible && (
          <div className={`nav-trigger ${triggerClass}`} onMouseEnter={() => setIsNavVisible(true)} />
        )}
      </>
    );
  };

  return (
    <div className="main-wrapper">
      <FloatingManager />
      <div className="layout-container" style={{ flexDirection: isVertical ? "row" : "column" }}>
        {isStart && renderNav()}
        <div className="engine-content"><LayoutEngine /></div>
        {!isStart && renderNav()}
      </div>
    </div>
  );
}

export default App;
