#!/bin/sh
set -eu

FFMPEG=/opt/reeditpro-ffmpeg/bin/ffmpeg
FFPROBE=/opt/reeditpro-ffmpeg/bin/ffprobe
TAB=$(printf '\t')
MAGIC=REEDITPRO_FFMPEG_OBJECT_MEZZANINE_CHUNK_V2
MAX_SOURCES=8
MAX_SLICES=16
MAX_SOURCE_BYTES=201326592
MAX_COMBINED_SOURCE_BYTES=536870912
MAX_OUTPUT_BYTES=536870912

fail() {
  printf '%s\n' "object-mezzanine chunk failed: $*" >&2
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
  IFS= read -r separator || fail 'missing blob delimiter'
  [ -z "$separator" ] || fail 'invalid blob delimiter'
  [ "$(stat -c '%s' "$destination")" = "$expected_bytes" ] \
    || fail 'source blob length changed'
  printf '%s  %s\n' "$expected_sha256" "$destination" \
    | sha256sum --check --strict - >/dev/null \
    || fail 'source blob checksum changed'
  chmod 0600 "$destination"
  [ "$(dd if="$destination" bs=1 skip=4 count=4 status=none)" = 'ftyp' ] \
    || fail 'source blob is not an MP4'
}

work=$(mktemp -d /tmp/reeditpro-object-mezzanine-chunk.XXXXXX)
trap 'rm -rf "$work"' EXIT HUP INT TERM
umask 077

IFS= read -r magic || fail 'missing protocol magic'
[ "$magic" = "$MAGIC" ] || fail 'unsupported protocol magic'
IFS="$TAB" read -r kind width height fps duration_frames global_start global_end source_count slice_count extra \
  || fail 'missing frame authority'
[ "$kind" = 'frame' ] && [ -z "${extra:-}" ] || fail 'invalid frame authority'
for value in "$width" "$height" "$fps" "$duration_frames" "$global_start" "$global_end" "$source_count" "$slice_count"; do
  valid_uint "$value" || fail 'non-integer frame authority'
done
case "${width}x${height}" in
  3840x2160|2160x3840|2160x2160|2160x2700|2880x2160) ;;
  *) fail 'unsupported 4K frame' ;;
esac
[ "$fps" -eq 30 ] || fail 'object-chunk profile requires 30 fps'
[ "$duration_frames" -ge 1350 ] && [ "$duration_frames" -le 5400 ] \
  || fail 'duration is outside the fixed object-chunk profile'
[ "$global_end" -eq $((global_start + duration_frames)) ] \
  || fail 'object-chunk global range is invalid'
[ "$source_count" -ge 1 ] && [ "$source_count" -le "$MAX_SOURCES" ] \
  || fail 'source count is outside the fixed profile'
[ "$slice_count" -ge 1 ] && [ "$slice_count" -le "$MAX_SLICES" ] \
  || fail 'slice count is outside the fixed profile'

combined_source_bytes=0
source_index=1
while [ "$source_index" -le "$source_count" ]; do
  IFS="$TAB" read -r kind parsed_index source_bytes source_sha extra \
    || fail 'missing source authority'
  [ "$kind" = 'source' ] && [ -z "${extra:-}" ] \
    || fail 'invalid source authority'
  valid_uint "$parsed_index" && valid_uint "$source_bytes" \
    && valid_sha256 "$source_sha" || fail 'invalid source commitment'
  [ "$parsed_index" -eq "$source_index" ] \
    || fail 'source order changed'
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
    || fail 'source must contain exactly one video stream'
  source_frames=$($FFPROBE -v error -count_frames -select_streams v:0 \
    -show_entries stream=nb_read_frames -of default=nw=1:nk=1 "$source_path") \
    || fail 'source frame count failed'
  valid_uint "$source_frames" && [ "$source_frames" -ge 1 ] \
    || fail 'source frame count is invalid'
  printf '%s\n' "$source_frames" > "$(printf '%s/source-%02d.frames' "$work" "$source_index")"
  descriptor_path=$(printf '%s/source-%02d.descriptor' "$work" "$source_index")
  $FFPROBE -v error -show_data_hash sha256 -select_streams v:0 \
    -show_entries stream=codec_name,profile,level,width,height,pix_fmt,color_range,color_space,color_transfer,color_primaries,r_frame_rate,avg_frame_rate,time_base,codec_tag_string,extradata_size,extradata_hash,has_b_frames \
    -of default=nw=1 "$source_path" > "$descriptor_path" \
    || fail 'source compatibility descriptor failed'
  grep -Fx 'codec_name=h264' "$descriptor_path" >/dev/null \
    && grep -Fx 'pix_fmt=yuv420p' "$descriptor_path" >/dev/null \
    && grep -Fx 'color_range=tv' "$descriptor_path" >/dev/null \
    && grep -Fx 'color_space=bt709' "$descriptor_path" >/dev/null \
    && grep -Fx 'color_transfer=bt709' "$descriptor_path" >/dev/null \
    && grep -Fx 'color_primaries=bt709' "$descriptor_path" >/dev/null \
    && grep -Fx 'r_frame_rate=30/1' "$descriptor_path" >/dev/null \
    && grep -Fx 'avg_frame_rate=30/1' "$descriptor_path" >/dev/null \
    || fail 'source codec/frame/color authority is unsupported'
  source_index=$((source_index + 1))
done

expected_local_start=0
expected_global_start=$global_start
slice_index=1
: > "$work/filter-complex.txt"
while [ "$slice_index" -le "$slice_count" ]; do
  IFS="$TAB" read -r kind parsed_index selected_source source_start source_end local_start local_end slice_global_start slice_global_end boundary extra \
    || fail 'missing source-slice authority'
  [ "$kind" = 'slice' ] && [ -z "${extra:-}" ] \
    || fail 'invalid source-slice authority'
  for value in "$parsed_index" "$selected_source" "$source_start" "$source_end" "$local_start" "$local_end" "$slice_global_start" "$slice_global_end"; do
    valid_uint "$value" || fail 'non-integer source-slice authority'
  done
  [ "$parsed_index" -eq "$slice_index" ] \
    && [ "$selected_source" -ge 1 ] \
    && [ "$selected_source" -le "$source_count" ] \
    && [ "$source_end" -gt "$source_start" ] \
    && [ "$local_start" -eq "$expected_local_start" ] \
    && [ "$slice_global_start" -eq "$expected_global_start" ] \
    && [ "$local_end" -gt "$local_start" ] \
    && [ "$slice_global_end" -gt "$slice_global_start" ] \
    && [ $((source_end - source_start)) -eq $((local_end - local_start)) ] \
    && [ $((source_end - source_start)) -eq $((slice_global_end - slice_global_start)) ] \
    || fail 'source-slice timing is not exact and contiguous'
  if [ "$slice_index" -eq 1 ]; then
    if [ "$global_start" -eq 0 ]; then
      [ "$boundary" = 'timeline_start' ] \
        || fail 'first program slice lost timeline-start boundary'
    else
      [ "$boundary" = 'approved_hard_cut' ] \
        || [ "$boundary" = 'continuous_technical_split' ] \
        || fail 'continued chunk lost approved or technical boundary'
    fi
  else
    [ "$boundary" = 'approved_hard_cut' ] \
      || [ "$boundary" = 'continuous_technical_split' ] \
      || fail 'slice boundary is not approved'
  fi
  source_frames=$(cat "$(printf '%s/source-%02d.frames' "$work" "$selected_source")")
  [ "$source_end" -le "$source_frames" ] \
    || fail 'source slice exceeds immutable source frame capacity'
  selected_input=$((selected_source - 1))
  printf '[%d:v:0]trim=start_frame=%d:end_frame=%d,setpts=PTS-STARTPTS,scale=%d:%d:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=%d:%d:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=%d,format=yuv420p,setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709[v%02d];\n' \
    "$selected_input" "$source_start" "$source_end" \
    "$width" "$height" "$width" "$height" "$fps" "$slice_index" \
    >> "$work/filter-complex.txt"
  expected_local_start=$local_end
  expected_global_start=$slice_global_end
  slice_index=$((slice_index + 1))
done
[ "$expected_local_start" -eq "$duration_frames" ] \
  && [ "$expected_global_start" -eq "$global_end" ] \
  || fail 'source slices do not cover the complete object chunk'
IFS= read -r terminator || fail 'missing protocol terminator'
[ "$terminator" = 'end' ] || fail 'invalid protocol terminator'

if [ "$slice_count" -eq 1 ]; then
  printf '[v01]null[vout]\n' >> "$work/filter-complex.txt"
else
  slice_index=1
  while [ "$slice_index" -le "$slice_count" ]; do
    printf '[v%02d]' "$slice_index" >> "$work/filter-complex.txt"
    slice_index=$((slice_index + 1))
  done
  printf 'concat=n=%d:v=1:a=0,format=yuv420p,setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709[vout]\n' \
    "$slice_count" >> "$work/filter-complex.txt"
fi

set --
source_index=1
while [ "$source_index" -le "$source_count" ]; do
  source_path=$(printf '%s/source-%02d.mp4' "$work" "$source_index")
  set -- "$@" -i "$source_path"
  source_index=$((source_index + 1))
done

$FFMPEG -hide_banner -loglevel error -nostdin "$@" \
  -filter_complex_script "$work/filter-complex.txt" -map '[vout]' \
  -frames:v "$duration_frames" -an -sn -dn \
  -c:v libvpx-vp9 -b:v 0 -crf 12 -deadline good -cpu-used 4 \
  -row-mt 1 -threads 2 -tile-columns 0 -frame-parallel 0 \
  -g 240 -lag-in-frames 0 -auto-alt-ref 0 -pix_fmt yuv420p \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -fps_mode cfr -avoid_negative_ts make_zero -fflags +bitexact \
  -map_metadata -1 -map_chapters -1 \
  -metadata creation_time=1970-01-01T00:00:00Z \
  -f matroska -y "$work/final.mkv" \
  || fail 'frame-exact VP9 Matroska object-chunk assembly failed'

output_path="$work/final.mkv"
output_bytes=$(stat -c '%s' "$output_path")
[ "$output_bytes" -ge 1024 ] && [ "$output_bytes" -le "$MAX_OUTPUT_BYTES" ] \
  || fail 'object chunk is outside the fixed output bound'
signature=$(od -An -tx1 -N4 "$output_path" | tr -d ' \n')
[ "$signature" = '1a45dfa3' ] || fail 'object chunk is not Matroska'
output_stream_types=$($FFPROBE -v error -show_entries stream=codec_type \
  -of default=nw=1:nk=1 "$output_path") \
  || fail 'object-chunk stream inspection failed'
[ "$(printf '%s\n' "$output_stream_types" | grep -c '^video$')" -eq 1 ] \
  && [ "$(printf '%s\n' "$output_stream_types" | grep -c '^audio$')" -eq 0 ] \
  || fail 'object chunk must contain one video stream and no audio'
output_probe="$work/final-probe.txt"
$FFPROBE -v error -count_frames \
  -show_entries format=format_name,start_time,duration:stream=codec_name,codec_type,start_time,width,height,pix_fmt,color_range,color_space,color_transfer,color_primaries,r_frame_rate,avg_frame_rate,nb_read_frames,has_b_frames \
  -of default=nw=1 "$output_path" > "$output_probe" \
  || fail 'object-chunk output probe failed'
grep -F 'format_name=matroska,webm' "$output_probe" >/dev/null \
  && grep -Fx 'codec_name=vp9' "$output_probe" >/dev/null \
  && grep -Fx "width=$width" "$output_probe" >/dev/null \
  && grep -Fx "height=$height" "$output_probe" >/dev/null \
  && grep -Fx 'pix_fmt=yuv420p' "$output_probe" >/dev/null \
  && grep -Fx 'color_range=tv' "$output_probe" >/dev/null \
  && grep -Fx 'color_space=bt709' "$output_probe" >/dev/null \
  && grep -Fx 'color_transfer=bt709' "$output_probe" >/dev/null \
  && grep -Fx 'color_primaries=bt709' "$output_probe" >/dev/null \
  && grep -Fx 'r_frame_rate=30/1' "$output_probe" >/dev/null \
  && grep -Fx 'avg_frame_rate=30/1' "$output_probe" >/dev/null \
  && grep -Fx 'has_b_frames=0' "$output_probe" >/dev/null \
  && grep -Fx "nb_read_frames=$duration_frames" "$output_probe" >/dev/null \
  || fail 'object chunk failed VP9/frame/color QA'
format_start=$($FFPROBE -v error -show_entries format=start_time \
  -of default=nw=1:nk=1 "$output_path") \
  || fail 'object-chunk format timestamp probe failed'
video_start=$($FFPROBE -v error -select_streams v:0 \
  -show_entries stream=start_time -of default=nw=1:nk=1 "$output_path") \
  || fail 'object-chunk video timestamp probe failed'
duration_seconds=$(awk -v frames="$duration_frames" -v rate="$fps" \
  'BEGIN { printf "%.9f", frames / rate }')
output_duration=$($FFPROBE -v error -show_entries format=duration \
  -of default=nw=1:nk=1 "$output_path") \
  || fail 'object-chunk duration probe failed'
awk -v format_start="$format_start" -v video_start="$video_start" \
  -v actual="$output_duration" -v expected="$duration_seconds" -v rate="$fps" \
  'BEGIN {
    tolerance=(1/rate)+0.001
    delta=actual-expected
    if (delta<0) delta=-delta
    exit(format_start >= 0 && format_start <= tolerance &&
      video_start >= 0 && video_start <= tolerance && delta <= tolerance ? 0 : 1)
  }' || fail 'object-chunk timestamps or duration are outside one frame'

cat "$output_path"
