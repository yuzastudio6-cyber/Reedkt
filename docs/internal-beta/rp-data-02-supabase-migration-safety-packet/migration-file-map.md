# RP-DATA-02 Migration File Map

Decision: `completed_migration_safety_packet_ready_for_static_migration_draft`

Migration file map status: `planned_not_created`

No migration files are created in this phase. The future static migration draft should be split so reviewers can inspect data model, RLS, storage, and backend-control boundaries independently before any guarded execution.

## Planned Future Migration Groups

| Planned group | Future migration file intent | Status |
| --- | --- | --- |
| Identity and workspace | profiles, workspaces, workspace members, membership predicates | `planned_not_created` |
| Project and sessions | projects, edit sessions, chat messages, user confirmations | `planned_not_created` |
| Media and source map | media assets, uploaded clips, source sequence items, analysis snapshots | `planned_not_created` |
| Intent and settings snapshots | compiled intent and edit settings snapshots | `planned_not_created` |
| Plan versions and operations | edit plan versions, plan components, segments, operations | `planned_not_created` |
| Approval and credits | credit estimates, approval records, approved plan snapshots, credit reservations | `planned_not_created` |
| Jobs and workers | editing jobs, job steps, worker events, leases, idempotency keys | `planned_not_created` |
| Artifacts and QA | artifact manifests, generated assets, QA reports, exports, revisions | `planned_not_created` |
| Audit and compliance | audit events, privacy/retention markers, production readiness snapshots | `planned_not_created` |
| Storage buckets and policies | private source-media, generated-assets, processed-media, previews, exports, thumbnails, qa-artifacts, worker-temp buckets | `planned_not_created` |

## Internal Beta Minimum Table Contract

The static migration draft must cover or explicitly map these RP-DATA-01 internal beta minimum tables before any Supabase execution:

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
11. `credit_reservations`
12. `editing_jobs`
13. `worker_events`
14. `artifact_manifests`
15. `qa_reports`
16. `audit_events`

## Required Static Draft Invariants

- Approved plan snapshots are immutable except for backend-controlled status/audit metadata.
- Workers execute approved snapshots only, never raw chat.
- Credit reservations, ledger/release/spend/refund records, worker events, artifact manifests, QA reports, and final export state are backend/service-role controlled.
- User-facing read/write policies are project/workspace membership scoped.
- Public artifact creation is not enabled.
- Durable signed URL source-of-truth is not allowed.
