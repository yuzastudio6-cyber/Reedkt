# Supabase Worker Runtime Transactional RPC 4 Validation Report

Validation target: blocked guarded staging packet, docs, prompts, diagnostics, and package script only.

## Required Commands

- `git diff --check`
- `npm ci --no-audit --no-fund --progress=false`
- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent supabase-worker-runtime:transactional-rpc-4:diagnostics`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`

## Required Safety Scans

- changed-file scan for Supabase URL/key values, service-role-like values, JWT-like values, Postgres connection strings, bearer tokens, and `.env` additions.
- changed-file scan for SQL execution, migration deployment, Supabase mutation, Secret Manager payload access, worker execution, job claim/lease execution, route/tool/provider/model execution, private artifact/GCS access, signed URL/public artifact creation, dependency mutation, beta/production unlock, raw prompt execution, and final render/export claims.
- staged scan for the same safety classes.
- changed-file inventory must include no files under `supabase/migrations/`.

## Status To Record After Execution

If validation passes, record the command results in the PR body. If validation fails, keep the PR draft and record the exact blocker without running SQL or mutating Supabase.

## Validation Closure

Validation status: incomplete_blocked_by_host_resource_limit_exit_137_during_npm_ci

Validation blocker: host_resource_limit_exit_137_during_npm_ci

- `git diff --check`: passed.
- `npm ci --no-audit --no-fund --progress=false`: failed with exit 137 and no package-lock change.
- `npm_config_jobs=1 npm_config_foreground_scripts=false npm ci --no-audit --no-fund --progress=false`: failed with exit 137 and no package-lock change.
- `npm run lint`: blocked because `eslint` was unavailable after `npm ci` did not complete.
- `npm run typecheck:server`: blocked because `tsc` was unavailable after `npm ci` did not complete.
- `npm run --silent supabase-worker-runtime:transactional-rpc-4:diagnostics`: passed.
- `npm run build`: blocked because `tsc` was unavailable after `npm ci` did not complete.
- `npm run build:server`: blocked because `tsc` was unavailable after `npm ci` did not complete.
- `git diff --cached --check`: passed.
- changed-file safety scan: passed.
- staged safety scan: passed.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
