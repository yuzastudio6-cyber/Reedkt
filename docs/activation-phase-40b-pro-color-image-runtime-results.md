# Phase 40B Pro Color/Image Runtime Results

Status: `blocked`

Track: A visual/video

Base: `origin/codex/rp-activation-40a-pro-color-image-approval-workflow`

Branch: `codex/rp-activation-40b-pro-color-image-generated-fixture-runtime`

## Scope

Phase 40B verifies OpenColorIO, OpenImageIO, and Kornia on generated image
fixtures only. It does not process real video, user media, final delivery,
providers, Revideo, Track B tools, production, external beta, paid production,
or broad real media.

## Runtime Target

- Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-pro-color-image-runtime:staging-pro-color-image-runtime-001`
- Image digest: `sha256:e72e453d22d6d5c416b3e9f853d72d93b52928c45ce2e5d42a16730694c1a747`
- Cloud Run job: `reeditpro-staging-pro-color-image-runtime-job`
- Cloud Run execution: `reeditpro-staging-pro-color-image-runtime-job-b6dfs`
- Service account: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- Compute: CPU-only, 4 CPU, 8Gi, parallelism 1, max retries 0
- Run ID: `phase40b-20260531T03304`

## Generated Fixture

- Dimensions: `256x256`
- Frame count: `3`
- Fixtures: color bars, gradient ramp, alpha checker

## QA Status

Phase 40B executed on generated fixtures and uploaded private artifacts. The
runtime is blocked because Kornia could not import Torch in the container.

Passed:

- OpenColorIO `2.4.2` loaded a generated raw config and verified an identity RGB transform with `maxAbsDiff=0`.
- OpenImageIO `3.0.18.1` read the generated fixtures, inspected dimensions/channels, and wrote a PNG copy.
- Generated fixtures were bounded to `256x256`, uploaded privately, and locally hashed.
- Artifact privacy and blocked feature gates passed.

Blocked:

- Kornia: `ModuleNotFoundError: No module named 'torch'`
- Mandatory `tool_runtime_integrity` and `kornia_result` QA gates did not pass.

Private artifact prefix:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40b/phase40b-20260531T03304/`

QA report:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-pro-color-image/phase40b/phase40b-20260531T03304/reports/phase40b-report.json`

Phase40C readiness: blocked until Kornia/Torch imports and mandatory generated-fixture QA gates pass.

## Retry Notes

Execution `reeditpro-staging-pro-color-image-runtime-job-rr5gd` failed closed
because `GCP_REGION` was missing from the Cloud Run job environment. The command
plan was corrected to include `GCP_REGION=us-central1`; the final recorded run
is `reeditpro-staging-pro-color-image-runtime-job-b6dfs`.

## Blocked

- real-video pro color/image runtime
- arbitrary user media
- final delivery
- public output
- providers
- Revideo
- production/external beta/paid production/broad media
- Track B tools
