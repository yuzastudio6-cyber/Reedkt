# Supabase Advisor Hardening Prompt Sequence

Prompt 26B is the advisor hardening planning step. Prompt 26C is the umbrella draft remediation packet. Both intentionally stop before remediation execution.

## Sequence

| Prompt | Purpose | Execution allowed? | Output |
| --- | --- | --- | --- |
| Prompt 26B | Advisor hardening plan. | No. | Priority matrix and workstream plans. |
| Prompt 26C | Supabase advisor umbrella draft remediation packet. | No. | Draft-only packets and Markdown SQL sketches for RLS, SECURITY DEFINER, search path, and FK index workstreams. |
| Prompt 26D | RLS no-policy table classification and policy contract. | No. | Table-by-table policy/no-access contract. |
| Prompt 26E | RLS no-policy draft migration plan. | No. | Draft migration plan, policy naming contract, dependency matrix, rollback model, and local/staging test design. |
| Prompt 26E-1 | RLS no-policy local draft migration implementation. | Local-only if explicitly approved and gated. | Candidate local migration SQL and local denial tests. |
| Prompt 26F | Function search_path hardening migration plan. | No. | Signature preservation, schema qualification, future tests, rollback/cleanup, staging evidence, and draft-only search-path sketch. |
| Prompt 26F-1 | Function search path local migration candidate. | Local-only if explicitly approved and gated. | Active local candidate migration and behavior tests for the nine mutable search-path functions. |
| Prompt 26G | SECURITY DEFINER exposure migration plan. | No. | SECURITY DEFINER exposure contract, classification, grant/body review plan, invoker decision contract, future tests, rollback/cleanup, and staging evidence requirements. |
| Prompt 26H | FK index hardening migration plan. | No. | FK priority matrix, duplicate review contract, naming contract, write-amplification risk matrix, future tests, rollback/cleanup, staging evidence, and draft-only FK index sketch. |
| Prompt 26H-1 | FK index local migration candidate. | Local-only if explicitly approved and gated. | Future active local additive index candidate and local catalog/performance checks. |
| Prompt 23A | Human approval completion. | Approval record only. | Required before staging execution. |
| Prompt 24D | Evidence review with supplied files. | Review only. | Accepted/rejected redacted evidence. |

## Gate Rules

- Prompt 26B and Prompt 26C do not unblock staging.
- Prompt 26C does not mark advisor findings remediated.
- Prompt 26C draft SQL sketches are Markdown review artifacts only.
- Prompt 26C does not approve SQL, migrations, or production readiness.
- Staging execution requires human approval completion, accepted evidence, confirmed target, rollback plan, and reviewed command packet.

## Current Recommendation

Prompt 26E - RLS No-Policy Draft Migration Plan records `rls_no_policy_draft_migration_plan_created` for the six RLS no-policy tables and still does not apply remediation. Proceed to Prompt 26E-1 - RLS No-Policy Local Draft Migration Implementation only if local implementation is approved and gated, or Prompt 26F - Function Search Path Hardening Migration Plan if function hardening takes priority.
## Prompt 26E-1 status

Prompt 26E-1 creates the first local migration candidate for the RLS no-policy track and adds a catalog-only local test candidate. Status: `local_candidate_prepared`.

Recommended sequence after Prompt 26E-1:

- Prompt 26E-2 - RLS No-Policy Local Candidate Validation Fix, if local candidate validation fails or local table evidence is incomplete.
- Prompt 26F - Function Search Path Hardening Migration Plan, if RLS candidate preparation succeeds and function hardening is the next priority.
- Prompt 26 - Approved Staging Supabase/RLS Validation Execution only after all approval, evidence, Secret Manager reference, PR/commit/test-set, rollback/cleanup, and final gate requirements pass.

## Prompt 26F function search_path hardening migration plan status

Prompt 26F records `function_search_path_migration_plan_created` for nine mutable function `search_path` advisor findings. It does not create an active migration, execute SQL, alter functions, apply advisor remediation, grant approval, or touch any Supabase environment.

Recommended sequence after Prompt 26F:

- Prompt 26F-1 - Function Search Path Local Migration Candidate, if function hardening proceeds.
- Prompt 26G - SECURITY DEFINER Exposure Migration Plan, if SECURITY DEFINER exposure review takes priority.
- Prompt 23A and Prompt 24D remain required before any staging execution path.

## Prompt 26G SECURITY DEFINER exposure migration plan status

Prompt 26G records `security_definer_exposure_migration_plan_created` for seven SECURITY DEFINER exposure advisor findings: `has_workspace_role`, `is_workspace_owner_or_admin`, `is_workspace_owner_record`, `set_updated_at`, `can_export_render`, `is_project_editor`, and `is_project_member`. It does not create an active migration, execute SQL, alter functions, change grants, apply advisor remediation, grant approval, or touch any Supabase environment.

Recommended sequence after Prompt 26G:

- Prompt 26G-1 - SECURITY DEFINER Local Migration Candidate, if grant/function hardening proceeds.
- Prompt 26H - FK Index Hardening Migration Plan, if FK advisor planning is prioritized.
- Prompt 23A and Prompt 24D remain required before any staging execution path.

## Prompt 26H FK index hardening migration plan status

Prompt 26H records `fk_index_migration_plan_created` for fifteen unindexed FK advisor findings. It does not create an active migration, execute SQL, create indexes, apply advisor remediation, grant approval, or touch any Supabase environment.

Recommended sequence after Prompt 26H:

- Prompt 26H-1 - FK Index Local Migration Candidate, if FK index hardening proceeds.
- Prompt GD-0 - AI Tools / Graphic Design Stack Repo Audit, if the user pivots to graphic-design stack audit.
- Prompt 23A and Prompt 24D remain required before any staging execution path.
