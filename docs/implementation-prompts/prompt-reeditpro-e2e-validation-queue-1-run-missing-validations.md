# REEDITPRO-E2E-VALIDATION-QUEUE-1 Run Missing Validations, No Execution

## Goal
Run dependency-backed validations only for PRs classified `validate_first` by REEDITPRO-E2E-MERGE-HYGIENE-1.

## Required Source
- Read `docs/reeditpro-e2e-open-pr-validation-prompt-queue.md`.
- Validate one PR at a time in its existing branch/worktree or an isolated clean worktree.
- Do not merge or convert drafts.

## Required Checks
- Re-query the PR before validation.
- Hydrate dependencies with `npm ci` only if needed, and require `package-lock.json` unchanged.
- Run the PR-specific diagnostics plus cross-chat ownership, production readiness, beta summary, lint, server typecheck, `npx tsc -b`, build, server build, and diff checks when applicable.
- Safety scan changed and staged files for secrets, Supabase/DB URLs, signed/public artifact markers, unsafe true runtime flags, readiness widening, media/runtime claims, SQL/migration changes, runtime paths, media/artifacts, and disallowed staged paths.

## Prohibited Scope
Do not merge, convert drafts, run workers/routes/tools/media/providers/models, mutate Supabase, run SQL, create storage objects, create signed/public artifacts, mutate credits/Stripe, or unlock beta/production.

## No-Scope Statement
No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.
