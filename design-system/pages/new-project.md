# New Project Page Override

Status: `implemented_and_visually_verified`

## Job

Create a project container with the least possible setup before the user creates a named edit.

## Composition

- One focal form for project name and editing context.
- One primary `Create project` action and a quiet cancel action.
- One supporting context rail that explains what follows without becoming a stack of cards.

## Page Rules

- Do not upload source, create an edit plan, approve credits, or imply generation on this page.
- Project name is visibly labelled, initially focused, normalized, and validated without losing input.
- Editing context guides future questions; it does not lock the creative direction.
- At narrow widths, the context rail moves below the form and actions remain reachable.

## Evidence

- `tests/e2e/projects-ui.spec.ts`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/create-project-1280.png`
