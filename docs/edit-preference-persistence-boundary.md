# Edit Preference Persistence Boundary

Status: `saved_backend_and_exact_edit_private_boundary_ready`

This document records the bounded RP preference persistence slice for the current active product. It includes authenticated private-internal Saved Edit Preferences backed by contained single-host storage and exact-edit Current Edit Preferences persisted through the existing scoped edit handoff. It does not create a migration, Supabase preference table, preference RLS policy, separate current-preference API, cloud deployment, production account store, or cross-device preference service.

## Current Capability

| Runtime | Capability | Current behavior |
| --- | --- | --- |
| `local_test` | Identity/workspace-scoped browser persistence | Preferences are stored under a v2 key scoped to the signed-in local-test user id and `workspace-internal-testing`. A record also carries the same owner scope and a deterministic scope fingerprint. Mismatched or malformed records fail closed to safe defaults. |
| `supabase` + explicit local internal-test server | Authenticated private-internal backend persistence | The browser resolves the current workspace, sends the real bearer token to reviewed GET/PUT routes, and the server verifies the token plus workspace membership before reading or atomically writing one private single-host file per user/workspace. Responses are deliberately `mockOnly: true` and identify the exact `authenticated_private_internal_backend` capability. |
| Supabase staging/production | Unavailable | No Supabase preference row or RLS policy exists. The private-internal service rejects production, non-local, non-local-storage, or non-explicit-internal-test runtimes and never falls back to browser storage for a Supabase identity. |
| Signed out / unavailable auth | Unavailable | Protected routes hide the preference UI and the repository refuses persistence without a signed-in identity. |

This raises Saved Edit Preferences from a contract-only Supabase path to a bounded authenticated backend persistence capability for private single-host internal testing. It does **not** make either preference scope staging-ready, external-beta-ready, cross-device-ready, or production-ready. The existing `local_test` browser behavior remains unchanged.

## One System, Two Persistence Scopes

`Preferences` and `Edit Preferences` are one product feature:

1. **Saved Edit Preferences** are reusable per-user/workspace defaults persisted by the repository/API boundary described below.
2. **Current Edit Preferences** belong to one exact user/workspace/project/edit and persist with that edit's existing local/private handoff record.

The second scope does not add a new top-level route, backend endpoint, or preference table. The named edit exposes it at its existing URL with `?view=preferences`.

## Storage Isolation

The active local-test storage key is:

```text
reeditpro.localEditPreferences.v2.<encoded-user-id>.<encoded-workspace-id>
```

The legacy unscoped key `reeditpro.localEditPreferences.v1` is intentionally ignored. It is not automatically migrated into the first signed-in identity because ownership cannot be proven. This prevents historical device-wide values from leaking into another user or workspace.

The stored v2 envelope contains:

- record version;
- owning user id;
- owning workspace id;
- deterministic scope fingerprint;
- normalized preference snapshot;
- save timestamp.

The key alone is not trusted. The repository also checks the owner fields and fingerprint before returning a record.

## Snapshot And Planning Semantics

- The seven implemented fields are edit level, workflow type, cleanup preference, visual preference, mood/style, credit preference, and target platform.
- A local-test save creates the existing deterministic scoped snapshot id; an authenticated backend save creates a server-generated private-internal snapshot id.
- Creating a named edit copies the seven saved values into its setup and records an immutable creation baseline with snapshot id, capture time, persistence source, and provenance.
- Existing edits keep that creation baseline when Saved Edit Preferences later change.
- Legacy edits without the new baseline shape recover a compatibility baseline from their existing setup and mark it with `legacy_edit_snapshot` provenance.
- The exact edit persists its effective current values, fields changed from the creation baseline, current preference revision, and update time.
- Current-edit changes are drafts until the user chooses **Apply to this edit**; a no-op apply does not create a new revision.
- **Use original** and **Use all original defaults** reset to the immutable creation baseline, not to whatever Saved Edit Preferences contain today.
- Explicit chat instructions still outrank defaults for the current edit.
- All seven implemented current-edit changes require a new plan and estimate when a draft plan exists. The draft plan/estimate are cleared rather than silently reused.
- Cleanup changes also reset Footage Prep/source-cleanup readiness.
- Target-platform changes also clear output-frame/aspect-ratio confirmation.
- The safe planning trace/fingerprint includes effective values, persistence source, override keys, and current preference revision.
- After approval, reservation, private execution/review, completion, or revision handoff, the form is read-only. Further changes go through Chat's revision/replanning flow; the approved snapshot and reservation trace are not rewritten in place.
- Preferences alone never upload media, execute tools, reserve/spend credits, approve a plan, or start generation.

## Authenticated Private-Internal Backend Contract

`src/lib/edit-preference-repository.ts` defines typed request/response records for the current private-internal routes:

```text
GET /v1/workspaces/:workspaceId/edit-preferences/current
PUT /v1/workspaces/:workspaceId/edit-preferences/current
```

The client uses these routes only when the active API registry contains an exact reviewed route with:

- `frontend_safe_ready` status;
- `frontend_safe` runtime mode;
- workspace-member/editor/owner-admin security;
- no service-role, provider, or Stripe secret exposure to the frontend route caller.

The routes are registered as `frontend_safe_ready`, mounted in the server, and have no mock handler. Mock transport therefore fails closed instead of pretending an authenticated save occurred. In reviewed HTTP mode, the existing frontend API client attaches the authenticated bearer token. The service then requires all of the following:

- a non-mock user proven by the public Supabase auth client;
- a real bearer access token on the request;
- an exact server-side `workspace_members` match for the authenticated user and requested workspace;
- `owner`, `admin`, or `editor` role for writes (`viewer` remains read-only);
- local runtime mode, local storage mode, non-production environment, and the explicit Supabase internal-test execution flag.

A path workspace id or frontend workspace hint is never treated as authorization. Cross-user and cross-workspace reads fail closed.

### Authorization Before Idempotency Mutation

The preference PUT intentionally does not use the generic `requireIdempotency` middleware. The router still requires a verified auth context, a valid request shape, and an `Idempotency-Key`, but it does not write generic idempotency evidence.

Inside the preference service, the ordering is fixed:

1. reject non-internal, non-local, or production runtime modes;
2. require bearer-backed, non-mock authentication;
3. verify the exact workspace membership and write-capable role;
4. only then derive the canonical SHA-256 request hash from the verified workspace, expected snapshot, and normalized preference payload;
5. acquire the per-scope write lock and evaluate the idempotent replay/conflict and snapshot rules;
6. atomically persist the preference record and its last-write evidence.

Unauthenticated users, non-members, viewers, and non-internal runtimes therefore cannot create an `api_idempotency_keys` row, preference directory, temporary file, or preference record. Authorized replay/conflict evidence remains embedded in the checksummed private preference record rather than the generic idempotency table.

## Contained Durable Record

The private-internal service writes under:

```text
<LOCAL_STORAGE_ROOT>/preferences/private-internal-authenticated/
  workspace-<sha256>/user-<sha256>.json
```

Raw user/workspace ids never become path segments. The path is resolved inside the configured storage root, traversal-shaped identifiers are rejected, parent directories are created only inside that root, and writes use an exclusive temporary file followed by atomic rename. Temporary files are cleaned up after failure.

Each record includes:

- fixed record version and private-internal source;
- authenticated user and verified workspace ids;
- deterministic user/workspace scope fingerprint;
- normalized preference snapshot with a server-generated snapshot id;
- created/updated timestamps;
- the last persisted idempotency key and request hash;
- `mockOnly: true` capability evidence;
- a SHA-256 checksum over the persisted record fields.

Reads validate version, source, owner scope, fingerprint, normalized preference values, persistence label, and checksum. Malformed or tampered records are rejected; they are not silently normalized into a trusted response.

Writes require an `Idempotency-Key`. Replaying the last persisted key and request hash returns the existing record without another write. Reusing that key with a different payload returns `409`. Updates also require the last loaded snapshot id, and same-scope writes are serialized within the single server process, preventing concurrent or stale browser requests from overwriting a newer preference record. Multi-process/distributed concurrency remains a production-store gate.

## UI Boundary

- The top-level Edit Preferences form leads with saved defaults and identity/workspace persistence state and uses the explicit **Save defaults** action.
- Copy no longer says preferences are generically saved "on this device."
- The named edit's `?view=preferences` destination uses explicit apply/reset controls, source metadata for original versus overridden values, and a dirty-navigation guard.
- Internal backend readiness diagnostics are absent from normal UI. They render only in development/E2E with the explicit `?internalTesting=1` query and remain outside normal navigation.
- In local-test mode, the session diagnostic says the loopback test identity is signed in while separately identifying missing Supabase configuration.
- Supabase mode resolves the current workspace through the existing authenticated workspace bootstrap service before creating a preference repository.
- The local-test path remains synchronous browser storage and does not request a bearer token or invoke the backend route.

## Evidence

- `npm run smoke:edit-preference-persistence`
  - user A/user B isolation;
  - same-user/different-workspace isolation;
  - legacy v1 record ignored;
  - owner-mismatch rejection;
  - signed-out failure boundary;
  - Supabase mock-transport failure boundary (no fake authenticated persistence);
  - reviewed GET/PUT route registry metadata.
- `npm run smoke:edit-preference-backend-route`
  - unauthenticated rejection and verified bearer requirement;
  - server-side workspace membership and write-role checks;
  - authorization/runtime denial before generic idempotency-table or preference-file mutation;
  - cross-user and cross-workspace isolation;
  - malformed and traversal-shaped input rejection;
  - server-generated snapshots, same-scope write serialization, and optimistic concurrency conflict handling;
  - persisted idempotent replay and conflicting replay rejection;
  - contained atomic writes with no temporary-file residue;
  - frontend repository HTTP load/save round trip with the test bearer token;
  - explicit production-runtime rejection;
  - restart recovery from the same private storage root;
  - tampered owner-scope record rejection;
  - exact `mockOnly` private-internal capability response.
- `tests/e2e/preferences-persistence.spec.ts`
  - another identity's stored values are not shown;
  - the current identity saves to its own scoped key;
  - the foreign record remains unchanged;
  - signing out removes access to the Preferences surface;
  - signing the same identity back in restores only that identity's values.
- `tests/e2e/edit-preferences-current-edit.spec.ts`
  - a new edit retains its immutable saved-preference baseline;
  - the exact-edit destination is query-addressable and dirty navigation is guarded;
  - explicit overrides survive reload and can be reset per field to the original baseline;
  - cleanup changes clear a draft plan/estimate and require Footage Prep again;
  - approved work exposes read-only preferences and preserves snapshot/reservation trace when returning to Chat.

## Remaining Production Gates

- Decide and migrate a durable Supabase preference table/JSONB owner model.
- Add and review preference-specific RLS for user/workspace access.
- Prove two real Supabase users and two workspaces in local/staging RLS tests.
- Migrate and prove the exact-edit baseline/override/revision model in the chosen shared production store, including version/audit retention.
- Prove revocation, deletion, workspace switching, and cross-device behavior.
- Prove concurrent writes, backup/recovery, observability, and retention against the chosen shared durable store.
- Reconcile and validate the active Supabase migration chain before running local/staging database tests.

Until those gates pass, use the exact capability label:

> Authenticated private-internal single-host preference persistence with verified bearer/workspace membership; no Supabase preference row or staging/production claim.
