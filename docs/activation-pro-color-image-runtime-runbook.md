# Phase 40B Pro Color/Image Runtime Runbook

Phase 40B verifies the Track A pro color/image stack on generated fixtures only.
It may build, push, deploy, and execute the dedicated CPU Cloud Run Job
`reeditpro-staging-pro-color-image-runtime-job`.

## Scope

- OpenColorIO: generated/raw identity transform only.
- OpenImageIO: generated image read/write/metadata inspection only.
- Kornia: CPU-only local image transforms and metrics only.
- Generated fixtures: color bars, gradients, and alpha checker at `256x256`.

## Execution

Execution requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_RUNTIME=true \
REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_KORNIA_TORCH_FIX=true \
REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE=generated_fixture_color_image \
npm run activation:pro-color-image-runtime -- --execute
```

The default CLI mode is report/plan-only and does not build Docker images,
deploy Cloud Run, mutate GCP, or process media.

## Boundaries

No real video, user media, final delivery, public output, provider execution,
Revideo, production, external beta, paid production, broad media, or Track B
audio/OCR/VLM/hybrid tools are allowed in Phase 40B.

The dedicated runtime image must keep Torch/Kornia CPU-only. If Torch or Kornia
cannot import during Docker build or generated-fixture execution, Phase 40B
stays blocked and Phase 40C must not start.
