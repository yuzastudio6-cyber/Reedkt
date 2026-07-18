# Canonical Distributed Package-State Port Verification — 2026-07-17

Status: `database_neutral_transaction_contract_verified_database_adapter_blocked`

## Outcome

ReEditPro now has a strict, service-only transaction port for the distributed
execution-package lifecycle. The port defines one contract for:

1. server-allocated package-attempt claim plus dispatch outbox publication;
2. exact controller-receiver acceptance;
3. exact worker-receiver acceptance plus versioned internal-cost attempt start;
4. worker heartbeat and bounded lease extension;
5. mutually exclusive completion or failure reconciliation; and
6. controller-owned, bounded expired-worker timeout reconciliation.

Every mutation uses a strict request schema, a server-recomputed request hash,
a hashed idempotency key, an exact durable response association, nested
integrity hashes, and explicit package/job/attempt lineage. Timeout sweeps use
the same lost-response replay rule while rejecting caller-selected jobs,
dispatch intents, attempts, and batch limits. The transaction chooses no more
than 32 expired attempts per sweep and never starts a retry automatically.

The contract is database-neutral. Its current implementation is deliberately
an in-memory, single-process conformance fixture. The fixture exercises
serialized copy-on-write commits and injected pre-commit rollback, but it is
not durable storage and does not prove cross-process or multi-replica database
atomicity.

## Lifecycle Invariants Exercised

- Package delivery-attempt numbers, queue claims, and dispatch IDs are derived
  inside the serialized transaction rather than accepted from a caller.
- Duplicate or cyclic job dependencies are rejected before a package can run.
- Controller and worker request-binding hashes and receipt hashes remain part
  of the durable attempt lineage.
- Worker acceptance and the attempt-start cost record share one commit.
- Heartbeats can extend a lease only inside the active attempt deadline and
  cannot replace the immutable attempt start.
- Completion, failure, and timeout race to exactly one terminal state.
- Completion retains the exact canonical outcome hash and output byte length;
  failure retains its bounded failure category.
- Exhausting the approved attempt ceiling blocks the job instead of presenting
  it as runnable.
- Terminal internal production cost links to the exact attempt-start evidence
  and uses only the existing versioned rate card and workload profile.
- Timeout cost ends at the immutable lease expiry, not at a later controller
  observation time.
- Lost ordinary-mutation and timeout-batch responses replay byte-equivalent
  committed response objects.
- Outer response checksums cannot conceal changed outbox, attempt-start,
  terminal-cost, or terminal hashes.
- Customer price, customer credits, ReEditPro service fee, wallet mutation,
  billing, settlement, and automatic retry authority are absent.

The bounded cost proof covers only the three execution profiles that currently
have attempt-level production-cost evidence: DeepFilterNet voice cleanup,
Remotion 4K source-slice rendering, and FFmpeg 4K mezzanine finalization. The
50-tool registry remains capability/contract evidence; this slice does not
claim that all 50 tools have production-metered cloud runtimes.

## Focused Evidence

`npm run smoke:canonical-distributed-package-state-port` passes 43 adversarial
checks under
`canonical-distributed-package-state-conformance-v1` with evidence hash:

`0672b7c77158787fcd860a288c04df2c41abb2905cd027fbb58a49916d3dca2f`

The smoke also statically verifies that this bounded source set imports no
Supabase client, Google Cloud client, Stripe boundary, child-process runner, or
network `fetch` path. `npm run typecheck:server` and focused ESLint pass on the
same source.

The historical full private-pipeline v13 report remains the latest aggregate
run. The newer v14 aggregate has not been run, so this focused evidence must not
be presented as a fresh full-pipeline result.

## Explicitly Not Proven Or Activated

This slice performs no SQL or migration change, Supabase/Postgres connection,
remote database action, Google Cloud mutation, provider call, media execution,
customer billing, wallet/ledger mutation, deployment, production render,
public delivery, Motion Studio work, or Edit Preference/Edit Reference work.

It does not prove:

- database durability across process or host loss;
- serializable behavior in Postgres;
- rollback across real tables, indexes, constraints, triggers, or RPCs;
- exact replay across two service replicas;
- database-clock lease authority;
- service-role/RLS/IAM correctness;
- Cloud Tasks or Cloud Run delivery; or
- private staging or production readiness.

`assertCanonicalDistributedPackageStateProductionAuthority` therefore always
fails closed. A validated in-memory port cannot be promoted by copying its
descriptor or its conformance evidence.

## Next Required Evidence

The next dependency-safe slice is a reviewed canonical database adapter and a
disposable Postgres conformance environment. It must not reuse the rejected raw
Supabase migration chain as executable authority. Before staging can rely on
the adapter, evidence must show:

1. reviewed canonical tables, constraints, indexes, transaction functions, and
   exact-response idempotency storage;
2. transaction rollback at every commit boundary in disposable Postgres;
3. concurrent claim, completion/failure/timeout, and lost-response races from
   two independent service processes;
4. database-owned time and row/advisory-lock or serializable isolation rules;
5. tenant derivation, service identity, RLS/grants, retention, and audit-chain
   review; and
6. an owner-authorized private staging run with cloud/database gates still
   separate from billing, providers, public delivery, and production.

Until all six pass, the honest readiness label remains
`database_neutral_transaction_contract_verified_database_adapter_blocked`.
