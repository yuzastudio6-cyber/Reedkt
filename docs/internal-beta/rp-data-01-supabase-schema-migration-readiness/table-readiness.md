# RP-DATA-01 Table Readiness

Decision: `completed_schema_migration_readiness_review_ready_for_migration_safety_packet`

Table readiness status: `review_ready_not_applied`

## MVP Table Groups

| Group | Tables | Readiness |
| --- | --- | --- |
| Identity/workspace | `profiles`, `workspaces`, `workspace_members` | `review_ready_not_applied` |
| Project/session/chat | `projects`, `edit_sessions`, `chat_messages`, `user_confirmations` | `review_ready_not_applied` |
| Media/source | `media_assets`, `uploaded_clips`, `source_sequence_items`, `clip_analysis_snapshots` | `review_ready_not_applied` |
| Intent/settings | `edit_intent_snapshots`, `edit_settings_snapshots` | `review_ready_not_applied` |
| Plan/version | `edit_plan_versions`, `plan_component_snapshots`, `edit_plan_segments`, `edit_operations` | `review_ready_not_applied` |
| Credit/approval | `credit_estimates`, `credit_estimate_items`, `approval_records`, `approved_plan_snapshots` | `review_ready_not_applied` |
| Generation/assets | `generation_requests`, `generation_events`, `generated_assets`, `generated_asset_versions` | `review_ready_not_applied` |
| Jobs/workers | `editing_jobs`, `job_steps`, `worker_events` | `review_ready_not_applied` |
| QA/revision/export | `qa_reports`, `qa_check_results`, `revision_requests`, `final_exports` | `review_ready_not_applied` |
| Audit/compliance | `audit_events`, `production_readiness_snapshots`, `license_review_snapshots` | `review_ready_not_applied` |

## Internal Beta Minimum

The minimum internal beta data lane requires:

1. `projects`
2. `media_assets`
3. `edit_sessions`
4. `chat_messages`
5. `source_sequence_items`
6. `edit_intent_snapshots`
7. `edit_plan_versions`
8. `credit_estimates`
9. `approval_records`
10. `approved_plan_snapshots`
11. `credit_reservations` or equivalent internal ledger table
12. `editing_jobs`
13. `worker_events`
14. `artifact_manifests`
15. `qa_reports`
16. `audit_events`

Where current docs use broader table names, the next migration safety packet must either map them directly or record a precise table-name decision before SQL migration creation.

## Immutable Snapshot Rule

Approved snapshots must be immutable. Workers execute approved snapshots, not raw chat and not mutable current UI state.

## Credit Rule

Credit estimates may be user-visible; credit reservations, ledger entries, release, spend, and refund records must be backend/service-role controlled and auditable.
