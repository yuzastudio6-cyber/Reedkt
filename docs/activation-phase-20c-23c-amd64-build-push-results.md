# Phase 20C/23C AMD64 Build And Push Results

## Summary

Phase 20C/23C rebuilt and pushed the five non-GPU staging images for
`linux/amd64` with the new tag `staging-amd64-001`.

This fixes the Phase 24B architecture blocker from the earlier
`staging-local-001` images, which were Apple Silicon `linux/arm64` only.

GPU remains deferred. No Cloud Run deployment, Cloud Run job execution,
provider call, model download, media processing, secret value creation,
production-ready change, external beta unblock, or real user media testing was
performed.

- Branch: `codex/rp-activation-20c-23c-build-push-amd64-non-gpu`
- Project: `reeditpro`
- Artifact Registry repo: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers`
- Image tag: `staging-amd64-001`
- Target platform: `linux/amd64`
- Buildx builder: `reeditpro-amd64-builder`
- Build logs: `activation-logs/container-builds/phase20c-staging-amd64-001/`
- Push logs: `activation-logs/artifact-push/phase23c-staging-amd64-001/`
- Architecture logs: `activation-logs/staging-deploy/phase24b-staging-amd64-001/`
- Optional local readiness logs: `activation-logs/container-readiness/phase21c-staging-amd64-001/`

## Safety Gates

| Gate | State |
| --- | --- |
| `productionReadyAllowed` | `false` |
| `externalBetaAllowed` | `false` |
| `realUserMediaTestingAllowed` | `false` |
| GPU image built | `false` |
| GPU image pushed | `false` |
| Deployment executed | `false` |
| Cloud Run jobs executed | `false` |
| Provider calls executed | `false` |
| Model downloads executed | `false` |
| Media processing executed | `false` |
| Secret values created | `false` |

## Preflight

Preflight verified Docker Desktop, Docker Buildx, active GCP project
`reeditpro`, active account `aiediting@reeditpro.com`, and Artifact Registry
repository `reeditpro-staging-workers` in `us-central1`.

Static container build and artifact push plans accepted `staging-amd64-001`.
Safety scans did not find model downloads, Revideo production use, provider
paths, secrets, or GPU/model packages in the non-GPU Dockerfiles.

`gcloud` emitted local Python 3.9 support warnings during auth-backed Docker
and Artifact Registry operations, but the commands completed successfully.

## Images Built And Pushed

| Image | Dockerfile | Pushed image | Digest | Platform |
| --- | --- | --- | --- | --- |
| API | `docker/prod/api/Dockerfile` | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-api:staging-amd64-001` | `sha256:ddb5c6d31fe738ab56291806527e1a5638d1fbfd2b08e05fafb492dc78cb05ac` | `linux/amd64` |
| Tool readiness worker | `docker/prod/tool-readiness-worker/Dockerfile` | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-tool-readiness-worker:staging-amd64-001` | `sha256:775d0c9fffe03a3f2836e246824a5feb0b753fe3e1672f68685144fc5fc79656` | `linux/amd64` |
| CPU worker | `docker/prod/cpu-worker/Dockerfile` | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-cpu-worker:staging-amd64-001` | `sha256:48362d165a07e8ab14f1debf764001e659963db6d26694fd4194446cd0ccc109` | `linux/amd64` |
| QA worker | `docker/prod/qa-worker/Dockerfile` | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-qa-worker:staging-amd64-001` | `sha256:ee5360f68f16263fd1a8e791c577f696b688f2ed986a38029fe11803674f9c8a` | `linux/amd64` |
| Render worker | `docker/prod/render-worker/Dockerfile` | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-render-worker:staging-amd64-001` | `sha256:46f2d8f76b14a2fdc000c1260c9026169a28351763e9d28914046c027b9b0922` | `linux/amd64` |

## Architecture Verification

`docker buildx imagetools inspect` found `linux/amd64` for all five pushed
images. Each image index also includes an `unknown/unknown` BuildKit
attestation manifest. That attestation entry is not a runnable platform and is
not a Cloud Run blocker.

Artifact Registry describe commands verified the pushed manifest digests.

## Optional Local AMD64 Readiness

Optional local Docker Desktop amd64 readiness was attempted with
`--platform linux/amd64`, no user media mounts, no provider calls, no model
downloads, no GPU, and no deployment.

| Image | Result | Notes |
| --- | --- | --- |
| API | passed | Node runtime and `dist-server/server.js` were present. |
| Tool readiness worker | local-emulation warning | Node and Python started, but Python imports hit a QEMU segmentation fault under Docker Desktop amd64 emulation. |
| CPU worker | local-emulation warning | FFmpeg and FFprobe passed; Python imports hit a QEMU segmentation fault under Docker Desktop amd64 emulation. |
| QA worker | local-emulation warning | FFmpeg and FFprobe passed; Python imports hit a QEMU segmentation fault under Docker Desktop amd64 emulation. |
| Render worker | passed | FFmpeg, FFprobe, libass, render worker metadata, and OpenTimelineIO import passed. |

The local QEMU import failures are recorded as local-emulation warnings. They
do not override the pushed `linux/amd64` manifest verification for Phase 24B
retry readiness.

## Build And Push Warnings

- `npm ci` inside images reported existing moderate npm audit findings.
- `npm ci` reported deprecated `uuid` package warnings.
- `pip` reported standard root-user install warnings inside container builds.
- `gcloud` reported local Python 3.9 support warnings.
- BuildKit emitted `unknown/unknown` attestation manifests alongside each
  `linux/amd64` runnable manifest.

## Parsed Reports

The log-backed artifact push report returned:

- Push results: `5`
- Digest evidence: `5`
- Blockers: `0`
- Docker push executed: `true`
- gcloud executed flag in report model: `false`
- Deployment executed: `false`
- Docker build executed flag in report model: `false`
- Production ready allowed: `false`
- External beta allowed: `false`
- Real user media testing allowed: `false`
- Phase 24 non-GPU deploy ready: `true`
- Phase 27 GPU ready: `false`

The staging deploy report for `staging-amd64-001` returned no architecture
blockers and listed all five images as Cloud Run compatible.

## Phase 24B Retry Readiness

`ready`

Phase 24B can be retried with the `staging-amd64-001` digest references above.
The retry still must not deploy GPU, call providers, download models, process
real user media, create secret values, mark production ready, or unblock
external beta.

## Phase 27 Readiness

`blocked`

Phase 27 GPU readiness remains blocked/deferred because `gpu-worker` was not
built, pushed, checked, or deployed.

## Validation

| Command | Result |
| --- | --- |
| `smoke:activation-container-build-reporting` | passed |
| `smoke:activation-artifact-push-verification` | passed |
| `smoke:activation-staging-deploy-config` | passed |
| `activation:artifact-push:report -- --project reeditpro --artifact-region us-central1 --repository reeditpro-staging-workers --image-tag staging-amd64-001` | passed; 0 blockers, 5 verified non-GPU digests |
| `activation:image-digest:summary` with `REEDITPRO_IMAGE_TAG=staging-amd64-001` | passed |
| `activation:staging:deploy-report -- --project reeditpro --region us-central1 --image-tag staging-amd64-001` | passed; 0 architecture blockers |
| `lint` | passed |
| `build` | passed with the existing large chunk warning |
| `build:server` | passed |
| `git diff --check` | passed |

`package-lock.json` was not changed.
