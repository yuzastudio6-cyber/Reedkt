# Edit Reference Rollback Plan

Status: `review_ready_non_destructive`

Rollback is commit-based and must preserve user/owner work. Never use destructive reset, clean, broad restore, or unreviewed migration rollback.

## Relevant Commits

- Gate 7 implementation: `42d34cdc04179c6808a4c3f23286885daf116006`
- Gate 7 verification: `abb3b9548baa92c5bcdd4d5cee45a53e1ef6f66e`
- Gate 8 implementation/repair: `7ff15993c505af65abcbc61e0db259061f583e25`
- Gate 8 verification commit: recorded by final local history after this document is committed

## Preferred Rollback

If Gate 8 must be withdrawn after review:

1. freeze new edits in the affected checkout;
2. capture branch, HEAD, status, changed paths, and verification output;
3. create a new review branch from the owner-approved base;
4. use `git revert` for the exact Gate 8 commit(s), newest first;
5. resolve conflicts manually without rewriting unrelated owner work;
6. run typechecks, builds, lint, frontend boundary, Edit Reference smokes, and full Playwright;
7. verify migration count remains 21 and no external action occurred;
8. commit the explicit revert and obtain review before any push.

Do not rewrite shared history or force-push.

## Component-Level Disable/Fallback

If a narrow runtime issue is discovered before merge:

- Study Chat correction selector can be hidden only by a reviewed code change; stored successor evidence remains readable and immutable.
- Approved-reference connection can fail closed to the existing no-reference/legacy preference lane without deleting applications.
- Production repository already fails closed and requires no rollback.
- Provider/media paths remain disabled and require no external cancellation.
- Existing approved DNA, QA, application, usage, and audit records must never be deleted to simplify rollback.

## Data And Migration Safety

Gates 1–8 created no SQL migration and ran no remote Supabase command. Rollback therefore has no database migration step. The backend-local aggregate is versioned and checksum-validated; if a code rollback cannot read a newer local aggregate, preserve the private file, copy it to a quarantined backup, and restore compatibility through a reviewed forward migration rather than editing bytes by hand.

## Verification After Rollback

Minimum checks:

```text
git diff --check
git status --short
find supabase/migrations -type f | sort | wc -l  # must remain 21
npx tsc -p tsconfig.app.json --noEmit
npm run typecheck:server
npm run lint
npm run check:frontend-boundary
npm run build
npm run build:server
npm run smoke:edit-reference-goal-control-plane
npx playwright test --workers=5
```

Rollback must not push, mutate remote data, call providers, render media, or move credits without separate owner authorization.
