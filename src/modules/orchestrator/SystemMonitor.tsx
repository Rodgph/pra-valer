import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavStore } from "../nav/navStore";
import styles from "./SystemMonitor.module.css";

interface SystemStats {
  cpu_usage: number;
  gpu: { usage: number; vram_used: number; vram_total: number };
}

export const SystemMonitor: React.FC = () => {
  const [history, setHistory] = useState<{ cpu: number[]; gpu: number[]; vram: number[] }>({ cpu: [], gpu: [], vram: [] });
  const { telemetryInterval } = useNavStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await invoke<SystemStats>("get_system_stats");
        const vramPercent = (stats.gpu.vram_used / stats.gpu.vram_total) * 100;
        setHistory(prev => ({
          cpu: [...prev.cpu, stats.cpu_usage].slice(-60),
          gpu: [...prev.gpu, stats.gpu.usage].slice(-60),
          vram: [...prev.vram, vramPercent].slice(-60),
        }));
      } catch (e) {}
    };

    const interval = setInterval(fetchData, telemetryInterval);
    return () => clearInterval(interval);
  }, [telemetryInterval]);

  const renderGraph = (data: number[], accentClass: string, label: string) => {
    const points = data.map((val, i) => `${(i * 100) / 59},${100 - val}`).join(" ");
    const areaPoints = `0,100 ${points} 100,100`;

    return (
      <div className={styles.graphContainer}>
        <div className={styles.graphHeader}>
          <span>{label}</span>
          <span>{data[data.length - 1]?.toFixed(1)}%</span>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.svg}>
          {/* Grid Lines */}
          <line x1="0" y1="50" x2="100" y2="50" className={styles.gridLine} />
          <line x1="0" y1="25" x2="100" y2="25" className={styles.gridLine} />
          <line x1="0" y1="75" x2="100" y2="75" className={styles.gridLine} />
          
          <polygon points={areaPoints} className={`${styles.graphArea} ${accentClass}`} />
          <polyline points={points} className={`${styles.graphLine} ${accentClass}`} />
        </svg>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        SYSTEM_REALTIME_MONITOR
      </div>

      {renderGraph(history.cpu, styles.accentBlue, "CPU LOAD")}
      {renderGraph(history.gpu, styles.accentGreen, "GPU LOAD")}
      {renderGraph(history.vram, styles.accentGray, "VRAM USAGE")}

      <div className={styles.footer}>
        REFRESH_RATE: {telemetryInterval}MS // SAMPLES: 60
      </div>
    </div>
  );
};

export default SystemMonitor;
