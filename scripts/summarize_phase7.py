import csv
from collections import defaultdict
from statistics import median

groups = defaultdict(list)
bad = 0
rows = 0

with open("results/phase7_runs_complete.csv", newline="") as f:
    for r in csv.reader(f):
        if not r or r[0] == "method":
            continue
        rows += 1
        if r[8].strip().lower() != "true":
            bad += 1
        groups[(r[2], r[1], r[3], r[4], r[0])].append(float(r[6]))

baseline = {
    (n, dist, threads, parts): median(times)
    for (n, dist, threads, parts, method), times in groups.items()
    if method == "sequential"
}

with open("results/phase7_summary.csv", "w", newline="") as f:
    out = csv.writer(f)
    out.writerow(["records", "distribution", "threads", "partitions",
                  "method", "runs", "median_ms", "speedup_vs_sequential"])
    for (n, dist, threads, parts, method), times in sorted(groups.items()):
        base = baseline.get((n, dist, threads, parts))
        speedup = round(base / median(times), 3) if base and method != "sequential" else ""
        out.writerow([n, dist, threads, parts, method, len(times),
                      round(median(times), 3), speedup])

print(f"Raw runs: {rows}; incorrect runs: {bad}")
print("Wrote results/phase7_summary.csv")
