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

This closes the process-memory state gap for upload-intent metadata. It does
not close the separate temporary-credential gap: the controlled test target is
held only by the existing process-memory escrow fixture and uses the
non-routable `storage.invalid` host. No live GCS resumable session is created.

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
  exact target from the separate escrow without creating another target;
- a different authenticated tenant cannot read the intent;
- an uncertain external target-creation outcome is recorded as
  `target_issue_unknown`, survives restart, and blocks a second side effect;
- persisted records and receipts contain no raw upload credential;
- database reset, data-only backup, destructive reset, and restore preserve the
  complete upload-target state and audit lineage.

The canonical recovery inventory is now 59 reviewed data tables. The new SQL
postcondition test verifies forced RLS, direct-table grant denial, fixed RPC
role boundaries, all four mutation operations, exact lifecycle counts,
receipt/audit linkage, canonical hashes, and credential exclusion.

## Verification commands

```text
npm run typecheck:server
npm run smoke:canonical-durable-upload-target-authority
npm run smoke:canonical-durable-upload-target-local-postgres
database/canonical-v3-local/run-local-verification.sh
```

The full local runner performs only loopback Supabase/Postgres operations. It
unsets `SUPABASE_ACCESS_TOKEN`, refuses any database URL outside local port
`57432`, and executes no remote migration or storage mutation.

## Gates that remain closed

- live GCS resumable-session issuance;
- envelope-encrypted credential escrow durable across replicas;
- multi-replica read-after-write evidence;
- staging or production Supabase deployment and RLS evidence;
- deployed upload-lifecycle integration with signed GCS finalization;
- customer pricing, credits, wallet, billing, workers, rendering, public
  delivery, and production authority.

The verified local database adapter therefore remains
`productionAuthority=false`. Hosted upload creation must continue to fail
closed until the separate GCS, credential-escrow, distributed durability, and
deployment gates have released evidence.
