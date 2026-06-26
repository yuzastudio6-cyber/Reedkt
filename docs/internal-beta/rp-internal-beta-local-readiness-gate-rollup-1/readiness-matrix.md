# Readiness Matrix

| Gate | Current status | Source |
| --- | --- | --- |
| Internal beta end-to-end lane | `not_ready` | `REEDITPRO-INTERNAL-BETA-READINESS-1` |
| Supabase target owner decision | `completed_source_derived_staging_supabase_target_owner_decision_for_guarded_validation_planning` | `RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-DECISION-1` |
| Approved credential context | `completed_approved_supabase_credential_alias_presence_preflight_no_payload_access` | `RP-INTERNAL-BETA-SUPABASE-TARGET-CREDENTIAL-CONTEXT-PREFLIGHT-1` |
| Confirmed Supabase RLS/storage validation | `completed_guarded_supabase_target_rls_storage_readonly_validation` | `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED` |
| Current Supabase validation environment closure | `blocked_current_environment_missing_confirmed_supabase_validation_context` | `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CURRENT-ENVIRONMENT-CLOSURE-1` |
| Worker runtime RPC staging SQL | `blocked_pending_confirmed_supabase_target_rls_storage_validation` | `SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED` |
| Service-role runtime | `disabled_pending_runtime_gate` | `RP-BACKEND-02-INTERNAL-BETA-SERVICE-ROLE-RUNTIME-SCAFFOLD` |
| Credit ledger runtime | `disabled_pending_credit_ledger_runtime_gate` | `RP-CREDITS-01-INTERNAL-BETA-CREDIT-LEDGER-RUNTIME-SCAFFOLD` |
| Job queue runtime | `disabled_pending_job_queue_runtime_gate` | `RP-JOBS-01-INTERNAL-BETA-JOB-QUEUE-RUNTIME-SCAFFOLD` |
| Private artifact manifest runtime | `disabled_pending_private_artifact_manifest_runtime_gate` | `RP-ARTIFACTS-01-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-SCAFFOLD` |
| Remotion private preview/export runtime | `disabled_pending_remotion_render_worker_runtime_gate` | `RP-RENDER-01-INTERNAL-BETA-REMOTION-RENDER-WORKER-SCAFFOLD` |
| API route runtime facade | `blocked_pending_supabase_target_validation_and_runtime_enablement` | `RP-INTERNAL-BETA-API-ROUTE-RUNTIME-FACADE-1` |
| Runtime readiness orchestrator local E2E chain integration | `completed_internal_beta_runtime_readiness_orchestrator_local_e2e_chain_integration_fail_closed` | `RP-INTERNAL-BETA-RUNTIME-READINESS-ORCHESTRATOR-2-LOCAL-E2E-CHAIN-INTEGRATION` |
| Runtime readiness orchestrator API route facade integration | `completed_internal_beta_runtime_readiness_orchestrator_api_route_facade_integration_fail_closed` | `RP-INTERNAL-BETA-RUNTIME-READINESS-ORCHESTRATOR-3-API-ROUTE-FACADE-INTEGRATION` |
| Runtime readiness orchestrator service-role persistence guard integration | `completed_internal_beta_runtime_readiness_orchestrator_service_role_persistence_guard_integration_fail_closed` | `RP-INTERNAL-BETA-RUNTIME-READINESS-ORCHESTRATOR-4-SERVICE-ROLE-PERSISTENCE-GUARD-INTEGRATION` |
| Approved snapshot service-role persistence guard | `blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias` | `RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-GUARD-1` |
| QA cleanup observability local runtime | `completed_local_qa_cleanup_observability_runtime_no_remote_execution` | `RP-INTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-LOCAL-RUNTIME-1` |
| Provider adapter runtime | `disabled_pending_provider_runtime_gate` | `RP-PROVIDER-01-INTERNAL-BETA-DISABLED-PROVIDER-ADAPTER-SCAFFOLD` |
| Negative runtime gate regression | `planned_after_runtime_enablement` | `RP-INTERNAL-BETA-E2E-NEGATIVE-GATE-TESTS-1` |

## Component Counts

- Service-role runtime disabled operations: `8`
- Credit ledger runtime disabled operations: `6`
- Job queue runtime disabled operations: `8`
- Private artifact manifest disabled operations: `8`
- Remotion render worker disabled operations: `8`
- API route runtime facade disabled responses: `8`
- Provider adapter disabled operations: `8`
- Total disabled operations: `54`

## Local Evidence Counts

- Approved snapshot service-role persistence guard: `1`
- Local E2E chain smoke: `1`
- Total local evidence count: `2`

## Outcome

Internal beta can keep moving through safe gates, but it cannot be declared ready until the current credential context blocker is resolved and the runtime gates above pass in sequence.
