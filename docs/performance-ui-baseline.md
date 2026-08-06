# ReeditPro UI Performance Baseline

## Build Command

Use the arm64 Node runtime on this machine:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build
```

The default `/usr/local/bin/node` is x86_64 on this machine and can fail with `bad CPU type`.

## Current Baseline

Prompt 2 / Milestone 1 production build output:

- CSS bundle: `192.79 kB` uncompressed, `29.74 kB` gzip.
- Main JavaScript bundle: `2,647.82 kB` uncompressed, `633.22 kB` gzip.
- Vite warning: one or more chunks are larger than `500 kB` after minification.

## Likely Causes

- Routes are bundled eagerly.
- The chat editor imports many inline planning cards and workflow panels.
- Advanced/developer planning card families are in the initial editor bundle.
- Mock planning data, source prep, edit-map, revision, export, music, and SFX flows are all present in the app bundle.
- Lucide icon usage is broad across pages and editor cards.

## Safe Future Recommendations

- Add route-level `React.lazy` and `Suspense` for app pages.
- Lazy-load the detailed timeline drawer.
- Lazy-load advanced/developer planning card families by display mode.
- Lazy-load edit-map, revision, export, music, and SFX panels after preview or explicit user action.
- Keep WebGL, ThreeJS, heavy animation libraries, and rendering-only tools out of the core bundle unless explicitly enabled and lazy-loaded.

## Milestone Boundary

This milestone documents the warning and organizes CSS. It does not add dependencies, change product logic, or perform broad code-splitting refactors.

## Prompt 3 Bundle Risk Review

### Command Used

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build
```

### Measured Output After Prompt 3

- CSS bundle: `193.60 kB` uncompressed, `29.84 kB` gzip.
- App entry JavaScript bundle: `236.28 kB` uncompressed, `75.78 kB` gzip.
- Editor route JavaScript chunk: `2,354.28 kB` uncompressed, `542.30 kB` gzip.
- Vite warning remains because `EditorPage` is larger than `500 kB` after minification.

Route-level lazy loading was added in `src/App.tsx`. This moved the large editor code out of the initial app entry and produced separate chunks for public and app routes.

### Current Known Warning

Vite still reports:

```text
(!) Some chunks are larger than 500 kB after minification.
```

The warning now points to route-level/editor payload risk rather than the base application entry.

### Most Likely Causes

- `EditorPage` imports `ChatNativeEditor`.
- `ChatNativeEditor` eagerly imports many inline planning cards.
- `ChatNativeEditor` eagerly imports footage prep, generation readiness, edit-map, revision, export, music, and SFX panels.
- `DetailedTimelineDrawer` is still imported by `EditorPage`, though it only renders when opened.
- Mock planning, regression, validation, source prep, edit map, generation, revision, export, music, and SFX data are all present in the editor route bundle.
- Lucide icon imports are broad across editor card families.

### Specific Contributors To Watch

- `src/pages/EditorPage.tsx`
- `src/components/editor/ChatNativeEditor.tsx`
- `src/components/editor/DetailedTimelineDrawer.tsx`
- `src/components/editor/music/MusicPlanChatFlow.tsx`
- `src/components/editor/sfx/SFXPlanChatFlow.tsx`
- `src/components/editor/edit-map/`
- `src/components/editor/exports/`
- `src/components/editor/revisions/`
- `src/lib/planning/`
- `src/lib/generation/`
- `src/lib/footage-prep/`

### Safe Future Steps

- Lazy-load `DetailedTimelineDrawer` behind the advanced timeline button.
- Split `ChatNativeEditor` card families by display mode and approval phase.
- Lazy-load music, SFX, export, revision, edit-map, professional QA, and generation readiness panels only after the user opens those flows.
- Keep advanced/developer card families out of Guided mode bundles when practical.
- Audit mock data and planner regression imports so route-visible demos do not pull every planning system into the editor's initial route chunk.
- Avoid manual `manualChunks` or Rolldown output tuning until route and feature-level lazy loading is exhausted.
- Keep WebGL, ThreeJS, heavy animation libraries, provider SDKs, rendering tools, and worker-only packages out of the browser bundle unless explicitly approved and lazy-loaded.

## Prompt 4 Editor Route Audit

### Baseline Before Prompt 4

- Main app entry: `236.28 kB` uncompressed, `75.78 kB` gzip.
- Editor route chunk: `2,354.28 kB` uncompressed, `542.30 kB` gzip.
- Vite warning remained because `EditorPage` was larger than `500 kB` after minification.

### Editor Import Graph Summary

`src/pages/EditorPage.tsx` imported:

- `AppShell`
- `ChatNativeEditor`
- `DetailedTimelineDrawer`

`ChatNativeEditor` eagerly imported the editor shell, setup cards, plan cards, timing cards, advanced/developer card families, footage prep workspace, edit-map review workspace, revision/export panels, and SoundSync music/SFX flows.

### Import Classification

Must stay eager:

- `ChatNativeEditor` shell through the already route-lazy editor page.
- `ChatComposer`, `ChatMessage`, `ChatThread`, `MinimalProjectHeader`.
- Demo scenario, source sequence, aspect ratio, cleanup, trim review, edit level, visual preference, planning context, compiled intent, reference DNA, timing blocker cards, progress, and preview-ready cards.
- Planner logic needed to compute the current mock plan and approval gates.

Safe lazy candidates implemented:

- `DetailedTimelineDrawer`.
- `FootagePrepWorkspace`, after source order confirmation.
- Grouped advanced/developer/detail planning cards.
- `MusicPlanChatFlow`, after the user opens music planning.
- `SFXPlanChatFlow`, after the user opens SFX planning.
- `EditReviewWorkspace`, `RevisionWorkflowPanel`, and `ExportWorkflowPanel`, after preview and edit-map open.

Careful/deferred:

- Planner computation, validation, regression, source sequence, approved snapshot, and mock plan data remain eager or shared because they are used to compute the visible Guided-mode plan state.
- The remaining oversized chunk is now shared mock-planner/runtime data, not the editor route UI shell.

### Prompt 4 Lazy Boundaries Added

- `src/pages/EditorPage.tsx`: lazy `DetailedTimelineDrawer` with a timeline fallback rendered only when the timeline is opened.
- `src/components/editor/ChatNativeEditor.tsx`: lazy boundaries for footage prep, advanced planning details, SoundSync SFX, SoundSync music, edit-map review, revision, and export panels.
- `src/components/editor/lazy/AdvancedPlanningDetails.tsx`: grouped advanced/developer/detail card renderer.

### Prompt 4 Measured Output

Production build command:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build
```

Measured output:

- CSS bundle: `195.24 kB` uncompressed, `30.08 kB` gzip.
- Main app entry: `228.67 kB` uncompressed, `73.39 kB` gzip.
- Editor route chunk: `441.54 kB` uncompressed, `96.60 kB` gzip.
- Advanced planning details chunk: `150.37 kB` uncompressed, `25.68 kB` gzip.
- Footage prep chunk: `289.38 kB` uncompressed, `59.61 kB` gzip.
- SFX plan chunk: `327.64 kB` uncompressed, `75.19 kB` gzip.
- Music plan chunk: `92.01 kB` uncompressed, `22.77 kB` gzip.
- Detailed timeline drawer chunk: `2.13 kB` uncompressed, `0.78 kB` gzip.
- Shared `mock-planner` chunk: `924.68 kB` uncompressed, `234.15 kB` gzip.

### Warning Status After Prompt 4

The `EditorPage` route is no longer above the `500 kB` warning threshold. Vite still reports a chunk warning because the shared `mock-planner` chunk is `924.68 kB` after minification.

### Safe Next Steps

- Split mock planner data and planning builders by phase if it can be done without changing approval logic.
- Keep Guided-mode plan computation stable; do not split core approval gates until tests or smaller planning APIs exist.
- Consider lazy-loading planner regression data separately from the main planning computation.
- Audit whether demo scenarios can load scenario-specific payloads instead of a single broad mock planning bundle.

## Prompt 5 Mock Planner Chunk Audit

### Baseline Before Prompt 5

- Main app entry: `228.67 kB` uncompressed, `73.39 kB` gzip.
- Editor route chunk: `441.54 kB` uncompressed, `96.60 kB` gzip.
- Shared `mock-planner` chunk: `924.68 kB` uncompressed, `234.15 kB` gzip.
- Vite warning remained because the shared mock planner chunk was larger than `500 kB`.

### Why Mock Planner Was Large

`src/lib/mock-planner.ts` exported starter data and the full `createMockEditPlan` runtime from one module. Importing it for the Guided editor also pulled in video understanding, adaptive strategy, source cleanup, trim review, timing, captions, SoundSync, visual assets, color/audio, map/dataviz, renderer, provider prompts, tool strategy, execution QA, Supabase, migration, audit, validation, and regression-related planning code.

### Classification

Must stay eager for Guided mode:

- minimal starter clips and loading labels
- lightweight scenario index/default scenario
- source sequence, frame, cleanup, trim, timing, credit, and approval summaries
- PlanReviewApprovalCard inputs

Safe to split or lazy-load:

- full mock planner implementation
- full validation and regression
- non-default demo scenario payloads
- advanced/developer planning diagnostics
- provider/tool/render/migration/Supabase/planning-system audit details

Needs careful handling:

- the full approval gates still need to run before mock progress starts
- PlanReviewApprovalCard must stay fast and approval-focused
- type-only imports should remain type-only
- compatibility exports should remain until legacy callers are migrated

### Split Implemented

- `src/lib/mock-planner.ts` is now a compatibility facade.
- `src/lib/mock-planner/default-data.ts` holds lightweight starter data.
- `src/lib/mock-planner/guided.ts` creates the Guided-mode plan and lightweight validation/regression placeholders.
- `src/lib/mock-planner/full.ts` holds the previous full planner behind lazy boundaries.
- `src/lib/mock-planner/full-loader.ts` dynamically imports the full planner.
- `src/lib/demo-scenario-index.ts` holds a lightweight selector/default starter scenario.
- `src/lib/demo-scenario-loaders.ts` lazy-loads full scenario data for non-default scenario selection.
- `AdvancedPlanningDetails` loads the full planner, validation, and regression only when advanced details become visible.
- `handleApprove` loads the full planner before approval gates, so mock progress still starts only after full approval checks pass.

### Prompt 5 Measured Output

Production build command:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build
```

Measured output:

- CSS bundle: `195.30 kB` uncompressed, `30.09 kB` gzip.
- Main app entry: `227.68 kB` uncompressed, `73.14 kB` gzip.
- Editor route chunk: `297.23 kB` uncompressed, `70.01 kB` gzip.
- Compatibility `mock-planner` facade chunk: `0.02 kB` uncompressed, `0.04 kB` gzip.
- Full mock planner lazy chunk: `861.26 kB` uncompressed, `216.98 kB` gzip.
- Planner validation lazy chunk: `154.30 kB` uncompressed, `32.27 kB` gzip.
- Planner regression lazy chunk: `22.55 kB` uncompressed, `4.56 kB` gzip.
- Demo scenarios lazy chunk: `12.99 kB` uncompressed, `3.89 kB` gzip.
- Advanced planning details chunk: `152.39 kB` uncompressed, `26.51 kB` gzip.
- Footage prep chunk: `289.46 kB` uncompressed, `59.65 kB` gzip.
- SFX plan chunk: `327.64 kB` uncompressed, `75.20 kB` gzip.

### Warning Status After Prompt 5

The previous shared `mock-planner` startup/editor chunk dropped from `924.68 kB` to a `0.02 kB` facade. The editor route dropped from `441.54 kB` to `297.23 kB`.

Vite still reports a chunk warning because the on-demand full planner chunk is `861.26 kB` after minification. That payload is no longer part of the default Guided editor startup path; it loads for advanced diagnostics or immediately before approval gates.

### Remaining Safe Split Plan

- Split `src/lib/mock-planner/full.ts` into approval-core and advanced-diagnostics builders.
- Keep approval-core limited to frame, cleanup, trim, timing validation, credit estimate, and approved snapshot fields.
- Move provider prompts, tool strategy, render strategy, migration/Supabase, planning-system audit, regression-only details, and execution graph diagnostics behind advanced-only loaders.
- Consider a separate regression planner path so approval does not import every regression/demo diagnostic.
- Keep `createMockEditPlan` compatibility until callers are migrated to explicit approval and advanced mock planner APIs.

## Prompt 6 Full Planner Split Audit

### Baseline Before Prompt 6

- Main app entry: `227.68 kB` uncompressed, `73.14 kB` gzip.
- Editor route chunk: `297.23 kB` uncompressed, `70.01 kB` gzip.
- Compatibility `mock-planner` facade chunk: `0.02 kB` uncompressed.
- Full planner lazy chunk: `861.26 kB` uncompressed, `216.98 kB` gzip.
- Planner validation lazy chunk: `154.30 kB` uncompressed, `32.27 kB` gzip.
- Planner regression lazy chunk: `22.55 kB` uncompressed, `4.56 kB` gzip.
- Vite warning remained because the on-demand full planner chunk was larger than `500 kB`.

### Full Planner Import Audit

`src/lib/mock-planner/full.ts` directly imported the full planning stack: audio pipeline, aspect-ratio frame planning, caption/visual cue timing, character consistency, color pipeline, credit estimator, depth-aware overlays, data visualization, documentary fact safety, agent QA fallback, editing-agent execution, async asset reconciliation, segment operations, edit QA, frame layouts, intent compiler, map animation, master timing, planning-system audit, prompt builders, renderer planning, render strategy, speaker/visual layout, adaptive edit strategy, migration review, Supabase schema/migration/readiness, timing validation, tool registry, tool strategy, source sequence, source cleanup, SoundSync transition timing, story asset planning, trim review, video understanding, and workflow profiles.

Approval-critical imports:

- frame confirmation and source sequence summaries
- source cleanup and trim review gate fields
- Master Timing, SoundSync transition timing, and timing validation gate fields
- credit estimate summary and approved snapshot compatibility fields

Advanced diagnostics only:

- provider prompt previews
- tool registry and tool strategy detail
- render strategy and renderer composition detail
- segment operation detail
- color/audio/map/dataviz detail
- character consistency and documentary fact-safety detail
- execution graph, async reconciliation, and agent QA fallback detail
- migration/Supabase/readiness detail
- planning-system audit detail
- planner regression and full validation reports

Type-only imports:

- `EditPlan`, `PlannerInput`, and related shape imports from `src/types/reeditpro` are type-only and remain `import type`.

### Prompt 6 Split Implemented

- `src/lib/mock-planner/approval-core.ts` now owns the approval-critical Guided plan creation and approval gate checks.
- `ChatNativeEditor` approval now loads `loadApprovalPlanner()` and does not import full advanced diagnostics before starting mock progress.
- `src/lib/mock-planner/advanced-diagnostics.ts` builds an advanced diagnostic plan through domain-level dynamic imports instead of one monolithic full planner chunk.
- `src/lib/mock-planner/full-loader.ts` now exposes approval and advanced loaders without dynamically importing `src/lib/mock-planner/full.ts`.
- The compatibility facade `src/lib/mock-planner.ts` now points `createMockEditPlan` to the approval-core plan for lightweight callers.
- `src/lib/mock-planner/full.ts` is retained as a legacy source file but is no longer imported by current frontend build paths.

### Prompt 6 Measured Output

Production build command:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build
```

Measured output:

- CSS bundle: `195.30 kB` uncompressed, `30.09 kB` gzip.
- Main app entry: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `266.30 kB` uncompressed, `61.31 kB` gzip.
- Approval-core chunk: `1.90 kB` uncompressed, `0.80 kB` gzip.
- Full-loader chunk: `0.92 kB` uncompressed, `0.45 kB` gzip.
- Advanced diagnostics orchestrator: `8.45 kB` uncompressed, `2.06 kB` gzip.
- Advanced planning details chunk: `152.38 kB` uncompressed, `26.51 kB` gzip.
- Planner validation chunk: `154.36 kB` uncompressed, `32.29 kB` gzip.
- Planner regression chunk: `22.51 kB` uncompressed, `4.54 kB` gzip.
- Largest remaining route/workflow chunks: `SFXPlanChatFlow` at `327.64 kB`, `footage-prep` at `289.43 kB`, `EditorPage` at `266.30 kB`.
- Largest advanced domain chunks: `edit-qa-planner` at `72.71 kB`, `guided` at `65.79 kB`, `prompt-builders` at `58.08 kB`, `tool-registry` at `55.13 kB`, `planning-system-audit` at `47.12 kB`.

### Warning Status After Prompt 6

The `861.26 kB` full planner chunk is no longer emitted by the current build. No Vite `>500 kB` chunk warning remains.

### Next Safe Split Candidates

- SFX plan flow (`327.64 kB`) if future audio/SFX milestones need a smaller editor workflow payload.
- Footage prep (`289.43 kB`) if source-library, cleanup review, edit brief, and edit cues can be split by visible panel.
- Advanced planning cards (`152.38 kB`) if detailed/developer mode grows further.
- Planner validation (`154.36 kB`) only if approval starts requiring a subset of validation; current size is acceptable.

## Prompt 7 Performance Check

Prompt 7 focused on app shell sizing and structured chat message architecture. It did not add dependencies and did not reintroduce the old full-planner chunk.

Production build command:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build
```

Measured output:

- CSS bundle: `198.47 kB` uncompressed, `30.72 kB` gzip.
- Main app entry: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `269.94 kB` uncompressed, `62.12 kB` gzip.
- Approval-core chunk: `1.90 kB` uncompressed, `0.80 kB` gzip.
- Advanced diagnostics orchestrator: `8.45 kB` uncompressed, `2.06 kB` gzip.
- Advanced planning details chunk: `152.38 kB` uncompressed, `26.51 kB` gzip.
- Planner validation chunk: `154.36 kB` uncompressed, `32.29 kB` gzip.
- Largest remaining lazy chunks: `SFXPlanChatFlow` at `327.64 kB`, `footage-prep` at `289.43 kB`, `EditorPage` at `269.94 kB`.

### Warning Status After Prompt 7

No Vite `>500 kB` chunk warning remains.

### Prompt 7 Notes

- The editor route increased slightly from Prompt 6 (`266.30 kB` to `269.94 kB`) because structured chat message props and partial message migration live in the editor route.
- The old `861.26 kB` full planner chunk remains absent from emitted build output.
- No bundle regression requires immediate splitting.

### Next Safe Split Candidates

- Continue SFX plan flow splitting if Prompt 8 or later revisits audio/SFX planning.
- Split footage-prep by visible workspace panels if source-library and clean-assembly surfaces grow.
- Complete structured message migration without pulling advanced diagnostics into the editor startup path.

## Prompt 8 Performance Check

Prompt 8 completed the main chat renderer migration with lightweight message builders and renderer/list components. The renderer layer does not import planner modules, advanced diagnostics, SFX, music, footage prep, or other lazy workflow chunks.

Production build command:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build
```

Measured output:

- CSS bundle: `198.59 kB` uncompressed, `30.75 kB` gzip.
- Main app entry: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `273.77 kB` uncompressed, `63.14 kB` gzip.
- Approval-core chunk: `1.90 kB` uncompressed, `0.80 kB` gzip.
- Advanced diagnostics orchestrator: `8.45 kB` uncompressed, `2.06 kB` gzip.
- Advanced planning details chunk: `152.38 kB` uncompressed, `26.51 kB` gzip.
- Planner validation chunk: `154.36 kB` uncompressed, `32.29 kB` gzip.
- Largest remaining lazy chunks: `SFXPlanChatFlow` at `328.57 kB`, `footage-prep` at `289.43 kB`, `EditorPage` at `273.77 kB`.

### Warning Status After Prompt 8

No Vite `>500 kB` chunk warning remains.

### Prompt 8 Notes

- The editor route increased from Prompt 7 (`269.94 kB` to `273.77 kB`) because message builders, the renderer/list layer, and the fuller descriptor migration now live in the editor route.
- The main app entry remained unchanged at `227.63 kB`.
- The old `861.26 kB` full planner chunk remains absent from emitted build output.
- SFX and music workflows remain lazy and are not imported by the chat renderer.

### Next Safe Split Candidates

- Split SFX planning by visible sub-sections if future audio/SFX work expands the current `328.57 kB` lazy chunk.
- Split footage prep by source library, cleanup review, edit brief, and cue panels if that workflow grows.
- Convert JSX card slots into backend-fed typed payloads without importing heavy card families into the generic renderer.

## Prompt 8 Editor Visual Reset Performance Check

The editor visual reset changed shell/layout CSS, `AppShell` chrome behavior, and editor message ordering. It did not add dependencies and did not import advanced planner, SFX, music, or footage-prep modules into the default renderer path.

Production build command:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build
```

Measured output:

- CSS bundle: `204.14 kB` uncompressed, `31.51 kB` gzip.
- Main app entry: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `276.45 kB` uncompressed, `63.91 kB` gzip.
- Approval-core chunk: `1.90 kB` uncompressed, `0.80 kB` gzip.
- Advanced diagnostics orchestrator: `8.45 kB` uncompressed, `2.06 kB` gzip.
- Advanced planning details chunk: `152.38 kB` uncompressed, `26.51 kB` gzip.
- Planner validation chunk: `154.36 kB` uncompressed, `32.29 kB` gzip.
- Largest remaining lazy chunks: `SFXPlanChatFlow` at `328.57 kB`, `footage-prep` at `289.45 kB`, `EditorPage` at `276.45 kB`.

### Warning Status After Editor Visual Reset

No Vite `>500 kB` chunk warning remains.

### Notes

- Main app size stayed stable.
- The editor route increased from the chat renderer pass (`273.77 kB` to `276.45 kB`) because the editor chrome mode, utility strip, and canvas/composer layout styles now live in the editor route/CSS path.
- The old full planner chunk remains absent from emitted build output.

## Prompt 9 Performance Check

Prompt 9 polished editor interaction/card states and added reference controls. It did not add dependencies, import advanced diagnostics into Guided mode, or reintroduce the old full planner chunk.

Production build command:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build
```

Measured output:

- CSS bundle: `204.32 kB` uncompressed, `31.54 kB` gzip.
- Main app entry: `227.63 kB` uncompressed, `73.13 kB` gzip.
- Editor route chunk: `276.59 kB` uncompressed, `63.94 kB` gzip.
- Approval-core chunk: `1.90 kB` uncompressed, `0.80 kB` gzip.
- Advanced diagnostics orchestrator: `8.45 kB` uncompressed, `2.06 kB` gzip.
- Advanced planning details chunk: `152.38 kB` uncompressed, `26.51 kB` gzip.
- Planner validation chunk: `154.36 kB` uncompressed, `32.29 kB` gzip.
- Largest remaining lazy chunks: `SFXPlanChatFlow` at `328.57 kB`, `footage-prep` at `289.45 kB`, `EditorPage` at `276.59 kB`.

### Warning Status After Prompt 9

No Vite `>500 kB` chunk warning remains.

### Notes

- The editor route increased from Prompt 8 (`274.04 kB` to `276.59 kB`) due to reference controls and card polish in the editor route.
- The main app entry stayed stable.
- SFX, music, footage prep, advanced diagnostics, validation, and regression remain lazy.
- The old full planner chunk remains absent from emitted build output.

## Revised Prompt 9 Performance Check

The floating composer pass changed editor layout/CSS and did not add dependencies or import lazy advanced/SFX/music/footage-prep modules into the default editor path.

Production build command:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build
```

Measured output:

- CSS bundle: `204.77 kB` uncompressed, `31.72 kB` gzip.
- Main app entry: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `276.45 kB` uncompressed, `63.92 kB` gzip.
- Approval-core chunk: `1.90 kB` uncompressed, `0.80 kB` gzip.
- Advanced diagnostics orchestrator: `8.45 kB` uncompressed, `2.06 kB` gzip.
- Advanced planning details chunk: `152.38 kB` uncompressed, `26.51 kB` gzip.
- Planner validation chunk: `154.36 kB` uncompressed, `32.29 kB` gzip.
- Largest remaining lazy chunks: `SFXPlanChatFlow` at `328.57 kB`, `footage-prep` at `289.45 kB`, `EditorPage` at `276.45 kB`.

### Warning Status After Revised Prompt 9

No Vite `>500 kB` chunk warning remains.

### Notes

- The editor route stayed effectively flat versus Prompt 9 (`276.59 kB` to `276.45 kB`).
- Main app stayed stable.
- The old full planner chunk remains absent from emitted build output.

## Prompt 10 Performance Check

Prompt 10 added desktop QA documentation, advanced timeline drawer polish, SFX/Music disclosure grouping, and shared expanded-flow CSS. It did not add dependencies or import SFX/music/advanced modules into the default app entry.

Production build command:

```bash
PATH=/Users/macuser/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run build
```

Measured output:

- CSS bundle: `206.95 kB` uncompressed, `32.11 kB` gzip.
- Main app entry: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `276.45 kB` uncompressed, `63.92 kB` gzip.
- Detailed timeline drawer chunk: `2.45 kB` uncompressed, `0.89 kB` gzip.
- MusicPlanChatFlow chunk: `93.35 kB` uncompressed, `23.06 kB` gzip.
- SFXPlanChatFlow chunk: `328.80 kB` uncompressed, `75.44 kB` gzip.
- Footage-prep chunk: `289.45 kB` uncompressed, `59.66 kB` gzip.
- Advanced planning details chunk: `152.38 kB` uncompressed, `26.51 kB` gzip.
- Planner validation chunk: `154.36 kB` uncompressed, `32.29 kB` gzip.

### Warning Status After Prompt 10

No Vite `>500 kB` chunk warning remains.

### Notes

- Main app and editor route stayed flat versus Revised Prompt 9.
- SFX increased slightly from `328.57 kB` to `328.80 kB` because the subflow now includes disclosure grouping copy/classes, but it remains lazy and below the Vite warning threshold.
- Music remains a separate lazy chunk at `93.35 kB`.

## Prompt 11 Performance Check

Prompt 11 migrated SFX and Music/SoundSync subflows to local descriptor-list rendering, added specific SFX/Music card types, and moved the advanced timeline into the editor canvas as a lazy slot. It did not add dependencies or import SFX/Music/timeline internals into the default app entry.

### Production Build Output

- Main app chunk: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `274.62 kB` uncompressed, `63.58 kB` gzip.
- SFXPlanChatFlow chunk: `329.91 kB` uncompressed, `75.79 kB` gzip.
- MusicPlanChatFlow chunk: `94.47 kB` uncompressed, `23.32 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.66 kB` gzip.
- DetailedTimelineDrawer chunk: `2.45 kB` uncompressed, `0.89 kB` gzip.

### Warning Status After Prompt 11

- Vite `>500 kB` chunk warning: not present.
- Full planner chunk remains absent from the default editor path.
- SFX and Music remain lazy and load only after the user opens those optional flows.
- Detailed timeline remains lazy and loads only after the user asks for it.

### Regression Notes

- Editor route decreased from Prompt 10's `276.45 kB` to `274.62 kB`.
- SFX increased from `328.80 kB` to `329.91 kB` because the lazy flow now includes descriptor builders and card-slot mapping.
- Music increased from `93.35 kB` to `94.47 kB` for the same descriptor-list migration.
- The increases are confined to lazy chunks and did not recreate a Vite warning.
- The old full planner chunk remains absent from emitted build output.

## Prompt 12 E2E QA Performance Check

Prompt 12 added Playwright browser E2E tooling and sparse `data-testid` attributes. The browser dependency is dev-only and is not imported by app code.

### Production Build Output

- CSS bundle: `207.84 kB` uncompressed, `32.28 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `275.24 kB` uncompressed, `63.72 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.66 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Prompt 12

- Vite `>500 kB` chunk warning: not present.
- Playwright remains dev-only and is not bundled into the app.
- SFX, Music/SoundSync, footage prep, advanced planning details, and detailed timeline remain lazy.

### Regression Notes

- Main app stayed flat versus Prompt 11.
- Editor route changed from `274.62 kB` to `275.24 kB` due to test IDs and the shared `Card` prop passthrough.
- Lazy SFX/Music/timeline chunks changed only slightly and remain below the warning threshold.

## Prompt 13 Approval Failure + CI QA Performance Check

Prompt 13 added a guarded E2E-only approval failure flag and GitHub Actions UI QA workflow. No production dependencies were added, and Playwright remains dev-only.

### Production Build Output

- CSS bundle: `207.84 kB` uncompressed, `32.28 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `275.24 kB` uncompressed, `63.72 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.66 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Prompt 13

- Vite `>500 kB` chunk warning: not present.
- The guarded failure flag did not change reported production chunk sizes versus Prompt 12.
- The approval failure test path is E2E/dev gated and does not import providers, workers, media tooling, or Playwright into app code.

## Prompt 14 CI/Audit Performance Check

Prompt 14 updates documentation, CI artifact publishing, and test comments only. It does not add production dependencies, change runtime UI behavior, or import Playwright into app code.

### Production Build Output

- CSS bundle: `207.84 kB` uncompressed, `32.28 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `275.24 kB` uncompressed, `63.72 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.66 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Audit Exposure Status

- `@google-cloud/storage` remains a production dependency for server/storage readiness.
- The only source import found is `server/storage/gcs-storage-adapter.ts`.
- The affected GCS dependency chain is not imported by frontend route code.
- Current Vite frontend chunks do not include `@google-cloud/storage`, `gaxios`, `teeny-request`, or `retry-request`.
- Playwright remains dev-only and unbundled.

### Warning Status After Prompt 14

- Vite `>500 kB` chunk warning: not present.
- Build chunk sizes remain unchanged from Prompt 13.

## Prompt 15 GCS Boundary Performance Check

Prompt 15 adds a dependency-boundary script, report-only audit scripts, CI boundary enforcement, and backend dependency documentation. It does not change frontend UI code, app routes, lazy imports, or production dependencies.

### Production Build Output

- CSS bundle: `207.84 kB` uncompressed, `32.28 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `275.24 kB` uncompressed, `63.72 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.66 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Boundary Status

- `npm run check:frontend-boundary`: passed; scanned 469 frontend-facing files.
- `@google-cloud/storage` remains server-only.
- No frontend-facing imports of `@google-cloud/storage`, `google-auth-library`, `gaxios`, `teeny-request`, or `retry-request` are expected.

### Warning Status After Prompt 15

- Vite `>500 kB` chunk warning: not present.
- Build chunk sizes remain unchanged from Prompt 14.
- No production dependency was added.

## Prompt 16 Composer Scroll Performance Check

Prompt 16 changes editor markup/CSS for the floating composer overlay, bottom fade, and Playwright layout assertions. It does not add dependencies, change lazy imports, or import test code into the app bundle.

### Production Build Output

- CSS bundle: `208.83 kB` uncompressed, `32.57 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.11 kB` gzip.
- Editor route chunk: `275.40 kB` uncompressed, `63.73 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.66 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Prompt 16

- Vite `>500 kB` chunk warning: not present.
- Main app size stayed flat; the editor route changed only slightly for composer test IDs/layer markup.
- SFX, Music/SoundSync, footage prep, and detailed timeline remain lazy.
- No production dependency was added.

## Composer Fix Prompt 1 Performance Check

Composer Fix Prompt 1 splits the editor composer into a transparent layout wrapper and a compact surfaced input shell. It changes only editor markup/CSS, docs, screenshots, and Playwright assertions.

### Production Build Output

- CSS bundle: `209.11 kB` uncompressed, `32.62 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.13 kB` gzip.
- Editor route chunk: `275.51 kB` uncompressed, `63.76 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.66 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Composer Fix Prompt 1

- Vite `>500 kB` chunk warning: not present.
- No dependency was added.
- SFX, Music/SoundSync, footage prep, and detailed timeline remain lazy.

## Composer Correction 1B Performance Check

Composer Correction 1B changes only composer markup/CSS, docs, screenshots, and Playwright assertions. No dependencies were added and no lazy-loading boundary changed.

### Production Build Output

- CSS bundle: `209.62 kB` uncompressed, `32.72 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `275.78 kB` uncompressed, `63.81 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.66 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Composer Correction 1B

- Vite `>500 kB` chunk warning: not present.
- Main app size stayed flat.
- Editor route increased slightly for the compact composer markup/test IDs.
- SFX, Music/SoundSync, footage prep, and detailed timeline remain lazy.

## Composer Fix 1C Performance Check

Composer Fix 1C changes only composer markup/CSS, docs, screenshots, and Playwright assertions. No dependencies were added and no lazy-loading boundary changed.

### Production Build Output

- CSS bundle: `210.08 kB` uncompressed, `32.82 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `275.79 kB` uncompressed, `63.81 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.66 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Composer Fix 1C

- Vite `>500 kB` chunk warning: not present.
- Main app size stayed flat.
- Editor route changed only slightly for compact composer markup and tests.
- SFX, Music/SoundSync, footage prep, and detailed timeline remain lazy.

## Composer Fade Fix 16D Performance Check

Composer Fade Fix 16D changes only composer fade CSS, docs, screenshots, and Playwright assertions. No dependencies were added and no lazy-loading boundary changed.

### Production Build Output

- CSS bundle: `210.01 kB` uncompressed, `32.81 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `275.79 kB` uncompressed, `63.81 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.66 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Composer Fade Fix 16D

- Vite `>500 kB` chunk warning: not present.
- Main app and editor route sizes stayed flat.
- CSS size decreased slightly after replacing the rectangular fade with a smaller radial underlay.
- SFX, Music/SoundSync, footage prep, and detailed timeline remain lazy.

## Composer Occlusion Mask 16E Performance Check

Composer Occlusion Mask 16E changes only editor composer layer markup, chat/card lane CSS, docs, screenshots, and Playwright assertions. No dependencies were added and no lazy-loading boundary changed.

### Production Build Output

- CSS bundle: `210.77 kB` uncompressed, `32.91 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `275.91 kB` uncompressed, `63.81 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.65 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Composer Occlusion Mask 16E

- Vite `>500 kB` chunk warning: not present.
- Main app size stayed flat.
- Editor route increased slightly for the occlusion layer markup.
- SFX, Music/SoundSync, footage prep, and detailed timeline remain lazy.

## Card Fix Prompt 2 Performance Check

Card Fix Prompt 2 changes only editor card layout CSS, two lightweight disclosure wrappers, docs, screenshots, and Playwright assertions. No dependencies were added and no lazy-loading boundary changed.

### Production Build Output

- CSS bundle: `214.27 kB` uncompressed, `33.51 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `276.12 kB` uncompressed, `63.85 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.65 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Card Fix Prompt 2

- Vite `>500 kB` chunk warning: not present.
- Main app size stayed flat.
- Editor route changed slightly for compact card disclosure markup.
- CSS grew modestly for card width/density rules and E2E-backed responsive constraints.
- SFX, Music/SoundSync, footage prep, and detailed timeline remain lazy.

## Conversation Rhythm Prompt 3 Performance Check

Conversation Rhythm Prompt 3 changes only message grouping props, chat rhythm CSS, docs, screenshots, and Playwright assertions. No dependencies were added and no lazy-loading boundary changed.

### Production Build Output

- CSS bundle: `215.43 kB` uncompressed, `33.78 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.13 kB` gzip.
- Editor route chunk: `276.12 kB` uncompressed, `63.85 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.65 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Conversation Rhythm Prompt 3

- Vite `>500 kB` chunk warning: not present.
- Impact is small: render-time grouping attributes plus tokenized CSS only.
- SFX, Music/SoundSync, footage prep, and detailed timeline remain lazy.

## Composer Thread Mask Correction Performance Check

This correction changes only editor chat CSS, Playwright assertions, and docs. The compact composer, card components, approval flow, lazy loading, backend boundaries, and dependencies are unchanged.

Expected impact:

- CSS-only mask tokens and thread mask rules.
- No JavaScript bundle growth from app logic.
- No production dependency added.
- Vite `>500 kB` chunk warning should remain absent after validation.

### Production Build Output

- CSS bundle: `216.28 kB` uncompressed, `33.95 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.12 kB` gzip.
- Editor route chunk: `276.12 kB` uncompressed, `63.86 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.65 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Composer Thread Mask Correction

- Vite `>500 kB` chunk warning: not present.
- Runtime app logic and lazy-loading boundaries are unchanged.

## Final Editor Polish Prompt 4 Performance Check

Prompt 19 changes only small editor interaction CSS, `IconButton` title defaults, Playwright tests, docs, and screenshots. No dependencies were added, no product logic changed, and lazy-loading boundaries remain intact.

Expected impact:

- Minor CSS growth for hover/focus affordances.
- Minimal editor route JavaScript impact from the `IconButton` title default.
- No backend, provider, approval, or rendering bundle changes.
- Vite `>500 kB` chunk warning should remain absent after validation.

### Production Build Output

- CSS bundle: `219.43 kB` uncompressed, `34.30 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.11 kB` gzip.
- Editor route chunk: `276.12 kB` uncompressed, `63.85 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.65 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Final Editor Polish Prompt 4

- Vite `>500 kB` chunk warning: not present.
- CSS grew modestly for final hover/focus affordances.
- Main app, editor, SFX, Music, footage prep, and timeline chunks stayed effectively flat.

## Prompt 20 Manual Signoff Performance Check

Prompt 20 changes docs, screenshot artifact paths, and Playwright screenshot capture behavior. It does not change editor product logic, approval behavior, lazy-loading boundaries, backend behavior, or production dependencies.

Expected impact:

- No application bundle growth from product code.
- No new dependency.
- Vite `>500 kB` chunk warning should remain absent after validation.

### Production Build Output

- CSS bundle: `219.43 kB` uncompressed, `34.30 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.11 kB` gzip.
- Editor route chunk: `276.12 kB` uncompressed, `63.85 kB` gzip.
- SFXPlanChatFlow chunk: `329.93 kB` uncompressed, `75.81 kB` gzip.
- MusicPlanChatFlow chunk: `94.50 kB` uncompressed, `23.33 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.65 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Prompt 20

- Vite `>500 kB` chunk warning: not present.
- Main app, editor, SFX, Music, footage prep, and timeline chunks stayed flat because Prompt 20 did not change product UI code.
- Build emitted a Rolldown plugin timing warning, which is not a bundle-size warning or app regression.

## Prompt 21 Copy Density Performance Check

Prompt 21 changes editor strings, docs, screenshot artifact paths, and a few E2E selectors. It does not add dependencies, change layout architecture, change approval logic, or move lazy-loading boundaries.

Expected impact:

- Very small JavaScript text changes in the editor route and lazy SFX/Music chunks.
- No CSS growth expected from this copy pass.
- No production dependency added.
- Vite `>500 kB` chunk warning should remain absent after validation.

### Production Build Output

- CSS bundle: `219.43 kB` uncompressed, `34.30 kB` gzip.
- Main app chunk: `227.63 kB` uncompressed, `73.11 kB` gzip.
- Editor route chunk: `273.84 kB` uncompressed, `63.00 kB` gzip.
- SFXPlanChatFlow chunk: `329.30 kB` uncompressed, `75.63 kB` gzip.
- MusicPlanChatFlow chunk: `94.09 kB` uncompressed, `23.25 kB` gzip.
- Footage prep chunk: `289.45 kB` uncompressed, `59.66 kB` gzip.
- DetailedTimelineDrawer chunk: `2.55 kB` uncompressed, `0.91 kB` gzip.

### Warning Status After Prompt 21

- Vite `>500 kB` chunk warning: not present.
- CSS stayed flat.
- Main app stayed flat.
- Editor, SFX, and Music chunks moved slightly because only embedded copy strings changed.
- Footage prep and timeline lazy chunks remain effectively flat.
