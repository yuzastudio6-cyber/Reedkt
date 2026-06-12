# Worker Observability And QA Boundary

Status: `ready_with_warnings_for_worker_1`.

## Observability Surfaces

- `server/workers/worker-events.ts` sanitizes payload JSON before returning events and before writing `job_events`.
- `server/observability/worker-event-observability.ts` wraps sanitized log handling for production worker records.
- `server/observability/sanitized-log-policy.ts` is the general redaction boundary.
- `server/workers/production/production-worker-events.ts` and `server/workers/production/production-worker-types.ts` define production worker event shapes.

## QA Surfaces

- `server/workers/production/production-worker-gates.ts` includes a `qa_policy` gate.
- `server/workers/render/render-execution-qa-builder.ts`, `server/workers/color/color-execution-qa-builder.ts`, `server/workers/audio/audio-execution-qa-builder.ts`, and related worker-family QA builders exist as future execution surfaces.
- Existing Track B and activation docs contain multiple bounded QA paths, but those do not approve WORKER-0 execution.

## WORKER-1 Requirements

WORKER-1 should require sanitized event shape checks, explicit QA evidence contracts, failed/blocked state reporting, cleanup/rollback evidence, and no raw provider response or secret payload commit.

No worker execution, tool execution, route execution, media processing, upload, signed URL, public artifact, beta, or production action is approved by this boundary.
