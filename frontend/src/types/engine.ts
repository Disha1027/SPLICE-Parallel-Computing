export type Operation = 'Put' | 'Delete';

export interface RecordItem {
  key: number;
  keyStr: string;
  value: string; // hex or string representation
  version: number;
  operation: Operation;
  timestamp: string;
}

export interface BloomFilter {
  bitCount: number;
  hashCount: number;
  bits: boolean[];
}

export interface SSTableMeta {
  id: string;
  level: number;
  recordCount: number;
  sizeBytes: number;
  minKey: number;
  maxKey: number;
  tombstoneCount: number;
  createdAt: string;
  records: RecordItem[];
  bloomFilter?: BloomFilter;
  hasOverlaps?: boolean;
}

export interface WorkerStatus {
  id: number;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'paused';
  partitionIndex: number;
  keyRange: [number, number]; // [lower, upper)
  currentKey?: number;
  recordsProcessed: number;
  totalRecordsInPartition: number;
  progressPercent: number;
  elapsedMs: number;
  tombstonesPurged: number;
  overwritesDropped: number;
}

export type CompactionMethod = 'splice' | 'equal';
export type OpenMPSchedule = 'static' | 'dynamic' | 'guided' | 'tasks';
export type DatasetDistribution = 'hot_range' | 'zipfian' | 'heavy_tombstone' | 'write_storm' | 'uniform';

export interface CompactionConfig {
  mode: 'sequential' | 'parallel';
  method: CompactionMethod;
  schedule: OpenMPSchedule;
  workerCount: number;
  partitions: number;
  sampleFraction: number; // e.g. 0.02
}

export interface CompactionRunResult {
  method: CompactionMethod;
  mode: 'sequential' | 'parallel';
  schedule: OpenMPSchedule;
  workerCount: number;
  partitions: number;
  inputSSTableIds: string[];
  outputSSTableIds: string[];
  totalInputRecords: number;
  totalLiveOutputRecords: number;
  tombstonesPurged: number;
  overwritesDropped: number;
  samplingTimeMs: number;
  mergeTimeMs: number;
  totalTimeMs: number;
  speedup: number;
  loadImbalance: number; // LI = (T_max - T_avg) / T_avg
  workerTimes: number[];
}

export interface ReadLookupStep {
  stepIndex: number;
  component: 'memtable' | 'immutable_memtable' | 'bloom_filter' | 'sstable_index' | 'sstable_record';
  targetId: string;
  description: string;
  status: 'hit' | 'miss' | 'probing';
  latencyMicros: number;
}

export interface ReadLookupResult {
  queryKey: number;
  queryKeyStr: string;
  found: boolean;
  record?: RecordItem;
  steps: ReadLookupStep[];
  totalHops: number;
  totalLatencyMicros: number;
  accessedStructures: string[];
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'DEBUG' | 'SUCCESS' | 'ERROR';
  source: 'MEMTABLE' | 'FLUSH' | 'COMPACTION' | 'READ' | 'BENCHMARK' | 'SYSTEM';
  message: string;
  details?: string;
}

export interface EngineMetrics {
  totalKeys: number;
  liveKeys: number;
  tombstoneCount: number;
  memtableSize: number;
  memtableCapacity: number;
  memtableUtilization: number; // 0 to 100%
  immutableMemtableSize: number;
  sstableCount: number;
  l0Count: number;
  l1Count: number;
  l2Count: number;
  totalBytesWritten: number;
  compactionThroughputOps: number;
  activeWorkers: number;
  recentSpeedup: number;
  recentLoadImbalance: number;
}

export interface BenchmarkDataPoint {
  records: number;
  recordsLabel: string;
  distribution: 'uniform' | 'zipfian' | 'hot_range' | 'heavy_tombstone' | 'write_storm' | 'adversarial';
  threads: number;
  partitions: number;
  method: 'sequential' | 'equal' | 'splice';
  medianMs: number;
  speedupVsSeq: number;
  loadImbalance?: number;
}
