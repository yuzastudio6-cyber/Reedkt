# Production Cloud Run Service And Job Plan

> **Current WeEditPro authority:** the historical CPU/L4-first job list in
> older milestones cannot authorize new work. Heavy processing uses one-shot
> A100 80 GB Google Cloud Batch jobs. Normal substantive media work uses the
> L4 standard-primary Cloud Run Job, and eligible heavy work may use the
> separately qualified L4 fallback only after an allowed A100 failure. All
> accelerator routes start from zero and return to zero.

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
| Per-attempt A100 heavy primary | Google Cloud Batch | `reeditpro-gpu-worker-sa` | A100 80 GB, 1 GPU | `a2-ultragpu-1g`; created only after exact approved/funded admission and deleted at terminal state. |
| `reeditpro-professional-l4` | Cloud Run Job | `reeditpro-gpu-worker-sa` | `nvidia-l4`, 1 GPU | Standard-primary normal media/render/encode/inspection/QA route; 8 vCPU, 32 GiB. |
| `reeditpro-sam31-l4-fallback` | Cloud Run Job | `reeditpro-gpu-worker-sa` | `nvidia-l4`, 1 GPU | Independently qualified SAM 3.1 heavy fallback only; 8 vCPU, 32 GiB. |
| Legacy CPU/render/QA jobs | Historical Cloud Run Job templates | Legacy identities | None | Readback/migration only; cannot execute fresh substantive media/model work. |
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
  -> one exact lightweight-control, A100-heavy, L4-standard,
     L4-heavy-fallback, or readiness job execution
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

The active private-media cohort and primary runtime region are `us-central1`.
A route may not move private media cross-region to chase capacity or price.
Target existence, quota, IAM, image, model, price, and release evidence remain
false until exact live inspection passes.

The shared GPU worker now also has a source-implemented, one-shot
process-bound operation router for the candidate-only Faster Whisper CUDA
envelope. This is operation-selection and cryptographic request/response
revalidation only. It neither calls `jobs.run` nor proves an image, live
identity, IAM, mounts, output artifact, QA, cost, completion receipt, or
production authority. The runtime must still load exact attempt authority by
opaque dispatch intent; no browser or caller may submit the runner envelope.

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

The historical generic GPU image did not establish current placement. Active
images are `reeditpro-sam31-gpu` for the separately qualified A100/L4 SAM 3.1
routes and `reeditpro-l4-media-worker` for the L4 standard route. Both L4 jobs
use one `nvidia-l4`, 8 vCPU, 32 GiB, parallelism 1, retries 0, and
`--no-gpu-zonal-redundancy`.

RTX PRO 6000 is not part of the current A100/L4 policy. SAM 3.1 weights are
never installed on a developer Mac or downloaded at runtime; they are ingested
once from the official gated repository into the private artifact owner and
mounted read-only by exact generation.
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
