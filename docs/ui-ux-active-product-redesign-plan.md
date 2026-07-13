# ReeditPro Active-Product UI/UX Redesign Plan

Status: `active_route_redesign_implemented_and_verified`

Date: 2026-07-10

Branch reviewed: `codex/rp-beta-readiness-blocker-ledger`

## Authority And Scope

This plan governs the UI/UX redesign of the product that is active on the current branch. It complements `design.md`; it does not reactivate historical features simply because older design documents or screenshots mention them.

Evidence priority:

1. Active router, current navigation, and dirty-worktree implementation.
2. Components used by active routes.
3. Current project, edit, preference, approval, credit, upload, and private-review contracts.
4. Current Playwright and private-pipeline evidence.
5. Current-scope documents.
6. Historical pages and older sections of `design.md`.

## Product To Design

```text
Public entry
├── Landing
└── Sign in

Authenticated app
├── Home
├── Projects
│   ├── Create project
│   └── Project
│       └── Named edit workspace
│           ├── Chat (default)
│           ├── Edit Brief (single inline workspace)
│           └── Edit Preferences (`?view=preferences`)
└── Edit Preferences (saved defaults)
```

The named edit workspace contains the source-upload gate, Footage Prep, chat, the optional inline Edit Brief, exact-edit Edit Preferences, plan review, credit approval, progress, private review, revisions, and contextual advanced tools. The top-level `/preferences` destination remains the Saved Edit Preferences scope for future edits.

The following are not active standalone products and must not be restored during the redesign: Wallet, Pricing, Brand Kit, Export Queue, Media Library, Templates, Team, Analytics, or native mobile.

## Product Experience Contract

The current primary journey is:

```text
Understand the product
→ Sign in
→ Create or reopen a project
→ Create or reopen a named edit
→ Upload source video
→ Prepare footage
→ Give direction in chat and optionally complete the Edit Brief or review current Edit Preferences
→ Review the exact plan and credit estimate
→ Approve
→ Review private progress/output
→ Revise or accept
```

At every step the UI must answer four questions quickly:

1. Where am I?
2. What is the current state?
3. What is the one next action?
4. What will happen after that action?

The UI must never imply provider execution, rendering, public delivery, wallet mutation, or production durability without the corresponding evidence gate.

## Workspace Information Architecture

The current named edit remains chat-first. Preserve the implemented structure:

- Chat is the primary canvas.
- Edit Brief is optional, inline, and reachable from the compact top-right action after Footage Prep.
- Saved Edit Preferences at the technical `/preferences` route supplies defaults copied into an immutable new-edit baseline.
- Current Edit Preferences is a deliberate exact-edit workspace at `?view=preferences`, reached from the compact workspace switcher. It exposes original versus overridden values without becoming another chat card.
- Current-edit changes use explicit apply/reset behavior, invalidate a stale draft plan/estimate, and preserve cleanup/output-frame dependencies.
- After approval/private review begins, Current Edit Preferences is read-only and revisions return to Chat so approved snapshot and credit trace remain intact.
- Timeline, SFX, Music, planning, provider, and runner details remain contextual and collapsed.

Do not turn these destinations into disconnected top-level products or duplicate editable sources. Chat remains the default route state, Edit Brief remains the existing single inline workspace, and only Current Edit Preferences uses a persistent query-addressable view.

## Clean Named-Edit Chat Contract

The active named-edit route no longer presents planning as a historical stack of chat cards. Its visible state model is:

```text
Upload
→ one current setup decision
→ optional reference
→ source preparation + optional inline Edit Brief
→ one Plan Review and credit checkpoint
→ one processing state
→ one private review/revision state
```

Rules:

- Show only the current decision; completed setup controls do not remain as a card wall in the conversation.
- Source order, output frame, cleanup, meaning-safe trim status, edit level, and visual direction remain real approval gates even though their old `Inline*Card` presentation is gone.
- Planning Context, Video Understanding, Adaptive Strategy, timing subplans, Timing Validation, and Compiled Intent remain planner data. They do not render as separate default chat cards; concise understanding, timing status, and blockers belong in Plan Review.
- Advanced provider, prompt, tool, database, migration, and regression UI is excluded from the active named-edit conversation.
- SFX, Music, and Timeline do not render entry cards or a permanent advanced-status message in the active chat. Reintroducing them requires a quiet contextual access pattern.
- Plan Review is the single visible plan/credit approval checkpoint.
- Private review combines playback and decision actions in one destination. Internal adapter, manifest, and readiness evidence stays out of normal user copy.
- The compatibility `/editor` route may temporarily retain the legacy card harness for internal regression coverage; it is not the active product presentation and must not guide new named-edit UI.
- Current Edit Preferences occupies its own focused workspace when selected; do not render the full preference form as a card inside the clean chat state sequence.

## AI Topology Matrix Production Interpretation

The visual identity is a professional creative workspace, not a sci-fi dashboard.

### Foundation

- Deep-space canvas using the existing void/deep/app background tokens.
- Bounded desktop grid with stable alignment.
- Open work areas; do not wrap every page or the entire chat in a heavy card.
- Glass is reserved for meaningful elevation and focus, not every surface.

### Color

- Cyan communicates focus, current state, and high-confidence progress.
- Blue carries primary actions and selection.
- Violet adds depth and premium emphasis.
- Success, warning, and danger always include text or icon meaning.
- Glow is a state treatment, not a default decoration.

### Typography

- Marketing may be expressive; product pages remain compact and operational.
- App titles are short and readable.
- Body copy uses production-readable weight and line length.
- Eyebrows are signals, not a repeated decorative label on every card.

### Space And Density

- Follow the existing 4px token rhythm.
- Keep one dominant action per task region.
- Prefer one strong surface plus quiet supporting rows over a wall of equal cards.
- High density is limited to advanced editing and diagnostic surfaces.

### Motion

- Use short opacity/transform transitions for focus, disclosure, status, and route continuity.
- Keep the editor calmer than marketing.
- Respect reduced motion and never make animation a prerequisite for understanding state.

## Route Contracts

### Landing `/`

User goal: understand the current product and enter the project-first flow.

- Lead with chat-first editing and approval-before-work.
- Show the real project-to-private-review journey rather than historical suite modules.
- One primary action: start a project or sign in, depending on session state.
- Keep provider, tool-registry, and backend-readiness language out of the public story.

### Sign In `/sign-in`

User goal: enter a private workspace safely.

- Explain the active authentication mode honestly.
- Provide a clear sign-in action, loading state, failure state, and retry.
- A signed-in user without a usable workspace must be able to retry workspace resolution or sign out; never trap them in redirects.

### Home `/dashboard`

User goal: continue the latest work or start a project.

- One primary action for a new project.
- Continue-latest should appear only from recoverable scoped project state.
- Replace testing-instruction tone with concise product guidance while preserving private/internal truth.
- Avoid analytics, wallet, export, or status-card walls.

### Projects `/projects`

User goal: find or create a project.

- Distinguish loading, empty, ready, unavailable, access denied, and malformed-response states.
- Never turn a backend failure into a false empty state.
- Project names may repeat; identity must not be derived only from display names.
- Project cards show one next action and compact edit-state truth.

### Create Project `/projects/new`

User goal: create the project shell with minimal setup.

- Ask only for the project name and broad context.
- Do not upload, plan, approve, or imply generation here.
- Preserve user input on recoverable errors.
- Provide clear success handoff to the new project.

### Project `/projects/:projectId`

User goal: see and create named edits inside one project.

- Distinguish missing, forbidden, unavailable, empty, and ready states.
- Do not redirect all read failures to Projects.
- New-edit dialog must have labelled title, initial focus, Escape, focus containment, and focus return.
- Creation must be durable enough before navigation to avoid opening a non-existent edit.

### Named Edit `/projects/:projectId/edits/:editSessionId`

User goal: complete one edit through chat.

- Resolve the exact scoped edit before mounting the editor.
- Show loading, not found, access denied, and retryable recovery failure explicitly.
- Hydrate the complete recovered setup before first render; defaults must never silently replace saved direction.
- Upload errors remain visible inside the upload gate and provide a retry path.
- Show persistence state when the browser cannot yet prove that important changes are recoverable.
- Preserve the compact header, aligned message/composer rail, single plan-approval moment, and no-hard-footer behavior.
- Preserve `?view=preferences` as the query-addressable exact-edit preference destination. Direct navigation and reload must retain the same project/edit identity.
- Show each implemented field as original or changed for this edit, protect unapplied drafts, and make apply/reset consequences explicit.
- Applying any changed implemented field requires a fresh plan/estimate when a draft exists; cleanup reruns Footage Prep and destination changes reconfirm the output frame.
- Keep the preference form read-only after approval/private review and direct revisions through Chat rather than mutating approved state.
- Remove or truthfully label hard-coded identity, balance, and production claims.

### Edit Preferences `/preferences`

User goal: set defaults for future edits.

- Keep account defaults separate from the current edit's brief.
- Explain snapshot behavior: existing edits retain their copied defaults.
- Preserve the draft on network, authorization, or compare-and-swap failure.
- Offer retry/reload without silently discarding unsaved choices.
- Keep internal connection diagnostics absent from normal UI; development/E2E may expose them only through the explicit gated query.
- Claim authenticated single-host private persistence only; do not claim Supabase/RLS/cross-device durability yet.

## Cross-Route State Pattern

Every resource-backed route or workflow must use the same state vocabulary:

| State | Required UX |
| --- | --- |
| Loading | Stable skeleton or compact progress; no false empty content |
| Empty | Explain what is missing and provide one next action |
| Ready | Show current resource and next action |
| Saving | Non-blocking visible persistence status |
| Saved | Quiet confirmation tied to the exact scoped resource |
| Needs retry | Preserve the user's work and expose retry |
| Not found | Explain the missing resource and provide a safe parent route |
| Access denied | Do not leak resource detail; offer safe navigation/sign-out |
| Unavailable | Explain that the workspace or service could not be reached; offer retry |
| Blocking validation | Keep the user's input visible and explain the exact correction |

Do not use empty-state components for transport, authorization, parsing, or tenancy errors.

## Shared Component Direction

The redesign should converge on these shared primitives rather than route-specific recipes:

- `AppShell` and compact editor shell.
- Standard route header and project header.
- Resource-state panel for loading/not-found/denied/unavailable/retry.
- Button and icon-button families with consistent focus/disabled/loading behavior.
- Form field, select, textarea, validation summary, and unsaved-state footer.
- Project card/edit row.
- Accessible modal/dialog and disclosure.
- Status chip/dot with semantic text.
- Chat message, compact inline card, approval card, and floating composer.

New values belong in tokens before route CSS. Avoid one-off glow, radius, shadow, or color rules in page components.

## Accessibility And Interaction Contract

- All functionality is reachable by keyboard.
- Focus is visible and never hidden by sticky/floating chrome.
- Modals contain and restore focus and close with Escape.
- Alerts use semantic roles without announcing normal decorative copy.
- Status is never color-only.
- Long filenames, project names, URLs, and messages wrap or truncate without horizontal overflow.
- The active product is verified at 1024, 1280, 1440, 1728, and 1920 widths plus the existing zoom proxy.

## Performance Contract

- Keep route-level lazy loading.
- Keep advanced editor, timeline, SFX, Music, and developer surfaces lazy/collapsed.
- Preserve the frontend/server dependency boundary.
- Do not add a UI framework, animation library, WebGL, or large visual dependency for this redesign.
- Keep every emitted browser chunk below the current warning threshold.

## Implementation Milestones

### 0. Current Scope And Visual Truth — Complete

- Active route and navigation truth established.
- Retired modules excluded.
- Current active surfaces visually reviewed.
- Existing editor rail/composer/approval identity preserved.

### 1. Journey Recovery And Failure UX — Complete For Current Private Scope

- Visible source-upload failure and retry: complete.
- Named-edit pre-mount recovery and exact setup hydration: complete.
- Workspace unavailable retry/sign-out: complete.
- Home, Projects, and project detail discriminated recovery/error states: complete.
- Duplicate-safe project creation and accessible New Edit dialog: complete.
- Exact named-edit persistence status and retained retryable writes: complete.

### 2. Edit Preferences Resilience — Complete For Current Private Scope

- Drafts survive load/save/conflict/network failures.
- Retry save, non-destructive refresh, and explicit discard are implemented.
- Unsaved browser-unload protection is implemented.
- New edits store an immutable seven-field creation baseline; exact edits persist effective values, override keys, revision, and update time.
- Current Edit Preferences supports explicit apply, per-field reset, reset-all, query-addressable recovery, and dirty-leave protection.
- A shared consequence resolver requires replanning/re-estimation and resets Footage Prep/output-frame confirmation for dependent changes.
- Approved/private-review edits expose read-only preferences and route revision requests through Chat.
- The guarded loopback browser/API tester runtime is implemented. Real Supabase/RLS/cross-device durability remains blocked by migration-baseline reconciliation.

### 3. Entry And Project-System Polish — In Progress

- Landing and Home copy now lead with the product journey while retaining private-build truth.
- Signed-in Home now uses the approved Resume-First Command Center: latest meaningful edit, state-aware CTA, other attention items, recent work, a first-project variant, and compact recovery truth instead of repeated onboarding or full-width status cards.
- The persistent `design-system/MASTER.md` and `design-system/pages/home.md` translate the conversation, reference-image observations, AI Topology Matrix, and UI UX Pro Max critique framework into the existing React/CSS stack.
- Projects now uses a bounded scan-and-filter grid, compact semantic status, truthful latest-edit summaries, and one project action without stretching sparse content into full-width rows.
- Project Home now uses compact context, a quiet defaults summary, one latest-edit focal surface, quieter supporting edit cards, and state-aware actions.
- `design-system/pages/projects.md` and `design-system/pages/project-home.md` define the page-specific rules and required states.
- Duplicate-safe project creation and project resource-state UI remain implemented.
- New Edit dialog keyboard containment, Escape, initial focus, and focus return are implemented.
- Direct named-edit project context/back navigation is implemented. The header preserves the exact project and edit identity across Chat and Current Edit Preferences, exposes the active workspace destination, and reflows without horizontal overflow across the 1024px through 1920px test matrix.

### 4. Workspace Truth And Persistence Feedback — Complete For Current Private Scope

- Hard-coded named-edit user identity and the false `100 credits` balance are removed.
- `Saving / Saved / Needs retry` state is implemented without cluttering chat, and failed exact-scoped writes retain the newest local handoff for explicit retry.
- Meaningful brief, setup, or source changes invalidate stale plan/approval state visibly.
- Edit Brief remains inline and top-right-accessible; its complete typed state persists with the exact edit, restores after reload, transfers into Planning Context, deep-copies into the approved snapshot, and becomes read-only once approval/private review begins.
- Current Edit Preferences is a separate query-addressable workspace inside the same named edit.
- Current preference changes never approve a plan, mutate credits, or start generation, and cannot mutate an approved snapshot in place.

### 5. Whole-Product Visual Consistency — In Progress

- Home, Projects, and Project Home now use the shared bounded hierarchy, surface levels, and semantic status treatment.
- Saved and Current Edit Preferences now use the canonical seven-field system with explicit persistence/recovery truth, inherited/overridden state, responsive hierarchy, guarded drafts, and visually reviewed action states. Landing, Sign In, Create Project, shared project/edit recovery, the active named-edit upload gate, responsive conversation/preview composition, planning-input status, Edit Brief, Plan Review, progress framing, Private Review, and normal revision replanning now follow the same system. Gated revised-review continuation and founder-level whole-product signoff remain separate evidence steps.
- Preserve route-specific identity as work continues: marketing is expressive, app routes operational, editor open and conversational.

### 6. Final Active-Route Signoff — Pending Whole-Product Completion

- Capture all active routes and critical states.
- Run viewport, keyboard, zoom, overflow, approval, upload-failure, recovery, and preference-failure coverage.
- Perform founder-level visual review in addition to automated checks.
- Update scope and signoff documents with only evidence-backed claims.

Interim evidence on 2026-07-10:

- Full Playwright suite: 122 passed after the Resume-First Home implementation; it must be rerun after all remaining route work.
- Projects/Project Home focused UI, tenancy, screenshot, and viewport checks pass after their redesign.
- Final full active-route screenshot and founder-level signoff remain pending.
- Zoom suite: 3 passed.
- Keyboard suite: 4 passed.
- Frontend typecheck, production build, frontend/server boundary, targeted UI lint, full Edit Preferences coverage, Edit Brief lifecycle coverage, planning-input safety smoke, and Edit Preferences persistence smoke passed.
- Full lint is currently blocked only by five unused imports in the unrelated untracked `server/smoke/edit-planning-authority-smoke.ts` parallel backend file; the Home/UI files pass lint and do not hide that blocker.
- The current whole-worktree server typecheck remains blocked by the unrelated untracked `server/services/private-edit-authority-store.ts` union access at line 514; this UI slice does not broaden or mask that backend blocker.
- The authenticated private smoke verified upload, approval, review, revision, reload, exact-edit recovery, tenant isolation, and revoked-membership blocking while keeping public beta, production delivery, and billing blocked.

Focused named-edit context evidence on 2026-07-13:

- `tests/e2e/viewport.spec.ts`: 59 passed, including exact parent-project return, active Chat/Edit Preferences state, retained project/edit identity, and horizontal-overflow checks at 1024px, 1280px, 1440px, 1728px, and 1920px.
- Guarded local browser review passed at 1024px, 1280px, and 1440px with no console errors; browser/API mode remained mock/local and provider execution remained disabled.
- This bounded evidence does not replace the pending whole-product rerun or final active-route visual signoff.

Focused Saved Edit Preferences evidence on 2026-07-13:

- Twelve focused route, persistence, inheritance, override, invalidation, and approval-lock browser tests pass across the Saved and Current scopes.
- The guarded local `/preferences` review passed at 1024px and 1440px with seven visible controls, explicit dirty/save feedback, no horizontal overflow, and no console errors.
- The route remains local/private and workspace-scoped; production Supabase durability, providers, billing, rendering, deployment, and whole-product signoff remain blocked.

Focused Current Edit Preferences presentation evidence on 2026-07-13:

- Focused browser coverage proves the three-group/seven-field hierarchy, bounded grid, inherited and overridden treatment, sticky action rail, dirty-leave guard, apply state, reload persistence, planning invalidation, and approval lock.
- Guarded local review passed for clean, overridden, leave-guard, and applied states at 700px, 1024px, and 1280px without horizontal overflow or console errors.
- This closes the Current Edit Preferences route-specific presentation pass only; the full active-route suite and whole-product visual signoff remain pending.

Focused Edit Brief and named-edit foundation evidence on 2026-07-13:

- The focused editor suite passes 20/20 checks, including the optional Brief lifecycle, exact-edit recovery, planning transfer, approval lock, computed field hierarchy, responsive preview rail, and bounded upload gate.
- `tests/e2e/viewport.spec.ts` passes 59/59 checks; the clean-shell, keyboard, and zoom group passes 9/9.
- Guarded local browser review passed at 1024px and 1280px without horizontal overflow or console errors. The preview rail is secondary on supported wide screens and collapses before constraining the main planning workspace.
- This closes the active Edit Brief presentation and named-edit layout-foundation pass only. Plan/review and Create Project presentation are evidenced separately below; Landing, Sign In, remaining revision/recovery states, full-suite, and founder-level visual signoff remain pending.

Focused Plan Review and Private Review presentation evidence on 2026-07-13:

- Regression-first coverage reproduced missing Plan Review and Private Review styles as `display: block`, then proved the restored checkpoint, intent accent, four/two/one-column approval facts, estimate alignment, bounded playback placeholder, compact header stack, approved-direction trace, and preparation activity grid.
- The approval path still requires the exact plan and estimate before progress appears. The review path keeps sharing, billing, public release, and unapproved revisions gated.
- The named-edit screenshot flow now captures both the existing Plan Review state and a dedicated Private Review state at 1280px, with the quiet preview/status rail remaining secondary.
- This closes the active Plan Review and Private Review presentation pass only. No provider, billing, Supabase, production render, public delivery, or deployment boundary changed.

Focused Create Project and named-edit handoff evidence on 2026-07-13:

- Regression-first coverage reproduced the missing route layer as a plain `display: block` form and a static inline New Edit surface, then proved the restored two/one-column setup, responsive context rail, fixed contained dialog, compact action stack, and no horizontal overflow.
- The active handoff remains `CreateProjectPage` -> exact `ProjectDetailPage` -> accessible New Edit modal -> exact named edit. Retired `ProjectHomePage` components and their older setup contract were not remounted.
- Thirty-three focused project, tenancy, editor, and clean-chat checks pass together, covering duplicate-safe project identity, validation, exact-route recovery, modal focus containment/Escape/focus return, upload gating, plan approval, and private review. A separate 66-check viewport, keyboard, and zoom run passes, including Create Project at five desktop widths. The focused non-editor screenshot flow and the dedicated modal artifact test also pass.
- `create-project-1280.png` and `project-new-edit-dialog-1280.png` passed visual review. Project creation and edit naming still do not upload, plan, approve, reserve/spend credits, call providers, render, release, or deploy.
- This closes the active Create Project presentation and handoff pass only. Sign In is evidenced separately below; Landing, remaining revision/recovery states, the complete E2E rerun, and founder-level whole-product signoff remain pending.

Focused Sign In and session-entry evidence on 2026-07-13:

- Regression-first coverage reproduced the technical multi-card auth dashboard and missing reviewed `sign-in-card`, then proved the calm two/one-column route, one active-mode action, no marketing badges or backend-readiness copy, and the hidden-until-focused skip link.
- Canonical `returnTo` and the legacy internal `redirect` alias preserve safe app destinations; external targets fall back to Home. The local preview identity remains tab-scoped with no bearer token and clears on sign-out.
- Eleven auth, public-route, responsive, keyboard, guarded-local-session, and sign-out checks pass when the explicitly gated local testing spec is enabled. The non-editor screenshot flow passes and `sign-in-1280.png` matches the reviewed route.
- Restored shared auth styling also returns the compact signed-in identity card to app sidebars without changing session, provider, database, billing, rendering, or deployment behavior.
- This closes the active Sign In presentation and local-session entry pass only. Landing is evidenced separately below; remaining revision/recovery states, the complete E2E rerun, and founder-level whole-product signoff remain pending.

Focused Landing and public-entry evidence on 2026-07-13:

- Regression-first coverage reproduced the continuation-branch gap as an unstyled `display: block` hero with no focal product-demo surface and no keyboard skip route. The repair restores the reviewed route layer without changing its product copy, workflow contract, or protected project destination.
- The public entry now presents one chat-first promise, one primary action, a truthful named-edit planning/approval preview, transparent pre-approval credits, and bounded workflow/signature/use-case/private-workspace sections instead of a generic feature-card wall.
- Seven focused public-route checks pass across 375, 720, 1024, and 1280 widths plus compact landscape and reduced-motion mode. They prove the responsive hero/editor/trust hierarchy, compact second-row navigation, native workflow anchor, hidden-until-focused skip route, and no horizontal overflow.
- The focused non-editor screenshot flow passes, and `landing-1280.png`, `landing-1024.png`, and `landing-720.png` passed visual review against the active route design rules.
- This closes the active Landing presentation pass only. It does not activate uploads, planning, credits, providers, workers, rendering, billing, deployment, or public delivery. Shared recovery is evidenced separately below; remaining revision states, the complete E2E rerun, and founder-level whole-product signoff remain pending.

Focused shared project/edit recovery evidence on 2026-07-13:

- Regression-first coverage reproduced the missing shared state layer: compact Project/Project Detail recovery rendered as unbounded document flow, while named-edit failure rendered as a raw block with no focal boundary.
- The restored state system keeps loading, local-only, not-found, unavailable, invalid-response, and access-denied semantics visible through copy, icon, border treatment, and ARIA role rather than color alone. No recovery result is reclassified and no retry or navigation contract changes.
- Sixty-six project tenancy, Home recovery, responsive route, exact-project return, legacy redirect, and named-edit recovery checks pass together. A separate 22-check editor/clean-chat run passes the unknown-route fail-closed path, normal revision replanning, approval, and private-review flow. Computed styles prove compact three-column recovery, its single-column 700px collapse, the bounded 560px named-edit failure surface, and horizontal-overflow safety from 1024 through 1920px.
- The active project/named-edit screenshot flow passes. `project-detail-1280.png` and `named-edit-recovery-error-1280.png` passed visual review; the editor still does not mount behind a failed recovery state.
- This closes the shared recovery presentation pass only. It does not activate a backend, Supabase, uploads, planning, approvals, credits, providers, workers, rendering, billing, deployment, or public delivery. Normal revision replanning is evidenced separately below; gated revised-review continuation, the complete E2E rerun, and founder-level whole-product signoff remain pending.

Focused normal revision-replanning evidence on 2026-07-13:

- A change sent after private review becomes a typed, context-only revision request tied to the exact source set and previous approval/review references. The previous approved snapshot remains historical context; it is not mutated or reused as the next executable plan.
- The user request remains a compact right-aligned Chat turn. The assistant response explicitly requires a fresh plan before credits, keeps the previous private review as context only, and returns the workspace to the source-prepared planning decision with `Estimate pending`.
- Focused editor and screenshot checks prove the `assistant_revision_response` semantics, cleared stale Plan Review and Private Review, planning-stage return, preserved project/edit identity, no horizontal overflow, and no provider/tool/internal implementation names in user-facing copy.
- `named-edit-revision-requested-1280.png` passed visual review. The contextual Edit Brief remains optional and available; the quiet preview rail continues to show that the plan is still before approval.
- This closes the normal user revision-replanning presentation pass only. It does not execute a revised review, mutate credits, call providers, run workers, render, export, publish, or replace the immutable approved snapshot. Those stages remain gated by their own backend/runtime evidence.

## Definition Of Done

The active ReeditPro UI/UX is complete only when:

- Every active route has a clear user goal and one dominant next action.
- Loading, empty, not-found, denied, unavailable, validation, saving, and retry states are honest and distinct.
- A fresh signed-in browser can recover the exact scoped project/edit state or receive an actionable error.
- User input and preference drafts survive recoverable failures.
- Saved defaults remain distinct from each edit's immutable creation baseline and explicit exact-edit overrides.
- Current preference changes produce the correct replan/re-estimate, Footage Prep, and output-frame consequences without starting work or mutating credits.
- Approved work keeps Current Edit Preferences read-only and routes requested changes through the revision flow in Chat.
- Plan and credit approval remain the only gate into expensive work.
- Retired modules do not appear in navigation, marketing promises, or current-scope screenshots.
- The app remains calm, bounded, readable, keyboard-usable, reduced-motion-safe, and overflow-free.
- Active-route screenshots pass manual review.
- Typecheck, lint, build, boundary checks, focused tests, full E2E, and private-pipeline checks pass.
- No claim exceeds private/internal evidence.
