#!/bin/sh
set -eu

MAGIC=REEDITPRO_REMOTION_CGROUP_RESOURCE_OBSERVATION_V1
CPU_STAT=/sys/fs/cgroup/cpu.stat
MEMORY_CURRENT=/sys/fs/cgroup/memory.current
MEMORY_PEAK=/sys/fs/cgroup/memory.peak

fail() {
  printf '%s\n' "remotion resource observer failed: $*" >&2
  exit 125
}

valid_hex_nonce() {
  [ "${#1}" -eq 48 ] || return 1
  case "$1" in
    *[!a-f0-9]*) return 1 ;;
    *) return 0 ;;
  esac
}

valid_uint() {
  case "$1" in
    ''|*[!0-9]*) return 1 ;;
    *) return 0 ;;
  esac
}

read_cpu_usage_usec() {
  value=$(awk '$1 == "usage_usec" { print $2; found=1; exit } END { if (!found) exit 1 }' "$CPU_STAT") \
    || fail 'cgroup cpu usage is unavailable'
  valid_uint "$value" || fail 'cgroup cpu usage is invalid'
  printf '%s' "$value"
}

read_memory_counter() {
  value=$(sed -n '1p' "$1") || fail 'cgroup memory counter is unavailable'
  valid_uint "$value" || fail 'cgroup memory counter is invalid'
  printf '%s' "$value"
}

[ "$#" -eq 3 ] || fail 'observer command is not exact'
nonce=$1
entrypoint=$2
runner_path=$3
valid_hex_nonce "$nonce" || fail 'observer nonce is invalid'
[ "$entrypoint" = /usr/local/bin/node ] \
  || fail 'observer entrypoint is not allowlisted'
[ "$runner_path" = /app/runner.mjs ] \
  || fail 'observer runner path is not allowlisted'

[ -r "$CPU_STAT" ] && [ -r "$MEMORY_CURRENT" ] && [ -r "$MEMORY_PEAK" ] \
  || fail 'required cgroup-v2 counters are unavailable'

started_at_ns=$(date +%s%N)
valid_uint "$started_at_ns" || fail 'start timestamp is invalid'
start_cpu_usec=$(read_cpu_usage_usec)
start_memory_current=$(read_memory_counter "$MEMORY_CURRENT")
start_memory_peak=$(read_memory_counter "$MEMORY_PEAK")

child_pid=
forward_term() {
  if [ -n "$child_pid" ]; then
    kill -TERM "$child_pid" 2>/dev/null || true
  fi
}
trap forward_term HUP INT TERM

exec 3<&0
"$entrypoint" "$runner_path" <&3 &
child_pid=$!
exec 3<&-
status=0
wait "$child_pid" || status=$?
child_pid=

finish_cpu_usec=$(read_cpu_usage_usec)
finish_memory_current=$(read_memory_counter "$MEMORY_CURRENT")
finish_memory_peak=$(read_memory_counter "$MEMORY_PEAK")
finished_at_ns=$(date +%s%N)
valid_uint "$finished_at_ns" || fail 'finish timestamp is invalid'
if [ "$finished_at_ns" -le "$started_at_ns" ]; then
  finished_at_ns=$((started_at_ns + 1000000))
fi

[ "$finish_cpu_usec" -ge "$start_cpu_usec" ] \
  || fail 'cgroup cpu usage moved backwards'
[ "$start_memory_peak" -ge "$start_memory_current" ] \
  && [ "$finish_memory_peak" -ge "$finish_memory_current" ] \
  && [ "$finish_memory_peak" -ge "$start_memory_peak" ] \
  || fail 'cgroup memory counters are inconsistent'

printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
  "$MAGIC" \
  "$nonce" \
  "$started_at_ns" \
  "$finished_at_ns" \
  "$start_cpu_usec" \
  "$finish_cpu_usec" \
  "$start_memory_current" \
  "$start_memory_peak" \
  "$finish_memory_current" \
  "$finish_memory_peak" >&2

exit "$status"
