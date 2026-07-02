# Credit Runtime Schema Audit

## Tables Found

Active migrations include credit runtime tables in `supabase/migrations/202605130004_credit_ledger_approval_gate.sql`:

- `credit_wallets`
- `credit_grants`
- `credit_ledger_entries`
- `credit_estimates`
- `credit_estimate_line_items`
- `credit_approvals`
- `credit_reservations`
- `credit_reservation_line_items`
- `credit_refunds`
- `credit_wallet_balance_view`

Later migrations also reference credits from edit planning, jobs, generation requests, render jobs, renders, exports, approved plan snapshots, and RLS policies.

## Types And Services Found

Type coverage exists in `src/types/credits.ts` for wallets, grants, ledger entries, estimates, line items, approvals, reservations, reservation line items, refunds, and balance view records.

Existing mock service coverage existed in `src/backend/services/credit-service.ts` for wallet creation, bonus grants, estimates, approvals, reservations, spend, and refund. RP-FIX-09 adds a dedicated runtime/gate layer rather than replacing that service.

## Approval And Reservation Links

Existing records already include:

- edit plan status and `approvalStatus`;
- credit estimate status and `approvedAt`;
- credit approval records;
- credit reservation status and reserved/spent/released/refunded counts;
- generation request `creditEstimateId` and `creditReservationId`;
- job batch/job `creditEstimateId` and `creditReservationId`;
- render job/render/export credit references.

## Gaps And Risks

- No deployed backend runtime exists for real transactional reservation, spend, release, or refund.
- No Stripe purchase/checkout/webhook flow exists.
- Frontend and mock services can display estimates, but real ledger mutation must be backend-only.
- The mock gate can prove the flow, but production must enforce it in the route/runtime that queues provider calls, workers, renders, and exports.
- No remote Supabase validation or migration execution was run for RP-FIX-09.
