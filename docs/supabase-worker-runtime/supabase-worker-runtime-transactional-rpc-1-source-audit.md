# Supabase Worker Runtime Transactional RPC 1 Source Audit

Audit status: `completed_migration_readiness_planning_blocked_pending_migration_safety_packet`

## Source PR Lineage

Inspected lineage: #334, #340, #343, #347, #375, #380, #497, #502, #505, #510, #513, #516, and #520.

#516 merged Worker Runtime Track A Gate 2 as blocked pending transactional runtime contract completion. #520 merged WORKER-RUNTIME-TRANSACTIONAL-CONTRACT-1 with this blocker:

Explicit blocker: missing transactional backend/RPC claim path, service-role runtime boundary, and persistent event/lease enforcement.

## Files Inspected

- `server/services/worker-claim-service.ts`
- `supabase/migrations/202605200002_worker_leases_runtime_transport.sql`
- `supabase/migrations/202605210001_e2e_runtime_readiness_tables.sql`
- `docs/worker-runtime/worker-runtime-transactional-contract-1.md`
- `docs/worker-runtime/worker-runtime-transactional-contract-1-rpc-requirements.md`
- `docs/worker-runtime/worker-runtime-transactional-contract-1-schema-requirements.md`
- `docs/implementation-prompts/prompt-supabase-worker-runtime-transactional-rpc-1-migration-readiness.md`

## Classification Matrix

| Area | Classification | Evidence |
| --- | --- | --- |
| Existing worker tables found in migrations | present_in_source | `worker_leases`, `backend_runtime_messages`, `job_claim_attempts`, and `worker_job_claims` exist as generic readiness/runtime transport records. |
| Existing worker events/artifacts tables found in migrations | present_in_docs_only | Existing docs require event/artifact persistence, but no Track A-specific `worker_job_events` or `worker_job_artifacts` contract is implemented. |
| Existing RPC/functions found | present_in_source | `can_claim_worker_job`, `active_worker_claim_exists`, and `can_create_approved_plan_snapshot` exist. |
| Track A transactional RPC family | missing | `claim_tracka_private_e2e_job`, `heartbeat_tracka_private_e2e_job`, `complete_tracka_private_e2e_job`, `fail_tracka_private_e2e_job`, `cancel_tracka_private_e2e_job`, `release_expired_tracka_private_e2e_leases`, and `append_tracka_private_e2e_event` are not implemented. |
| Existing RLS/security policies found | present_in_source | Generic readiness tables enable RLS, revoke public/anon access, grant authenticated select paths, and grant service-role writes. |
| Track A RLS/security model | blocked_pending_migration | Future policy/RPC security model must be reviewed before implementation. |
| Existing service-role backend boundaries found | present_in_docs_only | Docs require backend-only service-role use, but no narrow Track A operation-specific runtime path is implemented. |
| Existing Secret Manager credential resolution paths found | present_in_docs_only | #520 documents backend-only Google Secret Manager credential resolution; this packet does not read or print payloads. |
| Worker claim transactionality | blocked_pending_migration | `server/services/worker-claim-service.ts` still has `replace with transaction/RPC to avoid claim race windows`. |
| #343 claim/lease status | blocked_pending_backend_runtime | #343 was simulated dry-run only; real claim/lease execution remains blocked. |

## Source Conclusion

Current source does not provide enough transactional claim/lease/backend RPC coverage to unblock Worker Gate 2R or Track A guarded execution packet planning.

## Decision Values

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-1 decision: completed_migration_readiness_planning_blocked_pending_migration_safety_packet

Worker runtime transactional contract readiness: blocked_pending_supabase_worker_rpc_migration_safety_packet

SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-2 readiness: ready_for_migration_safety_packet

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
