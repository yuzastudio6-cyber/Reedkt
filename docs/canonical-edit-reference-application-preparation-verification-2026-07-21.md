# Canonical Edit Reference application preparation verification

Date: 2026-07-21

## Outcome

The browser no longer constructs a trusted `PreferenceApplicationRecord` from
its own aggregate library response. It submits only a bounded intent containing
persisted authority identities, revisions, and digests to the authenticated
ReEditPro API. The API rebinds the actor and exact-edit scope, selects one
server-only preparation runtime, and accepts only a validated, sanitized
prepared-application authority.

The mounted local browser proof uses a controlled process-local fixture. The
isolated canonical V3 database proof uses the service-role-only
`prepare_edit_reference_application_v1` RPC. Neither runtime is production
authority.

## Canonical preparation contract

Preparation is deliberately separate from Apply:

1. The user selects an approved Edit Preference for an exact named edit.
2. The browser sends reference, study, DNA, target-package, source, Brief, and
   expected-revision identities/digests only.
3. The server rebinds the authenticated actor and workspace write scope.
4. The preparation authority re-reads the active reference, approved study,
   approved DNA, passed QA, and ready exact-target understanding package.
5. One unconnected application is created under a domain idempotency key.
6. The browser receives only the prepared authority and safe display name.
7. The existing outer exact-edit Apply transaction performs the later
   apply/replace/remove lifecycle mutation and preference commit atomically.

Preparation never connects guidance, invalidates a plan or estimate, mutates
an approved snapshot, starts provider/worker execution, calculates customer
price, changes customer credits, or includes a service fee.

## Local database proof

Migration `202607210007_edit_reference_application_preparation.sql` adds:

- immutable, tenant-bound exact-target understanding packages;
- immutable preparation audit events;
- forced RLS and authenticated tenant-scoped reads;
- no authenticated mutation grants;
- one service-role-only preparation RPC;
- exact request and idempotency digests;
- server-side actor membership and exact-edit checks;
- canonical reference/DNA/QA/target-package re-reads;
- one prepared, not-connected application write;
- exact response replay and changed-request conflict behavior.

`008_edit_reference_application_preparation.sql` proves two-user/two-workspace
isolation, authenticated direct-RPC denial, direct-table-write denial,
immutable target/evidence rows, exact replay, conflict rejection,
cross-workspace rejection, and absence of lifecycle, plan, estimate, approval,
provider, pricing, or credit mutation.

The loopback PostgREST smoke uses the local service-role credential only inside
the server-side adapter closure. That credential is not accepted as a method
argument, returned, logged, or made available to browser code.

## Mounted browser proof

The canonical real-file Playwright case performs:

- library creation and approved reference preparation;
- exact named-edit creation, source upload, source preparation, and Edit Brief;
- exact-target study readiness;
- server preparation with a deliberately lost committed response;
- idempotent response recovery without a duplicate application;
- atomic Apply, reload, replacement, second reload, and removal;
- canonical authority readback after every lifecycle change;
- responsive overflow and source-file checksum checks.

## Verification boundary

This evidence is local and private only. The historical
`supabase/migrations/` chain remains untouched and
`blocked_by_parallel_foundations`. No remote Supabase project, cloud storage,
provider, billing, deployment, public delivery, or customer-facing production
operation was used.

Production remains blocked until the same contract has a reviewed live
repository/RPC adapter, deployed Auth/RLS/Storage and two-tenant evidence,
same-release server qualification, operational backup/rollback evidence, and
an independently accepted staging run.
