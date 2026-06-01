# Backend API Security And Fail-Closed Policy

## Required Rules

- Frontend responses must never include service-role secrets, provider keys, Stripe private keys, raw credentials, or raw env values.
- Provider keys never appear in route responses or logs.
- Signed URLs are temporary events, not source-of-truth records.
- Backend-required routes must fail closed with actionable blockers.
- Mutation routes require `Idempotency-Key` unless they are reporting-only blocked routes.
- Workspace/project access must be checked before scoped operations.
- Job, worker, provider, render/export, tool, media analysis, generation, SFX/music, StoryTiming, Stripe, and admin route groups remain blocked until dedicated milestones.
- No route starts downstream execution unless a future milestone explicitly enables that route group.
- No route silently downgrades auth, idempotency, workspace/project, approval, snapshot, credit, storage, provider, worker, or render checks.
- Error responses must avoid private data and redact sensitive detail keys.

## Prompt 7 Fail-Closed Behavior

Blocked execution-capable routes return:

- `ok: false`
- `status: "backend_required"`
- `requestId`
- `routeId`
- `routeGroup`
- `blockers`
- `warnings`
- `nextAction`

They do not call service methods that can insert execution records, run workers, call providers, render media, execute tools, create jobs, process payments, or mutate planning state.

## Safe Reporting Routes

Health, readiness, runtime status, route capability, and tool-readiness reporting may return safe booleans, status labels, blockers, route metadata, and configured/not-configured flags. They must not execute checks that run binaries, connect to remote systems, write records, or disclose values.
