# Prompt 17 - Observability, Audit, Abuse Prevention, and Cost Controls

## Small Context

Prompt 17 creates operational safety foundations after Prompt 16 compliance/license/security review. It defines observability, audit, rate-limit, abuse-prevention, cost-control, and runbook boundaries without enabling production monitoring, billing, or execution.

## Allowed Scope

- Observability route/service/schema boundaries.
- Audit event, rate-limit, abuse-prevention, cost-control, route-risk, request-trace, and operational alert contracts.
- Operational runbook and gate docs.
- Observability diagnostics and draft SQL/RLS test plan.

## Forbidden Scope

- No external telemetry integration, production audit persistence, production rate-limit enforcement, paid billing, Stripe checkout/webhooks/payment processing, provider calls, provider secret reads, Secret Manager access, tool execution, worker execution, production job claims, Cloud Run/Pub/Sub/Cloud Tasks, rendering/export, media processing, browser capture, deployment, remote Supabase, SQL execution, schema-changing migrations, production/beta unlock, or broad service-role handler.

## Canonical Concepts

Prompt 17 references `workspaces`, `workspace_members`, `projects`, `profiles`, `audit_events`, `backend_runtime_messages`, `api_idempotency_keys`, `job_events`, `provider_request_attempts`, `worker_job_claims`, `worker_leases`, `signed_url_events`, compliance review records, future `rate_limit_events`, future `abuse_prevention_events`, future `usage_metering_records`, future `cost_control_records`, future `operational_alert_records`, future `runtime_health_snapshots`, and future `audit_event_summaries`. Prompt 17 writes none of them.

## Deliverables

- `docs/observability-audit-abuse-cost-foundation.md`
- `docs/audit-event-contract.md`
- `docs/rate-limit-abuse-cost-control-contract.md`
- `docs/observability-route-contract.md`
- `docs/observability-gate-contract.md`
- `docs/operational-runbook-foundation.md`
- `docs/prompt-17-validation-results.md`
- `database/test-sql/019_observability_audit_abuse_cost_rls_smoke_tests.draft.sql`
- `scripts/validation/observability-scope-diagnostics.mjs`
- Observability route/service/schema/API metadata updates.

## Validation Checklist

Run:

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-16-compliance-license-security-review...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- all foundation diagnostics through `compliance:diagnostics`
- `npm run --silent observability:diagnostics`
- `npm run foundation:validate`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## GitHub Requirement

- Branch: `codex/rp-foundation-17-observability-audit-abuse-cost-controls`
- PR base: `codex/rp-foundation-16-compliance-license-security-review`
- PR title: `[foundation] Prompt 17 observability audit abuse cost controls`
- PR: [PR #111](https://github.com/yuzastudio6-cyber/Reedkt/pull/111)
- Do not merge the PR.

## Acceptance Criteria

- Observability/audit foundation exists.
- Audit event contract exists.
- Rate-limit/abuse/cost-control contract exists.
- Observability route contract exists.
- Observability gate contract exists.
- Operational runbook exists.
- Observability service fails closed when persistence/runtime is unavailable.
- Observability routes do not enable external telemetry, billing, execution, or production unlocks.
- Observability diagnostics exist and pass.
- SQL/RLS draft test exists.
- Prompt 17 is tracked in implementation prompts.
