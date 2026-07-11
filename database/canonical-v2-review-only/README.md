# Canonical Supabase v2 — Review-Only Chain

Status: `security_review_rejected_not_executable`

Drafts 003 and 004 are rejected for promotion. Their tenant-lineage and
hashed-lease foundations are useful, but canonical plan/estimate/approval
derivation, funded credit conservation, immutable approved work items,
reservation lifecycle races, and lost-response replay are incomplete. Do not
apply or wire this chain. See
`docs/canonical-v2-security-review-2026-07-10.md`.

This directory is an isolated design and security review artifact. It is **not**
Supabase migration history, is not read by the Supabase CLI, and must not be
copied into `supabase/migrations/` until the canonical-chain review gates in
`docs/supabase-migration-baseline-reconciliation.md` have passed.

No SQL or Supabase CLI command was run while creating this draft.

## Why this directory exists

The raw `supabase/migrations/` folder contains two incompatible foundation
families. Editing that history in place would make the repository look safer
without producing a reproducible schema. Canonical v2 is therefore drafted in
this deliberately non-active path.

## Draft scope

`001_identity_tenancy.canonical-v2.draft.sql` contains only:

- `profiles`;
- `workspaces`;
- `workspace_members`;
- timestamp and identity-integrity triggers;
- hardened workspace ownership/membership helpers;
- least-privilege grants; and
- current-product RLS policies.

`002_current_product_records.canonical-v2.draft.sql` adds only the current
durable product records that can be specified without uploads or execution:

- owner-private projects;
- text-ID named edit sessions;
- one current edit-preference record per owner/workspace;
- backend API idempotency evidence; and
- append-only sanitized audit events.

Draft 002 uses composite foreign keys to bind every project-scoped record to the
same workspace as its project. Project/edit/preference/idempotency/audit
mutations are service-only. Authenticated owners receive scoped reads of
projects, named edits, preferences, and sanitized audit events; idempotency
hashes remain backend-only.

It intentionally does not create uploads, media, plans, estimates, approvals,
credits, snapshots, jobs, workers, providers, renders, exports, storage buckets,
or execution records.

`003_approval_credit_execution_authority.canonical-v2.draft.sql` adds the
minimum authority required before any expensive execution may be considered:

- an immutable approved snapshot composite-bound to its exact
  workspace/project/named edit;
- an immutable, expiring credit reservation bound one-to-one to that exact
  snapshot;
- append-only credit-reservation lifecycle events; and
- one service-only transaction skeleton that couples approval, credit
  authority, request idempotency, and sanitized audit evidence.

`004_jobs_worker_leases.canonical-v2.draft.sql` adds the control-plane contract:

- allowlisted worker service identities without credentials or tokens;
- execution jobs whose workspace/project/edit/snapshot/reservation lineage is
  derived by a service-only creation function;
- a transactional claim function that accepts no caller-selected tenant IDs;
- one active lease per job, protected by both a job-row lock and a partial
  unique index;
- one-time 256-bit opaque lease tokens with only SHA-256 digests persisted; and
- exact-identity/token/claim/job/expiry checks for heartbeat and release.

Drafts 003 and 004 do not spend credits, call providers, execute workers,
render media, configure Cloud IAM/OIDC, or expose raw job/lease records to the
browser. They are structural review artifacts, not permission to remove the
runtime production block.

## Current-product access model

The current product is owner-private and collaboration is not enabled.

- A signed-in user may create and update only their own profile.
- A signed-in user may create a `free`, `owner_private` workspace owned by
  their own `auth.uid()`.
- The owner may create only their own `owner` membership.
- Authenticated users cannot add collaborators, change roles, transfer
  ownership, delete a workspace, or mutate a membership.
- Plan/access fields are not user-updatable. Workspace self-service updates are
  column-limited to `name` and `metadata_json`.
- Backend `service_role` access is also deliberately least-privilege for this
  first layer; deletion and ownership transfer need a later reviewed workflow.

Supporting additional roles later requires an additive, reviewed migration
that changes the role constraint, membership integrity trigger, grants, and RLS
policies together. Merely adding a collaboration UI is not sufficient.

## Preference mutation contract

Draft 002 includes a service-only `upsert_edit_preferences_cas(...)` skeleton.
It is the only granted edit-preference mutation path and is designed to perform
the following in one database transaction:

1. confirm the exact owner membership;
2. serialize writes for that user/workspace;
3. validate idempotent replay or conflict;
4. enforce the expected preference snapshot;
5. insert or update the exact eight current preference values;
6. record the completed idempotency response; and
7. append one sanitized audit event.

The skeleton is not wired to the current backend and has not been executed.
Promotion requires transaction, contention, replay, stale-write, and rollback
tests against a disposable canonical database.

## Approval and credit authority contract

`create_approved_execution_authority(...)` is service-only. It verifies the
exact owner-private named edit, serializes approval creation, rejects
idempotency hash conflicts, creates the immutable snapshot and its exact
reservation together, appends the initial `reserved` lifecycle event, records
the completed idempotency response, and appends a sanitized audit event.

The reservation row is not updated. Effective activity means all of the
following are true:

- its immutable initial status is `active`;
- `expires_at` is still in the future; and
- no append-only terminal event (`spent`, `released`, `refunded`, `cancelled`,
  or `expired`) exists.

This draft intentionally does not define spend/release/refund settlement RPCs
or a wallet ledger. Those remain separate reviewed credit milestones.

## Tenant-bound worker lease contract

The worker claim RPC accepts only a job ID, a verified/allowlisted service
identity, and bounded idempotency/request evidence. It does not accept
workspace, project, snapshot, reservation, lease duration, or expiry fields.
It locks the authoritative job row and derives every scope value from the
composite-bound job before checking the immutable snapshot and active
reservation.

Heartbeat and release require all four capabilities together: claim ID, job
ID, exact worker service identity, and the one-time lease token. The stored
SHA-256 digest must match; the lease must still be active and unexpired; and
the lease lineage must exactly equal the locked job lineage.

Idempotent job creation can replay its durable response. A claim token cannot
be replayed because the plaintext is never stored. Reusing a claim
idempotency key with the same hash therefore fails closed with an explicit
"token cannot be replayed" error; reusing it with a different hash is a
conflict. The worker must retain the first successful claim response only in
memory and reacquire after release/expiry if that response is lost.

Static verification covers the intended race/denial structure, but only a
disposable Postgres/Supabase test can prove two-worker serialization,
cross-tenant denial, wrong-worker/token denial, expiry denial, rollback, and
RLS behavior.

## Bootstrap order

The draft remains compatible with the current frontend bootstrap sequence:

1. insert the signed-in user's `profiles` row;
2. insert a workspace with `owner_id = auth.uid()`;
3. insert that same user as the workspace's single `owner` member.

The ownership helper deliberately recognizes the workspace owner before the
membership row exists. This avoids the circular RLS failure where a user needs
membership to read the workspace required to create that membership. A trigger
still verifies that the membership user and role exactly match the workspace
owner.

## Security properties in this draft

- RLS is both enabled and forced on every table.
- `PUBLIC`, `anon`, and `authenticated` begin with no table privileges.
- Authenticated grants are column-scoped where writes are allowed.
- `PUBLIC` cannot create objects in the exposed `public` schema.
- `SECURITY DEFINER` helpers use an empty `search_path`, fully qualified names,
  and explicit execute revocations.
- Identity keys and workspace ownership are immutable in this layer.
- Metadata must be a JSON object and must not contain provider secrets or
  service credentials.
- No authenticated delete path exists.
- Project and named-edit tenancy keys are immutable and composite-bound.
- Audit events are append-only even for service-role table callers.
- Preference writes are CAS/idempotency/audit coupled through one service-only
  function; authenticated users have no direct preference write grant.
- Approved snapshots and credit reservations are immutable; reservation
  lifecycle and audit evidence are append-only.
- Execution job creation derives tenant/snapshot/reservation lineage from the
  approved snapshot rather than accepting independent tenant identifiers.
- Worker claim serialization combines `SELECT ... FOR UPDATE` on the job with
  a partial unique active-lease index.
- Worker lease plaintext tokens have no table column and are returned exactly
  once; only a SHA-256 digest is persisted.
- Execution tables have no authenticated grants or policies. Current
  user-facing status must remain a sanitized backend DTO until a separately
  reviewed read projection exists.

## Static review check

The verifier only reads files; it does not parse or execute SQL in Postgres:

```bash
node database/canonical-v2-review-only/verify.mjs
```

Static checks are not RLS proof. Before promotion, the future canonical chain
still needs a clean local reset, two-user/two-workspace isolation tests,
bootstrap tests, role/ownership-negative tests, transaction and rollback tests,
two-worker claim races, wrong-tenant/wrong-worker/wrong-token/expired-lease
denials, verified Cloud service identity tests, Security Advisor review, and a
separate upgrade plan for any already-applied environment.
