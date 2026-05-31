# Phase 40B Pro Color/Image Runtime Results

Status: `completed`

Track: A visual/video

Base: `origin/codex/rp-activation-40a-pro-color-image-approval-workflow`

Branch: `codex/rp-activation-40b-pro-color-image-generated-fixture-runtime`

## Scope

Phase 40B verifies OpenColorIO, OpenImageIO, and Kornia on generated image
fixtures only. It does not process real video, user media, final delivery,
providers, Revideo, Track B tools, production, external beta, paid production,
or broad real media.

## Root Cause And Fix

Previous run `phase40b-20260531T03304` was blocked because Kornia could not
import Torch:

`ModuleNotFoundError: No module named 'torch'`

The dedicated pro color/image runtime image now installs CPU-only
`torch==2.7.1+cpu` from the PyTorch CPU wheel index and `kornia==0.8.1`, fails
the Docker build if mandatory Python imports fail, and records Python/Torch/
Kornia runtime diagnostics in private metadata and QA reports.

## Runtime Target

- Image tag: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime:staging-pro-color-image-runtime-torch-001`
- Image digest: `sha256:5d3c22e1136d043a80e687d5f344dfc30c82180b7b5cc1e69b916b7a2d2a73cf`
- Image ref: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime@sha256:5d3c22e1136d043a80e687d5f344dfc30c82180b7b5cc1e69b916b7a2d2a73cf`
- Cloud Run job: `reeditpro-staging-pro-color-image-runtime-job`
- Cloud Run execution: `reeditpro-staging-pro-color-image-runtime-job-s25z7`
- Service account: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- Compute: CPU-only, 4 CPU, 8Gi, parallelism 1, max retries 0
- Run ID: `phase40b-20260531T10390`

## Runtime Diagnostics

- Python: `3.11.2`
- Python executable: `/usr/bin/python3`
- NumPy: `1.26.4`
- Pillow: `10.4.0`
- Torch: `2.7.1+cpu`
- Kornia: `0.8.1`
- CUDA available: `false`
- OpenColorIO: `2.4.2`
- OpenImageIO: `3.0.18.1`

## Generated Fixture

- Dimensions: `256x256`
- Frame count: `3`
- Fixtures: color bars, gradient ramp, alpha checker
- Real video used: `false`
- User media used: `false`

## QA Status

All mandatory Phase 40B QA gates passed.

Passed:

- `tool_runtime_integrity`: OpenColorIO, OpenImageIO, and Kornia imports/operations completed.
- `fixture_integrity`: generated color bars, gradient, and alpha checker fixtures are bounded at `256x256`.
- `opencolorio_result`: OpenColorIO generated/raw identity transform passed with `maxAbsDiff=0`.
- `openimageio_result`: OpenImageIO read/write/metadata inspection passed.
- `kornia_result`: Kornia CPU grayscale, Gaussian blur, and generated-image metrics passed.
- `image_artifact_integrity`: generated image artifacts were uploaded and locally hashed.
- `metadata_integrity`: fixture manifest and runtime metadata were uploaded.
- `color_transform_safety`: identity color transform produced no numeric drift.
- `artifact_privacy`: artifacts use private staging GCS prefixes only.
- `blocked_features`: real media, providers, Revideo, final delivery, production, beta, and broad media stayed blocked.

Kornia metrics:

- mean absolute diff: `0.00002429689084237907`
- MSE: `0.0000000766169350185919`
- PSNR: `71.15675225507954`
- CUDA available: `false`

## Private Artifacts

Generated assets prefix:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40b/phase40b-20260531T10390/`

QA report:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40b/phase40b-20260531T10390/reports/phase40b-report.json`

Representative private artifacts:

- `fixtures/color-bars.png`
- `fixtures/gradient.png`
- `fixtures/alpha-checker.png`
- `tool-artifacts/openimageio/oiio-gradient-copy.png`
- `tool-artifacts/kornia/kornia-grayscale.png`
- `fixtures/fixture-manifest.json`
- `metadata/pro-color-image-runtime-metadata.json`
- `qa/pro-color-image-runtime-qa.json`

## IAM

No new IAM binding was required during the successful rerun. The runner recorded
existing prefix-scoped object creator bindings:

- `existing:phase40b-generated-create`
- `existing:phase40b-qa-create`
- `existing:phase40b-worker-temp-create`

No broad/admin/public IAM grants were added.

## Phase40C Readiness

Ready for controlled real-video pro color/image sample only.

Phase 40B does not approve production, external beta, paid production, broad
real media, arbitrary media, final delivery, providers, Revideo, or Track B
tools.

## Blocked

- real-video pro color/image runtime until Phase 40C
- arbitrary user media
- final delivery
- public output
- providers
- Revideo
- production/external beta/paid production/broad media
- Track B tools
