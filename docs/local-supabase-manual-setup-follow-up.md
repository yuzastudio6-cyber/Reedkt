# Local Supabase Manual Setup Follow-Up

Prompt 20E verifies the host local Supabase toolchain after Prompt 20D. It is manual-only: it does not install tools, download tools, run SQL, start Supabase, run `supabase status`, reset Supabase, apply migrations, connect with `psql`, touch staging/remote/production Supabase, deploy, or unlock beta.

## Purpose

Prompt 20D proved the repo-owned safety gates work, but local SQL/RLS validation remains blocked by host toolchain issues. Prompt 20E adds a standalone host probe and records whether the host is ready for Prompt 20B.

## Current Host Probe Result

`npm run --silent supabase:local:toolchain:probe` completed with status `blocked` and exit code `0`.

| Check | Result |
| --- | --- |
| Host architecture | `arm64` |
| Node used by validation | Codex-bundled Node `v24.14.0` |
| Supabase CLI path | `/usr/local/bin/supabase` |
| Supabase CLI architecture | `Mach-O 64-bit executable x86_64` |
| Supabase CLI version | blocked with error `-86` |
| Docker path | `/usr/local/bin/docker` |
| Docker version | `29.5.2`, build `79eb04c` |
| Docker daemon | reachable, server version `29.5.2` |
| `psql` | missing from PATH |
| Homebrew path | `/usr/local/bin/brew` |
| Homebrew prefix | `/usr/local` |
| `/opt/homebrew` | not present |
| Local DB URL | no localhost-only local DB URL env var verified |
| Local SQL candidates | none under `database/test-sql/local/` |

## Decision

Prompt 20E remains blocked:

- `canProceedToPrompt20B=false`
- `canRunLocalSql=false`
- `manualSetupRequired=true`
- `remoteRiskDetected=false`
- next recommended prompt: Prompt 20F - Manual Host Tool Repair Verification

Prompt 20B remains blocked until the non-SQL host environment gates are repaired manually outside the repo.

## Required Manual Repairs

Repair these outside the repository:

- replace or shadow `/usr/local/bin/supabase` with an arm64-compatible Supabase CLI;
- install `psql` or provide a future approved local-only SQL executor;
- provide a localhost-only local Supabase DB URL through `REEDITPRO_LOCAL_SUPABASE_DB_URL`, `LOCAL_SUPABASE_DB_URL`, or `SUPABASE_LOCAL_DB_URL`;
- keep `supabase/config.toml` local-only and avoid `supabase link`.

Because Homebrew is currently `/usr/local`-prefixed and `/opt/homebrew` is absent, Prompt 20E does not rely on Homebrew repair. If Homebrew is used manually, prefer an Apple Silicon `/opt/homebrew` path and verify it with `file "$(which supabase)"`.

## Safe Commands

Prompt 20E allows only evidence commands:

```sh
npm run --silent supabase:local:toolchain:probe
npm run --silent supabase:local:preflight
npm run supabase:rls:list-tests
npm run supabase:rls:local:dry-run
```

## Forbidden Commands

Prompt 20E does not run:

- `brew install`, `npm install -g`, downloads, or `npx`;
- `supabase start`, `supabase status`, `supabase db reset`, `supabase migration up`, `supabase db push`, or `supabase link`;
- `psql` against any database;
- SQL, migrations, local/staging/remote/production record creation;
- provider, tool, worker, render/export, media, storage, credit, Stripe, telemetry, deploy, or beta unlock commands.

## Prompt 20B Gate

Prompt 20B may proceed only when `canProceedToPrompt20B=true`. `canRunLocalSql=true` remains stricter and also requires a local executable SQL candidate under `database/test-sql/local/`.

If only the SQL candidate is missing after host repair, Prompt 20B may create the first local-only executable SQL candidate and run it through the guarded runner with `--confirm-local-only`.
