# RP-PERSISTENCE-PLAN-01 Credit Production Persistence Plan

RP-PERSISTENCE-PLAN-01 maps the completed mock/test external-beta credit system to a future production Supabase persistence architecture. This is a planning artifact only: no migration was created, no SQL was applied, no Supabase CLI command was run, no database was contacted, no Stripe webhook was processed, no production credits were granted, and no mock store was removed.

## Scope And Non-Goals

The goal is to define how production persistence should reuse the existing credit schema and extend it safely. The plan covers wallets, grants, estimates, approvals, reservations, tool costs, final settlement, revised-credit actions, export locks, purchased top-ups, Stripe links, webhook idempotency, support audit, and launch evidence.

Non-goals for this milestone:

- no Supabase migration file
- no Supabase CLI command
- no SQL execution
- no generated database types
- no persistence repository implementation
- no route behavior changes
- no live Stripe call
- no Stripe webhook processing
- no production wallet mutation
- no production ledger write
- no provider call
- no worker, render, or export execution
- no `package-lock.json` change

## Current Schema Inventory

The existing migrations already define the core credit spine. Production persistence should reuse these tables instead of creating a second wallet, ledger, estimate, reservation, idempotency, or tool-cost system.

| Area | Existing table or view | Source migration | Current coverage | Gap |
| --- | --- | --- | --- | --- |
| Wallet | `credit_wallets` | `202605130004_credit_ledger_approval_gate.sql` | Workspace/user wallet, cached available/reserved/spent/refunded balances, metadata, RLS, indexes. | Needs transactional service-role writers for grant, reserve, spend, release, refund, and reconciliation. |
| Grants | `credit_grants` | `202605130004_credit_ledger_approval_gate.sql` | Separate weekly bonus, purchased, promotional, admin, and refund buckets with remaining amount, billing provider/payment fields, expiration, metadata. | Needs purchased top-up intent linkage and Stripe checkout/webhook provenance. |
| Ledger | `credit_ledger_entries` | `202605130004_credit_ledger_approval_gate.sql` | Append-style credit movement records with idempotency key, related estimate/reservation/project/edit-plan fields, metadata, RLS, indexes. | Needs production write policy: service-role only for billing-critical entries and exact movement taxonomy for max hold, additional hold, final spend, release, refund, purchased grant, absorbed overage evidence. |
| Estimates | `credit_estimates` | `202605130004_credit_ledger_approval_gate.sql` | Minimum/total/maximum estimate fields, snapshots, payload, shown/approved timestamps, line items. | Needs canonical external-beta fields from `CreditEstimateRecord` stored in `estimate_payload`, including required hold, top-up summary, service-fee separation, tool estimate snapshots, and readiness. |
| Estimate lines | `credit_estimate_line_items` | `202605130004_credit_ledger_approval_gate.sql` | Per-line usage category, label, estimated credits, optional/premium flags, provider/model hints, JSON payload. | Needs high-credit line payload conventions for max-hold reservation and settlement allocation. |
| Approvals | `credit_approvals` | `202605130004_credit_ledger_approval_gate.sql` | Estimate approval/rejection with approver, note, payload. | Needs explicit approval evidence for production max-reservation and revised-credit paths. |
| Reservations | `credit_reservations` | `202605130004_credit_ledger_approval_gate.sql` | Wallet/estimate/approval reservation with reserved/spent/released/refunded totals, idempotency key, timestamps, metadata. | Needs status/constraint alignment for external-beta statuses: `reserved`, terminal `spent`, expired/cancelled/failed, no `partially_spent` start eligibility. |
| Reservation lines | `credit_reservation_line_items` | `202605130004_credit_ledger_approval_gate.sql` | Links reservation to estimate line and grant bucket with reserved/spent/released/refunded totals. | Needs additional-hold line role `revised_credit_additional_hold` and final settlement allocation rules. |
| Refunds | `credit_refunds` | `202605130004_credit_ledger_approval_gate.sql` | Refund record with reason, approval, completion, ledger link, ReEditPro-failure flag. | Future refund workflow only; not used for normal absorbed overage. |
| Wallet balance view | `credit_wallet_balance_view` | `202605130004_credit_ledger_approval_gate.sql` | Read convenience over cached wallet balances. | Consider security-invoker or protected view policy in final migration review. |
| API idempotency | `api_idempotency_keys` | `202605210001_e2e_runtime_readiness_tables.sql` | Unique `(workspace_id, user_id, idempotency_key)`, request hash, response status/table/id, expiry. | Reuse for public API mutations; add service conventions for same-key/different-hash conflict and stored replay response. |
| Provider costs | `generation_request_costs` | `202605130007_generation_providers_generated_assets.sql` | Legacy/provider request cost history tied to generation requests. | Keep as provider-request history; do not use as the canonical credit tool-cost ledger. |
| Tool costs | `tool_cost_events` | `202606270001_tool_cost_metering_events.sql` | Append-only backend-recorded tool metering events, unique idempotency key, workspace/project/tool indexes, RLS read, `serviceFeeIncluded = false` by policy. | Keep as canonical production tool-cost ledger; add service-role writer and UUID FK alignment for estimate/reservation/project data before production deployment. |
| Tool-cost wallet settlements | `tool_cost_wallet_settlements` | `202606270003_tool_cost_wallet_settlement_rpc.sql` | Narrow idempotent settlement records for tool-cost event wallet settlement. | Treat as a prototype/narrow bridge; final edit settlement still needs `credit_settlements` and full reservation spend/release semantics. |

## Schema Gaps

These tables are proposed for later reviewed migrations. They are not applied in this milestone.

| Proposed table or view | Purpose | Reuse relationship |
| --- | --- | --- |
| `credit_settlements` | Durable final settlement receipt for completed edits, preview-only states, absorbed overage, approved-but-unfunded state, final charge, released hold, outstanding credits, and receipt payload. | References existing wallet, estimate, reservation, project, ledger entries, and `tool_cost_events`. |
| `credit_revision_actions` | Durable projected-overage pause and user resolution records: action required, approved, lower-cost selected, cancelled. | References existing estimate/reservation/project and writes additional hold only through reservation transaction. |
| `credit_export_locks` | Durable export readiness/lock state for `requires_top_up_before_export`. | References settlement/reservation/project; does not replace export tables. |
| `credit_top_up_intents` | Mock/test/live top-up intent lifecycle before grants are issued. | Completes into `credit_grants` with `source_type = purchased`; idempotency comes from `api_idempotency_keys` plus provider IDs. |
| `stripe_customer_links` | Mode-scoped Stripe customer IDs and safe customer metadata. | Links workspace/user/wallet; stores no raw secrets and no raw Stripe payload. |
| `stripe_payment_method_links` | Safe saved payment method display metadata only. | Links Stripe customer links; stores brand/last4/expiry only, never card number/CVC. |
| `stripe_checkout_sessions` | Mode-scoped Checkout Session records for fixed credit packs. | Links top-up intent/wallet/pack; grants credits only after verified webhook transaction. |
| `stripe_webhook_events` | Raw-body verification evidence, event idempotency, processing status, safe summary. | Unique on `(stripe_mode, provider_event_id)`; stores no raw webhook body or secret. |
| `credit_audit_events` or support views | Optional immutable support-read evidence snapshots. | Prefer deriving from wallet/grant/reservation/settlement/tool/Stripe records first; add table only if support evidence must be snapshotted. |

## Mock Store To Production Mapping

| Mock/test source | Production target |
| --- | --- |
| `mock-credit-estimate-store` estimate previews | `credit_estimates`, `credit_estimate_line_items`, `credit_approvals`, plus `api_idempotency_keys` for preview writes. |
| `mock-credit-reservation-store` wallets and grants | `credit_wallets`, `credit_grants`, `credit_ledger_entries`, `credit_reservations`, `credit_reservation_line_items`. |
| `reserveMaxEstimateCredits` | Service-role transaction that locks the wallet row, verifies approved estimate, reserves `maximum_estimated_credits` / `requiredHoldCredits`, writes reservation lines, ledger hold entries, and idempotency replay state. |
| `runtime-credit-guard-service` | Read-only service-role guard over approved plan, approved estimate, active `reserved` reservation, current `tool_cost_events`, and pending high-credit projection. |
| `CreditRevisionActionRecord` | `credit_revision_actions`, with approve-and-continue applying only an additional reservation hold transaction. |
| `CreditSettlementRecord` | `credit_settlements`, reservation terminal update, reservation line item allocation, ledger spend/release entries, absorbed-overage evidence. |
| `CreditExportLockRecord` | `credit_export_locks`, created only for `requires_top_up_before_export`. |
| `MockCreditTopUpIntent` and purchased grants | `credit_top_up_intents`, `stripe_checkout_sessions`, `stripe_webhook_events`, `credit_grants`, and grant ledger entries. |
| Stripe foundation/testmode stores | `stripe_customer_links`, `stripe_payment_method_links`, `stripe_checkout_sessions`, `stripe_webhook_events`, and safe wallet/grant links. |
| Credit audit timeline and beta readiness | Derived read model over all above tables; optional `credit_audit_events` only if snapshot evidence is required. |

## Transaction Model

Production persistence must use backend service-role execution for every billing-critical write. A service-role backend owns the transaction boundary for credit movement. Client code may request actions, but it must never directly write balances, grants, ledgers, reservations, settlements, export locks, Stripe grant records, or tool-cost events.

Required transactional operations:

- Wallet creation and purchased/weekly/promotional grant issuance.
- Max-estimate reservation: lock wallet/grants, validate approved estimate and approval, reserve exactly the maximum hold, create reservation lines, update cached wallet balances, append ledger records, and store idempotency replay.
- Revised-credit approve-and-continue: lock action, wallet, and reservation; calculate additional hold; add only the extra reserved credits; append one revision line and ledger hold movement.
- Tool-cost event insert: append-only service-role write with unique idempotency key; reject `serviceFeeIncluded = true`.
- Runtime guard projected-overage pause: read current billable tool costs and reservation state; create one idempotent `credit_revision_actions` row when projection exceeds approved hold.
- Final settlement: lock settlement idempotency key, reservation, wallet, reservation lines, and selected tool-cost events; compute billable tool cost first, add ReEditPro service fee separately, spend/release reserved credits, record absorbed unapproved overage when needed, and write `credit_settlements`.
- Approved-but-unfunded settlement: record outstanding credits but do not mutate wallet/reservation or unlock export.
- Export gate: create/upsert `credit_export_locks` only for `requires_top_up_before_export`; settled and absorbed-overage states are read-only export-allowed.
- Stripe webhook credit grant: verify raw-body signature before JSON parsing, enforce mode/amount/pack/wallet metadata, create or replay `stripe_webhook_events`, complete top-up intent, issue purchased grant, update wallet, append ledger grant, and store idempotency replay in one transaction.

## Grant Allocation Order

Production reservation and settlement code should allocate credits deterministically so support can explain every held, spent, released, or refunded credit. The default grant allocation order should be: expiring promotional/admin grants first when policy allows, weekly bonus credits before purchased credits for normal included usage, purchased credits for paid overflow/top-up usage, and refund credits according to their original source metadata. Final implementation must preserve grant source in `credit_reservation_line_items` and ledger metadata so purchased credits are not confused with weekly bonus credits.

## Ledger Semantics And Double-Counting Risk

`credit_ledger_entries` should remain the append-only audit record for wallet movement, while `credit_reservations`, `credit_reservation_line_items`, `credit_settlements`, and `tool_cost_events` are source records for why the movement happened. Production services must not double-count by treating both reservation totals and ledger deltas as independent balances. Cached wallet balances are derived/convenience fields updated in the same transaction as ledger movements, never a second source of truth.

## Index And Constraint Plan

Later migrations should add indexes and constraints around the new proposed tables before persistence is enabled: unique idempotency keys for mutation tables, unique `(stripe_mode, provider_event_id)` for webhook events, workspace/project/time lookup indexes for support/audit views, settlement and reservation lookup indexes for export gates, and non-negative credit/cents constraints for all financial fields. Constraints should also reject raw-secret payload fields where feasible and rely on service validation for deep JSON redaction.

## Proposed SQL Snippets - Not Applied

The following snippets are proposed, not applied. They are documentation examples only and must be rewritten into reviewed migrations through a later migration milestone.

```sql
-- proposed, not applied
create table public.credit_settlements (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  credit_wallet_id uuid not null references public.credit_wallets(id) on delete restrict,
  credit_estimate_id uuid not null references public.credit_estimates(id) on delete restrict,
  credit_reservation_id uuid not null references public.credit_reservations(id) on delete restrict,
  status text not null,
  mode text not null,
  actual_tool_cost_credits integer not null default 0,
  reeditpro_service_fee_credits integer not null default 0,
  final_charge_credits integer not null default 0,
  absorbed_overage_credits integer not null default 0,
  released_credits integer not null default 0,
  outstanding_credits integer not null default 0,
  settlement_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

```sql
-- proposed, not applied
create table public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_mode text not null check (stripe_mode in ('test', 'live')),
  provider_event_id text not null,
  event_type text not null,
  processing_status text not null,
  related_credit_wallet_id uuid references public.credit_wallets(id) on delete set null,
  related_credit_top_up_intent_id uuid,
  safe_event_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (stripe_mode, provider_event_id)
);
```

```sql
-- proposed, not applied
create table public.credit_export_locks (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  credit_settlement_id uuid not null,
  credit_reservation_id uuid not null references public.credit_reservations(id) on delete restrict,
  lock_status text not null,
  lock_reason text not null,
  outstanding_credits integer not null default 0,
  created_at timestamptz not null default now()
);
```

## RLS And Service-Role Plan

RLS should protect every table in the exposed `public` schema. User-facing RLS is read-only for billing-critical records and should be scoped by workspace/project membership or wallet ownership. Billing-critical writes should be service-role only. No client writes to balances, grants, ledgers, Stripe grant records, tool-cost events, settlement outcomes, or export locks are allowed.

Read patterns:

- Authenticated users can read their own workspace wallet summaries, grants, estimates, approvals, reservations, reservation lines, settlements, revision actions, export locks, top-up intents, safe Stripe link summaries, and audit receipts.
- Support/admin audit reads remain behind backend routes until a production admin authorization model exists.
- Tool-cost and Stripe trace reads expose safe summaries only; no raw prompts, provider headers, raw webhook bodies, card numbers, CVC/CVV, API keys, service-role keys, or signed URLs.

Write patterns:

- No authenticated client insert/update/delete policy for wallet balances, grants, ledger entries, reservations, settlement outcomes, Stripe webhook events, tool-cost events, export locks, or production audit snapshots.
- Estimate preview and approval writes may accept user intent through backend routes, but the durable rows should be written by service-role handlers after validation and idempotency checks.
- If views are added for support or wallet summaries, use security-invoker behavior where available or keep the view in an unexposed schema with backend-only access.

## Idempotency Plan

Reuse `api_idempotency_keys` for API-level mutation idempotency. The same `(workspace_id, user_id, idempotency_key)` must replay the same response when the request hash matches and must fail on same-key/different-hash conflicts.

Additional provider-level uniqueness remains necessary:

- `tool_cost_events.idempotency_key` for append-only tool-cost events.
- `credit_reservations.idempotency_key` for max-estimate reservations.
- `credit_ledger_entries.idempotency_key` for ledger movement dedupe.
- `credit_settlements.idempotency_key` for final settlement replay.
- `credit_revision_actions` resolution keys for approve/lower-cost/cancel replay.
- `credit_top_up_intents` create/complete keys for top-up replay.
- `stripe_webhook_events` unique `(stripe_mode, provider_event_id)` for webhook replay.

## Stripe Test/Live Separation

Stripe records must be mode-scoped. Test and live records must never share customer, payment method, checkout session, webhook event, or grant provenance rows without an explicit `stripe_mode` discriminator.

Rules:

- Store Stripe IDs and safe metadata only.
- Store secret reference names only where needed; never store raw secret values.
- Store no raw webhook payloads, provider headers, card numbers, CVC/CVV, client secrets, publishable key values, API keys, or service-role keys.
- Live readiness can be `ready_no_charge`, but live Checkout Sessions, SetupIntents, PaymentIntents, webhook credit grants, and production wallet mutation remain disabled until a later live activation milestone.
- Stripe test-mode checkout grants purchased credits only after verified webhook processing and idempotent transaction replay.

## Support And Audit Read Model

The current audit layer can remain a derived read model for v1 production persistence. It should read from durable records and assemble:

- estimate-to-approval evidence
- max-hold reservation evidence
- runtime projected-overage pauses
- revised-credit resolution decisions
- billable and non-billable tool-cost evidence
- final settlement receipts
- export locks and outstanding top-up state
- purchased grants and Stripe test/live trace summaries
- launch-gate evidence

Add `credit_audit_events` only if operators need immutable support snapshots independent of source tables. If added, it must store redacted payloads only and remain backend/service-role written.

## Rollout Plan

1. Review this plan with billing, backend, Supabase/RLS, and support owners.
2. Author reviewed migrations in a separate milestone using Supabase migration tooling; do not hand-create migration filenames.
3. Validate migrations locally, run RLS/security review, and verify advisors before staging.
4. Implement service-role repositories behind feature flags while keeping mock stores as the default.
5. Run dual-read/dual-write staging checks with deterministic test data.
6. Enable Supabase-backed persistence for internal beta only after idempotency, transaction, rollback, and support readbacks pass.
7. Enable Stripe test-mode persistence before live mode.
8. Keep live external beta blocked until no-charge live readiness, live webhook raw-body handling, payment reconciliation, and production support evidence are approved.

## Launch Gates

Production persistence cannot be enabled until all of these are true:

- reviewed migrations exist and are applied only in approved local/staging environments
- RLS policies allow user reads but block billing-critical client writes
- service-role routes own wallet, grant, reservation, settlement, Stripe webhook, and tool-cost writes
- idempotency replay is verified for every mutation path
- max-estimate hold is enforced before paid work
- revised estimate action is required before approved overage
- absorbed unapproved overage remains ReEditPro-paid
- approved-but-unfunded export lock does not unlock export
- no silent next-edit recovery is used to collect earlier overage
- tool-cost events remain append-only and `serviceFeeIncluded = false`
- Stripe test/live mode data is isolated
- raw secrets, raw webhook payloads, card numbers, and CVC/CVV are never stored
- support audit readbacks can explain every balance movement

## Rollback And Safety

Production rollout must support a kill switch back to mock/test-safe behavior, read-only persistence mode, and idempotent replay without duplicate grants or wallet movements. If a transaction fails after an external Stripe test/live event is received, the webhook event row should remain recoverable and reprocessable without double-granting. If a tool-cost or settlement path fails closed, paid work must pause rather than silently spending more credits or creating negative balances.

No normal production flow should create a negative wallet balance. The only overage rule in this architecture is explicit absorbed overage when ReEditPro failed to pause before unapproved cost exceeded the hold; that overage is recorded as ReEditPro absorbed cost, not silent user debt.

## Next Milestone

The next milestone should be reviewed migration authoring and local/staging verification. It should create migration files with Supabase migration tooling, run local/staging validation, and produce database type generation only after schema review. It should not directly enable production billing.
