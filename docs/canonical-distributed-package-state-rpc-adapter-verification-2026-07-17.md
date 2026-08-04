# Canonical Distributed Package-State RPC Adapter Verification — 2026-07-17

Status: `server_only_rpc_transport_contract_verified_live_database_blocked`

## Outcome

ReEditPro now has a server-only RPC transport adapter for the database-neutral
package-state transaction port. The adapter fixes seven versioned Postgres RPC
names for claim/enqueue, controller acceptance, worker acceptance plus attempt
start, heartbeat, completion, failure, and expired-attempt finalization.

Each port invocation makes one RPC-client call with only:

- `p_contract_version`; and
- the already validated strict request as `p_request`.

The adapter does not accept a function name, SQL, database URL, service-role
credential, retry policy, job/attempt projection, or cost value from its caller.
It performs no hidden retry. A failed or malformed RPC response becomes a
sanitized fail-closed API error without returning the raw database message.

## Activation Boundary

Only the contract-fixture factory exists. It requires a process-branded
capability bound to the exact injected RPC client object. Copying the capability
or replacing the client loses authority. The resulting descriptor says:

- implementation target: `database_transaction_adapter`;
- database backend used: `none`;
- distributed database transaction verified: `false`;
- live Supabase/Postgres call performed: `false`;
- multi-replica durability verified: `false`; and
- production authority: `false`.

There is intentionally no production/live-client factory. The existing
package-state production-authority assertion continues to throw for this
adapter. This prevents the transport seam from being mistaken for deployed
database semantics.

## Fixed RPC Registry

Registry version:
`canonical-distributed-package-state-rpc-registry-v1`

Registry hash:
`c8c58239c10a57ff932807167155d87073eea7fc3443c540bd5cae589e6a53be`

The seven fixed function IDs are:

1. `reeditpro_claim_and_enqueue_package_attempt_v1`
2. `reeditpro_accept_package_controller_v1`
3. `reeditpro_accept_package_worker_and_start_v1`
4. `reeditpro_heartbeat_package_worker_v1`
5. `reeditpro_reconcile_package_completion_v1`
6. `reeditpro_reconcile_package_failure_v1`
7. `reeditpro_finalize_expired_package_attempts_v1`

These names are a transport contract only. No corresponding SQL function is
claimed to exist yet.

## Focused Evidence

`npm run smoke:canonical-distributed-package-state-rpc-adapter` passes and
proves:

- a copied capability is rejected;
- a capability cannot be used with a different RPC client;
- all seven fixed functions are invoked by their matching port methods;
- each port method issues exactly one client call;
- ordinary and timeout lost-response paths return exact durable replay objects;
- a one-row PostgREST/Supabase RPC array is normalized without accepting
  multiple rows;
- completion, failure, and timeout remain inside the internal-production-cost
  boundary;
- raw database error detail is not exposed; and
- adapter source contains no Supabase client constructor, service-role key,
  network `fetch`, child process, SQL execution, or retry activation path.

Focused ESLint and `npm run typecheck:server` pass with the adapter smoke.

On 2026-07-18, the exact-code v14 full private-pipeline aggregate passed all
`34/34` phases with exit code `0` in `1,871,448 ms`. The adapter phase passed
inside that aggregate in `428 ms`. The report explicitly records
`canonicalPackageStateDatabaseFunctionsExecuted: false` and
`canonicalPackageStateRpcLiveClientActivated: false`.

## Explicitly Not Performed

No SQL or migration was created, copied, ported, or executed. No existing local
Supabase/Postgres container was mutated. No remote Supabase request, Google
Cloud mutation, provider call, billing action, wallet/ledger mutation,
deployment, render, public delivery, Motion Studio change, or Edit
Preference/Edit Reference change occurred.

## Remaining Database Gate

The next database step still requires explicit reviewed authority for an
isolated disposable Postgres environment and a new canonical schema/function
implementation. That proof must cover real rollback, constraints, exact
idempotency response persistence, database-owned time, concurrent calls from
two independent processes, service-role/RLS/grant boundaries, restart
durability, and teardown. It must not run against the shared local stack or use
the rejected raw Supabase migration history as executable authority.

Until that evidence exists, the adapter remains a locked transport contract and
the full website-to-cloud ReEditPro workflow remains blocked at durable
distributed package state.
