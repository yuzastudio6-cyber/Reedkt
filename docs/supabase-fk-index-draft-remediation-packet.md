# Supabase FK Index Draft Remediation Packet

Prompt 26C records future additive index candidates for Prompt 26A unindexed foreign-key advisor findings. No index is created in Prompt 26C.

## Status

- Draft status: `draft_only`.
- FK index hardening applied: no.
- SQL executed: none.
- Active migration created: no.
- Supabase environment touched: none.

## Candidate Indexes

| Candidate | Draft priority | Future review note |
| --- | --- | --- |
| `api_idempotency_keys.user_id` | P1 | Helps idempotency ownership and user lookup. |
| `approved_plan_snapshots.approved_by_user_id` | P1 | Helps approval history queries. |
| `approved_plan_snapshots.credit_approval_id` | P1 | Helps snapshot/credit gate joins. |
| `chat_actions.executed_by` | P2 | Helps audit/action actor lookup. |
| `chat_actions.workspace_id` | P1 | Helps workspace-scoped chat action access. |
| `chat_attachments.media_asset_id` | P2 | Helps attachment/media joins. |
| `chat_attachments.workspace_id` | P1 | Helps workspace-scoped attachment access. |
| `chat_messages.actor_user_id` | P2 | Helps message actor lookup. |
| `credit_approvals.chat_action_id` | P2 | Helps credit/action traceability. |
| `credit_approvals.chat_message_id` | P2 | Helps credit/message traceability. |
| `credit_estimates.chat_message_id` | P2 | Helps estimate/message traceability. |
| `credit_ledger_entries.related_chat_action_id` | P2 | Helps ledger/action traceability. |
| `credit_reservations.chat_session_id` | P2 | Helps reservation/session lookup. |
| `edit_plans.created_by_user_id` | P2 | Helps plan author lookup. |
| `ambient_sound_plans.audio_environment_analysis_id` | P3 | Helps audio analysis joins if table is production-used. |

## Draft Index Direction

Future index migrations should:

- Use additive index creation only.
- Check existing index coverage first to avoid duplicates.
- Group high-traffic workspace/project/approval indexes before low-volume audit indexes.
- Validate locally before any staging candidate.
- Avoid adding indexes for legacy tables until ownership and usage are clear.

## Blockers

- A full advisor export and current schema evidence are still needed.
- Prompt 23 remains `pending_human_approval`.
- Prompt 24D accepted evidence is missing.
- No staging SQL is approved.

## Draft Sketch

Review-only index sketch: `docs/draft-sql/supabase-advisor-remediation/fk-indexes-draft.sql.md`.
