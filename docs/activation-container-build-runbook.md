# Activation Container Build Runbook

Phase 20 prepares production container builds and build reporting. Codex does not build images, push images, run Docker, run `gcloud`, deploy, call providers, download models, add secrets, or process media.

## Human-Run Build Order

1. api
2. tool-readiness-worker
3. cpu-worker
4. qa-worker
5. render-worker
6. gpu-worker

The GPU image is a heavy build and can be deferred until non-GPU staging is healthy. It remains required for the later GPU phase. The later GPU target is L4; RTX PRO 6000 is not the default.

## Required Environment

- `GCP_PROJECT_ID`
- `GCP_ARTIFACT_REGION`
- `REEDITPRO_ARTIFACT_REPOSITORY`
- `REEDITPRO_IMAGE_TAG`

`REEDITPRO_IMAGE_TAG` must be explicit. It must not be empty, `manual-not-set`, `latest`, `prod`, or `production`.

## Generate The Command Plan

Use the static command-plan helper:

```bash
npm.cmd run activation:container-build:plan -- --image-tag staging-test-001
```

The command prints Docker build commands as text only. Codex must not execute those commands.

## Capture Build Logs

When a human later runs a Docker build manually, capture each terminal log to a local text file named with the image id, such as `api-build.log` or `render-worker-build.log`.

Use the report helper to parse those logs:

```bash
npm.cmd run activation:container-build:report -- --image-tag staging-test-001 --log api-build.log
```

The report helper reads local text logs only. It does not run Docker, push images, run `gcloud`, deploy, call providers, download models, or process media.

## Phase 21

Phase 21 container readiness comes after successful human builds. The non-GPU readiness path requires passing build evidence for API, tool-readiness, CPU, QA, and render images. GPU can be deferred for non-GPU staging, but must be built before GPU activation.
