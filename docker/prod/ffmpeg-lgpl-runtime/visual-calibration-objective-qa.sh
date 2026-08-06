#!/bin/sh
set -eu

FFMPEG=/opt/reeditpro-ffmpeg/bin/ffmpeg
FFPROBE=/opt/reeditpro-ffmpeg/bin/ffprobe
TAB=$(printf '\t')
MAGIC=REEDITPRO_FFMPEG_VISUAL_CALIBRATION_OBJECTIVE_QA_V1
MAX_CANDIDATE_BYTES=67108864
MAX_REFERENCE_BYTES=16777216

fail() {
  printf '%s\n' "visual calibration objective QA failed: $*" >&2
  exit 1
}
valid_uint() { case "$1" in ''|*[!0-9]*) return 1 ;; *) return 0 ;; esac; }
valid_sha256() {
  [ "${#1}" -eq 64 ] || return 1
  case "$1" in *[!a-f0-9]*) return 1 ;; *) return 0 ;; esac
}
read_blob() {
  destination=$1
  expected_bytes=$2
  expected_sha=$3
  maximum_bytes=$4
  valid_uint "$expected_bytes" && valid_sha256 "$expected_sha" \
    || fail 'blob commitment is invalid'
  [ "$expected_bytes" -ge 12 ] && [ "$expected_bytes" -le "$maximum_bytes" ] \
    || fail 'blob byte length is outside the fixed bound'
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
    || fail 'blob byte length changed'
  printf '%s  %s\n' "$expected_sha" "$destination" \
    | sha256sum --check --strict - >/dev/null || fail 'blob checksum changed'
  chmod 0600 "$destination"
}
millionths() {
  awk -v numerator="$1" -v denominator="$2" \
    'BEGIN { if (denominator <= 0) print 0; else printf "%.0f", (numerator * 1000000) / denominator }'
}
ssim_millionths() {
  candidate_frame=$1
  reference_frame=$2
  width=$3
  height=$4
  log=$5
  "$FFMPEG" -hide_banner -nostdin -v info \
    -i "$candidate_frame" -i "$reference_frame" \
    -filter_complex "[0:v:0]scale=${width}:${height}:flags=bicubic,format=yuv420p[c];[1:v:0]scale=${width}:${height}:flags=bicubic,format=yuv420p[r];[c][r]ssim" \
    -frames:v 1 -an -sn -dn -f null - > /dev/null 2> "$log" \
    || fail 'frame similarity execution failed'
  value=$(sed -n 's/.* All:\([0-9][0-9.]*\).*/\1/p' "$log" | tail -1)
  [ -n "$value" ] || fail 'frame similarity result is missing'
  awk -v value="$value" 'BEGIN { printf "%.0f", value * 1000000 }'
}

work=$(mktemp -d /tmp/reeditpro-visual-calibration-qa.XXXXXX)
trap 'rm -rf "$work"' EXIT HUP INT TERM
umask 077

IFS= read -r magic || fail 'missing protocol magic'
[ "$magic" = "$MAGIC" ] || fail 'unsupported protocol magic'
IFS="$TAB" read -r kind scenario max_black max_frozen max_frozen_run min_motion min_first min_last extra \
  || fail 'missing QA policy'
[ "$kind" = policy ] && [ -z "${extra:-}" ] || fail 'invalid QA policy'
case "$scenario" in
  style_led_motion|character_continuity|strict_first_last_frame|reference_heavy) ;;
  *) fail 'unsupported calibration scenario' ;;
esac
for value in "$max_black" "$max_frozen" "$max_frozen_run" "$min_motion" "$min_first" "$min_last"; do
  valid_uint "$value" || fail 'QA policy is not integer encoded'
done
[ "$max_black" -eq 20000 ] && [ "$max_frozen" -eq 670000 ] \
  && [ "$max_frozen_run" -eq 47 ] && [ "$min_motion" -eq 50000 ] \
  || fail 'QA policy changed from the fixed profile'

IFS="$TAB" read -r kind candidate_bytes candidate_sha extra \
  || fail 'missing candidate commitment'
[ "$kind" = candidate ] && [ -z "${extra:-}" ] || fail 'invalid candidate commitment'
read_blob "$work/candidate.mp4" "$candidate_bytes" "$candidate_sha" "$MAX_CANDIDATE_BYTES"
[ "$(dd if="$work/candidate.mp4" bs=1 skip=4 count=4 status=none)" = ftyp ] \
  || fail 'candidate is not an MP4'

IFS="$TAB" read -r kind first_bytes first_sha extra \
  || fail 'missing first-frame commitment'
[ "$kind" = first_frame ] && [ -z "${extra:-}" ] || fail 'invalid first-frame commitment'
read_blob "$work/first.png" "$first_bytes" "$first_sha" "$MAX_REFERENCE_BYTES"
[ "$(od -An -tx1 -N8 "$work/first.png" | tr -d ' \n')" = 89504e470d0a1a0a ] \
  || fail 'first reference is not PNG'

IFS="$TAB" read -r kind last_bytes last_sha extra \
  || fail 'missing last-frame commitment'
[ "$kind" = last_frame ] && [ -z "${extra:-}" ] || fail 'invalid last-frame commitment'
read_blob "$work/last.png" "$last_bytes" "$last_sha" "$MAX_REFERENCE_BYTES"
[ "$(od -An -tx1 -N8 "$work/last.png" | tr -d ' \n')" = 89504e470d0a1a0a ] \
  || fail 'last reference is not PNG'
IFS= read -r terminator || fail 'missing protocol terminator'
[ "$terminator" = end ] || fail 'invalid protocol terminator'

stream_types=$("$FFPROBE" -v error -show_entries stream=codec_type \
  -of default=nw=1:nk=1 "$work/candidate.mp4") \
  || fail 'candidate stream inspection failed'
video_streams=$(printf '%s\n' "$stream_types" | grep -c '^video$' || true)
audio_streams=$(printf '%s\n' "$stream_types" | grep -c '^audio$' || true)
other_streams=$(printf '%s\n' "$stream_types" | grep -Ev '^(video|audio)$' | grep -c . || true)
[ "$video_streams" -eq 1 ] && [ "$audio_streams" -le 1 ] \
  && [ "$other_streams" -eq 0 ] || fail 'candidate stream structure is unsupported'

"$FFPROBE" -v error -count_frames -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,avg_frame_rate,nb_read_frames \
  -of default=nw=1 "$work/candidate.mp4" > "$work/probe.txt" \
  || fail 'candidate frame authority inspection failed'
width=$(sed -n 's/^width=//p' "$work/probe.txt")
height=$(sed -n 's/^height=//p' "$work/probe.txt")
rate=$(sed -n 's/^r_frame_rate=//p' "$work/probe.txt")
average_rate=$(sed -n 's/^avg_frame_rate=//p' "$work/probe.txt")
frames=$(sed -n 's/^nb_read_frames=//p' "$work/probe.txt")
for value in "$width" "$height" "$frames"; do valid_uint "$value" || fail 'candidate frame authority is invalid'; done
[ "$width" -ge 64 ] && [ "$height" -ge 64 ] \
  && [ $((width * height)) -le 921600 ] || fail 'candidate dimensions exceed authority'
[ "$rate" = 24/1 ] && [ "$average_rate" = 24/1 ] \
  || fail 'candidate must be exact 24 fps CFR'
[ "$frames" -ge 72 ] && [ "$frames" -le 240 ] \
  || fail 'candidate frame count is outside authority'
duration_milliseconds=$((frames * 1000 / 24))
[ "$duration_milliseconds" -ge 3000 ] && [ "$duration_milliseconds" -le 10000 ] \
  || fail 'candidate duration is outside authority'

"$FFMPEG" -hide_banner -nostdin -v error -i "$work/candidate.mp4" \
  -map 0:v:0 -an -sn -dn -f framemd5 "$work/frames.md5" \
  || fail 'decoded frame hash scan failed'
set -- $(awk -F, '
  /^#/ { next }
  {
    hash=$NF; gsub(/^[ \t]+|[ \t]+$/, "", hash)
    count++
    if (count > 1) {
      if (hash == previous) { frozen++; run++ } else { changed++; run=0 }
      if (run > longest) longest=run
    }
    previous=hash
  }
  END { print count, frozen+0, longest+0, changed+0 }
' "$work/frames.md5")
decoded_frames=$1
frozen_frames=$2
longest_frozen_run=$3
changed_transitions=$4
[ "$decoded_frames" -eq "$frames" ] || fail 'decoded frame scan changed frame count'
frozen_ratio=$(millionths "$frozen_frames" "$frames")
motion_ratio=$(millionths "$changed_transitions" $((frames - 1)))
effective_max_frozen=$(millionths 48 "$frames")
[ "$effective_max_frozen" -le "$max_frozen" ] || effective_max_frozen=$max_frozen

"$FFMPEG" -hide_banner -nostdin -v info -i "$work/candidate.mp4" \
  -vf 'blackdetect=d=0.0416667:pix_th=0.10' -an -sn -dn -f null - \
  > /dev/null 2> "$work/blackdetect.log" \
  || fail 'black-frame scan failed'
black_duration=$(sed -n 's/.*black_duration:\([0-9][0-9.]*\).*/\1/p' "$work/blackdetect.log" \
  | awk '{ total += $1 } END { printf "%.6f", total+0 }')
black_ratio=$(awk -v duration="$black_duration" -v frames="$frames" \
  'BEGIN { printf "%.0f", ((duration * 24) * 1000000) / frames }')

"$FFMPEG" -hide_banner -nostdin -v info -i "$work/candidate.mp4" \
  -vf 'freezedetect=n=-50dB:d=0.0416667' -an -sn -dn -f null - \
  > /dev/null 2> "$work/freezedetect.log" \
  || fail 'freeze-frame scan failed'

"$FFMPEG" -hide_banner -nostdin -v error -i "$work/candidate.mp4" \
  -vf 'select=eq(n\,0)' -frames:v 1 -an -sn -dn -c:v ppm -f image2 "$work/candidate-first.ppm" \
  || fail 'candidate first-frame extraction failed'
last_index=$((frames - 1))
"$FFMPEG" -hide_banner -nostdin -v error -i "$work/candidate.mp4" \
  -vf "select=eq(n\\,$last_index)" -frames:v 1 -an -sn -dn -c:v ppm -f image2 "$work/candidate-last.ppm" \
  || fail 'candidate last-frame extraction failed'
first_similarity=$(ssim_millionths "$work/candidate-first.ppm" "$work/first.png" "$width" "$height" "$work/first-ssim.log")
last_similarity=$(ssim_millionths "$work/candidate-last.ppm" "$work/last.png" "$width" "$height" "$work/last-ssim.log")

passed=true
[ "$black_ratio" -le "$max_black" ] || passed=false
[ "$frozen_ratio" -le "$effective_max_frozen" ] || passed=false
[ "$longest_frozen_run" -le "$max_frozen_run" ] || passed=false
[ "$motion_ratio" -ge "$min_motion" ] || passed=false
[ "$first_similarity" -ge "$min_first" ] || passed=false
[ "$last_similarity" -ge "$min_last" ] || passed=false

black_log_sha=$(sha256sum "$work/blackdetect.log" | cut -d' ' -f1)
freeze_log_sha=$(sha256sum "$work/freezedetect.log" | cut -d' ' -f1)
frame_hash_sha=$(sha256sum "$work/frames.md5" | cut -d' ' -f1)
printf '{"schemaVersion":"offline-media-binary-visual-calibration-objective-qa-result-v1","passed":%s,"containerIntegrity":true,"videoStreamCount":%s,"audioStreamCount":%s,"width":%s,"height":%s,"frameRateNumerator":24,"frameRateDenominator":1,"frameCount":%s,"durationMilliseconds":%s,"blackFrameRatioMillionths":%s,"frozenFrameRatioMillionths":%s,"maximumFrozenRunFrames":%s,"motionSignalRatioMillionths":%s,"firstFrameSimilarityMillionths":%s,"lastFrameSimilarityMillionths":%s,"blackDetectEvidenceSha256":"%s","freezeDetectEvidenceSha256":"%s","decodedFrameHashEvidenceSha256":"%s"}\n' \
  "$passed" "$video_streams" "$audio_streams" "$width" "$height" "$frames" \
  "$duration_milliseconds" "$black_ratio" "$frozen_ratio" \
  "$longest_frozen_run" "$motion_ratio" "$first_similarity" \
  "$last_similarity" "$black_log_sha" "$freeze_log_sha" "$frame_hash_sha"
