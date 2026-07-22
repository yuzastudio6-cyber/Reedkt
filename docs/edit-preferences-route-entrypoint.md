# Edit Preferences Route Entrypoint

Status: `implemented_current_private_scope`

Status date: 2026-07-13

## Decision

`saved_edit_preferences_route_ready_for_private_internal_testing`

## Summary

The signed-in `/preferences` route now opens the canonical **Saved Edit Preferences** scope. The older `/edit-preferences` URL remains a compatibility redirect to the same page.

This route is one half of the Edit Preferences system:

1. Saved Edit Preferences provide reusable workspace defaults for future edits.
2. Current Edit Preferences provide exact-edit overrides inside a named edit.

The page is production-shaped for private/internal testing. It does not claim production database durability, provider execution, live billing, public delivery, or product readiness.

## Connected Scope

- Seven saved fields: edit level, workflow type, cleanup preference, visual preference, mood/style, credit preference, and target platform.
- One explicit option to pre-confirm reusable editing choices for a new edit.
- Identity/workspace-scoped local-test persistence and the reviewed authenticated private-internal repository boundary.
- Explicit **Save defaults**, retry, refresh, discard, unsaved-navigation protection, and preserved-draft feedback.
- New named edits copy the seven effective values into an immutable creation baseline. Existing edits do not change when Saved Edit Preferences change later.
- The normal route hides internal connection diagnostics. Development/E2E diagnostics require the explicit `?internalTesting=1` query.

## Navigation

- Canonical route: `/preferences`.
- Legacy redirect: `/edit-preferences`.
- Required backend-line sidebar links: Home, Projects, Edit Videos, and Edit Preferences. Projects keeps `/projects`; Edit Videos uses `/edit-videos` and opens exact normal edits without changing `/projects/:projectId/edits/:editSessionId`.
- Combined-source integration also retains Motion Studio as its own destination/workspace and must not enforce an exact-four-link ceiling.
- Retired standalone shell routes remain redirects into Home, Projects, or Edit Preferences.

## Safety Boundaries

- No upload or file-byte read.
- No reference URL fetch.
- No provider, Qwen, DeepSeek, worker, media-processing, render, or export call.
- No credit reservation, spend, release, refund, wallet mutation, or billing action.
- No live Supabase migration, SQL, RLS, Storage, or signed-URL action.
- No external beta, real-user-media beta, paid production, or product-ready claim.

## Validation

- `npm run smoke:edit-preferences-route-entrypoint`
- `npm run smoke:edit-preference-persistence`
- `npm run smoke:edit-preference-backend-route`
- `npm run smoke:planning-input-safety`
- `npx playwright test tests/e2e/edit-preferences-route-entrypoint.spec.ts tests/e2e/preferences-persistence.spec.ts tests/e2e/edit-preferences-current-edit.spec.ts --workers=1`
- Frontend TypeScript, targeted ESLint, production build, frontend/server boundary, and `git diff --check`.

## Remaining Production Work

Production multi-device durability still requires an approved Supabase migration baseline, reviewed RLS and tenancy evidence, conflict behavior, deployment evidence, and production security validation. Those gates remain closed.
