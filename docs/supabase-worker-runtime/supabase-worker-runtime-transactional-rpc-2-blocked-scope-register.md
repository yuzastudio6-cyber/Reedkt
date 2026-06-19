# Supabase Worker Runtime Transactional RPC 2 Blocked Scope Register

Blocked scope status: `all_runtime_and_unlock_scope_blocked`

## Blocked In This Phase

- SQL execution
- migration deployment
- Supabase mutation
- Secret Manager payload access
- Supabase URL, service-role key, anon key, JWT, database URL, bearer token, or secret payload printing
- worker execution
- job claim or lease execution
- route, tool, provider, or model execution
- Track A runtime/media processing
- private artifact or GCS access
- signed URL creation
- public artifact creation
- dependency or package-lock mutation
- raw prompt execution
- final render/export
- internal beta unlock
- external beta unlock
- paid production unlock
- production unlock
- broad media scope
- broad service-role handler

## Blocked Readiness

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4 readiness: blocked_pending_static_migration_packet

WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-2 readiness: blocked_pending_supabase_rpc_schema_static_migration

WORKER-RUNTIME-TRACKA-PRIVATE-E2E-EXECUTION-GATE-2R readiness: blocked_pending_supabase_rpc_schema_implementation

TRACKA-PRIVATE-E2E-REVALIDATION-2 readiness: blocked_pending_worker_transactional_contract

INTERNAL-BETA-READINESS-ROLLUP readiness: blocked_pending_worker_transactional_contract

Internal beta unlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
