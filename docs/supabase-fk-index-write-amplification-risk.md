# Supabase FK Index Write-Amplification Risk Matrix

Write-amplification review status: `fk_index_write_amplification_review_planned`.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.

## Risk Model

FK indexes can improve read-side joins and filters, but each index adds write maintenance cost. Prompt 26H keeps this as a future migration-planning concern.

| Risk | Candidate examples | Reason |
| --- | --- | --- |
| Low | `approved_plan_snapshots.approved_by_user_id`, `approved_plan_snapshots.credit_approval_id`, `credit_approvals.chat_action_id`, `credit_approvals.chat_message_id` | These tables are expected to write less frequently than chat or ledger streams. |
| Medium | `api_idempotency_keys.user_id`, `chat_actions.workspace_id`, `chat_attachments.workspace_id`, `chat_actions.executed_by`, `chat_attachments.media_asset_id`, `credit_estimates.chat_message_id`, `credit_reservations.chat_session_id`, `edit_plans.created_by_user_id`, `ambient_sound_plans.audio_environment_analysis_id` | These candidates may sit on moderate write paths or need ownership evidence. |
| High | `chat_messages.actor_user_id`, `credit_ledger_entries.related_chat_action_id` | Chat message and credit ledger flows may grow quickly and need write-volume review before index creation. |

## Required Future Checks

- Confirm expected write rate for each table.
- Confirm whether the FK column is used in common read filters or joins.
- Review duplicate coverage before adding write overhead.
- Stage test any active migration candidate after human approval and accepted evidence.
- Keep production rollout blocked until rollback and advisor recheck evidence exist.

