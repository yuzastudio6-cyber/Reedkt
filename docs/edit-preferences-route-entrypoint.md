# Edit Preferences Route Entrypoint

## Decision

`edit_preferences_workspace_feature_complete_except_external_blocker`

## Summary

This milestone wires the primary `/preferences` route into the app as the Edit Preferences workspace. The older `/edit-preferences` URL remains a compatibility redirect so existing internal-testing links still land on the same page.

The route is production-shaped for backend-local review, not a shortcut. It keeps Edit Preferences distinct from Project, Edit Chat, and Edit Brief, and preserves the future path toward authenticated remote persistence and owner-approved runtime gates.

## Connected Scope

- Canonical route: `/preferences`
- Legacy redirect: `/edit-preferences`
- Navigation: sidebar Edit Preferences item.
- Sidebar rule: the primary sidebar navigation is intentionally limited to Home, Project, and Edit Preferences. Editor, upload, export, brand, wallet, and other old shell surfaces must not appear as primary sidebar options; their old standalone routes redirect back into Home, Project, or Edit Preferences.
- Source options: Edit References, Workspace Defaults, Applied Edits, and Safety & Privacy.
- Default project/session context: none.
- Edit Reference authority: private backend-local repository and authenticated local API boundary.
- Workspace Defaults authority: browser-local until a later persistence milestone.

## Boundaries

- Deliberate reference-video evidence may use the private backend-local upload flow.
- FFprobe and FFmpeg may perform the bounded local structure/frame-plan work proven by Gate 8.1; raw frames, signed URLs, and filesystem paths are not persisted as study truth.
- No reference URL fetch.
- No live Qwen, DeepSeek, external provider, distributed worker, render/export, credit reservation, or credit spend.
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

Use `/preferences` during internal testing to study Edit References and manage broad reusable defaults. The Edit Reference workflow is backend-local and keeps remote Supabase, external provider execution, production charging, and release gates disabled.

Keep Edit Preferences in the clean sidebar. Do not restore the older broad sidebar list or standalone old shell pages unless a later product decision explicitly expands primary navigation.
