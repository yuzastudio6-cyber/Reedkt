# Current Product Scope

Status: `current_branch_audit_with_path_divergence_risk`
Status date: 2026-07-22

This document records the active backend integration line in `/Users/macuser/Developer/REeditpro-backend-pipeline`, branch `codex/backend-workflow-pipeline-continuation`, including the route/workflow separation verified on 2026-07-22. It does not authorize staging, provider execution, billing, deployment, or production release, and the repository path-divergence audit still applies to later source reconciliation.

## Current Product Statement

ReeditPro on this branch is a project-first, desktop/web AI video editing workflow for private internal testing. A user creates a project, creates one or more named edits inside it, uploads source video inside the focused edit workspace, optionally opens the full-space Edit Brief timeline after Footage Prep, reviews or changes that exact edit's Edit Preferences before approval, gives direction in chat, reviews a plan and credit estimate, approves the plan, and reviews a private result or revision. Public sharing, live billing, unrestricted generation, and retired dashboard modules are not current product surfaces. `Preferences` and `Edit Preferences` are one product feature; `Edit Preferences` is the required user-facing name.

## Evidence Priority

1. Current branch and dirty worktree.
2. Active router and navigation.
3. Components imported by active routes.
4. Current project, edit, approval, credit, upload, and review models.
5. Current Playwright coverage.
6. Current product/UI docs.
7. Historical pages, unused components, and older sections of `design.md`.

## Feature Matrix

| Feature | Classification | Evidence | UI implication | Action |
| --- | --- | --- | --- | --- |
| Landing page | Active; chat-first redesign implemented | `/` -> `LandingPage`, `design-system/pages/landing.md`, responsive public-site E2E and screenshots | Short product promise, authentic chat/plan/approval preview, workflow, signature systems, credit trust, use cases, and private-workspace entry | Retain as the public expression of the active product |
| Home | Active; resume-first redesign implemented | `/dashboard`, exact scoped handoff recovery, `design-system/pages/home.md`, focused E2E, first-time/returning screenshots | Returning users receive one latest-edit focal surface, state-aware action, other attention items, recent work, and a quiet Edit Preferences shortcut. First-time users receive one Create Project path without empty attention/recent containers. Recovery remains a compact truthful notice rather than internal diagnostics. | Retain and use as the first page-specific expression of the master system |
| Projects | Active; scan-and-filter redesign implemented | `/projects`, `Projects` sidebar entry, strict backend/local results, `design-system/pages/projects.md`, search/filter E2E and screenshots | Project containers may own normal video edits or Motion Studio work. Bounded project cards expose one status, compact latest-work truth, and one action; failures do not become false empty state. | Retain as the container library; do not relabel it as Edit Videos |
| Edit Videos | Active; normal named-edit library | `/edit-videos`, explicit `video_edit` workflow identity, `design-system/pages/edit-videos.md`, workflow-separation browser proof | Lists normal named video edits across projects and opens the canonical exact edit in normal Edit Chat. A normal edit may use the Storytelling content category without becoming Motion Studio work. | Retain as a separate route; exclude Motion Studio Storytelling workflow records |
| New Project | Active; focused project-first redesign implemented | `/projects/new`, unique create intent, `design-system/pages/new-project.md`, UI/tenancy E2E and screenshot | One form asks only for project name and broad editing context; same-name projects coexist and upload follows inside a named edit | Retain |
| Project detail/edit list | Active; latest-edit focal redesign and local/private tenancy V2 verified | `/projects/:projectId`, `design-system/pages/project-home.md`, authenticated project/edit contracts, focused tenancy/UI E2E, screenshots, and aggregate private-pipeline evidence | One project owns multiple named edits. The latest edit carries the state-aware next action; additional edits stay quieter. Do not infer deployed multi-user isolation. | Retain and make central to IA; keep real mounted Supabase revocation and RLS/staging blocked |
| Focused Edit workspace | Active; flagship chat-first redesign implemented with pre-mount recovery gate | `/projects/:projectId/edits/:editSessionId`, `design-system/pages/edit-workspace.md`, upload/recovery/keyboard/viewport E2E and state screenshots | Compact project strip, one current decision, wide-screen preview/status rail, floating composer, full-space Brief timeline, focused Current Edit Preferences, one Plan Review, and truthful recovery | Retain; preserve current editor identity and approval gate |
| `/editor` compatibility route | Active compatibility | Router and UI docs | Same focused workspace for older/internal links; not primary IA | Keep compatibility, de-emphasize |
| Chat | Active; clean named-edit presentation | `ChatNativeEditor`, `CleanEditSetupSurface`, `CleanPlanningPrepSurface`, clean-slate E2E | Primary editor surface; named edits show one current decision, one approval checkpoint, one processing state, and one private review instead of a card history | Retain the clean state model; legacy card harness is compatibility-only |
| Source upload/prep | Active/in progress | upload gate, footage-prep components, backend routes/smokes | Required before planning in project edits | Retain and clarify |
| Edit Brief | Active, optional, exact-edit persisted, and approval-frozen for the current private scope | `editor/edit-brief/*`, `edit-brief-persistence`, exact-edit handoff, Planning Context, approved snapshot, focused E2E/smoke | Available after Footage Prep at `?view=brief`; it owns the main workspace with source preview, professional timeline, and a playhead-anchored plain-language direction popover. Full structured fields restore on reload, transfer into planning, and deep-copy into the approved snapshot. Opening is non-mutating; meaningful changes invalidate stale plan/approval, and approved/private-review work locks mutation. | Retain one exact Brief authority; do not imply Supabase/cross-device or provider execution |
| Edit Preferences | Active saved and exact-edit scopes; calm grouped redesign implemented within the current private boundary | `/preferences`, `design-system/pages/edit-preferences.md`, preference repository, immutable new-edit baseline mapper, `CurrentEditPreferencesWorkspace`, exact-edit handoff persistence, focused E2E | One Edit Preferences system. Saved defaults and exact-edit overrides expose six real planning fields with contextual actions, dirty-leave protection, and explicit apply/reset. Edit Level is hidden and compatibility-only during private internal testing. All six visible fields replan/re-estimate; cleanup reruns Footage Prep and destination changes reconfirm the output frame. Approved work is read-only and revisions return to Chat. | Retain; do not split into separate preference products or imply production shared persistence |
| Chat / Edit Brief / Edit Preferences workspace destinations | Active inside the named edit | Compact workspace switcher, query-addressable full-space Brief and Current Edit Preferences, focused E2E | Chat remains default. Edit Brief uses `?view=brief`; Edit Preferences uses `?view=preferences`. Both remain focused states of the same exact-edit route, not disconnected products. Dirty preference drafts are guarded and direct/reload recovery preserves the exact edit. | Retain current IA and avoid duplicate Brief/preference sources of truth |
| Plan Review | Active | `PlanReviewApprovalCard`, approval core, E2E | Single approval moment. The visible estimate states that its cost basis includes the 4K UHD render/export ceiling and that one approval covers 1080p, 2K, or 4K for that same edit without a second export estimate or charge. | Retain the one-approval delivery contract; material edit changes still require a fresh plan and estimate. |
| Credit estimate/approval gate | Active mock-safe | plan card, server credit contracts, E2E | Must remain visible before work starts. Every initial edit estimate assumes the 4K UHD delivery ceiling, regardless of the later selected 1080p, 2K, or 4K export size. | Retain; no live wallet mutation or customer charging is implied. Unknown real source duration must remain approval-blocked until analysis instead of being silently under-estimated. |
| Wallet page | Stale/retired UI | `/wallet` redirects to `/preferences`; old page deleted | Must not appear in current nav/redesign | Exclude; retain credit summaries only where current flow needs them |
| Pricing page | Stale/retired UI | `/pricing` redirects to `/projects`; old page deleted | Not a current route surface | Exclude until product scope reactivates it |
| Brand Kit | Stale/retired UI | `/brand-kit` redirects to `/preferences`; old page deleted | Historical `design.md` idea only | Exclude |
| Exports page/queue | Stale as standalone route; export workflow in editor is in progress | `/exports` redirects; editor export components exist | Keep export as contextual edit workflow, not separate active nav | Retain contextual workflow only |
| Media Library | Stale as standalone product surface | no active route/nav; source library exists within editor | Do not restore a global media route from historical docs | Keep contextual source library only |
| Team/Collaboration | Planned/historical | design doc only; no active route | Do not show as active | Exclude |
| Analytics | Stale/historical | design doc only; no active route | Do not show as active | Exclude |
| Templates | Stale/historical | design doc only; no active route | Do not show as active | Exclude |
| Settings | Retired alias | `/settings` redirects to `/preferences` | The technical route opens Edit Preferences; it is not generic account settings | Keep redirect |
| SFX | Internal/compatibility after chat reset | structured SFX flow remains in the compatibility harness | No entry card in the active named-edit chat; future access must be contextual | Keep implementation isolated; do not remount by default |
| Music/SoundSync | Internal/compatibility after chat reset | structured music flow remains in the compatibility harness | No entry card in the active named-edit chat; timing/audio logic remains in the plan | Keep implementation isolated; do not remount by default |
| Advanced timeline | Internal/compatibility after chat reset | lazy drawer remains in the compatibility harness | No permanent timeline message in the active named-edit chat | Reintroduce only through a quiet contextual control |
| Advanced planning/provider/database cards | Experimental/internal; removed from active named edit | legacy card renderer and `AdvancedPlanningDetails` remain compatibility-only | Must not render in the normal named-edit conversation | Retain planner evidence, not active card UI |
| Internal testing diagnostics | Internal/experimental and gated | `PreferencesPage` renders the disclosure only in development/E2E with explicit `?internalTesting=1`; E2E opens it deliberately | Supabase/API/route readiness is absent from normal Home, normal Edit Preferences, and normal navigation. The diagnostic screenshot is not current `/dashboard`. | Keep environment/query-gated; show normal users only compact actionable service errors |
| Fixed-template browser capture | Active only as a conditional private tool operation | approved tool-work manifest, server-owned snapshot attestation, deterministic Playwright PNG smoke, FFmpeg composition evidence | No general browser, URL, HTML, JavaScript, provider, billing, or local-path UI should be exposed | Keep internal and gated |
| Real provider/render/billing execution | In progress and evidence-gated | backend readiness code and smoke scripts | UI must not claim unrestricted production readiness | Keep gated |
| Native mobile app | Planned future | product docs; explicitly out of current phase | No native mobile IA now | Exclude |

## Current Main Flow

1. Open Home, Projects, or Edit Videos.
2. Create a project.
3. Open the project.
4. Create a named edit; saved edit preferences are snapshotted.
5. Open the edit workspace.
6. Upload source media.
7. Confirm one setup decision at a time: source context, frame, cleanup, and visual direction. Internal capability depth is policy-selected and has no user-facing Edit Level.
8. Optionally attach a reference, prepare the source, and open the top `Edit Brief` workspace to add full-timeline direction.
9. Optionally open the exact edit's `Edit Preferences` destination to review inherited values or apply pre-approval overrides.
10. Give or refine edit direction in chat, then review the single plan and credit checkpoint.
11. Approve plan and credits.
12. Run the currently gated/private edit workflow.
13. Review privately, request changes through Chat, or accept the result.

## Current Navigation

- Home
- Projects
- Edit Videos
- Motion Studio
- Edit Preferences

`Projects` routes to `/projects`, where a user creates or opens a project container. `Edit Videos` routes to `/edit-videos`, where a user resumes normal named video edits and enters the existing `/projects/:projectId/edits/:editSessionId` Edit Chat. `Motion Studio` routes to `/motion-studio` and remains a separate product workflow rather than replacing Projects or normal Edit Videos.

Motion Studio Storytelling is not a mode of normal Edit Chat. Content category (`storytelling`, documentary, tutorial, and so on) must not choose the product workspace. The explicit product-workflow authority distinguishes normal `video_edit` work from `motion_studio.storytelling` work; each keeps its own library, chat language, and workflow while sharing project identity only where intended.

## Scope Decisions Needed

1. The current Edit Brief presentation is resolved for this branch: the top workspace option opens the full main canvas at `?view=brief`; source preview and timeline dominate, and marker entry is a prompt-first popover. A standalone `/brief` route, drawer, permanent form inspector, or second editable Brief remains prohibited.
2. Should credit history become a future standalone Wallet again, or remain contextual during external beta?
3. Which additional professional editing preferences, beyond the six user-editable fields, should enter the next typed/persisted/planning-tested milestone?
4. What production database, tenancy, history, and concurrency model should eventually replace the current private exact-edit handoff boundary?

## Current Persistence And Execution Boundaries

- Saved Edit Preferences is authenticated and private-internal: one host, per user/workspace, live membership/role authorization, checksums, atomic replacement, compare-and-swap, and authorization-before-idempotency. It is not a Supabase table/RLS/staging/production capability. Current edits receive an immutable point-in-time creation baseline; later saved-default changes do not silently update existing edits. Exact-edit overrides, override keys, and a current preference revision persist through the existing scoped edit handoff. Applying a changed preference invalidates a draft plan/estimate; cleanup and target-platform changes also reset their dependent preparation/frame gates. Approved work is read-only in the form and must be revised through Chat.
- Edit Brief is exact-edit durable through that same reviewed local/private handoff boundary. All current structured fields transfer into Planning Context and are deep-copied into the approved plan snapshot; approved/private-review state locks the Brief and routes changes through Chat/replanning. This is not a Supabase table/RLS, cross-device, provider, worker, render, or credit-execution capability.
- Project/edit browser and backend tenancy V2 is verified for the local/private boundary, including collision-safe scoped caches, explicit invalidation, owner validation, and stale-write CAS. It is not deployed multi-user evidence; real mounted Supabase revocation and reviewed RLS/staging remain blocked.
- Fixed-template Playwright capture is conditionally executable only inside the approved private tool-work path. It reloads a server-owned approved snapshot, disables JavaScript and network, verifies deterministic PNG output, composes through FFmpeg, strips local paths from browser responses, and creates no billing event.

## Repository Risk

The repo audits record `path_divergence_risk` between `/Volumes/backup/REeditpro` and `/Users/macuser/Developer/REeditpro`. This branch also has a very large dirty worktree. This document describes only the active `/Volumes/backup/REeditpro` checkout and must not be treated as proof that historical-path-only work is merged.

## Audit Validation Snapshot

Validation run on 2026-07-10 with the current arm64 Node environment:

- `npm run check:frontend-boundary`: passed for 851 files.
- `npx tsc --noEmit`: passed.
- Targeted lint for every redesigned frontend route, editor component, and UI test: passed. Whole-worktree lint is currently blocked by the unrelated `no-control-regex` error in `server/tool-execution/node-runners/offline-node-runner-security.ts:367`.
- `npm run build`: passed.
- `npm run smoke:planning-input-safety`: passed, including full Edit Brief handoff, Planning Context transfer, and approved-snapshot freeze.
- `npm run smoke:edit-preference-persistence`: passed.
- Focused Saved and Current Edit Preferences coverage, editor keyboard/clean-state coverage, public-site UI coverage, and Projects UI coverage: passed.
- Active-route viewport/zoom/public/project UI group: 68 passed.
- `npm run test:e2e -- --workers=5`: 129 passed after the end-to-end active-product redesign.
- `npm run typecheck:server`: blocked by the unrelated untracked `server/services/private-edit-authority-store.ts:514` union access (`AuthorityApprovedSnapshotManifest` has no `id`). The Edit Brief and Edit Preferences UI slice does not touch or suppress that backend error.

The frontend build also retained existing warnings:

- `internal-edit-state-backend-sync.ts` is both statically and dynamically imported, so the dynamic import does not create a separate chunk.
- CSS post-processing dominates build-plugin time.
- Large current chunks include the editor, mock API router, footage preparation, and advanced planning families. These are existing performance risks, not regressions from this documentation-only task.
