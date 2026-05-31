# Phase 40C Real-Video Pro Color/Image Results

Status: `completed`

Track: A visual/video

Base: `origin/codex/rp-activation-40b-pro-color-image-generated-fixture-runtime`

Branch: `codex/rp-activation-40c-real-video-pro-color-image-sample`

## Scope

Phase 40C runs the pro color/image stack on three bounded frames from the
approved Phase 32 private export only. It does not process arbitrary media,
full video, full 4K frames, final delivery, providers, Revideo, Track B tools,
production, external beta, paid production, or broad real media.

## Approved Source

`gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

## Sample Plan

- Timestamps: `0.5s`, `7.7335s`, `14.5s`
- Planned frame count: `3`
- Maximum frame count: `5`
- Frame dimensions: `768x432`
- Full-video extraction: `false`
- Final delivery: `false`

## Phase 40B Evidence

- Run ID: `phase40b-20260531T10390`
- Execution: `reeditpro-staging-pro-color-image-runtime-job-s25z7`
- Image digest: `sha256:5d3c22e1136d043a80e687d5f344dfc30c82180b7b5cc1e69b916b7a2d2a73cf`
- OpenColorIO: `2.4.2`
- OpenImageIO: `3.0.18.1`
- Torch: `2.7.1+cpu`
- Kornia: `0.8.1`

## Runtime Result

- Run ID: `phase40c-20260531T11504`
- Runtime image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime@sha256:74f00af895620be65be764cfbdc459c7bc0b92c50340d704c9480a5bdf1d48fe`
- Runtime image digest: `sha256:74f00af895620be65be764cfbdc459c7bc0b92c50340d704c9480a5bdf1d48fe`
- Cloud Run job: `reeditpro-staging-pro-color-image-runtime-job`
- Cloud Run execution: `reeditpro-staging-pro-color-image-runtime-job-xzz4f`
- Compute: CPU-only, 4 CPU, 8Gi, parallelism 1, max retries 0
- Service account: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`

## Source Validation

- Duration: `15.467s`
- Source frame size: `2160x3840`
- Video stream present: `true`
- Audio stream present: `true`
- Audio processed: `false`

## Tool Results

- FFprobe: passed source duration and stream validation.
- FFmpeg: passed bounded frame extraction at `768x432`; `fullVideoExtraction=false`.
- OpenImageIO `3.0.18.1`: passed real-video-derived frame read/write/metadata validation.
- OpenColorIO `2.4.2`: passed raw identity transform on real-video-derived pixels with `maxAbsDiff=0`.
- Kornia `0.8.1` with Torch `2.7.1+cpu`: passed CPU grayscale, blur, and metric operations.

Kornia metrics:

- mean absolute diff: `0.0036325042601674795`
- MSE: `0.00019041798077523708`
- PSNR: `37.20292044487455`
- CUDA available: `false`

## Private Artifacts

Generated assets prefix:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40c/phase40c-20260531T11504/`

Preview artifacts prefix:

`gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40c/phase40c-20260531T11504/`

QA report:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40c/phase40c-20260531T11504/reports/phase40c-report.json`

Representative private artifact paths:

- `plan/approved-plan-snapshot.json`
- `source/source-validation.json`
- `sample/sample-manifest.json`
- `frames/input/frame-000.png`
- `frames/input/frame-001.png`
- `frames/input/frame-002.png`
- `frames/openimageio/frame-000-oiio.png`
- `frames/opencolorio/frame-000-ocio.png`
- `frames/kornia/frame-000-kornia-grayscale.png`
- `contact-sheet/pro-color-image-contact-sheet.png`
- `review/private-review-manifest.json`

## QA

All mandatory Phase 40C QA gates passed.

- `source_integrity`: approved Phase 32 source validated with video and audio streams present.
- `phase40b_evidence`: Phase 40B QA report exists and passed.
- `plan_snapshot_integrity`: approved plan snapshot exists and `rawPromptExecution=false`.
- `sample_bounds`: frame count and dimensions stayed within Phase 40C bounds.
- `openimageio_real_frame`: OpenImageIO real-frame read/write passed.
- `opencolorio_real_frame`: OpenColorIO real-frame raw transform passed.
- `kornia_real_frame`: Kornia real-frame CPU metrics passed.
- `artifact_privacy`: artifacts use private staging GCS prefixes only.
- `blocked_features`: full-video processing, final delivery, providers, Revideo, production, beta, and broad media stayed blocked.

## IAM

No new IAM binding was required during the successful run. The runner recorded
existing prefix-scoped bindings:

- `existing:phase40c-source-read`
- `existing:phase40c-phase40b-qa-read`
- `existing:phase40c-generated-create`
- `existing:phase40c-previews-create`
- `existing:phase40c-qa-create`
- `existing:phase40c-worker-temp-create`

No broad/admin/public IAM grants were added.

## Phase40D Readiness

Ready for pro color/image private feature E2E readiness gate only.

Phase 40C does not approve full-video pro color processing, final delivery,
production, external beta, paid production, broad real media, arbitrary media,
providers, Revideo, or Track B tools.

## Blocked

- full-video pro color/image processing
- final delivery
- production, external beta, paid production, broad real media
- arbitrary media
- providers
- Revideo
- Track B tools
