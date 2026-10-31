# Parallel LSM Engine – Interactive Web Dashboard

A clean, developer-focused observability and simulation dashboard for the **SPLICE Parallel LSM-Tree Compaction Engine**.

---

## Quickstart

```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5174/`** (or the port displayed in your terminal) in your browser.

To create a production build:
```bash
npm run build
```

---

## 3 Core Dashboard Views

### 1. Run Compaction
- **Workload Profile & Skew Distribution**:
  - **Hot-Range Skew (85/5 Rule):** 85% writes concentrated in 5% key range (demonstrates severe equal-width stragglers).
  - **Tombstone Storm (65% Deletes):** Deletion-heavy garbage collection stress test.
  - **Write Storm (High Overwrites):** Multi-version overwrite churn testing deduplication throughput.
  - **Zipfian Power-Law:** Long-tail access skew common in caching.
  - **Uniform Random:** Balanced keyspace baseline.
- **Dataset Scale**:
  - Select between **100K**, **1M**, **5M**, or **10M** records.
- **Partitioning Method**:
  - **SPLICE (Sampled Quantiles):** Samples ~2% of keys across SSTables to balance record counts per partition.
  - **Equal-Width (Naive):** Divides key range $[0, \text{Max})$ evenly, causing stragglers under skew.
- **OpenMP Scheduling Policy**:
  - `static`: Zero coordination overhead; best for uniform data.
  - `dynamic`: Work-stealing FIFO queue for loop chunks.
  - `guided`: Exponentially decaying chunk sizes.
  - `tasks`: Modern OpenMP task queue (`#pragma omp task`).
- **Live Output**:
  - Visual Partition Bar showing boundary placements.
  - Multicore Worker Cards with real-time progress bars, key ranges, and record counts.

---

### 2. Performance Analysis
Completely dynamic and driven by the latest compaction run:
- **Active Run Metadata Banner:** Workload profile, record scale, method, schedule, threads, and completion timestamp.
- **4 Key Performance Indicators (KPIs):**
  - **Parallel Time ($T_{par}$):** Broken down into sampling time vs merge time.
  - **Sequential Baseline ($T_{seq}$):** Single-threaded reference time ($\sum T_{worker}$).
  - **Parallel Speedup:** Speedup factor and parallel efficiency percentage ($E = \frac{S}{T} \times 100\%$).
  - **Load Imbalance ($LI$):** Measured as $(T_{max} - T_{avg}) / T_{avg}$ with optimal vs straggler badges.
- **Sequential vs. Parallel Correctness Verification:**
  - Mathematical conservation check: $N_{in} = N_{live} + N_{del} + N_{over}$ ($\Delta = 0$ lost keys).
  - Strictly ascending monotonic key order check ($K_i < K_{i+1}$).
  - Disjoint partition interval validation ($[K_{start}, K_{end})$).
  - Green verified badge: `✓ 100% CORRECTNESS VERIFIED — 0 LOST KEYS`.
- **Worker Thread Execution Breakdown:**
  - Horizontal bar timeline for all threads with straggler highlighting ($T_{max}$) and barrier idle wait times.
- **Architectural Insights:**
  - Contextual explanation of sampling efficiency, Amdahl's law, and OpenMP scheduling interaction.

---

### 3. System Logs
- Terminal-style event stream recording compaction launches, boundary sampling, and deduplication results.
- Color-coded levels (`INFO`, `SUCCESS`, `WARN`, `ERROR`).
- Search and log-level filtering.
- One-click text export for benchmark reports.
