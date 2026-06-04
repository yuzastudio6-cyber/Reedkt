# Staging RLS Test Selection Matrix

Prompt 21 classifies test files for future staging approval. It does not run staging SQL. Only `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` may be marked local-passed because Prompt 20B-Retry is the only local SQL run with passing evidence.

| Test file | Prompt 21 classification | Staging eligibility | Notes |
| --- | --- | --- | --- |
| `database/test-sql/001_rls_smoke_tests.sql` | requires schema review | blocked | Legacy/manual checklist shape; not selected for staging until reconciled with the canonical schema. |
| `database/test-sql/002_approved_snapshot_immutability_tests.sql` | requires schema review | blocked | Manual approved snapshot assertions need fixture and table-era review. |
| `database/test-sql/003_storage_policy_smoke_tests.sql` | requires fixture design | staging-candidate after review | Storage policy cases need synthetic bucket/object fixtures without real media. |
| `database/test-sql/004_credit_audit_append_only_tests.sql` | requires schema review | blocked | Credit/audit tests need transactional ledger review before staging use. |
| `database/test-sql/005_e2e_runtime_readiness_smoke_tests.sql` | requires fixture design | blocked | Too broad for first staging RLS run; use only after domain fixtures are approved. |
| `database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql` | draft-only | staging-candidate after conversion | Auth/workspace/project draft should inform a future staging version, but local passed evidence comes only from the local file. |
| `database/test-sql/007_storage_upload_rls_smoke_tests.draft.sql` | draft-only | requires fixture design | Needs storage records without real media and no signed URLs as source of truth. |
| `database/test-sql/008_approved_snapshot_rls_smoke_tests.draft.sql` | draft-only | requires fixture design | Needs immutable snapshot and project membership fixtures. |
| `database/test-sql/009_credit_ledger_approval_gate_rls_smoke_tests.draft.sql` | draft-only | requires schema review | Must not mutate real credits; staging version needs synthetic credit fixtures only. |
| `database/test-sql/010_job_worker_lease_idempotency_rls_smoke_tests.draft.sql` | draft-only | requires schema review | Worker/job writes remain backend-only; staging tests must not claim jobs. |
| `database/test-sql/011_media_readiness_probe_timing_rls_smoke_tests.draft.sql` | draft-only | requires fixture design | No media processing or transcript analysis; metadata fixtures only. |
| `database/test-sql/012_render_preview_export_rls_smoke_tests.draft.sql` | draft-only | requires fixture design | Render/export execution must remain blocked; readiness records only. |
| `database/test-sql/013_qa_revision_fallback_rls_smoke_tests.draft.sql` | draft-only | requires fixture design | QA/revision/fallback execution remains blocked. |
| `database/test-sql/014_tool_call_foundation_rls_smoke_tests.draft.sql` | draft-only | requires schema review | Tool calls remain runtime-disabled. |
| `database/test-sql/015_tool_readiness_worker_runtime_rls_smoke_tests.draft.sql` | draft-only | requires schema review | Tool runtime remains disabled. |
| `database/test-sql/016_worker_claim_execution_contract_rls_smoke_tests.draft.sql` | draft-only | requires schema review | Worker execution and production claims remain blocked. |
| `database/test-sql/017_provider_gateway_rls_smoke_tests.draft.sql` | draft-only | requires schema review | Provider calls and webhooks remain blocked. |
| `database/test-sql/018_compliance_license_security_review_rls_smoke_tests.draft.sql` | draft-only | requires schema review | Compliance output is not legal approval. |
| `database/test-sql/019_observability_audit_abuse_cost_rls_smoke_tests.draft.sql` | draft-only | requires fixture design | No production audit persistence, telemetry, billing, or enforcement. |
| `database/test-sql/020_e2e_staging_smoke_readiness_rls_smoke_tests.draft.sql` | draft-only | blocked | E2E staging smoke remains plan-only until a separate approval milestone. |
| `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` | local-passed | staging-candidate after human approval | Prompt 20B-Retry passed this local-only smoke with rollback; staging adaptation still requires fixture and environment approval. |

## Selection Decision

Initial staging candidate after human approval:

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` adapted only if a staging-safe wrapper and fixture plan are approved.

Blocked from first staging run:

- every draft-only domain test until converted through a dedicated staging fixture design step;
- every legacy/manual SQL file until schema review confirms it targets the canonical migration chain.

