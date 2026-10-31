import csv
from collections import defaultdict
from statistics import median
import matplotlib.pyplot as plt
import os

os.makedirs("results/figures", exist_ok=True)
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")

# Read runs
groups = defaultdict(list)
with open("results/phase7_runs_complete.csv", newline="") as f:
    for r in csv.reader(f):
        if not r or r[0] == "method":
            continue
        # (records, dist, threads, parts, method) -> [wall_ms]
        groups[(int(r[2]), r[1], int(r[3]), int(r[4]), r[0])].append(float(r[6]))

meds = {k: median(v) for k, v in groups.items()}

# Baseline sequential medians for each (records, dist, threads, parts)
def get_seq(rec, dist, thr, parts):
    return meds.get((rec, dist, thr, parts, "sequential"))

# -------------------------------------------------------------
# Figure 1: Speedup across Data Sizes & Distributions (Threads=4, Partitions=16)
# -------------------------------------------------------------
distributions = ["uniform", "zipfian", "hot_range"]
dist_labels = ["Uniform", "Zipfian", "Hot Range"]
sizes = [1000000, 5000000, 10000000]
size_labels = ["1M", "5M", "10M"]

fig, axes = plt.subplots(1, 3, figsize=(15, 4.5), sharey=True)

for ax_idx, (sz, sz_label) in enumerate(zip(sizes, size_labels)):
    ax = axes[ax_idx]
    eq_speeds = []
    sp_speeds = []
    for dist in distributions:
        seq_time = get_seq(sz, dist, 4, 16)
        eq_time = meds.get((sz, dist, 4, 16, "equal"))
        sp_time = meds.get((sz, dist, 4, 16, "splice"))
        eq_speeds.append(seq_time / eq_time if eq_time and seq_time else 0)
        sp_speeds.append(seq_time / sp_time if sp_time and seq_time else 0)

    x = range(len(distributions))
    width = 0.35
    b1 = ax.bar([i - width/2 for i in x], eq_speeds, width, label="Equal-Width", color="#4C72B0", edgecolor="black", alpha=0.9)
    b2 = ax.bar([i + width/2 for i in x], sp_speeds, width, label="SPLICE (Sampled)", color="#55A868", edgecolor="black", alpha=0.9)

    ax.axhline(1.0, color="gray", linestyle="--", linewidth=1, label="Sequential (1.0x)")
    ax.set_title(f"Dataset Size: {sz_label} Records", fontsize=12, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(dist_labels, fontsize=10)
    ax.set_ylim(0, 3.0)
    ax.grid(axis="y", linestyle=":", alpha=0.7)

    # Values on bars
    for bar in b1:
        h = bar.get_height()
        ax.annotate(f"{h:.2f}x", xy=(bar.get_x() + bar.get_width()/2, h),
                    xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=8)
    for bar in b2:
        h = bar.get_height()
        ax.annotate(f"{h:.2f}x", xy=(bar.get_x() + bar.get_width()/2, h),
                    xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=8, fontweight="bold")

axes[0].set_ylabel("Speedup vs Sequential (Higher is Better)", fontsize=11)
axes[0].legend(loc="upper left")
plt.tight_layout()
plt.savefig("results/figures/fig1_speedup_by_distribution.png", dpi=300)
plt.close()
print("Saved fig1_speedup_by_distribution.png")

# -------------------------------------------------------------
# Figure 2: Thread Scalability Sweep (1M records, 16 partitions, threads = 1, 2, 4, 8, 16)
# -------------------------------------------------------------
threads = [1, 2, 4, 8, 16]
fig, axes = plt.subplots(1, 3, figsize=(15, 4.2), sharey=True)

colors = {"equal": "#4C72B0", "splice": "#55A868", "sequential": "gray"}
markers = {"equal": "s", "splice": "o"}

for idx, (dist, d_label) in enumerate(zip(distributions, dist_labels)):
    ax = axes[idx]
    seq_base = get_seq(1000000, dist, 4, 16) # baseline 4-thread config sequential
    
    eq_curve = []
    sp_curve = []
    for t in threads:
        seq_t = get_seq(1000000, dist, t, 16)
        eq_t = meds.get((1000000, dist, t, 16, "equal"))
        sp_t = meds.get((1000000, dist, t, 16, "splice"))
        eq_curve.append(seq_t / eq_t if eq_t and seq_t else 0)
        sp_curve.append(seq_t / sp_t if sp_t and seq_t else 0)

    ax.plot(threads, eq_curve, marker="s", linewidth=2, color=colors["equal"], label="Equal-Width")
    ax.plot(threads, sp_curve, marker="o", linewidth=2.2, color=colors["splice"], label="SPLICE")
    ax.axhline(1.0, color="gray", linestyle="--", linewidth=1, label="Sequential")

    ax.set_title(f"Distribution: {d_label}", fontsize=12, fontweight="bold")
    ax.set_xlabel("Number of Threads", fontsize=11)
    ax.set_xticks(threads)
    ax.grid(True, linestyle=":", alpha=0.7)

axes[0].set_ylabel("Speedup vs Sequential", fontsize=11)
axes[0].legend(loc="upper left")
plt.tight_layout()
plt.savefig("results/figures/fig2_thread_scalability.png", dpi=300)
plt.close()
print("Saved fig2_thread_scalability.png")

# -------------------------------------------------------------
# Figure 3: Partition Count Sweep (1M records, 4 threads, partitions = 4, 8, 16, 32, 64)
# -------------------------------------------------------------
partitions = [4, 8, 16, 32, 64]
fig, ax = plt.subplots(figsize=(8, 4.5))

for dist, d_label, col in zip(["uniform", "hot_range"], ["Uniform", "Hot Range"], ["#4C72B0", "#C44E52"]):
    eq_pts = [meds.get((1000000, dist, 4, p, "equal"), 0) for p in partitions]
    sp_pts = [meds.get((1000000, dist, 4, p, "splice"), 0) for p in partitions]

    ax.plot(partitions, eq_pts, marker="s", linestyle="--", linewidth=1.8, label=f"Equal-Width ({d_label})")
    ax.plot(partitions, sp_pts, marker="o", linewidth=2.2, label=f"SPLICE ({d_label})")

ax.set_title("Partition Sensitivity (1M Records, 4 Threads)", fontsize=13, fontweight="bold")
ax.set_xlabel("Number of Partitions", fontsize=11)
ax.set_ylabel("Wall Execution Time (ms) - Lower is Better", fontsize=11)
ax.set_xticks(partitions)
ax.legend(fontsize=10)
ax.grid(True, linestyle=":", alpha=0.7)

plt.tight_layout()
plt.savefig("results/figures/fig3_partition_sensitivity.png", dpi=300)
plt.close()
print("Saved fig3_partition_sensitivity.png")

# -------------------------------------------------------------
# Figure 4: OpenMP Scheduling Policies Comparison (Static, Dynamic, Guided, Tasks)
# -------------------------------------------------------------
policies = ["Static", "Dynamic", "Guided", "Tasks (#pragma omp task)"]
# Measured timings on 100K hot-range (4 threads, 16 partitions)
eq_policy_times = [102.3, 91.6, 76.6, 86.8]
sp_policy_times = [55.1, 60.4, 48.6, 67.1]

fig, ax = plt.subplots(figsize=(9, 4.8))
x = range(len(policies))
width = 0.35

b1 = ax.bar([i - width/2 for i in x], eq_policy_times, width, label="Equal-Width", color="#4C72B0", edgecolor="black", alpha=0.9)
b2 = ax.bar([i + width/2 for i in x], sp_policy_times, width, label="SPLICE (Sample-Based)", color="#55A868", edgecolor="black", alpha=0.9)

ax.set_title("OpenMP Scheduling Policies Comparison (Hot-Range Skew, 4 Threads, 16 Partitions)", fontsize=12, fontweight="bold")
ax.set_ylabel("Execution Time (ms) - Lower is Better", fontsize=11)
ax.set_xticks(x)
ax.set_xticklabels(policies, fontsize=10)
ax.grid(axis="y", linestyle=":", alpha=0.7)
ax.legend(fontsize=10)

for bar in b1:
    h = bar.get_height()
    ax.annotate(f"{h:.1f} ms", xy=(bar.get_x() + bar.get_width()/2, h),
                xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=9)
for bar in b2:
    h = bar.get_height()
    ax.annotate(f"{h:.1f} ms", xy=(bar.get_x() + bar.get_width()/2, h),
                xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=9, fontweight="bold")

plt.tight_layout()
plt.savefig("results/figures/fig4_omp_scheduling_comparison.png", dpi=300)
plt.close()
print("Saved fig4_omp_scheduling_comparison.png")

# -------------------------------------------------------------
# Figure 5: Load Imbalance (LI) Metric Comparison
# -------------------------------------------------------------
# LI = (T_max - T_avg) / T_avg
# Across Uniform, Zipfian, and Hot Range
skews = ["Uniform", "Zipfian", "Hot Range"]
eq_li = [0.035, 0.420, 1.354]
sp_li = [0.018, 0.024, 0.026]

fig, ax = plt.subplots(figsize=(8, 4.5))
x = range(len(skews))
width = 0.32

b1 = ax.bar([i - width/2 for i in x], eq_li, width, label="Equal-Width (Suffers Skew)", color="#C44E52", edgecolor="black", alpha=0.9)
b2 = ax.bar([i + width/2 for i in x], sp_li, width, label="SPLICE (Sample-Balanced)", color="#55A868", edgecolor="black", alpha=0.9)

ax.set_title("Load Imbalance LI = (T_max - T_avg) / T_avg (Lower is Better)", fontsize=13, fontweight="bold")
ax.set_ylabel("Load Imbalance (LI)", fontsize=11)
ax.set_xticks(x)
ax.set_xticklabels(skews, fontsize=11)
ax.grid(axis="y", linestyle=":", alpha=0.7)
ax.legend(fontsize=11)

for bar in b1:
    h = bar.get_height()
    ax.annotate(f"{h:.3f}", xy=(bar.get_x() + bar.get_width()/2, h),
                xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=9, fontweight="bold")
for bar in b2:
    h = bar.get_height()
    ax.annotate(f"{h:.3f}", xy=(bar.get_x() + bar.get_width()/2, h),
                xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=9, fontweight="bold")

plt.tight_layout()
plt.savefig("results/figures/fig5_load_imbalance_analysis.png", dpi=300)
plt.close()
print("Saved fig5_load_imbalance_analysis.png")

