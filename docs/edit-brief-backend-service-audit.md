# Edit Brief Backend Service Audit

Status: audit only. This report maps future Edit Brief services to `ProjectEditSession` boundaries and adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

## Backend Surface Decisions

| Surface | Current role | Future Brief use | Decision |
| --- | --- | --- | --- |
| Project Edit Session repository | Mock session bundle, messages, sources, memory, snapshots, versions, previews, revisions, events. | Store/load Brief records through a future seam. | Reuse patterns; new Brief repository later. |
| Project Edit Session API/client | Route-shaped envelopes and browser-safe clients. | Future Brief routes/client. | Reuse patterns; no routes now. |
| Memory services | Deterministic mock memory extraction and merge. | Marker summaries and confirmations can update memory. | Wrap later. |
| History services | Snapshot/version/preview/revision/event history. | Marker create/update/confirm can emit events and checkpoints. | Reuse later. |
| Preference/DNA services | Applies reusable preference/DNA with QA policy. | Markers can override or refine DNA hints. | Reuse policy precedence later. |
| Media asset repository | Mock media/source metadata and disabled Supabase boundary. | Marker attachments. | Reuse metadata model. |
| Storage runtime | Mock/disabled storage providers. | Safe preview descriptors only. | Future only for real storage. |
| Source sequence adapter | Source order and planning context. | Marker source context. | Reuse. |
| Edit planning/resolver services | Mock planning and preference-aware setup. | Consume confirmed markers later. | Needs new bridge. |
| Worker/provider boundaries | Blocked model/tool/worker/render surfaces. | Must remain blocked. | Future only. |

## Required Future Services

- Edit Brief repository interface and mock implementation.
- Marker repository/service.
- Marker attachment service.
- Marker Chat service.
- Marker intent and confirmation service.
- Marker conflict validation service.
- Export settings service.
- Marker planner bridge.

## Boundary

The audit creates no backend service and no route handler. It records the reuse map so RP-EDITBRIEF-01 can be architecture-only or types/contracts-first after owner review.
