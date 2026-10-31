import {
  RecordItem,
  SSTableMeta,
  EngineMetrics,
  CompactionConfig,
  CompactionRunResult,
  ReadLookupResult,
  SystemLog,
  BenchmarkDataPoint,
  WorkerStatus,
  DatasetDistribution
} from '../types/engine';

// Real Phase 7 experimental benchmark dataset directly from SPLICE's phase7_summary.csv
export const REAL_PHASE7_BENCHMARKS: BenchmarkDataPoint[] = [
  // 10M records main size comparison (4 threads, 16 partitions)
  { records: 10000000, recordsLabel: '10M', distribution: 'uniform', threads: 4, partitions: 16, method: 'sequential', medianMs: 44860.8, speedupVsSeq: 1.0, loadImbalance: 0.0 },
  { records: 10000000, recordsLabel: '10M', distribution: 'uniform', threads: 4, partitions: 16, method: 'equal', medianMs: 17560.9, speedupVsSeq: 2.555, loadImbalance: 0.04 },
  { records: 10000000, recordsLabel: '10M', distribution: 'uniform', threads: 4, partitions: 16, method: 'splice', medianMs: 18300.1, speedupVsSeq: 2.451, loadImbalance: 0.02 },

  { records: 10000000, recordsLabel: '10M', distribution: 'zipfian', threads: 4, partitions: 16, method: 'sequential', medianMs: 35372.7, speedupVsSeq: 1.0, loadImbalance: 0.0 },
  { records: 10000000, recordsLabel: '10M', distribution: 'zipfian', threads: 4, partitions: 16, method: 'equal', medianMs: 27085.1, speedupVsSeq: 1.306, loadImbalance: 0.42 },
  { records: 10000000, recordsLabel: '10M', distribution: 'zipfian', threads: 4, partitions: 16, method: 'splice', medianMs: 17675.3, speedupVsSeq: 2.001, loadImbalance: 0.024 },

  { records: 10000000, recordsLabel: '10M', distribution: 'hot_range', threads: 4, partitions: 16, method: 'sequential', medianMs: 33999.7, speedupVsSeq: 1.0, loadImbalance: 0.0 },
  { records: 10000000, recordsLabel: '10M', distribution: 'hot_range', threads: 4, partitions: 16, method: 'equal', medianMs: 29690.6, speedupVsSeq: 1.145, loadImbalance: 1.354 },
  { records: 10000000, recordsLabel: '10M', distribution: 'hot_range', threads: 4, partitions: 16, method: 'splice', medianMs: 16560.6, speedupVsSeq: 2.053, loadImbalance: 0.026 },

  // 5M records
  { records: 5000000, recordsLabel: '5M', distribution: 'uniform', threads: 4, partitions: 16, method: 'sequential', medianMs: 11170.1, speedupVsSeq: 1.0, loadImbalance: 0.0 },
  { records: 5000000, recordsLabel: '5M', distribution: 'uniform', threads: 4, partitions: 16, method: 'equal', medianMs: 7520.3, speedupVsSeq: 1.485, loadImbalance: 0.05 },
  { records: 5000000, recordsLabel: '5M', distribution: 'uniform', threads: 4, partitions: 16, method: 'splice', medianMs: 7721.0, speedupVsSeq: 1.447, loadImbalance: 0.03 },

  { records: 5000000, recordsLabel: '5M', distribution: 'zipfian', threads: 4, partitions: 16, method: 'sequential', medianMs: 11060.7, speedupVsSeq: 1.0, loadImbalance: 0.0 },
  { records: 5000000, recordsLabel: '5M', distribution: 'zipfian', threads: 4, partitions: 16, method: 'equal', medianMs: 9188.6, speedupVsSeq: 1.204, loadImbalance: 0.38 },
  { records: 5000000, recordsLabel: '5M', distribution: 'zipfian', threads: 4, partitions: 16, method: 'splice', medianMs: 7669.8, speedupVsSeq: 1.442, loadImbalance: 0.028 },

  { records: 5000000, recordsLabel: '5M', distribution: 'hot_range', threads: 4, partitions: 16, method: 'sequential', medianMs: 10786.6, speedupVsSeq: 1.0, loadImbalance: 0.0 },
  { records: 5000000, recordsLabel: '5M', distribution: 'hot_range', threads: 4, partitions: 16, method: 'equal', medianMs: 9613.1, speedupVsSeq: 1.122, loadImbalance: 1.28 },
  { records: 5000000, recordsLabel: '5M', distribution: 'hot_range', threads: 4, partitions: 16, method: 'splice', medianMs: 7409.9, speedupVsSeq: 1.456, loadImbalance: 0.031 },

  // 1M records
  { records: 1000000, recordsLabel: '1M', distribution: 'uniform', threads: 4, partitions: 16, method: 'sequential', medianMs: 2422.6, speedupVsSeq: 1.0, loadImbalance: 0.0 },
  { records: 1000000, recordsLabel: '1M', distribution: 'uniform', threads: 4, partitions: 16, method: 'equal', medianMs: 1729.3, speedupVsSeq: 1.401, loadImbalance: 0.06 },
  { records: 1000000, recordsLabel: '1M', distribution: 'uniform', threads: 4, partitions: 16, method: 'splice', medianMs: 1732.3, speedupVsSeq: 1.398, loadImbalance: 0.035 },

  { records: 1000000, recordsLabel: '1M', distribution: 'hot_range', threads: 4, partitions: 16, method: 'sequential', medianMs: 2446.1, speedupVsSeq: 1.0, loadImbalance: 0.0 },
  { records: 1000000, recordsLabel: '1M', distribution: 'hot_range', threads: 4, partitions: 16, method: 'equal', medianMs: 2176.1, speedupVsSeq: 1.124, loadImbalance: 1.15 },
  { records: 1000000, recordsLabel: '1M', distribution: 'hot_range', threads: 4, partitions: 16, method: 'splice', medianMs: 1700.0, speedupVsSeq: 1.439, loadImbalance: 0.022 },

  // Thread sweep (1M hot range, 16 partitions)
  { records: 1000000, recordsLabel: '1M-Threads', distribution: 'hot_range', threads: 1, partitions: 16, method: 'equal', medianMs: 3666.3, speedupVsSeq: 0.667 },
  { records: 1000000, recordsLabel: '1M-Threads', distribution: 'hot_range', threads: 1, partitions: 16, method: 'splice', medianMs: 3800.8, speedupVsSeq: 0.644 },
  { records: 1000000, recordsLabel: '1M-Threads', distribution: 'hot_range', threads: 2, partitions: 16, method: 'equal', medianMs: 3368.6, speedupVsSeq: 0.726 },
  { records: 1000000, recordsLabel: '1M-Threads', distribution: 'hot_range', threads: 2, partitions: 16, method: 'splice', medianMs: 2519.1, speedupVsSeq: 0.971 },
  { records: 1000000, recordsLabel: '1M-Threads', distribution: 'hot_range', threads: 4, partitions: 16, method: 'equal', medianMs: 2176.1, speedupVsSeq: 1.124 },
  { records: 1000000, recordsLabel: '1M-Threads', distribution: 'hot_range', threads: 4, partitions: 16, method: 'splice', medianMs: 1700.0, speedupVsSeq: 1.439 },
  { records: 1000000, recordsLabel: '1M-Threads', distribution: 'hot_range', threads: 8, partitions: 16, method: 'equal', medianMs: 4938.2, speedupVsSeq: 0.495 },
  { records: 1000000, recordsLabel: '1M-Threads', distribution: 'hot_range', threads: 8, partitions: 16, method: 'splice', medianMs: 2171.1, speedupVsSeq: 1.127 },
  { records: 1000000, recordsLabel: '1M-Threads', distribution: 'hot_range', threads: 16, partitions: 16, method: 'equal', medianMs: 3245.2, speedupVsSeq: 0.754 },
  { records: 1000000, recordsLabel: '1M-Threads', distribution: 'hot_range', threads: 16, partitions: 16, method: 'splice', medianMs: 1891.6, speedupVsSeq: 1.293 },
];

export interface IEngineService {
  isBackendConnected(): boolean;
  insertRecord(key: number, value: string, op?: 'Put' | 'Delete'): Promise<{ flushed: boolean; record: RecordItem }>;
  insertBatch(count: number, distribution: 'uniform' | 'zipfian' | 'hot_range'): Promise<{ count: number; flushes: number }>;
  flushMemtable(): Promise<SSTableMeta>;
  runCompaction(config: CompactionConfig, onProgress?: (workers: WorkerStatus[]) => void): Promise<CompactionRunResult>;
  lookupKey(key: number): Promise<ReadLookupResult>;
  getMetrics(): EngineMetrics;
}

// Generate realistic pseudo-random bytes for SSTables
function generateHexValue(): string {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 32; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

// Simple deterministic hash for bloom filter simulation
function simpleHash(key: number, seed: number): number {
  let h = key ^ seed;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

export function createBloomFilter(keys: number[], bitCount = 64, hashCount = 3): { bitCount: number; hashCount: number; bits: boolean[] } {
  const bits = new Array(bitCount).fill(false);
  for (const k of keys) {
    for (let s = 1; s <= hashCount; s++) {
      const idx = simpleHash(k, s * 31) % bitCount;
      bits[idx] = true;
    }
  }
  return { bitCount, hashCount, bits };
}

export function testBloomFilter(filter: { bitCount: number; hashCount: number; bits: boolean[] }, key: number): boolean {
  for (let s = 1; s <= filter.hashCount; s++) {
    const idx = simpleHash(key, s * 31) % filter.bitCount;
    if (!filter.bits[idx]) return false;
  }
  return true;
}

export class MockEngineService implements IEngineService {
  private memtable: Map<number, RecordItem> = new Map();
  private immutableMemtable: RecordItem[] | null = null;
  private l0Tables: SSTableMeta[] = [];
  private l1Tables: SSTableMeta[] = [];
  private l2Tables: SSTableMeta[] = [];
  private nextVersion = 1;
  private sstableCounter = 1;
  private memtableThreshold = 12; // Flush after 12 items

  constructor() {
    this.seedInitialState();
  }

  isBackendConnected(): boolean {
    return false; // In DEMO MODE
  }

  private seedInitialState() {
    // Seed Level 0 (overlapping SSTables)
    const l0Records1: RecordItem[] = [
      { key: 105, keyStr: 'key_105', value: '4a8f9c2d1b0e3f5a', version: 1, operation: 'Put', timestamp: '10:00:01' },
      { key: 320, keyStr: 'key_320', value: '7c1b5e9d3f0a2e8c', version: 2, operation: 'Put', timestamp: '10:00:02' },
      { key: 450, keyStr: 'key_450', value: '2d8e4f1a0c9b7e3f', version: 3, operation: 'Put', timestamp: '10:00:03' },
      { key: 890, keyStr: 'key_890', value: '9f0a2e8c7c1b5e9d', version: 4, operation: 'Delete', timestamp: '10:00:04' },
      { key: 1200, keyStr: 'key_1200', value: '1a0c9b7e3f2d8e4f', version: 5, operation: 'Put', timestamp: '10:00:05' }
    ];

    const l0Records2: RecordItem[] = [
      { key: 210, keyStr: 'key_210', value: '6e3f2d8e4f1a0c9b', version: 6, operation: 'Put', timestamp: '10:01:10' },
      { key: 320, keyStr: 'key_320', value: 'beefc0017c1b5e9d', version: 7, operation: 'Put', timestamp: '10:01:12' }, // newer overwrite
      { key: 610, keyStr: 'key_610', value: '3f0a2e8c7c1b5e9d', version: 8, operation: 'Put', timestamp: '10:01:15' },
      { key: 950, keyStr: 'key_950', value: '8c7c1b5e9d3f0a2e', version: 9, operation: 'Put', timestamp: '10:01:18' }
    ];

    const l0Records3: RecordItem[] = [
      { key: 105, keyStr: 'key_105', value: 'deadbeef1b0e3f5a', version: 10, operation: 'Delete', timestamp: '10:02:01' }, // tombstone
      { key: 450, keyStr: 'key_450', value: '00ffaa1122334455', version: 11, operation: 'Put', timestamp: '10:02:05' },
      { key: 780, keyStr: 'key_780', value: '5544332211aaff00', version: 12, operation: 'Put', timestamp: '10:02:10' },
      { key: 1100, keyStr: 'key_1100', value: 'ccbbaa9988776655', version: 13, operation: 'Put', timestamp: '10:02:15' }
    ];

    this.l0Tables = [
      this.buildSSTableMeta(l0Records1, 0, true),
      this.buildSSTableMeta(l0Records2, 0, true),
      this.buildSSTableMeta(l0Records3, 0, true)
    ];

    // Seed Level 1 (disjoint key ranges)
    const l1Records1: RecordItem[] = [
      { key: 50, keyStr: 'key_050', value: '1122334455667788', version: 1, operation: 'Put', timestamp: '09:50:00' },
      { key: 180, keyStr: 'key_180', value: '99aabbccddeeff00', version: 1, operation: 'Put', timestamp: '09:50:01' },
      { key: 300, keyStr: 'key_300', value: '1234567890abcdef', version: 1, operation: 'Put', timestamp: '09:50:02' }
    ];

    const l1Records2: RecordItem[] = [
      { key: 400, keyStr: 'key_400', value: 'fedcba0987654321', version: 1, operation: 'Put', timestamp: '09:51:00' },
      { key: 650, keyStr: 'key_650', value: 'abcdef0123456789', version: 1, operation: 'Put', timestamp: '09:51:01' },
      { key: 850, keyStr: 'key_850', value: '0102030405060708', version: 1, operation: 'Put', timestamp: '09:51:02' }
    ];

    const l1Records3: RecordItem[] = [
      { key: 900, keyStr: 'key_900', value: '090a0b0c0d0e0f10', version: 1, operation: 'Put', timestamp: '09:52:00' },
      { key: 1050, keyStr: 'key_1050', value: '1f1e1d1c1b1a1918', version: 1, operation: 'Put', timestamp: '09:52:01' },
      { key: 1400, keyStr: 'key_1400', value: '2a2b2c2d2e2f3031', version: 1, operation: 'Put', timestamp: '09:52:02' }
    ];

    this.l1Tables = [
      this.buildSSTableMeta(l1Records1, 1, false),
      this.buildSSTableMeta(l1Records2, 1, false),
      this.buildSSTableMeta(l1Records3, 1, false)
    ];

    // Seed active memtable with a few live items
    const memSeeds: [number, string, 'Put' | 'Delete'][] = [
      [150, 'a1b2c3d4e5f60718', 'Put'],
      [320, 'updated_fresh_value', 'Put'], // newest version of 320!
      [490, '9988776655443322', 'Put'],
      [710, 'ffffffff00000000', 'Put'],
      [890, 'tombstone_reconfirm', 'Delete']
    ];

    for (const [k, v, op] of memSeeds) {
      this.memtable.set(k, {
        key: k,
        keyStr: `key_${k.toString().padStart(4, '0')}`,
        value: v,
        version: this.nextVersion++,
        operation: op,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  }

  private buildSSTableMeta(records: RecordItem[], level: number, hasOverlaps = false): SSTableMeta {
    const sorted = [...records].sort((a, b) => a.key - b.key || b.version - a.version);
    const keys = sorted.map(r => r.key);
    const minKey = keys.length ? Math.min(...keys) : 0;
    const maxKey = keys.length ? Math.max(...keys) : 0;
    const tombCount = sorted.filter(r => r.operation === 'Delete').length;
    const id = `SST_${level === 0 ? 'L0' : 'L' + level}_${this.sstableCounter++}`;

    return {
      id,
      level,
      recordCount: sorted.length,
      sizeBytes: 16 + sorted.length * 33, // 16-byte header + 33-byte records
      minKey,
      maxKey,
      tombstoneCount: tombCount,
      createdAt: new Date().toLocaleTimeString(),
      records: sorted,
      bloomFilter: createBloomFilter(keys),
      hasOverlaps
    };
  }

  async insertRecord(key: number, value: string, op: 'Put' | 'Delete' = 'Put'): Promise<{ flushed: boolean; record: RecordItem }> {
    const record: RecordItem = {
      key,
      keyStr: `key_${key.toString().padStart(4, '0')}`,
      value: value || generateHexValue().slice(0, 16),
      version: this.nextVersion++,
      operation: op,
      timestamp: new Date().toLocaleTimeString()
    };

    this.memtable.set(key, record);

    let flushed = false;
    if (this.memtable.size >= this.memtableThreshold) {
      await this.flushMemtable();
      flushed = true;
    }

    return { flushed, record };
  }

  async insertBatch(count: number, distribution: 'uniform' | 'zipfian' | 'hot_range'): Promise<{ count: number; flushes: number }> {
    let flushes = 0;
    for (let i = 0; i < count; i++) {
      let key = 0;
      if (distribution === 'uniform') {
        key = Math.floor(Math.random() * 2000) + 1;
      } else if (distribution === 'hot_range') {
        // 80% keys land in [100, 300)
        if (Math.random() < 0.8) {
          key = Math.floor(Math.random() * 200) + 100;
        } else {
          key = Math.floor(Math.random() * 1800) + 300;
        }
      } else {
        // Zipfian approximation (power law)
        const u = Math.random();
        key = Math.floor(Math.pow(u, 2.5) * 2000) + 1;
      }

      const isDelete = Math.random() < 0.12; // 12% deletes
      const res = await this.insertRecord(key, generateHexValue().slice(0, 16), isDelete ? 'Delete' : 'Put');
      if (res.flushed) flushes++;
    }

    return { count, flushes };
  }

  async flushMemtable(): Promise<SSTableMeta> {
    if (this.memtable.size === 0) {
      throw new Error('Memtable is empty; nothing to flush');
    }

    // Freeze active into immutable
    const records = Array.from(this.memtable.values());
    this.immutableMemtable = records;
    this.memtable.clear();

    // Simulate write delay
    await new Promise(r => setTimeout(r, 400));

    // Create SSTable in Level 0
    const sstable = this.buildSSTableMeta(records, 0, true);
    this.l0Tables.unshift(sstable);
    this.immutableMemtable = null;

    return sstable;
  }

  generateL0Dataset(datasetSize: number = 1000000, distribution: DatasetDistribution = 'hot_range'): void {
    const tableCount = 8;
    const recordsPerTable = 15;
    this.l0Tables = [];

    const keyspace = datasetSize * 4;
    for (let t = 0; t < tableCount; t++) {
      const records: RecordItem[] = [];
      const usedKeys = new Set<number>();

      while (records.length < recordsPerTable) {
        let key = 0;
        let isDelete = false;

        if (distribution === 'heavy_tombstone') {
          // Deletion storm / GC stress test:
          // 65% Delete tombstones, keys clustered in moderate range to test GC purge & bounds
          key = Math.floor(Math.random() * (keyspace * 0.15)) + 1;
          isDelete = Math.random() < 0.65;
        } else if (distribution === 'write_storm') {
          // Rapid overwrite storm:
          // Small key domain (5% of keyspace), rapid Put overwrites across tables
          key = Math.floor(Math.random() * (keyspace * 0.05)) + 1;
          isDelete = Math.random() < 0.05;
        } else if (distribution === 'hot_range') {
          // 85% keys in hot 5% range
          if (Math.random() < 0.85) {
            key = Math.floor(Math.random() * (keyspace * 0.05)) + 1;
          } else {
            key = Math.floor(Math.random() * (keyspace * 0.95)) + Math.floor(keyspace * 0.05) + 1;
          }
          isDelete = Math.random() < 0.12;
        } else if (distribution === 'zipfian') {
          const u = Math.random();
          key = Math.floor(Math.pow(u, 2.6) * keyspace) + 1;
          isDelete = Math.random() < 0.12;
        } else {
          // Uniform
          key = Math.floor(Math.random() * keyspace) + 1;
          isDelete = Math.random() < 0.12;
        }

        if (usedKeys.has(key)) continue;
        usedKeys.add(key);

        records.push({
          key,
          keyStr: `key_${key}`,
          value: generateHexValue().slice(0, 16),
          version: this.nextVersion++,
          operation: isDelete ? 'Delete' : 'Put',
          timestamp: new Date().toLocaleTimeString()
        });
      }

      this.l0Tables.push(this.buildSSTableMeta(records, 0, true));
    }
  }

  async runCompaction(
    config: CompactionConfig,
    onProgress?: (workers: WorkerStatus[]) => void
  ): Promise<CompactionRunResult> {
    const datasetSize: number = (config as any).datasetSize ?? 1000000;
    const distribution: DatasetDistribution = (config as any).distribution ?? 'hot_range';

    // Always regenerate L0 dataset according to selected distribution & scale
    this.generateL0Dataset(datasetSize, distribution);
    const inputTables = [...this.l0Tables];

    // Collect all records across input SSTables
    const allRecords: RecordItem[] = [];
    for (const t of inputTables) {
      allRecords.push(...t.records);
    }

    // Sort to determine global key distribution
    const sortedInput = [...allRecords].sort((a, b) => a.key - b.key || b.version - a.version);

    // Key space: always anchor at 0 so ranges are clean and human-readable
    const keyspaceMax = datasetSize * 4;

    // Calculate Partition Boundaries (always start from 0)
    const partitionCount = Math.max(1, config.partitions || config.workerCount || 4);
    const boundaries: number[] = [0];

    if (config.method === 'splice') {
      // Skew-aware SPLICE quantile sampling:
      // Split by cumulative expected records so each partition has ~equal record counts
      for (let p = 1; p < partitionCount; p++) {
        const targetIdx = Math.floor((p * sortedInput.length) / partitionCount);
        const splitKey = sortedInput[targetIdx]
          ? sortedInput[targetIdx].key + 1
          : Math.floor((p * keyspaceMax) / partitionCount);
        boundaries.push(splitKey);
      }
      boundaries.push(keyspaceMax);
    } else {
      // Naive Equal-width: divides numeric key range [0, keyspaceMax) equally
      const step = keyspaceMax / partitionCount;
      for (let p = 1; p < partitionCount; p++) {
        boundaries.push(Math.floor(p * step));
      }
      boundaries.push(keyspaceMax);
    }

    // Setup workers — each thread handles (partitionCount / threadCount) partitions
    const workerCount = config.mode === 'sequential' ? 1 : config.workerCount;
    const partitionsPerWorker = Math.ceil(partitionCount / workerCount);
    const workers: WorkerStatus[] = [];

    // Scale factor to map sample table records to user selected dataset scale
    const scaleFactor = datasetSize / Math.max(1, sortedInput.length);

    for (let w = 0; w < workerCount; w++) {
      const startP = w * partitionsPerWorker;
      const endP = Math.min(startP + partitionsPerWorker, partitionCount);
      if (startP >= partitionCount) break;

      const lower = boundaries[startP];
      const upper = boundaries[endP] ?? keyspaceMax;
      const partitionRecords = sortedInput.filter(r => r.key >= lower && r.key < upper);
      const scaledTotal = Math.max(1, Math.round(partitionRecords.length * scaleFactor));

      const partLabel =
        endP - startP === 1
          ? `P${startP + 1}`
          : `P${startP + 1}–P${endP}`;

      workers.push({
        id: w + 1,
        name: `Thread ${w + 1} (${partLabel})`,
        status: 'running',
        partitionIndex: startP,
        keyRange: [lower, upper],
        recordsProcessed: 0,
        totalRecordsInPartition: scaledTotal,
        progressPercent: 0,
        elapsedMs: 0,
        tombstonesPurged: 0,
        overwritesDropped: 0
      });
    }

    // Simulate animated step-by-step parallel merge
    const steps = 8;
    for (let s = 1; s <= steps; s++) {
      await new Promise(r => setTimeout(r, 220));

      for (const w of workers) {
        // Skew effect: In equal-width on skewed data, worker on hot range progresses slower!
        const isHotWorker = config.method === 'equal' && w.totalRecordsInPartition > (datasetSize / workerCount) * 1.5;
        const progressIncrement = isHotWorker ? (100 / steps) * 0.45 : (100 / steps);

        w.progressPercent = Math.min(100, Math.round(s * progressIncrement));
        w.recordsProcessed = Math.min(
          w.totalRecordsInPartition,
          Math.round((w.progressPercent / 100) * w.totalRecordsInPartition)
        );
        w.elapsedMs += Math.round(15 + Math.random() * 20);

        if (w.progressPercent >= 100) {
          w.status = 'completed';
        }
      }

      if (onProgress) {
        onProgress([...workers]);
      }
    }

    // Perform actual deduplication: keep newest version, drop tombstones
    const liveMap = new Map<number, RecordItem>();
    let tombstonesPurged = 0;
    let overwritesDropped = 0;

    // Group by key
    const byKey = new Map<number, RecordItem[]>();
    for (const r of allRecords) {
      if (!byKey.has(r.key)) byKey.set(r.key, []);
      byKey.get(r.key)!.push(r);
    }

    for (const [key, vers] of byKey.entries()) {
      vers.sort((a, b) => b.version - a.version);
      const newest = vers[0];
      overwritesDropped += (vers.length - 1);

      if (newest.operation === 'Delete') {
        tombstonesPurged++;
      } else {
        liveMap.set(key, newest);
      }
    }

    const liveOutput = Array.from(liveMap.values()).sort((a, b) => a.key - b.key);

    // Split output into Level 1 SSTables
    const outTableCount = Math.max(1, Math.min(4, Math.ceil(liveOutput.length / 8)));
    const outChunkSize = Math.ceil(liveOutput.length / outTableCount);
    const newL1Tables: SSTableMeta[] = [];

    for (let i = 0; i < outTableCount; i++) {
      const slice = liveOutput.slice(i * outChunkSize, (i + 1) * outChunkSize);
      if (slice.length > 0) {
        newL1Tables.push(this.buildSSTableMeta(slice, 1, false));
      }
    }

    // Replace L0 with new L1
    const oldL0Ids = this.l0Tables.map(t => t.id);
    this.l0Tables = [];
    this.l1Tables = [...newL1Tables, ...this.l1Tables];

    // Execution time based on dataset scale (1M records -> ~2,200ms base seq)
    const baseMergeTime = Math.max(90, (datasetSize / 1000000) * 2200);
    const samplingTimeMs = config.method === 'splice'
      ? Number((Math.max(1.8, (datasetSize / 1000000) * 2.2)).toFixed(1))
      : 0.0;

    // Dynamic / task scheduling mitigates stragglers when partitions > threads
    const scheduleBoost = (config.schedule === 'dynamic' || config.schedule === 'tasks') && partitionCount > workerCount
      ? 0.78
      : (config.schedule === 'guided' ? 0.88 : 1.0);

    const workerTimes = workers.map(w => {
      if (config.method === 'equal') {
        const recordShare = w.totalRecordsInPartition / Math.max(1, datasetSize);
        const rawTime = (recordShare * baseMergeTime * 1.15) * scheduleBoost;
        return Math.max(18, Math.round(rawTime));
      } else {
        const jitter = (Math.random() - 0.5) * 0.08;
        const threadTime = (baseMergeTime / workerCount) * (1.0 + jitter);
        return Math.max(20, Math.round(threadTime));
      }
    });

    const maxThreadTime = Math.max(...workerTimes);
    const sumThreadTime = workerTimes.reduce((a, b) => a + b, 0);
    const avgThreadTime = sumThreadTime / workerCount;
    const loadImbalance = avgThreadTime > 0 ? (maxThreadTime - avgThreadTime) / avgThreadTime : 0;

    const mergeTimeMs = config.mode === 'sequential' ? baseMergeTime : maxThreadTime;
    const totalTimeMs = Number((samplingTimeMs + mergeTimeMs).toFixed(1));
    const seqTime = Number(baseMergeTime.toFixed(1));
    const speedup = Number((seqTime / Math.max(totalTimeMs, 1)).toFixed(2));

    // Scale tombstone and overwrite counts to exact dataset scale
    const scaledTombstones = Math.round(tombstonesPurged * scaleFactor);
    const scaledOverwrites = Math.round(overwritesDropped * scaleFactor);
    const scaledLive = Math.max(0, datasetSize - scaledTombstones - scaledOverwrites);

    return {
      method: config.method,
      mode: config.mode,
      schedule: config.schedule,
      workerCount,
      partitions: partitionCount,
      inputSSTableIds: oldL0Ids,
      outputSSTableIds: newL1Tables.map(t => t.id),
      totalInputRecords: datasetSize,
      totalLiveOutputRecords: scaledLive,
      tombstonesPurged: scaledTombstones,
      overwritesDropped: scaledOverwrites,
      samplingTimeMs,
      mergeTimeMs,
      totalTimeMs,
      speedup: Math.max(1.0, speedup),
      loadImbalance: Number(loadImbalance.toFixed(3)),
      workerTimes
    };
  }


  async lookupKey(key: number): Promise<ReadLookupResult> {
    const keyStr = `key_${key.toString().padStart(4, '0')}`;
    const steps: ReadLookupResult['steps'] = [];
    const accessedStructures: string[] = [];
    let totalLatency = 0;

    // 1. Check Active Memtable
    totalLatency += 12;
    accessedStructures.push('Active Memtable');
    if (this.memtable.has(key)) {
      const rec = this.memtable.get(key)!;
      steps.push({
        stepIndex: 1,
        component: 'memtable',
        targetId: 'Active Memtable',
        description: `Probed in-memory skip-list / red-black tree (O(log M)). Key version v${rec.version} found.`,
        status: 'hit',
        latencyMicros: 12
      });
      return {
        queryKey: key,
        queryKeyStr: keyStr,
        found: rec.operation === 'Put',
        record: rec,
        steps,
        totalHops: 1,
        totalLatencyMicros: totalLatency,
        accessedStructures
      };
    }

    steps.push({
      stepIndex: 1,
      component: 'memtable',
      targetId: 'Active Memtable',
      description: `Probed active memtable. Key ${keyStr} not present in memory buffer.`,
      status: 'miss',
      latencyMicros: 12
    });

    // 2. Check Immutable Memtable if active
    if (this.immutableMemtable) {
      totalLatency += 15;
      accessedStructures.push('Immutable Memtable');
      const foundInImm = this.immutableMemtable.find(r => r.key === key);
      if (foundInImm) {
        steps.push({
          stepIndex: 2,
          component: 'immutable_memtable',
          targetId: 'Immutable Memtable',
          description: `Key found in flushing immutable memtable buffer.`,
          status: 'hit',
          latencyMicros: 15
        });
        return {
          queryKey: key,
          queryKeyStr: keyStr,
          found: foundInImm.operation === 'Put',
          record: foundInImm,
          steps,
          totalHops: 2,
          totalLatencyMicros: totalLatency,
          accessedStructures
        };
      }
    }

    // 3. Search Level 0 SSTables (newest to oldest because L0 has overlapping key ranges!)
    let stepCount = steps.length + 1;
    for (const sst of this.l0Tables) {
      accessedStructures.push(sst.id);
      totalLatency += 45;

      // Bloom filter probe
      let bloomPass = true;
      if (sst.bloomFilter) {
        bloomPass = testBloomFilter(sst.bloomFilter, key);
      }

      if (!bloomPass) {
        steps.push({
          stepIndex: stepCount++,
          component: 'bloom_filter',
          targetId: `${sst.id} (Bloom)`,
          description: `Bloom Filter test returned NEGATIVE for ${sst.id}. Disk I/O skipped.`,
          status: 'miss',
          latencyMicros: 5
        });
        continue;
      }

      // Key range probe
      if (key < sst.minKey || key > sst.maxKey) {
        steps.push({
          stepIndex: stepCount++,
          component: 'sstable_index',
          targetId: sst.id,
          description: `Key ${key} outside SSTable range [${sst.minKey}, ${sst.maxKey}].`,
          status: 'miss',
          latencyMicros: 8
        });
        continue;
      }

      // Check records in SSTable
      const rec = sst.records.find(r => r.key === key);
      if (rec) {
        steps.push({
          stepIndex: stepCount++,
          component: 'sstable_record',
          targetId: sst.id,
          description: `Binary search matched key in ${sst.id} (Version ${rec.version}, ${rec.operation}).`,
          status: 'hit',
          latencyMicros: 65
        });
        return {
          queryKey: key,
          queryKeyStr: keyStr,
          found: rec.operation === 'Put',
          record: rec,
          steps,
          totalHops: steps.length,
          totalLatencyMicros: totalLatency,
          accessedStructures
        };
      } else {
        steps.push({
          stepIndex: stepCount++,
          component: 'sstable_record',
          targetId: sst.id,
          description: `Bloom filter false-positive or range overlap. Record not present in ${sst.id}.`,
          status: 'miss',
          latencyMicros: 55
        });
      }
    }

    // 4. Search Level 1 SSTables (non-overlapping: binary search locates at most 1 table!)
    for (const sst of this.l1Tables) {
      if (key >= sst.minKey && key <= sst.maxKey) {
        accessedStructures.push(sst.id);
        totalLatency += 40;

        const rec = sst.records.find(r => r.key === key);
        if (rec) {
          steps.push({
            stepIndex: stepCount++,
            component: 'sstable_record',
            targetId: sst.id,
            description: `Key located in Level 1 disjoint partitioned file ${sst.id}.`,
            status: 'hit',
            latencyMicros: 48
          });
          return {
            queryKey: key,
            queryKeyStr: keyStr,
            found: rec.operation === 'Put',
            record: rec,
            steps,
            totalHops: steps.length,
            totalLatencyMicros: totalLatency,
            accessedStructures
          };
        }
      }
    }

    // Key not found anywhere
    return {
      queryKey: key,
      queryKeyStr: keyStr,
      found: false,
      steps,
      totalHops: steps.length,
      totalLatencyMicros: totalLatency,
      accessedStructures
    };
  }

  getMetrics(): EngineMetrics {
    let totalKeys = this.memtable.size;
    let tombstoneCount = 0;
    let liveKeys = 0;
    let totalBytes = this.memtable.size * 33;

    for (const r of this.memtable.values()) {
      if (r.operation === 'Delete') tombstoneCount++;
      else liveKeys++;
    }

    for (const t of this.l0Tables) {
      totalKeys += t.recordCount;
      tombstoneCount += t.tombstoneCount;
      liveKeys += (t.recordCount - t.tombstoneCount);
      totalBytes += t.sizeBytes;
    }

    for (const t of this.l1Tables) {
      totalKeys += t.recordCount;
      tombstoneCount += t.tombstoneCount;
      liveKeys += (t.recordCount - t.tombstoneCount);
      totalBytes += t.sizeBytes;
    }

    for (const t of this.l2Tables) {
      totalKeys += t.recordCount;
      tombstoneCount += t.tombstoneCount;
      liveKeys += (t.recordCount - t.tombstoneCount);
      totalBytes += t.sizeBytes;
    }

    const memtableUtil = Math.round((this.memtable.size / this.memtableThreshold) * 100);

    return {
      totalKeys,
      liveKeys,
      tombstoneCount,
      memtableSize: this.memtable.size,
      memtableCapacity: this.memtableThreshold,
      memtableUtilization: memtableUtil,
      immutableMemtableSize: this.immutableMemtable ? this.immutableMemtable.length : 0,
      sstableCount: this.l0Tables.length + this.l1Tables.length + this.l2Tables.length,
      l0Count: this.l0Tables.length,
      l1Count: this.l1Tables.length,
      l2Count: this.l2Tables.length,
      totalBytesWritten: totalBytes,
      compactionThroughputOps: 325000,
      activeWorkers: 0,
      recentSpeedup: 2.05,
      recentLoadImbalance: 0.026
    };
  }

  getL0Tables(): SSTableMeta[] {
    return this.l0Tables;
  }

  getL1Tables(): SSTableMeta[] {
    return this.l1Tables;
  }

  getL2Tables(): SSTableMeta[] {
    return this.l2Tables;
  }

  getMemtableRecords(): RecordItem[] {
    return Array.from(this.memtable.values());
  }
}

// Singleton service instance
export const engineService = new MockEngineService();
