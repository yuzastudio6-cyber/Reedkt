# Prompt 14 - Worker Claim and Execution Contract Hardening

## Small Context

Prompt 14 hardens the future worker claim and execution contract after Prompt 8 job/worker boundaries and Prompt 13 tool readiness. It creates envelope, preflight, gate, diagnostics, and draft RLS contracts without enabling execution.

## Allowed Scope

- Worker execution envelope contracts.
- Claim, lease, heartbeat, complete, fail, cancel, stale recovery, runtime capability, and tool requirement boundaries.
- Safe validation schemas and fail-closed services.
- Route metadata, docs, diagnostics, and draft SQL/RLS tests.

## Forbidden Scope

- No real worker execution.
- No production job claim.
- No Cloud Run/PubSub/Cloud Tasks execution.
- No provider calls.
- No render/export execution.
- No tool execution or package installation.
- No media processing or browser capture.
- No credit mutation.
- No storage transfer.
- No remote Supabase, migrations, deployment, Stripe, production/beta unlock, or broad service-role handler.

## Canonical Concepts

Use canonical project/workspace access, approved snapshots, credit estimates/reservations, media/storage readiness references, jobs, job batches, job dependencies, job events, worker leases, worker job claims, job claim attempts, backend runtime messages, idempotency keys, tool runtime checks as readiness references, and tool call intents as readiness references.

## Deliverables

- `docs/worker-claim-execution-contract-hardening.md`
- `docs/worker-execution-envelope-contract.md`
- `docs/worker-claim-route-contract.md`
- `docs/worker-execution-gate-contract.md`
- `docs/prompt-14-validation-results.md`
- `database/test-sql/016_worker_claim_execution_contract_rls_smoke_tests.draft.sql`
- `scripts/validation/worker-execution-contract-diagnostics.mjs`
- Worker route/service/schema/API metadata updates.

## Validation Checklist

Run:

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-13a-tool-readiness-ci-validation-record...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- all existing diagnostics through `tool:readiness:diagnostics`
- `npm run --silent worker:execution:diagnostics`
- `npm run foundation:validate`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## GitHub Requirement

- Branch: `codex/rp-foundation-14-worker-claim-execution-contract-hardening`
- PR base: `codex/rp-foundation-13a-tool-readiness-ci-validation-record`
- PR title: `[foundation] Prompt 14 worker claim execution contract hardening`
- PR: [#103](https://github.com/yuzastudio6-cyber/Reedkt/pull/103)
- Do not merge the PR.

## Acceptance Criteria

- Worker execution envelope contract exists.
- Worker claim/execution route contract exists.
- Worker execution gate contract exists.
- Worker execution service fails closed.
- Tool readiness integration keeps runtime disabled.
- Worker claim/complete/fail/cancel placeholders do not execute workers.
- Worker execution diagnostics pass.
- SQL/RLS draft test exists.
- Prompt 14 is tracked in implementation prompts.
