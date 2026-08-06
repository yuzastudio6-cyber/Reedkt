# Project Home Override

Status: `implemented_latest_edit_focal_v1`

Status date: 2026-07-10

## Job

Project Home manages the named edits inside one project. It answers:

1. Which project am I in?
2. Which edit should I continue?
3. What action does that edit need?
4. How do I create another edit?

## Hierarchy

1. Compact project title in the standard app header.
2. Quiet `All projects` back path plus category/edit count.
3. Compact recovery truth when needed.
4. Inline Saved Edit Preferences/defaults summary.
5. Edits section with one `New edit` action.
6. Latest edit as the Level 1 focal surface; additional edits as Level 2 cards.

Do not repeat the project title or add a second large “Edits” hero. The title belongs to the app header and the work begins immediately below it.

## Edit Card Content

- Truthful source-state visual.
- One semantic status dot and text.
- Edit name.
- One next-step sentence.
- Relative update time.
- Quiet preference-applied metadata when present.
- State-aware action.

State-aware actions include Upload Source, Continue Setup, View Progress, Open Review, Approve or Revise, Review Changes, Open Revision, Refresh Review, and Open Edit.

## Empty And Modal States

- No edits: one bounded first-edit surface and `New edit` action.
- New Edit remains a labelled modal with initial focus, Escape, focus containment, validation text, and focus return.
- The modal snapshots Saved Edit Preferences into the new exact edit and does not upload, plan, approve, spend credits, or start work.

## Responsive Behavior

- Wide desktop: latest edit uses a media/copy split and additional cards form a two-column grid.
- 900px and below: cards become single-column while the focal edit keeps its internal media/copy split.
- 700px and below: focal edit stacks; actions remain content-width unless space requires otherwise.
- Native mobile product IA remains out of scope.

## Validation

- Latest-edit focal hierarchy and state-aware action E2E.
- Same-name project identity and New Edit dialog E2E.
- 1024, 1280, 1440, 1728, and 1920 overflow checks.
- Populated Project Home screenshot review.
- Compact local-recovery truth retains icon, copy, and actions as one bounded row and becomes a readable single-column surface below 720px.
- No decorative status badges or duplicate H1.
