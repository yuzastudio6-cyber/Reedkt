# Canonical V3 local distributed media-ingest verification

## Verdict

`LOCAL_POSTGRES_DURABLE_MEDIA_INGEST_VERIFIED_NON_PRODUCTION`

This bounded slice closes the source-level gap between the frozen
`canonical-distributed-media-ingest-state-port-v1` contract and an actual
transactional PostgreSQL implementation in the isolated canonical V3 local
chain. It does not activate hosted finalization or make a production-readiness
claim.

## Authority shape

One immutable, authenticated, server-derived source registration records the
exact upload intent, owner, workspace, project, purpose, expected byte count,
upload-authority fingerprint, ingest identity, frozen policy, and seed hashes.
Registration is a prerequisite to enqueue and is not an eighth queue
operation.

The existing fixed state-port registry remains authoritative:

1. enqueue;
2. claim and start;
3. record monotonic progress;
4. reconcile completion;
5. reconcile failure;
6. request cancellation;
7. finalize an expired attempt selected by the transaction.

The database stores one tenant-bound job, at most one active attempt, immutable
exact-response idempotency receipts, immutable hash-chained audit events, and
attempt snapshots containing the frozen lease, checkpoint, terminal outcome,
and internal infrastructure-cost evidence. Retry is explicit; no database
operation starts an automatic retry.

## Security and commercial boundaries

- The transport is fixed to `http://127.0.0.1:57431`, rejects redirects, and
  uses a fixed RPC allowlist.
- Every call requires an authenticated tenant JWT and a server-only HMAC bound
  to the request hash and hashed idempotency key.
- Tenant/workspace authorization runs before any exact-response replay lookup,
  so possession of another tenant's job and idempotency identities cannot
  disclose a committed receipt.
- Browser-selected SQL, RPC names, worker identity, attempt, expiry, retry,
  path, signed URL, credential, or raw bytes are not accepted.
- Tables use forced RLS and have no direct `anon`, `authenticated`, or
  `service_role` table grants.
- Only the eight bounded entry points—source registration plus the seven state
  operations—are executable by `authenticated`; helper functions are private.
- Attempt cost is internal infrastructure cost only. Customer price, credits,
  service fee, wallet, billing, and settlement authority remain absent.
- The local capability cannot self-promote. Multi-replica durability,
  authenticated Cloud Run dispatch, live generation-bound GCS reads, remote
  Supabase, deployment, and production authority remain false.

## Verification packet

The final packet includes:

- clean migration application through isolated migration 020;
- process-branded local PostgREST client/capability rejection of promotion;
- concurrent source registration and enqueue exact replay, plus two different
  claim keys racing for one database-backed attempt with exactly one winner;
- changed-request conflict and cross-tenant denial;
- monotonic checkpoint progression and retry resume after a failed attempt;
- completion, cancellation, early timeout observation, exact expired-lease
  terminalization, restart replay, and an actual PostgreSQL
  completion-versus-failure race with exactly one terminal receipt/audit/cost;
- retained failed/completed/timed-out attempt internal cost separated from all
  customer-commercial authority;
- five forced-RLS/no-direct-grant tables and fixed RPC/helper role boundaries;
- local backup/reset/restore inclusion and identical logical-state digest;
- server typecheck, focused lint, diff integrity, manifest verification, and
  the relevant upload/media-ingest regression smokes.

The authoritative isolated run completed successfully on 2026-07-22:

- 20 migrations and 178 manifest-verified files passed;
- all five media-ingest tables retained forced RLS with no direct `anon`,
  `authenticated`, or `service_role` grants;
- all ten private helpers remained non-executable by those roles, while only
  the eight bounded entry points were executable by `authenticated`;
- the mounted signed-in canonical V3 browser journey passed 3/3;
- destructive archive, reset, and restore reproduced the exact logical state
  across 56 data tables;
- archive SHA-256:
  `6991f132535ba7ca7c2c4115b4296ecd992444f630afd62ab1c75e269fa77a1d`;
- restored-state SHA-256:
  `353d968c29289802c612a5625bac9952344b86033630324f52f3e0fa048ec534`.

This is accepted local PostgreSQL evidence only. Hosted large uploads over the
inline ceiling remain blocked until a separately reviewed production contract
and same-release GCS, worker, deployed database, recovery, and rollout evidence
exist.
