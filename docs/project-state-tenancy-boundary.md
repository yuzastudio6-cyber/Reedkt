# Project State Tenancy Boundary

Status: `RP-PROJECTSTATE-TENANCY-01` mock/local and authenticated internal-test hardening.

## Outcome

Project metadata and internal edit handoffs no longer use origin-global browser arrays. Protected routes resolve an explicit signed-in user/workspace scope before loading project state, and browser persistence uses separate version-2 envelopes and keys for the exact authentication mode, user, and workspace.

The backend project and internal-edit-state routes also require live workspace membership. Write authorization runs before idempotency persistence, and local internal-test records are isolated by authenticated user and workspace.

## Browser boundary

- Legacy unscoped keys `reeditpro.localProjects.v1` and `reeditpro.localProjectHandoffs.v1` are ignored and are not migrated implicitly.
- Version-2 project and handoff records include the exact auth mode, user id, workspace id, scope fingerprint, payload, and save timestamp. Storage-key segments are canonical length-prefixed encodings, so allowed periods inside ids cannot create delimiter collisions.
- A mismatched owner, workspace, version, fingerprint, or malformed envelope fails closed.
- Workspace/user changes remount the protected route subtree with a collision-free key built from the full normalized scope. Active page/editor state therefore cannot survive a scope change.
- Supabase membership is verified before first render and rechecked on focus, visibility return, and a bounded interval. Successful background checks keep the mounted route stable. Confirmed missing membership or an API 401/403 deactivates the scope immediately; transient lookup errors fail closed on initial load but do not destructively erase a previously verified private cache.
- Supabase cache helpers refuse reads/writes while their scope is inactive. Explicit authorization failure also removes that scope's project/handoff cache before requesting membership revalidation.
- Signing out removes access to protected UI state without deleting the signed-in user's scoped cache. Returning as the same identity restores only that exact cache.

The browser cache is an internal convenience layer, not an authorization source and not a production database.

## Backend boundary

- Project create/read/list and internal-edit-state save/read/list verify current `workspace_members` evidence for real bearer-authenticated requests.
- Viewer roles can read but cannot write. Owner, admin, and editor roles may write.
- Mock users are allowed only in explicit non-production local/mock runtime.
- Project/internal-state reads require an explicit workspace id and validate returned records against it.
- Project responses must match the exact authenticated owner as well as workspace. Internal-state responses must match the trusted backend user, workspace, outer project/edit ids, and nested handoff project/edit ids. Local loopback testing uses an explicit trusted backend-user mapping; non-loopback callers cannot use that override.
- Authorization for project creation and internal-state save runs before the
  generic middleware may reserve a bounded local/mock key. Generic
  production/Supabase writes remain blocked until a route-specific atomic
  mutation and response association exists.
- Local internal-test paths and memory keys include authenticated user and workspace scope.
- Local JSON writes use private directories/files, temporary-file plus rename atomic replacement, and a SHA-256 record checksum.
- Version-1/unrecognized backend records are not accepted by the version-2 readers.
- Clearing process memory recovers only records in the same authenticated user/workspace scope.
- Revoked workspace membership blocks subsequent GET and LIST operations immediately.
- Browser sync coalesces pending saves by edit and drains them serially. The server serializes writes per user/workspace/project/edit and treats the handoff's validated `updatedAt` as source-revision evidence: older writes and equal-revision/different-payload writes return `409`, while an equal identical payload is idempotent.

## Deliberate limits

- No Supabase migration or RLS policy was changed.
- No wallet, credit settlement, provider, worker, render, export, or generation capability was enabled.
- No production collaboration semantics are claimed for local internal-test files. In this mode, records remain isolated by both user and workspace even when two users are members of the same workspace. Supabase project queries in this slice also preserve strict owner isolation.
- Browser fingerprints identify scope mismatches; they are not a cryptographic authentication mechanism.
- Production durability still requires the approved Supabase schema/RLS/storage evidence gates.
- Internal project/handoff truth is deliberately local-only in this slice. A GCS handoff mirror/recovery path is not claimed or used because authoritative project tenancy metadata is not durably mirrored with it; clean-backend recovery remains blocked pending the approved database/storage milestone.
- The invalidation event, cache deactivation/purge, protected-subtree keying, and backend revocation paths have deterministic smoke/E2E evidence. A real mounted Supabase-session membership revocation transition still requires the approved staging Supabase/RLS environment and remains a staging evidence gate; this slice does not claim that external evidence.

## Evidence

- `server/smoke/project-persistence-tenancy-smoke.ts`
  - legacy keys ignored
  - user/workspace browser isolation
  - malformed and foreign envelopes rejected
  - dotted-id storage-key collision regression
  - inactive Supabase scope hides cache until revalidated
- `server/smoke/project-state-tenancy-smoke.ts`
  - live membership and role enforcement
  - authorization before idempotency mutation
  - cross-user/cross-workspace backend isolation
  - memory-clear recovery
  - concurrent/stale write latest-revision preservation
  - revocation enforcement
  - atomic persistence residue check
- `tests/e2e/project-persistence-tenancy.spec.ts`
  - active-route isolation from legacy, foreign-user, and foreign-workspace caches
  - sign-out and same-identity return behavior
  - malformed current-key owner metadata rejected
- Existing editor and full-stack private-review suites retain the project/edit/approval flow and exercise scoped envelope recovery.
- `npm run qa:internal-pipeline` passes with both tenancy smokes registered before the approved tool, upload, and full-stack private-review evidence.
- `npm run test:e2e` passes all 89 browser tests, including scoped cache isolation, project recovery, Edit Brief, Preferences, approval, viewport, and keyboard flows.
