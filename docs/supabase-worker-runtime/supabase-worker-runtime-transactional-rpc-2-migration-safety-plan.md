# Supabase Worker Runtime Transactional RPC 2 Migration Safety Plan

Migration safety status: `safety_packet_complete_sql_not_executed`

## Future Migration Candidate

Proposed migration name: `202606180001_worker_runtime_transactional_rpc.sql`, or the next available timestamp if that name collides during the future static migration packet.

Executable migration created: false

Files under `supabase/migrations/` changed: false

SQL executed: none

Migration deployed: no

## Safety Sequence

1. SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-3 creates a static migration implementation packet and reviewable migration candidate without execution.
2. Security review confirms schema placement, grants, RLS, function search path, service-role-only access, and no broad service-role handler.
3. A confirmed staging target is recorded and `blocked_pending_confirmed_staging_target` is cleared by an approved later packet.
4. SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4 performs guarded staging SQL execution only after explicit confirmation gates are set.
5. Production remains blocked until staging validation, rollback evidence, and separate owner approval exist.

## Migration Safety Requirements

- Functions must not be placed in an exposed/publicly callable schema when using privileged behavior.
- RLS must be enabled on any exposed tables and policies must deny anon/auth worker mutation.
- Service-role access must be backend-only, operation-specific, and auditable.
- Event logs must be sanitized and append-only through approved functions.
- Artifact refs must be private metadata, with checksums and QA report refs.
- Signed URLs, public artifacts, final delivery/export, internal beta, external beta, paid production, production, and broad media remain blocked.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
