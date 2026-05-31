# Phase 40D Pro Color/Image Feature E2E Policy

Phase 40D is limited to project `reeditpro`, region `us-central1`, environment
`staging`, and runtime mode `pro_color_image_feature_e2e`.

Allowed input:

- `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

Required evidence:

- Phase 40C run `phase40c-20260531T11504`
- Phase 40C QA report under private QA GCS
- OpenColorIO `2.4.2`
- OpenImageIO `3.0.18.1`
- Torch `2.7.1+cpu`
- Kornia `0.8.1`

The worker must execute a structured Phase 40D plan snapshot and must not execute
raw chat. The plan is bounded to three 768x432 frames at `0.5`, `7.7335`, and
`14.5` seconds, with a hard cap of five frames.

Always blocked:

- arbitrary media and new source videos
- full-video and full 4K processing
- final delivery exports
- providers and Revideo
- Track B tools, OCR/VLM/audio/data/hybrid compute
- public URLs, signed URLs as source of truth, and public buckets
- production, external beta, paid production, and broad real media
