import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavStore } from "../nav/navStore";

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

  const renderGraph = (data: number[], color: string, label: string) => {
    const points = data.map((val, i) => `${(i * 100) / 59},${100 - val}`).join(" ");
    const areaPoints = `0,100 ${points} 100,100`;

    return (
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '4px', opacity: 0.5, letterSpacing: '1px' }}>
          <span>{label}</span>
          <span>{data[data.length - 1]?.toFixed(1)}%</span>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '60px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
          {/* Grid Lines */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          
          <polygon points={areaPoints} fill={color} fillOpacity="0.1" />
          <polyline points={points} fill="none" stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    );
  };

  return (
    <div style={{
      height: '100%',
      width: '100%',
      padding: '15px',
      background: 'rgba(5, 5, 5, 0.8)',
      fontFamily: 'monospace',
      color: '#fff',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '20px', color: '#0078d4', borderLeft: '3px solid #0078d4', paddingLeft: '10px' }}>
        SYSTEM_REALTIME_MONITOR
      </div>

      {renderGraph(history.cpu, "#0078d4", "CPU LOAD")}
      {renderGraph(history.gpu, "#00FF66", "GPU LOAD")}
      {renderGraph(history.vram, "#888888", "VRAM USAGE")}

      <div style={{ marginTop: 'auto', fontSize: '8px', opacity: 0.2, textAlign: 'right' }}>
        REFRESH_RATE: {telemetryInterval}MS // SAMPLES: 60
      </div>
    </div>
  );
};

export default SystemMonitor;
