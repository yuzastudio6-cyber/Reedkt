# Auth RLS Validation Environment Runbook

Prompt 3B documents the remaining validation-environment blockers around the limited auth/profile/workspace/project foundation. It does not add storage, uploads, media, planning, approved snapshots, credits, jobs, workers, providers, rendering, tools, Stripe, migrations, remote Supabase execution, or production service-role behavior.

## Current Validation State

| Check | Prompt 3B result | Notes |
| --- | --- | --- |
| `npm ci` | Passed with the Codex arm64 Node path first in `PATH`. | Direct `/usr/local/bin/npm` is blocked because `/usr/bin/env node` resolves to an x86_64 `/usr/local/bin/node` on this host. |
| `npm run lint` | Passed with the arm64 Node path workaround. | No source-scope violations were found by lint. |
| `npm run typecheck:server` | Passed with the arm64 Node path workaround. | Server TypeScript for the Prompt 3/3A auth/project path typechecks. |
| `npm run build` | Environment-blocked. | TypeScript completes far enough for Vite to start, then Vite/Rolldown cannot load its Darwin arm64 native binding because of code-signature/native-binding failure. |
| `npm run schema:static-audit` | Passed with `--silent`. | Static local file inspection only; no Supabase connection and no SQL execution. |
| `npm run auth:rls:diagnostics` | Passed with `--silent` and the arm64 Node path workaround. | Direct `npm run` remains host-Node blocked unless `PATH` prefers `/Applications/Codex.app/Contents/Resources`. |
| Supabase CLI | Environment-blocked. | `/usr/local/bin/supabase` exists but cannot execute on this host: `Unknown system error -86`, equivalent to the shell `bad CPU type in executable` failure. |
| RLS SQL | Draft-only and unexecuted. | `database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql` is intentionally not promoted to executable SQL. |

## Vite/Rolldown Build Blocker

`npm run build` currently fails after `tsc -b` reaches Vite:

```text
Error: Cannot find native binding.
ERR_DLOPEN_FAILED ... @rolldown/binding-darwin-arm64 ... code signature ... not valid for use in process:
mapping process and mapped file (non-platform) have different Team IDs
```

This is treated as an environment/native-binding blocker because:

- `npm ci` completed from the lockfile.
- `npm run lint` passed.
- `npm run typecheck:server` passed.
- The failure happens while Vite loads Rolldown's native binding, not while compiling Prompt 3/3A auth code.
- The same failure appeared in Prompt 3A after dependencies were installed.

Safe remediation options:

- Put an arm64 Node binary first in `PATH` before running npm scripts on this host.
- Remove and reinstall `node_modules` locally from the existing lockfile.
- Verify host Node architecture with `node -p "process.platform + ' ' + process.arch"`.
- Run the full build in Linux CI or a clean Linux container to avoid the local Darwin code-signature issue.
- Keep dependency artifacts out of git.

Do not:

- Change product code just to silence the native binding failure.
- Pin or upgrade Vite/Rolldown/native binding packages without a separate dependency/toolchain prompt.
- Delete or rewrite `package-lock.json`.
- Commit `node_modules`.

## Supabase CLI Blocker

The local Supabase CLI is present at `/usr/local/bin/supabase`, but version probing fails:

```text
spawnSync /usr/local/bin/supabase Unknown system error -86
```

The shell equivalent is:

```text
zsh:1: bad CPU type in executable: supabase
```

This points to a local binary architecture mismatch. Prompt 3B does not connect to remote/staging Supabase and does not run SQL.

Safe remediation options:

- Install the Supabase CLI build that matches the host architecture.
- Use a Dockerized local Supabase environment if available and approved for local validation.
- Run the RLS tests in approved Linux CI or a clean local container.
- Keep production and staging Supabase disconnected until a prompt explicitly approves that validation.

Do not:

- Use production Supabase for Prompt 3B validation.
- Run remote migrations.
- Add credentials, service-role keys, signed URLs, provider keys, or private media.

## Recommended Validation Path Before Prompt 4

Minimum acceptable validation before Prompt 4:

- `npm ci` from the existing lockfile succeeds.
- `npm run lint` passes.
- `npm run typecheck:server` passes.
- Static audit passes.
- Auth/RLS diagnostics report zero blocked table and legacy `user_profiles` matches in runtime auth/project files.
- Full build failure is proven environment-only, with a known alternate validation path.
- Local RLS remains clearly blocked or has a working disposable local validation path.

Ideal validation before Prompt 4:

- Full `npm run build` passes in Linux CI or a repaired local environment.
- Supabase CLI works in a disposable local environment.
- The RLS smoke test is promoted only after fixture setup and schema-era compatibility are settled.
- Auth/profile/workspace/project RLS checks run locally with owner/member/non-member cases.

Prompt 3B decision:

- Prompt 4 should wait because full build and local RLS validation remain environment-blocked.
- Recommended next prompt: Prompt 3C - Validation Toolchain Repair.
