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

If any gate fails, the response is `409` with precise blocker records. The gateway does not attempt worker dispatch when pre-dispatch blockers exist.

## Adapter Boundary

Milestone 4 intentionally allows only mock-safe placeholder adapters:

- `cpu_analysis_worker_placeholder`
- `gpu_ai_worker_placeholder`
- `render_worker_placeholder`
- `qa_worker_placeholder`
- `tool_readiness_worker_placeholder`

Each adapter must match its worker type. Unfinished lanes, frontend-preview-only tools, planning-only tools, evaluation-only tools, blocked tools, worker-owner mismatches, and over-budget requests return blockers.

Gateway metadata is not allowed to contain lower-level worker router selector keys such as `mediaFoundation`, `finalRenderExecution`, `audioExecution`, `colorExecution`, `maskComposition`, or QA equivalents. Those keys are reserved for later explicitly approved adapter milestones.

The lower production worker dispatcher remains mock-safe in this milestone. Its outputs are placeholder/future-handler records, not real media processing.

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

The smoke tests verify successful backend-only placeholder dispatch and blockers for over-budget requests, adapter mismatch, unfinished lanes, unsafe artifact references, raw prompt metadata, and missing auth.
