#!/bin/sh
set -eu

FFMPEG=/opt/reeditpro-ffmpeg/bin/ffmpeg
FFPROBE=/opt/reeditpro-ffmpeg/bin/ffprobe
EVIDENCE_ROOT=/opt/reeditpro-ffmpeg/share/reeditpro

fail() {
  printf '%s\n' "ffmpeg-lgpl-runtime verification failed: $*" >&2
  exit 1
}

[ "$(id -u)" != '0' ] || fail 'runtime user must not be root'
[ "$(id -u)" = '65532' ] || fail 'runtime UID must remain 65532'
[ "$(id -g)" = '65532' ] || fail 'runtime GID must remain 65532'
[ -x "$FFMPEG" ] || fail 'ffmpeg binary is missing'
[ -x "$FFPROBE" ] || fail 'ffprobe binary is missing'

root_write_test="/reeditpro-root-write-test.$$"
if (umask 077 && : > "$root_write_test") 2>/dev/null; then
  rm -f "$root_write_test"
  fail 'root filesystem is writable; run the container with --read-only'
fi

# Docker Desktop's LinuxKit kernel exposes inert tunnel template devices even
# inside a network-none namespace. Routing state is the authoritative boundary:
# no IPv4 routes and no IPv6 route attached to anything except loopback.
[ "$(tail -n +2 /proc/net/route | wc -l | tr -d ' ')" = '0' ] \
  || fail 'IPv4 route detected; run with --network=none'
if [ -r /proc/net/ipv6_route ] \
  && grep -Ev '[[:space:]]lo$' /proc/net/ipv6_route | grep -q .; then
  fail 'non-loopback IPv6 route detected; run with --network=none'
fi

buildconf=$($FFMPEG -hide_banner -buildconf 2>&1)
printf '%s\n' "$buildconf" | grep -F -- '--disable-gpl' >/dev/null || fail 'missing --disable-gpl'
printf '%s\n' "$buildconf" | grep -F -- '--disable-nonfree' >/dev/null || fail 'missing --disable-nonfree'
printf '%s\n' "$buildconf" | grep -F -- '--disable-version3' >/dev/null || fail 'missing --disable-version3'
printf '%s\n' "$buildconf" | grep -F -- '--disable-network' >/dev/null || fail 'missing --disable-network'
if printf '%s\n' "$buildconf" | grep -Eq -- '(^|[[:space:]])--enable-(gpl|nonfree|version3)([[:space:]]|$)'; then
  fail 'GPL, nonfree, or version3 mode is enabled'
fi

$FFMPEG -hide_banner -L 2>&1 | grep -F 'GNU Lesser General Public' >/dev/null \
  || fail 'FFmpeg does not report an LGPL license mode'

actual_encoders=$(mktemp)
actual_decoders=$(mktemp)
actual_filters=$(mktemp)
actual_demuxers=$(mktemp)
actual_muxers=$(mktemp)
actual_protocols=$(mktemp)
actual_bsfs=$(mktemp)
trap 'rm -f "$actual_encoders" "$actual_decoders" "$actual_filters" "$actual_demuxers" "$actual_muxers" "$actual_protocols" "$actual_bsfs" /tmp/reeditpro-intermediate.nut /tmp/reeditpro-color.mkv /tmp/reeditpro-frame.ppm /tmp/reeditpro-probe.json /tmp/reeditpro-color-probe.json /tmp/reeditpro-finalizer-audio.m4a /tmp/reeditpro-finalizer-audio-probe.json' EXIT HUP INT TERM

$FFMPEG -hide_banner -encoders 2>/dev/null \
  | awk 'length($1) == 6 && substr($1, 1, 1) ~ /^[VAS]$/ && $2 != "=" { print $2 }' \
  | LC_ALL=C sort -u > "$actual_encoders"
if ! cmp -s "$EVIDENCE_ROOT/allowed-encoders.txt" "$actual_encoders"; then
  diff -u "$EVIDENCE_ROOT/allowed-encoders.txt" "$actual_encoders" >&2 || true
  fail 'compiled encoder set differs from the reviewed allowlist'
fi

grep -Fx 'aac' "$actual_encoders" >/dev/null \
  || fail 'fixed private-finalizer AAC encoder is missing'
if grep -Eq '^(h26[45]|hevc|libx26[45]|libopenh264)$' "$actual_encoders"; then
  fail 'blocked H.264/HEVC production encoder is compiled'
fi

$FFMPEG -hide_banner -decoders 2>/dev/null \
  | awk 'length($1) == 6 && substr($1, 1, 1) ~ /^[VAS]$/ && $2 != "=" { print $2 }' \
  | LC_ALL=C sort -u > "$actual_decoders"
if ! cmp -s "$EVIDENCE_ROOT/allowed-decoders.txt" "$actual_decoders"; then
  diff -u "$EVIDENCE_ROOT/allowed-decoders.txt" "$actual_decoders" >&2 || true
  fail 'compiled decoder set differs from the reviewed allowlist'
fi

$FFMPEG -hide_banner -filters 2>/dev/null \
  | awk '$2 != "=" && $3 ~ /->/ { print $2 }' \
  | LC_ALL=C sort -u > "$actual_filters"
if ! cmp -s "$EVIDENCE_ROOT/allowed-filters.txt" "$actual_filters"; then
  diff -u "$EVIDENCE_ROOT/allowed-filters.txt" "$actual_filters" >&2 || true
  fail 'compiled filter set differs from the reviewed allowlist'
fi

$FFMPEG -hide_banner -demuxers 2>/dev/null \
  | awk '$1 == "D" && $2 == "d" { print $3; next } $1 == "D" { print $2 }' \
  | LC_ALL=C sort -u > "$actual_demuxers"
if ! cmp -s "$EVIDENCE_ROOT/allowed-demuxers.txt" "$actual_demuxers"; then
  diff -u "$EVIDENCE_ROOT/allowed-demuxers.txt" "$actual_demuxers" >&2 || true
  fail 'compiled demuxer set differs from the reviewed allowlist'
fi

$FFMPEG -hide_banner -muxers 2>/dev/null \
  | awk '$1 == "E" { print $2 }' \
  | LC_ALL=C sort -u > "$actual_muxers"
if ! cmp -s "$EVIDENCE_ROOT/allowed-muxers.txt" "$actual_muxers"; then
  diff -u "$EVIDENCE_ROOT/allowed-muxers.txt" "$actual_muxers" >&2 || true
  fail 'compiled muxer set differs from the reviewed bounded allowlist'
fi
grep -Eq '(^|,)(mov|mp4)(,|$)' "$actual_muxers" \
  || fail 'fixed private-finalizer MP4 muxer is missing'

$FFMPEG -hide_banner -protocols 2>/dev/null \
  | awk '/^Input:$/ { section=1; next } /^Output:$/ { section=1; next } section && /^[[:space:]]+[a-z0-9_]+$/ { gsub(/[[:space:]]/, ""); print }' \
  | LC_ALL=C sort -u > "$actual_protocols"
if ! cmp -s "$EVIDENCE_ROOT/allowed-protocols.txt" "$actual_protocols"; then
  diff -u "$EVIDENCE_ROOT/allowed-protocols.txt" "$actual_protocols" >&2 || true
  fail 'compiled protocol set differs from file/pipe-only allowlist'
fi

$FFMPEG -hide_banner -bsfs 2>/dev/null \
  | awk 'found && /^[a-z0-9_]+$/ { print } /^Bitstream filters:$/ { found=1 }' \
  | LC_ALL=C sort -u > "$actual_bsfs"
if ! cmp -s "$EVIDENCE_ROOT/allowed-bsfs.txt" "$actual_bsfs"; then
  diff -u "$EVIDENCE_ROOT/allowed-bsfs.txt" "$actual_bsfs" >&2 || true
  fail 'compiled bitstream-filter set differs from the reviewed allowlist'
fi

sha256sum -c "$EVIDENCE_ROOT/runtime-files.sha256" >/dev/null \
  || fail 'runtime binary/configure hash evidence failed'

$FFMPEG -hide_banner -loglevel error \
  -f lavfi -i 'testsrc2=size=64x64:rate=2:duration=1' \
  -f lavfi -i 'sine=frequency=1000:sample_rate=48000:duration=1' \
  -map 0:v:0 -map 1:a:0 \
  -c:v ffv1 -level 3 -pix_fmt yuv420p \
  -c:a pcm_s16le \
  -f nut -y /tmp/reeditpro-intermediate.nut

$FFPROBE -hide_banner -v error \
  -show_entries 'format=format_name,duration:stream=codec_name,codec_type' \
  -of json /tmp/reeditpro-intermediate.nut \
  > /tmp/reeditpro-probe.json
grep -F 'ffv1' /tmp/reeditpro-probe.json >/dev/null || fail 'FFV1 intermediate stream was not probed'
grep -F 'pcm_s16le' /tmp/reeditpro-probe.json >/dev/null || fail 'PCM intermediate stream was not probed'

$FFMPEG -hide_banner -loglevel error \
  -i /tmp/reeditpro-intermediate.nut \
  -map 0:v:0 -an \
  -filter:v 'colorchannelmixer=rr=1.01:gg=1:bb=0.99:pc=lum:pa=0.75,colorchannelmixer=rr=1.01575:rg=-0.0143:rb=-0.00145:gr=-0.00425:gg=1.0057:gb=-0.00145:br=-0.00425:bg=-0.0143:bb=1.01855,colorlevels=rimin=0.01:gimin=0.01:bimin=0.01:rimax=0.99:gimax=0.99:bimax=0.99:romax=0.985:gomax=0.985:bomax=0.985:preserve=lum,unsharp=5:5:0.20:3:3:0,format=yuv420p,setparams=range=tv:color_primaries=bt709:color_trc=bt709:colorspace=bt709' \
  -threads 1 -c:v libvpx-vp9 -lossless 1 -deadline good -cpu-used 2 \
  -row-mt 0 -auto-alt-ref 0 -lag-in-frames 0 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
  -f matroska -y /tmp/reeditpro-color.mkv

$FFPROBE -hide_banner -v error \
  -show_entries 'format=format_name:stream=codec_name,codec_type,pix_fmt,color_space,color_transfer,color_primaries' \
  -of json /tmp/reeditpro-color.mkv \
  > /tmp/reeditpro-color-probe.json
grep -F '"pix_fmt": "yuv420p"' /tmp/reeditpro-color-probe.json >/dev/null \
  || fail 'reviewed professional color chain did not preserve yuv420p'
grep -F '"codec_name": "vp9"' /tmp/reeditpro-color-probe.json >/dev/null \
  || fail 'reviewed professional color chain did not produce the lossless VP9 intermediate'
grep -F '"color_space": "bt709"' /tmp/reeditpro-color-probe.json >/dev/null \
  || fail 'reviewed professional color chain did not set BT.709 metadata'

$FFMPEG -hide_banner -loglevel error \
  -i /tmp/reeditpro-intermediate.nut \
  -map 0:v:0 -frames:v 1 -c:v ppm -f image2 -y /tmp/reeditpro-frame.ppm
[ -s /tmp/reeditpro-frame.ppm ] || fail 'reviewed frame extraction did not produce output'

$FFMPEG -hide_banner -loglevel error \
  -i /tmp/reeditpro-intermediate.nut \
  -filter:v 'signalstats,showinfo' \
  -filter:a 'astats,ashowinfo' \
  -c:v wrapped_avframe -c:a pcm_s16le \
  -f null -

$FFMPEG -hide_banner -loglevel error \
  -f lavfi -i 'sine=frequency=997:sample_rate=48000:duration=1' \
  -map 0:a:0 -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -f mp4 -movflags +faststart -y /tmp/reeditpro-finalizer-audio.m4a
$FFPROBE -hide_banner -v error \
  -show_entries 'format=format_name:stream=codec_name,codec_type,sample_rate,channels' \
  -of json /tmp/reeditpro-finalizer-audio.m4a \
  > /tmp/reeditpro-finalizer-audio-probe.json
grep -F '"codec_name": "aac"' /tmp/reeditpro-finalizer-audio-probe.json >/dev/null \
  || fail 'private-finalizer AAC encode failed'
grep -F '"format_name": "mov,mp4,m4a,3gp,3g2,mj2"' /tmp/reeditpro-finalizer-audio-probe.json >/dev/null \
  || fail 'private-finalizer MP4 mux failed'
[ -x /usr/local/bin/reeditpro-ffmpeg-source-slice-finalizer ] \
  || fail 'source-slice finalizer entrypoint is missing'

printf '%s\n' '{"ok":true,"productReady":false,"publicFinalExportAllowed":false,"privateSourceSliceFinalizationAllowed":true,"h264Encoding":"blocked_not_compiled","aacEncoding":"private_source_slice_finalizer_only","mp4Mux":"private_source_slice_finalizer_only","runtimeUser":"65532:65532","network":"none","rootFilesystem":"read_only","componentSets":"exact_allowlists_verified","protocols":["file","pipe"],"generalIntermediateVideoEncoder":"ffv1","professionalColorIntermediateVideoEncoder":"libvpx-vp9-lossless","intermediateAudioEncoder":"pcm_s16le"}'
