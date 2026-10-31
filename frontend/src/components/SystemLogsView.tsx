import React, { useState } from 'react';
import {
  Terminal,
  Trash2,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock
} from 'lucide-react';
import { useEngine } from '../context/EngineContext';
import { SystemLog } from '../types/engine';

export const SystemLogsView: React.FC = () => {
  const { logs, clearLogs } = useEngine();
  const [levelFilter, setLevelFilter] = useState<'ALL' | SystemLog['level']>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(l => {
    if (levelFilter !== 'ALL' && l.level !== levelFilter) return false;
    if (searchTerm) {
      const match =
        l.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.details && l.details.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!match) return false;
    }
    return true;
  });

  const exportLogsAsText = () => {
    const text = logs
      .map(l => `[${l.timestamp}] [${l.level}] [${l.source}] ${l.message} ${l.details ? `(${l.details})` : ''}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parallel-lsm-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: SystemLog['level']) => {
    switch (level) {
      case 'INFO':
        return '#38bdf8';
      case 'SUCCESS':
        return '#34d399';
      case 'WARN':
        return '#fbbf24';
      case 'ERROR':
        return '#f43f5e';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div className="logs-view" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Live System Logs</h1>
          <p className="page-desc">
            Standard output event stream recording dataset generation, sampling, worker merges, and correctness verification.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportLogsAsText} className="btn btn-secondary" type="button">
            <Download size={14} />
            <span>Export Text</span>
          </button>
          <button onClick={clearLogs} className="btn btn-secondary" type="button">
            <Trash2 size={14} />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filter:</span>
          {(['ALL', 'INFO', 'SUCCESS', 'WARN', 'ERROR'] as const).map(lvl => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: levelFilter === lvl ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${levelFilter === lvl ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                color: levelFilter === lvl ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: levelFilter === lvl ? 600 : 400
              }}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search log messages..."
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.8rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Terminal View */}
      <div
        className="glass-panel"
        style={{
          background: '#070a10',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.82rem',
          height: '640px',
          overflowY: 'auto',
          boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e', display: 'inline-block' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span style={{ marginLeft: '10px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            SPLICE Engine Telemetry Stream (Live Event Log)
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
            No logs found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredLogs.map(l => (
              <div
                key={l.id}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '10px',
                  lineHeight: '1.6',
                  wordBreak: 'break-all'
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                  [{l.timestamp}]
                </span>
                <span
                  style={{
                    color: getLevelColor(l.level),
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    width: '64px'
                  }}
                >
                  [{l.level}]
                </span>
                <span
                  style={{
                    color: 'var(--accent-purple)',
                    fontSize: '0.75rem',
                    flexShrink: 0,
                    width: '88px'
                  }}
                >
                  [{l.source}]
                </span>
                <span style={{ color: '#e2e8f0', flex: 1 }}>
                  {l.message}
                  {l.details && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.78rem' }}>
                      ({l.details})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
