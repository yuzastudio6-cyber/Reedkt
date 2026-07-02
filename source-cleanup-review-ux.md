# Source Cleanup Review UX

## Purpose

Users should understand the cleanup plan before approval. The UI should clearly show cleanup preference, what is kept, cut, tightened, preserved, repurposed, retake group selections, user-review items, and meaning preservation warnings.

## User-Facing Language

Use simple copy:

- “I’ll keep this because…”
- “I’ll cut this because…”
- “This may need review because…”
- “This clip appears to be an alternate take.”
- “This proof/context should be preserved.”

## Guided, Detailed, Developer Modes

- Guided: show the summary and required review items.
- Detailed: show trim decisions and retake groups.
- Developer: show risk, linked ranges, QA, and mock limitations.

## Approval Behavior

If trim review is blocking or requires unresolved user review, approval should remain locked. The card should explain that the review is mock-only and no real transcript/media comparison has run.
