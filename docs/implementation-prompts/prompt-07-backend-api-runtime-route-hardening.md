# Prompt 7 - Backend API Runtime And Route Hardening

## Small Context

Prompt 3 through Prompt 6 added limited foundations for auth/profile/workspace/project, storage/upload, approved snapshots, and credit gates. Prompt 7 hardens the backend API runtime and route layer before future job, worker, provider, render, tool, and Stripe implementation.

## Allowed Scope

- Backend API route registration and route metadata.
- Health/readiness/runtime status and route capability reporting.
- Request ID propagation.
- Safe error and success response envelopes.
- Auth/workspace/project/idempotency route guard usage.
- Backend-required/fail-closed route responses.
- Diagnostics, docs, runbooks, and validation reporting.

## Forbidden Scope

- Production deployment.
- Remote Supabase migrations or SQL execution.
- Provider calls.
- Rendering/export execution.
- Tool execution.
- Stripe checkout/webhooks/payment processing.
- Worker execution, worker claims, media probe execution, or job creation.
- Media analysis, transcription, generation, SFX/music generation, StoryTiming execution, or broad service-role mutation.

## Route Groups

Allowed limited route groups:

- Health/readiness/runtime status.
- Auth/profile/workspace/project.
- Storage/upload.
- Approved snapshots.
- Credits.

Blocked route groups:

- Chat persistence/planning generation.
- Jobs/workers.
- Providers.
- Render/export.
- Tools.
- Media analysis/transcription.
- Stripe.
- SFX/music generation.
- StoryTiming execution.
- Admin/broad service-role mutation.

## Deliverables

- `docs/backend-api-runtime-hardening.md`
- `docs/backend-api-route-hardening-contract.md`
- `docs/backend-api-security-and-fail-closed-policy.md`
- `docs/backend-api-route-hardening-test-plan.md`
- `docs/prompt-07-validation-results.md`
- `scripts/validation/backend-api-route-scope-diagnostics.mjs`
- Updated server route helpers, blocked route groups, health routes, API route registry, mock API router, foundation validation, and source-of-truth trackers.

## Validation Checklist

- Run `git diff --check`.
- Run `git diff --check origin/codex/rp-foundation-06-credit-ledger-approval-gate-runtime...HEAD`.
- Run `npm ci`.
- Run `npm run lint`.
- Run `npm run typecheck:server`.
- Run `npm run --silent schema:static-audit`.
- Run `npm run --silent auth:rls:diagnostics`.
- Run `npm run --silent storage:scope:diagnostics`.
- Run `npm run --silent snapshot:scope:diagnostics`.
- Run `npm run --silent credit:scope:diagnostics`.
- Run `npm run --silent backend:api:diagnostics`.
- Run `npm run foundation:validate`.
- Run `npm run foundation:validate:with-build`.
- Do not run remote/staging Supabase.
- Do not deploy.
- Do not execute blocked route groups.

## GitHub Requirement

- Branch: `codex/rp-foundation-07-backend-api-runtime-route-hardening`
- Base: `codex/rp-foundation-06-credit-ledger-approval-gate-runtime`
- PR title: `[foundation] Prompt 7 backend API runtime route hardening`
- Do not merge the PR.
- After PR creation, update this prompt tracker with the PR link.

## Acceptance Criteria

- Backend API route surface is hardened and documented.
- Route contract standard exists.
- Fail-closed/security policy exists.
- Blocked execution route groups fail closed.
- Backend API diagnostics exist and pass.
- Foundation validation includes backend API diagnostics.
- No new production execution, deployment, migration, provider, render, worker, tool, Stripe, storage, snapshot, credit, planning, or media-analysis capability is enabled.
