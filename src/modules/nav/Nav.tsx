import React, { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useNavStore, TelemetryItem } from "./navStore";
import WindowControls from "./WindowControls";
import styles from "./Nav.module.css";

const appWindow = getCurrentWindow();

interface SystemStats {
  cpu_usage: number;
  ram_usage: number;
  net_usage: number;
  gpu: {
    name: string;
    usage: number;
    vram_used: number;
    vram_total: number;
  };
}

const Nav: React.FC = () => {
  const { 
    showWindowControls, 
    showClock,
    telemetryVisibility, 
    telemetryInterval,
    position,
    toggleWindowControls, 
    toggleClock,
    toggleTelemetryItem,
    setTelemetryInterval
  } = useNavStore();
  
  const [stats, setStats] = useState<SystemStats>({ 
    cpu_usage: 0, 
    ram_usage: 0, 
    net_usage: 0,
    gpu: { name: "", usage: 0, vram_used: 0, vram_total: 0 }
  });

  const [time, setTime] = useState(new Date());

  const isVertical = position === "left" || position === "right";

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const newStats = await invoke<SystemStats>("get_system_stats");
        setStats(newStats);
      } catch (err) {
        console.error("Falha ao buscar stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, telemetryInterval);

    const unlistenClock = listen("toggle-nav-clock", () => {
      toggleClock();
    });

    const unlistenTelemetryItem = listen<{ item: TelemetryItem }>("toggle-telemetry-item", (event) => {
      toggleTelemetryItem(event.payload.item);
    });
    const unlistenInterval = listen<{ interval: number }>("set-telemetry-interval", (event) => {
      setTelemetryInterval(event.payload.interval);
    });

    return () => {
      clearInterval(interval);
      unlistenClock.then((f) => f());
      unlistenTelemetryItem.then((f) => f());
      unlistenInterval.then((f) => f());
    };
  }, [toggleWindowControls, toggleClock, toggleTelemetryItem, telemetryInterval, setTelemetryInterval]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains(styles.navBar) || 
        (e.target as HTMLElement).classList.contains(styles.sectionCenter)) {
      appWindow.startDragging();
    }
  };

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    await invoke("trigger_context_menu", { args: { menuType: "NAV" } });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  return (
    <nav 
      className={`${styles.navBar} ${isVertical ? styles.vertical : styles.horizontal}`} 
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.sectionCenter}>
        {showClock && (
          <div className={styles.navClock}>
            <span className={styles.navClockLabel}>SYS_TIME</span>
            <span className={styles.navClockValue}>{formatTime(time)}</span>
          </div>
        )}
      </div>

      <div className={styles.sectionRight}>
        <div className={styles.statusGroup}>
          {telemetryVisibility.cpu && (
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>CPU</span>
              <span className={styles.statusValue}>{stats.cpu_usage.toFixed(0)}%</span>
            </div>
          )}
          {telemetryVisibility.ram && (
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>RAM</span>
              <span className={styles.statusValue}>{stats.ram_usage.toFixed(0)}%</span>
            </div>
          )}
          {telemetryVisibility.gpu && (
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>GPU</span>
              <span className={styles.statusValue}>{stats.gpu.usage.toFixed(0)}%</span>
            </div>
          )}
          {telemetryVisibility.vram && (
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>VRAM</span>
              <span className={styles.statusValue}>{stats.gpu.vram_used.toFixed(1)}G</span>
            </div>
          )}
          {telemetryVisibility.net && (
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>NET</span>
              <span className={styles.statusValue}>{stats.net_usage.toFixed(0)}K</span>
            </div>
          )}
        </div>
        {showWindowControls && <WindowControls isVertical={isVertical} />}
      </div>
    </nav>
  );
};

export default Nav;
