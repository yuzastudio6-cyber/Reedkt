# Validation Toolchain Repair Runbook

Prompt 3C creates a reproducible validation path for the limited auth/profile/workspace/project foundation. It does not enable storage, uploads, media, planning, approved snapshots, credits, jobs, workers, providers, rendering, tools, Stripe, migrations, remote Supabase validation, deployment, or production service-role behavior.

## Validation Paths

| Path | Command | Purpose | Expected use |
| --- | --- | --- | --- |
| Default foundation validation | `npm run foundation:validate` | Runs required local/static checks without full Vite build. | Local validation when Rolldown native binding is blocked on Darwin. |
| Foundation validation with build | `npm run foundation:validate:with-build` | Runs required checks and attempts `npm run build`. | Linux CI or a repaired local build environment. |
| Skip full build explicitly | `REEDITPRO_SKIP_FULL_BUILD=true npm run foundation:validate` | Records the build as intentionally skipped. | Local environment documentation only. |

The required default checks are:

- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent schema:static-audit`
- `npm run --silent auth:rls:diagnostics`

The validation runner emits JSON to stdout. It exits nonzero when required checks fail or a full build fails for code/product reasons. Known Vite/Rolldown native-binding failures are classified as `environment_blocked` so the failure is not mistaken for auth/profile/workspace/project code breakage.

## Local Darwin Build Route

This host has two Node resolution issues:

- direct `npm` can resolve an x86_64 `/usr/local/bin/node` through `/usr/bin/env`;
- Vite/Rolldown can fail on Darwin while loading `@rolldown/binding-darwin-arm64`.

Use this local validation route:

```sh
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm ci
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run foundation:validate
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run foundation:validate:with-build
```

If the build result is `environment_blocked`, validate the full build in Linux CI before marking full build as passing.

## Linux CI Build Route

Prompt 3C adds `.github/workflows/foundation-validation.yml`.

The workflow:

- runs on `ubuntu-latest`;
- installs dependencies with `npm ci`;
- runs `npm run foundation:validate`;
- runs `npm run foundation:validate:with-build`;
- does not configure Supabase credentials;
- does not run migrations or SQL;
- does not deploy;
- does not call providers, render media, or execute tools.

The CI route is the preferred full-build validation path until the local Darwin native-binding blocker is repaired.

## Supabase And RLS Route

Prompt 3C does not convert or run `database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql`.

RLS validation remains blocked until:

- a host-compatible Supabase CLI or Dockerized local Supabase path exists;
- disposable local auth fixtures are defined;
- schema-era cleanup/compatibility is resolved enough for the test to be executable local-only;
- no remote/staging Supabase connection is needed.

Do not use production or staging Supabase to route around local CLI failure in Prompt 3C.

## Decision Before Prompt 4

Prompt 4 may proceed only when:

- default foundation validation passes;
- full build passes in Linux CI or another documented clean build environment;
- RLS remains clearly documented as blocked/local-only draft, or a safe local RLS route has been repaired and run.

If CI full build fails or local RLS validation remains a hard requirement before storage/upload work, run Prompt 3D - CI/Local Supabase Validation Repair before Prompt 4.

## Prompt 3C Local Result

Prompt 3C local validation on this host:

- `npm ci`: passed with the arm64 Node `PATH` workaround.
- `npm run foundation:validate`: passed.
- `npm run foundation:validate:with-build`: completed with overall `environment_blocked`.
- `npm run lint`: passed.
- `npm run typecheck:server`: passed.
- `npm run build`: environment-blocked by the Vite/Rolldown Darwin native binding code-signature failure.
- local SQL/RLS: not run; Supabase CLI remains blocked by `Unknown system error -86`.

The Linux CI workflow remains the full-build validation route for this PR.
