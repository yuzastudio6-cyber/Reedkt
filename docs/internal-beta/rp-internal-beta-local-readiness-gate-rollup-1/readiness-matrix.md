# Readiness Matrix

| Gate | Current status | Source |
| --- | --- | --- |
| Internal beta end-to-end lane | `not_ready` | `REEDITPRO-INTERNAL-BETA-READINESS-1` |
| Supabase target owner decision | `completed_source_derived_staging_supabase_target_owner_decision_for_guarded_validation_planning` | `RP-INTERNAL-BETA-SUPABASE-TARGET-OWNER-DECISION-1` |
| Approved credential context | `blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias` | `RP-INTERNAL-BETA-SUPABASE-TARGET-CREDENTIAL-CONTEXT-PREFLIGHT-1` |
| Confirmed Supabase RLS/storage validation | `blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias` | `RP-INTERNAL-BETA-SUPABASE-TARGET-CONFIRMED-RUNNER-CREDENTIAL-CONTEXT-HARDENING-1` |
| Worker runtime RPC staging SQL | `blocked_pending_confirmed_supabase_target_rls_storage_validation` | `SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED` |
| Service-role runtime | `disabled_pending_runtime_gate` | `RP-BACKEND-02-INTERNAL-BETA-SERVICE-ROLE-RUNTIME-SCAFFOLD` |
| Credit ledger runtime | `disabled_pending_credit_ledger_runtime_gate` | `RP-CREDITS-01-INTERNAL-BETA-CREDIT-LEDGER-RUNTIME-SCAFFOLD` |
| Job queue runtime | `disabled_pending_job_queue_runtime_gate` | `RP-JOBS-01-INTERNAL-BETA-JOB-QUEUE-RUNTIME-SCAFFOLD` |
| Private artifact manifest runtime | `disabled_pending_private_artifact_manifest_runtime_gate` | `RP-ARTIFACTS-01-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-SCAFFOLD` |
| Remotion private preview/export runtime | `disabled_pending_remotion_render_worker_runtime_gate` | `RP-RENDER-01-INTERNAL-BETA-REMOTION-RENDER-WORKER-SCAFFOLD` |
| QA cleanup observability local runtime | `completed_local_qa_cleanup_observability_runtime_no_remote_execution` | `RP-INTERNAL-BETA-QA-CLEANUP-OBSERVABILITY-LOCAL-RUNTIME-1` |
| Provider adapter runtime | `disabled_pending_provider_runtime_gate` | `RP-PROVIDER-01-INTERNAL-BETA-DISABLED-PROVIDER-ADAPTER-SCAFFOLD` |
| Negative runtime gate regression | `planned_after_runtime_enablement` | `RP-INTERNAL-BETA-E2E-NEGATIVE-GATE-TESTS-1` |

## Component Counts

- Service-role runtime disabled operations: `8`
- Credit ledger runtime disabled operations: `6`
- Job queue runtime disabled operations: `8`
- Private artifact manifest disabled operations: `8`
- Remotion render worker disabled operations: `8`
- Provider adapter disabled operations: `8`
- Total disabled operations: `46`

## Outcome

Internal beta can keep moving through safe gates, but it cannot be declared ready until the current credential context blocker is resolved and the runtime gates above pass in sequence.
