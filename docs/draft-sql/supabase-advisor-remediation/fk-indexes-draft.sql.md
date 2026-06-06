# FK Indexes Draft SQL Sketch

DRAFT ONLY — DO NOT EXECUTE.
NOT AN ACTIVE MIGRATION.
This sketch is not validated, not applied to Supabase, and requires future prompt.

## Intent

Sketch future additive index candidates for Prompt 26A unindexed foreign-key findings. Prompt 26H keeps this file as Markdown-only review material.

## Review-Only Sketch

```sql
-- DRAFT ONLY — DO NOT EXECUTE.
-- NOT AN ACTIVE MIGRATION.
-- not validated.
-- not applied to Supabase.
-- requires future prompt.
-- Future prompt must confirm table/column existence and existing index coverage.
-- Every candidate needs duplicate-index review before active migration design.

-- Candidate examples only. These are commented sketches, not executable instructions.
-- create index concurrently if not exists idx_api_idempotency_keys_user_id on public.api_idempotency_keys(user_id);
-- create index concurrently if not exists idx_approved_plan_snapshots_approved_by_user_id on public.approved_plan_snapshots(approved_by_user_id);
-- create index concurrently if not exists idx_approved_plan_snapshots_credit_approval_id on public.approved_plan_snapshots(credit_approval_id);
-- create index concurrently if not exists idx_chat_actions_workspace_id on public.chat_actions(workspace_id);
-- create index concurrently if not exists idx_chat_attachments_workspace_id on public.chat_attachments(workspace_id);
-- create index concurrently if not exists idx_credit_approvals_chat_action_id on public.credit_approvals(chat_action_id);
-- create index concurrently if not exists idx_credit_approvals_chat_message_id on public.credit_approvals(chat_message_id);
-- create index concurrently if not exists idx_credit_estimates_chat_message_id on public.credit_estimates(chat_message_id);
-- create index concurrently if not exists idx_credit_reservations_chat_session_id on public.credit_reservations(chat_session_id);
-- create index concurrently if not exists idx_chat_actions_executed_by on public.chat_actions(executed_by);
-- create index concurrently if not exists idx_chat_attachments_media_asset_id on public.chat_attachments(media_asset_id);
-- create index concurrently if not exists idx_chat_messages_actor_user_id on public.chat_messages(actor_user_id);
-- create index concurrently if not exists idx_credit_ledger_entries_related_chat_action_id on public.credit_ledger_entries(related_chat_action_id);
-- create index concurrently if not exists idx_edit_plans_created_by_user_id on public.edit_plans(created_by_user_id);
-- create index concurrently if not exists idx_ambient_sound_plans_audio_environment_analysis_id on public.ambient_sound_plans(audio_environment_analysis_id);

-- Duplicate-index checklist for a future prompt:
-- 1. Check existing table indexes and composite left-prefix coverage.
-- 2. Confirm query patterns use the FK column.
-- 3. Estimate write-amplification risk.
-- 4. Keep deferred audio ownership separate until Sound/Music evidence is accepted.
-- 5. Do not apply anything from this Markdown sketch.
```

## Non-Execution Notes

No index is created by Prompt 26H. No staging or production validation is claimed.
