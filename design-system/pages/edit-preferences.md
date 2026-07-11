# Edit Preferences Override

Status: `gate_1_visually_verified`

## Job

Manage one Edit Preferences system across Edit References, workspace defaults, applied preference history, and safety/privacy guidance.

## Composition

- One route H1: `Edit Preferences`.
- A compact tab row separates Edit References, Workspace Defaults, Applied Edits, and Safety & Privacy.
- Edit References uses a focal introduction followed by Saved References, Study Chat, and DNA/QA Inspector regions.
- The conversation is the primary study surface; saved references and inspector information remain quieter.
- At narrower widths, regions stack in that priority order and tabs may scroll horizontally without creating page overflow.
- Existing defaults remain available under Workspace Defaults; they are not presented as a competing product.

## Page Rules

- User-facing copy always says `Edit Preferences`, `Edit Reference`, `Study Chat`, and `Preference DNA`.
- Normal user copy does not expose gate numbers, mock/local status, database/provider details, adapters, workers, or runtime implementation language.
- Evidence, DNA, quality review, approval, and application readiness remain truthful and visibly distinct.
- Reference-specific marks, identity, exact layouts, and other copy-risk details never become transferable preference rules.
- Creating a reference does not start analysis, production, or charging.
- Explicit Chat instruction outranks current-edit preference, which outranks saved default.
- Internal diagnostics remain test/documentation evidence and stay absent from the normal page.
- Async create, load, message, and archive actions expose loading, success, and error feedback.
- Every tab and action is keyboard reachable, focus-visible, semantically named, and at least 44px high.

## Required Responsive Evidence

- Desktop workspace layout and populated-state visual review.
- Compact desktop layout with no page-level horizontal overflow.
- 375px layout with horizontal tab scrolling confined to the tab region.
- Skip-link focus/activation and arrow-key tab navigation.
- Reduced-motion-safe interaction styling.

## Current Evidence

- `tests/e2e/edit-reference-study-session.spec.ts`
- `server/smoke/edit-reference-ui-adapter-smoke.ts`
- `src/components/preferences/EditReferenceWorkspacePage.tsx`
- `src/styles/preferences.css`
