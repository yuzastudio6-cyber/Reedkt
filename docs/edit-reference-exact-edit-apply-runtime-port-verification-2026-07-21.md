# Edit Reference exact-edit Apply runtime port verification — 2026-07-21

## Scope

This slice mounts the canonical exact-edit preference and optional Edit
Reference transaction behind one server-only runtime port and two reviewed
frontend-safe HTTP routes:

- `GET /v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/apply-authority`
- `POST /v1/projects/:projectId/edit-sessions/:editSessionId/edit-preferences/apply`

The GET returns a sanitized optimistic-concurrency snapshot. It grants no
browser mutation authority. The POST accepts that unchanged snapshot, a
bounded seven-field preference patch, and at most one `apply`, `replace`, or
`remove` reference transition. Actor identity, workspace write access,
route scope, idempotency identity, and the internal transaction request are
derived or rebound by the server.

## Transaction and replay rules

- Generic preference changes and the optional reference lifecycle share one
  database transaction and one planning-input revision increment.
- The reference lifecycle request is nested and is never called as a second
  mutation endpoint by this flow.
- The database adapter must re-read and lock canonical tenant-scoped rows.
- A lost response is retried with the exact same operation and
  `Idempotency-Key`; it returns the same committed receipt.
- Reusing that key with any changed operation fails with
  `IDEMPOTENCY_CONFLICT`.
- Cleanup changes require Footage Prep again; target-platform changes require
  output-frame reconfirmation; every material change requires a fresh plan
  and estimate.
- Approved snapshots and historical private previews remain immutable.

## Runtime selection

`EditReferenceExactEditApplyRuntimePort` carries the existing local canonical
V3 Supabase RPC adapter without creating another preference, application, or
planning authority. The loopback adapter is explicitly
`isolated_local_rls_proof_unreleased`, cannot self-promote, and is rejected by
hosted selection. Hosted production requires a separately source-qualified,
same-release canonical repository port. No qualifier for that live port is
created in this slice.

The browser client preserves drafts on retryable failure, distinguishes
access, stale, blocked, unavailable, and malformed-response outcomes, and
does not claim that an unavailable backend is an empty preference state.

## Focused proof

`npm run smoke:edit-reference-exact-edit-apply-runtime` proves:

1. The mounted authority route returns the exact selected application and
   no browser mutation authority.
2. One mounted Apply changes a generic preference and connects the selected
   reference in one receipt.
3. Retrying the exact operation and key after a simulated lost response
   returns the same transaction receipt without a second commit.
4. A changed operation with the same key is rejected.
5. A mismatched edit-session route is rejected before the runtime port.
6. Caller-asserted production flags cannot qualify a hosted port and no
   port method is invoked.
7. Customer price, customer credits, service fee, providers, and workers
   remain untouched.

## Readiness classification

This is a mounted local/private contract and HTTP/client proof. It is **not**
production authority. The remaining release gates include the reviewed live
repository/RPC adapter, deployed Auth/RLS/storage evidence, same-release
runtime qualification, mounted UI reconciliation, and browser-to-live-backend
acceptance. Remote Supabase, cloud, provider, billing, deployment, rendering,
and public delivery remain disabled.
