# Offline private long-form master assembly runtime

Date: 2026-07-18

## Outcome

The pinned, networkless FFmpeg runtime now has a bounded private master
assembly operation for approved professional long-form edits. One fixed request
can assemble 2 through 124 immutable 4K/30 fps VP9 object chunks plus the exact
continuous 48 kHz stereo FLAC program-audio artifact into one private Matroska
review master. The capacity contract covers 648,000 frames, or six hours at
30 fps.

This operation uses the already-approved edit reservation. It rejects a second
export estimate, additional export charging, caller commands, caller paths,
caller URLs, caller codec settings, reordered chunks, missing frame ranges, and
changed checksums.

## Media execution proof

The real-media smoke generated two 45-second UHD VP9 chunks and one exact
90-second 24-bit FLAC program-audio artifact. It then proved:

- two independent checksum-verified input channels inside one confined
  container, preventing audio/video FIFO starvation;
- exact ordered chunk coverage and 2,700 recounted output frames;
- one VP9 video stream and one FLAC audio stream;
- 3840x2160, 30 fps, limited-range BT.709, stereo 48 kHz output;
- Matroska stream-copy assembly with no video or audio re-encoding;
- create-only private output spooling, checksum-preserving sink persistence,
  and a separate full-input FFprobe pass;
- network none, read-only root filesystem, non-root execution, bounded
  resources, a pinned image identity, and a checksum-protected attestation;
- `productReady=false`, `externalBetaReady=false`, and
  `productionReady=false`.

The retained proof artifact hash was
`58c99cb5f9162efa45e78f5d6079843ca585f303589c31c30c92ae06dcc08a65`.
The local image identity hash was
`12f71a109921734cbd43fd3b934333882648eb04df7e83ad8486037550b508b7`.
These are local evidence identities, not published or deployed artifacts.

## Verification

```text
npm run typecheck:server
npx eslint <bounded long-form master files>
npm run smoke:offline-media-binary-long-form-master-contract
docker/prod/ffmpeg-lgpl-runtime/smoke.sh
npm run smoke:offline-media-binary-long-form-master
```

The Dockerfile now separates the expensive pinned FFmpeg source compilation
from runtime-policy script packaging. A bounded runner-script correction can
therefore reuse the compile layer instead of rebuilding FFmpeg.

## Canonical consumption and honest boundary

The runner is now consumed by
`canonical-professional-long-form-master-assembly-execution-service.ts`. The
retained two-chunk journey proves exact dependencies, authorization, attempt
identity, lease, one-use dispatch, private artifact persistence, internal
attempt cost, reconciliation, terminal completion, and restart replay. That
journey advances from 9/11 to 10/11 and leaves private-master QA queued and
unauthorized.

This does not mark the retained 255-job six-hour graph's finalization complete.
Its other 122 chunk pairs and their dependencies remain unexecuted, so that
graph remains 8/255. Google Cloud deployment, provider activation, customer
pricing, customer credits, billing, wallet mutation, public rendering,
delivery-master encoding, export, and delivery remain blocked.
