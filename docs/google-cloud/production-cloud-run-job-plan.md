# Production Cloud Run Service And Job Plan

## Backend API Service

- Runtime: Cloud Run Service.
- Name: `reeditpro-api`.
- Service account: `reeditpro-api-sa`.
- Region: `GCP_REGION`.
- Min instances: `0`.
- GPU: none.
- Secrets: referenced through Secret Manager placeholders only.
- Deployment: not performed in Milestone 3.

## Worker Jobs

| Job | Runtime | Service account | GPU | Notes |
| --- | --- | --- | --- | --- |
| `reeditpro-cpu-analysis-worker` | Cloud Run Job | `reeditpro-cpu-worker-sa` | No | CPU/media analysis command placeholder. |
| `reeditpro-gpu-ai-worker` | Cloud Run Job | `reeditpro-gpu-worker-sa` | `nvidia-l4`, 1 GPU | First GPU test template only. |
| `reeditpro-render-worker` | Cloud Run Job | `reeditpro-render-worker-sa` | No by default | Core render stack template: Hyperframe, Remotion, FFmpeg, libass, OpenTimelineIO. |
| `reeditpro-qa-worker` | Cloud Run Job | `reeditpro-qa-worker-sa` | No by default | GPU only if a later heavy CV QA milestone approves it. |
| `reeditpro-tool-readiness-worker` | Cloud Run Job | `reeditpro-tool-readiness-sa` | No | No source media access by default. |

## Revideo Policy

Revideo is not deployed. It remains evaluation-only and future optional.

## Milestone 3 Boundary

All deploy/run files are `.example.sh` templates. They require `REEDITPRO_CONFIRM_PROD_SETUP=true` if a human runs them later, but Codex must not run them.

## Milestone 4 Worker Runtime Handoff

Milestone 4 adds `server/workers/production` orchestration modules that future Cloud Run Jobs can call after deployment and persistence are approved. Those modules validate approved snapshots, idempotency, registry policy, artifacts, QA references, leases, retries, and sanitized events before placeholder routing.

Cloud Run Jobs are still not deployed in Milestone 4, and the production worker runtime still does not run real media tools, providers, AI models, GPU workloads, or Revideo.

## Milestone 5 Image Template Handoff

Milestone 5 adds production image template names that future Cloud Run services/jobs can reference after human build/push approval:

- `reeditpro-api`
- `reeditpro-cpu-worker`
- `reeditpro-gpu-worker`
- `reeditpro-render-worker`
- `reeditpro-qa-worker`
- `reeditpro-tool-readiness-worker`

The image templates live under `docker/prod/`, and the human-run build/push command templates live under `scripts/docker/prod/`. They do not deploy Cloud Run resources, and Codex does not build or push them in Milestone 5.

## Milestone 11 GPU Image Handoff

The GPU worker image will be produced later from the M11 GPU Dockerfile after human build approval. The Cloud Run GPU job remains `nvidia-l4`, 1 GPU, at least 4 CPU and 16Gi memory, and `--no-gpu-zonal-redundancy`.

M11 does not execute the GPU job, build/push the image, download model weights, run inference, or deploy Cloud Run resources. RTX PRO 6000 remains future/premium/evaluation only with 20 CPU and 80Gi minimum requirements.
## Milestone 12 Readiness Requirement

Cloud Run Jobs should not be deployed until the unified production readiness report has been reviewed. M12 does not run `gcloud`, deploy jobs, execute GPU inference, process media, or download model weights.
## Milestone 17 Cost And Safety Requirements

Cloud Run service/job deployment is blocked until cost controls, worker concurrency limits, rate limits, job timeouts, kill switches, sanitized logging, and audit policies are approved.

Render/GPU/provider paths must remain kill-switched until the M17 scorecard blockers are cleared by humans.
