# Local Supabase Safety Preflight

Prompt 20 local Supabase/RLS validation may run only after this checklist passes. The checklist is local-only and evidence-only.

## Required Pass Checklist

| Check | Prompt 20 result | Status |
| --- | --- | --- |
| No remote project linked | No `.supabase/project-ref` or `.supabase/.temp/project-ref` detected. | Passed |
| No production project ref | No local link indicator detected. | Passed |
| No staging project ref | No local link indicator detected. | Passed |
| No production secrets | No risky secret-like env var names detected by preflight. Values were not read or printed. | Passed |
| No service-role env variables used | No service-role env var names detected. | Passed |
| No provider keys | No provider key env var names detected. | Passed |
| No Stripe keys | No Stripe key env var names detected. | Passed |
| No signed URLs | No signed URL values are required or used. | Passed |
| Docker/local-only target verified | Docker binary exists, but daemon is unavailable. | Blocked |
| Supabase CLI compatible | CLI exists but is x86_64 and fails on this arm64 host with error `-86`. | Blocked |
| Supabase local config exists | `supabase/config.toml` is missing. | Blocked |
| Local SQL executor available | `psql` is not on PATH. | Blocked |
| Database reset is local-only | Not proven because local Supabase target is blocked. | Blocked |
| SQL tests use synthetic fixtures | Future-only; no fixtures created. | Blocked |
| Cleanup is available | Future-only; no fixtures created. | Blocked |
| Results are evidence-only | Prompt 20 results are evidence-only. | Passed |
| No beta/prod unlock | Beta and production remain blocked. | Passed |

## Automated Preflight

Run:

```sh
npm run --silent supabase:local:preflight
```

The script:

- Uses Node built-in modules only.
- Does not intentionally make remote network calls.
- Does not print secrets.
- Does not execute SQL.
- Does not run migrations.
- Does not deploy.
- Does not call providers, tools, workers, renderers, storage transfer, Stripe, or telemetry.
- Detects risky env var names without reading values.
- Detects local Supabase link indicators.
- Detects `supabase/config.toml`.
- Detects draft SQL files.
- Checks whether Supabase CLI, Docker, and `psql` are available.

## Execution Rule

If any of the following are true, do not run SQL:

- Supabase CLI is missing or cannot execute.
- Docker/local runtime is unavailable.
- `supabase/config.toml` is missing.
- `.supabase` project-ref or link indicators exist.
- Risky Supabase/database/provider/payment env var names are present.
- `psql` or an approved local SQL executor is unavailable.
- No local executable SQL candidate exists.
- The target database URL cannot be proven to be localhost, `127.0.0.1`, or `::1`.

## Prompt 20 Decision

Prompt 20 preflight reports blocked. No SQL execution is allowed until Prompt 20A repairs the local toolchain or provides an approved local-only container path.

## Prompt 20A Update

Prompt 20A adds a local-only `supabase/config.toml` and hardens the preflight output. The preflight now reports:

- `status`: `ready`, `blocked`, or `warning`;
- blocker IDs and warning IDs;
- `canRunLocalSql`;
- `canStartLocalSupabase`;
- `canResetLocalSupabase`;
- `canUseDocker`;
- `canUsePsql`;
- `remoteRiskDetected`.

Prompt 20A preflight result on this host:

| Check | Prompt 20A result | Status |
| --- | --- | --- |
| Local config exists | `supabase/config.toml` exists and contains no remote remotes block. | Passed |
| Docker daemon reachable | Docker reports server version `29.5.2`. | Passed |
| Supabase CLI compatible | `/usr/local/bin/supabase` is x86_64 and fails on arm64 with error `-86`. | Blocked |
| `psql` available | `psql` is not on PATH. | Blocked |
| Local executable SQL exists | none under `database/test-sql/local/`. | Blocked |
| Remote risk detected | no remote link indicator or risky env var name was detected. | Passed |

Prompt 20A still does not permit SQL execution. Run mode must include `--confirm-local-only` and preflight must report `canRunLocalSql=true`.

## Prompt 20C Manual Setup Update

Prompt 20C keeps preflight local-file/tool inspection only. It does not execute SQL, start Supabase, reset Supabase, run migrations, call `psql`, touch staging/remote/production Supabase, or unlock beta.

Prompt 20C adds clearer result fields:

- `manualSetupRequired`
- `nextRecommendedPrompt`
- `prompt20BReadiness.canProceed`
- `prompt20BReadiness.requiredBeforePrompt20B`
- `blockerIds`
- `warningIds`
- `criticalFindingIds`
- `remediation`

Prompt 20C expected result on this host:

| Check | Prompt 20C result | Status |
| --- | --- | --- |
| Local config exists | `supabase/config.toml` exists and appears local-only. | Passed |
| Docker daemon reachable | Docker reports server version `29.5.2`. | Passed |
| Supabase CLI compatible | `/usr/local/bin/supabase` is x86_64 and fails on arm64 with error `-86`. | Blocked |
| `psql` available | `psql` is not on PATH. | Blocked |
| Local executable SQL exists | none under `database/test-sql/local/`. | Blocked |
| Local DB URL verified | not verified because the Supabase CLI cannot execute. | Blocked |
| Remote risk detected | no remote link indicator or risky env var name was detected. | Passed |
| Prompt 20B can proceed | `canRunLocalSql=false`. | Blocked |

Prompt 20C recommends Prompt 20D - Manual Environment Setup Verification until preflight reports `canRunLocalSql=true`.

## Prompt 20D Verification Update

Prompt 20D keeps preflight and runner checks local-only and non-mutating. It does not execute SQL, start Supabase, reset Supabase, run migrations, call `psql`, call `supabase status`, touch staging/remote/production Supabase, or unlock beta.

Prompt 20D adds:

- redacted localhost-only local DB URL environment verification;
- `canProceedToPrompt20B`, separate from `canRunLocalSql`;
- dry-run output that reports `callsSupabaseStatus=false`.

Prompt 20D result on this host:

| Check | Prompt 20D result | Status |
| --- | --- | --- |
| Local config exists | `supabase/config.toml` exists and appears local-only. | Passed |
| Docker daemon reachable | Docker reports server version `29.5.2`. | Passed |
| Supabase CLI compatible | `/usr/local/bin/supabase` is x86_64 and fails on arm64 with error `-86`. | Blocked |
| `psql` available | `psql` is not on PATH. | Blocked |
| Local DB URL verified | no localhost-only local DB URL environment variable is verified. | Blocked |
| Local executable SQL exists | none under `database/test-sql/local/`. | Blocked |
| Remote risk detected | no remote link indicator or risky env var name was detected. | Passed |
| Prompt 20B can proceed | `canProceedToPrompt20B=false`. | Blocked |
| SQL can run now | `canRunLocalSql=false`. | Blocked |

Prompt 20D recommends Prompt 20E - Manual Environment Setup Follow-Up until preflight reports `canProceedToPrompt20B=true`.

## Prompt 20E Manual Follow-Up Update

Prompt 20E adds a separate host toolchain probe:

```sh
npm run --silent supabase:local:toolchain:probe
```

The probe is manual-only and does not install tools, run `npx`, execute SQL, call `supabase status`, start Supabase, connect with `psql`, touch staging/remote/production Supabase, or mutate files.

Prompt 20E result on this host:

| Check | Prompt 20E result | Status |
| --- | --- | --- |
| Docker daemon reachable | Docker reports server version `29.5.2`. | Passed |
| Supabase CLI compatible | `/usr/local/bin/supabase` is x86_64 and fails on arm64 with error `-86`. | Blocked |
| `psql` available | `psql` is not on PATH. | Blocked |
| Homebrew path | `/usr/local`; `/opt/homebrew` not present. | Blocked for arm64 Homebrew repair |
| Local DB URL verified | no localhost-only local DB URL environment variable is verified. | Blocked |
| Local executable SQL exists | none under `database/test-sql/local/`. | Blocked |
| Prompt 20B can proceed | `canProceedToPrompt20B=false`. | Blocked |

Prompt 20E recommends Prompt 20F - Manual Host Tool Repair Verification until host tools are repaired outside the repo.

## Prompt 20F Host Repair Verification Update

Prompt 20F reuses the same manual-only host probe and local preflight. It does not install tools, download tools, run `npx`, execute SQL, call `supabase status`, start Supabase, connect with `psql`, touch staging/remote/production Supabase, or mutate files.

Prompt 20F result on this host:

| Check | Prompt 20F result | Status |
| --- | --- | --- |
| Supabase CLI compatible | `/usr/local/bin/supabase` is x86_64 and fails on arm64 with error `-86`. | Blocked |
| Docker daemon reachable | Docker CLI exists, but the daemon is unavailable to this process. | Blocked |
| `psql` available | `psql` is not on PATH. | Blocked |
| Local DB URL verified | no localhost-only local DB URL environment variable is verified. | Blocked |
| Local executable SQL exists | none under `database/test-sql/local/`. | Blocked |
| Remote risk detected | no remote link indicator or risky env var name was detected. | Passed |
| Prompt 20B can proceed | `canProceedToPrompt20B=false`. | Blocked |

Prompt 20F recommends Prompt 20F1 - Manual Host Tool Repair Follow-Up until host tools are repaired outside the repo.
