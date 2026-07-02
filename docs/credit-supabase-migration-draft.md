# RP-SUPABASE-MIGRATION-01 Credit Supabase Migration Draft

RP-SUPABASE-MIGRATION-01 prepares review-only Supabase SQL drafts for the external-beta credit persistence lifecycle. This package is not an active migration: no Supabase CLI command is run, no SQL is applied, no database is contacted, no generated database types are changed, no persistence repository is implemented, and no production wallet, ledger, Stripe, provider, render, export, checkout, or top-up behavior is wired.

The active migration baseline remains 24 files in `supabase/migrations`. Review SQL lives only under `supabase/review/`.

## Preconditions

- Base branch contains RP-PERSISTENCE-PLAN-01 merge `c31509a1743bbc795dc69225ca8feb1b7f7973eb`.
- `docs/credit-production-persistence-plan.md` remains the source architecture.
- Existing migrations are inspected before authoring active migrations.
- Supabase guidance is applied: public-schema tables need explicit role grants plus RLS policies; RLS filters rows after roles can access the relation.
- All SQL in this milestone is review draft only and must not be copied into production without a later migration milestone, local/staging validation, advisor review, and owner approval.

## Existing Schema Inventory

The following tables or views already exist and must be reused instead of duplicated:

| Existing target | Current role | Draft action |
| --- | --- | --- |
| `credit_wallets` | Workspace/user wallet with cached available, reserved, spent, and refunded balances. | Reuse; document service-role transactional writers and no negative cached balances. |
| `credit_grants` | Grant buckets for weekly bonus, purchased, promo, admin, and refund credits. | Reuse; add provenance conventions for top-up intents and Stripe checkout/webhook records. |
| `credit_ledger_entries` | Append-style wallet movement evidence. | Reuse; preserve ledger semantics and avoid double-counting with reservation totals. |
| `credit_estimates` | Estimate totals, min/max, approvals, payloads, and expiration. | Reuse; store external-beta preview details in `estimate_payload`/line payloads. |
| `credit_estimate_line_items` | Per-tool and service-fee estimate lines. | Reuse; preserve high-credit payloads for max-hold reservation and settlement allocation. |
| `credit_approvals` | User approval evidence for estimates. | Reuse for max-hold reservations and revised-credit flows. |
| `credit_reservations` | Approved credit holds with reserved/spent/released/refunded totals. | Reuse; one active `reserved` reservation per estimate. |
| `credit_reservation_line_items` | Hold allocation by estimate line and grant bucket. | Reuse; add line roles in payload for revised additional holds and settlement allocation. |
| `credit_refunds` | Future refund record. | Reuse for refund workflow only; absorbed overage is not a refund. |
| `credit_wallet_balance_view` | Read convenience over wallet cached balances. | Reuse; keep security-invoker behavior under review. |
| `api_idempotency_keys` | API idempotency replay records. | Reuse for API mutation replay and same-key/different-hash conflict handling. |
| `generation_request_costs` | Legacy/provider request cost history. | Keep as provider history; do not use as canonical tool-cost ledger. |
| `tool_cost_events` | Append-only tool cost event records. | Reuse; keep `serviceFeeIncluded = false` and add UUID alignment in a later active migration if approved. |
| `tool_cost_wallet_settlements` | Narrow existing settlement bridge for tool costs. | Keep as prototype/narrow bridge; final edit settlement uses `credit_settlements`. |

## Proposed New Tables

The review draft proposes these missing tables only if absent:

- `credit_settlements`: final receipt, preview/top-up state, absorbed overage, final charge, released credits, outstanding credits, and safe payload.
- `credit_revision_actions`: projected-overage pause and approve/lower-cost/cancel resolution records.
- `credit_export_locks`: settlement-driven export readiness locks for approved-but-unfunded top-up states.
- `credit_top_up_intents`: fixed-pack top-up intent lifecycle before purchased grants are issued.
- `stripe_customer_links`: mode-scoped Stripe customer IDs and safe customer metadata.
- `stripe_payment_method_links`: safe payment method display metadata only.
- `stripe_checkout_sessions`: mode-scoped fixed-pack checkout records linked to top-up intents.
- `stripe_webhook_events`: verified event idempotency and redacted processing summary.

Optional audit/support views may be derived from durable records first. A `credit_audit_events` table should be added only if support needs immutable snapshots independent of source tables.

## Table Alter And Enum Gaps

Existing tables should be altered only for approved gaps:

- Add payload conventions rather than duplicate columns when current JSONB fields are sufficient.
- Align `tool_cost_events.credit_estimate_id` and `tool_cost_events.credit_reservation_id` from text to UUID only in a reviewed active migration with backfill planning.
- Add enum values only when existing enum types cannot represent external-beta statuses.
- Keep `partially_spent` out of active runtime eligibility for new paid work.
- Keep `spent` as the terminal reservation state for completed mock/prod settlement.

## Constraints

Draft constraints must cover:

- non-negative credits and non-negative cents;
- no negative wallet cached balances;
- `released_credits <= reserved_credits`;
- `spent_credits <= reserved_credits` for normal settlements;
- `outstanding_credits >= 0`;
- `absorbed_overage_credits >= 0`;
- normal settlement charge consistency: final charge equals actual tool cost plus ReEditPro service fee;
- absorbed-overage consistency: user final charge plus absorbed overage equals computed actual tool cost plus ReEditPro service fee;
- one active reservation per estimate using a partial unique index where `status = 'reserved'`;
- unique idempotency key per operation/scope;
- unique Stripe webhook event ID per Stripe mode;
- unique Stripe checkout session ID per Stripe mode;
- no test/live Stripe mode mismatch where enforceable.

## Ledger Semantics

`credit_ledger_entries` remains the append-only evidence of wallet movement, while reservations, reservation line items, settlements, and tool cost events explain why balances moved. Production services must update cached wallet balances and append ledger entries in the same transaction, and must not double-count by treating reservation totals and ledger deltas as separate sources of truth.

## Indexes

Draft indexes must cover:

- wallets by workspace/user/type;
- grants by wallet/status/source type/expiration;
- estimates by project/edit plan/status;
- reservations by estimate/status/idempotency key;
- settlements by reservation/status/idempotency key;
- revision actions by reservation/status;
- export locks by settlement/status;
- tool cost events by reservation/project/job/billable-to-user;
- webhook events by Stripe event ID and mode;
- checkout sessions by checkout session ID and mode;
- customer links by workspace/user/mode;
- top-up intents by wallet/status/idempotency key;
- audit/support lookups by project, wallet, settlement, and created time.

## RLS And Grants

Every proposed public-schema table enables RLS. The draft includes explicit grants because table exposure and row authorization are separate concerns:

- `grant select ... to authenticated` for user-visible read models, filtered by workspace/project membership policies.
- `grant select, insert, update, delete ... to service_role` for backend-owned billing-critical writes.
- No authenticated insert/update/delete policies for wallet balances, grants, ledger entries, reservations, settlement outcomes, revision action mutation, export locks, Stripe webhook rows, or billable tool-cost events.
- Support/admin reads remain deferred to backend routes until the production support role model is approved.
- Views should use security-invoker behavior where possible, or remain backend-only if support authorization is unclear.

## RPC And Transaction Drafts

The RPC draft skeletons are review artifacts only:

- `reserve_max_estimate_credits`: lock wallet, estimate, approval, grants, and idempotency rows; reserve exactly max hold; create reservation lines; append hold ledger entries.
- `reserve_additional_revised_credits`: lock action, reservation, wallet, grants, and idempotency rows; add only the extra revised max hold; append a revision reservation line and ledger hold.
- `settle_credit_reservation`: lock reservation, wallet, lines, selected tool cost events, and idempotency; compute billable tool costs first; add service fee separately; spend/release hold; record absorbed overage or approved-but-unfunded state.
- `complete_stripe_credit_grant_from_webhook`: verify the already-recorded webhook event, mode, amount, pack, wallet, and idempotency; complete the top-up intent; grant purchased credits; append ledger entry.
- `expire_bonus_credits`: lock expiring grants and wallet; reduce remaining bonus credits; append expiration ledger entries.

All drafts require service-role/backend execution and idempotent replay. Client code must not execute these functions directly unless a later security review approves a safe wrapper.

## Secret And Data Safety

Drafts store Stripe object IDs, safe mode-scoped metadata, redacted summaries, and reference names only. They must never store raw Stripe secret values, webhook signing values, card numbers, card verification code values, full raw webhook payloads, provider credentials, service-role keys, authorization headers, signed URLs, raw provider payloads, or unredacted prompt payloads.

## Stripe Test/Live Mode Separation

The test/live Stripe mode separation rule requires customer links, payment method links, checkout sessions, webhook events, and purchased grant provenance to always include mode-scoped identifiers. Test records must never satisfy live credit grant, webhook, or checkout evidence, and live readiness remains no-charge until a later owner-approved activation milestone.

## Dry-Run Checklist

Before any later active migration:

1. Convert review drafts into timestamped migrations only through the approved Supabase migration workflow.
2. Run local/staging migration validation and Supabase advisor/security review.
3. Verify RLS and explicit grants for authenticated and service-role access.
4. Verify idempotency replay for every mutation path.
5. Verify max-estimate hold, revised-credit pause, absorbed overage, and approved-but-unfunded export lock semantics.
6. Verify Stripe test/live data isolation and webhook replay safety.
7. Regenerate database types only after migrations are reviewed and applied in the approved environment.

## Application Order

Recommended later migration order:

1. Add missing tables and safe constraints.
2. Add indexes and triggers.
3. Enable RLS, revoke public/anon access, grant authenticated reads, and grant service-role writes.
4. Add RPC/function bodies in a restricted schema or service-role-owned pathway after security review.
5. Add support/audit views only after admin/support authorization is clear.
6. Generate types after local/staging validation passes.

## Rollback Considerations

The later active migration should be reversible in local/staging with table drops or feature flags before production data exists. Once production credit rows exist, rollback should prefer read-only mode, feature flag disablement, idempotent replay, and additive corrective migrations over destructive table drops.

## Unresolved Questions

- Whether support/admin read policies will use a dedicated role table, workspace role, app metadata, or backend-only route authorization.
- Whether RPC functions live in `public`, a private schema, or only behind service-role server handlers.
- Whether `tool_cost_events` text IDs should be migrated to UUID FKs immediately or bridged through payload conventions first.
- Whether immutable `credit_audit_events` are required or support can derive evidence from source tables.

## Boundary

RP-SUPABASE-MIGRATION-01 adds review documentation, review SQL drafts, a docs-only smoke, and short status notes. It does not create active migrations, run Supabase CLI, apply SQL, perform SQL execution, connect to a database, mutate production data, add runtime persistence files, wire persistence repositories, remove mock stores, enable live billing, create any Stripe charge, process Stripe webhooks against production persistence, mutate production wallets, write production ledgers, make a provider call, run workers, render/export, unlock export, or change `package-lock.json`.

Boundary checklist: no active migrations; no Supabase CLI; no SQL execution; no generated database types; no runtime persistence files; no live billing; no Stripe charge; no provider call; no render/export.
