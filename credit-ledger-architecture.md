# Credit Ledger Architecture

## Purpose

This document defines the future ReeditPro credit ledger architecture. It is documentation only and does not integrate Stripe, create migrations, or implement billing.

## Core Model

Subscription is software access. Reedit Credits pay for AI generation, rendering, and editing usage.

The system must not treat `$10/week` or `$20/week` as unlimited AI editing.

RP-CREDITPOLICY-01 locks the external-beta retail value at 1 credit = $0.10, so 10 credits = $1.00 and 100 credits = $10.00. Older notes that said 100 credits = $5 are legacy and superseded.

Credits also pay ReEditPro's service/edit fee on top of actual billable tool cost. Tool owners report actual internal tool cost only and must never include the ReEditPro service/edit fee inside tool cost events.

## RP-FIX-11 Runtime Note

Worker leases and idempotency keys are now represented in mock runtime services. Production credit spend/refund must remain transactionally tied to job completion/failure and idempotency records so a retried or duplicated worker cannot spend credits twice.

## Required Tables

### `credit_wallets`

One wallet per billable owner, usually workspace.

Fields:

- `id`
- `workspace_id`
- `user_id`
- `wallet_type`: `personal`, `business`, `promo`, `admin`
- `status`: `active`, `paused`, `closed`
- `created_at`
- `updated_at`

### `credit_ledger_entries`

Append-only credit event ledger.

Fields:

- `id`
- `wallet_id`
- `entry_type`: `grant`, `purchase`, `reservation`, `spend`, `refund`, `expiration`, `admin_adjustment`
- `credit_state`: `available`, `reserved`, `spent`, `refunded`, `expired_bonus`, `admin_adjusted`
- `amount`
- `source_type`: `weekly_bonus`, `purchase`, `estimate`, `job`, `revision`, `admin`
- `source_id`
- `description`
- `created_by`
- `created_at`

### `credit_estimates`

Estimate shown before generation.

Fields:

- `id`
- `workspace_id`
- `project_id`
- `chat_session_id`
- `edit_plan_id`
- `revision_request_id`
- `estimated_total`
- `breakdown_json`
- `status`: `draft`, `ready_for_review`, `approved`, `expired`, `revised`, `cancelled`
- `valid_until`
- `approved_by`
- `approved_at`
- `source_chat_message_id`

### `credit_reservations`

Reservation after approval.

Fields:

- `id`
- `wallet_id`
- `credit_estimate_id`
- `project_id`
- `job_id`
- `amount`
- `status`: `reserved`, `spent`, `refunded`, `cancelled`, `expired`
- `reserved_at`
- `spent_at`
- `refunded_at`
- `failure_reason`

## Credit Flow

```text
estimate credits
-> user approves
-> reserve maximumEstimatedCredits
-> generation starts
-> if success, reserved becomes spent
-> if ReeditPro failure, reserved/spent credits are refunded
```

If projected spend may exceed the approved maximum estimate, ReEditPro must pause and show `Action required: revised credit estimate needed`. No extra paid work continues until the user approves a revised estimate, chooses a lower-cost option, or cancels extra work.

If ReEditPro fails to pause before an unapproved overage, ReEditPro absorbs the overage. Do not silently charge the next edit and do not create hidden negative wallet behavior. Export lock copy, `Action required: add credits to export`, is allowed only for approved but unfunded final charges.

## Credit Types

### Weekly Bonus Credits

- Granted by plan on a weekly cadence.
- May expire according to future policy.
- Should be separate from purchased credits in ledger entries.

### Purchased Credits

- Bought separately.
- Should not be confused with subscription access.
- Used for AI generation, rendering, and editing usage.

### Promotional Credits

- Granted by campaign or admin.
- Should include expiration and source metadata.

### Business Credits

- Associated with workspace production usage.
- Should support future reporting by project, team member, client, and job.

## Estimate Breakdown

`credit_estimates.breakdown_json` should include:

- Planning/transcript analysis if priced.
- Captions.
- Basic cleanup.
- Stroke Motion.
- Graphic Design / VisualExplain.
- Real Motion.
- SoundSync.
- Render/preview.
- Export.
- Revision costs.

Each item should include reason, segment, system, required/optional flag, and whether it can be removed to lower cost.

## Approval Rules

- A credit estimate can be shown without reserving credits.
- Credits reserve only after the user approves the plan and estimate in chat.
- Generation jobs must verify an active reservation.
- User-requested revisions after successful generation may require a new estimate.
- Failed ReeditPro generation should refund reserved/spent credits.

## Real Motion And Premium Costs

Real Motion is premium and credit-heavy because it can require:

- Visual footage analysis.
- Object planning.
- Face-safe placement.
- Motion generation.
- Composite/rendering work.
- Review and regeneration.

The estimate must make Real Motion cost visible before approval.

## RP-FIX-09 Runtime Skeleton

RP-FIX-09 introduces mock runtime services around the ledger model:

- estimate creation for edit plans, music, SFX, signature systems, render/export, and demo/free cases;
- approval gate checks for edit-plan approval, estimate approval, reservation status, reservation scope, and available credits;
- mock reservation records after estimate approval;
- mock spend, release, and refund ledger entries;
- generation/render/provider/worker gate helpers that block expensive work without a valid reservation.

The existing credit tables remain the target schema. The skeleton does not add migrations, integrate Stripe, deploy backend code, or mutate remote data. A production implementation still needs transactional backend handlers so reservation, spend, release, and refund cannot be bypassed or double-applied.

## RP-FIX-10 Job Recovery Link

RP-FIX-10 connects mock job completion/failure flows to the RP-FIX-09 credit skeleton. Successful mock jobs can spend a reserved credit record. Failed mock jobs can release or refund reserved credits. Production behavior still requires transactional backend enforcement around job status and ledger mutation.

## RP-CREDITPOLICY-01 Policy Lock

RP-CREDITPOLICY-01 adds policy/types/docs/constants and smoke coverage for credit retail value, product edit-level service fee floors/percentages, tool-owner service-fee exclusion, revised estimate copy, export-lock copy, and no-silent-recovery billing rules.

It does not add live billing, Stripe, Supabase migration, wallet mutation, provider calls, render/export charging, credit reservation/spend execution, or production settlement.

## RP-CREDITDATA-01 Data Foundation

RP-CREDITDATA-01 adds mock-safe settlement and action-required data records: `CreditSettlementRecord`, `CreditRevisionActionRecord`, `EditCreditCostSummary`, and read-only preview contracts. The mock store supports idempotency and receipt preview while preserving no live billing, no wallet mutation, no reservation spend/release/refund, no ledger write, no Stripe checkout, no provider call, no render/export execution, and no export unlock. Production settlement enforcement remains a later backend milestone.

## RP-RATECARD-01 Rate Card Cost Math

RP-RATECARD-01 hardens the mock-safe rate card and cost math that feeds settlement preview. Tool-cost events store actual internal tool cost only, pricing snapshots keep `serviceFeeIncluded = false`, non-billable costs remain visible as absorbed cost, and ReEditPro service fee is added separately by credit policy math. `smoke:rate-card` and the `smoke:tool-cost-metering` alias cover the integer micros/cents/credits bridge.

This still does not add live billing, Stripe/payment, provider calls, Supabase migrations, wallet mutation, reservation spend/release/refund, ledger writes, render/export execution, production persistence, or export unlock.

## RP-TOOLCOST-01 Production Tool Cost Coverage

RP-TOOLCOST-01 derives mock-safe owner coverage for all 49 production registry tools and exposes estimate/event adapters over the RP-RATECARD-01 math. Billable production tool events require approved plan context, approved credit estimate, active reservation when required, and idempotency. Non-billable events remain visible as absorbed internal cost. ReEditPro service fee is still settlement-preview policy only and is never included in tool-cost events.

This still does not add live billing, Stripe/payment, provider calls, Supabase migrations, wallet mutation, reservation spend/release/refund, ledger writes, render/export execution, production persistence, settlement execution, or export unlock.

## RP-ESTIMATE-01 Credit Estimate Preview

RP-ESTIMATE-01 adds a mock-safe estimate preview before paid work starts. It aggregates production tool estimate ranges, adds the ReEditPro service/edit fee as a separate line, records the high estimate as the future required hold, and reports informational top-up/lower-cost options.

This still does not approve estimates, reserve credits, spend/release/refund credits, mutate wallets, write ledgers, call providers, run workers, render/export, run Supabase, create production persistence, or unlock export.
