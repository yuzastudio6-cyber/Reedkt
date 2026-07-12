# Edit Preferences Override

Status: `gate_7_lifecycle_closure_complete_backend_local`

## Job

Manage one Edit Preferences system across Edit References, workspace defaults, applied preference history, and safety/privacy guidance.

## Composition

- One route H1: `Edit Preferences`.
- A compact tab row separates Edit References, Workspace Defaults, Applied Edits, and Safety & Privacy.
- Edit References uses a focal introduction followed by Saved References, Study Chat, and DNA/QA Inspector regions.
- The conversation is the primary study surface; saved references and inspector information remain quieter.
- Evidence collection lives inside Study Chat as a compact task surface; it does not become a separate dashboard or media browser.
- Evidence modes use plain user concepts: Creative note, Video details, and Approved edit.
- Latest findings remain visually subordinate to the conversation and explicitly separate from Preference DNA.
- Evidence-ready studies show one focused Generate DNA action; after synthesis it becomes a compact, expandable Preference DNA review surface inside Study Chat.
- DNA review prioritizes version, QA state, evidence-linked rules, confidence, conflicts, and do-not-copy boundaries without turning the center into a dashboard.
- QA adds one focused review action, keeps non-passing findings visible, and collapses passed checks by default.
- Approval is available only for the exact non-blocked QA-reviewed version after an explicit adapt-not-copy acknowledgement.
- Approved state uses the success treatment and clearly remains separate from target application or production.
- A connected target application exposes Replace and Remove only in its existing preference region; these actions do not create a second settings destination.
- Replace uses progressive disclosure: choose an approved reference, review the current direction, and reconfirm the saved output frame before applying the change.
- Remove requires explicit destructive confirmation and states that reusable guidance will be removed while immutable application history remains available.
- Pending replacement/removal failures retain the selected operation and expose one safe retry path; invalidated context is never restored as active during recovery.
- Applied Edits distinguishes Connected, Prepared, Replaced, and Removed with text and neutral historical styling rather than success color alone.
- At narrower widths, regions stack in that priority order and tabs may scroll horizontally without creating page overflow.
- Existing defaults remain available under Workspace Defaults; they are not presented as a competing product.

## Page Rules

- User-facing copy always says `Edit Preferences`, `Edit Reference`, `Study Chat`, and `Preference DNA`.
- Normal user copy does not expose gate numbers, mock/local status, database/provider details, adapters, workers, or runtime implementation language.
- Evidence, DNA, quality review, approval, and application readiness remain truthful and visibly distinct.
- Blocking QA cannot be acknowledged away; correction returns the user to the existing evidence flow.
- Normal approval copy never exposes QA record IDs, digests, route names, or internal implementation labels.
- Reference-specific marks, identity, exact layouts, and other copy-risk details never become transferable preference rules.
- Creating a reference does not start analysis, production, or charging.
- Saving video details never implies that a video was uploaded or studied.
- Fallback/manual findings describe their source in plain language and never imitate live analysis.
- Copy-risk and contradictory evidence use text, icon, and state—not color alone—and require user review.
- Corrected evidence stays visible as quiet superseded history.
- Explicit Chat instruction outranks current-edit preference, which outranks saved default.
- Internal diagnostics remain test/documentation evidence and stay absent from the normal page.
- Async create, load, message, evidence, study, and archive actions expose loading, success, and error feedback.
- Replace and Remove expose pending, success, retry, conflict, and replan-required feedback without pretending that production ran.
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
- `server/smoke/edit-reference-evidence-study-smoke.ts`
- `server/smoke/edit-reference-dna-synthesis-smoke.ts`
- `server/smoke/edit-reference-dna-qa-approval-smoke.ts`
- `server/smoke/edit-reference-target-application-smoke.ts`
- `server/smoke/edit-reference-downstream-integration-smoke.ts`
- `server/smoke/edit-reference-lifecycle-closure-smoke.ts`
- `tests/e2e/edit-reference-lifecycle-closure.spec.ts`
- `src/components/preferences/EditReferenceWorkspacePage.tsx`
- `src/styles/preferences.css`
