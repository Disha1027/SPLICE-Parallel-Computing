import React from 'react';
import {
  Play,
  BarChart2,
  Terminal,
  Zap,
  Cpu
} from 'lucide-react';
import { useEngine, SimpleNavSection } from '../context/EngineContext';

interface NavItemConfig {
  id: SimpleNavSection;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeType?: 'core' | 'real';
}

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection, threadCount, schedule } = useEngine();

  const navItems: NavItemConfig[] = [
    {
      id: 'runner',
      label: 'Run Compaction',
      icon: <Play size={18} />,
      badge: 'Execute',
      badgeType: 'core'
    },
    {
      id: 'analytics',
      label: 'Performance Analysis',
      icon: <BarChart2 size={18} />
    },
    {
      id: 'logs',
      label: 'System Logs',
      icon: <Terminal size={18} />
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-title">
          <div className="brand-icon-box">
            <Zap size={18} />
          </div>
          <span>Parallel LSM</span>
        </div>
        <p className="brand-subtitle">Visualizing the Power of Parallel Storage.</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            type="button"
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && (
              <span className={`nav-badge ${item.badgeType === 'core' ? 'badge-core' : item.badgeType === 'real' ? 'badge-real' : 'status-pill'}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="engine-status-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulse-dot" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Storage Engine</span>
          </div>
          <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            ONLINE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>Current Target</span>
          <span className="font-mono">{threadCount}T ({schedule})</span>
        </div>
      </div>
    </aside>
  );
};
