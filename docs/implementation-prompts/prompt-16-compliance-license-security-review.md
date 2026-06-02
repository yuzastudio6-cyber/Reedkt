# Prompt 16 - Compliance, License, Dependency, and Security Review Foundation

## Small Context

Prompt 16 creates the compliance/license/dependency/security review foundation after the provider gateway foundation. It records review boundaries and blockers without approving production use or enabling runtime execution.

## Allowed Scope

- Compliance route/service/schema boundaries.
- Compliance review, route, and gate contracts.
- Dependency/security review runbook.
- Tool/provider compliance matrix.
- Compliance diagnostics and draft SQL/RLS test plan.

## Forbidden Scope

- No legal advice, legal approval, production approval, dependency approval, or runtime approval.
- No dependency mutation, audit fix, package installation beyond `npm ci`, tool package installation, or provider SDK installation.
- No Secret Manager access, provider secret read, provider call, tool execution, worker execution, render/export, media processing, storage transfer, credit mutation, Stripe, migrations, remote Supabase, deployment, production/beta unlock, or broad service-role handler.

## Canonical Concepts

Prompt 16 references future compliance review records, dependency/package/license/security review records, runtime approval records, model provenance review records, compliance audit events, tool readiness records, provider metadata, projects, workspaces, and sanitized audit events. Prompt 16 writes none of them.

## Deliverables

- `docs/compliance-license-security-review-foundation.md`
- `docs/compliance-review-contract.md`
- `docs/compliance-route-contract.md`
- `docs/compliance-gate-contract.md`
- `docs/dependency-security-review-runbook.md`
- `docs/tool-provider-compliance-matrix.md`
- `docs/prompt-16-validation-results.md`
- `database/test-sql/018_compliance_license_security_review_rls_smoke_tests.draft.sql`
- `scripts/validation/compliance-scope-diagnostics.mjs`
- Compliance route/service/schema/API metadata updates.

## Validation Checklist

Run:

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-15-provider-gateway-foundation...HEAD`
- `npm ci`
- `npm audit --audit-level=moderate --json` record-only
- `npm run lint`
- `npm run typecheck:server`
- all foundation diagnostics through `provider:gateway:diagnostics`
- `npm run --silent compliance:diagnostics`
- `npm run foundation:validate`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

## GitHub Requirement

- Branch: `codex/rp-foundation-16-compliance-license-security-review`
- PR base: `codex/rp-foundation-15-provider-gateway-foundation`
- PR title: `[foundation] Prompt 16 compliance license security review`
- PR: [PR #109](https://github.com/yuzastudio6-cyber/Reedkt/pull/109)
- Do not merge the PR.

## Acceptance Criteria

- Compliance review contract exists.
- Compliance route contract exists.
- Compliance gate contract exists.
- Dependency/security review runbook exists.
- Tool/provider compliance matrix exists.
- Compliance service fails closed when review DB/runtime is unavailable.
- Compliance routes do not approve production use.
- Compliance diagnostics pass.
- SQL/RLS draft test exists.
- Prompt 16 is tracked in implementation prompts.
