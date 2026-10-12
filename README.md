# SPLICE: Parallel LSM-Tree Compaction

SPLICE is a C++ project comparing sequential and OpenMP parallel compaction over sorted-string-table (SSTable) inputs. It evaluates equal-width key-range partitioning against sample-based partitioning on uniform, zipfian, and hot-range data.

## Implemented methods

- **Sequential:** one-thread k-way merge of the input SSTables.
- **Equal-width:** divides the key range into equal-size partitions and merges partitions in parallel.
- **SPLICE:** samples input keys to choose partition boundaries, then merges partitions in parallel.

Each method keeps the newest version of each key and removes keys whose newest version is a delete marker.

## Build

Requirements: C++17 compiler, CMake, Ninja, and OpenMP. From an MSYS2 UCRT64 terminal:

```bash
cmake -S . -B build -G Ninja
cmake --build build -j 4
```

## Data and correctness

The generated datasets cover 100K, 1M, 5M, and 10M input records, with uniform, zipfian, and hot-range distributions. Each dataset includes eight input SSTables, a manifest, and `expected_live.tsv`, the expected final live-key set.

Use the program's `check` command to compare a compaction output against its expected live-key file:

`./build/splice.exe check <output.sst> <expected_live.tsv>`

A successful check reports `CHECK PASSED`.

## Experiments

Phase 7 recorded five repetitions per method and distribution for the 1M, 5M, and 10M size comparisons, using 4 threads and 16 partitions. It also recorded a 1M thread-count sweep and partition-count sweep.

To run a batch, use:

`./scripts/phase7_batch_complete.sh 1000000 uniform 4 16 5`

Arguments are record count, distribution, thread count, partition count, and repetitions. The script appends run records to `results/phase7_runs_complete.csv`.

## Results

- Raw experiment log: `results/phase7_runs_complete.csv`
- Median timings and normalized speedups: `results/phase7_summary.csv`
- Findings and limitations: `results/PHASE7_FINDINGS.md`

The 423 recorded experiment runs passed the correctness check. Results are machine-specific; see the findings document for the tested settings and measurement limitations.

## Dataset generation

Dataset configurations are in `configs/full/`. Generated datasets and compaction outputs are local experiment artifacts and are not required to build the program. Use the project generator and those configurations to recreate them.
