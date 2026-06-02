# Staging Smoke Runbook

This runbook defines the safe sequence for Prompt 18 static validation and future local/staging smoke tests. Prompt 18 uses only the local static path.

## Preflight

1. Confirm branch `codex/rp-foundation-18-e2e-staging-smoke-test-plan`.
2. Confirm PR base `codex/rp-foundation-17-observability-audit-abuse-cost-controls`.
3. Confirm no secrets, signed URLs, private media, provider keys, service-role keys, Stripe keys, production/beta unlock flags, or deployment commands appear in the diff.
4. Confirm `package-lock.json` is unchanged unless a future prompt explicitly authorizes dependency mutation.
5. Run foundation validation or record local Node/npm blockers exactly.
6. Check GitHub Foundation Validation after PR creation.
7. Confirm Prompt 17 CI status is recorded as passed.

## Local Static Smoke

Allowed commands:

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-17-observability-audit-abuse-cost-controls...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent schema:static-audit`
- Existing `npm run --silent *:diagnostics` package scripts
- `npm run --silent e2e:staging:diagnostics`
- `npm run foundation:validate`
- `npm run build`
- `npm run build:server`
- `npm run foundation:validate:with-build`

Expected result: local static diagnostics pass when the host Node/npm path is compatible. If the host reports `Bad CPU type in executable`, record that as an environment blocker and rely on GitHub Foundation Validation for exact npm-script evidence.

Failure triage:

- Missing docs or tracker rows: fix Prompt 18 source-of-truth files.
- Diagnostic false positive: harden the diagnostic without weakening scope.
- Runtime execution finding: remove the unsafe behavior or recommend Prompt 18A.
- CI failure: record the job URL and block Prompt 19 until repaired.

## Future Local Supabase Smoke

Future local Supabase validation requires a compatible Supabase CLI, disposable local database, schema target review, fixture IDs, and explicit approval to promote draft SQL. It must not use remote links, production data, or production credentials.

## Future Staging Smoke

Future staging smoke requires human approval, staging Supabase, staging backend, staging storage, synthetic fixtures, no production data, no provider calls unless a later reviewed flag exists, no Stripe live mode, rollback notes, and evidence collection. The staging run must verify RLS, storage policy, route readiness, blocker behavior, audit previews, rate-limit/cost-control blockers, and fixture cleanup.

## Production Beta Go/No-Go

Production beta requires every gate in `docs/beta-readiness-gate-contract.md`, human product/security/compliance approval, durable audit/observability, persistent rate limits and cost controls, incident response, rollback, support readiness, and staging E2E evidence. Prompt 18 does not unlock beta or production.
