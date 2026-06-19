# Supabase Worker Runtime Transactional RPC 2 RLS Security Plan

RLS/security status: `planned_only_static_migration_ready`

## Required Security Rules

- No frontend claim path.
- No anonymous or authenticated direct worker mutation.
- No service-role key in frontend, docs, logs, PR body, env files, artifacts, GCS, or issue comments.
- Privileged functions must not be placed in an exposed/publicly callable schema.
- Future functions must set a reviewed search path and be limited to the Track A private E2E operation family.
- RLS must be enabled on any exposed table, with user reads scoped only where allowed and worker writes denied to normal users.
- Service-role mutation must be backend-only, operation-specific, auditable, and unable to mutate arbitrary tables.
- Event payloads must be sanitized.
- Artifact refs must remain private metadata.
- Signed URL source-of-truth, public artifacts, final delivery/export, and beta/production unlocks are disallowed.

## Future Review Requirements

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-3 must produce a static migration candidate that can be reviewed for grants, policy shape, function schema placement, search path, indexes, constraints, rollback, and tests before any SQL execution packet is considered.

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4 must remain blocked until static migration review is complete and a confirmed staging target exists.

## Decision Values

Supabase update status: safety_packet_complete_sql_not_executed

SQL executed: none

Migration deployed: no

Internal beta unlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
