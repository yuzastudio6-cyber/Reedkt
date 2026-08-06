#!/bin/sh
set -eu

FFMPEG=/opt/reeditpro-ffmpeg/bin/ffmpeg
MINIMUM_SAMPLES=2160000
MAXIMUM_SAMPLES=1036800000
BYTES_PER_SAMPLE_FRAME=6

fail() {
  printf '%s\n' "continuous program-audio probe failed: $*" >&2
  exit 1
}

valid_uint() {
  case "$1" in
    ''|*[!0-9]*) return 1 ;;
    *) return 0 ;;
  esac
}

[ "$#" -eq 2 ] && [ "$1" = 'continuous-program-audio-probe-v1' ] \
  || fail 'unsupported fixed invocation'
expected_samples=$2
valid_uint "$expected_samples" \
  || fail 'expected sample count is not an unsigned integer'
[ "$expected_samples" -ge "$MINIMUM_SAMPLES" ] \
  && [ "$expected_samples" -le "$MAXIMUM_SAMPLES" ] \
  || fail 'expected sample count is outside the fixed profile'
expected_bytes=$((expected_samples * BYTES_PER_SAMPLE_FRAME))

work=$(mktemp -d /tmp/reeditpro-continuous-program-audio-probe.XXXXXX)
counter_pid=
trap '
  if [ -n "$counter_pid" ]; then kill "$counter_pid" 2>/dev/null || true; fi
  rm -rf "$work"
' EXIT HUP INT TERM
umask 077

decoded_fifo="$work/decoded-s24le.pipe"
decoded_count="$work/decoded-s24le.count"
mkfifo "$decoded_fifo"

# The guard lets the counter establish its FIFO endpoint without a startup
# deadlock. Children close the inherited guard and the parent closes it before
# decoding, so only the decoder controls authoritative EOF.
exec 5<> "$decoded_fifo"
wc -c < "$decoded_fifo" > "$decoded_count" 5>&- &
counter_pid=$!

if ! "$FFMPEG" -hide_banner -loglevel error -nostdin \
  -i pipe:0 -map 0:a:0 -vn -sn -dn \
  -c:a pcm_s24le -f s24le -y "$decoded_fifo" 5>&-; then
  exec 5>&-
  fail 'lossless FLAC decode failed'
fi
exec 5>&-
if ! wait "$counter_pid"; then
  counter_pid=
  fail 'decoded-byte counter failed'
fi
counter_pid=

decoded_bytes=$(tr -d ' ' < "$decoded_count")
valid_uint "$decoded_bytes" || fail 'decoded byte count is invalid'
[ "$decoded_bytes" -eq "$expected_bytes" ] \
  || fail 'decoded sample count differs from the approved timeline'
[ $((decoded_bytes % BYTES_PER_SAMPLE_FRAME)) -eq 0 ] \
  || fail 'decoded byte count is not an exact 24-bit stereo sample frame'
decoded_samples=$((decoded_bytes / BYTES_PER_SAMPLE_FRAME))

printf '{"decodedBytes":%s,"decodedSamples":%s}\n' \
  "$decoded_bytes" "$decoded_samples"
