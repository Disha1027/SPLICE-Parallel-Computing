# Phase 7: Performance Experiments and Analysis

## Experiment setup

The experiment compared sequential compaction, equal-width parallel compaction, and sample-based SPLICE. Datasets covered uniform, zipfian, and hot-range distributions at 1M, 5M, and 10M records. The main size comparison used 4 threads and 16 partitions, with five repetitions per configuration.

A separate 1M thread sweep compared 1, 2, 4, 8, and 16 threads at 16 partitions, with five repetitions. A 1M partition sweep compared 4, 8, 16, 32, and 64 partitions at 4 threads. The 4-, 8-, 32-, and 64-partition settings had three repetitions; 16 partitions had five.

The machine has 10 cores and 12 logical processors. All 423 recorded runs passed the correctness check.

## Main results

Speedup is calculated against the sequential median for the same dataset size and distribution, using the 4-thread, 16-partition baseline.

| Records | Distribution | Equal-width speedup | SPLICE speedup |
|---:|---|---:|---:|
| 1M | Uniform | 1.401× | 1.398× |
| 1M | Zipfian | 1.175× | 1.391× |
| 1M | Hot range | 1.124× | 1.439× |
| 5M | Uniform | 1.485× | 1.447× |
| 5M | Zipfian | 1.204× | 1.442× |
| 5M | Hot range | 1.122× | 1.456× |
| 10M | Uniform | 2.555× | 2.451× |
| 10M | Zipfian | 1.306× | 2.001× |
| 10M | Hot range | 1.145× | 2.053× |

## Findings

- Both parallel methods were faster than sequential compaction in the main size comparison.
- Equal-width was competitive on uniform data and had the highest measured speedup on the 10M uniform dataset.
- SPLICE showed stronger speedups than equal-width on zipfian and hot-range data at all three sizes.
- In the 1M thread sweep, 4 threads gave the lowest median time for both parallel methods across all three distributions. More threads did not consistently improve performance.
- In the 1M partition sweep, 16 partitions gave the lowest median time for both parallel methods across all three distributions. The 64-partition setting was substantially slower.

## Limitations

These measurements describe this machine and these generated datasets. The partition sweep used fewer repetitions for most settings than for 16 partitions. Sequential timings also varied across sweep configurations, even though the sequential algorithm does not use the thread or partition settings. Treat small differences as indicative; repeat the experiments under controlled system load before making strong general claims.

## Result files

- Raw run log: `results/phase7_runs_complete.csv`
- Median summary: `results/phase7_summary.csv`
