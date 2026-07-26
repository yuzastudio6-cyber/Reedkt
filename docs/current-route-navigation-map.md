# Current Route And Navigation Map

Status: `audited_current_branch`
Status date: 2026-07-22

## Active Router

| Route | Component | Navigation visibility | Current role |
| --- | --- | --- | --- |
| `/` | `LandingPage` | Marketing entry | Public product entry |
| `/dashboard` | `DashboardPage` | Sidebar: Home | Start/continue the private project-edit flow after exact scoped recovery is resolved |
| `/projects` | `ProjectsPage` | Sidebar: Projects | Open project containers across normal Edit and Motion Studio workflows with explicit loading/local-only/unavailable/denied/invalid recovery states |
| `/edit-videos` | `EditVideosPage` | Sidebar: Edit Videos | Open the normal named-video-edit library; Motion Studio Storytelling records are excluded by explicit product-workflow identity |
| `/projects/new` | `CreateProjectPage` | CTA-driven | Create a duplicate-safe project shell from a unique create intent |
| `/projects/:projectId` | `ProjectDetailPage` | Entered from Projects | Recover the exact project, list/create named edits, and expose an accessible New Edit dialog |
| `/projects/:projectId/edits/:editSessionId` | `EditorPage` | Entered from project edit list | Resolve exact scoped edit state before opening the primary focused workspace; `?view=preferences` addresses that edit's Current Edit Preferences workspace |
| `/editor` | `EditorPage` | Not primary sidebar | Compatibility/internal entry |
| `/preferences` | `PreferencesPage` | Sidebar and page say `Edit Preferences`; route/code names remain technical | Draft-preserving Saved Edit Preferences with authenticated private-internal per-user/workspace persistence; no Supabase/RLS/staging/production claim |

## Redirected Or Retired Routes

| Route | Redirect | Scope finding |
| --- | --- | --- |
| `/edit-preferences` | `/preferences` | Old alias |
| `/settings` | `/preferences` | Old alias |
| `/wallet` | `/preferences` | Standalone Wallet retired from current UI |
| `/pricing` | `/projects` | Standalone pricing retired from current UI |
| `/brand-kit` | `/preferences` | Brand Kit retired from current UI |
| `/exports` | `/projects` | Standalone export queue retired; export remains contextual |
| `/app` | `/dashboard` | Old shell alias |
| `/upload` | `/projects/new` | Upload moved into named edit workspace |
| `*` | `/` | Fallback |

## Sidebar Truth

The backend line currently renders these required core entries:

1. Home
2. Projects
3. Edit Videos
4. Edit Preferences (route/code names may remain `preferences`)

These entries are required, not an exact-four-items invariant. The canonical combined-source target also retains the existing Motion Studio destination between Edit Videos and Edit Preferences: Home, Projects, Edit Videos, Motion Studio, Edit Preferences. Integration must not delete or replace Motion Studio. Historical `design.md` navigation for AI Editor, Media Library, Templates, Team, Analytics, Exports, Brand Kit, and Settings is not current product navigation.

`Preferences` is not a separate product from `Edit Preferences`. `/preferences` is the technical route for the one Edit Preferences system.

## Project Navigation Truth

Current implemented hierarchy:

```text
Projects (`/projects`, project-container library)
├── Project
│   └── Normal Named Edit (`video_edit`)
│       ├── Chat (default normal Edit Chat)
│       ├── Edit Brief (`?view=brief`, full main workspace)
│       └── Edit Preferences (`?view=preferences`)
└── Motion Studio production (`motion_studio.storytelling`, combined source)

Edit Videos (`/edit-videos`, normal named-edit library)
└── Normal Named Edit → `/projects/:projectId/edits/:editSessionId`
```

Storytelling is a valid content category for normal Edit Chat. It never selects Motion Studio. Only explicit product-workflow identity selects the Motion Studio library and dedicated Storytelling workspace/chat; retained legacy Motion records use their exact namespaced identity during migration.

Current workspace behavior:

- Compact editor status header.
- Exact named-edit recovery gate: the editor mounts only after the scoped local or reviewed-backend handoff matches the current user, workspace, project, and edit address. Backend recovery is saved before first editor mount; missing, denied, mismatched, and retryable unavailable states do not expose an empty editor.
- Upload/source preparation gate. Initial upload and validation failures remain visible in this gate as actionable alerts and reset on the next attempt/success without starting planning, credits, editing, or generation.
- Chat as primary surface.
- After Footage Prep, the compact `Edit Brief` workspace option opens `?view=brief` and reports Optional/Draft/Ready. It replaces Chat and the secondary rail with the full source-preview/timeline canvas while preserving the exact edit identity. Marker entry is a playhead-anchored plain-language popover with advanced metadata collapsed. Opening is non-mutating; full structured state persists with the exact edit, restores after reload, transfers into Planning Context, and freezes in the approved plan snapshot. Meaningful changes invalidate stale plan/approval state, while approved/private-review work exposes a read-only Brief and routes changes through Chat/replanning.
- The compact workspace switcher opens the exact edit's Current Edit Preferences at `?view=preferences`. It shows the immutable creation baseline, effective values, and per-edit overrides; explicit apply/reset actions persist to the exact edit and protect dirty drafts during navigation.
- Applying any of the seven implemented current-edit fields requires a fresh plan and estimate when a draft exists. Cleanup changes rerun Footage Prep, and target-platform changes reconfirm the output frame.
- Approved/private-review work makes Current Edit Preferences read-only. Changes to approved work return to Chat and enter the revision/replanning flow without mutating the approved snapshot or reservation trace.
- Plan review and credit approval.
- Progress/private review/revision/export-related contextual flows.
- The active named edit omits default Timeline, SFX, Music, and advanced-planning entry cards. Their existing implementations remain isolated to compatibility/internal flows until a contextual access pattern is approved.

The workspace does not introduce three new top-level routes. Chat remains the default named-edit surface; `?view=brief` and `?view=preferences` address focused workspaces inside the same named-edit identity. `/preferences` continues to own Saved Edit Preferences for future edits. The exact edit owns its Brief state, immutable preference creation baseline, effective values, override keys, and preference revision through the existing scoped handoff record. The approved snapshot owns the immutable Brief and preference application evidence used after approval.

## Internal Diagnostic Location

`Safety boundary`, `Internal testing details`, `Testing connection`, Supabase/API readiness, and route-readiness content are not mounted by `/dashboard` and are absent from normal Edit Preferences. `PreferencesPage` renders the internal disclosure only in development or E2E when the explicit `?internalTesting=1` query is present. The earlier diagnostic screenshot is therefore an explicitly gated internal-testing state, an older branch, or a mislabeled screenshot—not current Home route output.

Full diagnostics must remain environment/query-gated and absent from normal navigation. Normal Home and Edit Preferences may show only compact actionable connection errors when user work is affected.

Current runtime boundaries do not add navigation:

- `/editor` remains the explicit compatibility/internal demo exception to named-route recovery; it may mount the populated demo workspace without a project/edit handoff.
- Authenticated private-internal Edit Preferences persistence remains a single-host capability, not a Supabase/RLS or production route claim.
- Project/edit browser and backend tenancy V2 has passed focused, Playwright, and aggregate private-pipeline validation for local/private use; a real mounted Supabase revocation test and reviewed RLS/staging remain blocked.
- Conditionally executable fixed-template Playwright capture remains an approved internal tool operation with server-owned snapshot attestation, zero network/JavaScript, deterministic PNG verification, FFmpeg composition, no billing, and no private-path exposure. It is not a browser-capture page or sidebar item.
- The guarded `npm run dev:private-workspace` launcher adds a local manual-testing runtime, not a route or navigation item. It keeps API, browser app, uploads, and artifacts on loopback with external services disabled.

## Browser Suite Collection Truth

The standard mock-only Playwright suite covers the active router above. It intentionally excludes historical `project-edit-brief-*.spec.ts` files and `project-source-video-brief-playback.spec.ts` that target the retired `ProjectHomePage` and standalone `/brief` route. The current `?view=brief` state stays on the canonical exact-edit route and must not revive that second product path.

The active Edit Brief lifecycle remains covered through `editor.spec.ts`: prompt-first planning without a Brief, optional Brief entry after Footage Prep, exact-edit persistence, planning transfer, approval locking, revision behavior, and private-review handoff. Backend Edit Brief authority, marker, attachment-metadata, QA, and plan-hint contracts continue through their server smoke suites without remounting retired UI.

On 2026-07-13 the full active-product suite completed with 143 passed, 7 explicitly gated/skipped, and 0 failed. This is local/mock browser evidence only; it does not activate providers, Supabase, billing, public rendering, deployment, or production readiness.

## Immediate Navigation Recommendation

Retain the active route/navigation set exactly as implemented. Do not restore historical routes because files or old docs mention them.

Keep Current Edit Preferences inside the named-edit identity at `?view=preferences`; do not create a disconnected top-level current-preference route. Saved Edit Preferences remain the source copied into new-edit baselines, while the exact-edit destination clearly shows original versus overridden values and material-change consequences.
