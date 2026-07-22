# UI/UX Browser E2E QA

## Purpose

Prompt 12 adds a mocked, local browser QA harness so ReeditPro desktop UI changes can be checked automatically before visual regressions ship.

The suite focuses on UI/UX invariants:

- route smoke at production desktop widths
- no document-level horizontal overflow
- floating composer visibility and non-footer behavior
- minimal editor header preservation
- editor setup, approval, progress, and preview timing
- source sequence and reference interactions
- advanced timeline open/close
- SFX and Music/SoundSync expanded flows
- practical 125% zoom coverage
- docs screenshots for review

## Tooling

The repo did not have an existing browser E2E tool, so Prompt 12 added `@playwright/test` as a dev dependency.

Playwright is development-only. It is not imported by app code and is not bundled into production builds.

Browser target:

- Chromium only
- local Vite dev server at `http://127.0.0.1:5173`
- mocked/local frontend state only
- no provider calls
- no real media processing
- no cloud mutation
- no secrets

## Setup

Install npm dependencies when needed:

```bash
npm install
```

Install the Chromium browser binary:

```bash
npx playwright install chromium
```

## Commands

```bash
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:report
npm run qa:viewport
npm run qa:editor
npm run qa:expanded
npm run qa:screenshots
npm run qa:zoom
```

## Coverage

- `qa:viewport` checks active routes `/`, `/dashboard`, `/projects`, `/projects/new`, `/preferences`, and `/editor` at `1024`, `1280`, `1440`, `1728`, and `1920`.
- `qa:viewport` also checks retired app routes `/wallet`, `/pricing`, `/brand-kit`, `/exports`, `/upload`, `/edit-preferences`, `/settings`, and `/app` as compatibility redirects only. It requires Home, Edit Videos, and Edit Preferences without imposing a three-link maximum, so combined-source Motion Studio remains compatible.
- `qa:editor` checks editor shell, composer send, setup confirmations, plan approval, progress, preview, source sequence, reference controls, and timeline open/close.
- `qa:expanded` checks utility expansion plus SFX and Music/SoundSync descriptor flows.
- `qa:screenshots` writes review artifacts to `docs/ui-ux-screenshots/prompt-12-e2e/`.
- `qa:zoom` checks `1024px` as the `1280px at 125%` layout proxy and attempts Chromium page-scale at `1.25`.

## Prompt 12 Results

- Browser install: completed with `npx playwright install chromium`.
- `qa:viewport`: 45 passed.
- `qa:editor`: 6 passed, 1 skipped. The skipped test documents approval failure because no safe user-facing mock trigger exists.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed. Chromium page-scale screenshot was captured.
- `qa:screenshots`: 3 passed.
- `test:e2e`: 59 passed, 1 skipped.

Screenshots saved:

- `editor-default-1024.png`
- `editor-default-1280.png`
- `editor-default-1440.png`
- `editor-default-1728.png`
- `editor-default-1920.png`
- `editor-utility-expanded-1440.png`
- `editor-plan-review-1440.png`
- `editor-timeline-open-1440.png`
- `editor-1024-zoom-proxy.png`
- `editor-1280-page-scale-125.png`
- `dashboard-1280.png`
- `projects-1280.png`
- `wallet-1280.png`
- `exports-1280.png`

## Limitations

- Chromium page scale is a practical browser automation signal, but it is not a complete substitute for every user's browser zoom behavior.
- Device scale factor changes pixel density more than CSS layout and should not be treated as true layout zoom.
- The suite does not call providers, process real media, use cloud credentials, or validate backend worker behavior.

## Prompt 13 Approval Failure Coverage

Prompt 13 added a guarded approval failure trigger:

- URL: `/editor?qaApprovalFailure=1`
- Guard: enabled only when `import.meta.env.DEV` is true or `VITE_REEDITPRO_E2E=true`
- Playwright sets `VITE_REEDITPRO_E2E=true` for the local web server
- No visible debug button, menu item, production route, or provider behavior was added

The approval failure test verifies:

- `assistant_error` renders through `approval-error-message`
- approved state remains false
- progress does not start
- preview does not appear
- copy states that no credits were approved or used
- floating composer remains visible
- no horizontal overflow is introduced

Prompt 13 results:

- `qa:editor`: 7 passed.
- `test:e2e`: 60 passed.

## CI Recommendation

The UI QA workflow now runs the full mocked browser suite in GitHub Actions:

```bash
npm ci
npx playwright install --with-deps chromium
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

The workflow publishes:

- `playwright-report`
- `playwright-test-results`
- `ui-ux-screenshots`

## Prompt 14 Artifact Policy

Screenshot tests intentionally write design-history artifacts to:

- `docs/ui-ux-screenshots/prompt-12-e2e/`

That docs path remains committable and is uploaded by CI as the `ui-ux-screenshots` artifact. Transient Playwright output remains ignored:

- `test-results/`
- `playwright-report/`

The screenshot suite is still artifact generation, not pixel-diff visual testing. Review screenshots alongside the invariant checks when the editor shell, composer, timeline, or route layout changes.

## Prompt 14 Troubleshooting Notes

- Approval failure is exercised through `/editor?qaApprovalFailure=1`; the flag is guarded by `DEV` or `VITE_REEDITPRO_E2E=true` and has no visible debug UI.
- Chromium page scale is practical zoom coverage, not exact parity with every desktop browser zoom implementation.
- If CI fails before browser launch, check dependency install and Chromium install logs first.
- If CI fails inside Playwright, download `playwright-report` and `playwright-test-results`, then reproduce locally with the focused script closest to the failure.

Prompt 14 local results:

- `test:e2e`: 60 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.

## Prompt 16 Composer Scroll-Under Coverage

Prompt 16 extends the browser suite to protect the final floating composer behavior.

New checks cover:

- composer layer and fade layer exist
- fade layer is non-interactive with `pointer-events: none`
- composer remains visible, bounded, and not full-width
- composer center and width align with the chat thread within a practical tolerance
- plan review, source sequence, reference, timeline, SFX, and Music/SoundSync content can scroll above the composer
- no horizontal overflow appears across editor states and viewport widths

Screenshot tests now write the current composer QA artifacts to:

- `docs/ui-ux-screenshots/prompt-16-floating-composer-scroll/`

CI uploads the broader `docs/ui-ux-screenshots/` folder as the `ui-ux-screenshots` artifact, while transient Playwright output stays ignored in `test-results/` and `playwright-report/`.

Prompt 16 local results:

- `test:e2e`: 61 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.

## Composer Fix Prompt 1 E2E Notes

The composer shell reset keeps the Prompt 16 test surface but adds a stricter invariant:

- `.chat-composer-shell` must be transparent and layout-only.
- `.chat-composer-input-shell` is the visible glass input surface.
- The surfaced input shell remains centered with the chat thread and does not span the full viewport.

Updated screenshot artifacts include:

- `editor-composer-scroll-under-1024.png`
- `editor-composer-scroll-under-1280.png`
- `editor-composer-scroll-under-1440.png`
- `editor-composer-scroll-under-1728.png`
- `editor-composer-scroll-under-1920.png`
- `editor-plan-review-above-composer-1440.png`
- `editor-source-sequence-above-composer-1440.png`
- `editor-timeline-composer-1440.png`
- `editor-sfx-composer-1440.png`
- `editor-music-composer-1440.png`
- `editor-zoom-composer-125.png`

## Composer Correction 1B E2E Notes

Composer Correction 1B adds compact-input assertions to prevent the composer from regressing into a form card.

The suite now checks:

- `chat-composer-surface` exists and is the only visible composer surface.
- `chat-composer` remains transparent/layout-only.
- composer surface height stays under `120px`.
- `Message ReeditPro` and the plan/approval helper are `sr-only`.
- textarea background, border, shadow, and resize handle do not create a nested card.
- composer sits close to the lower editor edge.
- fade remains present and non-interactive.

Screenshots are written to:

- `docs/ui-ux-screenshots/prompt-16b-compact-composer/`

## Composer Fix 1C E2E Notes

Composer Fix 1C hardens the compact composer checks against the remaining large-card regression.

The suite now checks:

- `chat-composer-surface` stays under `76px` in the default editor state.
- the textarea stays under `44px` by default and has no nested border, shadow, background, or resize handle.
- the label and helper text keep `sr-only` classes and occupy only clipped `1px` boxes.
- attachment/reference actions remain inline inside the composer rail.
- the composer remains low, aligned with the chat thread, and narrower than a full-viewport footer.
- fade and above-composer reachability checks remain active for plan, source/reference, timeline, SFX, and Music/SoundSync states.

Screenshots are written to:

- `docs/ui-ux-screenshots/prompt-16c-true-compact-composer/`

## Composer Fade Fix 16D E2E Notes

Composer Fade Fix 16D adds guardrails for the ghost-panel regression behind the compact input.

The suite now checks:

- `chat-composer-fade` still exists and remains non-interactive.
- the fade uses a radial blended underlay rather than a rectangular linear panel.
- maximum inspected fade alpha stays at or below `0.36`.
- fade height stays between `72px` and `96px`.
- the fade covers at least the compact input rail but does not cause viewport overflow.
- existing compact composer, reachability, and no-horizontal-overflow checks remain active.

Screenshots are written to:

- `docs/ui-ux-screenshots/prompt-16d-fade-ghost-panel-removal/`

## Composer Occlusion Mask 16E E2E Notes

Composer Occlusion Mask 16E adds checks for clean content disappearance behind the compact input.

The suite now checks:

- `chat-composer-occlusion` exists, is non-interactive, and uses the dark occlusion color.
- the occlusion layer matches the composer rail width, height, and center within `1px`.
- inline chat cards are no wider than the composer rail.
- inline chat cards stay centered under the composer lane within a practical tolerance.
- viewport, expanded SFX/Music, zoom, and editor flow suites retain no-horizontal-overflow checks.

Screenshots are written to:

- `docs/ui-ux-screenshots/prompt-16e-composer-occlusion-mask/`

## Card Fix Prompt 2 E2E Notes

Prompt 17 adds card width and density guardrails on top of the existing composer checks.

The suite now checks:

- Source Sequence, Reference, and Plan Review cards stay inside the composer/chat rail tolerance.
- Normal inline cards do not become wider than the compact composer surface.
- Inline cards do not create horizontal overflow, including nested controls and native form fields.
- Source add-clip, reference skip/attach/focus, and plan approval actions remain reachable and clickable above the composer.
- Viewport, zoom, expanded SFX/Music, and screenshot suites retain the compact composer, fade, occlusion, and no-overflow checks.
- Screenshot artifacts capture source density at `1024`, `1280`, `1440`, `1728`, and `1920`, plus reference, plan review, utility, timeline, SFX, Music, and zoom states.

Screenshots are written to:

- `docs/ui-ux-screenshots/prompt-17-card-density/`

## Conversation Rhythm Prompt 3 E2E Notes

Prompt 18 adds visual rhythm guardrails without pixel-perfect visual diffs.

The suite now checks:

- Rendered chat messages expose valid `data-group-position` and `data-compact-label` attributes.
- Same-role continuation messages compact repeated labels.
- Group-leading labels remain visible.
- Card-bearing assistant messages keep cards close to intro text.
- Adjacent chat messages do not create excessive vertical scroll jumps.
- Existing compact composer, fade, occlusion, card width, card overflow, and reachability checks remain active.
- Expanded SFX/Music flows inherit the same message rhythm checks.

Screenshots are written to:

- `docs/ui-ux-screenshots/prompt-18-message-rhythm/`

## Composer Thread Mask Correction E2E Notes

The composer scroll-under checks now distinguish the visual fade/occlusion layers from the actual scroll-content mask.

The suite now checks:

- `chat-composer-fade` still exists and remains non-interactive.
- `chat-composer-occlusion` still matches the compact input rail.
- `chat-thread` exposes a bottom `linear-gradient` mask so cards disappear before the lower composer edge.
- the thread mask contains transparent alpha stops, preventing content from remaining visible below the textbox shell.
- existing compact composer, card width, card overflow, reachability, and no-horizontal-overflow checks remain active.

## Final Editor Polish Prompt 4 E2E Notes

Prompt 19 adds interaction-focused coverage on top of the existing layout and approval checks.

The suite now checks:

- compact icon buttons expose both `aria-label` and browser `title` text.
- composer attach/reference/send/textarea controls are focusable and visibly focused.
- `Shift+Enter` preserves textarea newline behavior.
- `Control+Enter` sends a revision without starting generation.
- source role, source notes, flags, reorder controls, reference URL, reference focus chips, and reference actions are keyboard reachable.
- plan approval, timeline close, SFX details, and Music details are keyboard safe.
- screenshots are written to `docs/ui-ux-screenshots/prompt-19-final-editor-polish/`.

Prompt 19 validation status:

- `test:e2e`: 64 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.

## Prompt 20 Manual Signoff E2E Notes

Prompt 20 keeps the existing layout, approval, keyboard, and screenshot guardrails intact while moving the final screenshot artifacts to:

- `docs/ui-ux-screenshots/prompt-20-manual-signoff/`

The screenshot helper now moves the pointer away before capture so native title/hover artifacts do not appear in docs screenshots. This affects screenshot artifacts only; it does not change product UI behavior.

Prompt 20 validation status:

- `test:e2e`: 64 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.

## Prompt 21 Copy Density E2E Notes

Prompt 21 keeps the existing layout, approval, keyboard, card-density, rhythm, scroll-mask, and screenshot guardrails intact while updating editor copy selectors where needed.

The suite now checks:

- approval success with the shorter `Plan approved` copy.
- approval failure with `Approval is blocked until one setup item is resolved.` and the unchanged `No credits were approved or used.` safety copy.
- source add-clip actions using a compatibility selector that accepts `Add clip` or `Add mock clip`.
- screenshot artifacts under `docs/ui-ux-screenshots/prompt-21-copy-density/`.
- approval-failure screenshot capture in the Prompt 21 screenshot suite.

Prompt 21 validation status:

- `test:e2e`: 64 passed.
- `qa:editor`: 7 passed.
- `qa:viewport`: 45 passed.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 4 passed.
