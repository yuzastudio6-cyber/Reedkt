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
- Successful creation opens the exact project. The user then deliberately opens the labelled New Edit modal; the retired `ProjectHomePage` setup panel is not part of the active route.
- New Edit snapshots Saved Edit Preferences and opens upload only after the edit is named. It does not upload, plan, approve, reserve credits, or start generation.
- The New Edit surface is a contained modal with initial focus, Escape, focus containment, validation, and focus return.

## Evidence

- `tests/e2e/projects-ui.spec.ts`
- `tests/e2e/project-start-to-edit-session.spec.ts`
- `tests/e2e/project-persistence-tenancy.spec.ts`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/create-project-1280.png`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/project-new-edit-dialog-1280.png`
- Computed-style regressions prove the wide two-column form/context composition, compact one-column collapse, contained fixed dialog, and compact modal action stack.
