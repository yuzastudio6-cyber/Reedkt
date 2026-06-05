# Supabase Advisor Hardening Priority Matrix

This matrix prioritizes Prompt 26A advisor findings for future remediation design. Prompt 26B records priorities only; no SQL, migration, policy, function, grant, or index change is applied.

| Priority | Advisor category | Objects | Risk | Future prompt | Prompt 26B action |
| --- | --- | --- | --- | --- | --- |
| P0 | RLS enabled/no policies | `activation_artifacts`, `activation_qa_gates`, `activation_runs`, `feature_gates`, `readiness_snapshots`, `tool_capabilities` | Possible data exposure or unpredictable fail-closed behavior on runtime/readiness/tool tables. | Prompt 26D classification, then Prompt 26E draft migration plan. | Plan only. |
| P0 | SECURITY DEFINER exposure | `has_workspace_role`, `is_workspace_owner_or_admin`, `is_workspace_owner_record`, `set_updated_at`, `can_export_render`, `is_project_editor`, `is_project_member` | Broad execute grants may expose helper behavior or create an RLS bypass if bodies are too permissive. | Prompt 26F. | Plan only. |
| P1 | Mutable function `search_path` | Worker, generation, approved snapshot, job, and E2E helper functions. | Functions may resolve unexpected objects unless schema references and search path are fixed. | Prompt 26F. | Plan only. |
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
