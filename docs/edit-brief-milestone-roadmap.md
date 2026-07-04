# Edit Brief Milestone Roadmap

Status: architecture/docs only. This report maps future `ProjectEditSession` Brief milestones and adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Roadmap

1. RP-EDITBRIEF-02 — Types, Contracts, and Mock Fixtures
2. RP-EDITBRIEF-03 — Mock Repository Layer
3. RP-EDITBRIEF-04 — API Routes + Client Layer
4. RP-EDITBRIEF-05 — Brief UI Shell: Video Player + Timeline
5. RP-EDITBRIEF-06 — Marker Creation + Marker Drawer
6. RP-EDITBRIEF-07 — Marker Chat + Intent Capture
7. RP-EDITBRIEF-08 — Marker Attachments
8. RP-EDITBRIEF-09 — Export Settings Auto-Recommendation + Brief Access
9. RP-EDITBRIEF-10 — Marker QA + Conflict Detection
10. RP-EDITBRIEF-11 — Apply Brief Markers to Edit Plan
11. RP-EDITBRIEF-12 — Internal Testing + Playwright Coverage
12. RP-EDITBRIEF-13 — Supabase Persistence Plan
13. RP-EDITBRIEF-14 — Production Readiness Gates

## Gate

Proceed to RP-EDITBRIEF-02 only after owner review of product flow, route/tab naming, Marker vs Edit Cue compatibility, Marker status/type/priority lists, Marker Chat behavior, attachments, Export Settings, and planner priority.

## RP-EDITBRIEF-02 Status

RP-EDITBRIEF-02 is complete as a types/contracts/mock fixtures foundation. It adds `ProjectEditBrief*` types, deterministic fixtures, mappers, request/response-only contracts, scenarios, orchestrator flows, docs, and smoke coverage. It does not add repositories, API handlers, routes, UI behavior, MockDatabase collections, migrations, direct Supabase CLI, providers/models, workers, rendering, uploads, credits, staging, commits, cleanup, deletes, moves, or renames.

Next recommended milestone after owner review: RP-EDITBRIEF-03 - Mock Repository Layer.
## RP-EDITBRIEF-03 - Mock Repository Layer

Status: complete as mock repository only. ProjectEditBrief MockDatabase collections, fixture-seeded repository behavior, disabled Supabase skeleton, row mappers, validation/summary helpers, contracts, 66 scenarios, orchestrator, docs, and smoke coverage are in place.

Boundaries: no API handlers, no UI routes, no runtime behavior, no migration, no direct Supabase CLI, no staging/commit/cleanup. Owner decisions remain pending. Recommended next milestone: RP-EDITBRIEF-04 — API Routes + Client Layer.

## RP-EDITBRIEF-04A - Route + Client QA Closure

Status: complete as QA closure only. RP-EDITBRIEF-04 route/client infrastructure is verified with the closure smoke, route/client smokes, shared API/safety checks, Project Edit Session smokes, representative Preference Video/Edit Preference smokes, build, lint, frontend-boundary, QA wrappers, and requested Playwright specs.

Boundaries: no Edit Brief UI shell, no `/brief` route, no runtime behavior, no migration, no direct Supabase CLI, no staging/commit/cleanup. Owner decisions remain pending. Recommended next milestone after owner review: RP-EDITBRIEF-05 - Brief UI Shell: Video Player + Timeline.

## RP-EDITBRIEF-05 - Brief UI Shell

Status: complete as mock/local read-only UI shell after verification. The Brief route, tab, video placeholder, timeline, marker lane, selected marker detail, metadata-only attachment chips, export summary, empty states, UI adapter, docs, smoke, and Playwright spec are present.

Boundaries: no marker creation/editing/chat, no real media playback, no uploads, no file-byte reads, no external URL fetch, no media processing, no providers/models, no workers, no render/progress, no credits, no Supabase command or migration, no staging/commit/cleanup. Owner decisions remain pending. Recommended next milestone after owner review: RP-EDITBRIEF-06 - Marker Creation + Marker Drawer.

## RP-EDITBRIEF-06 - Marker Creation + Marker Drawer

Status: complete as mock/local marker creation and drawer editing. The Brief route now supports explicit Add Marker, marker selection/edit mode, title/note/type/priority/time/AI-mode/status controls, save/update/confirm/archive actions, playhead-only empty timeline clicks, archived-marker hiding, smoke coverage, Playwright coverage, and internal-testing scenarios.

Boundaries: Marker Chat, attachment upload, export setting edits, QA/conflict detection, planner application, real playback, media processing, providers/models, workers, render/progress, credits, Supabase persistence/migrations, staging, production, and `ChatNativeEditor` runtime changes remain blocked. Recommended next milestone after owner review: RP-EDITBRIEF-07 - Marker Chat + Intent Capture.

## RP-EDITBRIEF-08 - Marker Attachments

Status: complete or partial based on verification as mock/local metadata-only Marker Attachments. The marker drawer can add/remove B-roll, image, music, soundtrack, SFX, voiceover, document, reference label, and URL metadata through the existing Project Edit Brief client seam, with no new route IDs.

Boundaries: no upload, no file-byte read, no external URL fetch, no media processing, no sound runtime, no providers/models, no workers, no render/progress, no credits, no Supabase command or migration, no staging/commit/cleanup, and no `ChatNativeEditor` changes. Recommended next milestone after owner review: RP-EDITBRIEF-09 - Export Settings Auto-Recommendation + Brief Access.

## RP-EDITBRIEF-09 - Export Settings Auto-Recommendation + Brief Access

Status: complete or partial based on verification as mock/local Export Settings recommendation and editing. The Brief panel can recommend deterministic presets, edit basic settings, save through the existing Project Edit Brief client seam, and refresh the workspace summary with no new route IDs.

Boundaries: no real export/render/progress, no media probing, no file-byte read, no external URL fetch, no media processing, no providers/models, no workers, no credits, no Supabase command or migration, no staging/commit/cleanup, and no `ChatNativeEditor` changes. Recommended next milestone after owner review: RP-EDITBRIEF-10 - Marker QA + Conflict Detection.

## RP-EDITBRIEF-10 - Marker QA + Conflict Detection

Status: complete or partial based on verification as mock/local deterministic Marker QA. The Brief workspace can run a QA summary, selected markers can run marker QA, and the UI shows missing asset, clarification, overlap/audio conflict, copy-risk, and export-warning metadata.

Boundaries: no Qwen, no DeepSeek, no embeddings/vector DB, no providers/models, no sound runtime, no Docker, no workers, no render/export/progress, no media processing, no file-byte read, no external URL fetch, no credits, no Supabase command or migration, no staging/commit/cleanup, no `ChatNativeEditor` change, and no planner application. Recommended next milestone after owner review: RP-EDITBRIEF-11 - Apply Brief Markers to Edit Plan.
## RP-EDITBRIEF-11 — Apply Brief Markers to Mock Plan Hints

RP-EDITBRIEF-11 is the mock/local Plan Bridge milestone. It converts eligible QA-safe markers into structured `Brief Plan Hints`, records a mock application log, and surfaces included/skipped marker reasons in the Brief UI. It does not run the real planner, create edit plans, render, export, call providers, process media, spend credits, or use Supabase. Next recommended milestone after owner review: `RP-EDITBRIEF-12 — Internal Testing + Playwright Coverage`.

## RP-EDITBRIEF-12 — Internal Testing + Playwright Coverage

Status: complete as mock/local QA hardening after verification. The milestone adds consolidated smoke coverage, full-path Playwright coverage, internal-testing scenarios, QA docs, and boundary-copy hardening. It does not add features, production routes, migrations, direct Supabase CLI, real planner execution, edit-plan records, providers/models, media processing, workers, render/export/progress, credits, staging, commit, cleanup, or `ChatNativeEditor` runtime changes. Next recommended milestone after owner review: `RP-EDITBRIEF-13 — Supabase Persistence Plan`.
