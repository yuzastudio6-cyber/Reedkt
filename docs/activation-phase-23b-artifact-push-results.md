# Phase 23B Artifact Registry Push Results

## Summary

Phase 23B tagged and pushed the five non-GPU staging images to Artifact
Registry in project `reeditpro`.

GPU remains deferred. No Cloud Run deployment, Cloud Run job, provider call,
model download, media processing, secret value creation, production-ready
change, external beta unblock, or real user media testing was performed.

- Branch: `codex/rp-activation-23b-push-non-gpu-images`
- Project: `reeditpro`
- Artifact Registry repo: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers`
- Image tag: `staging-local-001`
- Push logs: `activation-logs/artifact-push/phase23b-staging-local-001/`
- Digest evidence: `activation-logs/artifact-push/phase23b-staging-local-001/digests.json`

## Safety Gates

| Gate | State |
| --- | --- |
| `productionReadyAllowed` | `false` |
| `externalBetaAllowed` | `false` |
| `realUserMediaTestingAllowed` | `false` |
| GPU image pushed | `false` |
| Deployment executed | `false` |
| Docker build executed | `false` |
| Provider calls executed | `false` |
| Model downloads executed | `false` |
| Media processing executed | `false` |
| Secret values created | `false` |

## Artifact Registry Auth

Docker auth was configured for `us-central1-docker.pkg.dev` with
`gcloud auth configure-docker us-central1-docker.pkg.dev --quiet`.

Preflight verified:

- active `gcloud` project was exactly `reeditpro`;
- active account was visible as `aiediting@reeditpro.com`;
- `reeditpro-staging-workers` existed in `us-central1`;
- Docker CLI and Docker Desktop daemon were running;
- `REEDITPRO_ENV=staging`;
- `REEDITPRO_CONFIRM_ARTIFACT_PUSH=true`;
- the five local non-GPU source images existed.

## Images Pushed

| Image | Target image | Digest | Log |
| --- | --- | --- | --- |
| API | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-api:staging-local-001` | `sha256:4dd122f3461b70a1d2ec4435eb13864b69bc6b541ceaa6497ebac68eb027c41f` | `activation-logs/artifact-push/phase23b-staging-local-001/api-push.log` |
| Tool readiness worker | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-tool-readiness-worker:staging-local-001` | `sha256:bc993a509c8b50b8689b837690696584026fd811b0a684199643c2737f34807a` | `activation-logs/artifact-push/phase23b-staging-local-001/tool-readiness-worker-push.log` |
| CPU worker | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-cpu-worker:staging-local-001` | `sha256:9f7449c13adae80e0bc57d352f0d8665691d132c472c92e26ec877663ec30a43` | `activation-logs/artifact-push/phase23b-staging-local-001/cpu-worker-push.log` |
| QA worker | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-qa-worker:staging-local-001` | `sha256:6d3a81928873ebfaa147098cf5d7aa3d7cae203eb7f3fb8252a5df3980018125` | `activation-logs/artifact-push/phase23b-staging-local-001/qa-worker-push.log` |
| Render worker | `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-render-worker:staging-local-001` | `sha256:5e7e5e2898c7ac7a31d3910ca21462e81013b92b4da0eccd9bf9414f873d910d` | `activation-logs/artifact-push/phase23b-staging-local-001/render-worker-push.log` |

## Images Failed

None.

## GPU Image Status

`deferred / not pushed`

`reeditpro-staging-gpu-worker` was not tagged, pushed, verified, or deployed.

## Parsed Report

The log-backed artifact push report returned:

- Push results: `5`
- Digest evidence: `5`
- Blockers: `0`
- Docker push executed: `true`
- gcloud executed flag in report model: `false`
- Deployment executed: `false`
- Docker build executed: `false`
- Production ready allowed: `false`
- External beta allowed: `false`
- Real user media testing allowed: `false`
- Phase 24 non-GPU deploy ready: `true`
- Phase 27 GPU ready: `false`

## Warnings

- GPU image push is deferred until a later GPU phase.
- Docker reported existing layers for some pushed images.
- Google Cloud SDK emitted local Python 3.9 compatibility warnings.
- Artifact Registry describe output emitted a local `importlib.metadata` warning,
  but digest JSON was still present and parsed successfully.

## Phase 24B Readiness

`ready`

Phase 24B non-GPU staging deploy preparation can proceed because all five
non-GPU images were pushed and their Artifact Registry digests were verified.
Phase 24B still must not mark production ready or external beta ready.

## Phase 27 Readiness

`blocked`

Phase 27 remains blocked/deferred because the GPU image was not built, checked,
or pushed.

## Validation

| Command | Result |
| --- | --- |
| `smoke:activation-artifact-push-verification` | passed |
| Log-backed `activation:artifact-push:report -- --project reeditpro --artifact-region us-central1 --repository reeditpro-staging-workers --image-tag staging-local-001 --log <five logs>` | passed; 0 blockers, 5 push results, 5 verified digests |
| `activation:image-digest:summary` | passed |
| `lint` | passed |
| `build` | passed with existing large chunk warning |
| `build:server` | passed |
| `git diff --check` | passed |

`package-lock.json` was not changed.
