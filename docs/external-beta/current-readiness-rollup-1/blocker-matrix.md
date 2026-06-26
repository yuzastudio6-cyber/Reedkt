# Blocker Matrix

Packet: `RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1`

| Area | Current status | Required next evidence |
| --- | --- | --- |
| Supabase target owner decision | `completed_source_derived_staging_supabase_target_owner_decision_for_guarded_validation_planning` | Carry forward only |
| Supabase read-only target validation | `completed_guarded_supabase_target_rls_storage_readonly_validation` | Carry forward only |
| Staging migration path | `clean_target_path_owner_approved_after_rollup` | guarded clean target execution and readback |
| Worker RPC 4R | `blocked_pending_clean_staging_target_migration_chain_and_rpc_readback` | guarded clean target migration path plus readback |
| Service-role route runtime | `blocked_pending_worker_transactional_contract` | post-RPC runtime validation |
| Approved snapshot persistence | `blocked_pending_service_role_runtime_validation` | guarded Supabase persistence evidence |
| Credit reservation ledger | `blocked_pending_service_role_runtime_validation` | guarded internal ledger mutation evidence |
| Job queue leases/events | `blocked_pending_service_role_runtime_validation` | guarded job record/lease/event validation |
| Private artifact storage/access | `blocked_pending_private_storage_runtime_validation` | private bucket/readback/access evidence |
| Remotion private preview/export | `blocked_pending_render_worker_runtime_validation` | private preview/export evidence, no public artifacts |
| Provider/model calls | `blocked_pending_provider_owner_runtime_approval` | backend-only disabled-by-default policy and explicit approval |
| External beta | `blocked` | internal beta evidence plus security/privacy/support/cost/deployment review |
| Paid production | `blocked` | separate billing/legal/support/rollback approval |
| Final delivery/export | `blocked` | separate production delivery gate |

Product-ready end-to-end local OSS tools: `0`

## Current Next Action

`SUPABASE-CLEAN-STAGING-BRANCH-EXECUTION-CURRENT-TARGET-REVALIDATION-1`
