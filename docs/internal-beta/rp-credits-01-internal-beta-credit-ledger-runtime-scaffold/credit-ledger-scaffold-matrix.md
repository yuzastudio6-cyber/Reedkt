# RP-CREDITS-01 Credit Ledger Scaffold Matrix

Every row returns `disabled_pending_credit_ledger_runtime_gate`. No row reserves, spends, releases, refunds, or mutates credits.

| Operation | Scaffold function | Approved plan | Approved estimate | Reservation | Job completion | Idempotency | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `credit_reservation_create` | `createInternalBetaCreditReservationRuntimeScaffold` | required | required | not_required | not_required | required | `disabled_pending_credit_ledger_runtime_gate` |
| `credit_reservation_validate` | `validateInternalBetaCreditReservationRuntimeScaffold` | required | required | required | not_required | not_required | `disabled_pending_credit_ledger_runtime_gate` |
| `reserved_credits_spend` | `spendInternalBetaReservedCreditsRuntimeScaffold` | required | required | required | required | required | `disabled_pending_credit_ledger_runtime_gate` |
| `reserved_credits_release` | `releaseInternalBetaReservedCreditsRuntimeScaffold` | required | required | required | not_required | required | `disabled_pending_credit_ledger_runtime_gate` |
| `credits_refund_for_failed_generation` | `refundInternalBetaCreditsForFailedGenerationRuntimeScaffold` | required | required | required | required | required | `disabled_pending_credit_ledger_runtime_gate` |
| `credit_ledger_readback` | `readInternalBetaCreditLedgerRuntimeScaffold` | not_required | not_required | not_required | not_required | not_required | `disabled_pending_credit_ledger_runtime_gate` |

## Runtime State

Credit mutation: `false`

Stripe/payment processing: `disabled`

Supabase mutation: `false`

Worker execution: `false`

Provider/model calls: `false`

Render/export execution: `false`

Internal beta unlock: `false`
