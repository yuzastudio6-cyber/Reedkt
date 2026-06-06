# Supabase Advisor Hardening Priority Matrix

This matrix prioritizes Prompt 26A advisor findings for future remediation design. Prompt 26B records priorities only; no SQL, migration, policy, function, grant, or index change is applied.

| Priority | Advisor category | Objects | Risk | Future prompt | Prompt 26B action |
| --- | --- | --- | --- | --- | --- |
| P0 | RLS enabled/no policies | `activation_artifacts`, `activation_qa_gates`, `activation_runs`, `feature_gates`, `readiness_snapshots`, `tool_capabilities` | Possible data exposure or unpredictable fail-closed behavior on runtime/readiness/tool tables. | Prompt 26D classification is complete; Prompt 26E draft migration plan, then Prompt 26E-1 local draft implementation if approved. | Plan only. |
| P0 | SECURITY DEFINER exposure | `has_workspace_role`, `is_workspace_owner_or_admin`, `is_workspace_owner_record`, `set_updated_at`, `can_export_render`, `is_project_editor`, `is_project_member` | Broad execute grants may expose helper behavior or create an RLS bypass if bodies are too permissive. | Prompt 26G. | Plan only. |
| P1 | Mutable function `search_path` | `can_claim_worker_job`, `can_start_generation`, `prevent_approved_plan_snapshot_immutable_update`, `can_run_job`, `can_create_approved_plan_snapshot`, `active_worker_claim_exists`, `e2e_jsonb_has_secret_like_content`, `e2e_assert_safe_json`, `e2e_json_contains_secret_marker` | Functions may resolve unexpected objects unless schema references and search path are fixed. | Prompt 26F creates the migration plan; Prompt 26F-1 is the future local candidate. | Plan only. |
| P2 | Unindexed foreign keys | Runtime/foundation FK examples across idempotency, approved snapshots, chat, credits, and edit plans. | Slow validation, lock contention, and poor production performance signal. | Future FK index migration design prompt. | Plan only. |

## Go/No-Go Rules

- Go for planning: static docs and diagnostics can proceed.
- No-go for staging: human approval and accepted evidence remain missing.
- No-go for SQL: exact migrations are not designed or approved in Prompt 26B.
- No-go for production: no connected advisor remediation has been validated.

## Required Evidence Before Execution

- Complete advisor export or equivalent accepted redacted evidence.
- Function body/grant review for each function candidate.
- Table/column existence check across schema-era migrations.
- Local validation plan for every future migration.
- Human approval record before staging execution.
## Prompt 26E-1 update

Prompt 26E-1 advances the RLS no-policy row from draft planning to `local_candidate_prepared` only. It does not resolve advisor findings until the candidate is validated locally and later approved for staging.

## Prompt 26F update

Prompt 26F advances the mutable function `search_path` row to `function_search_path_migration_plan_created` only. It does not resolve advisor findings, alter functions, create active migrations, run SQL, or touch Supabase. Prompt 26F-1 is required for a future local migration candidate, while Prompt 26G remains the planned SECURITY DEFINER exposure migration-plan prompt.
