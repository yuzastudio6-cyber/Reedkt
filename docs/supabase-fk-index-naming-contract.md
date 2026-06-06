# Supabase FK Index Naming Contract

Naming contract status: `fk_index_naming_contract_created`.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.

## Naming Rule

Future FK index candidates should use deterministic names:

- Single-column shape: `idx_<table>_<column>`.
- Composite shape, if future evidence requires it: `idx_<table>_<column1>_<column2>`.
- Names must stay under PostgreSQL's identifier length limit.
- Names must be stable across local, staging, and production plans.
- Names must not include environment names, project refs, secrets, or owner names.

## Prompt 26H Draft Names

| FK finding | Future draft name |
| --- | --- |
| `api_idempotency_keys.user_id` | `idx_api_idempotency_keys_user_id` |
| `approved_plan_snapshots.approved_by_user_id` | `idx_approved_plan_snapshots_approved_by_user_id` |
| `approved_plan_snapshots.credit_approval_id` | `idx_approved_plan_snapshots_credit_approval_id` |
| `chat_actions.workspace_id` | `idx_chat_actions_workspace_id` |
| `chat_attachments.workspace_id` | `idx_chat_attachments_workspace_id` |
| `credit_approvals.chat_action_id` | `idx_credit_approvals_chat_action_id` |
| `credit_approvals.chat_message_id` | `idx_credit_approvals_chat_message_id` |
| `credit_estimates.chat_message_id` | `idx_credit_estimates_chat_message_id` |
| `credit_reservations.chat_session_id` | `idx_credit_reservations_chat_session_id` |
| `chat_actions.executed_by` | `idx_chat_actions_executed_by` |
| `chat_attachments.media_asset_id` | `idx_chat_attachments_media_asset_id` |
| `chat_messages.actor_user_id` | `idx_chat_messages_actor_user_id` |
| `credit_ledger_entries.related_chat_action_id` | `idx_credit_ledger_entries_related_chat_action_id` |
| `edit_plans.created_by_user_id` | `idx_edit_plans_created_by_user_id` |
| `ambient_sound_plans.audio_environment_analysis_id` | `idx_ambient_sound_plans_audio_environment_analysis_id` |

## Future Guardrails

Future active migration candidates must guard table and column existence when schema-era compatibility is uncertain. Prompt 26H does not create such a candidate.

