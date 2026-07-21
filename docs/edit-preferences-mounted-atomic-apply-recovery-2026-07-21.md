# Edit Preferences mounted atomic Apply recovery — 2026-07-21

## Scope

This slice replaces the mounted Current Edit Preferences page's split local
preference and Edit Reference mutations with the canonical exact-edit Apply
boundary already exposed by the private backend:

- `GET /v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/apply-authority`
- `POST /v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/apply`

The mounted route remains
`/projects/:projectId/edits/:editSessionId?view=preferences` through the one
`EditorPage -> ChatNativeEditor` product shell. No second editor, preference
store, reference lifecycle, planning approval, or navigation authority is
introduced.

## Apply and recovery behavior

- Opening Current Edit Preferences is non-mutating.
- The browser reads one sanitized canonical authority snapshot immediately
  before Apply.
- The seven preference fields and at most one Edit Reference lifecycle change
  form one exact operation.
- The operation and its `Idempotency-Key` are written to a scope-bound browser
  recovery journal before the request is sent. If that journal cannot be
  written and read back exactly, no mutation request starts.
- A retryable transport or unknown-response failure retains the exact saved
  operation. Fields, reference selection, reset, discard, and navigation are
  blocked until the user retries it.
- Reload restores the pending operation. Retry sends the same body and key, so
  a committed response-loss case returns the original transaction receipt
  instead of making a second change.
- The committed receipt, rather than browser arithmetic, supplies preference
  revision, planning-input revision, source-preparation disposition, and
  output-frame disposition.
- The local handoff is only a recovery/display mirror after the transaction;
  its generic backend synchronization is disabled for this receipt so it does
  not become a competing preference authority.
- Cleanup changes clear stale Footage Prep authority. Target-platform changes
  clear output-frame confirmation. Every material Apply clears the draft plan
  and estimate while preserving approved snapshot and private-review history.
- No provider, worker, generation, render, billing, customer-credit, or service
  fee action starts from Apply.

## Mounted browser proof

`npm run qa:current-edit-preferences-atomic` runs the canonical named-edit
surface against a controlled server-only implementation of the exact Apply
runtime port. With one deterministic Chromium worker it proves:

1. project creation, named-edit creation, and direct Current Edit Preferences
   routing;
2. one committed Apply whose first HTTP response is deliberately lost;
3. durable pending-operation UI across reload;
4. exact request-body and `Idempotency-Key` replay;
5. the same transaction receipt on retry;
6. one committed preference revision and visible overridden provenance;
7. immutable new-edit baseline, explicit reset, and untouched setup-gate
   behavior.

The focused run completed with exit code `0` and five executed cases. Two of
those cases are deliberately marked as expected failures—not skipped—because
they reach the remaining planning-authority blocker described below. Their
exact `TOOL_NOT_READY` response remains visible in the test output.

## Remaining planning-authority blocker

`src/lib/canonical-planning-publication-client.ts` still synchronizes exact
preferences through the retired generic `GET/PATCH .../edit-preferences`
boundary before plan publication. That authority is not the V3/V6 atomic
preference/application repository used by this Apply flow. Consequently:

- cleanup-change replanning cannot yet complete through one canonical
  preference read;
- plan approval/read-only locking cannot yet prove the exact committed V3/V6
  preference revision; and
- Chat setup choices can diverge unless they are compiled as explicit
  instruction overrides over the canonical preference snapshot.

The two browser cases for cleanup invalidation and approved preference locking
therefore execute and expected-fail at this named gate. Replacing the planning
client and planner authority port is required before these cases may be
converted to ordinary passing assertions. A mock route or test shim must not
hide this split authority.

## Edit Reference limitation

The mounted Apply operation supports the canonical optional application
lifecycle contract, but the current browser fixture proves generic preference
Apply only. Production-safe reference selection/replacement still requires the
canonical server-side application preparation CRUD/read adapter and the
source-verified V3 lifecycle repository. The older split connect, replace, and
remove calls are no longer used by this mounted Apply path.

## Verification

The bounded slice is verified with:

- focused ESLint for every changed source and test file;
- app TypeScript build mode;
- server TypeScript checking;
- `npm run qa:current-edit-preferences-atomic`;
- the exact-Apply runtime, production-transaction, and local Supabase/RLS
  smokes;
- full lint and build;
- frontend-boundary and secret scans; and
- `git diff --check`.

## Readiness classification

This is **mounted local/private integration evidence**, not deployed production
authority. Remote Supabase, hosted Auth/RLS/storage, cloud workers, providers,
billing, deployment, public delivery, and production promotion remain disabled.
The slice must not be described as end-to-end production ready until the
planning authority, canonical reference preparation repository, live hosted
adapters, and same-release deployed acceptance gates pass.
