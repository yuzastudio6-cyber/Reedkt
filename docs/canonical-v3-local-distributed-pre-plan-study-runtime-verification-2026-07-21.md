# Canonical V3 Local Distributed Pre-Plan Study State — 2026-07-21

Status: `local_postgres_transaction_and_recovery_verified_production_blocked`

This slice binds the existing fixed seven-operation distributed pre-plan study
state contract to the isolated canonical V3 local PostgreSQL chain. It proves
real database transactions, durable replay, leases, checkpoints, terminal
outputs and internal cost, controls, timeout recovery, tenant denial, and
backup/restore. It does not mount a production worker, call a provider, change
the raw `supabase/migrations/` history, or authorize any remote action.

## Authority added

Migration `202607210010_canonical_distributed_pre_plan_study_rpc.sql` extends
the existing V6 long-form study tables and adds only the support records needed
for exact durable state authority:

- immutable idempotency receipts with the committed browser-safe response;
- encrypted lease escrow whose persisted projection contains only the lease
  digest and encrypted credential;
- immutable hash-chained audit events;
- exact external run, plan, work-item, attempt, checkpoint, output, and cost
lineage on the existing long-form tables.

Forward migration
`202607210018_pre_plan_enqueue_study_concurrency_fence.sql` corrects the
serialization scope for plan allocation. Plan versions are unique per study,
so enqueue now acquires a study-session transaction fence before it evaluates
the next plan version. The historical run-scoped fence remains in place for
exact run replay.

The public mutation surface is fixed to:

1. `reeditpro_enqueue_pre_plan_study_v1`
2. `reeditpro_claim_and_start_pre_plan_study_v1`
3. `reeditpro_heartbeat_pre_plan_study_v1`
4. `reeditpro_complete_pre_plan_study_v1`
5. `reeditpro_fail_pre_plan_study_v1`
6. `reeditpro_control_pre_plan_study_v1`
7. `reeditpro_recover_expired_pre_plan_study_lease_v1`

Every operation validates the canonical request hash, derives tenant scope
from the authenticated membership, serializes the run mutation, couples the
domain mutation to an exact idempotency response, and appends one hash-chained
audit event when state changes. Same-key/same-request calls replay; changed
requests fail closed.

## Local server-only boundary

An authenticated browser token is deliberately insufficient. The loopback
server adapter adds a request-bound HMAC using the isolated local JWT signing
secret. The signature binds both the canonical request hash and the hashed
idempotency key, so a captured signed request cannot be replayed under a new
key. PostgreSQL validates that signature, loopback forwarded host, and fixed
port before touching run state. A direct authenticated call without that
internal signature is denied.

This is a local proof mechanism, not the production identity design. It cannot
self-promote. Production still requires workload identity/IAM, secret rotation
or KMS-backed lease escrow, deployed ingress controls, and same-release runtime
evidence.

## Proven behavior

The TypeScript/PostgREST smoke and SQL postconditions prove:

- two concurrent enqueue calls commit once and return one exact replay;
- six different runs of one study, each submitted twice concurrently, receive
  distinct plan versions and one insert plus one exact replay per run;
- two concurrent claim calls create one attempt and replay one transient lease;
- changing an idempotency key under a previously valid signature is denied;
- only the credential digest reaches canonical attempt/work-item state;
- expired or terminal attempt credentials cannot be recovered from replay;
- heartbeat and monotonic checkpoint persistence share one transaction;
- stale checkpoint sequences and stale/tampered requests fail closed;
- completion atomically commits private output lineage and provider plus
  infrastructure internal-cost evidence;
- source size, duration, checksum, object identity, and tenant lineage are
  re-read from the canonical local asset row instead of trusted from the seed;
- legacy storage-generation and ETag fields remain null when the output
  contract supplies only a canonical storage-object identity hash;
- failed and unknown provider attempts retain cost and block unsafe fallback;
- pause, resume, cancellation request, and terminal cancellation are durable;
- an early recovery observation is a no-op, while an expired lease creates one
  timeout receipt and a second attempt resumes from the latest checkpoint;
- a second user cannot mutate the first workspace;
- direct reads/writes of idempotency, lease-escrow, and audit support tables are
  unavailable to browser roles;
- persisted JSON contains no bearer token, raw lease credential, signed URL,
  local path, provider credential, customer price, credits, service fee,
  wallet, billing, or settlement mutation;
- approved edit snapshots and credit reservations are not fabricated for this
  pre-plan study authority.

The destructive recovery rehearsal archives and restores the reviewed data
table set. Its before/after state digest matches and its post-restore
assertions include the six concurrent study runs, exact replay receipts,
completed cost lineage, and expired-lease recovery history.

## Verification

The focused proof passed against a clean local reset:

```text
npm run typecheck:server
supabase --workdir database/canonical-v3-local db reset --local --no-seed
npx --no-install tsx server/smoke/canonical-distributed-pre-plan-study-local-postgres-smoke.ts
psql ... -f database/canonical-v3-local/tests/013_canonical_distributed_pre_plan_study_rpc_postconditions.sql
database/canonical-v3-local/run-local-recovery-verification.sh
```

Observed results:

- seven operations verified;
- concurrent enqueue and claim replay verified;
- concurrent same-study plan allocation and exact replay verified;
- digest-only replayable lease verified;
- monotonic checkpoint verified;
- terminal output and cost atomicity verified;
- provider unknown outcome blocked;
- pause/resume/cancel and deterministic timeout recovery verified;
- cross-workspace and browser-without-internal-signature mutation denied;
- 49-table recovery passed with identical state digest;
- remote mutation, provider execution, worker execution, billing, deployment,
  and production authority remained false.

## Remaining gates

This does not yet make Edit Reference production-ready. The following remain:

- mount this state port behind the existing V5 long-form runtime port without
  introducing another scheduler or repository;
- implement and review the production Postgres/Supabase adapter and RLS/RPC
  migration in the approved canonical release chain;
- prove multi-replica lease races, restart recovery, live private-object reads,
  authenticated worker dispatch, provider checkback, and usage reconciliation;
- run the same two-user/two-workspace and recovery suite in staging against the
  same release SHA, then inspect the live catalog and Supabase advisors;
- complete deployed Auth, storage, worker, provider, observability, secret,
  billing, and public-delivery gates under separate owner authorization.

`productionAuthority` and `productionReady` therefore remain `false`.
