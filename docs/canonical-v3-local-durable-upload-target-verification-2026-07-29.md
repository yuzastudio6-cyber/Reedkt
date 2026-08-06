# Canonical V3 Local Durable Upload-Target Verification

Date: 2026-07-29
Status: local Postgres/PostgREST lifecycle verified; hosted production remains blocked.

## Outcome

The canonical V3 local database now provides the first real durable
implementation of the pre-media upload-target transaction port. The
implementation commits an immutable upload intent before the application is
allowed to create an external upload target, records one-use claim and
completion transitions, preserves exact idempotency receipts, and records a
terminal unknown outcome when the external side effect cannot be proven.

This closes the process-memory state gap for upload-intent metadata. A
follow-up local migration now also closes the process-memory-only credential
gap with an envelope-encrypted Postgres escrow. The controlled target still
uses the non-routable `storage.invalid` host, and no live GCS resumable session
is created.

A forward-only local migration now admits
`resumable_content_range_v1` alongside the existing single-request and GCS
protocols. Large authenticated local uploads retain the fixed 16 MiB
per-request parser ceiling by sending 8 MiB checksummed chunks, querying only a
tenant-authorized status route, and resuming from the server-verified offset.
The same committed upload-target identity, encrypted credential, and exact
replay transaction survive a fresh API process.

## Durable database surface

Migration `202607210021_canonical_durable_upload_target_rpc.sql` adds three
forced-RLS, RPC-only tables:

- `canonical_upload_intents`;
- `canonical_upload_target_idempotency_receipts`;
- `canonical_upload_target_audit_events`.

It exposes exactly five authenticated, server-signed functions:

- `reeditpro_resolve_upload_intent_v1`;
- `reeditpro_claim_upload_target_v1`;
- `reeditpro_commit_upload_target_v1`;
- `reeditpro_mark_upload_target_unknown_v1`;
- `reeditpro_read_upload_intent_v1`.

The TypeScript adapter uses only that fixed function registry. It accepts no
raw SQL, caller-selected function, service-role credential, upload URL,
session URI, upload headers, or bearer credential. The local HTTP transport is
hard-bound to `http://127.0.0.1:57431`, signs each request with the server-only
local authority secret, performs no automatic retry, and cannot be promoted to
production.

## Executed proof

The real loopback Postgres/PostgREST smoke verified:

- an unsigned request is denied;
- two concurrent identical intent requests produce one insert and one exact
  replay with the same transaction identity;
- intent commit occurs before the controlled target-creation side effect;
- the issued state survives a new adapter/process boundary and recovers the
  exact resumable upload and status routes from the separate escrow without
  creating another target;
- the local database records `resumable_content_range_v1` with resume support
  while excluding both relative target routes from canonical plaintext state;
- a different authenticated tenant cannot read the intent;
- an uncertain external target-creation outcome is recorded as
  `target_issue_unknown`, survives restart, and blocks a second side effect;
- persisted records and receipts contain no raw upload credential;
- database reset, data-only backup, destructive reset, and restore preserve the
  complete upload-target state and audit lineage.

The canonical recovery inventory is now 61 reviewed data tables after the
encrypted-escrow follow-up. The SQL
postcondition test verifies forced RLS, direct-table grant denial, fixed RPC
role boundaries, all four mutation operations, exact lifecycle counts,
receipt/audit linkage, canonical hashes, and credential exclusion.

See
`docs/canonical-v3-local-encrypted-upload-target-credential-escrow-verification-2026-07-29.md`
for the separate AES-256-GCM envelope, fresh-process recovery, wrong-key,
tenant-isolation, expiry-scrub, and deletion evidence.

## Verification commands

```text
npm run typecheck:server
npm run smoke:canonical-durable-upload-target-authority
npm run smoke:canonical-durable-upload-target-local-postgres
npm run smoke:local-resumable-source-upload
database/canonical-v3-local/run-local-verification.sh
```

The full local runner performs only loopback Supabase/Postgres operations. It
unsets `SUPABASE_ACCESS_TOKEN`, refuses any database URL outside local port
`57432`, and executes no remote migration or storage mutation.

## Gates that remain closed

- live GCS resumable-session issuance;
- deployed multi-replica chunk storage and recovery;
- Cloud-KMS-backed credential escrow durable across multiple replicas;
- multi-replica read-after-write evidence;
- staging or production Supabase deployment and RLS evidence;
- deployed upload-lifecycle integration with signed GCS finalization;
- customer pricing, credits, wallet, billing, workers, rendering, public
  delivery, and production authority.

The verified local database adapter therefore remains
`productionAuthority=false`. Hosted upload creation must continue to fail
closed until the separate GCS, credential-escrow, distributed durability, and
deployment gates have released evidence.
