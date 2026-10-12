#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C
TIMEFORMAT='%6R'

records="${1:?Usage: phase7_batch.sh RECORDS DISTRIBUTION THREADS PARTITIONS [REPETITIONS]}"
dist="${2:?Provide distribution: uniform, zipfian, or hot_range}"
threads="${3:?Provide thread count}"
partitions="${4:?Provide partition count}"
repetitions="${5:-5}"
keyspace=$((4 * records))

exe="./build-phase6/splice.exe"
dir="data/full/${dist}_${records}"
csv="results/phase7_runs_complete.csv"

if [[ ! -f "$csv" ]]; then
  printf 'method,distribution,records,threads,partitions,rep,wall_ms,sampling_ms,correct\n' > "$csv"
fi

methods=(sequential equal splice)

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
        local_command=("$exe" parallel-equal "$output" "$keyspace" "$partitions" "$threads" "$dir"/input_*.sst)
        ;;
      splice)
        local_command=("$exe" splice "$output" "$keyspace" "$partitions" "$threads" 0.02 "$dir"/input_*.sst)
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

    if ! "$exe" check "$output" "$dir/expected_live.tsv" >/dev/null 2>&1; then
      echo "Correctness check failed: $method / $dist / run $rep"
      cat "$log"
      "$exe" check "$output" "$dir/expected_live.tsv"
      exit 1
    fi

    printf '%s,%s,%s,%s,%s,%s,%s,%s,true\n' \
      "$method" "$dist" "$records" "$threads" "$partitions" \
      "$rep" "$wall_ms" "$sampling_ms" >> "$csv"

    echo "Passed: $method / $dist / $records / run $rep — ${wall_ms} ms"
  done
done
