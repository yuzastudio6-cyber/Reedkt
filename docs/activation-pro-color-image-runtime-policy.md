# Phase 40B Pro Color/Image Runtime Policy

Phase: `40B`

Track: `A visual/video`

Environment: `staging`

Runtime mode: `generated_fixture_color_image`

Cloud Run job: `reeditpro-staging-pro-color-image-runtime-job`

Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime:staging-pro-color-image-runtime-torch-001`

Compute: CPU-only, `4` CPU, `8Gi`, parallelism `1`, max retries `0`

Service account: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`

## Required Confirmation

Execution is blocked unless all are set:

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_RUNTIME=true`
- `REEDITPRO_CONFIRM_PRO_COLOR_IMAGE_KORNIA_TORCH_FIX=true`
- `REEDITPRO_PRO_COLOR_IMAGE_RUNTIME_MODE=generated_fixture_color_image`

The Phase 40B completion image must import CPU-only `torch==2.7.1+cpu`,
`kornia==0.8.1`, OpenColorIO, and OpenImageIO during Docker build. Torch GPU
or CUDA packages are not allowed for this CPU generated-fixture phase.

## Blocked Gates

- real video and user media: false
- final delivery: false
- public URLs and public buckets: false
- providers: false
- Revideo: false
- production, external beta, paid production, broad media: false
- Track B tools and branches: false
