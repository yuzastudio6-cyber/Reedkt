# Pricing And Credits

## Core Model

Subscription is software access. Reedit Credits pay for AI generation, rendering, and editing usage.

Do not treat `$10/week` or `$20/week` as unlimited AI editing.

For backend/database architecture, see `credit-ledger-architecture.md`. Future credit implementation should use wallets, append-only ledger entries, estimates, and reservations rather than a single mutable number.

## Personal Plan

- `$10/week` software access.
- Includes 100 weekly bonus Reedit Credits.
- 1 credit = `$0.10`; 100 credits = `$10` retail credit value.
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

RP-CREDITPOLICY-01 supersedes older legacy notes that said `100 credits = $5`. The external-beta policy is now `100 credits = $10`. Credits also cover ReEditPro's service/edit fee on top of actual billable tool costs.

## Product Edit-Level Service Fee

Product edit levels are `normal`, `premium`, and `ultra_premium`. They are separate from any tool/runtime compute levels such as `economy`, `standard`, and `premium`.

The ReEditPro service/edit fee is:

```text
max(length_floor_fee_credits, percentage_fee_credits)
```

For 0-5 minutes, floors are Normal 30, Premium 50, and Ultra Premium 80 credits. For 5-10 minutes, floors are Normal 40, Premium 70, and Ultra Premium 120 credits. For 10-20 minutes, floors are Normal 70, Premium 120, and Ultra Premium 200 credits. For 20-60 minutes, floors are Normal 120, Premium 220, and Ultra Premium 350 credits. Edits at 60 minutes or longer require a custom estimate.

Percentage protection is 10% for Normal, 20% for Premium, and 30% for Ultra Premium. Final user charge is actual billable tool cost credits plus the ReEditPro service/edit fee.

Tool owners report actual internal tool cost only. Tool owners must never include the ReEditPro service/edit fee inside tool cost events.

## Estimate Before Generation

ReeditPro must show a credit estimate before generation begins.

The estimate should explain:

- Which systems are used.
- Which segments cost credits.
- Whether Real Motion is included.
- Estimated render/export cost.
- Optional lower-cost alternatives when useful.

## Interim 4K Export Estimate Ceiling

Until a later product policy replaces it, every initial edit estimate must price one approved deliverable with a 4K UHD render/export ceiling. The covered delivery profiles are 1080p Full HD, 2K/1440p, and 4K UHD at the confirmed aspect ratio, FPS, and approved duration.

Exporting that same approved deliverable must not show another credit estimate, ask the user to approve credits again, create a second reservation, or deduct credits a second time. The export runtime verifies the original approved estimate and reservation instead.

An additional deliverable; a changed aspect ratio, FPS, or duration outside the approved tolerance; a custom frame outside the registered profiles; or output above the 4K ceiling is revised scope. ReeditPro must return to planning and approval before doing that extra work rather than adding an export-time surcharge.

Selecting a 4K container for lower-resolution source media does not imply restored source detail. Any enhancement/upscaling operation is separately planned, traced, and QA-checked.

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

## No Silent Recovery Billing

If projected cost may exceed the approved maximum estimate, ReEditPro must pause before extra paid work continues and show: `Action required: revised credit estimate needed`.

Export lock copy is only: `Action required: add credits to export`, and it is allowed only for separately approved revised scope when that approved final charge is not fully funded. It must not appear for the original single deliverable covered by the initial 4K estimate and reservation.

If ReEditPro estimated incorrectly, provider variance occurred without user approval, or ReEditPro failed to pause in time, ReEditPro absorbs the unapproved overage. Do not silently take credits from the user's next edit and do not create hidden negative wallet behavior. This policy has no live billing, no Stripe, no Supabase migration, no wallet mutation, and no render/export charging in this milestone.
