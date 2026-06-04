# Staging Supabase Approved Test Selection

Prompt 23 approves one narrow future staging test selection. It does not run staging SQL.

## Approved Future Staging Selection

| Selection | Status | Notes |
| --- | --- | --- |
| Staging migration-chain validation | Approved as Prompt 24 prerequisite | Must target a confirmed disposable staging Supabase project only. |
| `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` staging adaptation | Approved for Prompt 24 | Must be adapted safely for staging fixtures and evidence redaction before execution. |
| Synthetic auth/profile/workspace/project fixtures | Approved for Prompt 24 | Owner/member/non-member isolation checks only. |
| Cleanup and rollback verification | Required | Must be completed or Prompt 24 stays blocked. |

## Explicitly Blocked From First Staging Run

- `database/test-sql/001_rls_smoke_tests.sql`
- `database/test-sql/002_approved_snapshot_immutability_tests.sql`
- `database/test-sql/003_storage_policy_smoke_tests.sql`
- `database/test-sql/004_credit_audit_append_only_tests.sql`
- `database/test-sql/005_e2e_runtime_readiness_smoke_tests.sql`
- all `database/test-sql/006` through `020` draft SQL files;
- storage upload/download or object transfer checks;
- approved snapshot, credit, job/worker, media readiness, render/export, QA/revision, tool, provider, compliance, observability, and E2E staging smoke domain suites.

## Selection Rationale

Prompt 20B-Retry passed exactly one local auth/profile/workspace/project RLS path. Prompt 21 marked that path as the only initial staging candidate after human approval. Prompt 22 confirmed the packet is ready for a decision. Prompt 23 therefore approves only this narrow path for Prompt 24.

## Required Execution Boundaries

- Use synthetic fixtures only.
- Use a redacted staging project reference.
- Do not widen the test set mid-run.
- Do not run draft-only tests without a separate conversion and review prompt.
- Do not infer production readiness from a pass.
- Stop and record blockers if migration validation, RLS validation, or cleanup fails.
