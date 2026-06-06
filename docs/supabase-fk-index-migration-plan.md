# Supabase FK Index Migration Plan

FK index migration plan status: `fk_index_migration_plan_created`.
Supabase update required: docs/status only.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.
Active migration files changed: no.
Production capability enabled: none; FK index hardening migration plan only.

## Scope

Prompt 26H converts the connected read-only Supabase advisor finding set from Prompt 26A into a future FK index migration plan. It does not create an active migration, create indexes, run SQL, run Supabase lifecycle commands, call Google Cloud or Secret Manager, approve staging execution, or change production readiness.

Supabase's Database Advisor identifies unindexed foreign keys as performance findings because joins and filters over foreign-key columns can become slower without supporting indexes. This plan treats those findings as review candidates, not applied remediation.

The plan preserves existing ReeditPro boundaries:

- Prompt 23 state on this base remains `pending_human_approval`.
- Prompt 24/24A/24B/24C evidence gates remain incomplete.
- Prompt 25/25A command and Secret Manager reference packets remain documentation only.
- Prompt 26A connected metadata is partial read-only evidence, not staging validation.
- Prompt 26B through Prompt 26G advisor plans are planning artifacts only.

## Covered FK Findings

Prompt 26H covers exactly these connected-advisor examples:

| Priority | FK finding | Draft index shape | Duplicate review |
| --- | --- | --- | --- |
| High | `api_idempotency_keys.user_id` | `idx_api_idempotency_keys_user_id` | Required |
| High | `approved_plan_snapshots.approved_by_user_id` | `idx_approved_plan_snapshots_approved_by_user_id` | Required |
| High | `approved_plan_snapshots.credit_approval_id` | `idx_approved_plan_snapshots_credit_approval_id` | Required |
| High | `chat_actions.workspace_id` | `idx_chat_actions_workspace_id` | Required |
| High | `chat_attachments.workspace_id` | `idx_chat_attachments_workspace_id` | Required |
| High | `credit_approvals.chat_action_id` | `idx_credit_approvals_chat_action_id` | Required |
| High | `credit_approvals.chat_message_id` | `idx_credit_approvals_chat_message_id` | Required |
| High | `credit_estimates.chat_message_id` | `idx_credit_estimates_chat_message_id` | Required |
| High | `credit_reservations.chat_session_id` | `idx_credit_reservations_chat_session_id` | Required |
| Medium | `chat_actions.executed_by` | `idx_chat_actions_executed_by` | Required |
| Medium | `chat_attachments.media_asset_id` | `idx_chat_attachments_media_asset_id` | Required |
| Medium | `chat_messages.actor_user_id` | `idx_chat_messages_actor_user_id` | Required |
| Medium | `credit_ledger_entries.related_chat_action_id` | `idx_credit_ledger_entries_related_chat_action_id` | Required |
| Medium | `edit_plans.created_by_user_id` | `idx_edit_plans_created_by_user_id` | Required |
| Defer | `ambient_sound_plans.audio_environment_analysis_id` | `idx_ambient_sound_plans_audio_environment_analysis_id` | Required |

## Review Rules

Future FK index candidates must:

- verify table and column existence locally before any staging candidate;
- compare existing single-column and composite index coverage before proposing new indexes;
- treat left-prefix composite indexes as potential coverage only when query patterns match;
- avoid duplicate or near-duplicate indexes;
- estimate write-amplification risk for chat, credit ledger, and idempotency paths;
- preserve RLS, SECURITY DEFINER, and function search-path boundaries from Prompt 26D through Prompt 26G;
- avoid any service-role exposure to browser or frontend contexts;
- keep production deployment blocked until staging evidence, rollback, and owner approval exist.

## Cross-Chat Ownership And Handoff

The owning workstream for this plan is `SUPABASE_RLS_STORAGE_DATABASE`. Since `docs/cross-chat/` is absent on this base, Prompt 26H records cross-chat ownership here instead of creating a new folder.

Handoff notes:

- Chat/editor FK findings need `FRONTEND_PRODUCT_UX` review before production indexing because read patterns depend on chat UI and audit flows.
- Credit FK findings need `CREDITS_BILLING_APPROVAL` review because write volume and ledger append-only guarantees matter.
- `ambient_sound_plans.audio_environment_analysis_id` stays deferred for `SOUND_MUSIC_AUDIO` ownership until SoundSync evidence is accepted.
- Storage/media-related FK findings need `SUPABASE_RLS_STORAGE_DATABASE` review for private media and signed URL assumptions.

## Non-Goals

Prompt 26H does not:

- create active files under `supabase/migrations/`;
- add executable `.sql` remediation files;
- create or validate indexes;
- run local SQL or staging SQL;
- run Supabase lifecycle commands;
- run raw database clients;
- call Google Cloud or Secret Manager;
- alter RLS policies, functions, grants, storage, or production settings;
- approve staging or production execution.

## Next Prompts

Recommended next prompt: Prompt 26H-1 - FK Index Local Migration Candidate or Prompt GD-0 - AI Tools / Graphic Design Stack Repo Audit.

