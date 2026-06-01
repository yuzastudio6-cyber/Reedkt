# Prompt 12 - Tool-Call Foundation

Branch: `codex/rp-foundation-12-tool-call-foundation`  
Base: `origin/codex/rp-foundation-11-qa-revision-fallback-foundation`  
PR title: `[foundation] Prompt 12 tool-call foundation`

## Objective

Implement backend-safe tool-call planning contracts after Prompt 11. The milestone defines route/service boundaries, validation schemas, tool-call context envelope DTOs, catalog contracts, decision preview contracts, readiness blocker reporting, diagnostics, and draft SQL/RLS test planning.

## Allowed Scope

- Tool-call context-envelope validation.
- Static planning-only tool catalog and chain metadata.
- Tool-decision preview summaries.
- Intent creation/read/list route boundaries that fail closed.
- Execution/runtime/license readiness blockers.
- API route metadata under the `tools` domain.
- Static diagnostics and draft RLS test plan.

## Forbidden Scope

- Tool execution.
- Tool package installation.
- Workers, providers, rendering, media processing, browser capture, model/GPU execution, or production jobs.
- Credit mutation, storage transfer, signed URL creation, remote Supabase, SQL execution, migrations, deployment, or Stripe.
- Deep per-tool runtime profiles beyond planning placeholders.

## Acceptance Criteria

- Routes require auth.
- The future intent creation route requires idempotency.
- Context validation can pass schema-only.
- Decision preview is planning-only.
- Intent persistence/execution/runtime/license routes fail closed with `backend_required` or blocked states.
- Diagnostics pass and are included in the foundation runner.
- `package-lock.json` remains unchanged.
