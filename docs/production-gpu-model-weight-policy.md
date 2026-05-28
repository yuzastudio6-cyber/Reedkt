# Production GPU Model Weight Policy

Model/checkpoint weights are reviewed separately from package and code licenses. A permissive repository license does not approve a model for paid production.

## Production Blockers

Production execution is blocked when model weights are:

- missing from the approved manifest registry;
- unknown license;
- non-commercial;
- `needs_review`, `not_reviewed`, `blocked`, or `evaluation_only`;
- missing commercial-use, redistribution, attribution, source, or checksum/provenance review.

Milestone 11 creates manifest templates only. No model files are committed, downloaded, or baked into Docker images.

## Activation Phase 26

Phase 26 creates a staging-only approval record for
`Systran/faster-whisper-tiny` for speech/caption planning. GPU deployment and
all non-speech GPU model weights remain blocked. The approved tiny manifest has
no checksum until a later explicit model download/load phase.

## Activation Phase 33A

Phase 33A creates a staging-only approval record for `ZhengPeng7/BiRefNet` for
representative-frame/single-frame background-removal planning. It does not
download weights, deploy GPU, run masks, or approve text-behind-subject.

SAM2 remains evaluated-only and execution-blocked until a separate video
tracking approval phase. Production, external beta, paid production, and broad
real media remain blocked.

Phase 33B stores only approved BiRefNet weights in private staging storage with
revision/checksum evidence. This does not approve GPU deployment or runtime
inference; Phase 33C must verify runtime loading separately.

Phase 33C deployed one staging L4 BiRefNet runtime job for generated-image
verification only. The job loaded the approved BiRefNet snapshot from private
GCS, verified checksum evidence, generated one synthetic-image mask, and emitted
mask QA with no blocking failures. This does not approve RTX PRO 6000, SAM2,
arbitrary real-video masks, production, external beta, or broad real-media
execution.

Phase 33D reused the dedicated BiRefNet L4 runtime for exactly one
representative frame from the approved Phase 32 private export. The resulting
private mask/cutout artifacts are controlled staging evidence only. Full-video
masks, SAM2, text-behind-subject execution, RTX PRO 6000, production, external
beta, and broad real-media execution remain blocked.
