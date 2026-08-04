# Canonical Edit Reference Mounted Domain Repository Runtime Port Verification

Date: 2026-07-21

## Outcome

Edit Reference domain persistence now has one server-owned mount path:

```text
ReeditProApiAppOptions
→ RuntimeState
→ ServiceContext
→ createEditReferenceService
→ library, study, DNA, QA, approval, and application routes
→ createEditReferenceTargetVideoUnderstandingService
→ exact-target study authority reads
```

Before this change, mounted routes selected the private repository internally
for protected local requests and a disabled repository for hosted requests.
The service's repository override was test-oriented, had no authority metadata,
and did not survive HTTP app construction. Exact-target understanding selected
its own private repository independently.

## Authority rules

- Only server bootstrap can mount the runtime port. Browser headers, query,
  request bodies, and frontend contracts cannot select a repository.
- Main Edit Reference and exact-target services select the same mounted port.
- A test-only repository override cannot be mixed with the mounted authority.
- Two different server authorities fail before any repository method runs.
- Protected local mode retains the existing private repository.
- Hosted mode has no private fallback and remains fail-closed when the
  canonical V6 repository is absent or unqualified.
- Static booleans cannot promote an adapter. This source exports no live
  qualifier or production factory.
- Response persistence labels and warnings are derived from the selected
  repository instead of being permanently hard-coded as backend-local.

## Mounted proof

`server/smoke/edit-reference-mounted-domain-repository-runtime-port-smoke.ts`
injects an intentionally invalid local port through `createReeditProApiApp`.
The mounted library-list and exact-target routes both select that exact port and
fail with `local_domain_repository_port_authority_invalid` before `read`,
`readAuditEvents`, or `mutate` can execute. The smoke also proves both services
reject competing server authorities.

The mounted canonical Chromium suite then passed all 11 real-file cases from
the same source tree: library creation, private resumable video study and
checkpoint recovery, lost-response reconciliation for create/archive/evidence/
Study Chat/DNA/QA/approval/whole-video controls, and exact-target
apply/replace/reload/remove. Its storage root was on the authorized external
drive; it did not contact a remote service.

## Remaining closed gate

This is a mount and qualification boundary, not the live repository. Production
still requires a reviewed operation-safe V6 repository/RPC adapter with real
Auth/RLS, atomic idempotency/CAS, cross-device readback, same-release evidence,
and rollback proof. The current aggregate callback repository must not be
presented as a network-transaction implementation.

No SQL or migration ran. No Supabase, provider, worker, cloud, billing,
deployment, render, export, or public-delivery action occurred.
