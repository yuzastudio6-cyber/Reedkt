#!/bin/sh
set -eu

IMAGE_TAG=${REEDITPRO_FFMPEG_IMAGE_TAG:-reeditpro/ffmpeg-lgpl-internal:8.1.2-color-finalizer-v2-local}
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ "${1:-}" = '--build' ]; then
  # Finder/backup volumes may synthesize AppleDouble sidecars whose xattrs make
  # Docker Desktop fail before .dockerignore is evaluated.
  find "$SCRIPT_DIR" -maxdepth 1 -type f -name '._*' -delete
  docker build \
    --file "$SCRIPT_DIR/Dockerfile" \
    --tag "$IMAGE_TAG" \
    --build-arg SOURCE_DATE_EPOCH=1781664539 \
    "$SCRIPT_DIR"
fi

docker image inspect "$IMAGE_TAG" >/dev/null 2>&1 \
  || { printf '%s\n' "missing image $IMAGE_TAG; run $0 --build" >&2; exit 1; }

[ "$(docker image inspect --format '{{.Config.User}}' "$IMAGE_TAG")" = '65532:65532' ] \
  || { printf '%s\n' 'image must declare USER 65532:65532' >&2; exit 1; }
[ "$(docker image inspect --format '{{index .Config.Labels "reeditpro.product-ready"}}' "$IMAGE_TAG")" = 'false' ] \
  || { printf '%s\n' 'image must remain productReady=false' >&2; exit 1; }
[ "$(docker image inspect --format '{{index .Config.Labels "reeditpro.h264-encoding"}}' "$IMAGE_TAG")" = 'blocked_not_compiled' ] \
  || { printf '%s\n' 'image must keep H.264 encoding blocked' >&2; exit 1; }
[ "$(docker image inspect --format '{{index .Config.Labels "reeditpro.aac-encoding"}}' "$IMAGE_TAG")" = 'private_source_slice_finalizer_only' ] \
  || { printf '%s\n' 'image must scope AAC encoding to the private finalizer' >&2; exit 1; }
[ "$(docker image inspect --format '{{index .Config.Labels "reeditpro.mp4-mux"}}' "$IMAGE_TAG")" = 'private_source_slice_finalizer_only' ] \
  || { printf '%s\n' 'image must scope MP4 muxing to the private finalizer' >&2; exit 1; }

docker run --rm \
  --network=none \
  --read-only \
  --cap-drop=ALL \
  --security-opt=no-new-privileges:true \
  --pids-limit=128 \
  --memory=2g \
  --memory-swap=2g \
  --cpus=2 \
  --tmpfs /tmp:rw,noexec,nosuid,nodev,size=64m,mode=1777 \
  --entrypoint /usr/local/bin/reeditpro-ffmpeg-verify \
  "$IMAGE_TAG"

docker image inspect --format \
  '{"imageId":"{{.Id}}","architecture":"{{.Architecture}}","os":"{{.Os}}","user":"{{.Config.User}}","productReady":"{{index .Config.Labels "reeditpro.product-ready"}}","h264Encoding":"{{index .Config.Labels "reeditpro.h264-encoding"}}","aacEncoding":"{{index .Config.Labels "reeditpro.aac-encoding"}}","mp4Mux":"{{index .Config.Labels "reeditpro.mp4-mux"}}"}' \
  "$IMAGE_TAG"
