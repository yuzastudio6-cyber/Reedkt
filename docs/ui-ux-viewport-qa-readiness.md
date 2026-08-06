# UI/UX Viewport QA Readiness

## Current Status

ReeditPro currently uses manual/browser-assisted desktop QA for the web app. The in-app browser can expose viewport override in this environment, which is enough for screenshot checks at specific desktop widths, but it does not expose true browser zoom or device-scale control.

Prompt 11 does not add Playwright, Puppeteer, Cypress, Vitest, or any new test dependency. Formal automation remains a future production-readiness slice.

## Existing Manual Coverage

Recent screenshot folders:

- `docs/ui-ux-screenshots/prompt-8/`
- `docs/ui-ux-screenshots/prompt-8-editor-reset/`
- `docs/ui-ux-screenshots/prompt-9-editor-interactions/`
- `docs/ui-ux-screenshots/prompt-9-floating-composer/`
- `docs/ui-ux-screenshots/prompt-10-desktop-qa/`

Current Prompt 11 target folder:

- `docs/ui-ux-screenshots/prompt-11-soundflow-timeline/`

Manual QA currently covers:

- Route smoke and screenshot checks.
- Document-level horizontal overflow metrics.
- Floating composer visibility.
- Minimal editor header preservation.
- Utility expanded state.
- Plan review reachability.
- Advanced timeline open state.
- SFX expanded state.
- Music/SoundSync expanded state.
- Code-level 125% zoom safety review.

## Formal QA Recommendation

When the project accepts browser automation dependencies, add a mocked/local browser E2E layer with Playwright or equivalent. The browser suite should run against local Vite and mocked backend state only, with no provider calls, no real media processing, no cloud mutation, and no secrets.

Recommended future test cases:

- Route smoke at `1024`, `1280`, `1440`, `1728`, and `1920`.
- `/editor` floating composer visible and not a hard footer.
- No document-level horizontal overflow.
- Utility panel expanded.
- `PlanReviewApprovalCard` visible and reachable.
- Advanced timeline open inside the editor canvas.
- SFX expanded and SFX planning details collapsed/expanded.
- Music/SoundSync expanded and music cue details collapsed/expanded.
- 125% zoom or equivalent `deviceScaleFactor` checks.
- Non-editor route regression at `1280`.

## Acceptance Thresholds

- No horizontal overflow beyond `1px` measurement tolerance.
- Composer remains visible and does not cover the last reachable card.
- No clipped buttons, cards, chips, badges, inputs, focus rings, or drawer controls.
- No duplicate editor header.
- No hard composer footer row.
- Advanced timeline remains bounded with internal scroll.
- SFX/Music expanded flows do not become dense default card walls.
- Vite `>500 kB` chunk warning remains absent.

## Prompt 11 Fallback Policy

If true zoom remains unavailable, Prompt 11 should document the limitation, use code-level zoom review, and keep the `1024px` width check as the practical `1280px` at `125%` layout proxy.

## Prompt 12 Automation Readiness Update

Prompt 12 added formal browser E2E coverage with Playwright because no existing browser E2E tool was present in the repo.

Current automated coverage:

- Route viewport QA at `1024`, `1280`, `1440`, `1728`, and `1920`.
- Editor floating composer checks.
- No-horizontal-overflow checks.
- Editor approval/progress/preview regression coverage.
- Source sequence and reference interaction coverage.
- Advanced timeline open/close coverage.
- SFX and Music/SoundSync expanded-flow checks.
- Screenshot artifact generation under `docs/ui-ux-screenshots/prompt-12-e2e/`.
- Practical zoom coverage using `1024px` proxy and Chromium page-scale at `1.25`.

Prompt 12 results:

- `qa:viewport`: 45 passed.
- `qa:editor`: 6 passed, 1 skipped for the approval failure path with no safe user-facing trigger.
- `qa:expanded`: 3 passed.
- `qa:zoom`: 2 passed.
- `qa:screenshots`: 3 passed.

Updated limitation:

- Chromium page-scale is now available through Playwright and was captured, but it is still documented as practical zoom coverage rather than perfect parity with every browser's user zoom behavior.

## Prompt 13 CI Readiness Update

Prompt 13 made the Playwright suite CI-ready and removed the approval failure skip.

Automation status:

- `.github/workflows/ui-qa.yml` runs lint, typecheck, build, Chromium install, and `npm run test:e2e`.
- Playwright artifacts are uploaded from `playwright-report` and `test-results/e2e`.
- The guarded `/editor?qaApprovalFailure=1` path is enabled only in dev/E2E mode.
- `test:e2e` now reports `60 passed`.

The viewport strategy remains unchanged:

- fixed desktop width coverage at `1024`, `1280`, `1440`, `1728`, and `1920`
- practical `125%` coverage through the `1024px` proxy and Chromium page-scale
- invariant checks instead of pixel-perfect visual diffs

## Prompt 14 QA Hardening Update

Prompt 14 keeps the same Playwright viewport strategy and improves reviewability:

- CI now uploads Playwright HTML report output separately from raw test results.
- CI uploads docs screenshot artifacts from `docs/ui-ux-screenshots/prompt-12-e2e/`.
- CI writes a GitHub step summary describing coverage and artifact locations.
- Screenshot artifacts remain design-history files, while `test-results/` and `playwright-report/` remain transient ignored output.

Zoom status remains practical rather than perfect:

- `1024px` viewport continues to act as the `1280px at 125%` layout proxy.
- Chromium page-scale at `1.25` is attempted by Playwright.
- Real human release QA should still spot-check browser zoom when a change is high risk for typography, composer stickiness, or drawer sizing.
