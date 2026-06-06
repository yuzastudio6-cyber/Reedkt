# Supabase FK Index Duplicate Review Contract

Duplicate review contract status: `fk_index_duplicate_review_planned`.
Duplicate-index review executed: no.
Supabase update status: docs_only.
Supabase environment touched: none.
SQL executed: none.
Migration deployed: no.

## Purpose

Every Prompt 26H FK index candidate requires duplicate and overlap review before a future active migration candidate may exist. The future reviewer must prove the candidate is not already covered by an equivalent single-column index, an intentionally ordered composite index, or a more selective partial index.

## Required Review Evidence

Future review must capture sanitized evidence for:

- existing indexes on each target table;
- composite index left-prefix coverage;
- partial index predicates, if any;
- FK constraint shape and source column;
- expected query shape using the FK column;
- expected write volume and write-amplification risk;
- advisor before and after state in local or staging, when approved.

## Candidate Coverage Requirements

The review must cover:

- `api_idempotency_keys.user_id`
- `approved_plan_snapshots.approved_by_user_id`
- `approved_plan_snapshots.credit_approval_id`
- `chat_actions.workspace_id`
- `chat_attachments.workspace_id`
- `credit_approvals.chat_action_id`
- `credit_approvals.chat_message_id`
- `credit_estimates.chat_message_id`
- `credit_reservations.chat_session_id`
- `chat_actions.executed_by`
- `chat_attachments.media_asset_id`
- `chat_messages.actor_user_id`
- `credit_ledger_entries.related_chat_action_id`
- `edit_plans.created_by_user_id`
- `ambient_sound_plans.audio_environment_analysis_id`

## Decision Outcomes

Allowed future outcomes:

- `create_single_column_index_candidate` when no duplicate exists and query evidence supports it;
- `skip_existing_index_covers` when coverage already exists;
- `defer_insufficient_query_evidence` when performance evidence is incomplete;
- `defer_write_amplification_risk` when write pressure may outweigh read benefit;
- `defer_ownership_required` when another workstream must approve the index.

Prompt 26H records the contract only.

