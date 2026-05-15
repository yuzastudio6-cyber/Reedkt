# Credit Ledger Architecture

## Purpose

This document defines the future ReeditPro credit ledger architecture. It is documentation only and does not integrate Stripe, create migrations, or implement billing.

## Core Model

Subscription is software access. Reedit Credits pay for AI generation, rendering, and editing usage.

The system must not treat `$10/week` or `$20/week` as unlimited AI editing.

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

