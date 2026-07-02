# Skill Credit And Approval Planning Contract

`RP-SKILLS-18` defines the documentation-only Skill Credit and Approval Planning contract for future Creative Skill routes.

This document is not runtime code, a TypeScript contract, a SQL schema, a migration, a billing system, a wallet/ledger implementation, a Stripe integration, an approval runtime, a provider instruction, a worker spec, or a UI design. It is a planning contract for how future skill routes and route bundles should become credit estimate items, approval groups, optional premium decisions, lower-cost alternatives, approval copy, revision credit notes, and no-generation-before-approval gates.

## Purpose

Skill Credit and Approval Planning sits after `RP-SKILLS-17 - Skill Route and Plan Assembly Contract`. It translates planned skill routes into user-facing credit and approval planning artifacts without executing the routes.

It answers:

- Which planned skill routes may affect credits?
- Which credit-impacting items are required, recommended, optional, optional premium, or lower-cost alternatives?
- Which items need explicit user approval before future generation, provider calls, worker execution, reservation, render, or export can happen?
- What should the user understand before approving?
- Which items need a new estimate after revision?
- Which existing credit, approval, wallet, ledger, and billing owners must be referenced rather than duplicated?

Core boundary: credit/approval planning is not execution. It creates planning metadata only.

## Strict Docs-only Boundary

This contract does not:

- Create or mutate `credit_estimates`, `credit_reservations`, `approval_records`, wallets, ledgers, billing records, Stripe records, jobs, workers, route records, provider requests, render jobs, export records, or Supabase records.
- Reserve, spend, release, refund, restore, grant, purchase, or expire credits.
- Charge a customer or call Stripe.
- Approve anything on behalf of the user.
- Start generation, rendering, browser capture, audio processing, caption rendering, 3D runtime, provider calls, worker jobs, or app behavior.
- Add TypeScript, JSON schema, SQL, prompts, migrations, UI, package changes, provider routing, worker contracts, or runtime gates.

All pseudo-records below are Markdown documentation only.

## Credit And Approval Doctrine

Principle: "Credit estimates and approvals are gates, not execution."

Credit planning must make the cost and approval implication of a future route understandable before the system does expensive work. Approval planning must protect the user from surprise generation, surprise credit use, surprise licensed asset choices, surprise source claims, and surprise revision charges.

This is the not-execution doctrine for skill credit planning.

The professional doctrine:

- Estimate before expensive work.
- Ask before premium or generated work.
- Show lower-cost alternatives when a strong idea is useful but costly.
- Preserve the user's direct instruction and credit sensitivity.
- Do not hide optional premium work inside a required edit.
- Do not imply credits are reserved or spent until the future credit runtime does that through approved backend gates.
- Do not imply approval exists until a future approval record exists.
- Do not imply source proof, rights, or provenance is confirmed unless current source truth confirms it.

## Position In Planning Flow

Skill Credit and Approval Planning happens after route assembly and before approval, future reservation, jobs/workers, QA, preview, revision, and export.

1. User intent and source context are interpreted by existing planning owners.
2. Visual Opportunity and Creative Concept docs identify possible creative ideas.
3. Skill Taxonomy and Skill Candidate Resolver docs map concepts to candidate skills.
4. `RP-SKILLS-17` assembles selected candidates into future skill routes and required plan-record attachments.
5. `RP-SKILLS-18` creates credit estimate items, approval groups, optional premium choices, lower-cost alternatives, and approval copy.
6. Future user approval may approve, reject, request changes, or select lower-cost options.
7. Only a later runtime milestone may create real credit estimates, approval records, reservations, jobs, provider calls, worker dispatch, QA, previews, revisions, render, export, billing, or ledger activity.

## Required Input Context

A future credit/approval planning pass must not run from a skill name alone. It needs route-linked context:

| Input | Required | Description |
| --- | --- | --- |
| `edit_plan_id` | Required | The future edit plan or draft plan being estimated. |
| `route_bundle_id` | Required | The route bundle from `RP-SKILLS-17`. |
| `selected_skill_routes` | Required | Route records with canonical `skill_key`, role, time/scope, status, plan attachments, and user-visible summaries. |
| `required_plan_record_sets` | Required | Required timing, composition, audio, source, QA, and revision records for the route. |
| `route_conflict_flags` | Required when present | StoryTiming, source/proof, collision, audio, caption, approval, and QA blockers from route assembly. |
| `credit_tendency` | Required | Credit tendency from taxonomy, resolver, route assembly, or existing source truth. |
| `approval_tendency` | Required | Approval tendency from taxonomy, resolver, route assembly, source/proof safety, or user settings. |
| `edit_preference_snapshot` | Required when available | Credit sensitivity, premium tolerance, restraint preference, wow-factor target, and blocked/preferred skill guidance. |
| `storytiming_coordination_state` | Required when available | Timing windows, focus density, conflict state, and permission gates from StoryTiming planning. |
| `source_proof_safety_state` | Required when relevant | Evidence, rights, redaction, claim, generated/future source, and provenance status. |
| `existing_credit_context` | Required when available | Current plan tier, wallet preview, subscription plan, purchased credits, weekly credits, estimate policy, and pricing rules. |
| `revision_context` | Required for revisions | Previous approval, previous estimate, changed routes, added/removed premium work, and user requested changes. |
| `user_direct_instruction` | Required | Any explicit user instruction such as "keep credits low", "avoid AI generation", or "I approve premium 3D". |

## Credit Impact Model

`credit_impact` describes planning expectation, not billing behavior.

| Value | Meaning | Example |
| --- | --- | --- |
| `none` | No planned credit impact. | Use existing footage with simple cuts. |
| `low` | Small likely impact or simple credit item. | Keyword caption styling. |
| `medium` | Meaningful but ordinary credit impact. | Graphic proof card plus simple motion. |
| `high` | Heavy planning, generation, render, provider, or worker tendency. | Multi-scene 3D explainer. |
| `premium` | User-visible premium or high-value optional item. | Real Motion or optional hero 3D reveal. |
| `variable` | Depends on duration, source count, provider choice, asset count, or revision depth. | B-roll replacement set with unclear source count. |
| `unknown_needs_estimate` | Cannot estimate honestly until missing context is resolved. | Future generated music without rights/provider choice. |

## Credit Estimate Readiness Model

`estimate_readiness` determines whether user-facing estimate copy can be drafted.

| Value | Meaning | Next action |
| --- | --- | --- |
| `not_ready` | Credit planning has not received enough route data. | Wait for route assembly. |
| `missing_skill_routes` | No route bundle exists. | Return to RP-SKILLS-17. |
| `missing_required_plan_records` | A route lacks required timing/source/composition/audio/QA records. | Complete the missing planning contract. |
| `missing_StoryTiming` | Timing/focus/collision state is needed before estimating. | Resolve StoryTiming coordination. |
| `missing_source_confirmation` | Source, proof, rights, or redaction status is unclear. | Ask user or confirm source truth. |
| `missing_user_input` | Approval or credit sensitivity decision is needed. | Ask a concise user question. |
| `ready_for_rough_estimate` | Enough context exists for internal planning range. | Draft estimate metadata, not final approval copy. |
| `ready_for_user_estimate` | Enough context exists for user-facing estimate copy. | Create approval group/copy planning records. |
| `ready_for_revision_estimate` | Revision context is clear enough to estimate change impact. | Create revision credit impact planning. |
| `blocked` | Credit planning must not proceed. | Record blocker and do not estimate. |

## SkillCreditEstimateItem

Documentation-only pseudo-record for a single route-linked credit estimate item.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable planning ID. | `skill_credit_item_hero_3d_001` |
| `project_id` | Required | Project or workspace context. | `project_launch_demo` |
| `edit_plan_id` | Required | Draft edit plan being estimated. | `edit_plan_v4` |
| `route_id` | Required when route-scoped | Route from `EditPlanSkillRoute`. | `skill_route_3d_hero_001` |
| `route_bundle_id` | Required | Route bundle from `EditPlanSkillRouteBundle`. | `route_bundle_v4` |
| `skill_key` | Required | Canonical skill key from taxonomy. | `three_d_product_breakout` |
| `skill_family` | Required | Canonical skill family. | `three_d_visual` |
| `label` | Required | Internal short label. | `Optional 3D product breakout` |
| `user_visible_description` | Required | Plain user-facing description. | `Add a short 3D product reveal over the hero claim.` |
| `estimate_category` | Required | Category from the estimate category model. | `three_d_visual` |
| `credit_impact` | Required | Expected impact from credit impact model. | `premium` |
| `estimated_credit_min` | Optional | Lower bound when allowed by future policy. | `35` |
| `estimated_credit_max` | Optional | Upper bound when allowed by future policy. | `60` |
| `estimated_credit_display` | Required when user-facing | Human-readable estimate copy. | `About 35-60 credits, pending final provider estimate.` |
| `estimate_confidence` | Required | Confidence from estimate confidence model. | `medium` |
| `required_or_optional` | Required | Status from required versus optional model. | `optional_premium` |
| `premium_optional` | Required | Whether this item is optional premium work. | `true` |
| `can_remove_to_lower_cost` | Required | Whether it can be removed or replaced. | `true` |
| `lower_cost_alternative_route_ids` | Optional | Linked lower-cost alternatives. | `skill_route_graphic_card_001` |
| `approval_group_id` | Required when approval needed | Related approval group. | `approval_group_premium_visuals_001` |
| `estimate_reason` | Required | Why the item may affect credits. | `3D provider or render work may be needed.` |
| `source_or_proof_notes` | Required when relevant | Rights, evidence, redaction, or provenance notes. | `No source proof claims; generated object must be labeled if future generation is used.` |
| `generated_or_runtime_future_notes` | Required when relevant | Future runtime boundary notes. | `No model generation occurs in planning.` |
| `QA_notes` | Required | QA checks tied to the estimate. | `Verify approval, caption safety, and no unapproved provider call.` |
| `status` | Required | Planning status. | `draft_estimate_item` |
| `metadata_json` | Optional | Future metadata placeholder; not schema. | `{ "source_doc": "RP-SKILLS-18" }` |

## Estimate Category Model

`estimate_category` groups estimate items for user clarity and future reconciliation.

| Value | Meaning |
| --- | --- |
| `planning_and_analysis` | Planning, analysis, review, or future intelligence work. |
| `clean_editing` | Non-premium edit assembly, cutting, pacing, cleanup, or timing work. |
| `captions` | Caption planning or caption rendering in future runtime. |
| `transitions` | Transition design or future transition render/provider work. |
| `B_roll` | Source, generated, stock, browser/app, or inset B-roll planning. |
| `graphic_design` | VisualExplain, proof cards, charts, callouts, or graphic systems. |
| `motion_design` | Animated graphic/overlay movement, kinetic typography, or reveal behavior. |
| `three_d_visual` | 3D explainers, product breakouts, hero reveals, or 3D overlays. |
| `Stroke_Motion` | Stroke Motion planning or future execution. |
| `Real_Motion` | Real Motion planning or future execution. |
| `SoundSync_music` | Music, cueing, ducking, or SoundSync planning. |
| `SFX` | Sound effects, impacts, transitions, ambience, or room tone. |
| `browser_app_visuals` | Browser/app visuals, screen interactions, or capture-derived visuals. |
| `source_safety_redaction` | Source proof, evidence safety, privacy, redaction, rights, or claim review. |
| `QA` | QA, validation, audit, or review work. |
| `render_preview` | Future preview render costs. |
| `export_package` | Future export/package costs. |
| `revision` | Revision-specific cost impact. |
| `generated_asset_future` | Future generated visual/audio/text asset work. |
| `provider_cost_unknown_future` | Future provider cost not knowable yet. |
| `no_credit_impact` | Explicit no-credit item for transparency. |

## Estimate Confidence Model

| Value | Meaning | Example |
| --- | --- | --- |
| `high` | Source, route, scope, and policy are known. | Basic captions on a known 45-second clip. |
| `medium` | Scope is mostly known with minor variation. | Optional graphic card count may vary by one or two. |
| `low` | Scope depends on user choice or unclear route detail. | B-roll source count not finalized. |
| `unknown_needs_provider_or_worker_estimate` | Future provider/worker estimate is required. | Generated music or 3D provider cost unknown. |
| `blocked_until_user_input` | User decision is needed first. | User must pick premium 3D or lower-cost graphic. |
| `blocked_until_source_confirmation` | Source/proof/rights confirmation is needed. | Proof card references unconfirmed client metrics. |

## Required Versus Optional Model

| Value | Meaning | Approval behavior |
| --- | --- | --- |
| `required_for_requested_edit` | Needed to deliver what the user explicitly requested. | Include in required estimate and approval group when credit-bearing. |
| `recommended` | Professional recommendation but not essential. | User may approve or remove. |
| `optional` | Nice-to-have, lower risk, non-premium. | Can be presented as optional. |
| `optional_premium` | Premium creative route, provider work, generated asset, Real Motion, 3D, or high-cost item. | Must be itemized and approval-gated. |
| `lower_cost_alternative` | Cheaper route that preserves the intent. | Present next to premium option. |
| `user_requested_premium` | User explicitly requested premium work. | Still requires clear credit estimate and approval. |
| `blocked_not_estimated` | Cannot estimate safely. | Do not ask for approval until blocker is resolved. |
| `removed_to_lower_cost` | Replaced by a cheaper route. | Preserve audit trail and revision note. |
| `no_credit_item` | No credit item should be created beyond transparency. | Use only when clarity is useful. |

## Lower-cost Alternative Estimate Model

Every optional premium item should either provide a lower-cost alternative or explain why no honest alternative exists.

## SkillCreditLowerCostAlternative

Documentation-only pseudo-record for a lower-cost alternative connected to a premium estimate item.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable planning ID. | `lower_cost_alt_3d_to_graphic_001` |
| `project_id` | Required | Project context. | `project_launch_demo` |
| `edit_plan_id` | Required | Draft edit plan. | `edit_plan_v4` |
| `premium_estimate_item_id` | Required | Premium item being replaced or reduced. | `skill_credit_item_hero_3d_001` |
| `alternative_route_id` | Required | Route that provides the alternative. | `skill_route_graphic_card_001` |
| `alternative_estimate_item_id` | Optional | Estimate item for the alternative if one exists. | `skill_credit_item_graphic_card_001` |
| `alternative_label` | Required | Short label. | `Animated proof card instead of 3D breakout` |
| `creative_tradeoff` | Required | What the user gives up. | `Less spatial wow factor, but still clarifies the product benefit.` |
| `estimated_credit_reduction_summary` | Required | User-facing estimate reduction. | `Likely much lower than generated 3D; exact credits remain future policy.` |
| `quality_impact` | Required | Expected creative/quality effect. | `Lower visual spectacle, similar comprehension.` |
| `recommended_when` | Required | When to choose the alternative. | `Use when credit sensitivity is high or turnaround matters.` |
| `user_visible_copy` | Required | Approval-screen copy. | `Keep the idea, skip the premium 3D, and use a clean animated card.` |
| `status` | Required | Planning state. | `available_for_user_choice` |
| `metadata_json` | Optional | Future metadata placeholder; not schema. | `{ "source": "RP-SKILLS-18" }` |

## Approval Group Model

Approval groups collect related estimate items so the user does not approve a confusing pile of separate charges. Grouping should respect route bundles, StoryTiming windows, source/proof safety, and premium optional choices.

Approval group types:

| Type | Use |
| --- | --- |
| `required_edit_approval` | Core edit work the user requested. |
| `optional_premium_visuals` | 3D, Real Motion, generated B-roll, premium motion, or other premium visual routes. |
| `optional_premium_audio` | Generated music, premium SFX, or advanced SoundSync. |
| `source_sensitive_evidence` | Proof cards, browser/app visuals, claim overlays, or redaction-sensitive work. |
| `revision_credit_change` | Revision that changes credit impact. |
| `export_or_render_package` | Future preview, render, or export cost. |
| `mixed_bundle` | Small related items that should be understood together. |

The approval group/status/copy model is split across `SkillApprovalGroup`, the approval status model, and `SkillApprovalCopy` so future work can review group scope, state, and user-facing language separately.

## SkillApprovalGroup

Documentation-only pseudo-record for user approval grouping.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable approval group ID. | `approval_group_premium_visuals_001` |
| `project_id` | Required | Project context. | `project_launch_demo` |
| `edit_plan_id` | Required | Draft edit plan. | `edit_plan_v4` |
| `approval_group_type` | Required | Group model type. | `optional_premium_visuals` |
| `title` | Required | User-facing group title. | `Optional premium 3D visual` |
| `user_visible_summary` | Required | Clear summary of what the user is approving. | `Approve a short 3D product reveal, or choose the lower-cost animated proof card.` |
| `linked_route_ids` | Required | Routes covered by the group. | `skill_route_3d_hero_001` |
| `linked_estimate_item_ids` | Required | Estimate items covered by the group. | `skill_credit_item_hero_3d_001` |
| `required` | Required | Whether approval is required to fulfill the requested edit. | `false` |
| `optional` | Required | Whether user can skip the group. | `true` |
| `premium` | Required | Whether it contains premium work. | `true` |
| `approval_reason` | Required | Why approval is needed. | `Premium generated 3D must be explicitly approved before any future generation.` |
| `user_options` | Required | Allowed choices. | `approve_3d, choose_lower_cost_graphic, remove_optional_visual` |
| `lower_cost_options` | Optional | Linked lower-cost choices. | `lower_cost_alt_3d_to_graphic_001` |
| `source_or_proof_notes` | Required when relevant | Source, rights, evidence, or redaction notes. | `No exact product claim is invented; source proof must be confirmed if metrics appear.` |
| `credit_summary` | Required | Human-readable credit summary. | `Premium visual item, estimated separately from required clean edit.` |
| `approval_status` | Required | Status from approval status model. | `draft` |
| `approval_required_before` | Required | Gate before future runtime action. | `provider_call_or_worker_job` |
| `created_from_chat_message_id` | Optional | User message trace. | `chat_msg_842` |
| `status` | Required | Planning status. | `draft_approval_group` |
| `metadata_json` | Optional | Future metadata placeholder; not schema. | `{ "docs_only": true }` |

## Approval Status Model

| Value | Meaning |
| --- | --- |
| `not_required` | No explicit user approval is needed beyond normal plan acceptance. |
| `draft` | Approval copy is being planned. |
| `awaiting_user_review` | Future UI could show this to the user. |
| `approved` | Future user approval has been captured. This docs-only contract never sets it. |
| `rejected` | User rejected the item. |
| `changes_requested` | User wants edits before approval. |
| `partially_approved` | Some grouped items are approved and others are not. |
| `removed_to_lower_cost` | User chose a lower-cost alternative. |
| `expired` | Estimate or approval became stale. |
| `superseded` | A newer plan or revision replaced it. |
| `cancelled` | The route or plan was cancelled. |

## Approval Copy Model

Approval copy must be calm, specific, and honest. It must not pressure the user into premium work or imply that execution has started.

## SkillApprovalCopy

Documentation-only pseudo-record for future approval-card copy.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable copy ID. | `approval_copy_premium_3d_001` |
| `approval_group_id` | Required | Related approval group. | `approval_group_premium_visuals_001` |
| `headline` | Required | Short user-facing headline. | `Optional premium 3D reveal` |
| `summary` | Required | What will be planned if approved. | `A short 3D product reveal can add polish to the opening claim.` |
| `why_it_matters` | Required | Creative reason. | `It helps viewers understand the product shape before the demo starts.` |
| `credit_copy` | Required | Credit estimate wording. | `This is a premium item and may use additional credits if executed later.` |
| `optionality_copy` | Required | Required/optional explanation. | `The edit works without it.` |
| `lower_cost_copy` | Required when available | Lower-cost alternative copy. | `Use an animated proof card for a lower-cost version of the same idea.` |
| `source_safety_copy` | Required when relevant | Source/proof/rights copy. | `No exact metrics or UI details will be invented.` |
| `approval_button_copy` | Required | Future approve label. | `Approve premium 3D` |
| `decline_button_copy` | Required | Future decline label. | `Skip premium 3D` |
| `change_request_copy` | Optional | Future change request label. | `Show me a lower-cost version` |
| `status` | Required | Copy state. | `draft` |
| `metadata_json` | Optional | Future metadata placeholder; not schema. | `{ "source": "RP-SKILLS-18" }` |

## SkillCreditEstimateSummary

Documentation-only pseudo-record for a grouped edit-plan estimate summary.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable summary ID. | `skill_credit_summary_edit_plan_v4` |
| `project_id` | Required | Project context. | `project_launch_demo` |
| `edit_plan_id` | Required | Draft edit plan. | `edit_plan_v4` |
| `estimate_status` | Required | Summary status. | `draft` |
| `estimate_readiness` | Required | Readiness model value. | `ready_for_user_estimate` |
| `total_estimated_credit_min` | Optional | Future minimum estimate. | `80` |
| `total_estimated_credit_max` | Optional | Future maximum estimate. | `125` |
| `total_estimated_credit_display` | Required when user-facing | Human-readable range. | `Estimated 80-125 credits if all approved items are included.` |
| `required_credit_estimate` | Required | Required portion summary. | `Required clean edit and captions are the base estimate.` |
| `optional_premium_credit_estimate` | Required | Optional premium summary. | `3D and generated music are optional premium items.` |
| `lower_cost_possible_credit_estimate` | Required | Lower-cost summary. | `Choosing graphic cards and library music should reduce the estimate.` |
| `estimate_item_ids` | Required | All item IDs. | `skill_credit_item_base_001, skill_credit_item_hero_3d_001` |
| `approval_group_ids` | Required | Related approval groups. | `approval_group_required_edit_001, approval_group_premium_visuals_001` |
| `removed_or_rejected_item_ids` | Optional | Items removed from current summary. | `skill_credit_item_generated_music_001` |
| `estimate_confidence` | Required | Overall estimate confidence. | `medium` |
| `estimate_expires_at_future` | Optional | Future expiration placeholder. | `future_runtime_policy` |
| `user_visible_summary` | Required | Plain user summary. | `The required edit can proceed as a base plan; premium visuals need separate approval.` |
| `status` | Required | Planning state. | `draft_estimate_summary` |
| `metadata_json` | Optional | Future metadata placeholder; not schema. | `{ "docs_only": true }` |

## Reservation Boundary

Credit planning may describe where a future reservation gate belongs, but it must not reserve credits.

Boundary rules:

- `SkillCreditEstimateItem` is not a reservation.
- `SkillCreditEstimateSummary` is not a wallet update.
- `SkillApprovalGroup` is not an approval record.
- Future reservation can only happen after the user approves the relevant estimate and a backend credit runtime verifies the wallet/ledger state.
- Future spend/release/refund can only happen through backend-controlled ledger flows, not docs, frontend planning, prompts, providers, workers, or UI copy.
- A route can be "approval-ready" while still not "reservation-ready" if wallet, ledger, backend, or provider estimate context is missing.

## No-generation-before-approval Gates

No-generation-before-approval means planned premium or generated work must remain behind explicit user approval and future credit gates.

Gate-sensitive work includes:

- Generated B-roll.
- Generated 3D, model creation, or 3D provider work.
- Real Motion execution.
- Stroke Motion execution when premium or provider-backed.
- Generated music, Lyria-style music, custom music, or provider-backed music.
- Premium SFX or provider-backed audio.
- Browser/app capture that creates source-sensitive evidence visuals.
- Provider-rendered graphics or motion.
- Preview render/export when credit-bearing.
- Any work that consumes credits, calls a provider, uses a worker, creates a generated asset, or requires source proof approval.

Planning may say "approval required before future provider call." It must not say "provider call started."

## Skill Credit Grouping By Family

This is the skill-family credit behavior model. It is planning guidance only and does not set prices, spend credits, or create billing rules.

| Skill family | Common credit behavior | Approval guidance |
| --- | --- | --- |
| `clean_editing` | Often required base estimate. | Normal plan/credit approval. |
| `caption` | Low to medium unless advanced styling, translation, or rendering is credit-bearing. | Approval if credit-bearing or user requested no captions. |
| `transition` | Low to medium unless provider/render-heavy. | Approval if premium, frequent, or style-changing. |
| `overlay_compositing` | Low to high depending on tracking, masking, source safety, and render complexity. | Approval if proof-sensitive, premium, or generated. |
| `graphic_design` | Medium for custom proof cards, diagrams, and chart systems. | Approval for source claims, premium graphics, or generated assets. |
| `motion_design` | Medium to high depending on animation complexity and render demands. | Approval for premium motion, high density, or provider work. |
| `three_d_visual` | Often high or premium. | Explicit approval and lower-cost alternative expected. |
| `B_roll` | Variable based on uploaded, stock, generated, browser/app, or 3D source. | Approval for generated/source-sensitive/premium B-roll. |
| `caption` | Low to medium; future translation can increase complexity. | Do not force captions if user opts out. |
| `SoundSync_music` | Variable, especially with generated music or licensing. | Approval for generated/custom/licensed music and credit-bearing mix work. |
| `SFX` | Low to high depending on cue count/provider use. | Approval for premium/provider SFX or dense SFX passes. |
| `StoryTiming` | Usually planning/coordination, not direct credit item unless future QA/runtime policy requires it. | Approval when it changes route cost or blocks work. |
| `approval_credit` | Planning only. | Never spend or reserve by itself. |
| `QA` | May be included in required estimate or future premium QA. | Approval if separate credit-bearing item. |
| `render_preview` | Future runtime cost. | Estimate and approve before render. |
| `export_package` | Future runtime cost. | Estimate and approve before export if credit-bearing. |

## Edit Preference And Credit Sensitivity

Credit sensitivity from `RP-SKILLS-12` must influence planning:

| Preference | Credit planning effect |
| --- | --- |
| `credit_sensitive` | Prefer required-only base estimate, include lower-cost alternatives, mark premium items optional. |
| `balanced` | Recommend valuable items and show cost/benefit clearly. |
| `premium_ok_if_valuable` | Include premium options when they clearly improve meaning or conversion. |
| `premium_preferred` | Still itemize and ask for approval; do not assume blanket approval. |
| `avoid_generated_assets` | Block generated visual/audio items unless the user later overrides. |
| `wow_factor_high` | Permit premium recommendations only when StoryTiming, source safety, and approval are clean. |
| `professional_restraint` | Prefer lower-cost or no-action alternatives when premium does not add meaning. |

Direct user instruction wins over inferred preference. "Keep this cheap" must down-rank optional premium routes even if the workflow might benefit from 3D or generated music.

## StoryTiming And Credit Planning

StoryTiming affects estimates because timing can change duration, density, route count, cue count, render complexity, and revision impact.

Credit planning must check:

- Whether a route has valid time windows.
- Whether a premium item is allowed in the StoryTiming density budget.
- Whether captions, speech, product, faces, proof cards, B-roll, and audio can safely coexist.
- Whether a route is blocked by unresolved conflict.
- Whether a revision changes timing enough to require a new estimate.
- Whether a lower-cost alternative preserves the same StoryTiming purpose.

If StoryTiming is missing or blocked, `estimate_readiness` should use `missing_StoryTiming` or `blocked`.

## Source/Proof Safety And Approval

Source/proof safety is a credit and approval concern because source-sensitive work may require user confirmation before planning becomes executable.

Approval copy must not invent:

- Exact websites.
- Dashboards.
- Metrics.
- Pricing.
- Product claims.
- UI labels.
- Evidence pages.
- Customer names.
- Rights status.
- Licensing status.
- Source provenance.

Source-sensitive approval is required when a route uses proof cards, evidence overlays, browser/app visuals, client metrics, pricing, product comparisons, customer clips, redacted content, generated replacement visuals, or any asset with unclear rights/provenance.

## Revision Credit Behavior

Revisions must explain whether a change is inside the prior approved scope or creates a new credit estimate/approval need.

Revision credit behavior values:

| Value | Meaning |
| --- | --- |
| `no_credit_change` | Revision fits within approved scope. |
| `credit_decrease` | User removes or simplifies credit-bearing work. |
| `credit_increase_requires_estimate` | New or expanded work needs a new estimate. |
| `premium_added_requires_approval` | New premium/generated/provider work is added. |
| `source_change_requires_confirmation` | Source/proof/rights change must be confirmed. |
| `timing_change_requires_reestimate` | Timing or duration changed enough to affect credits. |
| `blocked_until_user_choice` | User must pick between options. |

## SkillRevisionCreditImpact

Documentation-only pseudo-record for revision-related credit planning.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable revision credit ID. | `revision_credit_impact_001` |
| `project_id` | Required | Project context. | `project_launch_demo` |
| `edit_plan_id` | Required | Current edit plan. | `edit_plan_v5_revision` |
| `revision_request_id` | Required | User revision request. | `revision_remove_3d_001` |
| `affected_route_ids` | Required | Routes changed by the revision. | `skill_route_3d_hero_001` |
| `affected_estimate_item_ids` | Required | Credit items changed. | `skill_credit_item_hero_3d_001` |
| `revision_credit_behavior` | Required | Revision behavior value. | `credit_decrease` |
| `estimated_extra_credit_min` | Optional | Extra minimum if increased. | `0` |
| `estimated_extra_credit_max` | Optional | Extra maximum if increased. | `0` |
| `approval_required` | Required | Whether user approval is needed. | `false` |
| `reason` | Required | Explanation. | `Removing optional 3D lowers the estimate and does not require new premium approval.` |
| `status` | Required | Planning state. | `draft_revision_credit_note` |
| `metadata_json` | Optional | Future metadata placeholder; not schema. | `{ "source": "RP-SKILLS-18" }` |

## Audit And Event Notes

Future runtime should preserve an audit path, but this document does not create events.

Planning should prepare for future audit/event expectations:

- Route ID and route bundle ID traceability.
- User message or approval-card traceability.
- Estimate item creation reason.
- Estimate confidence and readiness reason.
- Approval group status changes.
- Lower-cost alternative selection.
- Premium item rejection.
- Revision credit impact.
- Source/proof confirmation.
- Reservation and spend boundaries.
- Refund/release policy handoff.

These are expectations for future backend and product work, not current implementation.

## QA For Credit And Approval Planning

Credit/approval QA must verify:

- Every credit-bearing item links to a route and skill key.
- Premium/generated/provider items have explicit approval behavior.
- Required items are not disguised as optional premium choices.
- Optional premium items do not block the base requested edit unless the user explicitly requested them.
- Lower-cost alternatives are offered for premium ideas when useful.
- Source/proof-sensitive work asks for confirmation before approval.
- StoryTiming blockers are reflected in readiness.
- Credit sensitivity preferences are honored.
- No copy implies reservation, spend, refund, provider call, worker execution, render, export, or billing has happened.
- Existing credit source truths are referenced rather than replaced.

## Examples

| Example | Route or bundle summary | Estimate items | Approval group | Required/optional status | Credit tendency | Lower-cost alternative | Approval copy summary | QA checks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Basic clean edit with captions and clean cuts | Clean edit route plus caption route. | `clean_editing`, `captions`. | Required edit approval. | `required_for_requested_edit`. | Low to medium. | None needed if user requested captions. | `Approve the base edit and caption estimate.` | Captions readable; no premium items hidden. |
| 2. Social short with keyword captions, beat-aware transition, and SoundSync | Caption emphasis, simple transitions, music cue timing. | `captions`, `transitions`, `SoundSync_music`. | Required edit plus optional audio if credit-bearing. | Required captions/transitions, optional SoundSync if premium. | Medium. | Simpler captions and cuts without SoundSync. | `Add beat-aware polish, or keep the simpler version.` | Speech protection and no auto-SFX. |
| 3. Premium real estate edit with source B-roll, subtle graphics, optional 3D blueprint | Source B-roll, proof labels, optional 3D floorplan. | `B_roll`, `graphic_design`, `three_d_visual`. | Premium visuals group. | B-roll required, 3D optional premium. | Medium to premium. | Static floorplan graphic. | `Approve optional 3D blueprint only if you want the premium version.` | Source rights and address redaction. |
| 4. Product demo with graphic callouts and optional 3D product breakout | Product screen demo with callouts and optional 3D. | `graphic_design`, `motion_design`, `three_d_visual`. | Optional premium visual group. | Graphics recommended, 3D optional premium. | Medium to premium. | Animated product callout card. | `Choose 3D breakout or a lower-cost animated card.` | No invented UI labels. |
| 5. Education explainer with diagram graphics, captions, low-distraction SoundSync | Diagram, captions, soft music. | `graphic_design`, `captions`, `SoundSync_music`. | Required edit with optional music. | Graphics/captions required, music optional. | Medium. | Silence or light room tone. | `Music is optional; clarity comes from captions and diagrams.` | Readability and speech ducking. |
| 6. Marketing ad with proof card, CTA graphic, optional hero 3D | Proof card and CTA, optional hero object. | `graphic_design`, `overlay_compositing`, `three_d_visual`. | Source-sensitive plus premium visual approval. | Proof card source-sensitive, 3D optional premium. | Medium to premium. | Static hero graphic. | `Confirm proof source before approval; 3D is optional.` | Claim verification and source safety. |
| 7. Testimonial/case study with source-sensitive proof/B-roll needing confirmation | Customer quote, proof card, client B-roll. | `B_roll`, `source_safety_redaction`, `graphic_design`. | Source-sensitive evidence group. | Blocked until source confirmation. | Variable. | Use nonspecific proof card or remove metric. | `Confirm this source before it appears on screen.` | Names, metrics, consent, redaction. |
| 8. 3D hero reveal optional premium with lower-cost graphic alternative | Premium 3D hero open. | `three_d_visual`. | Optional premium visuals. | `optional_premium`. | Premium. | Graphic hero card. | `Approve premium 3D or use a lower-cost graphic opener.` | StoryTiming focus and no provider call. |
| 9. Real Motion route explicit premium approval | Real Motion route for branded motion moment. | `Real_Motion`. | Optional premium visuals. | `user_requested_premium` or `optional_premium`. | Premium. | Motion design overlay. | `Real Motion needs separate approval before future execution.` | Real Motion owner boundary and credit gate. |
| 10. Generated music future premium/approval-gated with ambience-only alternative | Future generated music cue. | `SoundSync_music`, `generated_asset_future`. | Optional premium audio. | `optional_premium`. | Variable to premium. | Ambience/room tone or licensed library track if allowed. | `Generated/custom music needs approval and rights review.` | Lyrics policy, rights, no Lyria call. |
| 11. Revision request removes 3D to lower cost | Remove approved optional 3D route. | Revision credit note. | Revision credit change. | `removed_to_lower_cost`. | Credit decrease. | Already selected. | `Removing 3D should lower the estimate; no new premium approval needed.` | Preserve audit trail. |
| 12. Revision request adds generated B-roll requiring new estimate/approval | Add generated B-roll after initial approval. | `B_roll`, `generated_asset_future`, revision. | Revision credit change plus premium approval. | `premium_added_requires_approval`. | Variable to premium. | Use existing uploaded B-roll. | `Generated B-roll needs a new estimate before work starts.` | No generation before approval. |

## Anti-patterns

- Treating credit estimate planning as credit reservation.
- Treating approval copy as user approval.
- Starting generation because a route has a credit estimate.
- Creating one vague "AI magic" premium item with no route links.
- Hiding generated music, generated B-roll, 3D, Real Motion, or provider work inside required base edit.
- Offering no lower-cost alternative for an optional premium idea without explanation.
- Claiming exact credit numbers when provider/worker/runtime policy is unknown.
- Claiming credits were spent, refunded, or restored from docs-only planning.
- Asking the user to approve source proof that has not been checked.
- Inventing pricing, metrics, UI labels, rights, or source provenance.
- Ignoring direct user credit sensitivity.
- Ignoring StoryTiming blockers.
- Treating a subscription as unlimited AI generation.
- Creating new credit/billing schema before reconciling existing credit owners.

## Relationship To Existing credit_estimates / approval_records Direction

This contract must reference existing owners rather than replace them:

- `pricing-and-credits.md` defines product-level credit rules, estimate-before-generation, approval before credit deduction, lower-cost alternatives, refund/restore policy direction, and the mock-safe credit runtime layer.
- `credit-ledger-architecture.md` owns future wallet, append-only ledger, estimate, reservation, and ledger direction.
- `credit-runtime-approval-gate.md` owns current mock-safe gate behavior and states that expensive work requires edit plan approval, credit estimate approval, and credit reservation.
- `credit-reservation-spend-refund-flow.md` owns future reserve/spend/release/refund flow direction.
- Existing backend credit API routes, mock records, credit approval gate service, wallet types, job types, provider gates, render gates, and planner validation already mention credit and approval runtime boundaries.
- Existing `credit_estimates`, `credit_reservations`, `approval_records`, wallets, ledgers, billing, Stripe, and approval gate direction are runtime/data concerns. `RP-SKILLS-18` only defines a docs-only skill planning layer that can eventually map into those owners.

Future implementation must reconcile names and data shape with those owners before adding TypeScript, SQL, migrations, storage, billing logic, or runtime gates.

## Duplicate And Overlap Notes

Do not duplicate:

- `pricing-and-credits.md` product credit rules.
- Credit ledger, wallet, reservation, spend, release, refund, billing, and Stripe architecture.
- Existing credit approval gate service behavior.
- Existing mock credit estimate, reservation, and approval records.
- Planner validation approval/credit warnings.
- Job/provider/render gates that already check approved snapshot and credit reservation requirements.
- `RP-SKILLS-17` route assembly.
- `RP-SKILLS-16` resolver decisions.
- `RP-SKILLS-12` edit preference credit sensitivity.
- `RP-SKILLS-11` StoryTiming coordination.
- Source/proof safety rules in prior contracts.
- QA and audit owners.

## Missing-file Notes

Current repo inspection found:

- `pricing-and-credits.md` exists.
- `audio-library-and-licensing.md` exists.
- `soundsync-music-intelligence.md` is missing.
- `music-reference-dna.md` is missing.
- `lyria-music-generation-plan.md` is missing.

Sound/music credit and approval planning must reference existing audio owners and `audio-library-and-licensing.md`; it must not pretend the missing root docs exist.

## Future Implementation Notes

A future implementation prompt must still be approval-gated and source-truth-first. Before implementing TypeScript, SQL, runtime, or UI:

- Reconcile this docs-only contract with `pricing-and-credits.md`, `credit-ledger-architecture.md`, `credit-runtime-approval-gate.md`, `credit-reservation-spend-refund-flow.md`, existing credit types, backend services, mock records, and planner validation.
- Decide whether skill-level estimate items map into existing `credit_estimates` metadata, a future detail table, or approval record metadata.
- Define backend-only reservation, spend, release, and refund behavior before any real credit mutation.
- Define approval UI and copy separately from this docs-only planning contract.
- Preserve no-generation-before-approval gates for providers, workers, render/export, generated assets, browser/app capture, audio/music/SFX generation, caption rendering, 3D, and Real Motion.

## RP-SKILLS-19 Handoff

Recommended next prompt:

`RP-SKILLS-19 - Skill QA and Validation Contract`

Scope:

Docs-only Skill QA and Validation contract that defines how future skill routes, plan-record attachments, credit estimate items, approval groups, source/proof safety notes, StoryTiming readiness, lower-cost alternatives, revision credit notes, and user-visible summaries are validated before any future execution path.

Forbidden scope for `RP-SKILLS-19` unless explicitly authorized later:

- Supabase migrations or SQL.
- Runtime code.
- TypeScript implementation.
- React UI.
- Provider calls.
- Workers, jobs, leases, render, export, or runtime gates.
- Package installs or package file mutations.
- Credit runtime, billing, Stripe, wallet, ledger, reservation, approval runtime, skill route runtime, plan assembly runtime, resolver runtime, catalog runtime, concept generator runtime, visual analysis, opportunity detector, preference runtime, orchestration, media/audio/caption/browser/WebGL/canvas/3D/generation runtime, prompt router changes, Playwright execution, animation code, design-token changes, or app behavior.
