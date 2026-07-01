# Pricing And Credits

## Core Model

Subscription is software access. Reedit Credits pay for AI generation, rendering, and editing usage.

Do not treat `$10/week` or `$20/week` as unlimited AI editing.

For backend/database architecture, see `credit-ledger-architecture.md`. Future credit implementation should use wallets, append-only ledger entries, estimates, and reservations rather than a single mutable number.

## Personal Plan

- `$10/week` software access.
- Includes 100 weekly bonus Reedit Credits.
- 100 credits = `$5` retail credit value.
- User can buy more credits.
- Intended for personal creators and smaller workflows.

## Business Plan

- `$20/week` software access.
- Stronger workflow, brand, team, and client tools.
- Can buy as many credits as needed.
- Business credits are treated as production/business usage.
- Intended for agencies, brands, teams, client delivery, and recurring content production.

## Credit Usage

Credits pay for AI generation, rendering, and editing usage, including future systems such as:

- AI edit planning if priced.
- Transcript/speech analysis if priced.
- Stroke Motion generation.
- Graphic Design / VisualExplain generation.
- Real Motion generation.
- SoundSync generation.
- Rendering/exporting.
- Regeneration requests.

## Estimate Before Generation

ReeditPro must show a credit estimate before generation begins.

The estimate should explain:

- Which systems are used.
- Which segments cost credits.
- Whether Real Motion is included.
- Estimated render/export cost.
- Optional lower-cost alternatives when useful.

## Deduct Only After Approval

Credits should be deducted only after the user approves the edit plan and credit estimate.

The AI should not start expensive editing, rendering, or generation before approval.

## Refund Failed ReeditPro Generation

If ReeditPro generation fails because of ReeditPro system failure, credits should be refunded or restored according to future billing policy.

User-requested changes after successful generation may require additional credits if clearly estimated and approved.

## Real Motion Cost

Real Motion is premium and credit-heavy. The estimate should make this clear before approval.

Reasons include:

- Visual footage analysis.
- Face-safe placement.
- Object/scene planning.
- Animation generation.
- Composite/rendering work.
- Review and possible regeneration.

## Purchased Credits Vs Weekly Bonus Credits

Weekly bonus credits are included with the Personal plan and should follow weekly availability rules.

Purchased credits are bought separately and should be tracked separately from weekly bonus credits in future backend work.

Business credits should be tracked as production/business usage and may require stronger reporting later.

## Timing Complexity Credits

Timing complexity affects Reedit Credits when a plan includes frame-accurate caption animation, visual cue timing, SoundSync, transitions, SFX, music ducking, AI clip duration, and Remotion layer timing.

Basic remains professional with simpler timing. Pro and Premium can include deeper timing when useful. High timing complexity should show lower-cost alternatives such as simpler captions, fewer SFX cues, phrase cuts only, shorter AI clips, static cards, simpler transitions, or voice-only timing. No real credit deduction happens in frontend/mock planning.

## RP-FIX-09 Runtime Skeleton

RP-FIX-09 adds a mock-safe credit runtime layer for estimates, approval gates, reservations, spend, release, refund, and generation/render/provider gate checks.

The new runtime skeleton makes the product rule explicit:

- expensive operations need an approved edit plan;
- expensive operations need an approved credit estimate;
- generation, render, provider, and worker jobs need a valid reservation;
- successful mock jobs can spend a reservation;
- failed mock jobs can release or refund a reservation.

This remains a partial implementation. Real credit reservation, spend, refund, Stripe purchase handling, and transactional ledger enforcement still require a deployed backend runtime.

## RP-CREDITPURCHASE-01 Mock Purchased Credits

The external-beta mock foundation now includes fixed mock purchased credit packs and local purchased grants. Mock top-up adds available credits only and keeps purchased credits separate from weekly bonus credits. It is not Stripe/payment or real checkout behavior, and it does not write a production ledger, mutate production wallets, reserve credits, retry blocked flows, run render/export, or unlock export.
