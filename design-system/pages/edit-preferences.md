# Edit Preferences Override

Status: `implemented_and_visually_verified`

## Job

Manage one Edit Preferences system across saved defaults and exact-edit overrides.

## Composition

- Saved defaults use a concise intro and grouped flat fields.
- Current-edit preferences show inherited versus overridden values without a field-card wall.
- Current-edit fields use three bounded groups, a responsive two-to-one-column grid, semantic override treatment, and a sticky action rail that remains inside the workspace.
- Save/apply actions appear only when action is possible; reset remains available when overrides exist.

## Page Rules

- User-facing copy always says `Edit Preferences`.
- Saved defaults and current-edit overrides are scopes of one feature, not separate products.
- Explicit Chat instruction outranks current-edit preference, which outranks saved default.
- Dirty navigation is guarded.
- Meaningful changes invalidate a stale plan/estimate; approved work becomes read-only and routes revision through Chat.
- Internal connection diagnostics remain environment/query-gated and absent from the normal page.

## Evidence

- `tests/e2e/edit-preferences-current-edit.spec.ts`
- `tests/e2e/preferences-persistence.spec.ts`
- `tests/e2e/edit-preferences-route-entrypoint.spec.ts`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/preferences-1280.png`
- `docs/ui-ux-screenshots/active-product-redesign-2026-07-10/named-edit-preferences-1280.png`
- The canonical `/preferences` route exposes all seven saved-default fields, explicit save/retry/refresh/discard states, workspace persistence truth, and the immutable new-edit baseline boundary.
- Focused browser coverage proves the Current Edit Preferences group/field hierarchy, bounded grid, sticky apply rail, dirty-leave guard, apply state, and approval lock behavior.
- Guarded local browser review passes for the saved scope at 1024px and 1440px and for the exact-edit scope at 700px, 1024px, and 1280px without horizontal overflow or console errors.
