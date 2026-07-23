# Storytelling Frontend Export Handoff — 2026-07-22

Status: `feature_owned_frontend_frozen_shared_mount_pending`

This handoff supersedes the route claims in
`MOUNTED_STORYTELLING_UI_ACCEPTANCE_2026-07-21.md`. Its earlier browser
evidence remains historical regression evidence only. The current owner
decision is ADR-012: Motion Studio Storytelling has a dedicated workflow and
Director Chat route, while ordinary Edit Videos keep the ordinary Edit Chat.

The exact source revision is the frozen commit carrying this document and is
reported with its tree hash in the one-writer handoff message. Export from
that revision by path; do not cherry-pick the Motion branch or infer all of
its ancestry.

## Canonical mount

```text
/motion-studio
  -> MotionStudioPage

/motion-studio/storytelling
  -> MotionStudioStorytellingLibraryPage

/motion-studio/storytelling/projects/:projectId/edits/:editSessionId
  -> MotionStudioStorytellingWorkspacePage
```

The workflow discriminator is exactly `motion_studio.storytelling`. Editing
category and query state are never workflow authority. Do not mount or revive
`/projects/:projectId/edits/:editSessionId/motion-studio`, `?studio=story`, or
`?category=storytelling` as Storytelling entry points.

## Exact frontend-only export set

The two page roots resolve to exactly 121 Motion-owned frontend files in this
source tree. Export them in this dependency order:

1. all 34 files under `src/types/motion-studio/**`;
2. all 34 files under `src/lib/motion-studio/**`;
3. both browser API files:
   - `src/backend/api/motion-studio-api-client.ts`
   - `src/backend/api/routes/motion-studio-api-routes.ts`
4. the 10 non-overlapping `src/hooks/useMotionStudio*.ts` files, plus the
   semantic hook merge described below for
   `src/hooks/useMotionStudioStorytellingLibrary.ts`;
5. all files under `src/components/motion-studio/**` except the ten explicitly
   excluded files below; and
6. the three page files:
   - `src/pages/MotionStudioPage.tsx`
   - `src/pages/MotionStudioStorytellingWorkspacePage.tsx`
   - `src/pages/MotionStudioStorytellingWorkspacePage.module.css`

The ten component files excluded from the active dependency graph are:

```text
src/components/motion-studio/AnimaticWorkspace.tsx
src/components/motion-studio/GeneratedMediaWorkspace.tsx
src/components/motion-studio/MotionStudioModulePicker.tsx
src/components/motion-studio/MotionStudioResourceState.tsx
src/components/motion-studio/MotionStudioShell.tsx
src/components/motion-studio/SceneEditorWorkspace.tsx
src/components/motion-studio/StorytellingLibrary.module.css
src/components/motion-studio/StorytellingLibrary.tsx
src/components/motion-studio/storytelling/StorytellingStylePlanReviewSummary.module.css
src/components/motion-studio/storytelling/StorytellingStylePlanReviewSummary.tsx
```

They include the disconnected shell/module-picker generation and the old
project-scoped launcher. Do not carry them into the canonical mount merely to
make a historical import compile.

The export intentionally contains no `server/**`, SQL, migration, queue,
lease, dispatch, provider, worker, storage, cost, billing, deployment, or
public-delivery source.

## Shared files requiring manual one-writer reconciliation

Do not copy these files from the Motion tree. Reconcile the smallest changes
onto the current canonical shared source:

- `src/App.tsx`: add the two dedicated Storytelling routes, import the three
  page exports, and remove the legacy nested-route mount;
- `src/data/productContent.ts` and `src/components/AppShell.tsx`: retain the
  canonical five destinations and correct `/motion-studio/*` active state;
- `src/pages/ProjectDetailPage.tsx`: remove the old feature launcher/imports;
- `src/pages/EditorPage.tsx`, `src/components/editor/ChatNativeEditor.tsx`,
  and `src/components/editor/MinimalProjectHeader.tsx`: keep ordinary Edit
  Chat ordinary and remove historical Motion query/category routing;
- `src/backend/api/api-route-registry.ts`: register the frontend-safe Motion
  route definitions once, without replacing the shared registry;
- `src/lib/local-project-handoff.ts`,
  `src/lib/internal-edit-state-backend-sync.ts`, and
  `server/services/internal-edit-state-service.ts`: retain the canonical
  `8dcf5e34` durable `productWorkflow` type/parser/persistence chain; this
  frontend export depends on it and must not replace it;
- `src/hooks/useMotionStudioStorytellingLibrary.ts`: this is a real semantic
  overlap with the shared workflow-separation integration and must be merged
  rather than copied; and
- `package.json`, `playwright.motion-studio.config.ts`, and the existing
  `tests/e2e/motion-studio-*.spec.ts` files: retain current shared scripts and
  update browser fixtures to the dedicated route rather than copying package
  metadata wholesale.

`src/pages/PreferencesPage.tsx`, Edit Reference, Edit Brief, Plan Review,
approval/snapshot, global tokens/CSS, project persistence, and canonical
backend clients are shared authorities. None is part of this export.

The Review surface reuses these existing shared read-only/action seams without
copying or replacing them:

```text
src/hooks/useCanonicalEditJourney.ts
src/hooks/useCanonicalPrivateReview.ts
src/components/editor/CanonicalPrivateReviewPanel.tsx
```

They keep private playback, approval, and revision decisions on the canonical
journey/receipt authority. A recorded revision refreshes the exact handoff and
returns to the dedicated Director; `revision_requested` is deliberately
editable while the previously approved snapshot remains immutable.

`MotionStudioEditRedirect` remains temporarily exported only so the
pre-reconciliation shared `App.tsx` compiles. The canonical App mount must not
register it; it can be deleted with the old shared route after reconciliation.
Likewise, `writeStorytellingWorkspaceToSearchParams(...)` remains only as a
temporary compile dependency of the old shared Chat. The dedicated page uses
`surface` solely for an already-authorized workspace subview; remove the old
`studio` query writer when the shared Chat import is reconciled.

### Exact Storytelling library hook delta

Keep the integration branch's explicit `motion_studio.storytelling`
discriminator, dedicated create/resume path, normal Edit Videos exclusion,
and corrected shared handoff parsing. Apply only this Motion-owned behavior
after the existing canonical Project + Named Edit handoff has been durably
created:

1. call `motionStudioApiClient.createProduction(projectId, editSessionId, ...)`;
2. send `moduleId: "storytelling"` and the exact
   `MOTION_STUDIO_MODULE_CATALOG_VERSION`;
3. use idempotency key
   `motion-studio-storytelling-bootstrap:${createIntentId}` so recovery cannot
   create a second production;
4. project the response through `projectMotionStudioProduction(...)`;
5. require exact returned `projectId`, `editSessionId`, and
   `moduleId === "storytelling"` before browser publication/navigation; and
6. on transport, projection, or identity failure, retain the existing create
   journal for retry and open neither ordinary Edit Chat nor an unverified
   Storytelling workspace.

The delta adds only these dependencies:

```text
src/backend/api/motion-studio-api-client.ts
src/lib/motion-studio/contracts (MOTION_STUDIO_MODULE_CATALOG_VERSION)
src/lib/motion-studio/shell/shell-model.ts (projectMotionStudioProduction)
```

Do not replace the integration branch's workflow classification, project/edit
handoff creation, preference snapshot, backend persistence, access-denial, or
recovery logic with the older Motion-tree version of the hook.

Signed-in library/workspace reads must require the durable explicit
`productWorkflow === "motion_studio.storytelling"` field and then re-read an
exact matching Storytelling production tuple before rendering the workspace.
That durable field is a hard source dependency on the canonical shared UI
integration beginning at `8dcf5e34`/`a2886858`; it is typed, parsed, persisted,
and route-checked there. This bounded Motion export deliberately does not
duplicate those shared handoff/parser/service changes and is not standalone
signed-in evidence without that dependency.

The feature-owned library adapter re-reads the exact production for every
possible signed-in Motion entry and publishes only records for which both
authorities agree. A production with a missing workflow discriminator, a
workflow with a missing production, explicit `video_edit`, cross-project or
cross-edit tuples, malformed production responses, and unavailable reads all
fail closed; an unverifiable candidate is never converted into an empty-state
claim. The dedicated workspace also performs the production read before its
final dual-authority classification, so category/query/legacy state cannot
short-circuit signed-in verification.

The historical `storytelling-edit-*` prefix is accepted only by the explicit
`local_test` migration boundary; it is false by default and is never signed-in
browser authority.

## Browser acceptance after the shared mount

The feature commit itself is build/type/smoke verified but is not claimed as
mounted browser acceptance. The combined source must prove:

- sidebar order Home, Projects, Edit Videos, Motion Studio, Edit Preferences;
- Motion Studio landing exposes Storytelling only;
- library empty/loading/retry/denied/create/recovery/resume states;
- create and resume enter the exact dedicated route and production tuple;
- Director Chat is default and ordinary Edit Chat is not mounted;
- category-only, query-only, explicit `video_edit`, and historical-route
  promotion all fail closed;
- direct entry/reload, Storytelling-library Back, explicit parent-Project
  link, and predictable browser history;
- Chat, Story, Scenes, Preview, Review and advanced More workspaces in one
  compact top switcher with no Edit Preferences control in that header;
- keyboard/focus/menu behavior, semantic status/live regions, reduced
  motion, 44px targets, long-content wrapping, and no horizontal overflow at
  375, 768, 1024, and 1440 CSS pixels;
- no duplicate Chat, Brief, Preferences, Plan Review, approval, persistence,
  queue, provider, timeline, cost, or billing authority; and
- no generation, render, provider request, credit mutation, or production
  claim from idea capture or navigation alone.
