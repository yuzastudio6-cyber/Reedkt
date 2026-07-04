# RP-EDITBRIEF-00 Existing Edit Brief Surface Audit

Status: audit only. This report adds no implementation, no migration, no Supabase command, no route, no UI behavior, no worker, no render, no provider/model call, no credit action, no staging, and no cleanup.

Naming anchor: `ProjectEditSession` / Edit Chat is the persistent workspace. Edit Brief is an optional timeline instruction layer inside an Edit Chat. Marker is a time-specific or range-specific instruction inside a Brief. Marker Chat is a scoped conversation linked to one Marker. Edit Preference is reusable style/DNA, not a session or brief. Export settings are session-level settings accessible from Brief, not owned only by Brief.

## Existing Surface Inventory

| Area | File path / symbol | Current purpose | Could be reused? | Needs wrap/rename? | Duplication risk | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Edit Brief types | `src/types/edit-brief.ts`, `src/types/edit-brief-state.ts` | Existing clean-assembly-oriented brief model, status, style, asset rules, activity state, and readiness. | Yes, as prior art. | Yes, for ProjectEditSession ownership. | High | These are pre-existing implementation surfaces and must be audited, not extended in RP-EDITBRIEF-00. |
| Edit Cue types | `src/types/edit-cue.ts`, `src/types/edit-cue-state.ts`, `src/types/edit-cue-conflict.ts` | Time/transcript/scene/asset/global cue anchors, roles, conflicts, operations, validation, and remapping. | Yes, as marker predecessor. | Likely: future Marker names should map to cue concepts carefully. | High | Marker should not duplicate cue semantics without an explicit rename/deprecation decision. |
| Edit Brief hooks/libs | `src/hooks/useEditBrief.ts`, `src/lib/edit-brief/*` | Local editor brief state, operations, activity events, and summaries. | Maybe. | Yes. | Medium | Current hook is tied to mock footage prep / clean assembly, not persistent Edit Chat. |
| Edit Cue hooks/libs | `src/hooks/useEditCues.ts`, `src/lib/edit-cues/*` | Local cue creation, validation, conflict resolution, activity, and remapping. | Maybe. | Yes. | High | Future markers can reuse validation/conflict ideas, but persistence must live under Edit Chat. |
| Editor panels | `src/components/editor/edit-brief/*`, `src/components/editor/edit-cues/*` | Existing inline editor panels for brief and cues. | Maybe for visual patterns. | Yes. | High | These are not the Project Edit Session Brief tab yet. |
| Timeline UI | `src/components/Timeline.tsx`, `src/components/editor/DetailedTimelineDrawer.tsx` | Mock timeline/layer timing drawer for captions, visuals, SFX, music, AI clips, and Remotion layers. | Yes for display pattern. | No. | Medium | Brief needs a marker lane and selected marker drawer, not trimming/cutting/render controls. |
| Project Edit Session routes | `src/App.tsx`, `src/pages/ProjectEditSessionChatPage.tsx` | Base Edit Chat plus chat/history/versions/preview/details sections. | Yes. | Add future `/brief` only after owner approval. | Medium | Current route model has no Brief section. |
| Project Edit Session client/repository | `src/lib/project-edit-session-api-client.ts`, `src/backend/repositories/project-edit-session-repository.ts` | Mock/local session persistence seam for messages, sources, memory, snapshots, versions, previews, revisions, and events. | Yes. | Wrap in future Brief-specific service. | Low | Do not add Brief collections in this milestone. |
| Memory/history/preference panels | `src/lib/project-edit-session-memory-ui-adapter.ts`, `src/lib/project-edit-session-history-ui-adapter.ts`, `src/lib/project-edit-session-preference-ui-adapter.ts` | Structured memory, history, and Preference DNA surface in Edit Chat. | Yes. | No. | Medium | Marker summaries can later feed memory/history without mixing scoped Marker Chat into main messages. |
| Source/media seams | `src/lib/source-sequence-ui-adapter.ts`, `src/lib/media-asset-api-client.ts`, `src/types/media-asset-repository.ts`, `src/types/storage-runtime.ts` | Metadata-only source clips, source order, preview descriptors, storage/provider boundaries. | Yes. | Maybe for marker attachment chips. | Low | Real uploads, signed URLs, byte reads, and media processing remain blocked. |
| Planner/resolver seams | `src/backend/project-edit-session-history/*`, `src/backend/project-edit-session-preference/*`, edit plan repository/services | Mock planning, history, preference application, and edit-plan seams. | Yes. | Future marker bridge needed. | Medium | Confirmed markers should outrank main chat and Preference DNA in future planner priority. |
| Production timeline workers | `server/workers/timeline/*` and related production docs | Timeline manifest, QA, artifact, and execution planning surfaces. | Future only. | Yes. | Medium | Audit as blocked production/runtime work, not a source for this audit to execute. |
| Tests and smokes | `tests/e2e/project-edit-session-*.spec.ts`, `server/smoke/project-edit-session-*.ts` | Existing Edit Chat coverage and mock/local verification. | Yes. | Add future Brief coverage later. | Low | RP-EDITBRIEF-00 adds only a docs smoke. |

## Potential Overlaps

- Existing Edit Cue anchors already cover time ranges, transcript ranges, scenes, assets, and global instructions; a future Marker model must decide whether it wraps, renames, or replaces these concepts.
- Existing Edit Brief panels already collect goals, platforms, style, asset rules, and notes; future Project Edit Session Brief should not duplicate the old clean-assembly panel without a migration story.
- Timeline worker surfaces include execution language; future Edit Brief docs must keep mock/local Marker planning distinct from real timeline/render execution.
- Project Edit Session memory/history can record marker summaries and confirmations, but Marker Chat should remain scoped to marker records.

## Potential Gaps

- No persistent Project Edit Session Brief route exists.
- No Project Edit Session-owned marker collection exists.
- No marker-scoped chat/message model exists.
- No marker attachment chip model exists.
- No session-level export settings record is implemented.
- No marker-to-planner bridge exists.

## Audit Result

Expected future direction: build an Edit Brief / Marker layer under `ProjectEditSession`, while reusing Project Edit Session route/client/repository patterns, memory/history patterns, media/source metadata seams, and Preference DNA application policy. Owner decisions remain pending before RP-EDITBRIEF-01.
