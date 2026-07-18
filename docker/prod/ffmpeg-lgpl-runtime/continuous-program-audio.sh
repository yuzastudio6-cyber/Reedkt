#!/bin/sh
set -eu

FFMPEG=/opt/reeditpro-ffmpeg/bin/ffmpeg
FFPROBE=/opt/reeditpro-ffmpeg/bin/ffprobe
TAB=$(printf '\t')
MAGIC=REEDITPRO_FFMPEG_CONTINUOUS_PROGRAM_AUDIO_V1
MAX_SOURCES=8
MAX_SLICES=512
MAX_SOURCE_BYTES=201326592
MAX_COMBINED_SOURCE_BYTES=805306368
SAMPLE_RATE=48000
CHANNELS=2
SAMPLES_PER_FRAME=1600
BYTES_PER_SAMPLE_FRAME=6

fail() {
  printf '%s\n' "continuous program-audio failed: $*" >&2
  exit 1
}

valid_uint() {
  case "$1" in
    ''|*[!0-9]*) return 1 ;;
    *) return 0 ;;
  esac
}

valid_sha256() {
  [ "${#1}" -eq 64 ] || return 1
  case "$1" in
    *[!a-f0-9]*) return 1 ;;
    *) return 0 ;;
  esac
}

read_blob() {
  destination=$1
  expected_bytes=$2
  expected_sha256=$3
  blocks=$((expected_bytes / 65536))
  remainder=$((expected_bytes % 65536))
  : > "$destination"
  if [ "$blocks" -gt 0 ]; then
    dd bs=65536 count="$blocks" iflag=fullblock status=none > "$destination"
  fi
  if [ "$remainder" -gt 0 ]; then
    dd bs="$remainder" count=1 iflag=fullblock status=none >> "$destination"
  fi
  IFS= read -r separator || fail 'missing source-blob delimiter'
  [ -z "$separator" ] || fail 'invalid source-blob delimiter'
  [ "$(stat -c '%s' "$destination")" = "$expected_bytes" ] \
    || fail 'source blob length changed'
  printf '%s  %s\n' "$expected_sha256" "$destination" \
    | sha256sum --check --strict - >/dev/null \
    || fail 'source blob checksum changed'
  chmod 0600 "$destination"
  [ "$(dd if="$destination" bs=1 skip=4 count=4 status=none)" = 'ftyp' ] \
    || fail 'source blob is not an MP4'
}

[ "$#" -eq 1 ] && [ "$1" = 'continuous-program-audio-v1' ] \
  || fail 'unsupported fixed invocation'

work=$(mktemp -d /tmp/reeditpro-continuous-program-audio.XXXXXX)
encoder_pid=
slice_pid=
trap '
  if [ -n "$slice_pid" ]; then kill "$slice_pid" 2>/dev/null || true; fi
  if [ -n "$encoder_pid" ]; then kill "$encoder_pid" 2>/dev/null || true; fi
  rm -rf "$work"
' EXIT HUP INT TERM
umask 077

IFS= read -r magic || fail 'missing protocol magic'
[ "$magic" = "$MAGIC" ] || fail 'unsupported protocol magic'
IFS="$TAB" read -r kind fps total_frames sample_rate channels source_count slice_count extra \
  || fail 'missing timeline authority'
[ "$kind" = 'timeline' ] && [ -z "${extra:-}" ] \
  || fail 'invalid timeline authority'
for value in "$fps" "$total_frames" "$sample_rate" "$channels" "$source_count" "$slice_count"; do
  valid_uint "$value" || fail 'non-integer timeline authority'
done
[ "$fps" -eq 30 ] || fail 'continuous program-audio requires 30 fps'
[ "$total_frames" -ge 1350 ] && [ "$total_frames" -le 648000 ] \
  || fail 'timeline duration is outside the fixed profile'
[ "$sample_rate" -eq "$SAMPLE_RATE" ] && [ "$channels" -eq "$CHANNELS" ] \
  || fail 'continuous program-audio requires 48 kHz stereo output'
[ "$source_count" -ge 2 ] && [ "$source_count" -le "$MAX_SOURCES" ] \
  || fail 'source count is outside the fixed profile'
[ "$slice_count" -ge 2 ] && [ "$slice_count" -le "$MAX_SLICES" ] \
  || fail 'source-slice count is outside the fixed profile'

combined_source_bytes=0
source_index=1
while [ "$source_index" -le "$source_count" ]; do
  IFS="$TAB" read -r kind parsed_index source_bytes source_sha extra \
    || fail 'missing source authority'
  [ "$kind" = 'source' ] && [ -z "${extra:-}" ] \
    || fail 'invalid source authority'
  valid_uint "$parsed_index" && valid_uint "$source_bytes" \
    && valid_sha256 "$source_sha" || fail 'invalid source commitment'
  [ "$parsed_index" -eq "$source_index" ] || fail 'source order changed'
  [ "$source_bytes" -ge 1024 ] && [ "$source_bytes" -le "$MAX_SOURCE_BYTES" ] \
    || fail 'source byte length is outside the fixed bound'
  combined_source_bytes=$((combined_source_bytes + source_bytes))
  [ "$combined_source_bytes" -le "$MAX_COMBINED_SOURCE_BYTES" ] \
    || fail 'combined sources exceed the fixed bound'
  source_path=$(printf '%s/source-%02d.mp4' "$work" "$source_index")
  read_blob "$source_path" "$source_bytes" "$source_sha"

  stream_types=$($FFPROBE -v error -show_entries stream=codec_type \
    -of default=nw=1:nk=1 "$source_path") \
    || fail 'source stream inspection failed'
  [ "$(printf '%s\n' "$stream_types" | grep -c '^video$')" -eq 1 ] \
    && [ "$(printf '%s\n' "$stream_types" | grep -c '^audio$')" -eq 1 ] \
    && [ "$(printf '%s\n' "$stream_types" | sed '/^$/d' | wc -l | tr -d ' ')" -eq 2 ] \
    || fail 'source must contain exactly one video and one audio stream'
  descriptor_path=$(printf '%s/source-%02d.audio' "$work" "$source_index")
  $FFPROBE -v error -select_streams a:0 \
    -show_entries stream=codec_name,sample_rate,channels,start_time,time_base,duration_ts \
    -of default=nw=1 "$source_path" > "$descriptor_path" \
    || fail 'source audio descriptor failed'
  source_codec=$(sed -n 's/^codec_name=//p' "$descriptor_path")
  case "$source_codec" in
    aac|alac|flac|pcm_s16le|pcm_s24le) ;;
    *) fail 'source audio codec is outside the fixed profile' ;;
  esac
  grep -Fx 'sample_rate=48000' "$descriptor_path" >/dev/null \
    || fail 'source audio must use 48 kHz sample timing'
  source_channels=$(sed -n 's/^channels=//p' "$descriptor_path")
  case "$source_channels" in 1|2) ;; *) fail 'source audio must be mono or stereo' ;; esac
  grep -Fx 'time_base=1/48000' "$descriptor_path" >/dev/null \
    || fail 'source audio time base is not sample-exact'
  source_start=$(sed -n 's/^start_time=//p' "$descriptor_path")
  awk -v start="$source_start" 'BEGIN {
    if (start !~ /^-?[0-9]+([.][0-9]+)?$/) exit 1
    exit(start >= -0.000001 && start <= 0.000001 ? 0 : 1)
  }' \
    || fail 'source audio does not start at timeline zero'
  source_duration_samples=$(sed -n 's/^duration_ts=//p' "$descriptor_path")
  valid_uint "$source_duration_samples" && [ "$source_duration_samples" -gt 0 ] \
    || fail 'source audio duration is not sample-exact'
  printf '%s\n' "$source_duration_samples" \
    > "$(printf '%s/source-%02d.samples' "$work" "$source_index")"
  source_index=$((source_index + 1))
done

expected_timeline_start=0
slice_index=1
: > "$work/slices.tsv"
while [ "$slice_index" -le "$slice_count" ]; do
  IFS="$TAB" read -r kind parsed_index selected_source source_start source_end timeline_start timeline_end boundary extra \
    || fail 'missing source-slice authority'
  [ "$kind" = 'slice' ] && [ -z "${extra:-}" ] \
    || fail 'invalid source-slice authority'
  for value in "$parsed_index" "$selected_source" "$source_start" "$source_end" "$timeline_start" "$timeline_end"; do
    valid_uint "$value" || fail 'non-integer source-slice authority'
  done
  [ "$parsed_index" -eq "$slice_index" ] \
    && [ "$selected_source" -ge 1 ] \
    && [ "$selected_source" -le "$source_count" ] \
    && [ "$source_end" -gt "$source_start" ] \
    && [ "$timeline_start" -eq "$expected_timeline_start" ] \
    && [ "$timeline_end" -gt "$timeline_start" ] \
    && [ $((source_end - source_start)) -eq $((timeline_end - timeline_start)) ] \
    || fail 'source-slice timing is not exact and contiguous'
  if [ "$slice_index" -eq 1 ]; then
    [ "$boundary" = 'timeline_start' ] || fail 'first slice lost timeline start'
  else
    [ "$boundary" = 'approved_hard_cut' ] || fail 'slice boundary is not an approved hard cut'
  fi
  source_duration_samples=$(cat "$(printf '%s/source-%02d.samples' "$work" "$selected_source")")
  source_end_sample=$((source_end * SAMPLES_PER_FRAME))
  [ "$source_end_sample" -le "$source_duration_samples" ] \
    || fail 'source slice exceeds immutable source-audio duration'
  printf '%s\t%s\t%s\t%s\t%s\n' \
    "$slice_index" "$selected_source" "$source_start" "$source_end" "$boundary" \
    >> "$work/slices.tsv"
  expected_timeline_start=$timeline_end
  slice_index=$((slice_index + 1))
done
[ "$expected_timeline_start" -eq "$total_frames" ] \
  || fail 'source slices do not cover the complete audio timeline'
IFS= read -r terminator || fail 'missing protocol terminator'
[ "$terminator" = 'end' ] || fail 'invalid protocol terminator'

fifo="$work/program-audio.raw.pipe"
mkfifo "$fifo"
slice_fifo="$work/source-slice.raw.pipe"
mkfifo "$slice_fifo"
exec 5<> "$fifo"
$FFMPEG -hide_banner -loglevel error -nostdin \
  -f s24le -ar "$SAMPLE_RATE" -ac "$CHANNELS" -i "$fifo" \
  -map 0:a:0 -c:a flac -sample_fmt s32 -compression_level 5 \
  -fflags +bitexact -map_metadata -1 -metadata creation_time=1970-01-01T00:00:00Z \
  -f flac pipe:1 5>&- &
encoder_pid=$!
exec 3> "$fifo"
exec 5>&-

while IFS="$TAB" read -r parsed_index selected_source source_start source_end boundary; do
  source_path=$(printf '%s/source-%02d.mp4' "$work" "$selected_source")
  source_start_sample=$((source_start * SAMPLES_PER_FRAME))
  source_end_sample=$((source_end * SAMPLES_PER_FRAME))
  expected_slice_samples=$((source_end_sample - source_start_sample))
  expected_slice_bytes=$((expected_slice_samples * BYTES_PER_SAMPLE_FRAME))
  slice_blocks=$((expected_slice_bytes / 65536))
  slice_remainder=$((expected_slice_bytes % 65536))
  slice_count_path="$work/slice-${parsed_index}.count"
  slice_remainder_count_path="$work/slice-${parsed_index}.remainder-count"
  slice_extra_path="$work/slice-${parsed_index}.extra"
  exec 5<> "$slice_fifo"
  $FFMPEG -hide_banner -loglevel error -nostdin \
    -i "$source_path" -map 0:a:0 \
    -af "atrim=start_sample=${source_start_sample}:end_sample=${source_end_sample},asetpts=N/SR/TB,aformat=sample_fmts=s32:sample_rates=48000:channel_layouts=stereo" \
    -c:a pcm_s24le -f s24le pipe:1 5>&- > "$slice_fifo" &
  slice_pid=$!
  exec 4< "$slice_fifo"
  exec 5>&-
  if [ "$slice_blocks" -gt 0 ]; then
    dd bs=65536 count="$slice_blocks" iflag=fullblock status=none <&4 \
      | tee /proc/self/fd/3 \
      | wc -c | tr -d ' ' > "$slice_count_path"
    [ "$(cat "$slice_count_path")" -eq $((slice_blocks * 65536)) ] \
      || fail "source-slice ${parsed_index} ended before its exact sample count"
  else
    : > "$slice_count_path"
  fi
  if [ "$slice_remainder" -gt 0 ]; then
    dd bs="$slice_remainder" count=1 iflag=fullblock status=none <&4 \
      | tee /proc/self/fd/3 \
      | wc -c | tr -d ' ' > "$slice_remainder_count_path"
    [ "$(cat "$slice_remainder_count_path")" -eq "$slice_remainder" ] \
      || fail "source-slice ${parsed_index} ended before its exact remainder"
  else
    : > "$slice_remainder_count_path"
  fi
  dd bs=1 count=1 status=none <&4 > "$slice_extra_path"
  exec 4<&-
  [ "$(stat -c '%s' "$slice_extra_path")" -eq 0 ] \
    || fail "source-slice ${parsed_index} exceeded its exact sample count"
  if ! wait "$slice_pid"; then
    slice_pid=
    fail "source-slice ${parsed_index} extraction failed"
  fi
  slice_pid=
done < "$work/slices.tsv"

exec 3>&-
if ! wait "$encoder_pid"; then
  encoder_pid=
  fail 'lossless continuous program-audio encoding failed'
fi
encoder_pid=
