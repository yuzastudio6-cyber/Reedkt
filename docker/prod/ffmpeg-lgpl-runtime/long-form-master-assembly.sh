#!/bin/sh
set -eu

FFMPEG=/opt/reeditpro-ffmpeg/bin/ffmpeg
TAB=$(printf '\t')
MAGIC=REEDITPRO_FFMPEG_LONG_FORM_MASTER_ASSEMBLY_V1
MAX_CHUNKS=124
MAX_BLOCK_BYTES=65536
ACTIVE_WORK=/tmp/reeditpro-long-form-master-active

fail() {
  printf '%s\n' "long-form master assembly failed: $*" >&2
  exit 1
}
valid_uint() { case "$1" in ''|*[!0-9]*) return 1 ;; *) return 0 ;; esac; }
valid_sha256() {
  [ "${#1}" -eq 64 ] || return 1
  case "$1" in *[!a-f0-9]*) return 1 ;; *) return 0 ;; esac
}

write_program_audio() {
  work=$ACTIVE_WORK
  attempt=0
  until [ -p "$work/audio.out" ] \
    && [ -f "$work/audio.expected-bytes" ] \
    && [ -f "$work/audio.expected-sha256" ] \
    && [ -f "$work/audio.ready" ]; do
    [ ! -f "$work/audio.failed" ] || fail 'master assembly already failed'
    attempt=$((attempt + 1))
    [ "$attempt" -le 600 ] || fail 'audio writer readiness timed out'
    sleep 0.1
  done
  writer_ok=false
  trap '[ "$writer_ok" = true ] || { : > "$work/audio.failed" 2>/dev/null || true; }' EXIT
  trap ': > "$work/audio.failed" 2>/dev/null || true; exit 1' HUP INT TERM
  expected_bytes=$(cat "$work/audio.expected-bytes")
  expected_sha=$(cat "$work/audio.expected-sha256")
  valid_uint "$expected_bytes" && valid_sha256 "$expected_sha" \
    || fail 'audio writer commitment is invalid'
  mkfifo "$work/audio.count"
  (wc -c < "$work/audio.count" > "$work/audio.observed-bytes") &
  count_pid=$!
  tee "$work/audio.out" "$work/audio.count" | sha256sum > "$work/audio.observed-sha256"
  wait "$count_pid" || fail 'audio byte counter failed'
  observed_bytes=$(tr -d '[:space:]' < "$work/audio.observed-bytes")
  observed_sha=$(sed -n 's/  -$//p' "$work/audio.observed-sha256")
  [ "$observed_bytes" = "$expected_bytes" ] \
    && [ "$observed_sha" = "$expected_sha" ] \
    || fail 'program audio changed from its exact commitment'
  printf '%s\t%s\n' "$observed_bytes" "$observed_sha" > "$work/audio.done.tmp"
  mv "$work/audio.done.tmp" "$work/audio.done"
  writer_ok=true
  trap - EXIT HUP INT TERM
}

if [ "$#" -eq 1 ] && [ "$1" = 'long-form-master-audio-writer-v1' ]; then
  write_program_audio
  exit 0
fi

[ "$#" -eq 1 ] && [ "$1" = 'long-form-master-assembly-v1' ] \
  || fail 'unsupported fixed invocation'
work=$ACTIVE_WORK
mkdir -m 0700 "$work"
ffmpeg_pid=
video_pid=
trap '
  [ -z "$ffmpeg_pid" ] || kill "$ffmpeg_pid" 2>/dev/null || true
  [ -z "$video_pid" ] || kill "$video_pid" 2>/dev/null || true
  : > "$work/audio.failed" 2>/dev/null || true
  rm -rf "$work"
' EXIT HUP INT TERM
umask 077

IFS= read -r magic || fail 'missing protocol magic'
[ "$magic" = "$MAGIC" ] || fail 'unsupported protocol magic'
IFS="$TAB" read -r kind width height fps total_frames chunk_count audio_bytes audio_sha extra \
  || fail 'missing timeline authority'
[ "$kind" = timeline ] && [ -z "${extra:-}" ] || fail 'invalid timeline authority'
for value in "$width" "$height" "$fps" "$total_frames" "$chunk_count" "$audio_bytes"; do
  valid_uint "$value" || fail 'non-integer timeline authority'
done
valid_sha256 "$audio_sha" || fail 'invalid audio checksum'
case "${width}x${height}" in
  3840x2160|2160x3840|2160x2160|2160x2700|2880x2160) ;;
  *) fail 'unsupported 4K frame' ;;
esac
[ "$fps" -eq 30 ] && [ "$total_frames" -ge 1350 ] \
  && [ "$total_frames" -le 648000 ] || fail 'unsupported timeline'
[ "$chunk_count" -ge 2 ] && [ "$chunk_count" -le "$MAX_CHUNKS" ] \
  || fail 'unsupported chunk count'
[ "$audio_bytes" -ge 1024 ] && [ "$audio_bytes" -le 8589934592 ] \
  || fail 'unsupported audio byte length'

: > "$work/concat.txt"
index=1
expected_start=0
while [ "$index" -le "$chunk_count" ]; do
  IFS="$TAB" read -r kind parsed_index start end duration bytes sha extra \
    || fail 'missing chunk commitment'
  [ "$kind" = chunk ] && [ -z "${extra:-}" ] || fail 'invalid chunk commitment'
  for value in "$parsed_index" "$start" "$end" "$duration" "$bytes"; do
    valid_uint "$value" || fail 'non-integer chunk commitment'
  done
  valid_sha256 "$sha" || fail 'invalid chunk checksum'
  [ "$parsed_index" -eq "$index" ] && [ "$start" -eq "$expected_start" ] \
    && [ "$end" -eq $((start + duration)) ] \
    && [ "$duration" -ge 1350 ] && [ "$duration" -le 5400 ] \
    && [ "$bytes" -ge 1024 ] && [ "$bytes" -le 536870912 ] \
    || fail 'chunk authority is not exact and contiguous'
  printf '%s\n' "$bytes" > "$(printf '%s/video-%03d.bytes' "$work" "$index")"
  printf '%s\n' "$sha" > "$(printf '%s/video-%03d.expected' "$work" "$index")"
  output_fifo=$(printf '%s/video-%03d.out' "$work" "$index")
  mkfifo "$output_fifo"
  printf "file '%s'\n" "$output_fifo" >> "$work/concat.txt"
  expected_start=$end
  index=$((index + 1))
done
[ "$expected_start" -eq "$total_frames" ] || fail 'chunks do not cover the timeline'
IFS= read -r terminator || fail 'missing header terminator'
[ "$terminator" = begin ] || fail 'invalid header terminator'

audio_out="$work/audio.out"
printf '%s\n' "$audio_bytes" > "$work/audio.expected-bytes"
printf '%s\n' "$audio_sha" > "$work/audio.expected-sha256"
mkfifo "$audio_out"

$FFMPEG -hide_banner -loglevel error -nostdin \
  -f concat -safe 0 -i "$work/concat.txt" -i "$audio_out" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -sn -dn \
  -avoid_negative_ts make_zero -fflags +bitexact -map_metadata -1 -map_chapters -1 \
  -color_range tv -colorspace bt709 -color_trc bt709 -color_primaries bt709 \
  -metadata creation_time=1970-01-01T00:00:00Z \
  -f matroska pipe:1 &
ffmpeg_pid=$!
: > "$work/audio.ready"

current_video=0
video_observed=0
while IFS="$TAB" read -r kind target parsed_index length extra; do
  [ -z "${extra:-}" ] || fail 'unsupported block fields'
  case "$kind:$target" in
    block:video)
      valid_uint "$parsed_index" && valid_uint "$length" \
        || fail 'invalid video block'
      [ "$parsed_index" -ge 1 ] && [ "$parsed_index" -le "$chunk_count" ] \
        && [ "$length" -ge 1 ] && [ "$length" -le "$MAX_BLOCK_BYTES" ] \
        || fail 'video block outside fixed bound'
      if [ "$current_video" -eq 0 ]; then
        [ "$parsed_index" -eq 1 ] || fail 'video blocks changed order'
        current_video=1
        video_in=$(printf '%s/video-%03d.in' "$work" "$current_video")
        video_out=$(printf '%s/video-%03d.out' "$work" "$current_video")
        mkfifo "$video_in"
        (tee "$video_out" < "$video_in" | sha256sum > "$(printf '%s/video-%03d.sha' "$work" "$current_video")") &
        video_pid=$!
        exec 3>"$video_in"
      fi
      [ "$parsed_index" -eq "$current_video" ] || fail 'video block changed chunk'
      dd bs="$length" count=1 iflag=fullblock status=none > "$work/block"
      [ "$(stat -c '%s' "$work/block")" -eq "$length" ] || fail 'short video block'
      IFS= read -r delimiter || fail 'missing video block delimiter'
      [ -z "$delimiter" ] || fail 'invalid video block delimiter'
      cat "$work/block" >&3
      video_observed=$((video_observed + length))
      ;;
    close:video)
      valid_uint "$parsed_index" && [ "$parsed_index" -eq "$current_video" ] \
        && [ "$length" = 0 ] || fail 'invalid video close'
      expected=$(cat "$(printf '%s/video-%03d.bytes' "$work" "$current_video")")
      [ "$video_observed" -eq "$expected" ] || fail 'video byte length changed'
      exec 3>&-
      wait "$video_pid" || fail 'video checksum stream failed'
      actual=$(sed -n 's/  -$//p' "$(printf '%s/video-%03d.sha' "$work" "$current_video")")
      expected_sha=$(cat "$(printf '%s/video-%03d.expected' "$work" "$current_video")")
      [ "$actual" = "$expected_sha" ] || fail 'video checksum changed'
      video_pid=
      video_observed=0
      if [ "$current_video" -lt "$chunk_count" ]; then
        current_video=$((current_video + 1))
        video_in=$(printf '%s/video-%03d.in' "$work" "$current_video")
        video_out=$(printf '%s/video-%03d.out' "$work" "$current_video")
        mkfifo "$video_in"
        (tee "$video_out" < "$video_in" | sha256sum > "$(printf '%s/video-%03d.sha' "$work" "$current_video")") &
        video_pid=$!
        exec 3>"$video_in"
      fi
      ;;
    end:protocol)
      [ "$parsed_index" = 0 ] && [ "$length" = 0 ] || fail 'invalid protocol end'
      break
      ;;
    *) fail 'unsupported block record' ;;
  esac
done
[ "$current_video" -eq "$chunk_count" ] && [ -z "$video_pid" ] \
  || fail 'video input streams did not close exactly once'
audio_wait=0
until [ -f "$work/audio.done" ]; do
  [ ! -f "$work/audio.failed" ] || fail 'program audio writer failed'
  audio_wait=$((audio_wait + 1))
  [ "$audio_wait" -le 216000 ] || fail 'program audio writer timed out'
  sleep 0.1
done
IFS="$TAB" read -r observed_audio_bytes observed_audio_sha extra < "$work/audio.done" \
  || fail 'program audio proof is missing'
[ -z "${extra:-}" ] && [ "$observed_audio_bytes" = "$audio_bytes" ] \
  && [ "$observed_audio_sha" = "$audio_sha" ] \
  || fail 'program audio proof changed'
wait "$ffmpeg_pid" || fail 'VP9/FLAC Matroska stream-copy assembly failed'
ffmpeg_pid=
