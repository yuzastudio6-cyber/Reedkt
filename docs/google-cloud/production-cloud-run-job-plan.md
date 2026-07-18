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

Every job template uses task count `1`, parallelism `1`, and Cloud Run internal
maximum retries `0`. The approved package queue is the sole authority for a
new execution attempt. Cloud Tasks delivery retries may redeliver the same
opaque dispatch intent to the private controller, but they must never create a
second package attempt or allow Cloud Run to hide another execution attempt.

## Canonical Dispatch Handoff

The frozen future flow is:

```text
approved package queue entry
  -> regional Cloud Tasks queue
  -> private authenticated dispatch controller
  -> Cloud Run Jobs run API
  -> one exact CPU, GPU, render, QA, or readiness job execution
```

Cloud Tasks carries only an opaque dispatch-intent ID, package/job identity,
delivery attempt, and integrity hashes. It never carries media bytes, prompts,
storage paths, signed URLs, secrets, or credentials. The controller must load
the immutable server-owned authority, reject stale or duplicate delivery, and
call the exact regional Cloud Run Job through OAuth Application Default
Credentials. Cloud Run Jobs do not expose a long-running HTTP handler.

The controller deadline is intentionally short (`60` seconds). Media work runs
inside the job, not inside the task request. CPU job attempts are capped by the
contract at seven days and GPU attempts at one hour; work beyond those bounds
must be split into independently recoverable approved jobs rather than silently
extending an attempt.

The contract is implemented and privately verified, but no task, controller,
job, service identity, IAM binding, or cloud resource was created. Live OIDC,
Invoker/Developer IAM, distributed database outbox atomicity, private GCS
transport, dead-letter reconciliation, concurrency controls, and
representative performance benchmarks remain release gates.

The follow-up private source contract adds a durable single-host outbox and
exact controller/worker receiver state machine. One active package claim
creates one opaque outbox entry; concurrent task or worker redelivery returns
the same receipt without authorizing another package attempt. The receiver
accepts only process-branded verifier output. Its zero-network cryptographic
core verifies RS256, a bounded server-owned test JWKS snapshot, issuer,
principal, audience, issue/expiry time, task, attempt, controller receipt,
region, and target bindings while persisting no bearer token or claim
credential. The test snapshot cannot claim live Google key retrieval. The
private package queue and outbox now share one same-host cross-process
write-ahead commit with process-restart recovery. A second versioned
same-host WAL now reconciles one accepted-worker queue completion with one
terminal outbox receipt and exact replay, including private
artifact/QA/reconciliation/downstream and attempt-level internal-cost evidence.
Accepted-worker timeout reconciliation now resolves the exact persisted
failed-timeout cost record under the package lock and rejects caller-supplied
hashes. The three currently metered DeepFilterNet, Remotion, and FFmpeg
profiles now add a create-only attempt-start/cost binding and a
controller-owned single-host timeout finalizer for the hard-crash path. A
distributed package transaction, production profiles for other tools, and a
deployed heartbeat/death observer remain required.
This does not execute a job or grant customer commercial authority. A
distributed database-backed transactional outbox/completion boundary, live
Google token/key-rotation and IAM proof using the source-implemented
auth-library adapter, multi-replica coordination, deployment, and live worker
completion flow are still required.

The existing `us-central1` foundation defaults and coarse service-account
templates must be reconciled with the canonical `us-east1`/`europe-west1`
resource map before any human-run deployment. Target existence and IAM remain
false until that reconciliation and live inspection pass.

Primary platform constraints:

- [Cloud Tasks quotas](https://docs.cloud.google.com/tasks/docs/quotas)
- [Cloud Tasks HTTP target authentication](https://docs.cloud.google.com/tasks/docs/creating-http-target-tasks)
- [Cloud Run Jobs execution](https://docs.cloud.google.com/run/docs/execute/jobs)
- [Cloud Run Jobs task timeouts](https://docs.cloud.google.com/run/docs/configuring/task-timeout)
- [Cloud Run service identity](https://docs.cloud.google.com/run/docs/securing/service-identity)

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

No customer-facing 30-minute-video ETA is authorized by these templates. A
10–20 minute target for a straightforward 30-minute source workload is an
engineering benchmark target, not a guaranteed minimum or SLA. Multi-hour,
multicam, 4K, effects-heavy, provider-dependent, or revision-heavy work must be
estimated from measured stage telemetry after deployment.
