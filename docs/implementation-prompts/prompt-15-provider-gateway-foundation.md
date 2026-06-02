# Prompt 15 - Provider Gateway Foundation

## Small Context

Prompt 15 creates the provider gateway foundation after worker execution contract hardening. It defines provider readiness, secret-reference, request envelope, attempt, webhook, output, and blocker boundaries without enabling provider execution.

## Allowed Scope

- Provider gateway route/service/schema boundaries.
- Provider request envelope and gate contracts.
- Provider secret boundary policy.
- Static provider catalog/model summaries.
- Provider diagnostics and draft SQL/RLS test plan.

## Forbidden Scope

- No real provider calls.
- No provider SDK installation.
- No Secret Manager access or provider secret reads.
- No provider webhook processing.
- No generated asset creation.
- No worker execution, production job claim, Cloud Run/Pub/Sub/Cloud Tasks execution.
- No render/export, tool execution, media processing, browser capture, storage transfer, credit mutation, Stripe, migrations, remote Supabase, deployment, production/beta unlock, or broad service-role handler.

## Canonical Concepts

Prompt 15 references projects/workspaces, approved snapshots, credit estimates/reservations, jobs/worker records as readiness references, tool-call intents as readiness references, storage object records as output policy references, QA blockers, provider catalog/model records, provider request attempts, provider webhook events, backend runtime messages, and sanitized audit events. Prompt 15 writes none of them.

## Deliverables

- `docs/provider-gateway-foundation.md`
- `docs/provider-request-envelope-contract.md`
- `docs/provider-gateway-route-contract.md`
- `docs/provider-gateway-gate-contract.md`
- `docs/provider-secret-boundary-policy.md`
- `docs/prompt-15-validation-results.md`
- `database/test-sql/017_provider_gateway_rls_smoke_tests.draft.sql`
- `scripts/validation/provider-gateway-scope-diagnostics.mjs`
- Provider route/service/schema/API metadata updates.

## Validation Checklist

Run:

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-14-worker-claim-execution-contract-hardening...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- all foundation diagnostics through `worker:execution:diagnostics`
- `npm run --silent provider:gateway:diagnostics`
- `npm run foundation:validate`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## GitHub Requirement

- Branch: `codex/rp-foundation-15-provider-gateway-foundation`
- PR base: `codex/rp-foundation-14-worker-claim-execution-contract-hardening`
- PR title: `[foundation] Prompt 15 provider gateway foundation`
- PR: pending
- Do not merge the PR.

## Acceptance Criteria

- Provider request envelope contract exists.
- Provider route and gate contracts exist.
- Provider secret boundary policy exists.
- Provider service fails closed when transport/secrets/runtime are unavailable.
- Provider attempt and webhook placeholders do not call providers or write provider records.
- Provider diagnostics pass.
- SQL/RLS draft test exists.
- Prompt 15 is tracked in implementation prompts.
