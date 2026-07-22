# Prompt 3 Route-By-Route UI/UX QA Report

> Current route source of truth: the active app flow is Project -> Edit with required core sidebar links Home, Edit Videos, and Edit Preferences. `Edit Videos` routes to the existing `/projects` hierarchy. These are not an exact-three-link ceiling; combined-source integration also retains Motion Studio. This report contains historical prompt QA for retired routes; current `qa:viewport` treats `/wallet`, `/pricing`, `/brand-kit`, `/exports`, `/upload`, `/edit-preferences`, `/settings`, and `/app` as compatibility redirects only.

## Scope

Reviewed current routes against ReeditPro UI/UX laws after the CSS architecture split:

- `/`
- `/dashboard`
- `/projects`
- `/projects/new`
- `/editor`
- `/wallet`
- `/pricing`
- `/brand-kit`
- `/exports`

Also checked CSS architecture, route imports, `AppShellChatToolbarContext` status, and bundle risk.

## Missing File Status

- Governance docs were missing and are now created:
  - `docs/ui-ux-master-plan.md`
  - `docs/ui-ux-codex-rules.md`
  - `docs/ui-ux-component-standards.md`
  - `docs/ui-ux-page-flow-map.md`
  - `docs/ui-ux-quality-checklist.md`
- `src/components/AppShellChatToolbarContext.tsx` is still absent.
- Code inspection found no imports or references to `AppShellChatToolbarContext`, `ChatToolbar`, `toggleSidebar`, or `sidebarVisible` in current app code.
- No context file was created because there is no runtime dependency to restore.

## CSS Architecture QA

- `src/index.css` imports tokens first, then base, typography, surfaces, buttons, forms, layout, chat, marketing, motion, and responsive styles.
- `sr-only` remains present in `src/styles/base.css`.
- Global `:focus-visible` remains present.
- Button hover, active, focus, and disabled states remain present in `src/styles/buttons.css`.
- Segmented selected state remains tied to `aria-pressed`.
- Composer and microphone styles remain present in `src/styles/chat.css`.
- Reduced motion remains present in `src/styles/motion.css`.
- Marketing and responsive styles remain present.
- No broad CSS rewrite was performed.

## Route QA

### `/`

- Summary: Pass.
- Risk: Low.
- Product clarity: Strong chat-first and approval-before-generation messaging.
- Calm structure: Marketing density is acceptable; hero and product mock stay aligned to the AI Topology Matrix direction.
- Accessibility: Main actions are labeled links/buttons; decorative hero elements are hidden.
- Small fixes applied: None.
- Deferred fixes: Future visual QA should verify hero text and mock editor spacing in browser screenshots.

### `/dashboard`

- Summary: Pass with watch items.
- Risk: Medium.
- Product clarity: Shows approvals, credits, active work, and exports without implying real generation.
- Calm structure: Side column is useful but approaches card-wall density.
- Accessibility: Sidebar nav and storage progress semantics are present through `AppShell`.
- Small fixes applied: None.
- Deferred fixes: Future dashboard milestone should reduce side-panel density and clarify which active edits are mock versus production.

### `/projects`

- Summary: Pass after small copy cleanup.
- Risk: Low.
- Product clarity: Main action remains "Create project and chat"; project/media browsing supports chat-first creation.
- Calm structure: Filters, folders, project cards, support cards, and media library are separated.
- Accessibility: Search has an `sr-only` label; segmented filters use `aria-pressed`; storage progress has progressbar semantics.
- Small fixes applied: Changed user-facing "Upload placeholder", "Storage placeholder", and "Empty state example" copy to calmer mock/empty-state language.
- Deferred fixes: Future route pass should reduce secondary badges in the media header if the section becomes busier.

### `/projects/new`

- Summary: Pass.
- Risk: Low.
- Product clarity: Category is framed as planning context, not a forced visual system.
- Calm structure: Category cards are scan-friendly, with only the first action styled primary.
- Accessibility: Project name input has a visible label.
- Small fixes applied: None.
- Deferred fixes: Future milestone may replace per-card buttons with a single selected-category action for even calmer hierarchy.

### `/editor`

- Summary: Pass with significant deferred risks.
- Risk: High.
- Product clarity: Chat remains the editor. The explicit approval gate is present, and mock progress starts only from `handleApprove` after required blockers pass.
- Calm structure: Guided mode and collapsed advanced/developer card behavior are preserved, but the route is still very dense because many planning systems are represented in one component.
- Accessibility: Chat thread is labeled/live; composer has a textarea label; microphone has an accessible disabled label; plan card toggles use `aria-expanded`.
- Small fixes applied: Route-level lazy loading moved editor code out of the initial app entry.
- Deferred fixes: Do a dedicated chat editor milestone for PlanReviewCard hierarchy, phase-based lazy loading, detailed timeline lazy loading, and reducing visible advanced entry points. Also review the generation-readiness mock preview path to ensure every preview state remains gated and unmistakably local/mock.

### `/wallet`

- Summary: Pass after small affordance cleanup.
- Risk: Low.
- Product clarity: Separates software access from credits and explains Real Motion cost.
- Calm structure: Metrics, wallet preview, packs, and activity are organized.
- Accessibility: Disabled mock payment actions are now semantic disabled buttons.
- Small fixes applied: Changed "Credit Wallet placeholder" to "Credit Wallet preview"; disabled mock add-credit and billing buttons.
- Deferred fixes: Future backend milestone should replace disabled actions with real payment flow only after Stripe/backend approval.

### `/pricing`

- Summary: Pass after small copy cleanup.
- Risk: Low.
- Product clarity: Clear subscription plus credit model; no unlimited editing language.
- Calm structure: Hero, plan cards, credit explanation, and pack grid are distinct.
- Accessibility: Credit pack checkout buttons are disabled while mock-only.
- Small fixes applied: Removed "placeholder" wording from policy copy, clarified packs are mock-only, disabled checkout buttons, and cleaned plan CTA labels.
- Deferred fixes: Future pricing milestone should add billing disclosures only when checkout exists.

### `/brand-kit`

- Summary: Pass after small affordance cleanup.
- Risk: Low.
- Product clarity: Framed as future brand controls without implying saved settings.
- Calm structure: Brand preview and field grid are understandable.
- Accessibility: Mock-only brand actions are now disabled buttons.
- Small fixes applied: Removed "placeholder" title/description, changed status badge to "Mock preview", and disabled unconnected configure/preview actions.
- Deferred fixes: Future Business milestone should add real forms only with persistence and backend storage.

### `/exports`

- Summary: Pass after small copy cleanup.
- Risk: Low.
- Product clarity: Export queue is explicitly mock/static and does not imply real rendering or downloads.
- Calm structure: Summary cards and queue list are separated.
- Accessibility: Status text is visible through queue badges/cards.
- Small fixes applied: Changed "Placeholder export queue" copy to "Mock export queue".
- Deferred fixes: Future export milestone should connect approval, readiness, render status, and download/share semantics to backend state.

## Small Fixes Applied

- Created missing governance docs and linked them from `AGENTS.md`.
- Added route-level lazy loading with a calm Suspense fallback in `src/App.tsx`.
- Added tokenized route loading styles in `src/styles/layout.css`.
- Cleaned user-facing "placeholder" copy on projects, pricing, wallet, brand kit, and exports.
- Disabled mock-only wallet, pricing checkout, and brand kit actions.

## Bundle Review Summary

- Initial app entry is now split by route.
- Main app entry is no longer the largest payload.
- `EditorPage` remains oversized because the editor route eagerly imports the full chat/planning/mock workflow stack.
- The remaining Vite warning is deferred to a future editor code-splitting milestone.

## Validation

- `npm run lint` with arm64 Node: passed.
- `npm run build` with arm64 Node: passed.
- Vite chunk warning: remains for `EditorPage`.
- Local Vite server: started on `http://127.0.0.1:5173/` and returned the app shell HTML. The in-app browser connector had no available browser session, so visual browser automation was not completed.

## Prompt 4 Editor Follow-Up

### Editor Route Status

- `EditorPage` was reduced from `2,354.28 kB` minified / `542.30 kB` gzip to `441.54 kB` minified / `96.60 kB` gzip.
- The editor route itself is no longer the source of the Vite `>500 kB` warning.
- The remaining warning is the shared `mock-planner` chunk at `924.68 kB` minified / `234.15 kB` gzip.

### Timeline Lazy-Load Status

- `DetailedTimelineDrawer` is now lazy-loaded from `EditorPage`.
- The fallback only renders after the user opens the advanced timeline.
- Timeline remains secondary and hidden by default.

### Advanced Card Lazy-Load Status

- Advanced/developer/detail planning cards now live behind `AdvancedPlanningDetails`.
- Guided mode keeps the same visibility rules because `shouldShowCard` still controls which cards appear.
- Advanced/developer cards remain collapsed by default through `InlinePlanCardShell`.
- Warnings/blockers can still surface because the lazy group loads when those descriptors become visible.

### Plan Review / Credit Approval Status

- The separate visible edit-plan and credit-estimate approval cards were replaced with `PlanReviewApprovalCard`.
- The approval moment now has one primary action: approve plan and credits.
- Lower-cost, remove Real Motion, and ask-question actions are secondary.
- Copy explicitly states credits are estimated before generation and mock progress starts only after approval.

### Composer And Microphone Status

- Composer structure was preserved.
- Attachment/reference controls remain present.
- Textarea remains labeled.
- Microphone remains a disabled mock voice-control button with an accessible label near the send action.

### Remaining Editor Risks

- The mock planner/runtime data is still large and shared.
- Planner logic, validation, regression, and mock data remain in the editor path because they compute the current Guided-mode approval state.
- Browser automation remains unavailable in this environment, so Prompt 4 validation relied on code inspection, lint, and production build output.

## Prompt 5 Editor Follow-Up

### Guided Plan Stability

- Guided mode now uses a lightweight mock planner for the visible chat-first setup, plan review, credit estimate, timing summaries, and approval card.
- The editor still renders the default scenario immediately and lazy-loads non-default scenario payloads when selected.
- Scenario switching shows a calm inline loading state and does not start generation or mock progress.

### Approval Gate Status

- `PlanReviewApprovalCard` remains the single approval moment.
- Clicking approval now loads the full mock planner before checking approval gates and creating the approved snapshot.
- Mock progress still starts only after the full planner confirms frame, cleanup, trim, timing, SoundSync, and timing-validation gates.
- The approval button shows a checking state while full gates load.

### Advanced / Developer Lazy Status

- Guided mode no longer loads full advanced/developer planner diagnostics by default.
- `AdvancedPlanningDetails` loads the full planner, validation report, and regression report internally only when detailed/developer cards become visible or a warning/blocking descriptor needs them.
- Advanced/developer cards remain collapsed by default through `InlinePlanCardShell`.

### Bundle Status

- Editor route dropped from `441.54 kB` to `297.23 kB` minified.
- The previous shared `mock-planner` chunk dropped from `924.68 kB` to a `0.02 kB` compatibility facade.
- A full planner lazy chunk remains `861.26 kB` and still triggers the Vite chunk warning.

### Remaining Editor Risks

- Full approval still imports the full planner chunk because approval-core and advanced-diagnostics planner builders are not yet split.
- Guided credit summaries are intentionally lightweight; future work should split an approval-core planner so displayed estimates and full approval snapshots can share one smaller source of truth.
- Browser automation was attempted, but the in-app browser returned `Browser is not available: iab`; validation remains code inspection, lint, typecheck, and production build.

## Prompt 6 Editor Follow-Up

### Approval Core Status

- Approval now loads `approval-core` instead of the monolithic full planner.
- The approval gate sequence remains: Planning Context, output frame, source cleanup, trim review, Master Timing, SoundSync transition timing, and timing validation.
- Mock progress still starts only after approval gates pass and an approved snapshot is created.
- `PlanReviewApprovalCard` remains the single approval moment.

### Advanced Diagnostics Status

- `AdvancedPlanningDetails` now loads an advanced diagnostics builder that imports planning domains through smaller dynamic chunks.
- Provider prompts, tool/render strategy, renderer planning, color/audio/map/dataviz, execution graph, migration/Supabase, and planning audit details remain advanced-only.
- Guided mode does not import advanced diagnostics by default.
- Advanced/developer cards remain collapsed by default unless their descriptor is warning/blocking.

### Bundle Status

- Main app entry: `227.63 kB` minified.
- Editor route: `266.30 kB` minified.
- Approval-core: `1.90 kB` minified.
- The previous `861.26 kB` full planner lazy chunk is no longer emitted.
- No Vite `>500 kB` chunk warning remains.

### Remaining Editor Risks

- Advanced diagnostics are now split by domain, but the detailed/developer surface still loads many planning domains when made visible.
- SFX and footage-prep workflows are the largest remaining chunks and are good candidates for future phase-based splits.
- Browser automation was attempted against `http://127.0.0.1:5173/editor`, but the in-app browser again reported `Browser is not available: iab`; validation remains typecheck, lint, production build, and code inspection.

## Prompt 7 App Shell Sizing Audit

Browser QA was available for this pass. The Vite dev server was started with the arm64 Node runtime and the in-app browser measured every required route at `1024px`, `1280px`, `1440px`, `1728px`, and `1920px` wide.

Initial probe findings:

- `/dashboard` overflowed at `1024px` and slightly at `1280px` because metric badge rows could not wrap inside narrow metric cards.
- `/wallet` overflowed at `1024px` for the same metric badge row pattern.
- `/editor` had no horizontal overflow in the probe; the composer remained visible at all tested widths.

Fixes applied:

- Metric grids now collapse earlier at desktop-narrow widths.
- Metric cards and badge rows gained `min-width: 0`, safe wrapping, and badge wrapping.
- App shell, route grids, export rows, project/media/brand/wallet cards, chat shell, chat messages, inline cards, source cards, composer rows, and timeline drawer gained no-cutoff sizing guards.
- The second browser probe reported `0` failures across all `45` route/width combinations.

### Route Results

- `/`: Pass, low risk. Marketing route remained bounded in the browser probe. Deferred: future visual QA screenshots at 125% zoom.
- `/dashboard`: Pass after fix, medium-to-low risk. Metric rows were the only measured overflow source; fixed with wrapping and responsive grid changes.
- `/projects`: Pass, low risk. Project grids and cards now have safer `min-width: 0` and long-text wrapping.
- `/projects/new`: Pass, low risk. Upload/setup grids keep responsive stacking and no measured overflow.
- `/editor`: Pass, medium risk because it remains the densest route. Browser probe confirmed no horizontal overflow and visible composer at all tested widths.
- `/wallet`: Pass after fix, medium-to-low risk. Metric badge overflow at `1024px` was fixed.
- `/pricing`: Pass, low risk. Pricing cards and credit pack grids did not report overflow.
- `/brand-kit`: Pass, low risk. Brand hero and field grids now have no-cutoff guards.
- `/exports`: Pass, low risk. Export rows reflow before clipping and reported no overflow.

## Prompt 7 Shell and Chat Architecture QA

### Shell Status

- Desktop app shell uses tokenized sidebar, topbar, composer, preview rail, and shell padding values.
- Sidebar scrolls internally if it exceeds viewport height.
- Topbar actions and search wrap instead of forcing horizontal overflow.
- Route grids use earlier stacking and `minmax(0, 1fr)` / `min-width: 0` patterns where practical.
- No global overflow hiding was added.

### Chat Architecture Status

- `src/types/projects-chat.ts` now defines structured ReeditPro chat message types, statuses, card types, action IDs, and message records.
- `ChatMessage` supports structured `id`, `role`, `type`, `status`, `ariaLive`, and `label` props while preserving legacy `role="ai"` compatibility.
- `ChatThread` keeps a clear accessible label and no longer puts `aria-live` on the whole thread.
- `ChatNativeEditor` now maps core visible messages to typed concepts: system status, attachment event, assistant question, reference event, plan review, progress update, preview ready, revision response, and assistant error.
- Cards remain JSX children during this partial migration, which keeps current mock behavior stable.

### Approval And Composer Status

- `PlanReviewApprovalCard` remains the single approval moment.
- Approval-core failures now render as `assistant_error` messages, do not start progress, do not set approved state, and explicitly say no credits were approved or used.
- Composer guards empty sends, supports `Cmd/Ctrl+Enter`, preserves normal textarea newline behavior, and keeps the disabled mock microphone control.

### Remaining Risks

- Some nested SFX/music flow messages still use legacy/simple message rendering; `ChatMessage` compatibility keeps them stable.
- The editor conversation is partially structured, not yet a single persisted message descriptor list.
- Screenshot-based visual QA at `125%` browser zoom is still a good next pass.

## Prompt 8 Screenshot and Chat Renderer QA

### Browser And Screenshot Coverage

The Vite dev server was started with the arm64 Node runtime and the in-app browser captured screenshots under `docs/ui-ux-screenshots/prompt-8/`.

Routes and widths captured:

- `/editor`: `1280px`, `1440px`, `1920px`
- `/dashboard`: `1280px`, `1440px`
- `/projects`: `1280px`, `1440px`
- `/wallet`: `1280px`, `1440px`
- `/exports`: `1280px`, `1440px`
- `/`, `/projects/new`, `/pricing`, `/brand-kit`: `1440px`

Screenshot files:

- `editor-1280.png`, `editor-1440.png`, `editor-1920.png`
- `dashboard-1280.png`, `dashboard-1440.png`
- `projects-1280.png`, `projects-1440.png`
- `wallet-1280.png`, `wallet-1440.png`
- `exports-1280.png`, `exports-1440.png`
- `landing-1440.png`, `projects-new-1440.png`, `pricing-1440.png`, `brand-kit-1440.png`

### 125% Zoom Verification

True browser zoom/device-scale control was not available in this browser surface:

- CSS zoom injection failed with `CSSStyleDeclaration assignment is not available in playwright.evaluate because the DOM is read-only`.
- Keyboard browser zoom did not change `devicePixelRatio`, viewport width, or visual viewport scale.
- Zoom screenshot capture then failed with `Timed out running CDP command "Page.captureScreenshot" for tab 1`.

Code-level and browser metric fallback:

- `/editor`, `/dashboard`, `/projects`, `/wallet`, and `/exports` were checked at `1024px` wide as a `1280px` at `125%` layout proxy.
- All five routes reported `0` horizontal overflow.
- Sampled buttons, links, inputs, cards, and chat messages reported no left/right clipping.
- `/editor` composer remained visible in the viewport.

### Chat Renderer Status

- `ChatNativeEditor` now renders the main visible conversation through `ChatMessageList` and `ChatMessageRenderer`.
- Main thread messages are descriptor-driven: scenario status, planning progress, greeting, attachment/source sequence, setup questions, reference event, timing summaries, compiled intent, plan review, runtime user messages, revision responses, approval errors, progress, preview, and timeline link.
- Cards remain typed slots attached to message descriptors, which preserves current handlers and lazy imports.
- `PlanReviewApprovalCard` remains the single approval moment.
- Normal composer sends create a structured `user_message` plus a structured `assistant_revision_response`; they do not approve the plan or start progress.
- Approval failures render as structured `assistant_error` messages and do not approve credits, set approved state, or start progress.
- Progress and preview messages are structured and still render only after approval/progress readiness.

### SFX/Music Status

- SFX and music flows remain lazy-loaded and are not part of the default Guided editor render.
- Their visible `ChatMessage` blocks were upgraded to structured props where safe.
- Full descriptor-list conversion for SFX/music is deferred to avoid broad workflow churn.

### Remaining Risks

- Card payloads are still JSX slots rather than pure backend-renderable JSON.
- SFX/music subflows still use their own local state instead of the main `ChatMessageList` renderer.
- True 125% screenshot QA should be repeated when the browser tooling exposes writable zoom or device-scale controls.

## Prompt 8 Editor Visual Reset Audit

Screenshot review showed the editor still felt like a prototype inside a dashboard shell:

- `/editor` had two large identity regions: the standard app page header (`Chat-native editor`) and the project strip (`Premium real estate short`).
- The chat thread was framed by a heavy full-width `.chat-native-shell`, creating a card-inside-card feeling.
- Demo scenario and planning progress cards were the first visible chat items and read like internal/admin controls.
- The conversation was squeezed into a narrow centered panel while desktop space remained unused.
- Composer stickiness caused visible overlap with chat content in the first reset pass.
- Inline cards, especially source/planning cards, felt too heavily bordered and nested.
- Message labels and assistant turns felt more like debug output than a premium AI editing canvas.

## Prompt 8 Editor Visual Reset QA

### Changes Applied

- `AppShell` now supports `chrome="editor"`; the editor route keeps the sidebar but skips the standard topbar and footer note.
- `/editor` now has one visible `h1`: `Premium real estate short`.
- `MinimalProjectHeader` was tightened into the compact project/status strip.
- `.chat-native-shell` is now visually transparent with no border, background, or shell shadow.
- The chat workspace is a two-row editor canvas: scrollable conversation above and composer below, so the composer stays visible without covering cards.
- Demo scenario, scenario summary, and planning progress moved into a collapsed editor utility strip above the conversation.
- Assistant text-only turns are lighter; user bubbles are wider and restrained; inline cards use softer surfaces.
- `PlanReviewApprovalCard` remains the single approval moment.
- Structured chat descriptors and typed card slots were preserved.

### Browser Results

Screenshots saved under `docs/ui-ux-screenshots/prompt-8-editor-reset/`:

- `editor-1024.png`
- `editor-1280.png`
- `editor-1440.png`
- `editor-1728.png`
- `editor-1920.png`

Measured `/editor` at `1024px`, `1280px`, `1440px`, `1728px`, and `1920px` during the main browser pass:

- `0` horizontal overflow at every width.
- Composer did not overlap the scrollable thread.
- No sampled buttons, links, inputs, textareas, inline cards, or chat messages clipped left/right.
- Demo/planning utility controls were collapsed by default.
- `.chat-native-shell` measured transparent with no top border.

The first visual reset pass exposed composer overlap with the source card. The composer was changed from sticky overlay behavior to a two-row editor canvas with a scrollable thread above and composer below. A targeted post-fix browser check at `1024px` and `1440px` confirmed:

- composer fully visible
- no composer/thread overlap
- `0` horizontal overflow

The in-app browser then became unavailable with `Browser is not available: iab` before the full width set could be recaptured after the final composer-offset adjustment. The existing screenshot set remains saved, and the final code-level layout is stricter than the first pass because the composer no longer overlays the thread.

Regression checks at `1280px`:

- `/dashboard`: `0` horizontal overflow.
- `/projects`: `0` horizontal overflow.
- `/wallet`: `0` horizontal overflow.
- `/exports`: `0` horizontal overflow.

### Zoom Status

The browser surface did not expose a writable true zoom/device-scale control. The `1024px` editor screenshot is retained as the practical `1280px` at `125%` layout proxy. It passed no-overflow and composer-visibility checks.

### Remaining Editor Risks

- True 125% browser zoom screenshots should be repeated when tooling supports it.
- Source sequence and later approval cards are now inside the editor thread scroll area; future QA should include scrolled states and expanded utility panels.
- SFX/music expanded flows remain separate lazy subflows and still need deeper visual QA in a future milestone.

## Prompt 9 Editor Interaction and Scrolled-State Audit

Initial code inspection before Prompt 9 changes:

| Area | Status | Risk | Notes |
| --- | --- | --- | --- |
| Source sequence card | needs small fix | medium | Existing add, reorder, remove, note, role, important, optional, and confirm handlers are present. Rows are functional but dense and need clearer hierarchy, calmer flags, and stronger long-filename wrapping. |
| Source reorder buttons | pass | low | First/last disabled states exist and buttons have labels. Visual disabled state needs to read more intentionally. |
| Source add/remove | pass | low | Add mock clip and remove clip reset approval/progress correctly through source-change reset. Needs action row polish. |
| Source note input | needs small fix | medium | Notes work but textarea/label spacing can feel utility-like. Needs clearer field rhythm and focus visibility. |
| Important/optional flags | needs small fix | medium | Flags work but should look more like user-facing chips than raw checkboxes. |
| Reference URL row | needs small fix | medium | Current editor has attach-reference behavior but no first-class editable URL row in the reference card. |
| Reference attach | pass | low | Composer attach action sets a mock reference URL and resets approval/progress. |
| Reference skip | needs small fix | medium | No dedicated skip control is visible in the reference card. Add mock-safe skip UI without changing planner contracts. |
| Reference focus options | needs small fix | medium | No visible focus chip controls are present. Add local UI-only chips unless future planner input supports them. |
| Utility strip expansion/collapse | pass | low | `aria-expanded` and `aria-controls` are present. Expanded panel needs scrolled-state QA and lighter visual weight. |
| Demo scenario selector expanded state | pass | medium | Available in collapsed utility strip. Needs expanded screenshot pass. |
| Planning progress expanded state | needs small fix | medium | Functional but can still read like internal/admin status when expanded. Needs quieter surface styling. |
| PlanReviewApprovalCard | needs small fix | medium | Approval behavior is correct and centralized. Card needs clearer credit trust strip, calmer action hierarchy, and scrolled-state QA. |
| Approval checking state | pass | low | Loading state is passed through the approval card. Needs visual QA while scrolled. |
| Approval failure state | pass | low | Failures render as structured `assistant_error`; no approval/progress starts. Needs browser/code-path QA. |
| Approved/progress state | pass | low | Progress appears only after approval and snapshot creation. Needs scrolled screenshot. |
| Preview-ready state | pass | low | Preview appears after progress readiness. Needs scrolled screenshot. |
| Composer send/revision state | pass | low | Empty send guard and `Cmd/Ctrl+Enter` exist. Runtime user/revision messages are structured. |
| Lower cost action | pass | low | Creates structured revision response and does not start progress. |
| Remove Real Motion action | pass | low | Creates structured revision response and does not start progress. |
| Advanced details expansion | pass | medium | Lazy/collapsed behavior preserved. Expanded state needs future deep card QA. |
| Scrolled approval card near bottom | needs small fix | medium | Prompt 8 fixed composer overlap; Prompt 9 should verify final card reachability after card polish. |
| Scrolled state after progress/preview | needs small fix | medium | Needs screenshot/browser confirmation that composer and final messages remain reachable. |

## Prompt 9 Editor Interaction QA

Prompt 9 focused on interaction reliability inside the existing editor canvas. No duplicate header, double-shell container, approval gate, lazy boundary, or non-editor route logic was reintroduced.

### Source Sequence Status

- Source add, source order confirmation, reorder/remove/note/flag code paths remain wired through existing `ChatNativeEditor` handlers.
- `InlineSourceSequenceCard` now has clearer field grouping, calmer flag controls, safer wrapping, and stronger focus treatment.
- Source changes still reset approval, progress, preview readiness, and approved snapshot state through the existing source-change reset path.
- Current browser pass confirmed no horizontal overflow in the available in-app viewport after adding a mock clip and confirming source order.

### Reference Card Status

- `InlineReferenceDNACard` now supports mock-safe reference controls: editable URL, use reference, skip reference, and local focus chips.
- Reference attach, URL edit, and skip route through existing approval-reset behavior because `referenceUrl` affects the planner input.
- Focus chips are local UI metadata only in this milestone; they do not alter planner contracts.
- Reference DNA remains a style-study surface and keeps the no shot-for-shot-copy guidance.

### Required Setup / Guided Card Status

- Required setup cards remain visible only when needed.
- Planning progress remains inside the collapsed utility strip by default.
- Expanded utility panels now have bounded internal scrolling so demo/planning content does not cover the composer or force horizontal overflow.
- Advanced/developer details remain lazy and hidden unless warning/blocking rules make them visible.

### Plan Review / Approval Status

- `PlanReviewApprovalCard` remains the single approval moment.
- The credit approval strip and action row were tightened so the primary approve action is clearer and lower-cost/remove-Real-Motion/ask-question remain secondary.
- Approval-core still runs before approved state, approved snapshot creation, mock progress, or preview readiness.
- Lower-cost and remove-Real-Motion actions still create structured revision responses and do not start progress.

### Approval Failure Status

- Approval failure remains a structured `assistant_error` message.
- The failure path still clears approved state, approved snapshot, progress, progress index, and preview readiness.
- Failure copy continues to state that no credits were approved or used and mock progress did not start.

### Scrolled State Status

- Browser interaction QA exercised the source sequence, reference card, setup confirmations, plan review, approval, progress, preview, composer focus, and timeline trigger.
- A React duplicate-key warning surfaced in the Footage Prep activity list during the interaction run; the list now keys repeated mock activity ids with their render index to keep QA console output clean.
- The available in-app browser viewport was `599px` wide and did not expose a viewport resize capability, so fixed desktop-width screenshots could not be captured in this pass.
- In the available viewport, measured document horizontal overflow remained `false` after the full interaction flow.
- Because the available viewport is narrower than the desktop QA targets, desktop scrolled-state confidence is based on code-level layout checks, previous Prompt 8 desktop screenshots, typecheck, lint, and production build.

### Utility Strip Expanded State

- `Demo scenario` and `Planning details` keep `aria-expanded` and `aria-controls`.
- Expanded panels are visually secondary and internally scroll when tall.
- Browser interaction QA opened and closed both panels without page-level horizontal overflow.

### Screenshot / Browser QA Status

Screenshots saved under `docs/ui-ux-screenshots/prompt-9-editor-interactions/`:

- `editor-default-current.png`
- `editor-utility-expanded-current.png`
- `editor-planning-expanded-current.png`
- `editor-source-sequence-current.png`
- `editor-source-sequence-focused-current.png`
- `editor-reference-current.png`
- `editor-reference-attached-current.png`
- `editor-reference-focused-current.png`
- `editor-plan-review-current.png`
- `editor-plan-review-focused-current.png`
- `editor-approved-progress-current.png`
- `editor-preview-ready-current.png`
- `editor-preview-ready-focused-current.png`
- `editor-composer-focused-current.png`
- `editor-timeline-open-current.png`
- `editor-full-interaction-current.png`

Browser limitation:

- The in-app browser was usable for interactions and screenshots, but its available viewport was `599px` wide and no viewport resize capability was exposed.
- Prompt 9 fixed-width desktop captures at `1024px`, `1280px`, `1440px`, `1728px`, and `1920px` remain deferred to a browser surface with viewport control.

### Remaining Risks

- True fixed-width desktop screenshots for expanded/scrolled states remain deferred because this browser session could not resize the viewport.
- SFX/music expanded flows remain future polish work.
- Reference focus chips are local UI metadata until a future planner/message contract decides how to persist them.

## Revised Prompt 9 Floating Composer and Header Audit

Current screenshot review after the interaction polish shows the editor is still too segmented:

- The composer reads as a hard bottom row because it sits as the second row of the chat shell.
- The bottom composer area visually cuts the editor into conversation-above and input-below zones.
- The chat canvas feels smaller than it should because the composer consumes a full bottom panel.
- The composer should feel like a floating ChatGPT-style input inside the chat canvas, with deep-space background visible around it.
- The project strip is better than the previous duplicate app header, but it still has card-like weight and too much vertical priority.
- The editor needs less top chrome so the chat gets more usable vertical space.
- The utility strip still reads as a prototype workspace block, especially with the scenario label and planning mode copy visible.
- Demo/planning controls should remain available but behave like a tiny secondary control row by default.
- The real conversation and Plan Review need to feel like the product surface, not content squeezed between top chrome and a bottom footer.

## Revised Prompt 9 Floating Composer QA

### Header Changes

- `MinimalProjectHeader` now behaves as a slim status bar instead of a project card.
- The helper paragraph was removed; the strip keeps project title, approval status, wallet/credits, preview/estimate status, and project menu.
- The header surface is lighter, lower-shadow, lower-padding, and no longer sticky, which prevents it from overlapping the compact utility row during page scroll.

### Composer Changes

- `ChatComposer` now renders inside a transparent `.chat-composer-float-wrap`.
- The composer shell is the only surfaced element in the bottom input area; the wrapper has no background or border.
- The composer is centered in the chat canvas with background visible around it.
- The composer uses sticky/normal-flow placement inside the chat shell instead of fixed viewport/sidebar math.
- The textarea and helper/action row were compacted so the composer reads more like a chat input than a full bottom panel.

### Hard Bottom Row Removal

- `.chat-native-shell` no longer uses a visible two-row conversation/composer layout.
- The thread and floating composer share the same chat canvas grid area.
- The parent area around the composer remains transparent, avoiding a full-width footer band.
- Chat bottom safe space was increased so final cards can scroll above the floating composer.

### Utility Strip Changes

- The collapsed utility strip now reads as a compact secondary row: demo label, scenario name, category/mode, and two small controls.
- Expanded demo/planning panels remain inline, bounded, and internally scrollable.
- `aria-expanded` and `aria-controls` were preserved.

### Browser QA Results

Screenshots saved under `docs/ui-ux-screenshots/prompt-9-floating-composer/`:

- `editor-floating-composer-default-current.png`
- `editor-floating-composer-current.png`
- `editor-floating-composer-scrolled-current.png`
- `editor-utility-expanded-current.png`
- `editor-plan-review-current.png`

Measured in the available in-app browser viewport:

- No horizontal overflow.
- One visible editor heading remains.
- Floating composer stays within the editor shell.
- Composer wrapper background is transparent.
- Composer is visible after scrolling into the editor canvas.
- Plan Review remains present and approval-gated.

Browser limitation:

- The in-app browser was usable for interaction and screenshots, but it did not expose viewport resize control.
- Fixed-width captures at `1024px`, `1280px`, `1440px`, `1728px`, and `1920px` remain deferred to a browser surface with viewport control.

### Remaining Risks

- True fixed-width screenshots are still needed for the revised floating composer.
- Current narrow in-app viewport stacks the app shell below the sidebar, so desktop judgment still relies on CSS review, previous desktop captures, and production build validation.
- Expanded SFX/music flows remain future visual QA work.

## Prompt 10 Desktop Screenshot and Expanded Flow QA

Prompt 10 added a dedicated desktop QA plan and used the in-app browser viewport override for true desktop-width editor checks.

### Viewport Screenshot QA

Saved screenshots under `docs/ui-ux-screenshots/prompt-10-desktop-qa/`:

- `editor-default-1024.png`
- `editor-default-1280.png`
- `editor-default-1440.png`
- `editor-default-1728.png`
- `editor-default-1920.png`
- `editor-utility-expanded-1440.png`
- `editor-plan-review-1440.png`
- `editor-timeline-open-1440.png`
- `editor-timeline-open-full-1440.png`
- `editor-sfx-expanded-1440.png`
- `editor-sfx-details-open-1440.png`
- `editor-music-expanded-1440.png`
- `editor-music-details-open-1440.png`

Measured editor default state at `1024`, `1280`, `1440`, `1728`, and `1920`:

- `0` horizontal overflow at every width.
- One visible editor heading remained: `Premium real estate short`.
- Composer stayed visible.
- Composer wrapper stayed transparent.
- Minimal header stayed compact.

### 125% Zoom Status

- Browser viewport control was available, but no true zoom/device-scale capability was exposed.
- Browser metrics reported `devicePixelRatio: 1` and `visualViewport.scale: 1`.
- `1024px` editor capture is retained as the practical `1280px` at `125%` layout proxy.
- Code-level zoom review focused on fixed heights, scroll containers, grids, action rows, prompt text, provider labels, SFX/music score grids, and timeline wrappers.

### Advanced Timeline Status

- `DetailedTimelineDrawer` now renders as a labelled advanced region with a compact heading and accessible close action.
- Timeline content is wrapped in a bounded drawer body and a horizontal scroll wrapper.
- Drawer metrics at `1440px` reported `0` document overflow; drawer body stayed bounded with internal scrolling.
- The drawer appears below the editor canvas because it is a route sibling of `ChatNativeEditor`; a full-page screenshot was saved to show the complete open state.

### SFX Expanded Status

- `SFXPlanChatFlow` remains lazy and optional.
- Visible SFX flow now has a `soundflow-panel` wrapper.
- SFX plan review and SFX credit approval remain visible.
- Dense project integration, event, provider route, prompt preview, timing/trim, mix, QA, and library details moved behind a compact `SFX planning details` disclosure by default.
- Expanded and detail-open browser states at `1440px` reported `0` horizontal overflow and retained the floating composer.

### Music / SoundSync Expanded Status

- `MusicPlanChatFlow` remains lazy and optional.
- Visible music flow now has a `soundflow-panel` wrapper.
- Context, cue sheet approval, and credit approval remain visible.
- Detailed cue cards and Lyria prompt preview moved behind a compact `Music cue details` disclosure by default.
- Expanded and detail-open browser states at `1440px` reported `0` horizontal overflow and retained the floating composer.

### Non-Editor Route Regression

Checked at `1280px`:

- `/`: `0` horizontal overflow.
- `/dashboard`: `0` horizontal overflow.
- `/projects`: `0` horizontal overflow.
- `/projects/new`: `0` horizontal overflow.
- `/wallet`: `0` horizontal overflow.
- `/pricing`: `0` horizontal overflow.
- `/brand-kit`: `0` horizontal overflow.
- `/exports`: `0` horizontal overflow.

### Issues Fixed

- The first default screenshot attempt captured the route loading fallback; screenshots were recaptured after the editor heading became visible.
- Deep editor controls could scroll under the floating composer during automation. `.chat-native-thread` now has bottom scroll padding so scroll-to-focus behavior leaves breathing room above the composer.
- SFX/music score grids now use safer auto-fit tracks and wrapping.
- Prompt/provider text now has safer long-text wrapping.

### Deferred

- True 125% browser zoom screenshots remain deferred until a zoom/device-scale capability is available.
- Full descriptor-list migration for SFX/music remains deferred.
- Timeline drawer could be moved into the editor canvas in a future route-structure pass if the product wants it visually closer to the chat thread.

## Prompt 11 SFX/Music/Timeline QA

Prompt 11 migrated the lazy SFX and Music/SoundSync subflows to local descriptor-list rendering and moved the advanced timeline drawer into the editor chat canvas.

### SFX Expanded Flow Status

- `SFXPlanChatFlow` remains lazy and optional.
- Visible SFX messages now render through `ChatMessageList` using SFX-specific descriptors and typed card slots.
- SFX director plan, SFX credit estimate, revision response, generation progress, and revision options are descriptor-backed.
- Provider route, prompt preview, event cards, timing/trim, mix, QA detail, project integration, and library candidate details remain collapsed under `SFX planning details`.
- Browser QA opened the SFX flow through the visible `Plan SFX with SoundSync` action and measured no horizontal overflow at `1440px`.

### Music / SoundSync Expanded Flow Status

- `MusicPlanChatFlow` remains lazy and optional.
- Visible music messages now render through `ChatMessageList` using Music/SoundSync descriptors and typed card slots.
- Context, cue sheet approval, credit estimate, revision response, progress, QA/mix summary, and revision options are descriptor-backed.
- Detailed cue cards and Lyria prompt preview remain collapsed under `Music cue details`.
- Browser QA opened the Music/SoundSync flow through the visible `Plan music with SoundSync` action and measured no horizontal overflow at `1440px`.

### Timeline Placement Status

- `DetailedTimelineDrawer` remains lazy-loaded from `EditorPage`.
- The drawer now renders inside the editor chat canvas through an `advancedTimelineSlot` passed to `ChatNativeEditor`.
- The timeline still has a labelled region, compact heading, accessible close action, internal body scroll, and horizontal timeline scroll wrapper.
- Browser QA opened the timeline from `Show detailed timeline only if I ask`, auto-scrolled it into view above the floating composer, and measured no horizontal overflow at `1440px`.

### Browser QA Results

Screenshots saved under `docs/ui-ux-screenshots/prompt-11-soundflow-timeline/`:

- `editor-default-1024.png`
- `editor-default-1280.png`
- `editor-default-1440.png`
- `editor-default-1728.png`
- `editor-default-1920.png`
- `editor-utility-expanded-1440.png`
- `editor-timeline-open-1440.png`
- `editor-sfx-expanded-1440.png`
- `editor-music-expanded-1440.png`

Measured editor overflow:

- `/editor` at `1024`, `1280`, `1440`, `1728`, and `1920`: no document-level horizontal overflow.
- Utility expanded at `1440`: no document-level horizontal overflow.
- Timeline open at `1440`: no document-level horizontal overflow.
- SFX expanded at `1440`: no document-level horizontal overflow.
- Music expanded at `1440`: no document-level horizontal overflow.

Non-editor regression check at viewport override `1280`:

- `/`, `/dashboard`, `/projects`, `/projects/new`, `/wallet`, `/pricing`, `/brand-kit`, and `/exports`: no document-level horizontal overflow.

Zoom status:

- Browser capabilities exposed `visibility` and `viewport`.
- No true zoom or device-scale capability was exposed.
- `devicePixelRatio` and visual viewport scale remained `1`; true `125%` zoom screenshots remain deferred.

### Remaining Risks

- True browser zoom/device-scale screenshots still need future tooling support.
- SFX/Music cards still render as JSX slots; pure backend JSON card payload rendering remains future work.
- Formal automated viewport QA remains documentation-only until the project accepts a browser automation dependency.

## Prompt 12 Approved Mocked Browser E2E QA

Prompt 12 added a Playwright browser QA harness after confirming there was no existing browser E2E tool in the repo.

### Tooling Status

- Added `@playwright/test` as a dev dependency.
- Added Chromium-only Playwright config.
- Added package scripts for E2E, viewport, editor, expanded-flow, screenshot, and zoom QA.
- Added sparse `data-testid` selectors only to stable shell/editor surfaces.
- Playwright output folders are ignored; docs screenshots remain committable.

### Automated QA Results

- `qa:viewport`: 45 passed across `/`, `/dashboard`, `/projects`, `/projects/new`, `/editor`, `/wallet`, `/pricing`, `/brand-kit`, and `/exports` at `1024`, `1280`, `1440`, `1728`, and `1920`.
- `qa:editor`: 6 passed, 1 skipped. The skipped approval-failure test documents that no safe user-facing mock failure trigger exists.
- `qa:expanded`: 3 passed for utility expansion, SFX details, and Music cue details.
- `qa:zoom`: 2 passed using the `1024px` proxy and Chromium page-scale.
- `qa:screenshots`: 3 passed and saved Prompt 12 screenshots.
- `test:e2e`: 59 passed, 1 skipped.

### Editor Regression Coverage

- Floating composer remains visible and does not span like a hard footer.
- Minimal editor header remains the only editor heading.
- Normal composer send creates a revision response and does not start progress.
- Plan approval is required before mock progress and preview appear.
- Source add/reorder/remove/notes/flags are covered.
- Reference skip/URL/attach/focus controls are covered.
- Advanced timeline opens inside the editor canvas and closes cleanly.
- SFX and Music/SoundSync remain optional, lazy, descriptor-rendered flows with advanced details collapsed by default.

### Screenshot Artifacts

Saved under `docs/ui-ux-screenshots/prompt-12-e2e/`:

- editor defaults at `1024`, `1280`, `1440`, `1728`, and `1920`
- utility expanded at `1440`
- plan review at `1440`
- timeline open at `1440`
- zoom proxy and page-scale screenshots
- dashboard/projects/wallet/exports at `1280`

### Remaining Risks

- Chromium page-scale is useful practical coverage, but final human QA should still spot-check true browser zoom in a real desktop browser when release risk is high.
- Approval failure is not browser-clickable without adding a debug control, so the browser test is intentionally skipped until a safe mock scenario exists.

## Prompt 13 Approval Failure and CI Browser QA

Prompt 13 closed the skipped approval-failure E2E gap and added a CI workflow for UI QA.

### Approval Failure Trigger

- `/editor?qaApprovalFailure=1` now forces a mocked approval block only in dev or E2E mode.
- The flag is guarded by `import.meta.env.DEV || import.meta.env.VITE_REEDITPRO_E2E === 'true'`.
- No visible debug UI was added.
- Normal production builds without the E2E env ignore the query flag.

### Failure Behavior Verified

The browser test confirms:

- `assistant_error` appears through `approval-error-message`.
- Header remains `Waiting for approval`.
- `generation-progress-card` does not appear.
- `preview-ready-card` does not appear.
- Error copy states that no credits were approved or used.
- Floating composer remains visible.
- No horizontal overflow appears.

### CI Workflow

Created `.github/workflows/ui-qa.yml`.

The workflow runs:

- `npm ci`
- `npx playwright install --with-deps chromium`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- `npm run test:e2e`

Artifacts:

- `playwright-report`
- `test-results/e2e`

### Prompt 13 Browser Results

- `qa:editor`: 7 passed.
- `test:e2e`: 60 passed.

The previous intentional approval-failure skip is gone.

### Audit Note

`npm audit --audit-level=moderate` still reports 5 moderate findings in the existing `@google-cloud/storage` dependency chain. The suggested force fix would install a breaking `@google-cloud/storage@5.20.4`, so no audit fix was applied in this UI QA milestone.

## Prompt 14 CI and Audit QA

Prompt 14 hardened the existing Playwright QA posture without changing product logic or editor UI.

### Audit Triage

- `npm audit --json` and `npm audit --audit-level=moderate` report 5 moderate findings.
- The findings are all in the existing `@google-cloud/storage` chain.
- Primary advisory: `GHSA-w5hq-g745-h8pq` for `uuid <11.1.1`.
- npm's available force fix would install `@google-cloud/storage@5.20.4`, a breaking downgrade from the current `@google-cloud/storage@^7.19.0` range.
- No audit fix was applied.

### Frontend Exposure

- `@google-cloud/storage` is imported only by `server/storage/gcs-storage-adapter.ts`.
- No browser route or `src/**` frontend module imports the GCS client or the vulnerable transitive packages.
- Current Vite output does not include `@google-cloud/storage`, `gaxios`, `teeny-request`, or `retry-request`.
- `uuid` strings in current frontend chunks are Supabase schema metadata text, not the vulnerable package implementation.

### CI Artifact Polish

- `.github/workflows/ui-qa.yml` now uploads separate artifacts for the Playwright report, raw Playwright test results, and UI screenshots.
- CI writes a `ReeditPro UI QA` step summary with viewport coverage, approval-failure coverage, screenshot path, and Vite warning review notes.
- Screenshot artifacts continue to come from `docs/ui-ux-screenshots/prompt-12-e2e/`.

### Approval Failure Guard

- The `/editor?qaApprovalFailure=1` path remains hidden and guarded by `DEV` or `VITE_REEDITPRO_E2E=true`.
- It still uses the existing approval-blocking path and does not approve, start progress, show preview, or imply credit use.

### Remaining Risks

- The first remote GitHub Actions run still needs confirmation.
- The GCS audit chain needs a dedicated dependency/security remediation milestone once a safe non-breaking fix or backend dependency split is ready.
- Chromium page-scale remains practical zoom coverage, not complete parity with every desktop browser zoom implementation.

### Prompt 14 Validation

- `npm audit --audit-level=moderate`: 5 moderate findings remain documented; command exits nonzero as expected.
- Typecheck: passed.
- Lint: passed.
- Build: passed with no Vite `>500 kB` warning.
- `test:e2e`: 60 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.

## Prompt 16 Floating Composer Scroll-Under Audit

Prompt 16 targets the final editor composer behavior. The current composer is already floating and no longer reads as a full hard footer, but it still needs the more professional ChatGPT-style scroll-under treatment.

Current audit notes before implementation:

- The composer sits in the editor canvas, but the surrounding scroll/fade behavior can still feel more like a sticky element than a layered input surface.
- Messages and cards should visually pass under the composer region and disappear through a soft bottom fade.
- The bottom fade/mask is missing or insufficient for the final premium scroll-under behavior.
- Composer width should be aligned to the main chat/message column, not the full app viewport.
- The composer must keep visible background around it and avoid any hard horizontal divider or bottom panel.
- The last message/card must be able to scroll fully above the composer so no actions are hidden.
- `PlanReviewApprovalCard` actions must remain reachable above the composer.
- Source sequence, reference, setup, advanced timeline, SFX, and Music/SoundSync expanded states must remain safe with the composer overlay.
- Structured chat descriptors, approval gates, preview/progress timing, and lazy SFX/Music/timeline loading must remain unchanged.

## Prompt 16 Composer Scroll-Under QA

Prompt 16 implemented the final editor composer overlay without changing product logic, approval behavior, route structure, or lazy subflow loading.

### Implementation Summary

- `.chat-native-shell` is now the positioning context for the chat thread, fade layer, and composer layer.
- `.chat-native-thread` keeps the message/card scroll flow and has expanded bottom padding plus scroll padding so final actions can move above the overlay.
- `.chat-composer-fade` is a non-interactive, `aria-hidden` bottom gradient that sits above messages and below the composer.
- `.chat-composer-layer` centers the composer to the chat column and disables pointer events except on the composer shell.
- The composer remains a surfaced glass input only; no full-width footer panel or hard divider was added.

### Reachability And State QA

- `PlanReviewApprovalCard` approve actions can scroll above the composer.
- Source sequence add/reorder controls and reference controls remain reachable above the composer.
- Timeline, utility, SFX, and Music/SoundSync expanded states keep the composer floating and report no horizontal overflow.
- Structured chat descriptors, `ChatMessageList`, `ChatMessageRenderer`, approval error messages, progress, preview, and revision responses were preserved.
- Generation/progress still starts only after plan and credit approval.

### Automated Results

- `test:e2e`: 61 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.
- `git diff --check`: passed.

Screenshots saved under `docs/ui-ux-screenshots/prompt-16-floating-composer-scroll/`:

- editor default at `1024`, `1280`, `1440`, `1728`, and `1920`
- plan review above composer
- source sequence above composer
- timeline with composer
- utility expanded
- SFX and Music/SoundSync with composer
- zoom proxy and Chromium page-scale screenshots
- selected non-editor route regression captures at `1280`

### Remaining Risks

- Chromium page-scale remains practical zoom coverage, not a perfect model of every desktop browser zoom implementation.
- The expanded utility panel can push the editor canvas lower on the page; the Playwright check scrolls the canvas into view before validating composer alignment.

## Composer Fix Prompt 1 Audit

The follow-up screenshot review shows that the composer has the right overlay structure but the wrong visual ownership.

- Dark outer shell source: `.chat-composer-shell` currently owns the dark glass background, border, elevated shadow, backdrop blur, full-width sizing, and padding. Because it spans the overlay width, it reads as a wide bottom panel.
- Visible input shell source: before this fix there is no separate inner input surface; the outer `.chat-composer-shell` is both the layout wrapper and visual shell.
- Composer vertical offset source: `.chat-composer-layer` / `.chat-composer-float-wrap` use `bottom: var(--rp-composer-bottom-offset)`.
- Composer width source: `.chat-composer-layer` uses `max-width: min(var(--rp-composer-max), calc(100% - var(--rp-space-6)))`; `.chat-composer-shell` then fills that full width.
- Scroll container source: `.chat-native-thread` owns the editor message/card scroll area.
- Bottom safe space source: `.chat-native-thread` uses `padding-bottom: var(--rp-chat-scroll-bottom-safe-space-expanded)` and matching scroll padding.
- Fade/mask status: `.chat-composer-fade` already exists as a DOM layer with `aria-hidden` and `pointer-events: none`, but the wide composer shell makes the fade feel more like a bottom panel.
- Test updates needed: assert the wrapper is transparent/layout-only, assert the new inner input shell is the surfaced element, keep fade and reachability checks, and refresh Prompt 16 screenshots.

## Composer Fix Prompt 1 Results

This pass changed only the composer layer and scroll-under behavior.

- Dark shell removal: `.chat-composer-shell` is now transparent/layout-only with no background, border, shadow, or backdrop blur.
- Surfaced input: `.chat-composer-input-shell` is the only glass composer surface and is capped below the full chat column width.
- Lower placement: `--rp-composer-bottom-offset` is now `8px` desktop and `6px` compact, keeping the input closer to the lower edge while leaving breathing room.
- Fade: `.chat-composer-fade` remains a DOM layer, is still `aria-hidden`, keeps `pointer-events: none`, and is now bounded around the surfaced composer width instead of the full thread width.
- Reachability: plan approval, source sequence, reference, timeline, SFX, and Music/SoundSync checks still pass above the composer.
- Product behavior: structured chat, approval gates, progress timing, lazy SFX/Music/timeline loading, and mock-only behavior are unchanged.

Validation:

- `check:frontend-boundary`: passed.
- Typecheck: passed.
- Lint: passed.
- Build: passed with no Vite `>500 kB` warning.
- `test:e2e`: 61 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.

## Composer Correction 1B Audit

The Prompt 1 fix removed the wide outer wrapper, but the visible composer still looked like a form card.

- Large visible dark card source: `.chat-composer-input-shell` was still a surfaced grid container around attachments, visible label, textarea, helper text, mic, and send.
- Nested textarea box source: global `.chat-native-input textarea` styling applied a dark background, border, padding, and focus ring inside the surfaced composer.
- Excess vertical height sources: the attachment tray row, visible `Message ReeditPro` label row, `68px` textarea, visible helper text row, and separate control row.
- Text rows to hide: `Message ReeditPro` and `Plan first. Approve credits. Then the AI edits in the background.` can be screen-reader-only because approval/credit rules are already enforced by the plan and credit approval UI.
- E2E updates needed: assert one compact composer surface, hidden label/helper rows, no nested textarea card border/background, surface height under `120px`, lower placement, fade preservation, and reachability.

## Composer Correction 1B Results

This correction changed only the composer UI shape, size, and placement.

- Large composer card removed: `.chat-composer-input-shell` was replaced by `.chat-composer-surface`, a single compact horizontal glass input.
- Label/helper removal: `Message ReeditPro` and the plan/approval helper copy remain available to assistive tech but no longer render as visible rows.
- Textarea integration: the composer textarea is transparent, borderless, non-resizable, capped at `128px`, and visually part of the same input surface.
- Attachment compaction: add clip and reference actions are compact icon buttons with accessible labels/titles.
- Lower placement: composer offset is now `6px` desktop and `4px` compact.
- Height reduction: automated QA enforces the composer surface under `120px`; screenshots show the default composer as a compact input instead of a large card.
- Fade preservation: `.chat-composer-fade` remains present, non-interactive, and behind the composer.

Validation:

- `check:frontend-boundary`: passed.
- Typecheck: passed.
- Lint: passed.
- Build: passed with no Vite `>500 kB` warning.
- `test:e2e`: 61 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.

Screenshots saved under `docs/ui-ux-screenshots/prompt-16b-compact-composer/`.

## Composer Fix 1C Audit

The hard correction identified the remaining card feeling as the composer surface itself, not the overlay wrapper.

- Remaining visible card source: `.chat-composer-surface` still had a heavy dark glass background, large radius, elevated shadow, full-width surface sizing, and `8px` padding.
- Nested textarea look source: the textarea was technically transparent, but the larger surfaced container plus `44px` minimum textarea height still read as a form field inside a card.
- Excess height sources: `40px` icon buttons, default `md` send button height, the textarea's `44px` minimum, and the surface padding.
- Visual styles removed or reduced: surface opacity, border contrast, shadow depth, radius weight, padding, control size, textarea default height, and fade height.
- E2E protection added: default composer surface height is now capped at `76px`, textarea height is capped at `44px`, labels/helper text must remain clipped to `1px`, and attachment actions must remain inline.

## Composer Fix 1C Results

Composer Fix 1C changed only the composer input shape and its test/documentation surface.

- Large visible composer card removal: `.chat-composer-surface` is now a compact pill-like input rail with lighter glass, softer border, smaller shadow, and tighter padding.
- Label/helper removal: `Message ReeditPro` and the approval helper remain `sr-only` and consume no visible row.
- Textarea integration: the textarea is one-line by default, transparent, borderless, shadowless, non-resizable, and internally scrollable for long input.
- Attachment/reference compaction: add clip and reference actions remain accessible icon buttons integrated into the left side of the bar.
- Lower placement: the composer uses a `4px` bottom offset on desktop and compact layouts.
- Fade preservation: `.chat-composer-fade` remains present, bounded, `aria-hidden`, and `pointer-events: none`.
- Reachability: plan approval, source/reference controls, timeline, SFX, and Music/SoundSync states continue to pass above-composer reachability and overflow checks.

Validation:

- `check:frontend-boundary`: passed.
- Typecheck: passed.
- Lint: passed.
- Build: passed with no Vite `>500 kB` warning.
- `test:e2e`: 61 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.

Screenshots saved under `docs/ui-ux-screenshots/prompt-16c-true-compact-composer/`.

## Composer Fade Fix 16D Results

This pass changed only the composer fade/underlay after screenshot review showed a ghost panel behind the compact input.

- Source of the ghost panel: `.chat-composer-fade` used a tall rectangular linear gradient behind the input. The composer wrapper and layer were already transparent.
- Fade implementation: the fade is now a shorter radial underlay with low alpha stops instead of a full-width dark rectangular fill.
- Panel removal: the fade remains inside the editor canvas, does not create horizontal overflow, and no longer has a hard left/right edge or a dark block behind the composer.
- Preserved behavior: `chat-composer-fade` remains in the DOM, `aria-hidden`, non-interactive, and below the composer surface.
- Product behavior: compact composer, structured chat, approval gates, progress timing, and lazy SFX/Music/timeline flows are unchanged.

Validation:

- `check:frontend-boundary`: passed.
- Typecheck: passed.
- Lint: passed.
- Build: passed with no Vite `>500 kB` warning.
- `test:e2e`: 61 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.

Screenshots saved under `docs/ui-ux-screenshots/prompt-16d-fade-ghost-panel-removal/`.

## Composer Occlusion Mask 16E Results

This pass fixed the remaining scroll-under issue where cards passed behind the composer but stayed visible through or around the input zone.

- Cause: the compact composer was semi-transparent and had no true occlusion layer behind it, so underlying card content could remain visible through the input shell.
- Width issue: inline chat cards used the wider chat lane, while the composer rail was narrower. Card edges could therefore peek out around the composer instead of sliding cleanly underneath it.
- Occlusion implementation: `chat-composer-occlusion` now sits exactly behind the compact composer surface, matches its width/height, uses `pointer-events: none`, and blocks passing content inside the input footprint.
- Card lane implementation: inline chat cards now use a `--rp-chat-card-max` lane that is slightly smaller than the composer rail and centered under it.
- Message alignment: assistant messages that render cards now stretch to the chat lane and center their card stack, while text-only assistant messages keep their existing conversational alignment.
- Preserved behavior: compact composer markup, approval gates, structured chat, progress timing, source/reference controls, timeline, SFX, and Music/SoundSync behavior are unchanged.

Validation:

- `check:frontend-boundary`: passed.
- Typecheck: passed.
- Lint: passed.
- Build: passed with no Vite `>500 kB` warning.
- `test:e2e`: 61 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.

Screenshots saved under `docs/ui-ux-screenshots/prompt-16e-composer-occlusion-mask/`.

## Card Fix Prompt 2 Audit

Prompt 17 reviewed the AI-provided chat cards after the compact composer and occlusion work. The main issue was visual hierarchy: the composer was finally behaving like a compact input, but several assistant cards still read as large dashboard/admin modules.

- `InlineSourceSequenceCard`: widest and tallest offender. Clip rows had heavy nested surfaces, large preview blocks, full control visibility, and too much vertical bulk for a chat-attached card.
- `InlineReferenceDNACard`: helpful but too technical by default. The DNA detail grid made the optional reference flow feel like a configuration panel.
- `InlineDemoScenarioSelector`: useful prototype control, but the grid/card density needed to stay secondary to the main editor conversation.
- `InlinePlanningProgressCard`: status content was acceptable, but shared card padding and row gaps made it feel heavier than needed.
- Workflow/setup cards: shared `.inline-chat-card` styling was too broad and allowed cards to compete with the composer width.
- `PlanReviewApprovalCard`: should remain the strongest approval surface, but still needed a controlled width and tighter credit/summary/action areas.
- `AIEditingProgressStage` and `PreviewReadyCard`: no logic changes needed; they benefit from the shared card width and no-overflow assertions.
- Advanced planning details/card shell: should stay collapsed or secondary, with compact summary spacing.

E2E guardrails needed for this pass:

- Normal inline cards must not exceed the compact composer rail.
- Source, reference, and plan review actions must remain reachable and clickable.
- Cards must not create horizontal overflow at viewport and zoom sizes.
- Screenshot artifacts should capture source, reference, plan review, utility, SFX, Music, and zoom states.

## Card Fix Prompt 2 Results

Prompt 17 changed the AI card visual density and width hierarchy only. Composer shape, fade, occlusion, approval flow, structured messages, and product logic were left intact.

- Card width hierarchy: normal AI cards now use a narrower `--rp-chat-card-max` lane, compact utility/reference cards use `--rp-chat-card-compact-max`, and source/plan cards use the controlled `--rp-chat-card-wide-max` lane.
- Global inline card density: `.inline-chat-card` has quieter glass, smaller gaps, lighter borders, reduced shadows, and tokenized padding.
- Source Sequence polish: rows are more compact, preview affordances are chip-sized, filenames/durations/roles are tighter, flags/actions are smaller, and source-mode options moved behind a compact disclosure.
- Reference polish: URL/focus controls are lighter, long URLs stay wrapped, focus chips are smaller, and technical DNA details are collapsed behind `Style cues ReeditPro will study`.
- Plan Review polish: the approval card remains the most important card, but credit summary, system chips, structure details, and action rows are tighter and width-controlled.
- Demo/planning utility polish: scenario and planning utility cards remain usable but visually secondary through compact grids and quieter status rows.
- Message/card alignment: text-only assistant messages keep conversational measure, while card-bearing assistant messages center their card stack under the chat lane.

Validation:

- `check:frontend-boundary`: passed.
- Typecheck: passed.
- Lint: passed.
- Build: passed with no Vite `>500 kB` warning.
- `test:e2e`: 61 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.

Screenshots saved under `docs/ui-ux-screenshots/prompt-17-card-density/`.

## Conversation Rhythm Prompt 3 Audit

Prompt 18 reviewed the editor chat after compact composer and card-density work. The UI was structurally correct, but the conversation cadence still needed polish.

- User/assistant spacing used a single message-list grid gap, so consecutive same-speaker messages could feel like separate sections.
- Assistant labels repeated on every message, including follow-up assistant turns, creating unnecessary visual noise.
- Assistant text and attached cards were structurally connected, but the spacing needed a named attachment rhythm rather than hardcoded gaps.
- Card stacks used compact card-density spacing, but the relationship between intro copy and first card needed explicit E2E protection.
- Text-only assistant messages were readable but could be slightly narrower and lighter so cards remain the stronger structured moments.
- User bubbles were functional but needed tokenized padding to keep future rhythm changes consistent.
- SFX/Music flows already use `ChatMessageList`, so the same grouping and label rhythm can apply without changing lazy-loading or product logic.
- Target classes for adjustment: `ChatMessageList`, `ChatMessageRenderer`, `ChatMessage`, `.chat-message-list`, `.chat-native-message`, `.chat-message-label`, and `.chat-message-card-stack`.

## Conversation Rhythm Prompt 3 Results

Prompt 18 changed only visual message rhythm and test/docs coverage.

- Role grouping: `ChatMessageList` now computes adjacent same-role groups and passes `single`, `first`, `middle`, or `last` group positions into rendered messages.
- Label rhythm: group-leading labels remain visible; repeated same-role continuation labels are visually clipped while remaining in the DOM for assistive context.
- Spacing rhythm: chat turn gaps, grouped-message gaps, label gaps, card attachment gaps, and bubble padding now use dedicated tokens.
- Text/card attachment: card-bearing assistant messages keep cards close to their intro copy and centered in the bounded card lane.
- Text-only rhythm: assistant text is slightly narrower and user bubbles use compact tokenized padding.
- SFX/Music alignment: because SFX and Music render through `ChatMessageList`, their expanded flows inherit the same grouping and label rhythm.
- Product behavior: composer, card structures, approval gates, progress timing, lazy-loaded SFX/Music/timeline flows, and backend boundaries are unchanged.

Validation:

- `check:frontend-boundary`: passed.
- Typecheck: passed.
- Lint: passed.
- Build: passed with no Vite `>500 kB` warning.
- `test:e2e`: 61 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.

Screenshots saved under `docs/ui-ux-screenshots/prompt-18-message-rhythm/`.

## Composer Thread Mask Correction Results

The follow-up composer investigation found that the compact input itself was correct, but the scroll-under disappearance was happening too late. The source card passed behind the composer, then remained visible below the input rail, which made the card look like it was sliding out under the textbox instead of being hidden by the foreground composer.

- Cause: the previous implementation relied on a composer-sized occlusion pill plus a soft visual fade layer. That blocked content inside the input footprint, but it did not mask the scrolling chat lane before the content reached the bottom of the composer zone.
- Fix: `.chat-native-thread` now owns a bottom `mask-image` / `-webkit-mask-image` gradient. Chat cards stay fully visible above the composer, begin fading as they enter the input zone, and are transparent before the bottom edge of the compact input.
- Preserved layers: `chat-composer-fade` remains a subtle non-interactive polish layer, and `chat-composer-occlusion` remains aligned behind the compact input rail.
- Preserved scope: no composer markup, card structure, approval flow, source/reference logic, SFX/Music lazy flow, or product behavior changed.

E2E coverage now verifies that the scroll thread has an inspectable linear mask, the fade remains non-interactive, the occlusion stays aligned to the composer rail, and the existing compact composer/card/no-overflow checks remain active.

Validation:

- `check:frontend-boundary`: passed.
- Typecheck: passed.
- Lint: passed.
- Build: passed with no Vite `>500 kB` warning.
- `test:e2e`: 61 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.

## Final Editor Polish Prompt 4 Audit

Prompt 19 reviewed final interaction quality rather than layout redesign.

- Composer attach/reference controls: pass after adding default icon-button titles; focus treatment remains inside the compact rail.
- Composer mic mock/disabled state: pass; remains disabled, labelled, titled, and visually unavailable.
- Composer send action: pass; keyboard send remains guarded and does not start generation before approval.
- Source reorder/delete/icon controls: small fix; default titles make compact icon actions clearer, while existing labels remain accessible.
- Source important/optional flags: small fix; hover/focus-within now reads as intentional without adding glow.
- Source role select and notes field: small fix; focus-visible treatment is clearer and not clipped.
- Reference URL/focus chips/actions: small fix; focus chips now have clearer focus shadow and calmer hover.
- Utility strip controls: pass; existing active/expanded state remains bounded.
- PlanReviewApprovalCard actions: pass; button focus/hover inherits the standardized button treatment.
- Timeline close controls: pass after default icon-button titles; keyboard close remains covered.
- SFX/Music details summaries: small fix; details summaries now have consistent hover/focus treatment.
- Progress and preview cards: pass; no interaction logic or display timing changed.
- Advanced details disclosures: pass/deferred; generic details summary focus treatment improves keyboard discoverability without expanding advanced content by default.

Risk level: low. Changes are limited to CSS affordances, icon-button title defaults, Playwright assertions, docs, and screenshots.

## Final Editor Polish Prompt 4 Results

Prompt 19 completed the final interaction QA pass without changing editor product logic.

- Hover/focus: editor controls now use calmer, consistent button/icon/chip/disclosure focus treatment with visible keyboard affordances.
- Compact actions: `IconButton` now defaults browser `title` text from its accessible label, improving source reorder/delete, composer, timeline, and disabled mock controls.
- Keyboard QA: added `editor-keyboard.spec.ts` covering composer newline/send behavior, source/reference controls, plan approval reachability, timeline close, and SFX/Music details summaries.
- Approval journey: existing success and guarded failure E2E checks remain intact; progress and preview still appear only after approval.
- Screenshots: final review artifacts were captured under `docs/ui-ux-screenshots/prompt-19-final-editor-polish/`.

Validation:

- `check:frontend-boundary`: passed for 470 files.
- Typecheck: passed.
- Lint: passed.
- Build: passed with no Vite `>500 kB` warning.
- `test:e2e`: 64 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.

## Prompt 20 Manual Visual Signoff + Targeted Bug Triage

Prompt 20 reviewed the final editor state rather than redesigning it. The manual review used Prompt 19 screenshots as the current baseline and compared Prompt 18, Prompt 17, Prompt 16c, and Prompt 12 screenshots only for regression context.

Manual signoff summary:

- First impression: pass with notes. The editor reads as premium chat-first AI editing software. The remaining density is mostly demo/planning copy, not a layout regression.
- Header: pass. The project header remains compact and does not duplicate route chrome.
- Composer: pass. The compact floating composer, integrated textarea, low placement, scroll-under mask, and no-footer behavior remain intact.
- Chat rhythm: pass. Message grouping, quieter repeated labels, and card-to-message attachment remain intact.
- Cards: pass with notes. Source, reference, and plan review cards remain bounded and user-facing. SFX/Music planning entry cards are accepted as broad planning actions for this milestone.
- Interaction: pass. Focus, hover, keyboard, approval success, approval failure, timeline close, and SFX/Music disclosure behavior remain covered.
- Layout: pass. No horizontal overflow or hidden action issue was found in the screenshot review or existing Playwright invariants.

Targeted fix applied:

- `captureDocScreenshot` now moves the pointer away before taking docs screenshots. This is screenshot hygiene so hover states or browser-native title artifacts do not pollute final signoff artifacts.

Deferred issues:

- Copy density in mocked planning content remains accepted for the current frontend-only demo.
- Further SFX/Music visual hierarchy polish is deferred to a future soundflow-specific milestone.
- No product UI, approval flow, planner behavior, backend behavior, or dependency change was made.

Final signoff status: pass with notes.

Prompt 20 screenshot target:

- `docs/ui-ux-screenshots/prompt-20-manual-signoff/`

Validation:

- `check:frontend-boundary`: passed for 469 files.
- Typecheck: passed.
- Lint: passed.
- Build: passed with no Vite `>500 kB` chunk warning.
- `test:e2e`: 64 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.
- `git diff --check`: passed.

## Prompt 21 Copy Density + User-Facing Language Polish

Prompt 21 focuses only on `/editor` copy density. Layout, product logic, approval behavior, compact composer structure, card density, message rhythm, lazy SFX/Music flows, and backend boundaries are unchanged.

Copy audit summary:

- Main chat messages were shortened so ReeditPro sounds like a calm editing assistant instead of a planning prototype.
- Source Sequence helper text, warnings, note placeholder, and add action were tightened.
- Reference copy now emphasizes optional style guidance and keeps "studied, not copied" trust language.
- Plan Review now uses a shorter approval heading, clearer summary labels, and a single concise credit trust note.
- Progress and preview copy now use one concise demo-safe note instead of repeated frontend/mock/backend explanations.
- Demo/planning copy is quieter, and SFX/Music visible copy focuses on timing, mix, credits, and revision choices.
- Provider/prompt/library details remain available only in explicit details/advanced surfaces.

Prompt 21 docs:

- `docs/ui-ux-editor-copy-audit.md`
- `docs/ui-ux-editor-copy-style-guide.md`

Prompt 21 screenshot target:

- `docs/ui-ux-screenshots/prompt-21-copy-density/`

E2E updates:

- Source add-clip checks accept both `Add clip` and the old `Add mock clip` wording so the visible copy can be shorter without weakening behavior coverage.
- Approval success checks now target the shorter `Plan approved` copy.
- Approval-failure checks now target `Approval is blocked until one setup item is resolved.` plus the unchanged credit-safety sentence.
- Screenshot capture includes default, source, reference, plan review, progress, preview, timeline, approval-failure, SFX, Music, zoom, and selected route states.

Validation:

- `check:frontend-boundary`: passed for 499 files.
- Typecheck: passed.
- Lint: passed.
- Build: passed with no Vite `>500 kB` chunk warning.
- `test:e2e`: 64 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.
