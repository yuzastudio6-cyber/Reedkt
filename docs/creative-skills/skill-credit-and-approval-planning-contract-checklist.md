# Skill Credit And Approval Planning Contract Checklist

Use this checklist for future prompts that touch Skill Credit and Approval Planning. It is documentation only and must not create runtime code, TypeScript contracts, SQL, migrations, package changes, UI, billing logic, Stripe logic, wallet/ledger/reservation behavior, approval runtime, provider calls, workers, render/export, or app behavior.

## Required Checks

| Check | What to verify | Pass condition |
| --- | --- | --- |
| Skill routes input present | The prompt starts from `EditPlanSkillRoute` or `EditPlanSkillRouteBundle` planning context. | Credit planning is route-linked, not skill-name-only. |
| Estimate item linked to route | Each `SkillCreditEstimateItem` has route, route bundle, skill key, and skill family context. | No orphan credit estimate items. |
| Credit impact present | Each item has `credit_impact`. | Uses `none`, `low`, `medium`, `high`, `premium`, `variable`, or `unknown_needs_estimate`. |
| Estimate category present | Each item has `estimate_category`. | Category maps to the RP-SKILLS-18 estimate category model. |
| Estimate confidence present | Each item has `estimate_confidence`. | Uses high, medium, low, unknown/provider, user-input-blocked, or source-confirmation-blocked status. |
| Estimate readiness present | Summary has `estimate_readiness`. | Missing route, StoryTiming, source, and user-input blockers are represented honestly. |
| Required/optional status present | Each item has `required_or_optional`. | Required, recommended, optional, optional premium, lower-cost, blocked, removed, or no-credit status is explicit. |
| Premium item itemized | Premium, generated, provider, Real Motion, 3D, custom music, or heavy SFX work is separate. | No premium work is hidden inside a base edit item. |
| Lower-cost alternative linked where useful | Optional premium items include `SkillCreditLowerCostAlternative` or a reason none exists. | User can choose a simpler path when one is honest. |
| Approval group present where needed | Credit-bearing, premium, generated, source-sensitive, or revision-impacting work has `SkillApprovalGroup`. | Approval behavior is explicit before future execution. |
| User-visible approval copy present | Approval groups have `SkillApprovalCopy`. | Copy explains what, why, credit impact, optionality, lower-cost choice, and source safety. |
| Source-sensitive approval noted | Proof cards, metrics, UI labels, browser/app visuals, customer material, redaction, rights, or provenance are called out. | No invented source/proof details and no hidden source risk. |
| StoryTiming blockers considered | Timing windows, focus density, cue count, collisions, caption/speech safety, and density conflicts are checked. | Blockers set readiness to `missing_StoryTiming` or `blocked`. |
| Credit sensitivity considered | User/project/workspace preference from `RP-SKILLS-12` is reflected. | Credit-sensitive users get lower-cost alternatives and restrained premium suggestions. |
| Revision credit behavior considered | Revisions use `SkillRevisionCreditImpact`. | Added premium work, source changes, timing changes, or removal to lower cost are explicit. |
| Reservation/spend boundary respected | Estimate planning does not claim reservation, spend, release, refund, restoration, or wallet mutation. | Planning copy stays before runtime credit behavior. |
| No-generation-before-approval gate present | Generated, provider-backed, worker-backed, render/export, Real Motion, 3D, music, SFX, or capture work is blocked before approval. | Copy says approval is required before future execution, not that execution started. |
| Existing credit/approval source truths reconciled | Prompt references existing credit owners. | `pricing-and-credits.md`, credit ledger direction, credit runtime approval gate, reservation/spend/refund flow, backend mock records, and planner validation are not duplicated. |
| Runtime actions avoided | Prompt stays Markdown-only when scoped as docs-only. | No runtime, TypeScript, SQL, migrations, provider calls, workers, UI, package changes, Stripe, wallet, ledger, reservation, or approval runtime. |

## Required Pseudo-record Coverage

Future docs or prompts that claim RP-SKILLS-18 coverage must account for these documentation-only pseudo-records:

- `SkillCreditEstimateItem`
- `SkillCreditLowerCostAlternative`
- `SkillApprovalGroup`
- `SkillApprovalCopy`
- `SkillCreditEstimateSummary`
- `SkillRevisionCreditImpact`

Do not convert these into TypeScript, SQL, JSON schema, migrations, prompt execution, runtime contracts, storage records, billing logic, wallet/ledger code, approval runtime, or worker specs unless a later prompt explicitly authorizes implementation after source-truth reconciliation.

## Approval Copy Checks

Approval copy should answer:

- What would be added?
- Why does it help the edit?
- Is it required or optional?
- Is it premium or generated?
- What is the expected credit impact or estimate confidence?
- What lower-cost alternative exists?
- What source/proof/rights/redaction risk exists?
- What future action remains blocked until approval?

Approval copy must not pressure the user, imply credits have been reserved or spent, imply a provider call has started, or imply source proof exists when it does not.

## Fail The Prompt If

- It executes from a skill name only.
- It creates a credit estimate item without a route, route bundle, selected concept, or skill key link.
- It implies credit spend, reservation, release, refund, restoration, wallet mutation, ledger mutation, billing, or Stripe activity.
- It implies approval exists before the user approves.
- It starts or unlocks provider calls, generated assets, worker jobs, render/export, browser capture, audio/music/SFX generation, caption rendering, 3D runtime, Real Motion runtime, or app behavior.
- It hides premium or generated work inside the base edit.
- It creates optional premium work without explicit approval behavior.
- It omits lower-cost alternatives for optional premium work without explaining why.
- It omits approval copy for premium, generated, source-sensitive, or credit-bearing work.
- It omits source/proof/redaction/rights notes for evidence-sensitive work.
- It invents exact websites, dashboards, metrics, pricing, UI labels, product claims, rights, customer names, or source provenance.
- It ignores StoryTiming blockers, caption collisions, speech safety, source safety, or density conflicts.
- It ignores credit sensitivity or direct user instruction.
- It treats a subscription as unlimited AI generation.
- It omits `SkillRevisionCreditImpact` for revisions that add, remove, or change credit-bearing routes.
- It adds runtime code.
- It adds TypeScript contracts before a future type-contract prompt.
- It adds Supabase migrations or SQL before a future schema prompt.
- It installs dependencies.
- It mutates package files.
- It unlocks credit/billing/approval/runtime behavior.

## RP-SKILLS-19 Handoff Check

The next docs-only prompt should be:

`RP-SKILLS-19 - Skill QA and Validation Contract`

It should validate route assembly, skill plan records, StoryTiming readiness, source/proof safety, credit estimate items, approval groups, lower-cost alternatives, revision notes, user-visible summaries, and no-generation-before-approval gates without implementing runtime code.
