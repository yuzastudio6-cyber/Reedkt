# Backend Tool Execution Gateway

Milestone 4 adds a single backend-safe entry point for approved tool-call execution:

```http
POST /v1/tool-executions/dispatch
```

The gateway sits above worker routes, provider routes, render routes, and tool adapters. Frontend code can request dispatch only through this endpoint; it must never call FFmpeg, OpenCV, Remotion, provider APIs, worker routes, Supabase service-role actions, or media tools directly.

## Required Gates

The route requires:

- authenticated request context
- `Idempotency-Key` header
- workspace and project IDs
- approved plan snapshot ID
- approved credit estimate ID
- active credit reservation ID
- approved reservation remaining credit limit
- high tool-call estimate within the approved reservation
- production registry tool readiness
- backend worker/tool ownership match
- allowed gateway adapter
- private source-of-truth artifact references
- metadata without raw prompts, secrets, provider keys, or signed URLs
- for `production_ready` only: a passing production-readiness evidence packet plus backend-owned operations-control admission for kill switches, workspace rate limits, project concurrency limits, and worker concurrency limits

If any gate fails, the response is `409` with precise blocker records. The gateway does not attempt worker dispatch when pre-dispatch blockers exist.

## Adapter Boundary

The gateway keeps mock-safe placeholder adapters for planning and dry-run routes:

- `cpu_analysis_worker_placeholder`
- `gpu_ai_worker_placeholder`
- `render_worker_placeholder`
- `qa_worker_placeholder`
- `tool_readiness_worker_placeholder`

`production_ready` requests cannot use those placeholders. They must use an explicitly reviewed backend adapter such as the media-foundation handlers, caption/render metadata handlers, core tool-readiness checks, or the Track A native validation adapters:

- `tool_readiness_worker_streamer_render_pipeline_support`
- `tool_readiness_worker_mkvtoolnix_container_validation`
- `tool_readiness_worker_gpac_mp4box_packaging_validation`

Each adapter must match its worker type and exact reviewed tool scope. Unfinished lanes, frontend-preview-only tools, planning-only tools, evaluation-only tools, blocked tools, worker-owner mismatches, and over-budget requests return blockers.

Gateway metadata is not allowed to contain lower-level worker router selector keys such as `mediaFoundation`, `finalRenderExecution`, `audioExecution`, `colorExecution`, `maskComposition`, `trackANativeValidation`, or QA equivalents unless an explicitly reviewed adapter allowlists the exact key. Current exceptions are limited to `mediaFoundation` for reviewed media-foundation handlers, `smartCutTimelineExecution` for the smart-cut/timeline metadata handler, `audioExecution` for the bounded audio metadata/QA handler, `colorExecution` for the bounded color metadata/QA handler, `finalRenderExecution` for the bounded render-manifest/command-plan/QA metadata handler, `speechCaptionExecution` for reviewed caption metadata/QA handlers, and `trackANativeValidation` for the three Track A native validation adapters. Other keys remain reserved for later explicitly approved adapter milestones.

The Track A native validation adapters produce private QA report artifacts and QA gate results only. They do not run GStreamer, MKVToolNix, GPAC/MP4Box media commands, process user media, create public artifacts, or approve final export/product delivery by themselves.

## Artifact Privacy

The gateway validates full artifact reference records before reducing them to worker payload IDs. Artifact references must be:

- private
- source-of-truth
- supported production storage bucket purpose
- path-scoped under `workspaces/<workspaceId>/projects/<projectId>/`
- not a signed URL or raw URL

Worker payloads receive storage reference IDs only.

## Cost And Credit

The gateway uses the Milestone 3 cost/credit assertion:

- approved snapshot required
- credit estimate ID required
- credit reservation ID required
- idempotency key required
- high estimate must fit the approved reservation

Over-budget requests must go back through a revised estimate and reservation approval path before dispatch.

For `production_ready`, post-dispatch billing audit uses the persistent service-role tool-cost path only after the supplied production evidence proves deployed Supabase migrations, explicit Data API grants, backend-only beta and production readiness evidence access, authenticated RLS readback, and service-role-only settlement RPC execution. Missing deployed persistence evidence blocks before worker dispatch or billing audit.

## Production Ops Controls

`production_ready` dispatch is not allowed to rely only on a user-supplied readiness packet. Immediately before a new worker dispatch, the gateway checks backend-owned operations controls:

- active kill-switch state;
- workspace job creation rate limit;
- project concurrent job limit;
- worker-type concurrent job limit.

Local/mock runtime uses in-memory counters for deterministic smoke coverage. Non-mock runtime defaults production kill switches active unless backend env opens them, and reads persistent `api_idempotency_keys` and `worker_leases` for rate/concurrency checks. Missing deployed control sources fail closed before worker dispatch or billing audit.

When the `production_ready` operations-control step runs, the gateway response includes a sanitized `productionOpsControls` audit record with the admission result, blocker codes, warnings, active kill-switch state, workspace rate-limit counter, project concurrency counter, worker concurrency counter, configured limits, and whether persistent backend counters were checked. Agent/tool-call orchestration should use this structured record to explain why a backend-approved tool call was admitted or blocked instead of parsing freeform warning text.

## Non-Goals

This milestone does not enable live provider calls, direct worker execution from the browser, real tool binaries, media processing, Docker, Supabase writes, billing mutation, Stripe, external beta, or production execution.

## Validation

Run:

```bash
npm run smoke:tool-execution-gateway
npm run smoke:tool-call-cost-credit-gate
npm run smoke:tool-call-intent-planner
npm run smoke:tool-cost-metering
npm run smoke:prod-cost-controls
npm run smoke:worker
npm run smoke:prod-runtime-contracts
npm run typecheck:server
```

The smoke tests verify successful backend-only placeholder dispatch, reviewed bounded production handlers, and blockers for over-budget requests, adapter mismatch, unfinished lanes, unsafe artifact references, raw prompt metadata, and missing auth. The render metadata handler proves private render manifest and non-executing command-plan/QA records only; it does not create previews, final exports, or public delivery.
