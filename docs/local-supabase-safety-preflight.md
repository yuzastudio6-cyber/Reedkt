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
