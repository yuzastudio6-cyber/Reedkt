# RLS Hardening Matrix

This matrix captures draft table-by-table access intent. It is not tested Supabase RLS and is not production policy.

Legend:

- `workspace_member`: allowed only through workspace/project membership.
- `owner_only`: owner/admin-managed in future policy.
- `service_only`: backend/service-role controlled.
- `deny`: not allowed for normal users.
- `future_review`: needs role and product review.

| Group | Table | User select | User insert | User update | User delete | Service insert | Service update | Immutable after approval | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Identity/workspace | profiles | workspace_member | future_review | owner_only | deny | service_only | service_only | no | User profile writes need auth review. |
| Identity/workspace | workspaces | workspace_member | owner_only | owner_only | owner_only | service_only | service_only | no | Workspace owner/admin policy required. |
| Identity/workspace | workspace_members | workspace_member | owner_only | owner_only | owner_only | service_only | service_only | no | Role changes require owner/admin review. |
| Project/session/chat | projects | workspace_member | workspace_member | workspace_member | owner_only | service_only | service_only | no | Editor/admin role split remains future review. |
| Project/session/chat | edit_sessions | workspace_member | workspace_member | workspace_member | deny | service_only | service_only | no | Session state changes should stay project-scoped. |
| Project/session/chat | chat_messages | workspace_member | workspace_member | deny | deny | service_only | service_only | no | Raw chat is context, not worker execution contract. |
| Project/session/chat | user_confirmations | workspace_member | workspace_member | deny | deny | service_only | service_only | no | Confirmation history should be preserved. |
| Media/source | media_assets | workspace_member | future_review | service_only | future_review | service_only | service_only | no | Source media and browser capture artifacts are private. |
| Media/source | uploaded_clips | workspace_member | future_review | workspace_member | future_review | service_only | service_only | no | Direct table insert should be controlled by app upload flow. |
| Media/source | source_sequence_items | workspace_member | workspace_member | workspace_member | deny | service_only | service_only | no | Source order confirmation must remain auditable. |
| Media/source | clip_analysis_snapshots | workspace_member | deny | deny | deny | service_only | service_only | no | Future analysis workers write these snapshots. |
| Intent/plan | edit_intent_snapshots | workspace_member | service_only | deny | deny | service_only | service_only | no | Intent snapshots are versioned. |
| Intent/plan | edit_settings_snapshots | workspace_member | service_only | deny | deny | service_only | service_only | no | Settings snapshots are versioned. |
| Intent/plan | edit_plan_versions | workspace_member | service_only | service_only | deny | service_only | service_only | no | Approved versions must not be overwritten. |
| Intent/plan | plan_component_snapshots | workspace_member | service_only | deny | deny | service_only | service_only | no | Store queryable planning components. |
| Intent/plan | edit_plan_segments | workspace_member | service_only | deny | deny | service_only | service_only | no | Segment plans derive from approved planning. |
| Intent/plan | edit_operations | workspace_member | service_only | deny | deny | service_only | service_only | no | Worker-ready operations are generated from plan state. |
| Credit/approval/snapshot | credit_estimates | workspace_member | service_only | service_only | deny | service_only | service_only | no | User-visible but service-controlled. |
| Credit/approval/snapshot | credit_estimate_items | workspace_member | service_only | service_only | deny | service_only | service_only | no | Line items explain the estimate. |
| Credit/approval/snapshot | approval_records | workspace_member | service_only | deny | deny | service_only | service_only | yes | Approval records point to exact plan and estimate versions. |
| Credit/approval/snapshot | approved_plan_snapshots | workspace_member | deny | deny | deny | service_only | deny | yes | Worker execution contract; user update/delete denied. |
| Generation/jobs | generation_requests | workspace_member | deny | deny | deny | service_only | service_only | no | Must link to approved snapshot before execution. |
| Generation/jobs | generation_events | workspace_member | deny | deny | deny | service_only | service_only | no | Event writes are worker/service controlled. |
| Generation/jobs | generated_assets | workspace_member | deny | deny | future_review | service_only | service_only | no | Worker inserts generated assets; user cannot directly insert. |
| Generation/jobs | generated_asset_versions | workspace_member | deny | deny | future_review | service_only | service_only | no | Version writes are worker/service controlled. |
| Generation/jobs | editing_jobs | workspace_member | deny | deny | deny | service_only | service_only | no | Jobs must point to approved snapshots. |
| Generation/jobs | job_steps | workspace_member | deny | deny | deny | service_only | service_only | no | Normal users cannot insert/update job steps. |
| Generation/jobs | worker_events | workspace_member | deny | deny | deny | service_only | service_only | no | Worker/service event log. |
| QA/export/audit | qa_reports | workspace_member | deny | deny | deny | service_only | service_only | no | QA reports tie to jobs and snapshots. |
| QA/export/audit | qa_check_results | workspace_member | deny | deny | deny | service_only | service_only | no | QA detail rows are worker/service controlled. |
| QA/export/audit | revision_requests | workspace_member | workspace_member | deny | deny | service_only | service_only | no | User revision requests create new plan versions. |
| QA/export/audit | final_exports | workspace_member | deny | deny | future_review | service_only | service_only | no | Export rows tie to approved snapshots. |
| QA/export/audit | audit_events | workspace_member | deny | deny | deny | service_only | deny | no | Append-only; user update/delete denied. |
| QA/export/audit | production_readiness_snapshots | workspace_member | service_only | deny | deny | service_only | service_only | no | Not legal advice. |
| QA/export/audit | license_review_snapshots | workspace_member | service_only | service_only | deny | service_only | service_only | no | Review status only; no legal conclusions. |

Future credit ledger and reservation tables should be service-only and append-only.

