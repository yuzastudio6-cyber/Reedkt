#!/bin/sh
set -eu

FFMPEG=/opt/reeditpro-ffmpeg/bin/ffmpeg
FFPROBE=/opt/reeditpro-ffmpeg/bin/ffprobe
TAB=$(printf '\t')
MAGIC=REEDITPRO_FFMPEG_SOURCE_SLICE_FINALIZER_V1
MAX_CHUNKS=16
MAX_CHUNK_BYTES=268435456
MAX_SOURCE_BYTES=201326592
MAX_OUTPUT_BYTES=268435456

fail() {
  printf '%s\n' "source-slice finalizer failed: $*" >&2
  exit 1
}

read_line() {
  IFS= read -r value || fail "missing $1"
  [ "$value" = "$2" ] || fail "invalid $1"
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
  IFS= read -r separator || fail 'missing blob delimiter'
  [ -z "$separator" ] || fail 'invalid blob delimiter'
  [ "$(stat -c '%s' "$destination")" = "$expected_bytes" ] \
    || fail 'blob length changed'
  printf '%s  %s\n' "$expected_sha256" "$destination" \
    | sha256sum --check --strict - >/dev/null \
    || fail 'blob checksum changed'
  chmod 0600 "$destination"
  signature=$(dd if="$destination" bs=1 skip=4 count=4 status=none)
  [ "$signature" = 'ftyp' ] || fail 'blob is not an MP4'
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

work=$(mktemp -d /tmp/reeditpro-source-slice-finalizer.XXXXXX)
trap 'rm -rf "$work"' EXIT HUP INT TERM
umask 077

IFS= read -r magic || fail 'missing protocol magic'
[ "$magic" = "$MAGIC" ] || fail 'unsupported protocol magic'
IFS="$TAB" read -r kind width height fps duration_frames source_start source_end chunk_count extra \
  || fail 'missing frame authority'
[ "$kind" = 'frame' ] && [ -z "${extra:-}" ] || fail 'invalid frame authority'
for value in "$width" "$height" "$fps" "$duration_frames" "$source_start" "$source_end" "$chunk_count"; do
  valid_uint "$value" || fail 'non-integer frame authority'
done
case "${width}x${height}" in
  3840x2160|2160x3840|2160x2160|2160x2700|2880x2160) ;;
  *) fail 'unsupported 4K frame' ;;
esac
case "$fps" in 24|30) ;; *) fail 'unsupported frame rate' ;; esac
[ "$duration_frames" -ge 241 ] && [ "$duration_frames" -le 3840 ] \
  || fail 'duration is outside the v3 profile'
[ "$source_end" -gt "$source_start" ] \
  && [ $((source_end - source_start)) -eq "$duration_frames" ] \
  || fail 'source range does not conserve duration'
[ "$chunk_count" -ge 2 ] && [ "$chunk_count" -le "$MAX_CHUNKS" ] \
  || fail 'chunk count is outside the v3 profile'

expected_global_start=0
expected_source_start=$source_start
first_descriptor=
index=1
while [ "$index" -le "$chunk_count" ]; do
  IFS="$TAB" read -r kind chunk_index global_start global_end chunk_source_start chunk_source_end chunk_bytes chunk_sha extra \
    || fail 'missing chunk authority'
  [ "$kind" = 'chunk' ] && [ -z "${extra:-}" ] || fail 'invalid chunk authority'
  for value in "$chunk_index" "$global_start" "$global_end" "$chunk_source_start" "$chunk_source_end" "$chunk_bytes"; do
    valid_uint "$value" || fail 'non-integer chunk authority'
  done
  valid_sha256 "$chunk_sha" || fail 'invalid chunk checksum'
  [ "$chunk_index" -eq "$index" ] \
    && [ "$global_start" -eq "$expected_global_start" ] \
    && [ "$chunk_source_start" -eq "$expected_source_start" ] \
    && [ "$global_end" -gt "$global_start" ] \
    && [ "$chunk_source_end" -gt "$chunk_source_start" ] \
    && [ $((global_end - global_start)) -eq $((chunk_source_end - chunk_source_start)) ] \
    || fail 'chunk timing is not exact and contiguous'
  chunk_frames=$((global_end - global_start))
  [ "$chunk_frames" -ge 24 ] && [ "$chunk_frames" -le 240 ] \
    || fail 'chunk duration is outside the fixed render bound'
  [ "$chunk_bytes" -ge 1024 ] && [ "$chunk_bytes" -le "$MAX_CHUNK_BYTES" ] \
    || fail 'chunk byte length is outside the fixed bound'
  chunk_path=$(printf '%s/chunk-%04d.mp4' "$work" "$index")
  read_blob "$chunk_path" "$chunk_bytes" "$chunk_sha"

  stream_types=$($FFPROBE -v error -show_entries stream=codec_type \
    -of default=nw=1:nk=1 "$chunk_path") \
    || fail 'chunk stream inspection failed'
  [ "$(printf '%s\n' "$stream_types" | grep -c '^video$')" -eq 1 ] \
    || fail 'chunk must contain one video stream'
  frame_count=$($FFPROBE -v error -count_frames -select_streams v:0 \
    -show_entries stream=nb_read_frames -of default=nw=1:nk=1 "$chunk_path") \
    || fail 'chunk frame count failed'
  [ "$frame_count" = "$chunk_frames" ] || fail 'chunk frame count changed'
  first_frame=$($FFPROBE -v error -select_streams v:0 -read_intervals '%+#1' \
    -show_entries frame=key_frame,pict_type -of csv=p=0 "$chunk_path" | head -n 1) \
    || fail 'chunk first-frame inspection failed'
  case "$first_frame" in 1,I*) ;; *) fail 'chunk does not start on an independent keyframe' ;; esac
  descriptor_path=$(printf '%s/descriptor-%04d.txt' "$work" "$index")
  $FFPROBE -v error -show_data_hash sha256 -select_streams v:0 \
    -show_entries stream=codec_name,profile,level,width,height,pix_fmt,color_range,color_space,color_transfer,color_primaries,r_frame_rate,avg_frame_rate,time_base,codec_tag_string,extradata_size,extradata_hash \
    -of default=nw=1 "$chunk_path" > "$descriptor_path" \
    || fail 'chunk compatibility descriptor failed'
  grep -Fx 'codec_name=h264' "$descriptor_path" >/dev/null \
    && grep -Fx "width=$width" "$descriptor_path" >/dev/null \
    && grep -Fx "height=$height" "$descriptor_path" >/dev/null \
    && grep -Fx 'pix_fmt=yuv420p' "$descriptor_path" >/dev/null \
    && grep -Fx 'color_space=bt709' "$descriptor_path" >/dev/null \
    && grep -Fx 'color_transfer=bt709' "$descriptor_path" >/dev/null \
    && grep -Fx 'color_primaries=bt709' "$descriptor_path" >/dev/null \
    && grep -Fx "r_frame_rate=${fps}/1" "$descriptor_path" >/dev/null \
    && grep -Eq '^extradata_hash=SHA256:[a-f0-9]{64}$' "$descriptor_path" \
    || fail 'chunk codec/frame/color compatibility is unsupported'
  if [ -z "$first_descriptor" ]; then
    first_descriptor=$descriptor_path
  else
    cmp -s "$first_descriptor" "$descriptor_path" \
      || fail 'chunk codec extradata or timebase is incompatible'
  fi
  chunk_duration_seconds=$(awk -v frames="$chunk_frames" -v rate="$fps" \
    'BEGIN { printf "%.9f", frames / rate }')
  printf "file 'chunk-%04d.mp4'\nduration %s\n" \
    "$index" "$chunk_duration_seconds" >> "$work/concat.txt"
  expected_global_start=$global_end
  expected_source_start=$chunk_source_end
  index=$((index + 1))
done
[ "$expected_global_start" -eq "$duration_frames" ] \
  && [ "$expected_source_start" -eq "$source_end" ] \
  || fail 'chunks do not cover the complete approved range'

IFS="$TAB" read -r kind source_bytes source_sha extra || fail 'missing source authority'
[ "$kind" = 'source' ] && [ -z "${extra:-}" ] || fail 'invalid source authority'
valid_uint "$source_bytes" && valid_sha256 "$source_sha" || fail 'invalid source commitment'
[ "$source_bytes" -ge 1024 ] && [ "$source_bytes" -le "$MAX_SOURCE_BYTES" ] \
  || fail 'source byte length is outside the fixed bound'
source_path="$work/source.mp4"
read_blob "$source_path" "$source_bytes" "$source_sha"
read_line 'protocol terminator' 'end'

source_stream_types=$($FFPROBE -v error -show_entries stream=codec_type \
  -of default=nw=1:nk=1 "$source_path") \
  || fail 'source stream inspection failed'
[ "$(printf '%s\n' "$source_stream_types" | grep -c '^audio$')" -eq 1 ] \
  || fail 'source must contain exactly one approved audio stream'

start_seconds=$(awk -v frames="$source_start" -v rate="$fps" 'BEGIN { printf "%.9f", frames / rate }')
duration_seconds=$(awk -v frames="$duration_frames" -v rate="$fps" 'BEGIN { printf "%.9f", frames / rate }')
(
  cd "$work"
  "$FFMPEG" -hide_banner -loglevel error -nostdin \
    -f concat -safe 1 -i concat.txt \
    -ss "$start_seconds" -i source.mp4 \
    -map 0:v:0 -map 1:a:0 \
    -filter:a "atrim=duration=${duration_seconds},asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo" \
    -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 \
    -map_metadata -1 -map_chapters -1 -threads 1 \
    -t "$duration_seconds" \
    -movflags +faststart -max_muxing_queue_size 4096 \
    -y final.mp4
) || fail 'fixed FFmpeg stream-copy finalization failed'

output_path="$work/final.mp4"
output_bytes=$(stat -c '%s' "$output_path")
[ "$output_bytes" -ge 1024 ] && [ "$output_bytes" -le "$MAX_OUTPUT_BYTES" ] \
  || fail 'final MP4 is outside the fixed output bound'
[ "$(dd if="$output_path" bs=1 skip=4 count=4 status=none)" = 'ftyp' ] \
  || fail 'final output is not an MP4'
output_stream_types=$($FFPROBE -v error -show_entries stream=codec_type \
  -of default=nw=1:nk=1 "$output_path") \
  || fail 'final stream inspection failed'
[ "$(printf '%s\n' "$output_stream_types" | grep -c '^video$')" -eq 1 ] \
  && [ "$(printf '%s\n' "$output_stream_types" | grep -c '^audio$')" -eq 1 ] \
  || fail 'final output must contain one video and one audio stream'
output_probe="$work/final-probe.txt"
$FFPROBE -v error -count_frames \
  -show_entries format=format_name,start_time,duration:stream=codec_name,codec_type,start_time,width,height,pix_fmt,color_space,color_transfer,color_primaries,r_frame_rate,sample_rate,channels,nb_read_frames \
  -of default=nw=1 "$output_path" > "$output_probe" \
  || fail 'final output probe failed'
grep -Fx 'codec_name=h264' "$output_probe" >/dev/null \
  && grep -Fx "width=$width" "$output_probe" >/dev/null \
  && grep -Fx "height=$height" "$output_probe" >/dev/null \
  && grep -Fx 'pix_fmt=yuv420p' "$output_probe" >/dev/null \
  && grep -Fx 'color_space=bt709' "$output_probe" >/dev/null \
  && grep -Fx 'color_transfer=bt709' "$output_probe" >/dev/null \
  && grep -Fx 'color_primaries=bt709' "$output_probe" >/dev/null \
  && grep -Fx "r_frame_rate=${fps}/1" "$output_probe" >/dev/null \
  && grep -Fx "nb_read_frames=$duration_frames" "$output_probe" >/dev/null \
  && grep -Fx 'codec_name=aac' "$output_probe" >/dev/null \
  && grep -Fx 'sample_rate=48000' "$output_probe" >/dev/null \
  && grep -Fx 'channels=2' "$output_probe" >/dev/null \
  || fail 'final output failed fixed H.264/AAC/frame/color QA'
format_start=$($FFPROBE -v error -show_entries format=start_time \
  -of default=nw=1:nk=1 "$output_path") \
  || fail 'final format timestamp probe failed'
video_start=$($FFPROBE -v error -select_streams v:0 \
  -show_entries stream=start_time -of default=nw=1:nk=1 "$output_path") \
  || fail 'final video timestamp probe failed'
audio_start=$($FFPROBE -v error -select_streams a:0 \
  -show_entries stream=start_time -of default=nw=1:nk=1 "$output_path") \
  || fail 'final audio timestamp probe failed'
awk -v format_start="$format_start" -v video_start="$video_start" \
  -v audio_start="$audio_start" -v rate="$fps" \
  'BEGIN {
    tolerance=(1/rate)+0.001
    stream_delta=video_start-audio_start
    if (stream_delta<0) stream_delta=-stream_delta
    exit(format_start == 0 && video_start >= 0 && audio_start >= 0 &&
      video_start <= tolerance && audio_start <= tolerance &&
      stream_delta <= tolerance ? 0 : 1)
  }' || fail 'final output timestamps are not normalized within one frame'
output_duration=$(awk -F= '$1 == "duration" { print $2; exit }' "$output_probe")
awk -v actual="$output_duration" -v expected="$duration_seconds" -v rate="$fps" \
  'BEGIN { delta=actual-expected; if (delta<0) delta=-delta; exit(delta <= (1/rate + 0.001) ? 0 : 1) }' \
  || fail 'final output duration drift exceeds one frame'

cat "$output_path"
