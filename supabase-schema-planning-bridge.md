# Supabase Schema Planning Bridge

This document defines how ReeditPro's frontend/mock planning architecture should map to a future Supabase schema. It is planning documentation only. It does not create migrations, connect Supabase, create database clients, implement storage, implement workers, implement billing, or run SQL.

## Purpose

Frontend mock planning is not persistence. Future backend work must persist projects, edit sessions, chat, media, source sequence, intent snapshots, edit plan versions, approvals, credit estimates, generation requests, generated assets, worker jobs, QA reports, final exports, and audit events.

Approved plan snapshots are the core execution contract. Workers should load approved snapshots, not reconstruct plans from raw chat or mutable current UI state.

Normalized tables help query ownership, status, approvals, jobs, assets, and audit trails. JSONB snapshots preserve the full planning detail while the worker schema stabilizes.

## Schema Strategy

Use a hybrid schema.

Normalize:

- project ownership
- edit sessions
- chat messages
- media assets
- source sequence
- intent snapshots
- edit plan versions
- credit estimates
- approval records
- approved plan snapshots
- generation requests
- generated assets
- editing jobs
- job steps
- QA reports
- final exports

Store full planning detail as JSONB snapshots:

- `compiledIntent`
- `professionalEditingDirective`
- `videoUnderstandingReport`
- `adaptiveEditStrategyPlan`
- `segmentEditPlans`
- `visualAssetPlan`
- `speakerVisualLayoutPlan`
- `depthAwareOverlayPlan`
- `foregroundMaskingPlan`
- `depthAwareLayoutValidationPlan`
- `colorPipelinePlan`
- `audioPipelinePlan`
- `mapAnimationPlan`
- `dataVizPlan`
- `browserCapturePlan`
- `characterConsistencyPlan`
- `documentaryFactSafetyPlan`
- `renderStrategyPlan`
- `toolStrategyPlan`
- `rendererCompositionPlan`
- `providerPromptPlans`
- `workerRuntimePlan`
- `productionReadinessReport`
- `planningSystemAuditReport`

The first production migration should not over-normalize every nested planning object. Store the approved full plan as JSONB while keeping important searchable and auditable fields normalized.

## Versioning Policy

- Intent snapshots are versioned.
- Edit plans are versioned.
- Credit estimates are versioned.
- Approved snapshots are immutable.
- Revisions create new plan versions.
- Old approved versions are not overwritten.
- Approval records point to exact plan, credit, and snapshot versions.
- Worker jobs point to approved snapshot IDs.

## Approval Snapshot Policy

When a user approves, freeze:

- compiled intent
- settings
- source order
- edit plan version
- segment operations
- visual asset plan
- all planning layers
- provider routes
- prompt plans
- credit estimate
- fallback policy
- QA plan
- tier/model constraints
- production/tool notes

Workers execute `approved_plan_snapshots.snapshot_json`. They do not execute raw chat and do not execute mutable current plan state.

## Schema Groups

| Group | Tables |
| --- | --- |
| Identity/workspace | `profiles`, `workspaces`, `workspace_members` |
| Project/session/chat | `projects`, `edit_sessions`, `chat_messages`, `user_confirmations` |
| Media/source | `media_assets`, `uploaded_clips`, `source_sequence_items`, `clip_analysis_snapshots` |
| Intent/settings | `edit_intent_snapshots`, `edit_settings_snapshots` |
| Plan/version | `edit_plan_versions`, `plan_component_snapshots`, `edit_plan_segments`, `edit_operations` |
| Credit/approval | `credit_estimates`, `credit_estimate_items`, `approval_records`, `approved_plan_snapshots` |
| Generation/assets | `generation_requests`, `generation_events`, `generated_assets`, `generated_asset_versions` |
| Jobs/workers | `editing_jobs`, `job_steps`, `worker_events` |
| QA/revision/export | `qa_reports`, `qa_check_results`, `revision_requests`, `final_exports` |
| Audit/compliance | `audit_events`, `production_readiness_snapshots`, `license_review_snapshots` |

## MVP Table Recommendation

Recommended first migration set:

- `profiles`
- `workspaces`
- `workspace_members`
- `projects`
- `edit_sessions`
- `chat_messages`
- `media_assets`
- `uploaded_clips`
- `source_sequence_items`
- `edit_intent_snapshots`
- `edit_plan_versions`
- `credit_estimates`
- `credit_estimate_items`
- `approval_records`
- `approved_plan_snapshots`
- `generation_requests`
- `generated_assets`
- `editing_jobs`
- `job_steps`
- `qa_reports`
- `final_exports`
- `audit_events`

Optional later tables:

- `plan_component_snapshots`
- `edit_plan_segments`
- `edit_operations`
- `clip_analysis_snapshots`
- `generation_events`
- `generated_asset_versions`
- `qa_check_results`
- `revision_requests`
- `production_readiness_snapshots`
- `license_review_snapshots`

MVP should store full JSON snapshots first, then normalize more deeply as worker execution needs stabilize.

## RLS And Security Principles

- All project data belongs to a workspace/project owner.
- Workspace members only access projects they are members of.
- Service role is reserved for worker writes and trusted backend workflows.
- Users cannot mutate approved snapshots.
- Users cannot directly write credit ledger or reservation records.
- Provider prompts and generated assets should be project-scoped.
- Browser capture/source data should be private.
- PII and sensitive media require redaction and privacy planning.
- Audit events are append-only.
- Basic/Pro no-Veo and Premium fallback-only Veo constraints must be preserved in approved snapshots.

## Storage Bucket Planning

| Bucket | Access | Signed URL | Retention | Worker/User Access |
| --- | --- | --- | --- | --- |
| `source-media` | Private | Yes | Workspace/project privacy policy | Worker write, project member read |
| `generated-assets` | Private | Yes | Retain until deletion/retention policy | Worker write, project member read |
| `processed-media` | Private | Yes | Review regenerable artifact retention | Worker write, project member read |
| `previews` | Private | Yes | Shorter retention may be possible | Worker write, project member read |
| `exports` | Private | Yes | User-facing retention required | Worker write, project member read |
| `thumbnails` | Private | Yes | Private because frames may reveal media | Worker write, project member read |
| `qa-artifacts` | Private | Yes | Conservative retention | Worker write, mediated user visibility |
| `worker-temp` | Private | No durable URLs | Short TTL | Worker-only |

## Non-Goals

This document does not:

- create migrations
- connect Supabase
- create database clients
- implement storage
- implement workers
- implement billing
- run SQL
