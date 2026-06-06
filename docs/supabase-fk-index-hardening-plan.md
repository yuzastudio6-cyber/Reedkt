# Supabase Foreign-Key Index Hardening Plan

Prompt 26A reported unindexed foreign-key findings. Prompt 26B creates an index remediation plan only and does not create indexes.

## Prompt 26H Update

Prompt 26H records `fk_index_migration_plan_created` as docs/status only. It adds a full FK index migration planning package, duplicate review contract, naming contract, write-amplification risk matrix, future test matrix, rollback plan, and staging evidence requirements.

Supabase update required: docs/status only.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.
Active migration files changed: no.
Production capability enabled: none; FK index hardening migration plan only.

## Candidate Groups

| Group | Examples | Priority | Future migration approach |
| --- | --- | --- | --- |
| Idempotency/runtime replay | `api_idempotency_keys.user_id` | High | Confirm replay queries and add deterministic additive indexes. |
| Approved snapshots | `approved_plan_snapshots.approved_by_user_id`, `approved_plan_snapshots.credit_approval_id` | High | Review snapshot read paths and schema-era compatibility. |
| Chat/editor records | `chat_actions.executed_by`, `chat_actions.workspace_id`, `chat_attachments.media_asset_id`, `chat_attachments.workspace_id`, `chat_messages.actor_user_id` | Medium | Group by chat/session/project query patterns. |
| Credits | `credit_approvals.chat_action_id`, `credit_approvals.chat_message_id`, `credit_estimates.chat_message_id`, `credit_ledger_entries.related_chat_action_id`, `credit_reservations.chat_session_id` | High | Validate credit gate read/write paths before adding indexes. |
| Edit planning | `edit_plans.created_by_user_id` | Medium | Confirm user/project/workspace filters used by services. |
| Audio planning | `ambient_sound_plans.audio_environment_analysis_id` | Medium | Review SoundSync planning access patterns before indexing. |

Prompt 26H priority now classifies `ambient_sound_plans.audio_environment_analysis_id` as deferred until SoundSync ownership and evidence are accepted.

## Future Index Rules

- Use `create index if not exists` in additive migration candidates.
- Use deterministic names that include table and column names.
- Guard against schema-era column absence when the chain has compatibility concerns.
- Avoid indexes that duplicate existing composite indexes.
- Validate local migration chain and staging performance separately.

## Prompt 26B Decision

No index is created in Prompt 26B. A future FK index migration design prompt should produce the exact additive index migration design after a complete advisor export or accepted evidence package is reviewed.

## Prompt 26H Planning Files

- `docs/supabase-fk-index-migration-plan.md`
- `docs/supabase-fk-index-priority-matrix.md`
- `docs/supabase-fk-index-duplicate-review-contract.md`
- `docs/supabase-fk-index-naming-contract.md`
- `docs/supabase-fk-index-write-amplification-risk.md`
- `docs/supabase-fk-index-future-test-matrix.md`
- `docs/supabase-fk-index-rollback-cleanup-plan.md`
- `docs/supabase-fk-index-staging-evidence-requirements.md`

Recommended next prompt: Prompt 26H-1 - FK Index Local Migration Candidate or Prompt GD-0 - AI Tools / Graphic Design Stack Repo Audit.
