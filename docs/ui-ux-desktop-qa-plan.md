# Prompt 10 Desktop QA Plan

## Goal

Prompt 10 verifies ReeditPro's desktop web shell after the floating composer reset and polishes the expanded editor workflows that still need professional no-cutoff review: advanced timeline, SoundSync SFX, Music/SoundSync, expanded utility panels, and scrolled approval/progress/preview states.

## Routes To Verify

- `/`
- `/dashboard`
- `/projects`
- `/projects/new`
- `/preferences`
- `/editor`

Retired compatibility redirects to verify without treating them as active surfaces:

- `/wallet` -> `/preferences`
- `/pricing` -> `/projects`
- `/brand-kit` -> `/preferences`
- `/exports` -> `/projects`
- `/upload` -> `/projects/new`
- `/edit-preferences` -> `/preferences`
- `/settings` -> `/preferences`
- `/app` -> `/dashboard`

Primary focus route: `/editor`.

## Editor States

- Default editor
- Utility strip collapsed
- Utility strip expanded
- Source sequence visible
- Reference card visible
- PlanReviewApprovalCard visible
- Approval checking, if triggerable
- Approval failure, if triggerable; otherwise code-path verified
- Progress running
- Preview ready
- Advanced timeline open
- SFX flow expanded
- Music/SoundSync flow expanded
- Advanced details expanded, if available without changing default guided behavior

## Viewports And Zoom

Desktop widths:

- `1024px`
- `1280px`
- `1440px`
- `1728px`
- `1920px`

Zoom:

- `100%`
- `125%` if the browser tooling exposes true zoom or device-scale control

If true zoom is unavailable, use code-level review plus a practical width proxy and document the limitation clearly.

## Screenshot Targets

Save available Prompt 10 screenshots under:

`docs/ui-ux-screenshots/prompt-10-desktop-qa/`

Preferred names:

- `editor-default-1024.png`
- `editor-default-1280.png`
- `editor-default-1440.png`
- `editor-default-1728.png`
- `editor-default-1920.png`
- `editor-utility-expanded-1440.png`
- `editor-plan-review-1440.png`
- `editor-timeline-open-1440.png`
- `editor-sfx-expanded-1440.png`
- `editor-music-expanded-1440.png`
- `editor-preview-ready-1440.png`
- `editor-default-1280-zoom125.png`
- `editor-plan-review-1280-zoom125.png`
- `editor-timeline-open-1280-zoom125.png`

Do not claim a screenshot was captured unless the file exists.

## Checks

- No document-level horizontal overflow
- No clipped cards, buttons, badges, chips, inputs, textareas, or focus rings
- Floating composer remains visible and does not become a hard footer row
- Background remains visible around the composer
- Minimal editor header stays compact
- Utility panels remain secondary and do not dominate the default conversation
- PlanReviewApprovalCard remains reachable and approval-gated
- Progress appears only after approval
- Preview appears only after progress readiness
- Advanced timeline stays inside the viewport with intentional internal scrolling
- SFX and Music/SoundSync expanded flows do not become dense card walls
- Long prompts, URLs, filenames, provider labels, chips, and cue labels wrap safely
- Keyboard focus remains visible and can enter/leave expanded panels
- No shared CSS regression leaks into non-editor routes
- No bundle/performance regression or Vite `>500 kB` warning regression

## Browser Tooling Fallback

Use the existing browser tooling first. Do not add Playwright, Puppeteer, screenshot libraries, or any other dependency.

If viewport resizing or true zoom is unavailable:

- Record the exact limitation in the route QA report.
- Save any current-viewport screenshots that are available.
- Perform code-level no-cutoff and 125% zoom safety review.
- Verify route metrics where the browser can report them.
- Keep validation grounded in typecheck, lint, build, browser metrics, and code inspection.
