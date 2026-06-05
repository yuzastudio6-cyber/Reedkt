# Supabase Advisor Hardening Plan

Prompt 26B converts the Prompt 26A connected read-only advisor triage into a future hardening plan. It does not remediate advisor findings, create SQL, apply migrations, alter policies, alter functions, create indexes, connect to Supabase, call Google Cloud, fetch Secret Manager data, or approve staging execution.

## Status

- Plan status: `advisor_hardening_planned`.
- Connected audit status: `partially_reviewed_connected_metadata`.
- Supabase update required: docs/status only.
- Supabase update status: docs_only.
- Supabase environment touched: none in Prompt 26B.
- SQL executed: none.
- Migration deployed: no.
- Production capability enabled: none; Supabase advisor hardening plan only.

## Advisor Inputs

Prompt 26B uses only the supplied Prompt 26A connected read-only findings:

- RLS enabled/no-policy tables: `activation_artifacts`, `activation_qa_gates`, `activation_runs`, `feature_gates`, `readiness_snapshots`, and `tool_capabilities`.
- SECURITY DEFINER exposure examples: `has_workspace_role`, `is_workspace_owner_or_admin`, `is_workspace_owner_record`, `set_updated_at`, `can_export_render`, `is_project_editor`, and `is_project_member`.
- Mutable function `search_path` examples: `can_claim_worker_job`, `can_start_generation`, `prevent_approved_plan_snapshot_immutable_update`, `can_run_job`, `can_create_approved_plan_snapshot`, `active_worker_claim_exists`, `e2e_jsonb_has_secret_like_content`, `e2e_assert_safe_json`, and `e2e_json_contains_secret_marker`.
- Unindexed foreign-key examples across `ambient_sound_plans`, `api_idempotency_keys`, `approved_plan_snapshots`, `chat_actions`, `chat_attachments`, `chat_messages`, `credit_approvals`, `credit_estimates`, `credit_ledger_entries`, `credit_reservations`, and `edit_plans`.

## Hardening Principles

- Treat every item as a future remediation candidate until a reviewed migration prompt designs and validates exact SQL.
- Prefer additive, reversible, schema-era-aware changes.
- Do not broaden privileges while attempting to close a warning.
- Preserve existing function signatures unless a compatibility plan exists.
- Validate locally first, then only in staging after Prompt 23A human approval completion and accepted Prompt 24D evidence.
- Do not claim production readiness from advisor planning.

## Planned Workstreams

| Workstream | Current finding | Future design output | Execution status |
| --- | --- | --- | --- |
| RLS no-policy hardening | Six RLS-enabled tables without policies. | Table-by-table policy/no-access/service-boundary design. | Not applied. |
| SECURITY DEFINER hardening | Broad callable helper functions. | Function body/grant/security-mode review and migration candidate. | Not applied. |
| Function search path hardening | Mutable `search_path` warnings. | Fixed-search-path and schema qualification plan. | Not applied. |
| FK index hardening | Unindexed foreign-key findings. | Additive index migration candidate grouped by domain/risk. | Not applied. |

## Remaining Blockers

- Advisor findings are unresolved.
- Redacted Supabase evidence files remain incomplete.
- Secret Manager reference metadata evidence remains incomplete.
- Prompt 23 remains `pending_human_approval`.
- Staging SQL is not approved.
- Production/beta remains blocked.

## Next Prompt

Recommended next prompt: Prompt 26C - Supabase Advisor Draft Remediation Packet.
