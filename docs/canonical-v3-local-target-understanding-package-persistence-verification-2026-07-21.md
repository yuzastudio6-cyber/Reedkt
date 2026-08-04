# Canonical V3 Local Target-Understanding Package Persistence — 2026-07-21

Status: `local_contract_and_runtime_verified_production_blocked`

This bounded slice replaces the target-video understanding service's
process-local package store with one authenticated, tenant-bound canonical V3
local persistence boundary when the request-scoped runtime factory is present.
It does not change the frozen historical `supabase/migrations/` chain and it
does not call a provider, dispatch a worker, mutate a remote system, price a
customer, spend credits, deploy, or publish anything.

## Canonical authority

Migration 014 extends the existing immutable
`edit_reference_target_understanding_packages` table rather than creating a
second package authority. It adds two request-scoped RPCs:

- `reeditpro_save_target_understanding_package_v1` validates the authenticated
  actor, workspace write access, deterministic package identity, exact
  project/edit/reference/study scope, latest Edit Brief revision and digest,
  finalized target-source identity, canonical pre-plan run/plan/work-item
  lineage, package and context digests, privacy boundaries, and exact
  idempotency before inserting one immutable revision; and
- `reeditpro_read_latest_target_understanding_package_v1` returns the newest
  matching immutable revision only after authenticated workspace membership and
  exact target/source/Brief binding checks.

The mounted server creates the port per authenticated request from the user's
JWT. Browser input cannot select the database, RPC, actor, tenant, signing
authority, persistence class, or package lineage. Raw media, raw transcript,
raw frames, provider payloads, signed URLs, and local file paths are excluded
from the canonical record. The backend-local versioned repository remains an
explicit protected-local fallback only when this factory is absent; mixed
package authorities fail closed.

## Focused proof

The isolated loopback PostgREST/RLS smoke uses the existing two-user,
two-workspace fixture and proves:

- a two-hour, 80 GiB exact target source compiles into 100 dependency work
  items through the existing pre-plan queue authority;
- a real TypeScript target-understanding package receives the same
  deterministic UUID in JavaScript and PostgreSQL;
- the partial package is committed, exact replay returns the same immutable
  row, and a new request-scoped port reads it after process-local state is
  discarded;
- the second workspace owner cannot read the first workspace's package;
- a stale or forged Edit Brief digest cannot commit another package;
- target-source identity, plan digest, run revision, total work count, and
  completed work count are re-read transactionally instead of trusted from the
  caller; and
- provider execution, worker dispatch, remote mutation, customer price,
  customer credits, and service fees remain false.

The package produced by this focused proof is intentionally incomplete. It is
stored with `status=collecting`, `runtime_source=verified_local`, zero completed
work items, and `readyForPreferenceApplication=false`. A caller cannot promote
that record merely by asserting readiness: a ready record must also carry the
complete verified-live runtime provenance required by the package contract.

The uninterrupted aggregate then passed the signed-in library/Study
Chat/DNA/QA/approval/correction browser journey and the signed-in private
upload/long-form pause/reload/resume journey. Its destructive recovery rehearsal
restored 51 reviewed data tables. The private recovery archive SHA-256 was
`9133778217ed6a8fb1fc597a4e4a572302a799f8d3d174a63f11e4dd1b28c917` and the
restored logical-state SHA-256 was
`66f8283a726a07644af4093a37bf309f5b48a3f6adb15eb4fd650ca33cd19ccc`.
The isolated manifest verified 14 migrations and 154 source/evidence files.

## Integrated local application boundary

The prior local mismatch between the persisted raw target-understanding package
and the synthetic application-preparation fixture is closed by migrations
015–017 and the request-scoped server preparation port. The server now reads the
completed package together with approved Preference DNA and reviewed QA,
derives adaptation/hold-back/prohibited guidance in the existing TypeScript
authority, persists one unconnected application, and passes only that authority
into the existing atomic exact-edit Apply transaction. Mounted browser proof
covers committed-response loss, exact retry, reload, remove, and tenant denial.

This remains isolated local persistence and recovery evidence, not hosted or
production readiness. The controlled worker completion is evidence-fixture
only and does not claim live Kimi/Qwen/DeepSeek or Qwen2.5-VL execution.
Deployed Auth/RLS and storage, multi-replica workers and recovery, live model
routing, hosted cost receipts, same-release staging evidence, billing,
deployment, and public delivery remain closed.
