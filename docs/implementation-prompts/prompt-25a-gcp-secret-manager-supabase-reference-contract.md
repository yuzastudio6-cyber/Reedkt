# Prompt 25A - GCP Secret Manager Supabase Reference Contract

## Summary

Prompt 25A creates the Google Cloud Secret Manager Supabase reference contract. It is documentation, diagnostics, validation tracking, and PR/CI tracking only.

Exact capability enabled: none; GCP Secret Manager Supabase reference contract only.

## Branch And PR

- Branch: `codex/rp-foundation-25a-gcp-secret-manager-supabase-reference-contract`
- Base: `origin/codex/rp-foundation-25-staging-supabase-rls-dry-run-command-packet`
- PR: pending
- PR title: `[foundation] Prompt 25A GCP Secret Manager Supabase reference contract`

## Allowed Scope

- Document Secret Manager Supabase reference names.
- Document staging and production reference separation.
- Document future least-privilege access and rotation policy.
- Document command placeholder rules.
- Add static diagnostics that inspect repo files only.
- Update source-of-truth and readiness trackers.

## Forbidden Scope

Prompt 25A must not run Google Cloud APIs, Secret Manager APIs, Supabase lifecycle commands, SQL, migrations, `psql`, deployments, providers, tools, workers, rendering/export, media processing, storage transfer, credit mutation, Stripe, telemetry, human approval grant, staging execution approval, production approval, or beta unlock.

## Deliverables

- `docs/gcp-secret-manager-supabase-reference-contract.md`
- `docs/gcp-secret-manager-supabase-secret-matrix.md`
- `docs/gcp-secret-manager-supabase-access-policy.md`
- `docs/gcp-secret-manager-supabase-command-placeholder-policy.md`
- `docs/prompt-25a-validation-results.md`
- `scripts/validation/gcp-secret-manager-supabase-reference-diagnostics.mjs`
- package script `gcp:supabase:secret-refs:diagnostics`
- tracker updates

## Validation Checklist

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-25-staging-supabase-rls-dry-run-command-packet...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`
- `npm run --silent gcp:supabase:secret-refs:diagnostics`
- existing Prompt 21-25 diagnostics
- local toolchain probe/preflight
- RLS list-tests and dry-run only
- optional build checks if local host remains safe

## Acceptance Criteria

- Secret references are documented as references only.
- No raw Supabase values are introduced.
- No GCP or Secret Manager value is fetched.
- Prompt 25 command placeholders reference Secret Manager reference names.
- Diagnostics pass.
- Trackers record docs/status only.
- Human approval, accepted evidence, staging execution, production readiness, and beta unlock remain blocked.
