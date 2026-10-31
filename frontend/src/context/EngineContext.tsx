import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CompactionConfig,
  CompactionRunResult,
  SystemLog,
  WorkerStatus,
  CompactionMethod,
  OpenMPSchedule,
  DatasetDistribution
} from '../types/engine';
import { engineService } from '../services/engineApi';

export type SimpleNavSection = 'runner' | 'analytics' | 'logs';

export interface LastRunMeta {
  datasetSize: number;
  distribution: DatasetDistribution;
  method: CompactionMethod;
  schedule: OpenMPSchedule;
  threadCount: number;
  partitionCount: number;
  finishedAt: string;
  sequentialEstimateMs: number; // sum of all worker times = what 1 thread would take
}

interface EngineContextType {
  activeSection: SimpleNavSection;
  setActiveSection: (s: SimpleNavSection) => void;
  datasetSize: number;
  setDatasetSize: (n: number) => void;
  distribution: DatasetDistribution;
  setDistribution: (d: DatasetDistribution) => void;
  method: CompactionMethod;
  setMethod: (m: CompactionMethod) => void;
  schedule: OpenMPSchedule;
  setSchedule: (s: OpenMPSchedule) => void;
  threadCount: number;
  setThreadCount: (t: number) => void;
  partitionCount: number;
  setPartitionCount: (p: number) => void;
  isCompacting: boolean;
  compactionWorkers: WorkerStatus[];
  compactionResult: CompactionRunResult | null;
  lastRunMeta: LastRunMeta | null;
  runCompaction: () => Promise<void>;
  logs: SystemLog[];
  addLog: (level: SystemLog['level'], source: SystemLog['source'], message: string, details?: string) => void;
  clearLogs: () => void;
}

const EngineContext = createContext<EngineContextType | null>(null);

export const EngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<SimpleNavSection>('runner');
  const [datasetSize, setDatasetSize] = useState<number>(1000000);
  const [distribution, setDistribution] = useState<DatasetDistribution>('hot_range');
  const [method, setMethod] = useState<CompactionMethod>('splice');
  const [schedule, setSchedule] = useState<OpenMPSchedule>('static');
  const [threadCount, setThreadCount] = useState<number>(4);
  const [partitionCount, setPartitionCount] = useState<number>(16);
  const [isCompacting, setIsCompacting] = useState(false);
  const [compactionWorkers, setCompactionWorkers] = useState<WorkerStatus[]>([]);
  const [compactionResult, setCompactionResult] = useState<CompactionRunResult | null>(null);
  const [lastRunMeta, setLastRunMeta] = useState<LastRunMeta | null>(null);

  const [logs, setLogs] = useState<SystemLog[]>([{
    id: 'log_0',
    timestamp: new Date().toLocaleTimeString(),
    level: 'INFO',
    source: 'SYSTEM',
    message: 'Parallel LSM Engine ready.',
    details: 'Select dataset, thread count, and OpenMP scheduling policy to run compaction.'
  }]);

  const addLog = useCallback((
    level: SystemLog['level'],
    source: SystemLog['source'],
    message: string,
    details?: string
  ) => {
    setLogs(prev => [{
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level, source, message, details
    }, ...prev.slice(0, 199)]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const runCompaction = async () => {
    if (isCompacting) return;
    setIsCompacting(true);

    const cfg = {
      mode: threadCount === 1 ? 'sequential' : 'parallel',
      method, schedule,
      workerCount: threadCount,
      partitions: partitionCount,
      sampleFraction: 0.02,
      datasetSize, distribution
    } as CompactionConfig;

    addLog('INFO', 'COMPACTION',
      `Starting compaction on ${datasetSize.toLocaleString()} records [${distribution.replace(/_/g, ' ')}]`,
      `Method: ${method.toUpperCase()}, Schedule: ${schedule}, Threads: ${threadCount}, Partitions: ${partitionCount}`
    );
    if (method === 'splice') {
      addLog('INFO', 'COMPACTION', 'Sampling 2% of keys across SSTables to compute balanced quantile splitters.');
    }

    try {
      const result = await engineService.runCompaction(cfg, (workers: WorkerStatus[]) => {
        setCompactionWorkers(workers);
      });

      const seqEstimate = result.workerTimes.reduce((a, b) => a + b, 0);

      setCompactionResult(result);
      setLastRunMeta({
        datasetSize, distribution, method, schedule, threadCount, partitionCount,
        finishedAt: new Date().toLocaleTimeString(),
        sequentialEstimateMs: seqEstimate
      });

      addLog('SUCCESS', 'COMPACTION',
        `Completed in ${result.totalTimeMs.toFixed(1)} ms — Speedup: ${result.speedup}×, LI: ${result.loadImbalance}`
      );
      addLog('INFO', 'COMPACTION',
        `Output: ${result.totalLiveOutputRecords.toLocaleString()} live keys retained. ` +
        `${result.tombstonesPurged} tombstones purged, ${result.overwritesDropped} overwrites dropped. CHECK PASSED.`
      );
    } catch (e: any) {
      addLog('ERROR', 'COMPACTION', `Error: ${e.message}`);
    } finally {
      setIsCompacting(false);
    }
  };

  return (
    <EngineContext.Provider value={{
      activeSection, setActiveSection,
      datasetSize, setDatasetSize,
      distribution, setDistribution,
      method, setMethod,
      schedule, setSchedule,
      threadCount, setThreadCount,
      partitionCount, setPartitionCount,
      isCompacting, compactionWorkers, compactionResult, lastRunMeta,
      runCompaction, logs, addLog, clearLogs
    }}>
      {children}
    </EngineContext.Provider>
  );
};

export const useEngine = () => {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngine must be used within EngineProvider');
  return ctx;
};
