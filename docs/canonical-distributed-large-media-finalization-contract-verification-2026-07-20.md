# Canonical Distributed Large-Media Finalization Contract Verification — 2026-07-20

Status: `pre_plan_distributed_ingest_contract_verified_runtime_activation_blocked`

## Outcome

ReEditPro now has one exact database-neutral transaction contract for the
distributed finalization of a large source or reference upload before edit
planning. It is deliberately not an approved edit-package job: upload
finalization happens before a plan, approved snapshot, credit estimate, or
credit reservation exists. The contract therefore never invents those
identities and never weakens the post-approval package queue.

The source contract is executable through a strict in-memory conformance
adapter. It does not include a live Postgres/Supabase adapter, Cloud Tasks or
Cloud Run dispatch, a deployed worker, or live GCS byte traversal. Production
startup and upload admission continue to reject
`REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE=distributed`, and hosted uploads above
16 MiB remain blocked before an upload target or credential is issued.

## Canonical Authority

The server derives one immutable seed from the authenticated upload candidate:

- authority class `pre_plan_technical_media_ingest`;
- operation `internal.media.finalize_large_upload.v1`;
- processing policy
  `generation_bound_checkpointed_hash_probe_finalize_v1`;
- exact owner, workspace, project, upload intent, purpose, declared byte size,
  GCS mode, and upload-authority fingerprint;
- `media_ingest_worker` in `us-east1`, three maximum attempts, bounded lease
  and attempt deadlines, and the existing one-source-copy plus 8 GiB/10%
  headroom rule; and
- the versioned shared internal infrastructure rate card with a fixed
  4-vCPU/8-GiB/no-GPU ingest workload envelope.

This operation is technical source ingest, not a user-selected editing tool.
It does not add a 51st tool, execute one of the 50 approved editing operations,
or authorize editing, generation, rendering, providers, billing, or delivery.

## Transaction Semantics

The bounded port exposes seven server-only mutations:

1. enqueue the exact upload authority;
2. atomically claim, lease, capacity-bind, generation-bind, and start one
   worker attempt;
3. record a monotonic exact-byte checkpoint and heartbeat;
4. reconcile one exact private create-only canonical completion;
5. reconcile one sanitized failure;
6. request cancellation; and
7. let the controller select and finalize an expired active attempt without a
   caller-selected attempt identity.

Every mutation has a closed input schema, request hash, hashed idempotency key,
serialized revision, audit-chain event, transaction hash, exact committed
response hash, and lost-response replay. The fixture can emit and restore a
checksum-protected recovery snapshot; a fresh adapter then returns the exact
prior failure response and resumes from the exact durable byte checkpoint.
Nested response integrity is revalidated during restore, so recomputing only
the outer snapshot checksum cannot hide a changed transaction.

Capacity evidence is required before attempt allocation. One active lease is
allowed. Worker identity and receipt hashes bind progress and terminal calls.
Checkpoints must advance through `hashing`, `hash_complete`, `probe_complete`,
and `canonical_commit_ready`; byte offsets cannot regress, phases cannot be
skipped, and retries must retain the same generation-bound source identity.
Completion requires the full declared byte count plus exact checksum,
generation-identity, probe-metadata, media-asset, storage-record, and canonical
outcome hashes.

Failure and timeout retain the latest checkpoint and exact attempt-level
internal infrastructure cost. Retry is exposed but never started
automatically. Source-change and validation failures fail terminally; an
operational/unknown failure may expose only another same-source attempt inside
the fixed ceiling. Queued cancellation starts no attempt. Running cancellation
requires the owning worker to record a terminal outcome or the controller to
reconcile lease expiry.

## Cost Boundary

Attempt start records the immutable workload envelope and shared rate-card
digest. Completion, failure, and timeout calculate and retain CPU, memory, and
temporary-storage internal cost for the exact accepted attempt. Timeout cost
stops at the immutable lease expiry. The evidence explicitly excludes customer
price, credits, service fee, wallet mutation, billing, and settlement, and it
does not claim invoice reconciliation.

## Verification

Run:

```sh
npm run smoke:canonical-distributed-media-ingest-state-port
npm run smoke:large-media-background-finalization
npm run smoke:large-media-ingest-readiness
npm run typecheck:server
```

The dedicated conformance smoke covers process branding, strict schema
rejection, rollback, concurrent enqueue, exact replay, capacity-before-attempt,
controller/worker isolation, one active lease, monotonic byte and phase
progress, failed-attempt checkpoint retention, generation-bound retry,
fresh-adapter recovery, cancellation, terminal races, timeout reconciliation,
private completion readback, and separate internal cost. It also statically
forbids Supabase, Google Cloud clients, child processes, `fetch`, and Stripe in
the bounded source group.

The V1 assertion remains fail-closed even when a structurally valid test
descriptor supplies every future live-database, multi-replica, dispatch, and
GCS evidence flag. Production authority requires a reviewed forward contract
version; V1 cannot promote itself.

The frozen source run passed 48 checks with evidence SHA-256
`8ebceb3707e2604d04bfcff6c18e9205a9fdaaf3a367c8c5ba063b73557dd739`.

## Closed Gates

This slice does not prove or authorize:

- a durable Postgres/Supabase transaction adapter or reviewed migration;
- multi-replica serialization, database rollback, or deployed recovery;
- authenticated Cloud Tasks/Cloud Run handoff, worker callbacks, or a
  worker-death observer;
- live GCS generation discovery, range reads, checkpoint-state persistence,
  FFprobe execution, canonical authority writes, or orphan cleanup;
- real 50 GiB, 250 GiB, 1 TiB, long-duration, damaged-input, or sustained-I/O
  tests;
- malware/content scanning, hostile-parser isolation, storage quotas,
  retention/deletion operations, or production observability; or
- providers, customer pricing/credits, billing, rendering, deployment, public
  delivery, external beta, or production readiness.

The next implementation gate is a reviewed durable transaction adapter plus
one authenticated controller/worker dispatch and live private GCS staging
proof. Until all of those pass, the existing private single-host finalizer is
local/internal evidence only and the hosted high-ceiling path remains closed.
