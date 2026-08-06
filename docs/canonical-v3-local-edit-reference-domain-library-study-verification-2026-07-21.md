# Canonical V3 local Edit Reference library and study verification

Date: 2026-07-21

## Outcome

The isolated canonical V3 local chain now persists the mounted Edit Reference
library and Study Chat foundation through one server-owned, operation-safe
repository authority. It replaces the local proof's aggregate-replacement
mutation with explicit create, update, message, and evidence commands while
retaining the existing browser API and feature UI.

The local chain adds four forced-RLS tables and two service-role-only RPCs:

- `edit_reference_domain_states` stores the tenant aggregate revision and
  deterministic collection metadata;
- `edit_reference_domain_audit_events` stores immutable ordered domain events;
- `edit_reference_domain_idempotency_receipts` stores immutable command replay
  receipts and committed revisions;
- `preference_evidence_assets` stores immutable private evidence-asset
  metadata without raw media, signed URLs, or service credentials;
- `mutate_edit_reference_domain_command_v1` validates one explicit domain
  command, workspace write membership, expected revision, request hash, and
  domain idempotency before committing all affected rows atomically; and
- `read_edit_reference_domain_aggregate_v1` returns one tenant-bound aggregate
  and ordered audit projection to the server repository.

Neither RPC accepts browser-shaped replacement state. `anon` and
`authenticated` cannot execute them, and every new raw table denies direct
mutation to `anon`, `authenticated`, and `service_role`.

## Mounted local proof

The process-branded loopback adapter keeps the local service-role credential
inside a server-only closure and allows only the two reviewed RPC names. The
mounted `createReeditProApiApp` proof verifies:

- authenticated library read and preference creation through the existing
  ReEditPro HTTP routes;
- explicit reference create/update and Study Chat message/evidence commands;
- exact replay with the original receipt and changed-request idempotency
  conflict;
- stale browser aggregate callbacks being rejected before SQL execution;
- a new repository/client instance reading the committed state after restart;
- immutable ordered audit history;
- two-user/two-workspace denial at both repository and mounted HTTP layers;
- no service-role credential in client-visible state, logs, or responses; and
- local authority labels that cannot self-promote to hosted or production use.

The local SQL suite independently proves stale revision rejection,
cross-workspace service-role actor denial, authenticated RPC denial, and raw
table-mutation denial. The destructive recovery rehearsal now includes all 45
reviewed data tables and validates the restored domain state and audit history.

The completed full local runner reported:

```text
migrationCount: 8
verifiedFileCount: 101
restoredDataTableCount: 45
archiveSha256: b5a8e1f5d48918b3777717a7b949e6a7eb814504ccbc5bb2e2a8c5db3ec7c089
stateDigestSha256: 8c7e93031b0bb6c86d1860742c1241cc5e781f705dcc38c17951b6f6d2980af2
remoteMutationAllowed: false
productionAuthority: false
```

Post-reset same-source verification also passed:

- server TypeScript, full lint, and the production client/server build;
- the frontend/server boundary across 860 files and the repository secret scan
  across 4,935 files with zero secret values printed;
- Study Session foundation, adaptation/copy-safety, mounted domain repository,
  mounted Study Chat, mounted long-form runtime, and atomic exact-edit Apply
  smokes;
- the strict canonical product UI gate with all 11 source invariants;
- 11/11 mounted canonical real-file Chromium cases, including durable Study
  Chat state, resumable private upload, response-loss reconciliation, DNA/QA,
  whole-video controls, and exact-target apply/replace/remove;
- 5/5 current Edit Preferences and atomic-Apply Chromium cases; and
- 2/2 long-form review Chromium cases.

## Current boundary

This is local-only persistence, RLS, transaction, replay, restart, recovery,
and mounted API evidence. The historical `supabase/migrations/` chain remains
unchanged and `blocked_by_parallel_foundations`. A future hosted release still
requires a reviewed forward migration and backfill, deployed Auth/RLS/Storage,
encrypted server credential handling, multi-replica runtime qualification,
same-source staging proof, rollback evidence, and independent security review.

No remote Supabase, provider, cloud worker, billing, customer-credit,
deployment, public-delivery, or production action was performed.
`productionReady=false` remains mandatory.
