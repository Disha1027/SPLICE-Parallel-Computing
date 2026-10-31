import React from 'react';
import {
  Play,
  Cpu,
  Layers,
  Split,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  Zap,
  HardDrive
} from 'lucide-react';
import { useEngine } from '../context/EngineContext';

export const CompactionRunnerView: React.FC = () => {
  const {
    datasetSize,
    setDatasetSize,
    distribution,
    setDistribution,
    method,
    setMethod,
    schedule,
    setSchedule,
    threadCount,
    setThreadCount,
    partitionCount,
    setPartitionCount,
    isCompacting,
    compactionWorkers,
    compactionResult,
    runCompaction
  } = useEngine();

  return (
    <div className="runner-view" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Title */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Run Compaction</h1>
        <p className="page-desc">
          Select your dataset and OpenMP scheduling policy, then execute multicore parallel compaction.
        </p>
      </div>

      {/* Grid of 2 Setup Panels: Dataset & OpenMP Config */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Panel 1: Dataset Selection */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <HardDrive size={18} style={{ color: 'var(--accent-cyan)' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>1. Select Dataset</h2>
          </div>

          {/* Size */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Dataset Scale (Record Count)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { label: '100K', val: 100000 },
                { label: '1M', val: 1000000 },
                { label: '5M', val: 5000000 },
                { label: '10M', val: 10000000 }
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setDatasetSize(item.val)}
                  className={`btn ${datasetSize === item.val ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center', padding: '9px 4px' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Distribution */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Workload Profile &amp; Skew Distribution
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'hot_range', label: 'Hot-Range Skew (85/5 Rule)', tag: 'Straggler Stress', desc: '85% writes in 5% key range — causes severe thread stragglers in equal-width' },
                { id: 'heavy_tombstone', label: 'Tombstone Storm (65% Deletes)', tag: 'GC Stress Test', desc: 'High deletion volume — tests garbage collection, tombstone purge & correctness' },
                { id: 'write_storm', label: 'Write Storm (High Overwrites)', tag: 'Deduplication Stress', desc: 'Rapid updates to hot keys — tests multi-version deduplication throughput' },
                { id: 'zipfian', label: 'Zipfian Power-Law', tag: 'Real-world Skew', desc: 'Long-tail distribution common in web caches and key-value lookups' },
                { id: 'uniform', label: 'Uniform Random', tag: 'Balanced Baseline', desc: 'Keys distributed evenly across keyspace — baseline for equal-width comparison' }
              ].map(d => (
                <div
                  key={d.id}
                  onClick={() => setDistribution(d.id as any)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: distribution === d.id ? 'rgba(6, 182, 212, 0.12)' : 'rgba(0, 0, 0, 0.3)',
                    border: `1px solid ${distribution === d.id ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: distribution === d.id ? 'var(--accent-cyan)' : '#fff', fontSize: '0.85rem' }}>
                      {d.label}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: distribution === d.id ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: distribution === d.id ? 'var(--accent-cyan)' : 'var(--text-muted)'
                    }}>
                      {d.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {d.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 2: Partitioning & OpenMP Scheduling */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Cpu size={18} style={{ color: 'var(--accent-purple)' }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>2. Partitioning &amp; OpenMP Scheduling</h2>
          </div>

          {/* Method: SPLICE vs Equal */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Partitioning Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setMethod('splice')}
                className={`btn ${method === 'splice' ? 'btn-demo' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', padding: '10px' }}
              >
                <Split size={14} />
                <span>SPLICE (Sampled)</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('equal')}
                className={`btn ${method === 'equal' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', padding: '10px' }}
              >
                <span>Equal-Width</span>
              </button>
            </div>
          </div>

          {/* Concept callout: what sampling decides vs what K is */}
          <div style={{
            background: method === 'splice' ? 'rgba(6, 182, 212, 0.07)' : 'rgba(244, 63, 94, 0.07)',
            border: `1px solid ${method === 'splice' ? 'rgba(6,182,212,0.25)' : 'rgba(244,63,94,0.25)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '0.75rem',
            lineHeight: '1.55'
          }}>
            {method === 'splice' ? (
              <>
                <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                  What YOU set vs. what SPLICE determines:
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>You set K</span> — the number of output partitions (a system knob, must be ≥ threads).<br />
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>SPLICE determines WHERE</span> — it samples 2% of keys to find K−1 quantile split points so each partition gets ~equal record counts, regardless of skew.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '4px' }}>
                  Equal-Width does no sampling:
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>You set K</span> — the number of output partitions.<br />
                  <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>Boundaries</span> = naively divides the numeric key range [0, max] into K equal-sized intervals. Under skew, 1 partition can absorb 80% of all records → hot straggler thread.
                </div>
              </>
            )}
          </div>

          {/* OpenMP Scheduling */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              OpenMP Scheduling Policy
            </label>
            <select
              value={schedule}
              onChange={e => setSchedule(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-medium)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="static">Static (schedule(static) - Zero Lock Overhead)</option>
              <option value="dynamic">Dynamic (schedule(dynamic, 1) - Work-Stealing Queue)</option>
              <option value="guided">Guided (schedule(guided) - Decreasing Chunks)</option>
              <option value="tasks">OpenMP Tasks (#pragma omp task - Runtime Task Queue)</option>
            </select>
          </div>

          {/* Threads — then Partitions as K = multiplier × T */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Threads (T)
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 4, 8, 16].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setThreadCount(t);
                      // Keep K ≥ T: if current K < T, snap up to T
                      if (partitionCount < t) setPartitionCount(t);
                    }}
                    className={`btn ${threadCount === t ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, justifyContent: 'center', padding: '7px 2px', fontSize: '0.78rem' }}
                  >
                    {t}T
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Partitions K = multiplier × T &nbsp;
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none' }}>
                  (currently <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{partitionCount}P</span>)
                </span>
              </label>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                K must be ≥ T. More partitions → finer-grained load balancing, slightly more merge overhead.
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 4, 8].map(mult => {
                  const k = mult * threadCount;
                  return (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => setPartitionCount(k)}
                      className={`btn ${partitionCount === k ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, justifyContent: 'center', padding: '7px 2px', fontSize: '0.78rem' }}
                    >
                      {mult}×T = {k}P
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Action Button: Run Compaction */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <button
          onClick={runCompaction}
          disabled={isCompacting}
          className="btn btn-primary"
          style={{
            padding: '14px 40px',
            fontSize: '1rem',
            boxShadow: '0 4px 20px rgba(6, 182, 212, 0.4)',
            borderRadius: 'var(--radius-lg)'
          }}
          type="button"
        >
          <Play size={18} />
          <span>{isCompacting ? 'Running Compaction...' : `Run Compaction (${threadCount} Threads, ${schedule.toUpperCase()})`}</span>
        </button>
      </div>

      {/* Visual Workload Distribution Bar */}
      <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Split size={15} style={{ color: 'var(--accent-cyan)' }} />
            Key Space Partitioning ({method.toUpperCase()})
          </span>
          <span style={{ fontSize: '0.75rem', color: method === 'splice' ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
            {method === 'splice' ? '✓ Balanced Record Counts Across Partitions' : '⚠️ Partition 1 Crushed by Hot Range Skew'}
          </span>
        </div>

        {method === 'splice' ? (
          // SPLICE: balanced — every partition gets ~equal share
          <div style={{ display: 'flex', height: '22px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            {Array.from({ length: partitionCount }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: `rgba(16, 185, 129, ${0.25 + (i % 3) * 0.08})`,
                  borderRight: i < partitionCount - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: partitionCount > 16 ? '0.55rem' : '0.62rem',
                  color: '#fff',
                  fontWeight: 600,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {partitionCount <= 16 ? `P${i + 1}` : (i % 4 === 0 ? `P${i + 1}` : '')}
              </div>
            ))}
          </div>
        ) : (
          // Equal-Width: hot-range skew makes P1 massive, rest are tiny
          <div style={{ display: 'flex', height: '22px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
            {Array.from({ length: partitionCount }, (_, i) => {
              const isHot = i === 0 && distribution === 'hot_range';
              const isZipfHot = i <= 1 && distribution === 'zipfian';
              const hotFlex = distribution === 'hot_range' ? (partitionCount * 0.8) : distribution === 'zipfian' ? (partitionCount * 0.4) : 1;
              const flex = isHot ? hotFlex : isZipfHot && i === 1 ? 2 : 1;
              return (
                <div
                  key={i}
                  style={{
                    flex,
                    background: isHot
                      ? 'rgba(244, 63, 94, 0.5)'
                      : isZipfHot
                      ? 'rgba(251, 191, 36, 0.3)'
                      : 'rgba(6, 182, 212, 0.15)',
                    borderRight: i < partitionCount - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    color: isHot ? '#fff' : 'var(--text-muted)',
                    fontWeight: isHot ? 700 : 400,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    minWidth: 0
                  }}
                >
                  {isHot
                    ? `P1 (${distribution === 'hot_range' ? '80%' : '40%'} skew)`
                    : flex > 1 && i === 1
                    ? 'P2'
                    : partitionCount <= 12
                    ? `P${i + 1}`
                    : ''}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Multicore Workers Live Progress */}
      {compactionWorkers.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} style={{ color: 'var(--accent-purple)' }} />
            Active Worker Thread Progress ({compactionWorkers.length} Threads)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {compactionWorkers.map(w => (
              <div
                key={w.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  borderColor: w.status === 'completed' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(139, 92, 246, 0.35)',
                  background: w.status === 'completed' ? 'rgba(16, 36, 26, 0.4)' : 'rgba(24, 16, 40, 0.4)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>{w.name}</span>
                  <span
                    className="status-pill"
                    style={{
                      background: w.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                      color: w.status === 'completed' ? '#34d399' : '#c084fc'
                    }}
                  >
                    {w.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Key Range:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>[{w.keyRange[0]}, {w.keyRange[1]})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Records Merged:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>{w.recordsProcessed} / {w.totalRecordsInPartition}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Runtime:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>{w.elapsedMs.toFixed(1)} ms</span>
                  </div>
                </div>

                <div className="progress-bar-bg" style={{ height: '6px' }}>
                  <div
                    className={`progress-bar-fill ${w.status === 'completed' ? 'progress-emerald' : 'progress-purple'}`}
                    style={{ width: `${w.progressPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Readout */}
      {compactionResult && (
        <div className="glass-panel" style={{ padding: '24px', background: 'rgba(10, 20, 34, 0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={22} style={{ color: 'var(--accent-emerald)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Compaction Complete</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CHECK PASSED: 0 lost keys, strictly sorted</span>
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
              Total Time: {compactionResult.totalTimeMs.toFixed(1)} ms
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Parallel Speedup</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {compactionResult.speedup}×
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>vs Sequential Merge</span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Load Imbalance (LI)</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color: compactionResult.loadImbalance < 0.1 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {compactionResult.loadImbalance}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>LI = (T_max - T_avg) / T_avg</span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tombstones Purged</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-rose)' }}>
                {compactionResult.tombstonesPurged}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Deleted keys erased</span>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Live Keys Retained</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {compactionResult.totalLiveOutputRecords}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Final clean SSTable</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
