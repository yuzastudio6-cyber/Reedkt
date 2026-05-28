# Phase 20B Non-GPU Container Build Results

## Summary

Phase 20B continued on `codex/rp-activation-20b-direct-docker-install-build-non-gpu` after Docker Desktop was installed and started by the user. Docker CLI and daemon checks passed, then Codex built the five requested non-GPU production images locally with image tag `staging-local-001`.

The GPU image was not built. No image push, `gcloud`, deployment, provider calls, model downloads, real media processing, secrets, Revideo production path, package install, or package-lock change was introduced.

- Local worktree: `/Users/macuser/Documents/REeditpro-phase20b-direct-docker`
- Architecture: `arm64`
- Docker CLI: `29.5.2`
- Docker daemon: Docker Desktop `29.5.2` on `aarch64`
- Image tag: `staging-local-001`
- Artifact repository path: `us-central1-docker.pkg.dev/reeditpro-staging-test/reeditpro-staging-workers`
- Build logs: `activation-logs/container-builds/phase20b-staging-local-001/`
- Build report command: `activation:container-build:report -- --image-tag staging-local-001 --log <five non-GPU logs>`

## Recovery History

Earlier Phase 20B attempts were blocked because Docker was unavailable in the shell. Homebrew installation was blocked by a Portable Ruby `Bad CPU type in executable` error, and the direct Docker Desktop command-line installer was blocked by a non-interactive sudo admin-password requirement.

The current continuation started after Docker Desktop was installed and running. Codex verified `docker --version` and `docker info` before running any image build.

## Preflight Results

| Gate | Result |
| --- | --- |
| Docker CLI | Passed: Docker `29.5.2` |
| Docker daemon | Passed: Docker Desktop `29.5.2`, `aarch64` |
| Local activation baseline | Passed |
| Container build command plan | Passed |
| Image tag policy | Passed: `staging-local-001` |
| Disk space | Passed in prior retry diagnostics: 361 GiB available |
| Non-GPU Dockerfile forbidden behavior scan | Passed |
| Model download scan | Passed |
| Revideo core install scan | Passed |
| Secret/provider path scan | Passed |
| GPU/model package scan for API/CPU/render | Passed |
| `package-lock.json` | Unchanged |

## Build Adjustments

Two local build-environment fixes were needed before the final API image build could pass:

- Added a root `.dockerignore` so Docker did not try to copy the local symlinked `node_modules` into the build context.
- Updated `docker/prod/api/Dockerfile` so its build stage installs dev dependencies with `npm ci --include=dev`; the runtime stage still installs production dependencies separately.

These changes do not push images, deploy, run cloud commands, call providers, download models, process media, or change launch gates.

## Image Results

| Image | Dockerfile path | Local image | Image ID | Size | Log | Status | Warnings | Blockers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| api | `docker/prod/api/Dockerfile` | `us-central1-docker.pkg.dev/reeditpro-staging-test/reeditpro-staging-workers/reeditpro-api:staging-local-001` | `4dd122f3461b` | 446 MB | `activation-logs/container-builds/phase20b-staging-local-001/01-api.log` | built | npm deprecated `uuid` notices; npm audit reports 5 moderate vulnerabilities | none |
| tool-readiness-worker | `docker/prod/tool-readiness-worker/Dockerfile` | `us-central1-docker.pkg.dev/reeditpro-staging-test/reeditpro-staging-workers/reeditpro-tool-readiness-worker:staging-local-001` | `bc993a509c8b` | 2.02 GB | `activation-logs/container-builds/phase20b-staging-local-001/02-tool-readiness-worker.log` | built | apt debconf noninteractive notices; pip root-user notice; npm deprecated `uuid` notices; npm audit reports 5 moderate vulnerabilities | none |
| cpu-worker | `docker/prod/cpu-worker/Dockerfile` | `us-central1-docker.pkg.dev/reeditpro-staging-test/reeditpro-staging-workers/reeditpro-cpu-worker:staging-local-001` | `9f7449c13ada` | 3.19 GB | `activation-logs/container-builds/phase20b-staging-local-001/03-cpu-worker.log` | built | apt debconf noninteractive notices; pip root-user notice; npm deprecated `uuid` notices; npm audit reports 5 moderate vulnerabilities | none |
| qa-worker | `docker/prod/qa-worker/Dockerfile` | `us-central1-docker.pkg.dev/reeditpro-staging-test/reeditpro-staging-workers/reeditpro-qa-worker:staging-local-001` | `6d3a81928873` | 2.93 GB | `activation-logs/container-builds/phase20b-staging-local-001/04-qa-worker.log` | built | apt debconf noninteractive notices; pip root-user notice; npm deprecated `uuid` notices; npm audit reports 5 moderate vulnerabilities | none |
| render-worker | `docker/prod/render-worker/Dockerfile` | `us-central1-docker.pkg.dev/reeditpro-staging-test/reeditpro-staging-workers/reeditpro-render-worker:staging-local-001` | `5e7e5e2898c7` | 2.37 GB | `activation-logs/container-builds/phase20b-staging-local-001/05-render-worker.log` | built | apt debconf noninteractive notices; pip root-user notice; npm deprecated `uuid` notices; npm audit reports 5 moderate vulnerabilities | none |
| gpu-worker | `docker/prod/gpu-worker/Dockerfile` | `us-central1-docker.pkg.dev/reeditpro-staging-test/reeditpro-staging-workers/reeditpro-gpu-worker:staging-local-001` | n/a | n/a | n/a | deferred | not evaluated | explicitly out of scope for Phase 20B |

## Parsed Build Report

The build report parsed all five non-GPU logs successfully:

- Build results: 5
- Blockers: 0
- Warnings: 1, GPU build deferred
- Phase 21 non-GPU readiness: ready
- Docker push executed: false
- gcloud executed: false
- Production ready allowed: false
- External beta allowed: false
- Real user media testing allowed: false

## Phase 21B Readiness

Phase 21B non-GPU container readiness can start. The required non-GPU images `api`, `tool-readiness-worker`, `cpu-worker`, `qa-worker`, and `render-worker` all have local build evidence for `staging-local-001`.

Full GPU readiness remains blocked until the `gpu-worker` image is explicitly approved, built, and validated in a later GPU phase.

## Validation Status

| Check | Result |
| --- | --- |
| `smoke:activation-container-build-reporting` | Passed |
| `activation:container-build:report -- --image-tag staging-local-001` | Passed; static report remains blocked for missing log evidence by design |
| Log-backed `activation:container-build:report -- --image-tag staging-local-001 --log <five non-GPU logs>` | Passed; 5 build results, 0 blockers, Phase 21 non-GPU readiness true |
| `activation:container-readiness:plan -- --image-tag staging-local-001` | Passed; printed text-only human-run readiness command plan |
| `lint` | Passed |
| `build` | Passed with existing Vite large chunk warning |
| `build:server` | Passed |
| `git diff --check` | Passed |

## Safety State

- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `realUserMediaTestingAllowed=false`
- GPU image: not built
- Docker push: not run
- GCP/gcloud: not run
- Deployment: not run
- Providers: not called
- Model weights: not downloaded
- Real media: not processed
- Secrets: not added
- Revideo: not made core
