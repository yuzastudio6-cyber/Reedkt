# ReeditPro Final Editor Acceptance QA

This checklist captures the final interaction bar for the chat-first `/editor` experience after the compact composer, card density, message rhythm, and scroll-mask passes.

## Required Editor State

- Minimal project header remains compact and does not duplicate route chrome.
- Chat remains the primary editor surface.
- Compact floating composer remains the only bottom input surface.
- Composer stays low, centered to the chat column, and never becomes a hard footer.
- Messages and cards scroll under the composer and disappear through the chat-thread mask before emerging below the textbox rail.
- Normal AI cards remain narrower than the composer; source and approval cards are wide but controlled.
- Message grouping keeps repeated labels visually quiet while preserving accessible text.
- Source sequence, reference, plan review, timeline, SFX, and Music controls remain reachable above the composer.

## Interaction Acceptance

- Hover states are calm: subtle background, border, color, and at most a small vertical movement.
- Focus-visible states are clear for buttons, icon controls, chips, selects, textareas, details summaries, timeline controls, and composer controls.
- Compact icon controls expose meaningful `aria-label` and browser `title` text.
- Disabled controls look intentionally unavailable and do not imply hidden execution.
- Keyboard users can focus the composer, send with `Control+Enter`, insert newlines with `Shift+Enter`, and navigate source/reference/approval controls.
- Details summaries for SFX, Music, reference DNA, and advanced planning are keyboard-toggleable.

## Product Gate Acceptance

- Generation progress is absent before plan and credit approval.
- Preview readiness is absent before approved mock progress.
- Approval happens only through `PlanReviewApprovalCard`.
- Approval failure uses the guarded E2E flag, renders `assistant_error`, and does not start progress, show preview, or imply credits were used.
- SFX and Music remain optional/lazy and do not imply real provider execution.

## Validation Commands

- `npm run check:frontend-boundary`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run test:e2e`
- `npm run qa:editor`
- `npm run qa:viewport`
- `npm run qa:expanded`
- `npm run qa:zoom`
- `npm run qa:screenshots`
- `git diff --check`

## Known Limits

- Browser zoom coverage remains practical Chromium/page-scale plus `1024px` proxy coverage, not exhaustive parity with every browser zoom implementation.
- Screenshots are review artifacts, not pixel-perfect visual diffs.
- Backend provider, rendering, storage, payment, and real upload flows remain out of scope for this UI QA pass.

## Prompt 20 Manual Signoff

Prompt 20 adds a founder-level visual signoff layer on top of the automated acceptance checklist.

- Manual signoff doc: `docs/ui-ux-manual-signoff.md`
- Bug triage doc: `docs/ui-ux-editor-bug-triage.md`
- Final screenshot folder: `docs/ui-ux-screenshots/prompt-20-manual-signoff/`

Manual review status: pass with notes.

Targeted fix:

- Docs screenshot capture now moves the pointer away before screenshots so hover states or browser-native title artifacts do not read as product UI in final review artifacts.

No editor product logic, approval behavior, composer structure, card structure, backend behavior, or dependency changed in Prompt 20.

Prompt 20 validation:

- `check:frontend-boundary`: passed for 469 files.
- Typecheck: passed.
- Lint: passed.
- Build: passed.
- `test:e2e`: 64 passed.
- Focused QA passed: `qa:editor`, `qa:viewport`, `qa:expanded`, `qa:zoom`, and `qa:screenshots`.
- `git diff --check`: passed.
- Vite `>500 kB` chunk warning: not present.

## Prompt 21 Copy Density Acceptance

Prompt 21 keeps the Prompt 20 visual baseline and changes editor wording only.

- Main chat turns are shorter and more user-facing.
- Source, reference, plan review, preview/progress, SFX, and Music visible copy is calmer and less prototype-heavy.
- The approval failure sentence is calm and explicit: `Approval is blocked until one setup item is resolved. No credits were approved or used.`
- Compact composer, thread mask, card density, message rhythm, approval gates, and lazy SFX/Music flows remain unchanged.
- Screenshot folder: `docs/ui-ux-screenshots/prompt-21-copy-density/`

Prompt 21 validation:

- `check:frontend-boundary`: passed for 499 files.
- Typecheck: passed.
- Lint: passed.
- Build: passed.
- `test:e2e`: 64 passed.
- Focused QA passed: `qa:editor`, `qa:viewport`, `qa:expanded`, `qa:zoom`, and `qa:screenshots`.
- `git diff --check`: passed.
- Vite `>500 kB` chunk warning: not present.
