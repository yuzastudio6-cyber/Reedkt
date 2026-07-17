# Generic Idempotency Boundary Hardening — 2026-07-10

Status: `local_mock_replay_ready_production_fail_closed`

This document records the source-level correction to the Express
`requireIdempotency` middleware. It does not add or run SQL, deploy an API,
change Supabase, or claim distributed production idempotency.

## Finding Corrected

The previous generic middleware recorded only a request hash. A same-key,
same-hash retry was labelled `replayed`, but the middleware still invoked the
route handler. That could repeat the route mutation. Its Supabase path also
performed a separate select and insert in `api_idempotency_keys`; neither the
reservation nor the response was transactionally coupled to the route's real
mutation.

The generic middleware no longer treats that select-then-insert sequence as an
atomic idempotency authority.

## Explicit Local/Mock Contract

For an explicit non-production `local` or `mock` runtime whose route uses the
bounded local/mock persistence path, the middleware now:

1. verifies authentication and workspace write authorization before touching
   the key store;
2. synchronously reserves `(workspace, user, key)` before invoking the route
   handler;
3. rejects the same key with another request hash;
4. rejects a same-hash duplicate while the first request is in progress;
5. captures the completed HTTP status, a safe response-header allowlist, and
   the exact response bytes;
6. returns that completed response on retry without invoking the handler;
7. seals the key as unreplayable when the response is `5xx` or the connection
   closes before completion, because middleware cannot prove that the business
   mutation did not commit;
8. keeps completed entries for a TTL and never evicts an unexpired key merely
   to make room;
9. fails closed when the maximum entry count is reached; and
10. seals a completed key whose response exceeds the response/total-byte bound,
    returning replay-unavailable instead of rerunning its mutation.

In-progress entries are not expired underneath a live handler. A closed
connection seals the reservation as unreplayable. Capacity pressure fails
closed, which is safer than forgetting an in-flight request and permitting
concurrent execution.

This store is single-process evidence only. A process restart loses it, and it
does not coordinate multiple API instances.

## Supabase And Production Boundary

The generic middleware now returns `IDEMPOTENCY_ATOMICITY_REQUIRED` before the
route handler in production, cloud/non-local runtime, and Supabase-write paths
that are not explicitly routed to bounded local/internal-test persistence. It
does not read or write `api_idempotency_keys` in those paths.

A production write may be enabled only through a route-specific transaction or
RPC that atomically couples all of the following:

- authenticated tenant authorization;
- request-hash conflict detection;
- in-progress reservation/concurrency control;
- the actual domain mutation;
- the exact durable response association; and
- the applicable audit/approval/credit evidence.

The review-only canonical v2 drafts contain examples for preferences, approved
snapshot plus credit authority, execution-job creation, and worker lease
claims. They are not active migrations and were not executed by this change.
Every remaining route using generic middleware still needs its own reviewed
atomic RPC/transaction before production mutation can be enabled.

Routes that already own idempotency inside a route-specific atomic boundary and
do not use `requireIdempotency` are unchanged. This includes the current Edit
Preferences private single-host CAS path and the approved-snapshot service
boundary; their production readiness remains governed by their own evidence.

The private Cloud dispatch outbox is another route-specific, non-HTTP
single-host authority. It content-binds one package attempt and replays the
same controller/worker receipts under concurrent redelivery without rerunning
an execution action. It deliberately reports distributed transaction proof as
false; the future package-queue mutation and outbox insert must share one
reviewed database transaction before Cloud Tasks creation is enabled.

## Safe Failure Semantics

- `409 IDEMPOTENCY_CONFLICT`: the key was reused with another request hash.
- `409 IDEMPOTENCY_REQUEST_IN_PROGRESS`: the matching request is still active.
- `503 IDEMPOTENCY_CAPACITY_EXCEEDED`: the bounded local cache has no safe room.
- `503 IDEMPOTENCY_REPLAY_UNAVAILABLE`: the mutation completed but its response
  could not be retained inside the configured bounds; the handler is not rerun.
- `503 IDEMPOTENCY_ATOMICITY_REQUIRED`: production/Supabase mutation is blocked
  until a route-specific atomic boundary exists.

A `5xx` or closed connection is ambiguous: the mutation may already have
committed even though the response failed. The local boundary therefore seals
the key and refuses to rerun it. Production must couple the mutation and
idempotency state in one database transaction before distributed retry is safe.

## Evidence

Run:

```bash
npx tsx server/smoke/idempotency-boundary-smoke.ts
```

The smoke proves:

- no duplicate handler or side effect on concurrent retry;
- completed status/body replay without handler execution;
- request-hash conflict;
- no duplicate side effect after a simulated post-mutation `5xx`;
- completed-entry TTL;
- maximum-entry fail-closed behavior without live-entry eviction;
- oversized-response key sealing; and
- Supabase-backed generic-write rejection, including a non-production local
  process that would otherwise persist through Supabase; and
- production rejection before handler or database mutation.

## Residual Production Work

- Port each durable write route to a reviewed route-specific atomic RPC or
  transaction with response linkage.
- Reconcile and execute the canonical migration chain only after explicit
  local/staging approval.
- Prove two-user/two-workspace isolation, same-key races from separate API
  processes, transaction rollback, response replay, TTL/retention, and audit
  evidence against the chosen database.
- Add deployed observability and distributed admission/rate controls.
- Verify the live Supabase catalog and advisors before any production claim.
