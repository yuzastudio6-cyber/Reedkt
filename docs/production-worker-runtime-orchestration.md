# Production Worker Runtime Orchestration

## Purpose

Milestone 4 adds the production-safe worker orchestration foundation for future ReeditPro tool recipes. It does not run media tools, AI models, providers, FFmpeg, OpenCV, Remotion, GPU jobs, or Google Cloud resources.

## Runtime Flow

```text
approved snapshot
  -> tool execution plan
  -> worker payload with IDs/storage refs
  -> worker gates
  -> mock-safe lease claim
  -> sanitized events
  -> placeholder worker route
  -> result writer
  -> lease release
```

## Boundaries

- Worker payloads reference approved snapshots and tool execution plans.
- Worker payloads use IDs and private storage references, not raw prompts or signed URLs.
- The frontend never runs these workers or heavy tools.
- Revideo remains evaluation-only and blocked from production execution.
- Milestone 4 routing returns placeholder dry-run/mock-safe results only.

## Future Integration

Later Cloud Run Jobs can call this runtime after container/tool readiness and real backend persistence exist. Until then, lease, idempotency, event, and result helpers are mock-safe/in-memory or draft-only.

## Canonical Cloud Dispatch Boundary

`canonical-cloud-worker-dispatch-handoff-v1` now freezes the dependency-safe
handoff between the durable package queue and future Google Cloud workers:

1. the package queue creates the only approved execution-attempt identity;
2. a regional Cloud Tasks message carries only opaque identity and hashes;
3. a private OIDC-authenticated controller reloads and revalidates the exact
   package, queue, region, job, placement, and attempt authority;
4. the controller calls the exact regional Cloud Run Jobs `run` API through a
   user-managed service identity and Application Default Credentials; and
5. the worker reloads the same authority and persists private evidence before
   completion is reconciled to the package queue.

Cloud Tasks delivery retry is transport recovery, not permission for another
execution attempt. Cloud Run job templates therefore set internal retries to
zero. Failed work can run again only through a new bounded package-queue
attempt after reconciliation/fallback policy permits it.

This is a pure, no-network authority contract. A later private slice proves
one same-host cross-process queue/outbox write-ahead transaction and exact
process-restart recovery. Distributed database outbox atomicity, OIDC/IAM,
controller and job deployment, service identity, private GCS object transport,
dead-letter reconciliation, capacity controls, production telemetry, and
benchmark evidence remain false and fail closed.

The follow-up private outbox/receiver contract now binds one active package
claim to one checksum-protected, restart-safe opaque dispatch entry. Exact
controller and worker identity receipts are idempotent under concurrent
redelivery and require server-owned issuer, principal, audience, expiry,
region, task, attempt, and receipt bindings. The receiver accepts only a
non-serializable process capability produced by an explicit verifier. Its
bounded cryptographic path verifies RS256 against a checksum-bound test JWKS
snapshot while recording that no live Google key fetch occurred. No raw
authorization token, claim credential, media, prompt, path, signed URL, or
worker command is persisted.

The accepted-worker completion contract is also implemented for the same
single-host private boundary. It revalidates the process-branded worker
principal, derives the completed queue outcome from the immutable job, requires
private artifact/QA/reconciliation/downstream-lease evidence plus an
attempt-level internal production-cost evidence hash, and commits queue
completion with one terminal outbox receipt through the package WAL. Real
process exits at both completion commit stages and separate-process completion
races recover to one result plus exact replay. Customer price, credits, service
fee, wallet, billing, and settlement authority remain absent.

The accepted-worker pre-commit failure contract now uses the same package lock
and a separate versioned failure WAL. It releases only the exact claim, writes
one terminal outbox receipt, derives retry availability/exhaustion/user review
from the approved attempt ceiling, rejects post-commit retry, and never starts
an automatic retry loop. Real process exits at both failure commit stages,
separate-process replay, completion/failure terminal racing, stale fencing,
tamper refusal, and versioned failed-attempt internal-cost evidence pass.

This is single-host private evidence only. The service rejects production and
purported live Google-verifier output until Google's supported live
auth-library/key-rotation adapter is wired outside request JSON. The local
package queue and outbox now share a process-recoverable write-ahead commit,
and the completion/failure transitions use the same lock plus versioned
terminal WAL records. Distributed database atomicity, multi-replica locking,
Cloud Tasks creation, Cloud Run Jobs calls, live OIDC/IAM, private GCS
transport, worker execution, and live completion reconciliation remain
blocked. See
`docs/canonical-service-identity-verifier-verification-2026-07-17.md` and
`docs/canonical-cloud-dispatch-outbox-receiver-verification-2026-07-17.md`, plus
`docs/canonical-private-package-state-transaction-verification-2026-07-17.md`
and
`docs/canonical-private-worker-completion-reconciliation-verification-2026-07-17.md`,
plus
`docs/canonical-private-worker-failure-reconciliation-verification-2026-07-17.md`.

## Throughput And ETA Principle

ReEditPro should optimize dependency-safe work in parallel, not deliberately
slow a job to resemble professional effort. A straightforward 30-minute source
workload may target roughly 10–20 minutes on provisioned cloud capacity, but
the actual estimate must be computed from source hours, resolution, codec,
camera count, transcript/vision passes, approved tools, AI generations,
render variants, QA passes, queue load, and available CPU/GPU/render capacity.

Before an ETA can be shown as reliable, representative deployed benchmarks
must record at least queue delay, cold-start time, source-minutes processed per
worker-minute, GPU utilization, per-stage wall time, critical-path time,
retry/recovery time, final render real-time factor, and QA time. Long work must
be sharded at approved boundaries so that a single GPU attempt never exceeds
the one-hour platform envelope and completed shards survive worker restart.

## Milestone 6 Media Foundation Route

Milestone 6 keeps the default `cpu_analysis_worker` route as placeholder-only. It adds an explicit optional `metadata.mediaFoundation` route for `dry_run` or `local_dev` media foundation work.

That route still passes the Milestone 4 gates: approved snapshot, idempotency, private storage references, no raw prompts, no signed URLs, no secrets, registry policy, and no Revideo production execution. Existing worker smokes do not require FFmpeg or FFprobe.

## Milestone 7 Speech/Caption Routes

Milestone 7 keeps default worker routing placeholder-only. It adds explicit optional routes:

- `gpu_ai_worker` may call speech foundation only when `metadata.speechFoundation.mode` is `dry_run` or `local_dev`.
- `render_worker` or `qa_worker` may call caption foundation only when `metadata.captionFoundation.mode` is `dry_run` or `local_dev`.

These routes still require approved snapshots, idempotency keys, private artifact references, and raw prompt/signed URL/secret rejection. Existing worker smokes do not require faster-whisper, model files, FFmpeg, or libass.

## Milestone 8 Smart Cut/Timeline Routes

Milestone 8 adds explicit metadata-only routes:

- `cpu_analysis_worker` may call smart cut foundation only when `metadata.smartCutFoundation.mode` is `dry_run` or `local_dev`.
- `render_worker` may call timeline foundation only when `metadata.timelineFoundation.mode` is `dry_run` or `local_dev`.

The routes produce smart cut/timeline metadata and QA gates only. They do not cut media, run FFmpeg edit commands, import OpenTimelineIO/Hyperframe/Remotion runtimes, render, export, or use Revideo.

## Milestone 9 Audio Routes

Milestone 9 adds explicit `metadata.audioFoundation` routes for `dry_run` or `local_dev` only:

- `cpu_analysis_worker` can run audio analysis/planning foundation.
- `gpu_ai_worker` can run model-tool audio scaffold planning when explicitly requested.
- `qa_worker` can run audio QA foundation.

These routes produce audio plans, artifacts, and QA gates only. They do not download models, run production cleanup/stem separation, final mux/export, call providers, or use Revideo.
## Milestone 13 Speech Caption Execution Route

`gpu_ai_worker` can route explicit `metadata.speechCaptionExecution.mode` payloads to the speech/caption execution pipeline. `render_worker` and `qa_worker` can route explicit caption-only execution/QA modes. Default worker placeholder behavior remains unchanged.
## Milestone 14 Smart Cut Timeline Execution Route

`cpu_analysis_worker` can route explicit `metadata.smartCutTimelineExecution.mode` payloads to the smart cut/timeline execution pipeline for dry-run, local-dev, container-ready, and gated production modes. `render_worker` can route explicit local/container timeline preview planning requests only. Default worker placeholder behavior remains unchanged, and existing smokes do not require FFmpeg, OpenTimelineIO, Hyperframe, Remotion, or Revideo runtimes.

## Milestone 15A Audio Execution Route

`cpu_analysis_worker` can route explicit `metadata.audioExecution.mode` payloads to the audio execution pipeline for dry-run, local-dev, container-ready, and gated production modes. `gpu_ai_worker` can route explicit model-audio execution only when `metadata.audioExecution.enableModelAudioExecution=true`. `qa_worker` can route explicit `metadata.audioExecutionQA.mode` payloads for audio QA. Default worker placeholder behavior remains unchanged, and existing smokes do not require FFmpeg, DeepFilterNet, RNNoise, Demucs, model weights, final mux/export, or Revideo.

## Milestone 15B Color Execution Route

`cpu_analysis_worker` can route explicit `metadata.colorExecution.mode` payloads to the color execution pipeline for dry-run, local-dev, container-ready, and gated production modes. `render_worker` can route explicit local/container color preview planning requests only. `qa_worker` can route explicit `metadata.colorExecutionQA.mode` payloads for color QA. Default worker placeholder behavior remains unchanged, and existing smokes do not require FFmpeg, OpenColorIO, OpenImageIO, final export, full render, masks/enhancement, or Revideo.

## Milestone 15C Mask Composition Route

`gpu_ai_worker` can route explicit `metadata.maskComposition.mode` payloads to the mask-composition pipeline for dry-run, local-dev, container-ready, and gated production modes. `cpu_analysis_worker` can route explicit dry-run QA/refinement-only mask metadata. `render_worker` can route explicit text-behind-subject preview/metadata planning only. `qa_worker` can route explicit `metadata.maskCompositionQA.mode` payloads for mask/text QA. Default worker placeholder behavior remains unchanged, and existing smokes do not require BiRefNet, SAM2, transparent-background, rembg, OpenCV, Kornia, FFmpeg, model weights, final render/export, or Revideo.

## Milestone 15D Enhancement Slowmotion Route

`gpu_ai_worker` can route explicit `metadata.enhancementSlowMotion.mode` payloads to the enhancement/slow-motion pipeline for dry-run, local-dev, container-ready, and gated production modes. `cpu_analysis_worker` can route explicit dry-run QA/analysis-only metadata. `qa_worker` can route explicit `metadata.enhancementSlowMotionQA.mode` payloads for enhancement/slow-motion QA. Default worker placeholder behavior remains unchanged, and existing smokes do not require Real-ESRGAN, FILM, OpenCV, Sharp, FFmpeg, model weights, final render/export, or Revideo.

## Milestone 16A Final Render Export Route

`render_worker` can route explicit `metadata.finalRenderExecution.mode` payloads to the final render/export pipeline for dry-run, local-dev, container-ready, and gated production modes. `qa_worker` can route explicit `metadata.finalRenderQA.mode` payloads for render/export/final-delivery QA. Default worker placeholder behavior remains unchanged, and existing smokes do not require FFmpeg, Remotion, libass, final cloud jobs, providers, or Revideo.

## Milestone 16B Full E2E Workflow Orchestrator

The M16B E2E workflow orchestrator composes existing explicit stage runners and pipeline entrypoints instead of adding new production execution behavior. It builds approved payloads with idempotency keys, passes private artifacts between stages, summarizes QA/fallback/readiness blockers, and proves production-ready remains blocked while current readiness/model/manual-review blockers remain.
