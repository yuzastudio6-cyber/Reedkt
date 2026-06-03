# Prompt 20D - Manual Environment Setup Verification

## Summary

Prompt 20D verifies whether the manual local Supabase environment setup from Prompt 20C is complete enough for Prompt 20B. It is verification-only and does not run SQL or Supabase lifecycle commands.

## Branch

- Branch: `codex/rp-foundation-20d-manual-environment-setup-verification`
- Base: `origin/codex/rp-foundation-20c-local-supabase-environment-manual-setup`
- PR title: `[foundation] Prompt 20D manual environment setup verification`

## Scope

Prompt 20D may inspect local tool availability and run static/local safety diagnostics:

- architecture, Node, npm, Supabase CLI, Docker, and `psql` probes;
- `supabase:local:preflight`;
- `supabase:rls:list-tests`;
- `supabase:rls:local:dry-run`.

Prompt 20D must not run SQL, `supabase start`, `supabase status`, `supabase db reset`, `supabase migration up`, `supabase db push`, `psql`, staging Supabase, remote Supabase, production Supabase, deployment, providers, tools, workers, storage transfer, signed URLs, or beta/production unlocks.

## Implementation Notes

- Dry-run mode is status-free by default and records `callsSupabaseStatus=false`.
- Preflight now reports `canProceedToPrompt20B` separately from `canRunLocalSql`.
- `canRunLocalSql=true` requires both a verified local environment and an executable local-only SQL candidate.
- `canProceedToPrompt20B=true` may be true when the environment is ready but Prompt 20B still needs to create the first executable SQL candidate.

## Current Result

Prompt 20D is blocked.

Remaining blockers:

- arm64-compatible Supabase CLI required;
- `psql` or approved local SQL executor required;
- localhost-only local DB URL required;
- first executable local SQL candidate remains a Prompt 20B work item.

## Production Capability Enabled

None.

Prompt 20D enables no SQL execution, migration, Supabase runtime, provider call, tool execution, worker execution, storage transfer, signed URL creation, deployment, Stripe flow, or production/beta capability.
