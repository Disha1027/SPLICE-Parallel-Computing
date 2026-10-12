#!/usr/bin/env bash
set -euo pipefail
export LC_ALL=C
TIMEFORMAT='%6R'

exe="./build-phase6/splice.exe"
records=100000
keyspace=400000
partitions=16
threads=4
sample_fraction=0.02
csv="results/phase7_smoke.csv"

printf 'method,distribution,records,threads,partitions,rep,wall_ms,sampling_ms,correct\n' > "$csv"

run_one() {
  local method="$1"
  local dist="$2"
  local rep="$3"
  local dir="data/full/${dist}_${records}"
  local output="$dir/output_bench_${method}.sst"
  local log="/tmp/splice_${method}_${dist}_${rep}.log"
  local timer="/tmp/splice_timer_${method}_${dist}_${rep}.txt"
  local elapsed wall_ms sampling_ms=""
  local -a cmd

  case "$method" in
    sequential)
      cmd=("$exe" compact "$output" "$dir"/input_*.sst)
      ;;
    equal)
      cmd=("$exe" parallel-equal "$output" "$keyspace" "$partitions" "$threads" "$dir"/input_*.sst)
      ;;
    splice)
      cmd=("$exe" splice "$output" "$keyspace" "$partitions" "$threads" "$sample_fraction" "$dir"/input_*.sst)
      ;;
  esac

  if ! { time "${cmd[@]}" >"$log" 2>&1; } 2>"$timer"; then
    echo "Run failed: $method / $dist / run $rep"
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

  echo "Passed: $method / $dist / run $rep — ${wall_ms} ms"
}

methods=(sequential equal splice)

for dist in uniform zipfian hot_range; do
  for rep in 1 2 3 4 5; do
    offset=$(((rep - 1) % 3))
    for slot in 0 1 2; do
      method="${methods[$(((slot + offset) % 3))]}"
      run_one "$method" "$dist" "$rep"
    done
  done
done

echo "Results saved to $csv"
