# Prompt 10A - Render Preview Export Validation Hardening

## Small Context

Prompt 10 added a limited render/preview/export route-service foundation, but PR #94 failed GitHub Foundation Validation at the default validation step. Prompt 10A identifies and fixes that validation failure without adding product capability.

## Allowed Scope

- Diagnose PR #94 Foundation Validation failure.
- Harden `backend:api:diagnostics` and `render:export:diagnostics`.
- Fix Prompt 10 render/export validation false positives or real scope leaks.
- Update validation results, source-of-truth docs, milestone plan, and implementation tracker.

## Forbidden Scope

- No real Remotion execution.
- No real FFmpeg execution.
- No preview rendering or final export.
- No worker execution.
- No provider calls.
- No tool execution.
- No media analysis or user-media processing.
- No credit mutation.
- No Stripe checkout/webhook/payment processing.
- No storage upload/download execution beyond Prompt 4 boundaries.
- No job execution beyond Prompt 8 fail-closed boundaries.
- No remote Supabase migration or validation.
- No deployment.
- No broad service-role handlers.

## Required Reading

- `docs/render-preview-export-foundation.md`
- `docs/render-preview-export-route-contract.md`
- `docs/render-readiness-gate-contract.md`
- `docs/prompt-10-validation-results.md`
- `scripts/validation/backend-api-route-scope-diagnostics.mjs`
- `scripts/validation/render-export-scope-diagnostics.mjs`
- `server/routes/render-routes.ts`
- `server/services/render-service.ts`
- `src/backend/api/routes/render-api-routes.ts`

## Deliverables

- `docs/prompt-10a-validation-hardening-results.md`
- Updated diagnostics scripts
- Updated Prompt 10 docs/status/source-of-truth records
- Updated `docs/implementation-prompts/README.md`

## Validation Checklist

- Run `git diff --check`.
- Run `git diff --check origin/codex/rp-foundation-10-render-preview-export-foundation...HEAD`.
- Run `npm ci`.
- Run `npm run lint`.
- Run `npm run typecheck:server`.
- Run `npm run --silent schema:static-audit`.
- Run `npm run --silent auth:rls:diagnostics`.
- Run `npm run --silent storage:scope:diagnostics`.
- Run `npm run --silent snapshot:scope:diagnostics`.
- Run `npm run --silent credit:scope:diagnostics`.
- Run `npm run --silent backend:api:diagnostics`.
- Run `npm run --silent job:worker:diagnostics`.
- Run `npm run --silent media:readiness:diagnostics`.
- Run `npm run --silent render:export:diagnostics`.
- Run `npm run foundation:validate`.
- Run `npm run foundation:validate:with-build`.
- If local Node remains blocked, document the exact blocker.
- Confirm GitHub Foundation Validation passes before recommending Prompt 11.

## GitHub Requirement

- Branch: `codex/rp-foundation-10a-render-preview-export-validation-hardening`
- PR base: `codex/rp-foundation-10-render-preview-export-foundation`
- PR title: `[foundation] Prompt 10A render preview export validation hardening`
- Do not merge the PR.
- After PR creation, update the implementation prompt tracker with the PR link.

## Acceptance Criteria

- Prompt 10 CI failure is identified.
- Prompt 10 validation failure is fixed or clearly escalated.
- Render/export diagnostics pass.
- Foundation validation passes locally or in CI.
- GitHub Foundation Validation passes before Prompt 11 is recommended.
- No new production capability is enabled.
- No real rendering/export is enabled.
- Prompt 10A is tracked in implementation prompts.
