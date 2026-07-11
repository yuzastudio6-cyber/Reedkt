# UI/UX Redesign Current Input

Status: `scope_review_complete_superseded_as_implementation_plan`

Implementation authority now lives in `docs/ui-ux-active-product-redesign-plan.md`. This file remains the audited input that explains how the current active product differs from historical `design.md` scope.

## Product To Redesign

The redesign target is the current project-first ReeditPro application:

```text
Landing
Home
Projects
Create Project
Project / Edit List
Focused Named Edit Workspace
Preferences
```

It is not the older all-in-one SaaS suite described in historical sections of `design.md`.

## Current User Journey

```text
Home / Projects
→ Create project
→ Open project
→ Create named edit
→ Upload source media in the edit
→ Prepare sources
→ Optionally add Edit Brief
→ Give direction in chat
→ Review plan + credits
→ Approve
→ Private progress/review
→ Revise or accept
```

## Current Workspace Inputs

### Chat

Active and primary. It owns user direction, structured messages, required questions, plan review, approval, progress, preview/review, revisions, and contextual advanced flows.

### Edit Brief

Active but currently optional and inline. It includes goal, audience, platform, target duration, style keywords, pacing, captions, music, b-roll, asset rules, notes, brand notes, and special instructions.

### Edit Preferences

Active globally at `/preferences`. Defaults include edit level, workflow, cleanup, visual direction, mood, credit posture, and target platform. Defaults are snapshotted when a new edit is created; existing edits retain their snapshot.

### Three-Tab Proposal

The requested `Chat / Edit Brief / Edit Preferences` workspace is not yet implemented. Recommended product interpretation for review:

- `Chat`: primary and default.
- `Edit Brief`: per-edit structured direction; a first-class sibling surface is reasonable.
- `Edit Preferences`: show the current edit's snapshotted defaults and permitted project overrides, while linking to global defaults. It must not silently mutate existing approved plans.

Any brief/preference change that affects scope, frame, timing, tools, or credits must invalidate approval and require replanning according to existing policies.

## Visual Identity Input

Use the current production interpretation of AI Topology Matrix:

- Deep-space application canvas.
- Bounded grid and strong alignment.
- Restrained glass surfaces, not nested glass everywhere.
- Cyan, blue, and violet as signals, not page backgrounds.
- Readable production typography.
- Calm spacing and professional desktop density.
- Light/glow primarily for focus, state, and premium moments.
- Subtle motion with reduced-motion support.

Do not copy historical scope from `design.md` merely because its visual ideas remain useful.

## Current Strengths To Preserve

- Project-first route hierarchy.
- Minimal active sidebar.
- Focused editor chrome.
- Structured chat messages and single plan-approval moment.
- Compact floating composer and aligned message/card rail.
- Progressive disclosure for planning, SFX, Music, and timeline.
- Accessibility and Playwright viewport/interaction coverage.
- Lazy route/editor boundaries and absence of >500 kB Vite warnings.
- Frontend/server dependency boundary checks.

## Current UI Problems To Audit Visually

- Landing and standard app pages still use older clean/mock presentation and need whole-product identity alignment.
- Home copy is framed as an internal testing flow rather than polished product language.
- Project list/detail/create surfaces are functionally clear but visually generic and text-heavy.
- Preferences mixes user edit defaults with internal testing/backend readiness; these audiences should be separated.
- Edit Brief is a large inline workflow rather than a clearly placed persistent workspace surface.
- Current editor contains a very large internal planning surface area that must remain hidden in Guided mode.
- Credit balance is contextual/mock-safe; there is no current standalone Wallet experience.

## Explicitly Excluded From The Current Redesign

- Brand Kit as a standalone route.
- Team and collaboration hub.
- Analytics dashboard.
- Templates marketplace/library.
- Standalone Media Library.
- Standalone Wallet.
- Standalone Pricing inside the app.
- Standalone Export Queue route.
- Native mobile application.
- Unrestricted provider/render/billing claims.

These require separate product reactivation decisions.

## Recommended Redesign Milestones

### 1. Scope And Workspace IA Signoff

- Confirm the three workspace tabs and their state/approval rules.
- Decide how internal testing readiness is removed from normal Preferences UX.
- Approve current navigation and excluded features.

### 2. Design Foundation And App Shell

- Normalize the live token/component set against AI Topology Matrix.
- Finalize standard route header, sidebar, project header, tabs, drawer, form, and state patterns.
- Preserve no-cutoff and accessibility rules.

### 3. Landing And Entry Flow

- Redesign Landing, Home, and Create Project around the current private/project-first product.
- Remove historical feature claims that are not current.

### 4. Projects And Project Detail

- Professional project list, project status, edit list, empty/loading/error states, and new-edit dialog.
- Keep one clear action per region.

### 5. Project Workspace Shell

- Implement the approved tab architecture.
- Preserve focused chat and compact header.
- Add Edit Brief as a first-class sibling surface if approved.
- Add edit preference snapshot/override visibility if approved.

### 6. Chat And Planning Surface Consolidation

- Retain existing compact composer/message rail/card hierarchy.
- Ensure user-facing Guided mode exposes only required actions and summaries.
- Keep developer/provider/database diagnostics hidden.

### 7. Preferences And Credit Trust

- Separate user editing defaults from internal testing readiness.
- Define contextual credit balance/estimate/history surfaces without reviving a Wallet route prematurely.

### 8. Motion, Accessibility, Responsive, And Visual Signoff

- Final motion tokens and reduced-motion checks.
- Route screenshots at 1024/1280/1440/1728/1920 plus zoom coverage.
- Manual founder-level signoff in addition to automated QA.

## Required Decision Before Implementation

Confirm whether `/Volumes/backup/REeditpro` is the implementation source of truth despite the documented divergent checkout. Until that is resolved, broad UI implementation, staging, or claims of whole-product completion are unsafe.

## Audit Validation Baseline

Captured on the current branch during this scope audit:

- `npm run check:frontend-boundary`: passed for 812 files.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed, but the `>500 kB` warning has returned for `EditorPage` (`537.92 kB`) and `frontend-api-client` (`765.83 kB`).
- `npm run lint`: failed with 69 errors and 4 warnings across active server, smoke, editor, and page files. These are not limited to the older private SearXNG activation area.
- `npm run test:e2e`: 73 passed and 3 failed. Failures are stale Edit Level copy assertions and a screenshot helper waiting for the no-longer-present `Demo scenario` control.

The redesign should not begin by weakening these checks. Restore the validation baseline or explicitly isolate unrelated failures as a separate prerequisite milestone.
