import React from 'react';
import {
  Cpu,
  HardDrive,
  Split
} from 'lucide-react';
import { useEngine } from '../context/EngineContext';

export const Header: React.FC = () => {
  const {
    datasetSize,
    distribution,
    threadCount,
    schedule,
    method
  } = useEngine();

  const getFormatSize = (n: number) => {
    if (n >= 1000000) return `${n / 1000000}M`;
    if (n >= 1000) return `${n / 1000}K`;
    return `${n}`;
  };

  return (
    <header className="top-header">
      <div className="header-telemetry">
        <div className="telemetry-item">
          <HardDrive size={15} style={{ color: 'var(--accent-cyan)' }} />
          <span>Dataset:</span>
          <span className="telemetry-val">
            {getFormatSize(datasetSize)} ({distribution.replace('_', ' ')})
          </span>
        </div>

        <div className="telemetry-item">
          <Split size={15} style={{ color: 'var(--accent-purple)' }} />
          <span>Method:</span>
          <span className="telemetry-val">
            {method.toUpperCase()}
          </span>
        </div>

        <div className="telemetry-item">
          <Cpu size={15} style={{ color: 'var(--accent-emerald)' }} />
          <span>OpenMP:</span>
          <span className="telemetry-val">
            {threadCount} Threads ({schedule})
          </span>
        </div>
      </div>

      <div className="header-actions">
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Parallel LSM Engine · Demo Mode
        </span>
      </div>
    </header>
  );
};
