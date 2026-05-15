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
