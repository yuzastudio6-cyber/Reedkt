# Supabase Advisor Draft Remediation Packet

Prompt 26C turns the Prompt 26B advisor hardening plan into draft remediation packets. It does not apply advisor remediation, create active SQL migrations, execute SQL, mutate Supabase, call Google Cloud, fetch Secret Manager data, or approve staging execution.

## Status

- Packet status: `advisor_draft_remediation_packet_created`.
- Connected audit status: `partially_reviewed_connected_metadata`.
- Advisor hardening status: `draft_remediation_planned`.
- Supabase update required: docs/status only.
- Supabase update status: docs_only.
- Supabase environment touched: none.
- SQL executed: none.
- Migration deployed: no.
- Production capability enabled: none; Supabase advisor draft remediation packet only.

## Scope

Prompt 26C covers four future remediation workstreams:

| Workstream | Draft packet | Draft sketch |
| --- | --- | --- |
| RLS no-policy tables | `docs/supabase-rls-no-policy-draft-remediation-packet.md` | `docs/draft-sql/supabase-advisor-remediation/rls-no-policy-draft.sql.md` |
| SECURITY DEFINER grants/function exposure | `docs/supabase-security-definer-draft-remediation-packet.md` | `docs/draft-sql/supabase-advisor-remediation/security-definer-grants-draft.sql.md` |
| Mutable function search path | `docs/supabase-function-search-path-draft-remediation-packet.md` | `docs/draft-sql/supabase-advisor-remediation/function-search-path-draft.sql.md` |
| Unindexed foreign keys | `docs/supabase-fk-index-draft-remediation-packet.md` | `docs/draft-sql/supabase-advisor-remediation/fk-indexes-draft.sql.md` |

The sketch files are Markdown review artifacts only. They are not active migration files and must not be executed.

## Advisor Inputs

The packet uses only Prompt 26A supplied connected read-only findings and Prompt 26B prioritization:

- RLS enabled/no-policy tables: `activation_artifacts`, `activation_qa_gates`, `activation_runs`, `feature_gates`, `readiness_snapshots`, and `tool_capabilities`.
- SECURITY DEFINER examples: `has_workspace_role`, `is_workspace_owner_or_admin`, `is_workspace_owner_record`, `set_updated_at`, `can_export_render`, `is_project_editor`, and `is_project_member`.
- Mutable function `search_path` examples: `can_claim_worker_job`, `can_start_generation`, `prevent_approved_plan_snapshot_immutable_update`, `can_run_job`, `can_create_approved_plan_snapshot`, `active_worker_claim_exists`, `e2e_jsonb_has_secret_like_content`, `e2e_assert_safe_json`, and `e2e_json_contains_secret_marker`.
- Unindexed FK examples: `api_idempotency_keys.user_id`, `approved_plan_snapshots.approved_by_user_id`, `approved_plan_snapshots.credit_approval_id`, `chat_actions.executed_by`, `chat_actions.workspace_id`, `chat_attachments.media_asset_id`, `chat_attachments.workspace_id`, `chat_messages.actor_user_id`, `credit_approvals.chat_action_id`, `credit_approvals.chat_message_id`, `credit_estimates.chat_message_id`, `credit_ledger_entries.related_chat_action_id`, `credit_reservations.chat_session_id`, and `edit_plans.created_by_user_id`.

## Draft Principles

- Start with least-privilege access models, not broad allow policies.
- Preserve existing helper signatures until a function/grant review proves a change is safe.
- Prefer additive indexes and compatibility-aware function hardening.
- Keep every proposed statement behind future local validation, human approval, accepted redacted evidence, and staging gates.
- Treat local evidence, connected advisor metadata, redacted evidence, and human approval as separate prerequisites.

## Execution Readiness

Execution readiness is defined in `docs/supabase-advisor-draft-remediation-execution-readiness.md`. Current state:

- Local execution readiness: not ready.
- Staging execution readiness: blocked by `pending_human_approval`, missing accepted redacted evidence, and draft-only remediation.
- Production execution readiness: blocked.
- Advisor remediation applied: no.

## Next Prompt

Prompt 26D - RLS No-Policy Table Classification and Policy Contract creates the RLS table classification, access model, policy intent, test contract, handoff notes, and migration-readiness checklist for the six no-policy tables. It still does not apply remediation.

Recommended next prompt after Prompt 26D: Prompt 26E - RLS No-Policy Draft Migration Plan.

Prompt 23A - Human Approval Decision Completion and Prompt 24D - Supabase Evidence Review With Supplied Files remain required before staging execution.
