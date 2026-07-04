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
14. RP-EDITBRIEF-15 — Owner Review and Production Gate Evidence Collection
15. RP-EDITBRIEF-15A — Owner Evidence Intake Template
16. RP-EDITBRIEF-15B — Owner Evidence Readiness Evaluator
17. RP-EDITBRIEF-15C — Owner Evidence Review Packet
18. RP-EDITBRIEF-15D — Owner Evidence Local Validation
19. RP-EDITBRIEF-15E — Owner Evidence PR Diff Validation
20. RP-EDITBRIEF-15F — Owner Evidence Schema Validation
21. RP-EDITBRIEF-15G — Owner Evidence Example Generator
22. RP-EDITBRIEF-15H — Internal Testing Owner Acceptance
23. RP-EDITBRIEF-16 — Production-Shaped Internal Persistence Implementation Plan
24. RP-EDITBRIEF-17 — Internal Persistence Backend Skeleton
25. RP-EDITBRIEF-18 — Internal Route Integration

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

## RP-EDITBRIEF-13 — Supabase Persistence Plan

Status: complete as persistence planning and validation only. The milestone reconciles ProjectEditBrief concepts onto existing durable roots (`edit_briefs`, `edit_cues`, child cue tables, `edit_brief_application_logs`, and `edit_session_export_settings`), records Supabase RLS/Data API/Storage/service-role readiness gates, updates stale `project_edit_*` wording, and adds a regression smoke. It does not create migrations, run SQL, run Supabase CLI, enable live Supabase reads/writes, update generated database types, enable production routes, call providers/models, process media, dispatch workers, render/export, or reserve/spend credits.

Next recommended milestone after owner review: `RP-EDITBRIEF-14 — Production Readiness Gates`.

## RP-EDITBRIEF-14 — Production Readiness Gates

Status: complete as conditional readiness-gate policy only. The milestone replaces stale blanket beta/production blockers with computed go/no-go booleans that can pass only when named evidence is supplied. Default status remains blocked beyond internal dry-run because owner, deployment, security, storage/privacy, model/license, Supabase, approved snapshot, credit reservation, private-media, billing/ledger, observability, and incident gates are not all present. It does not enable external beta, real-user-media beta, paid production, live Supabase reads/writes, migrations, SQL, Supabase CLI, Storage writes, production routes, providers/models, uploads, media processing, worker dispatch, render/export, or credit reservation/spend.

Next recommended milestone after owner review: `RP-EDITBRIEF-15 — Owner Review and Production Gate Evidence Collection`.

## RP-EDITBRIEF-15 — Owner Review and Production Gate Evidence Collection

Status: blocked pending owner inputs. The milestone records the exact owner/operator evidence groups required before Edit Brief can move from internal dry-run to production persistence implementation: canonical workflow, durable root schema, auth/access policy, Supabase security, media lifecycle, planner integration, credit/cost, provider/model, worker/render, and operations approvals. It does not approve external beta, real-user-media beta, paid production, Supabase read/write, Storage writes, providers/models, uploads, media processing, worker dispatch, render/export, or credit reservation/spend.

Next recommended milestone after the owner inputs are supplied and recorded: `RP-EDITBRIEF-16 — Production Persistence Implementation Plan`.

## RP-EDITBRIEF-15A — Owner Evidence Intake Template

Status: complete as an intake template only. The milestone adds a concrete owner-evidence template with all required owner inputs set to `missing` by default, plus smoke coverage that blocks RP-EDITBRIEF-16 until owners supply durable evidence. It does not approve any owner input, enable external beta, real-user-media beta, paid production, Supabase persistence, uploads, providers/models, workers, render/export, or credits.

Next recommended milestone: `RP-EDITBRIEF-15B — Owner Evidence Readiness Evaluator`.

## RP-EDITBRIEF-15B — Owner Evidence Readiness Evaluator

Status: complete as an executable readiness evaluator only. The milestone adds a server-side evaluator and smoke coverage for the RP-EDITBRIEF-15A intake record. It requires the exact ten owner inputs, blocks missing/rejected/duplicate/unsupported entries, and requires owner, evidence reference, reviewed timestamp, and notes for every approved or waived input. Completing the evidence intake can make `readyForRpEditBrief16` true, but it does not enable external beta, real-user-media beta, paid production, live Supabase persistence, uploads, providers/models, workers, render/export, or credits.

Next recommended milestone: `RP-EDITBRIEF-15C — Owner Evidence Review Packet`.

## RP-EDITBRIEF-15C — Owner Evidence Review Packet

Status: complete as an owner assignment packet only. The milestone names the exact owner group, decision, and minimum evidence required for each of the ten RP-EDITBRIEF-15 inputs. The checked-in intake remains missing, and RP-EDITBRIEF-16 remains blocked until real owner evidence is recorded and RP-EDITBRIEF-15B evaluates it as ready.

Next recommended milestone: `RP-EDITBRIEF-15D — Owner Evidence Local Validation`.

## RP-EDITBRIEF-15D — Owner Evidence Local Validation

Status: complete as an operator-safe local validation command only. The milestone adds `check:project-edit-brief-owner-evidence-readiness` and a safety scan for owner evidence files. The default checked-in template runs in allow-blocked mode; a local filled evidence file can be tested in strict mode before a reviewed PR. The command rejects secret-like evidence, signed URL-like evidence, raw prompt-like evidence, and private/media artifact-like evidence.

Next recommended milestone: `RP-EDITBRIEF-15E — Owner Evidence PR Diff Validation`.

## RP-EDITBRIEF-15E — Owner Evidence PR Diff Validation

Status: complete as a source-control hygiene validator only. The milestone adds `check:project-edit-brief-owner-evidence-pr-diff` and a strict mode for the future owner-evidence PR. Strict mode requires the staged diff to update only `docs/project-edit-brief-owner-evidence-intake-template.json`, the readiness evaluator to pass, and the evidence safety scan to pass.

Next recommended milestone: `RP-EDITBRIEF-15F — Owner Evidence Schema Validation`.

## RP-EDITBRIEF-15F — Owner Evidence Schema Validation

Status: complete as strict schema validation only. The milestone adds `parseProjectEditBriefOwnerEvidenceIntake` so malformed intake JSON fails before readiness, safety, or PR-diff validation runs. The checked-in template is schema-valid but remains readiness-blocked because owner evidence is still missing.

Next recommended milestone: `RP-EDITBRIEF-15G — Owner Evidence Example Generator`.

## RP-EDITBRIEF-15G — Owner Evidence Example Generator

Status: complete as a safe local generator only. The milestone adds `generate:project-edit-brief-owner-evidence-draft` to produce a draft-to-fill intake from the review packet. The default draft remains readiness-blocked. A strict synthetic example exists only for local format testing and must not be committed as real approval.

Next recommended milestone for internal testing progress: `RP-EDITBRIEF-15H — Internal Testing Owner Acceptance`. For external beta, real-user-media beta, or paid production, the owner evidence evaluator still must report `project_edit_brief_owner_evidence_readiness_passed_ready_for_rp_editbrief_16` on real owner evidence.

## RP-EDITBRIEF-15H — Internal Testing Owner Acceptance

Status: complete as a Codex/operator internal-testing owner acceptance only. The milestone records that internal testing work must be production-shaped rather than throwaway: contract-first, backend-safe, aligned to approved-plan and credit-estimate seams, and tracked with a release delta. It allows the next Edit Brief milestone to plan internal persistence without claiming external beta, real-user-media beta, paid production, live Supabase writes, providers/models, workers, render/export, uploads, or credits.

Next recommended milestone for internal testing: `RP-EDITBRIEF-16 — Production-Shaped Internal Persistence Implementation Plan`. Public release lanes still require the RP-EDITBRIEF-15 owner evidence chain.

## RP-EDITBRIEF-16 — Production-Shaped Internal Persistence Implementation Plan

Status: complete as an executable internal persistence plan only. The milestone defines the durable roots, repository modes, route policy, idempotency/audit expectations, release delta, and blocked scope for the next backend skeleton. It keeps current Project Edit Brief routes mock/local or Supabase-disabled and does not add migrations, SQL, Supabase CLI usage, live Supabase reads/writes, Storage writes, signed URLs, provider/model calls, media processing, workers, render/export, uploads, external beta, paid production, or credit spend.

Next recommended milestone for internal testing: `RP-EDITBRIEF-17 — Internal Persistence Backend Skeleton`.

## RP-EDITBRIEF-17 — Internal Persistence Backend Skeleton

Status: complete as a backend skeleton only. The milestone adds a production-shaped internal persistence backend seam with `mock_internal` and `supabase_disabled_internal` modes, idempotency and audit envelope validation for mutating operations, partial expensive-work approval blocking, mock repository write-path evidence, and disabled Supabase fail-closed evidence. It does not enable production routes, live Supabase, Storage, signed URLs, providers/models, media processing, workers, render/export, uploads, external beta, paid production, or credit spend.

Next recommended milestone for internal testing: `RP-EDITBRIEF-18 — Internal Route Integration`.
