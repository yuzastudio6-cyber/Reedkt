# Phase 33D Real Video BiRefNet Frame Mask Results

Status: complete for one controlled representative-frame mask test.

## Source

- Run ID: `phase33d-20260528T161056`
- Source Phase 32 run: `phase32-20260528T13330`
- Source object: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Input duration: `15.467s`
- Input resolution: `2160x3840`
- Selected timestamp: `7.7335s`
- Selection reason: midpoint representative frame from the approved Phase 32 private export

## Representative Frame

- Render job execution: `reeditpro-staging-render-job-h6zz8`
- Frame object: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/representative-frame/frame.png`
- Frame size: `5,477,828` bytes
- Frame SHA-256: `cad684ff1fa07ebd4f5b69fecf246eb49e3db8606fff90982cad8df87a81f6d4`
- Safety: exactly one frame extracted; no source overwrite, public URL, provider execution, model download, Revideo, or second source video.

## Model

- Model: `ZhengPeng7/BiRefNet`
- Manifest: `birefnet_main_staging_v1`
- Revision: `e2bf8e4460fc8fa32bba5ea4d94b3233d367b0e4`
- Aggregate SHA-256: `1e4044aa39d94e3f9c07e2e73d7ff78883c4838e90d678bcb8f3fc075db811e7`
- Private GCS path: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/birefnet/main/`
- Runtime path: `/tmp/reeditpro-model-weights/birefnet/main`

## BiRefNet Runtime

- BiRefNet job execution: `reeditpro-staging-birefnet-runtime-job-8mkt9`
- GPU: `nvidia-l4`, count `1`
- CUDA device: `NVIDIA L4`
- Render worker image digest: `sha256:c08dfb20ae980a2cf70971701a408d8f247b63f5a0ed135df02a556a6be6a4bf`
- BiRefNet image digest: `sha256:7fbab125559acf3d6e1bb429753e2c5f4cca8e02feef3f8548ee21f8eadc643a`
- Model sync: copied from private GCS and checksum-verified.
- Runtime download policy: no Hugging Face/runtime model download.
- Custom code scan: `BiRefNet_config.py` and `birefnet.py` were allowlisted; `handler.py` was recorded as a warning and was not imported.

## Mask Output

- Mask object: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask.png`
- Mask size: `90,162` bytes
- Mask SHA-256: `9036077f1353579addc25212cf694ac6b96ffaa351cd3508e9ed5eb8fc4801bf`
- RGBA cutout object: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/cutout/cutout.png`
- RGBA cutout size: `3,918,538` bytes
- RGBA cutout SHA-256: `5156d288a5f3b088e139afc23f0f7456ea0b377c125d4d9856af81fe7ac18a84`
- Metadata object: `gs://reeditpro-staging-reeditpro-generated-assets/activation-real-video/phase33d/phase33d-20260528T161056/mask/mask-metadata.json`
- Mask dimensions: `2160x3840`
- Mask non-zero ratio: `0.42745466820987654`
- Mean alpha: `0.42267391085624695`

## QA Summary

- `mask_edge_quality`: passed
- `mask_subject_coverage`: passed
- `render_asset_integrity`: passed
- `mask_temporal_stability`: not applicable for one representative frame
- `text_behind_subject_block`: not applicable; execution remains blocked
- QA status: warning-only
- Blocking failures: none

## Private Artifacts

- Frame extraction report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase33d/phase33d-20260528T161056/reports/frame-extraction-report.json`
- Mask QA report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase33d/phase33d-20260528T161056/qa/mask-qa.json`
- Phase 33D report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-real-video/phase33d/phase33d-20260528T161056/reports/phase33d-report.json`

## Warnings

- Phase 33D extracted exactly one representative frame; it did not create a full-video mask sequence.
- `mask_temporal_stability` is not claimed because only one frame was processed.
- `handler.py` contains network helper code and was intentionally not imported.
- Text-behind-subject execution remains blocked until Phase 33E.
- Pre-existing non-admin staging storage grants were observed for the GPU service account; Phase 33D added only conditional prefix-scoped IAM.

## Blockers

- None for the controlled Phase 33D representative-frame mask test.

## Phase 33E Readiness

Phase 33E is ready for controlled text-behind-subject planning on the single approved frame/mask artifact set only.

Phase 33E is not approval for full-video masks, SAM2, public delivery, production, external beta, or broad real user media.

## Launch Gates

- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `broadRealUserMediaAllowed=false`
- `textBehindSubjectAllowed=false`
