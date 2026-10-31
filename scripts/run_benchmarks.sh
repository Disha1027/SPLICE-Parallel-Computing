#!/usr/bin/env bash
# ==============================================================================
# SPLICE Compaction Benchmark Runner
# Usage: ./scripts/run_benchmarks.sh [RECORDS] [DISTRIBUTION] [THREADS] [PARTITIONS] [REPETITIONS] [SCHEDULE]
# ==============================================================================
set -euo pipefail
export LC_ALL=C
TIMEFORMAT='%6R'

records="${1:-1000000}"
dist="${2:-uniform}"
threads="${3:-4}"
partitions="${4:-16}"
repetitions="${5:-5}"
schedule="${6:-static}"
keyspace=$((4 * records))

# Auto-detect splice binary location
if [[ -f "./build/splice" ]]; then
  exe="./build/splice"
elif [[ -f "./build/splice.exe" ]]; then
  exe="./build/splice.exe"
elif [[ -f "./splice" ]]; then
  exe="./splice"
else
  echo "Error: SPLICE binary not found. Please build the project first:"
  echo "  cmake -S . -B build && cmake --build build -j 4"
  exit 1
fi

dir="data/full/${dist}_${records}"
csv="results/phase7_runs_complete.csv"
mkdir -p results

if [[ ! -f "$csv" ]]; then
  printf 'method,distribution,records,threads,partitions,rep,wall_ms,sampling_ms,correct\n' > "$csv"
fi

methods=(sequential equal splice)

echo "=== Running SPLICE Benchmark Suite ==="
echo "Binary:       $exe"
echo "Dataset:      $records records ($dist skew)"
echo "Concurrency:  $threads threads, $partitions partitions (Schedule: $schedule)"
echo "Repetitions:  $repetitions"
echo "Results CSV:  $csv"
echo "======================================"

for rep in $(seq 1 "$repetitions"); do
  offset=$(((rep - 1) % 3))

  for slot in 0 1 2; do
    method="${methods[$(((slot + offset) % 3))]}"
    output="$dir/output_bench_${method}_t${threads}_p${partitions}.sst"
    log="/tmp/splice_${records}_${dist}_${threads}_${partitions}_${rep}_${method}.log"
    timer="/tmp/splice_timer_${records}_${dist}_${threads}_${partitions}_${rep}_${method}.txt"
    sampling_ms=""
    local_command=()

    case "$method" in
      sequential)
        local_command=("$exe" compact "$output" "$dir"/input_*.sst)
        ;;
      equal)
        local_command=("$exe" parallel-equal "$output" "$keyspace" "$partitions" "$threads" "$dir"/input_*.sst --schedule "$schedule")
        ;;
      splice)
        local_command=("$exe" splice "$output" "$keyspace" "$partitions" "$threads" 0.02 "$dir"/input_*.sst --schedule "$schedule")
        ;;
    esac

    if ! { time "${local_command[@]}" >"$log" 2>&1; } 2>"$timer"; then
      echo "Run failed: $method / $dist / $records records"
      cat "$log"
      cat "$timer"
      exit 1
    fi

    elapsed="$(cat "$timer")"
    wall_ms="$(awk -v seconds="$elapsed" 'BEGIN { printf "%.3f", seconds * 1000 }')"

    if [[ "$method" == "splice" ]]; then
      sampling_ms="$(sed -n 's/^Sampling and planning: \([0-9.]*\) ms$/\1/p' "$log")"
    fi

    # Verify correctness against expected live key answer file if present
    if [[ -f "$dir/expected_live.tsv" ]]; then
      if ! "$exe" check "$output" "$dir/expected_live.tsv" >/dev/null 2>&1; then
        echo "Correctness verification FAILED: $method / $dist / run $rep"
        cat "$log"
        exit 1
      fi
    fi

    printf '%s,%s,%s,%s,%s,%s,%s,%s,true\n' \
      "$method" "$dist" "$records" "$threads" "$partitions" \
      "$rep" "$wall_ms" "$sampling_ms" >> "$csv"

    echo "✓ Passed: [$method] $dist ($records keys) run $rep/$repetitions — ${wall_ms} ms"
  done
done

echo "Benchmark complete! Results appended to $csv"
