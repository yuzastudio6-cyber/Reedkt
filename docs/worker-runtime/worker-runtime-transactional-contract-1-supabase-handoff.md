# Worker Runtime Transactional Contract 1 Supabase Handoff

Handoff status: `ready_for_migration_readiness_planning`

This handoff prepares a future Supabase/RPC/schema readiness milestone. It does not run SQL, create migrations, mutate Supabase, read secrets, or deploy schema/RLS changes.

## Primary Next Supabase Prompt

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 readiness: ready_for_migration_readiness_planning

Prompt file: `docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-1-migration-readiness.md`

## Handoff Requirements

The future Supabase milestone must decide how to implement or stage:

- Track A-specific transactional operation family.
- Atomic claim RPC/backend path.
- Worker claim/lease tables or table extensions.
- Event log persistence.
- Idempotency key persistence.
- Retry/backoff/cancellation fields.
- Stale lease release path.
- Service-role-only writes.
- RLS policy review.
- Audit logging and redaction.
- No broad service-role handler.

## Credential Rule

Future Supabase access must use approved backend-only Google Secret Manager credential resolution. Do not add keys, URLs, JWTs, payload values, or service-role secrets to env files, docs, logs, artifacts, or PR bodies. Do not read or print Secret Manager payloads.

## Current Supabase Classification

Supabase update required: docs/status only

Supabase update status: docs_only

Supabase environment touched: none

SQL executed: none

Migration deployed: no

Next Supabase action: SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 migration readiness planning

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
