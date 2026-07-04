# Credit Runtime Approval Gate

RP-FIX-09 adds a mock-safe credit approval gate service. It makes the product rule explicit: expensive work cannot start until the edit plan is approved, the credit estimate is approved, and credits are reserved.

## Gate Checks

The gate checks:

- current workspace/project scope;
- edit plan approval when required;
- credit estimate existence;
- credit estimate approval;
- available credit snapshot before reservation;
- credit reservation existence;
- reservation status and expiration;
- reservation workspace/project/edit-plan/estimate match.

## Frontend Boundary

Frontend code may display estimates and mock gate results. It must not be trusted to reserve, spend, release, or refund real credits. Real ledger mutation remains backend-required.

RP-FIX-10 uses the credit gate as one required input before mock worker queue items can dispatch. The production rule remains unchanged: no worker, provider, render, or export job may run without approved credits and a valid reservation.

Credit reservation creation has a backend-owned hold path for platform wallet QA. `POST /v1/credit-estimates/:creditEstimateId/reserve` requires auth and idempotency, and in non-mock runtime calls the `reserve_credit_hold` RPC from `20260703232842_credit_reservation_hold_rpc.sql`. The RPC requires an approved credit approval, wallet, workspace, project, estimate, positive reserved credit amount, and idempotency key; it records one reservation, updates cached wallet available/reserved balances, appends one reservation ledger row, and replays by idempotency key. It keeps Stripe and ReEditPro service/edit fees out of the reservation/ledger metadata. Missing migration/RPC support fails closed through `CREDITS_NOT_RESERVED`.

`npm run smoke:credit-reservation-hold:sql` verifies the reservation RPC source against a disposable local Postgres database. The smoke creates only temporary prerequisite tables, applies the migration, proves positive reservation, wallet cached available/reserved balance movement, one reservation ledger row, idempotent replay, insufficient-funds blocking, service-fee exclusion, Stripe isolation, and service-role-only RPC execution, then drops the database. It is not a remote Supabase migration, live production wallet mutation, Stripe operation, provider call, media operation, beta unlock, or production approval.

Tool-cost wallet settlement has a backend-owned settlement path for platform billing QA. `POST /v1/tool-costs/events/:toolCostEventId/settle` requires auth and idempotency, keeps Stripe and ReEditPro service/edit fees out of tool owner cost events, and in non-mock runtime calls the `settle_tool_cost_event` RPC created by `202606270003_tool_cost_wallet_settlement_rpc.sql` and replaced by `20260703234354_wallet_settlement_state_updates.sql`. The replacement RPC updates reservation spent/released/refunded counters, cached wallet available/reserved/spent/refunded balances, settlement rows, and credit-ledger rows in one service-role-only transaction. Local/mock mode creates only a mock ledger effect, but it must now derive that effect from a previously recorded in-memory tool-cost event; unknown event IDs or caller-supplied workspace, project, credit reservation, credit amount, billable, or failure-category mismatches fail closed before settlement. Billable spend, release, and refund settlement requests must include `creditReservationId`; settlement replay and RPC results must match the requested workspace, project, tool-cost event, supplied credit reservation, and event-derived financial result before they are accepted. Missing migration/RPC support fails closed with `TOOL_COST_BACKEND_REQUIRED`.

`npm run smoke:tool-cost-wallet-settlement:service-role` verifies the non-mock service-role settlement path with a fake Supabase admin client. It proves replay lookup, RPC function/parameter shape, persistent row mapping, Stripe isolation, service-fee exclusion, and missing-RPC fail-closed behavior without touching remote Supabase.

`npm run smoke:tool-cost-wallet-settlement:sql` verifies that RPC source against a disposable local Postgres database. The smoke creates only temporary prerequisite tables, applies the table/RLS migration plus the state-update RPC migration, proves billable spend/release/refund, reservation spent/released/refunded counters, cached wallet available/reserved/spent/refunded balances, idempotent replay, non-billable provider-failure settlement, service-fee exclusion, Stripe isolation, and RLS policy presence, then drops the database. It is not a remote Supabase migration, live wallet mutation, Stripe operation, provider call, media operation, beta unlock, or production approval.

`npm run smoke:beta-platform-rls-readback:sql` verifies local RLS/readback behavior for the billing platform tables against a disposable local Postgres database. It proves scoped authenticated reads for `tool_cost_events` and `tool_cost_wallet_settlements`, non-member denial, backend-only beta and production readiness evidence read denial, and authenticated insert denial. It is not deployed Supabase evidence and does not clear the platform blocker by itself.

`npm run smoke:beta-platform-monitoring-catalog` verifies source-only metric and alert templates for tool-cost event writes, idempotent replay, persistent write failures, wallet settlement, RLS readback, billing QA missing evidence, and Stripe-boundary violations. It does not deploy dashboards or alerts.

`npm run prod:readiness:billing-evidence-collector` is the production billing route evidence handoff. It defaults to dry-run mode and performs no HTTP calls unless `REEDITPRO_PRODUCTION_BILLING_CONFIRM_ROUTE_EVIDENCE=true` is supplied with a backend API base URL, bearer token, event idempotency key, settlement idempotency key, workspace, and project. In confirmed mode it uses backend routes only: it posts one controlled tool-cost event, replays that event idempotently, posts one wallet settlement with the same credit reservation context, replays that settlement idempotently, and reads the project tool-cost summary. The collector verifies event persistence, summary readback, wallet settlement, replay safety, reservation context, Stripe isolation, service-fee exclusion, and no silent-charge behavior. It does not call Stripe, execute tools, dispatch workers, process media, write Supabase directly, or approve production by itself.

`npm run prod:readiness:wallet-lifecycle-evidence-collector` is the focused production wallet lifecycle evidence handoff. It defaults to dry-run mode and requires operator evidence for reservation, spend, release, refund, settlement RPC deployment, service-role-only RPC execution, idempotent replay, and no silent-charge behavior before it can reuse the all-up production readiness evidence route. It does not mutate wallets, write ledgers directly, call Supabase directly, call Stripe, execute tools, dispatch workers, process media, or approve production by itself.

`npm run prod:readiness:stripe-boundary-evidence-collector` is the focused production Stripe boundary evidence handoff. It defaults to dry-run mode and requires operator evidence for billing-owner approval, no Stripe calls from tool-cost surfaces, service-fee exclusion from tool events, and webhook separation from the tool ledger before it can reuse the all-up production readiness evidence route. It does not import Stripe, call Stripe, mutate billing records, mutate wallets, write Supabase directly, execute tools, dispatch workers, process media, or approve production by itself.

`npm run smoke:beta-platform-stripe-boundary` verifies that tool-cost and beta billing surfaces do not depend on Stripe, import Stripe, instantiate Stripe, call Stripe APIs, or lose Stripe-isolation and service-fee-exclusion audit markers. It does not grant billing-owner approval or enable Stripe.

`npm run smoke:beta-platform-evidence-manifest` verifies that remaining platform billing blocks are actionable evidence requirements, not permanent intentional stops. It connects local proof commands and source files to the staging deployment evidence, billing-owner approval, monitoring deployment, billing QA, and launch-owner approvals still required before external beta or production can open.

## Mock Status

The mock gate returns allowed/blocked decisions and warnings. It does not call Stripe, provider APIs, workers, rendering, or remote Supabase.

## Remaining Work

Production still needs deployed reservation and settlement migration evidence, service-role runtime verification, authenticated RLS readback, wallet balance readback in staging/production, billing-owner Stripe-boundary approval, billing-owner QA, monitoring, and owner approvals before these wallet paths can clear the platform blocker.

The paid-production evidence preflight treats the wallet settlement state-update migration as its own Supabase deployment proof. Operators must provide `REEDITPRO_PRODUCTION_SUPABASE_WALLET_SETTLEMENT_STATE_MIGRATION_DEPLOYED=true` alongside the older table/RPC migration evidence so wallet spend/release/refund cannot be approved from a settlement-row-only deployment.
