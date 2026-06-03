# Prompt 20G Local Supabase Migration Chain Repair

Prompt 20G repairs one local-only Supabase migration-chain blocker found while `supabase start` was applying the local migration chain.

## Original Error

Local Supabase migration application reached:

`supabase/migrations/202605130007_generation_providers_generated_assets.sql`

and failed in the seed insert for `public.generation_provider_models`:

```text
ERROR: column reference "description" is ambiguous
```

The failing statement selected an unqualified `description` column while joining `public.generation_providers gp` with a lateral `seed` values table. Both sources expose `description`, so Postgres could not determine which value should be inserted into `generation_provider_models.description`.

## Root Cause

The migration used bare seed column names in seeded `INSERT ... SELECT` statements:

- `capability`, `supports_transparency`, `supports_timing_constraints`, `supports_prompt_weights`, and `payload` in the `generation_provider_capabilities` insert.
- `model_key`, `model_name`, `display_name`, `description`, `default_quality_level`, `supports_transparent_background`, `supports_word_level_timing`, `supports_seed`, and `payload` in the `generation_provider_models` insert.

The immediate blocker was the bare `description` reference, but the same seed pattern could become ambiguous for other names if provider tables gain matching columns later.

## SQL Repair

The repair is intentionally narrow:

- No table is renamed.
- No data is dropped.
- No migration ordering is changed.
- No production/staging/remote Supabase command is run.
- No unrelated schema change is added.

The seeded `INSERT ... SELECT` statements now qualify values through the `seed` alias:

- `generation_provider_capabilities`: `seed.capability`, `seed.supports_transparency`, `seed.supports_timing_constraints`, `seed.supports_prompt_weights`, `seed.payload`.
- `generation_provider_models`: `seed.model_key`, `seed.model_name`, `seed.display_name`, `seed.description`, `seed.default_quality_level`, `seed.supports_transparent_background`, `seed.supports_word_level_timing`, `seed.supports_seed`, `seed.payload`.

## Local-Only Validation Result

Prompt 20G standard validation passed:

- `git diff --check`
- `git diff --check origin/codex/rp-foundation-20f-manual-host-tool-repair-verification...HEAD`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run foundation:validate`

Local Supabase readiness checks completed but remained blocked:

- `npm run --silent supabase:local:toolchain:probe` exited `0` with `status=blocked`.
- `npm run --silent supabase:local:preflight` exited `0` with `status=blocked`.
- `remoteRiskDetected=false`.
- `canUseDocker=true`.
- `canStartLocalSupabase=false`.
- `canRunLocalSql=false`.
- `canProceedToPrompt20B=false`.

The local start gate was not met because:

- `/usr/local/bin/supabase` is still a Mach-O x86_64 binary on this arm64 host and fails with `Unknown system error -86`.
- `psql` is not on PATH.
- no localhost-only local Supabase database URL is verified.
- no executable local-only SQL candidate exists.

Because the preflight did not allow local start, Prompt 20G did not run `supabase start` or `supabase status`.

## Supabase Touch Status

Prompt 20G did not touch local, staging, remote, or production Supabase. It did not run `supabase start`, `supabase status`, `supabase link`, remote SQL, staging SQL, production SQL, remote migrations, deployments, SQL/RLS smoke tests, provider calls, rendering, tool execution, worker execution, credit mutation, Stripe, beta unlock, or broad service-role handlers.

## Remaining Blockers

SQL/RLS tests remain unrun and Prompt 20B remains blocked. The migration repair is in place, but the host toolchain must provide an executable arm64-compatible Supabase CLI before the local migration chain can be reattempted. The next safe milestone is Prompt 20H - Local Supabase Migration Chain Repair Follow-Up, which should first verify local start gates and then retry the local migration chain.

## Exact Capability

Exact production capability enabled: `none; local-only Supabase migration chain repair`.
