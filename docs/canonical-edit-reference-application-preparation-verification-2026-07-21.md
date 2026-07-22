# Canonical Edit Reference application preparation verification

Date: 2026-07-21

## Outcome

The browser no longer constructs a trusted `PreferenceApplicationRecord` from
its own aggregate library response. It submits only a bounded intent containing
persisted authority identities, revisions, and digests to the authenticated
ReEditPro API. The API rebinds the actor and exact-edit scope, selects one
server-only preparation runtime, and accepts only a validated, sanitized
prepared-application authority.

The mounted canonical V3 browser proof uses the request-scoped local Supabase
domain, target-package, preparation, and exact-Apply ports. The isolated local
database proof uses the service-role-only
`prepare_edit_reference_application_v2` RPC. Neither runtime is production
authority.

## Canonical preparation contract

Preparation is deliberately separate from Apply:

1. The user selects an approved Edit Preference for an exact named edit.
2. The browser sends reference, study, DNA, target-package, source, Brief, and
   expected-revision identities/digests only.
3. The server rebinds the authenticated actor and workspace write scope.
4. The preparation authority re-reads the active reference, approved study,
   approved DNA, reviewed QA, exact Edit Brief, completed target-study run,
   work-item counts, and ready exact-target understanding package.
5. One unconnected application is created under a domain idempotency key.
6. The browser receives only the prepared authority and safe display name.
7. The existing outer exact-edit Apply transaction performs the later
   apply/replace/remove lifecycle mutation and preference commit atomically.

Preparation never connects guidance, invalidates a plan or estimate, mutates
an approved snapshot, starts provider/worker execution, calculates customer
price, changes customer credits, or includes a service fee.

## Local database proof

Migration `202607210007_edit_reference_application_preparation.sql` establishes
the original persistence tables and preparation boundary. Migration
`202607210015_server_prepared_target_application.sql` replaces its preparation
entry point with V2, which adds:

- immutable, tenant-bound exact-target understanding packages;
- immutable preparation audit events;
- forced RLS and authenticated tenant-scoped reads;
- no authenticated mutation grants;
- one service-role-only V2 preparation RPC and an explicit revoked V1 entry
  point;
- exact request and idempotency digests;
- server-side actor membership and exact-edit checks;
- canonical reference/DNA/QA/target-package, exact-Brief, target-source,
  completed-run, plan-digest, and work-count re-reads;
- one prepared, not-connected application write;
- exact response replay and changed-request conflict behavior.

`008_edit_reference_application_preparation.sql` proves two-user/two-workspace
isolation, authenticated direct-RPC denial, direct-table-write denial, V1
revocation, synthetic/incomplete target rejection before mutation, immutable
target/evidence rows, and absence of lifecycle, plan, estimate, approval,
provider, pricing, or credit mutation. The TypeScript integration smoke proves
the valid server-produced application, exact replay, changed-request conflict,
cross-workspace rejection, and later atomic lifecycle mutation.

The loopback PostgREST smoke uses the local service-role credential only inside
the server-side adapter closure. That credential is not accepted as a method
argument, returned, logged, or made available to browser code.

## Mounted browser proof

The canonical V3 local Playwright case performs:

- library creation and approved reference preparation;
- exact named-edit source and Edit Brief persistence;
- exact-target registration, dependency-work completion, package persistence,
  and readiness through the same distributed pre-plan authority;
- server preparation followed by a deliberately lost committed atomic Apply
  response;
- idempotent Apply response recovery without a duplicate application or
  duplicate lifecycle mutation;
- atomic Apply, connected-authority reload, removal, and cleared-authority
  reload;
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
