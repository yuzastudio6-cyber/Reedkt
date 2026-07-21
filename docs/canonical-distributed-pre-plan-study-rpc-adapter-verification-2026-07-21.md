# Canonical distributed pre-plan study RPC adapter verification

Date: 2026-07-21

Status: `server_only_rpc_transport_contract_verified_live_database_and_worker_blocked`

## Outcome

ReEditPro now has one fixed server-only RPC transport contract between the
existing `canonical-distributed-pre-plan-study-state-port-v1` state machine and
a future canonical Postgres/Supabase transaction adapter. This is the missing
database boundary for an Edit Reference study that may continue for minutes or
hours before an edit plan or customer credit reservation exists.

This slice does not enable hosted execution. It creates no SQL or migration,
constructs no Supabase client, reads no credential, calls no provider or cloud
service, dispatches no worker, mutates no customer price or credits, and grants
no production authority.

## Frozen RPC registry

The adapter accepts no caller-selected function name. Its seven operations
are:

1. `reeditpro_enqueue_pre_plan_study_v1`
2. `reeditpro_claim_and_start_pre_plan_study_v1`
3. `reeditpro_heartbeat_pre_plan_study_v1`
4. `reeditpro_complete_pre_plan_study_v1`
5. `reeditpro_fail_pre_plan_study_v1`
6. `reeditpro_control_pre_plan_study_v1`
7. `reeditpro_recover_expired_pre_plan_study_lease_v1`

Every method makes exactly one injected RPC call with only
`p_contract_version` and `p_request`. The adapter never automatically retries a
transport call. Lost responses converge through the domain idempotency key and
the exact durable response association required by the state port.

The registry SHA-256 is:

`5421438b78c056acb7bd13867b5b768d7aefe424d3771f8d977225156de70d74`

## Integrity and privacy boundary

- A process-branded fixture capability is bound to the exact injected client;
  cloning the capability or swapping the client removes authority.
- Every request is parsed through the canonical strict schema and its request
  hash is recomputed before transport.
- Every response is parsed through the canonical mutation or recovery schema,
  then re-bound to the exact operation, run, tenant/study identity, request
  hash, and idempotency-key hash.
- Only `claim_and_start` may return a transient lease credential. Its hash must
  equal the attempt's persisted lease-credential digest.
- Response substitution from another run or operation is rejected even when
  the substituted response is otherwise cryptographically valid.
- Database failures expose only a bounded error-evidence hash. Raw messages,
  paths, queries, signed URLs, credentials, and provider payloads do not cross
  the adapter.
- Provider and infrastructure cost stay inside the canonical attempt receipt;
  customer price, credits, service fee, wallet, billing, and settlement remain
  outside this authority.

The exported unverified database descriptor reports
`implementationClass=database_transaction_adapter` while all live database,
multi-replica, worker, private-object, cloud, and production flags remain
false. The V1 state port still has no promotion path and rejects production
authority.

## Verification

Focused command:

```sh
npm run smoke:canonical-distributed-pre-plan-study-rpc-adapter
```

The focused proof passed the complete seven-operation contract fixture:

- enqueue and terminal exact replay;
- server-selected claim and digest-bound transient lease;
- atomic heartbeat/checkpoint projection;
- completion with private output and internal-cost evidence;
- retained failed-attempt cost without automatic retry;
- pause, resume, and cancellation;
- expired deterministic lease recovery and exact replay;
- single-row RPC-array normalization;
- response-substitution rejection;
- sanitized RPC failure; and
- source inspection proving no live client, credential, SQL, provider, worker,
  cloud, or commercial activation import.

Server typecheck and focused ESLint also passed before this document was
frozen. Full repository verification is recorded with the final commit
handoff.

## Honest remaining boundary

The injected client used by the smoke delegates to the existing in-memory
conformance fixture. It is not a live database adapter and does not prove that
the seven named RPC functions exist in Postgres.

Hosted Edit Reference study remains blocked until one reviewed same-release
candidate proves:

1. forward SQL implementing this exact seven-operation envelope on the
   canonical six-table long-form authority;
2. disposable Postgres/Supabase conformance including serializable races,
   rollback, exact replay, one active lease, checkpoint monotonicity, terminal
   exclusivity, and lost-response recovery;
3. multi-replica process-restart and expired-lease recovery;
4. authenticated controller and worker identity with server-derived capacity
   admission;
5. live private-object reads and create-only output checksum readback;
6. provider/checkback and infrastructure cost evidence against immutable rate
   cards;
7. whole-source multi-hour execution without a fixed whole-study timeout; and
8. same-SHA Auth/RLS/storage/browser/backend release evidence.

Until those gates pass, `productionReady=false`; remote Supabase, provider,
cloud, billing, deployment, and public-delivery actions remain disabled.
