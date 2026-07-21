# Canonical Distributed Media-Ingest RPC Adapter Verification

Date: 2026-07-20
Status: `server_only_rpc_transport_contract_verified_live_database_and_worker_blocked`

## Outcome

ReEditPro now has one fixed, server-only RPC transport contract for the existing
`canonical-distributed-media-ingest-state-port-v1` state machine. This is the
database-adapter boundary required before a hosted resumable upload above the
16 MiB compatibility ceiling can be finalized by a distributed worker.

This slice does **not** enable distributed finalization. It creates no SQL,
migration, Supabase client, GCS request, worker dispatch, credential read,
provider call, billing operation, or deployment. The runtime mode remains
fail-closed and production authority remains false.

## Frozen RPC registry

The adapter accepts no caller-selected function name. Its seven operations are:

1. `reeditpro_enqueue_media_ingest_v1`
2. `reeditpro_claim_and_start_media_ingest_v1`
3. `reeditpro_record_media_ingest_progress_v1`
4. `reeditpro_reconcile_media_ingest_completion_v1`
5. `reeditpro_reconcile_media_ingest_failure_v1`
6. `reeditpro_request_media_ingest_cancellation_v1`
7. `reeditpro_finalize_expired_media_ingest_attempt_v1`

Every adapter method performs exactly one injected RPC call with the fixed
`p_contract_version` and `p_request` envelope. There is no automatic transport
retry. Lost responses are reconciled by the domain idempotency key and exact
durable response association, not by blindly repeating a side effect.

## Integrity and security boundaries

- The contract-fixture capability is process-branded and bound to the exact
  injected client; copying it or swapping the client removes authority.
- Request schemas, hashes, idempotency hashes, job identity, operation identity,
  transaction hashes, attempt/checkpoint hashes, terminal hashes, and response
  hashes are revalidated at the port boundary.
- A cryptographically valid response from another job or request is rejected.
- RPC arrays must contain exactly one result.
- Database failures are projected as a safe evidence hash; raw database details
  do not cross the adapter.
- Raw media, local paths, signed URLs, upload credentials, service-role values,
  customer price, credits, service fee, wallet, billing, and settlement are not
  part of this adapter.
- Attempt-level infrastructure cost remains inside the canonical ingest state
  record and stays separate from future customer-commercial authority.

## Verification

Run:

```bash
npx tsx server/smoke/canonical-distributed-media-ingest-state-rpc-adapter-smoke.ts
npx tsx server/smoke/canonical-distributed-media-ingest-state-port-smoke.ts
```

The adapter smoke proves the seven-operation lifecycle across completion,
failure, cancellation, timeout, exact replay, single-row normalization,
response-substitution rejection, error sanitization, and the absence of live
activation imports.

## Remaining live gates

Hosted uploads above the inline ceiling must remain blocked until the same
reviewed release proves all of the following:

1. The seven RPC functions exist behind a reviewed canonical Postgres/Supabase
   transaction adapter and pass disposable-database conformance.
2. Serializable races, rollback, exact replay, lease loss, restart recovery,
   multi-replica read-after-write, and terminal exclusivity pass against that
   database.
3. An authenticated controller and `media_ingest_worker` dispatch path consume
   the same state authority; no second queue or lease registry is introduced.
4. The worker performs a generation-bound private GCS read, capacity admission,
   resumable hashing, independent media probe, create-only canonical commit, and
   checksum readback.
5. Worker identity, request/receipt hashes, checkpoints, internal infrastructure
   usage, immutable rate card, failed/unknown attempt cost, and terminal outcome
   are retained without secrets or raw paths.
6. Same-SHA Cloud Run, GCS IAM, gateway, Auth/RLS, telemetry, cancellation,
   recovery, and large real-file acceptance evidence passes.

Only after those gates pass may a forward runtime qualification enable
`REEDITPRO_LARGE_MEDIA_FINALIZATION_MODE=distributed` and allow a hosted upload
target above the current compatibility ceiling.
