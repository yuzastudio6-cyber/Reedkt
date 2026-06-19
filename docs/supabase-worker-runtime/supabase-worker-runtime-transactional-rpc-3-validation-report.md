# Supabase Worker Runtime Transactional RPC 3 Validation Report

Validation target: static migration packet, docs, prompts, diagnostics, and package script only.

## Required Commands

- `git diff --check`
- `npm ci --no-audit --no-fund --progress=false`
- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent supabase-worker-runtime:transactional-rpc-3:diagnostics`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`

## Required Safety Scans

- changed-file scan for Supabase URL/key values, service-role-like values, JWT-like values, Postgres connection strings, bearer tokens, and `.env` additions.
- changed-file scan for SQL execution, migration deployment, Supabase mutation, Secret Manager payload access, worker execution, job claim/lease execution, route/tool/provider/model execution, private artifact/GCS access, signed URL/public artifact creation, dependency mutation, beta/production unlock, raw prompt execution, and final render/export claims.
- staged scan for the same safety classes.
- changed-file inventory must include exactly one migration under `supabase/migrations/`: `supabase/migrations/202606180001_worker_runtime_transactional_rpc.sql`.

## Status To Record After Execution

If validation passes, record the command results in the PR body. If validation fails, keep the PR draft and record the exact blocker without running SQL or mutating Supabase.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
