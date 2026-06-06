# Supabase FK Index Priority Matrix

Priority matrix status: `fk_index_priority_matrix_created`.
FK index migration plan status: `fk_index_migration_plan_created`.
Supabase update required: docs/status only.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.
Duplicate review required: all candidates.

## Matrix

| Priority | FK finding | Domain | Expected read pressure | Expected write pressure | Draft index shape | Duplicate review | Write risk | Production blocker | Handoff |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| High | `api_idempotency_keys.user_id` | idempotency/runtime replay | High | Medium | `idx_api_idempotency_keys_user_id` | Required | Medium | Needs query evidence and duplicate review | `SUPABASE_RLS_STORAGE_DATABASE` |
| High | `approved_plan_snapshots.approved_by_user_id` | approved snapshot audit | Medium | Low | `idx_approved_plan_snapshots_approved_by_user_id` | Required | Low | Needs staging advisor recheck | `SUPABASE_RLS_STORAGE_DATABASE` |
| High | `approved_plan_snapshots.credit_approval_id` | approval and credit join | High | Low | `idx_approved_plan_snapshots_credit_approval_id` | Required | Low | Needs credit gate evidence | `CREDITS_BILLING_APPROVAL` |
| High | `chat_actions.workspace_id` | workspace-scoped chat actions | High | Medium | `idx_chat_actions_workspace_id` | Required | Medium | Needs workspace query evidence | `FRONTEND_PRODUCT_UX` |
| High | `chat_attachments.workspace_id` | workspace-scoped attachments | High | Medium | `idx_chat_attachments_workspace_id` | Required | Medium | Needs media privacy review | `SUPABASE_RLS_STORAGE_DATABASE` |
| High | `credit_approvals.chat_action_id` | credit/action traceability | Medium | Low | `idx_credit_approvals_chat_action_id` | Required | Low | Needs credit/audit review | `CREDITS_BILLING_APPROVAL` |
| High | `credit_approvals.chat_message_id` | credit/message traceability | Medium | Low | `idx_credit_approvals_chat_message_id` | Required | Low | Needs credit/audit review | `CREDITS_BILLING_APPROVAL` |
| High | `credit_estimates.chat_message_id` | estimate/message traceability | High | Medium | `idx_credit_estimates_chat_message_id` | Required | Medium | Needs estimate query evidence | `CREDITS_BILLING_APPROVAL` |
| High | `credit_reservations.chat_session_id` | reservation/session lookup | High | Medium | `idx_credit_reservations_chat_session_id` | Required | Medium | Needs reservation flow evidence | `CREDITS_BILLING_APPROVAL` |
| Medium | `chat_actions.executed_by` | chat action actor lookup | Medium | Medium | `idx_chat_actions_executed_by` | Required | Medium | Needs actor audit query evidence | `FRONTEND_PRODUCT_UX` |
| Medium | `chat_attachments.media_asset_id` | attachment/media join | Medium | Medium | `idx_chat_attachments_media_asset_id` | Required | Medium | Needs media join evidence | `SUPABASE_RLS_STORAGE_DATABASE` |
| Medium | `chat_messages.actor_user_id` | chat actor lookup | Medium | High | `idx_chat_messages_actor_user_id` | Required | High | Needs write-volume review | `FRONTEND_PRODUCT_UX` |
| Medium | `credit_ledger_entries.related_chat_action_id` | ledger/action traceability | Medium | High | `idx_credit_ledger_entries_related_chat_action_id` | Required | High | Needs ledger write review | `CREDITS_BILLING_APPROVAL` |
| Medium | `edit_plans.created_by_user_id` | edit plan author lookup | Medium | Medium | `idx_edit_plans_created_by_user_id` | Required | Medium | Needs planning query evidence | `SUPABASE_RLS_STORAGE_DATABASE` |
| Defer | `ambient_sound_plans.audio_environment_analysis_id` | audio planning join | Medium | Medium | `idx_ambient_sound_plans_audio_environment_analysis_id` | Required | Medium | Deferred until SoundSync evidence and ownership are accepted | `SOUND_MUSIC_AUDIO` |

## Priority Rules

- High means the candidate appears on a core approval, chat, idempotency, or credit path and should be reviewed before staging performance validation.
- Medium means the candidate likely improves joins but needs more query-pattern evidence before active migration design.
- Defer means the candidate is valid advisor evidence, but ownership and usage evidence are incomplete.

No candidate is applied by Prompt 26H.

