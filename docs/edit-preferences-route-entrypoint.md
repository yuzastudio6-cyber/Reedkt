# Edit Preferences Route Entrypoint

## Decision

`edit_preferences_route_entrypoint_passed_mock_local_ready_for_internal_testing`

## Summary

This milestone wires the primary `/preferences` route into the app as a clean mock/local Preferences page. The older `/edit-preferences` URL remains a compatibility redirect so existing internal-testing links still land on the same page.

The route is production-shaped for internal testing, not a shortcut. It keeps Edit Preference distinct from Project, Edit Chat, and Edit Brief, and it preserves the future path toward authenticated persistence and owner-approved runtime gates.

## Connected Scope

- Canonical route: `/preferences`
- Legacy redirect: `/edit-preferences`
- Navigation: sidebar Preferences item.
- Sidebar rule: the primary sidebar navigation is intentionally limited to Home, Project, and Preferences. Editor, upload, export, brand, wallet, and other old shell surfaces must not appear as primary sidebar options; their old standalone routes redirect back into Home, Project, or Preferences.
- Source options: broad editing-default preference groups only.
- Default project/session context: none.
- Draft storage: not connected in this clean shell.

## Boundaries

- No upload or file-byte read.
- No reference URL fetch.
- No Qwen, DeepSeek, provider, worker, render/export, media processing, credit reservation, or credit spend.
- No live Supabase read/write, Storage, signed URL, SQL, or migration.
- No external beta, real-user-media beta, paid production, or product-ready claim.

## Validation

- `npm run smoke:edit-preferences-route-entrypoint`
- `PLAYWRIGHT_PORT=<port> npx playwright test tests/e2e/edit-preferences-route-entrypoint.spec.ts`
- `npm run smoke:project-edit-brief-internal-testing-entrypoint`
- `npm run smoke:project-edit-brief-e2e`
- `npm run smoke:beta-readiness`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Next

Use `/preferences` during internal testing to inspect broad reusable style direction. Later milestones can connect authenticated preference persistence and owner-reviewed Preference DNA, but this route does not enable those release gates by itself.

Keep Preferences in the clean sidebar. Do not restore the older broad sidebar list or standalone old shell pages unless a later product decision explicitly expands primary navigation.
