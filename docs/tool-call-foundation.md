# Tool-Call Foundation

Prompt 12 adds backend-safe contracts for deterministic tool calls without enabling tool execution. The implementation defines the route/service/validation boundary that future worker milestones can use after approved snapshots, credit gates, media readiness, storage records, render records, QA reports, and audit records exist.

## Implemented Scope

- Express routes under `/v1/tools/*` registered in `server/app.ts`.
- Zod schemas for catalog queries, tool-call context envelopes, decision previews, intent boundaries, execution blockers, runtime readiness, and license readiness.
- A fail-closed service that returns `backend_required`, `blocked`, or `mock_only` planning data instead of creating jobs or executing tools.
- API route metadata under the `tools` domain.
- Static diagnostics for forbidden execution, missing idempotency, missing registry wiring, and unsafe side effects.
- Draft SQL/RLS smoke-test plan for future `tool_call_intents`, `tool_call_executions`, and `tool_runtime_checks` validation.

## Explicitly Not Implemented

Prompt 12 does not install packages, execute tools, run shell commands for tools, process media, capture browsers, render/export media, call providers, create jobs, claim workers, mutate credits, upload/download storage objects, generate signed URLs, deploy runtimes, run remote Supabase, or apply SQL migrations.

## Runtime Behavior

The service exposes three safe behaviors:

- Static catalog and chain lists are `mock_only` planning metadata.
- Context validation and decision preview are schema-only and planning-only.
- Tool-call intent persistence, reads, execution readiness, runtime readiness, and license readiness fail closed with `backend_required` blockers.

## Next Milestone

Prompt 13 should add honest tool readiness/runtime checks only. It must still avoid media transforms, browser automation against user targets, provider calls, rendering, optional tool installs, and arbitrary execution unless explicitly scoped and reviewed.
