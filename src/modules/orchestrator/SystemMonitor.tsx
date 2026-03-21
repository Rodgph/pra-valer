import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavStore } from "../nav/navStore";

interface SystemStats {
  cpu_usage: number;
  gpu: { usage: number };
}

export const SystemMonitor: React.FC = () => {
  const [history, setHistory] = useState<{ cpu: number[]; gpu: number[] }>({ cpu: [], gpu: [] });
  const { telemetryInterval } = useNavStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await invoke<SystemStats>("get_system_stats");
        setHistory(prev => ({
          cpu: [...prev.cpu, stats.cpu_usage].slice(-50),
          gpu: [...prev.gpu, stats.gpu.usage].slice(-50),
        }));
      } catch (e) {}
    };

    const interval = setInterval(fetchData, telemetryInterval);
    return () => clearInterval(interval);
  }, [telemetryInterval]);

  const renderGraph = (data: number[], color: string) => {
    const points = data.map((val, i) => `${(i * 100) / 49},${100 - val}`).join(" ");
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '80px', background: 'rgba(255,255,255,0.02)' }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  };

  return (
    <div style={{
      height: '100%',
      width: '100%',
      padding: '15px',
      background: 'rgba(10, 10, 10, 0.7)',
      fontFamily: 'monospace',
      color: '#fff',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '5px', opacity: 0.6 }}>
          <span>CPU USAGE %</span>
          <span>{history.cpu[history.cpu.length - 1]?.toFixed(1)}%</span>
        </div>
        {renderGraph(history.cpu, "#0078d4")}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '5px', opacity: 0.6 }}>
          <span>GPU LOAD %</span>
          <span>{history.gpu[history.gpu.length - 1]?.toFixed(1)}%</span>
        </div>
        {renderGraph(history.gpu, "#00FF66")}
      </div>

      <div style={{ marginTop: 'auto', fontSize: '8px', opacity: 0.2, letterSpacing: '1px' }}>
        KERNEL_VERSION: 2.0.0-STABLE // REFRESH: {telemetryInterval}MS
      </div>
    </div>
  );
};

export default SystemMonitor;
