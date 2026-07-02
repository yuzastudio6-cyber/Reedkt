# Skill QA And Validation Contract Checklist

Use this checklist for future Creative Skill QA and validation prompts. It is documentation only and must not create runtime code, TypeScript contracts, SQL, migrations, QA runtime, validation scripts, diagnostics scripts, package changes, UI, providers, workers, render/export, credit runtime, approval runtime, Supabase work, or app behavior.

## Required Checks

| Check | What to verify | Pass condition |
| --- | --- | --- |
| QA stage identified | The prompt names the relevant QA stage. | Uses a stage such as `planning_contract_QA`, `StoryTiming_QA`, `credit_approval_QA`, or `revision_QA`. |
| QA category identified | The prompt names the relevant QA category. | Uses categories such as `planning_completeness`, `professional_taste`, `source_proof_safety`, or `runtime_boundary`. |
| Linked record present | QA links to a route, concept, opportunity, plan record, estimate item, approval group, or revision record. | No orphan QA issue exists. |
| Severity present | Each QA requirement/result has severity. | Uses `pass`, `info`, `warning`, `needs_review`, `blocking`, or `critical`. |
| Pass/fail/warning condition present | Each QA requirement explains how it passes or fails. | Pass, fail, and warning conditions are actionable. |
| Blocking behavior present | Blocking scope is explicit. | States whether the issue blocks plan display, credit estimate, approval, preview later, or future execution later. |
| Recommended fix present | Each issue has a fix. | Fix is specific enough to repair the plan. |
| User-visible message present where needed | User-facing blockers and warnings have clear copy. | Copy is honest and does not expose internal jargon unnecessarily. |
| Planning completeness checked | Planning chain is complete. | Opportunity, concept, candidate, route, contract, plan records, StoryTiming, credit/approval, QA, revision, and summary links exist where needed. |
| Professional taste checked | QA evaluates taste, not only technical validity. | Skills are earned, restrained where appropriate, and strong where the user asked for premium/wow. |
| Overuse checked | Dense or repeated effects are evaluated. | Repeated motion, transitions, SFX, text, 3D, B-roll, layouts, and music density are controlled. |
| Underuse checked | Generic or low-effort plans are evaluated. | High-priority opportunities and premium/wow requests are not ignored. |
| StoryTiming checked | Time windows and focus budgets are validated. | Primary focus, secondary support, safe zones, density, conflicts, SFX permission, transition permission, and ducking are covered. |
| Caption readability checked | Caption quality and safety are validated. | Source, accuracy, meaning, line breaks, read time, placement, contrast, animation, and claim/quote accuracy are covered. |
| Speech clarity checked | Speech remains primary when relevant. | Ducking, SFX, lyrics policy, ambience, B-roll audio, and silence are planned. |
| Face/product/action safety checked | Important visuals remain visible. | Face, eyes, mouth, hands, product, action, safe zones, and redaction zones are protected. |
| Source/proof safety checked | Claims and source visuals remain truthful. | Source status, proof level, user confirmation, redaction, rights/provenance, and Reference DNA do-not-copy rules are covered. |
| Credit/approval compliance checked | Credit-bearing work stays gated. | Estimate items link to routes, premium items are itemized, approval groups exist, lower-cost alternatives are linked, and no spend/reservation is implied. |
| User instruction/preference compliance checked | Direct user instructions and preferences are respected. | Must-follow and avoid rules override inferred preferences and Reference DNA. |
| Runtime boundary checked | Planning does not imply execution. | No provider call, worker job, generated asset, browser capture, render/export, QA runtime, validation runtime, or diagnostics runtime is implied. |
| Revision readiness checked | Revisions preserve auditability. | Affected routes, alternatives, rejected candidates, StoryTiming windows, reestimate needs, approval needs, and user copy are clear. |
| Existing edit-quality/planner-validation source truths considered | Existing QA owners are referenced. | `edit-quality-engine.md`, `src/lib/planner-validation.ts`, StoryTiming QA, caption/cut QA, SoundSync timing QA, credit gates, and QA report owners are not duplicated. |
| Runtime actions avoided | Prompt remains docs-only when scoped as docs-only. | No runtime, TypeScript, SQL, migrations, provider calls, workers, UI, package changes, QA runtime, validation scripts, diagnostics scripts, or app behavior. |

## Required Pseudo-record Coverage

Future docs or prompts that claim RP-SKILLS-19 coverage must account for these documentation-only pseudo-records:

- `SkillQARequirement`
- `SkillQAResult`
- `SkillQAReport`
- `SkillQARepairRecommendation`

Do not convert these into TypeScript, SQL, JSON schema, migrations, validation scripts, diagnostics scripts, runtime contracts, storage records, worker specs, provider instructions, or UI behavior unless a later prompt explicitly authorizes implementation after source-truth reconciliation.

## Fail The Prompt If

- QA ignores planning completeness.
- QA ignores professional taste.
- QA ignores overuse/underuse.
- QA ignores StoryTiming.
- QA ignores caption/speech safety.
- QA ignores face/product/action safety.
- QA ignores source/proof safety.
- QA ignores credit/approval gates.
- QA allows generation before approval.
- QA treats approval as credit spend, reservation, release, refund, wallet mutation, ledger mutation, or billing.
- QA allows a skill route without a planning contract.
- QA allows a premium skill without approval/credit hint.
- QA allows source-sensitive proof without source confirmation or safe wording.
- QA allows copied reference visual/audio material.
- QA treats warnings as clean pass.
- QA silently fixes plans without audit.
- QA hides blockers from the user-facing plan.
- QA creates runtime code.
- Prompt adds TypeScript before the type-contract milestone.
- Prompt adds migration before schema milestone.
- Prompt installs dependencies.
- Prompt mutates package files.
- Prompt unlocks QA/validation/diagnostics/runtime behavior.

## RP-SKILLS-20 Handoff Check

The next docs-only prompt should be:

`RP-SKILLS-20 - Skill Diagnostics and Static Validation Contract`

It should define future repository checks and static validation boundaries for Creative Skill docs/types/schema without implementing diagnostics scripts, validation runtime, CI jobs, TypeScript contracts, migrations, package changes, or app behavior.
