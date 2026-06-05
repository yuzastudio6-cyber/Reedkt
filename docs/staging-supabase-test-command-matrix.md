# Staging Supabase Test Command Matrix

Prompt 25 maps the existing local-passed and draft SQL files to future staging command templates. It does not run SQL and does not approve staging execution.

Current packet state: `blocked_missing_evidence` and `conditional_approval_recorded`.

## Matrix Rules

- Only `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` may be marked `local-passed`.
- Draft files remain `draft-only`, `requires fixture design`, `requires schema review`, or `blocked`.
- Future command templates are placeholders only.
- Every future staging command remains blocked until conditional approval gates and accepted redacted evidence are complete.

## Test Matrix

| Source SQL file | Current status | Future staging eligibility | Fixture requirement | Command template | Expected result | Cleanup requirement | Risk | Approval requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` | `local-passed` | `staging-candidate` | Synthetic auth/profile/workspace/project fixtures only | `future-approved-rls-run <APPROVED_SQL_FILE>` | Owner/member/non-member access assertions pass with rollback | Transaction rollback plus fixture cleanup evidence | Medium; first staging RLS proof path | Human approval record and redacted evidence required |
| `database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql` | `draft-only` | `staging-candidate` after conversion | Auth/profile/workspace/project fixtures | `future-approved-rls-run <APPROVED_SQL_FILE>` | Project-scoped access policies pass | Cleanup packet required | Medium; closest to local-passed case | Human approval record and redacted evidence required |
| `database/test-sql/007_storage_upload_rls_smoke_tests.draft.sql` | `draft-only` | `requires fixture design` | Storage record fixtures without real media or signed URLs | `future-approved-rls-run <APPROVED_SQL_FILE>` | Private bucket and object-record access boundaries pass | Cleanup storage records only; no object transfer | High; storage exposure risk | Human approval record, redacted evidence, and storage fixture approval required |
| `database/test-sql/008_approved_snapshot_rls_smoke_tests.draft.sql` | `draft-only` | `requires schema review` | Approved snapshot fixtures linked to project/workspace | `future-approved-rls-run <APPROVED_SQL_FILE>` | Snapshot read/write boundaries pass | Rollback or explicit cleanup | High; approved snapshot immutability risk | Human approval record and redacted evidence required |
| `database/test-sql/009_credit_ledger_approval_gate_rls_smoke_tests.draft.sql` | `draft-only` | `blocked` | Synthetic credit estimates/reservations only | `future-approved-rls-run <APPROVED_SQL_FILE>` | Readiness boundaries pass without real credit mutation | Rollback only | High; cost/billing boundary | Human approval, credit fixture review, and no real money required |
| `database/test-sql/010_job_worker_lease_idempotency_rls_smoke_tests.draft.sql` | `draft-only` | `blocked` | Job/worker fixtures without claims/execution | `future-approved-rls-run <APPROVED_SQL_FILE>` | Backend-only claim/lease writes remain blocked | Rollback only | High; execution boundary | Human approval and worker non-execution signoff required |
| `database/test-sql/011_media_readiness_rls_smoke_tests.draft.sql` | `draft-only` | `requires fixture design` | Media readiness records without processing media | `future-approved-rls-run <APPROVED_SQL_FILE>` | Readiness summaries respect project access | Rollback only | Medium; media privacy | Human approval and synthetic media-record fixture approval required |
| `database/test-sql/012_render_preview_export_rls_smoke_tests.draft.sql` | `draft-only` | `blocked` | Render/export readiness records without rendering | `future-approved-rls-run <APPROVED_SQL_FILE>` | Render/export execution records remain backend-only | Rollback only | High; export/delivery boundary | Human approval and no-render signoff required |
| `database/test-sql/013_qa_revision_fallback_rls_smoke_tests.draft.sql` | `draft-only` | `requires schema review` | QA/revision fixtures without fallback execution | `future-approved-rls-run <APPROVED_SQL_FILE>` | QA/revision visibility and mutation boundaries pass | Rollback only | Medium; revision integrity | Human approval and QA fixture review required |
| `database/test-sql/014_tool_call_foundation_rls_smoke_tests.draft.sql` | `draft-only` | `blocked` | Tool intent fixtures only; no tool execution | `future-approved-rls-run <APPROVED_SQL_FILE>` | Tool execution remains runtime-disabled | Rollback only | High; tool execution boundary | Human approval and tool runtime-disabled signoff required |
| `database/test-sql/015_tool_readiness_worker_runtime_rls_smoke_tests.draft.sql` | `draft-only` | `blocked` | Static tool readiness fixtures only | `future-approved-rls-run <APPROVED_SQL_FILE>` | Runtime-disabled tools cannot execute | Rollback only | High; runtime capability claim | Human approval and readiness policy review required |
| `database/test-sql/016_worker_claim_execution_contract_rls_smoke_tests.draft.sql` | `draft-only` | `blocked` | Worker claim/lease fixtures without claims | `future-approved-rls-run <APPROVED_SQL_FILE>` | Worker mutation paths remain backend-only | Rollback only | High; worker claim boundary | Human approval and no-worker-execution signoff required |
| `database/test-sql/017_provider_gateway_rls_smoke_tests.draft.sql` | `draft-only` | `blocked` | Provider gateway fixtures without secrets/calls | `future-approved-rls-run <APPROVED_SQL_FILE>` | Provider request/call paths remain blocked | Rollback only | High; provider and secret boundary | Human approval and no-provider-call signoff required |
| `database/test-sql/018_compliance_license_security_review_rls_smoke_tests.draft.sql` | `draft-only` | `requires schema review` | Compliance review fixtures only | `future-approved-rls-run <APPROVED_SQL_FILE>` | Review boundaries stay evidence-only | Rollback only | Medium; approval semantics | Human approval and no-legal-approval claim required |
| `database/test-sql/019_observability_audit_abuse_cost_rls_smoke_tests.draft.sql` | `draft-only` | `requires fixture design` | Audit/rate/cost fixtures without persistence enforcement | `future-approved-rls-run <APPROVED_SQL_FILE>` | Persistence/enforcement remains backend-required | Rollback only | High; audit/cost-control boundary | Human approval and no-production-enforcement signoff required |
| `database/test-sql/020_e2e_staging_smoke_readiness_rls_smoke_tests.draft.sql` | `draft-only` | `blocked` | Cross-domain synthetic fixture set | `future-approved-rls-run <APPROVED_SQL_FILE>` | E2E readiness gates remain blocked until staged | Cleanup and rollback packet required | High; broad integration scope | Human approval, evidence acceptance, and fixture owner signoff required |

## Current Matrix Result

- Staging candidates with local evidence: one.
- Draft-only files: fifteen.
- Staging SQL approved: no.
- Staging SQL executed: none.
- Migration deployed: no.
- Next action: Prompt 23A human approval completion and Prompt 24B redacted evidence review if evidence is supplied.
