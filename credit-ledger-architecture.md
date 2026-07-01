# Credit Ledger Architecture

## Purpose

This document defines the future ReeditPro credit ledger architecture. It is documentation only and does not integrate Stripe, create migrations, or implement billing.

## Core Model

Subscription is software access. Reedit Credits pay for AI generation, rendering, and editing usage.

The system must not treat `$10/week` or `$20/week` as unlimited AI editing.

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
-> reserve credits
-> generation starts
-> if success, reserved becomes spent
-> if ReeditPro failure, reserved/spent credits are refunded
```

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

## RP-RESERVATION-01 Max Hold Foundation

RP-RESERVATION-01 updates the mock reservation foundation so the pre-work hold reserves `maximumEstimatedCredits` / `requiredHoldCredits`, not `totalEstimatedCredits`. The new server route and corrected mock helpers create only local in-memory wallet/reservation state for the hold; they do not write reservation ledger entries, run settlement, spend/release/refund credits, call providers, run render/export, unlock export, start checkout/top-up, write Supabase, or wire live billing/Stripe behavior. See `docs/credit-reservation-max-estimate.md` and `smoke:credit-reservation`.

## RP-RUNTIME-GUARD-01 Runtime Guard

RP-RUNTIME-GUARD-01 adds a mock-safe paid-tool start guard before worker lease, provider, or render execution. It treats `reserved` as the only active reservation status, includes current billable mock tool-cost events and pending high-credit work in the projection, keeps tool-cost events `serviceFeeIncluded = false`, and uses the credit policy service-fee math separately. Projected overage creates one idempotent mock `CreditRevisionActionRecord` with "Action required: revised credit estimate needed" and `projected_overage`; it does not create ledger entries, spend, release, refund, settle, call providers, run render/export, unlock export, or wire live billing.

## RP-CREDITREVISION-01 Revised Credit Resolution

RP-CREDITREVISION-01 resolves those mock revised-credit actions. Approve & Continue may reserve a local mock `revised_credit_additional_hold` on the existing reservation; Choose Lower-Cost Option and Cancel Extra Work record the user decision without reservation changes. This layer still creates no ledger entries and performs no spend, release, refund, settlement, provider call, render/export, checkout/top-up, export unlock, Supabase write, or live billing behavior.

## RP-SETTLEMENT-01 Final Credit Settlement

RP-SETTLEMENT-01 performs final settlement in local mock state only. It aggregates billable tool-cost events, adds the ReEditPro service/edit fee separately, updates mock wallet/reservation balances, releases unused hold, and records absorbed overage or approved-but-unfunded state without creating production ledger entries. Live billing, Stripe/payment, Supabase writes, provider calls, render/export, checkout/top-up, and export unlock remain future work.

## RP-EXPORTLOCK-01 Export Credit Gate

RP-EXPORTLOCK-01 adds a local/mock export readiness gate over settlement state. It allows `settled` and `settled_with_absorbed_overage`, and creates only an idempotent mock export lock for `requires_top_up_before_export`. It does not create ledger entries, mutate production wallets, run checkout/top-up, execute render/export, unlock export, write Supabase, or wire live billing.
