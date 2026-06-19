# Supabase Worker Runtime Transactional RPC 2 Source Audit

Audit status: `completed_source_audit_for_migration_safety_packet`

## Confirmed Source Chain

- #520 merged Worker Runtime transactional contract planning and recorded the blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.
- #525 merged SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 at `10c6fee6fe52cbf4379369c55b52140cdd7f36b5` and recorded `SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 readiness: ready_for_migration_safety_packet`.
- Current integration source includes generic worker claim and readiness evidence, but not the Track A-specific transactional RPC/schema implementation.

## Present Source Evidence

| Evidence | Classification | Notes |
| --- | --- | --- |
| `server/services/worker-claim-service.ts` | present_in_source | Generic claim, heartbeat, release helper exists. Source still includes the note to replace with transaction/RPC to avoid claim race windows. |
| `worker_leases` | present_in_source | Review-only lease/runtime transport migration evidence exists. |
| `backend_runtime_messages` | present_in_source | Review-only runtime transport table evidence exists. |
| `job_claim_attempts` | present_in_source | Review-only claim-attempt tracking evidence exists. |
| `worker_job_claims` | present_in_source | Generic readiness table evidence exists. |
| `api_idempotency_keys` | present_in_source | Generic idempotency table evidence exists. |
| `can_claim_worker_job` | present_in_source | Generic helper evidence exists. |
| `active_worker_claim_exists` | present_in_source | Generic helper evidence exists. |

## Missing Source Evidence

| Missing item | Required future status |
| --- | --- |
| Track A-specific operation family `tracka_private_e2e_revalidation` | blocked_pending_static_migration_packet |
| Atomic claim RPC/backend path | blocked_pending_static_migration_packet |
| Persistent Track A lease/event enforcement | blocked_pending_static_migration_packet |
| Narrow backend-only service-role runtime boundary | blocked_pending_static_migration_packet |
| Confirmed staging Supabase target | blocked_pending_confirmed_staging_target |
| Executable migration under `supabase/migrations/` | blocked_pending_static_migration_packet |

## Safety Finding

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 decision: completed_migration_safety_packet_ready_for_static_migration_implementation

Target safety status: blocked_pending_confirmed_staging_target

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
