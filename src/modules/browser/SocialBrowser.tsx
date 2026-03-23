import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, getAllWindows } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { useBrowserStore } from "./browserStore";
import { useUserStylesStore } from "./userStylesStore";
import { useOrchestrator } from "../orchestrator/store";
import stylesModule from "./SocialBrowser.module.css";

interface Props {
  paneId?: string;
  instanceId?: string;
  isFloating?: boolean;
}

const SocialBrowser: React.FC<Props> = ({ paneId, instanceId, isFloating }) => {
  const { urls, setPaneUrl } = useBrowserStore();
  const { styles: savedStyles, enabled: stylesEnabled } = useUserStylesStore();
  
  // Identificador único para o backend (Tauri labels)
  const id = paneId || instanceId || "default";
  
  const currentUrl = urls[id] || "https://www.google.com";
  const [inputValue, setInputValue] = useState(currentUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isBrowserMounted, setIsBrowserMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const appWindow = getCurrentWindow();

  // Função central para aplicar o CSS salvo
  const applyAutoStyles = (url: string) => {
    try {
      if (!url || !url.startsWith("http")) return;
      const domain = new URL(url).hostname;
      const isEnabled = stylesEnabled[domain] ?? true;
      const css = isEnabled ? savedStyles[domain] : "";
      
      if (css || !isEnabled) {
        invoke("apply_browser_css", { paneId: id, css: css || "" });
      }
    } catch (e) {
      console.error("Erro ao aplicar estilos automáticos:", e);
    }
  };

  // ATUALIZA O INPUT E APLICA ESTILOS QUANDO A URL MUDA
  useEffect(() => {
    setInputValue(currentUrl);
    if (isBrowserMounted) {
      applyAutoStyles(currentUrl);
    }
  }, [currentUrl, isBrowserMounted]);

  const syncBounds = async (isInitial = false) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const factor = await appWindow.scaleFactor();

    const x = Math.round(rect.left * factor);
    const y = Math.round(rect.top * factor);
    const width = Math.round(rect.width * factor);
    const height = Math.round(rect.height * factor);

    if (isInitial) {
      await invoke("mount_browser_child", { paneId: id, url: currentUrl, x, y, width, height });
      setIsBrowserMounted(true);
      // Aplica o CSS imediatamente após a montagem inicial
      applyAutoStyles(currentUrl);
    } else {
      await invoke("update_browser_bounds", { paneId: id, x, y, width, height });
    }
  };

  useEffect(() => {
    let loadingTimeout: number;

    const unlistenStart = listen(`browser-loading-start-${id}`, () => {
      setIsLoading(true);
      clearTimeout(loadingTimeout);
      loadingTimeout = window.setTimeout(() => setIsLoading(false), 10000);
    });

    const unlistenEnd = listen(`browser-loading-end-${id}`, () => {
      setIsLoading(false);
      clearTimeout(loadingTimeout);
      // Reaplica os estilos automáticos após o carregamento completo (essencial para o reload)
      applyAutoStyles(currentUrl);
    });

    const unlistenUrl = listen<{ url: string }>(`browser-url-changed-${id}`, (event) => {
      const newUrl = event.payload.url;
      // Sincroniza a URL globalmente para que outras janelas (como o CSS Injector) percebam
      if (newUrl !== urls[id]) {
        setPaneUrl(id, newUrl);
      }
    });

    return () => {
      unlistenStart.then(f => f());
      unlistenEnd.then(f => f());
      unlistenUrl.then(f => f());
      clearTimeout(loadingTimeout);
    };
  }, [id, urls]);

  useEffect(() => {
    const timer = setTimeout(() => syncBounds(true), 100);
    const observer = new ResizeObserver(() => syncBounds(false));
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      setIsBrowserMounted(false);
      invoke("hide_browser_child", { paneId: id });
    };
  }, [id]);

  const handleGo = async (overrideUrl?: string) => {
    let target = (overrideUrl || inputValue).trim();
    if (!target) return;
    
    // Tratamento inteligente de URL
    const isUrl = target.includes(".") && !target.includes(" ");
    if (isUrl && !target.startsWith("http")) target = "https://" + target;
    else if (!isUrl) target = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
    
    // 1. Atualiza a Store Local
    setPaneUrl(id, target);
    
    // 2. Comanda o Backend para navegar ou montar
    await invoke("mount_browser_child", { 
      paneId: id, 
      url: target, 
      x: 0, y: 0, 
      width: 0, height: 0 
    });
    
    // 3. Força atualização imediata de bounds se já estiver montado
    if (isBrowserMounted) {
      syncBounds(false);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (instanceId) {
      setDraggingInstance(instanceId);
      e.dataTransfer.setData("instanceId", instanceId);
      e.dataTransfer.effectAllowed = "move";
    }
  };

  return (
    <div className={stylesModule.container}>
      <div className={stylesModule.toolbar}>
        <button 
          className={stylesModule.navButton} 
          onClick={() => { setInputValue("https://www.google.com"); handleGo("https://www.google.com"); }}
          title="Home"
        >🏠</button>
        <button 
          className={stylesModule.navButton} 
          onClick={() => invoke("browser_go_back", { paneId: id })}
          title="Voltar"
        >←</button>
        <button 
          className={stylesModule.navButton} 
          onClick={() => invoke("browser_reload", { paneId: id })}
          title="Recarregar"
        >↻</button>
        <button 
          className={stylesModule.navButton} 
          onClick={() => invoke("browser_go_forward", { paneId: id })}
          title="Avançar"
        >→</button>
        
        <div className={stylesModule.inputWrapper}>
          <input 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleGo()} 
            placeholder="SEARCH_OR_TYPE_URL..." 
            className={stylesModule.input}
          />
          <div className={stylesModule.inputActions}>
            <button className={stylesModule.actionButton} title="Favoritar">⭐</button>
          </div>
        </div>
        
        <button className={stylesModule.navButton} title="Downloads">📥</button>
        <button className={stylesModule.navButton} title="Configurações">⚙️</button>
        <button 
          onClick={() => invoke("toggle_css_injector", { paneId: id })} 
          className={stylesModule.cssButton} 
          title="Interpretador CSS"
        >
          { "{ CSS }" }
        </button>
        <button onClick={handleGo} className={stylesModule.goButton}>GO</button>
      </div>
      <div ref={containerRef} className={stylesModule.browserContainer} />
    </div>
  );
};

export default SocialBrowser;
