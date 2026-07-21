# Edit Reference Study Chat production persistence contract — 2026-07-21

Status: `source_contract_complete_runtime_and_migration_blocked`

Aggregate contract: `edit-reference-production-persistence-contract-v6`

Study Chat contract: `edit-reference-study-chat-production-persistence-v1`

## Outcome

The canonical Edit Reference persistence model now represents the complete
pre-plan Study Chat reasoning run instead of treating one aggregate reasoning
attempt as proof of a multi-provider lifecycle.

The contract adds six tenant-bound production table shapes for:

1. the exact saved-direction reasoning run and approved internal-cost budget;
2. versioned Kimi, Qwen, and DeepSeek route-attempt lifecycles that become
   immutable at terminal settlement;
3. one-use provider request and reconciliation state;
4. append-only provider observations and usage evidence;
5. durable digest-only checkback leases and unknown-outcome recovery; and
6. one immutable terminal run receipt binding failed-attempt cost, final result,
   assistant message, and aggregate settlement.

This is one extension of the existing Edit Reference production authority. It
does not create a second message store, evidence store, provider queue, cost
registry, or preference/application authority.

## Transaction requirements

- Saving the exact user direction, reviewable evidence, reasoning-run
  reservation, and route-specific idempotency response must share one
  transaction.
- The run keeps the hashed reservation key, canonical request hash, and
  durable response digest; no temporary provider target or raw payload is an
  idempotency response.
- Provider submission is one-use. A lost or unknown response must reconcile
  through the durable provider request/checkback authority before any next
  action.
- A fallback may begin only after the immediately preceding route has a
  committed allowed terminal failure and its internal cost is retained.
- A completed route stops fallback. An unknown provider outcome blocks
  fallback and retains the maximum authorized internal-cost exposure.
- Route-attempt terminal state and usage/cost evidence share one transaction.
- A route attempt uses compare-and-swap while active and cannot change after
  terminal settlement; append-only provider observations retain its audit
  history.
- Terminal run receipt, assistant message, and aggregate reasoning settlement
  share one transaction and replay through one durable response association.

## Route and cost boundary

The exact reasoning order remains:

1. Kimi K3 primary;
2. Qwen 3.7 after an allowed terminal Kimi failure; and
3. DeepSeek V4 Pro after an allowed terminal Qwen failure.

Qwen2.5-VL remains the visual specialist and cannot substitute for reasoning.
Every provider attempt is separately metered. Failed-attempt cost is retained,
and Qwen USD normalization requires one immutable versioned CNY-to-USD FX
snapshot. Provider cost and infrastructure cost remain distinct. Customer
price, customer credits, wallet mutation, billing, and ReEditPro service fees
remain outside this contract.

## Tenant and privacy boundary

Every table requires forced RLS, service-transaction-only mutation, and
composite workspace/reference/study/run relationships. The browser cannot
select a provider, route, worker, attempt, or lease. Database records exclude
raw provider requests, raw provider responses, hidden reasoning, credentials,
signed URLs, and local paths. User-visible Study Chat continues to receive only
the existing bounded reasoning-status projection.

## Closed gates

`productionEnabled` remains `false`. This source contract does not provide or
activate:

- an executable canonical migration chain;
- live Supabase/Postgres RPC adapters or forced-RLS evidence;
- the mounted hosted multi-attempt runtime adapter;
- Kimi, Qwen, or DeepSeek provider dispatch;
- multi-replica checkback lease recovery;
- live provider/infrastructure usage settlement;
- provider secrets, Google Cloud, billing, deployment, or public delivery.

The raw migration baseline remains `blocked_by_parallel_foundations`; no SQL
or remote mutation is permitted from this contract.

The production readiness contract now also requires
`study_chat_reasoning_run_tables_and_atomic_settlement_verified` under the
live canonical-persistence gate. Source fixtures cannot satisfy that assertion.

The mounted Study Chat runtime port is now
`edit-reference-study-chat-runtime-port-v2`. Hosted execution additionally
requires same-release live repository/RPC, multi-attempt persistence,
multi-replica checkback, provider dispatch, and usage/cost settlement evidence.
This source version has no insertion path into its private production
qualification set, so a port cannot promote itself by setting those flags.

## Verification

Run:

```bash
npm run smoke:edit-reference-study-chat-production-persistence
npm run smoke:edit-reference-study-chat-reasoning-run
npx tsx server/smoke/edit-reference-production-long-form-persistence-contract-smoke.ts
npx tsx server/smoke/edit-reference-production-application-lifecycle-smoke.ts
npm run typecheck:server
```

The focused smoke proves the six-table shape, route order, one-use/unknown
outcome transaction rules, failed-attempt cost retention, privacy boundaries,
and fail-closed rejection of a missing receipt table, skipped Kimi route, raw
provider payload persistence, fabricated approved-edit authority, or attempted
runtime promotion.
