# Skill Candidate Scoring And Resolver Contract

## Purpose

This document defines the future Skill Candidate Scoring and Resolver contract for ReeditPro Creative Skill planning.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, skill resolver runtime, scoring runtime, skill route runtime, skill catalog runtime, concept generator runtime, package changes, Supabase connections, SQL, credentials, or app behavior.

The contract defines how future planners map selected creative concepts to skill candidates and skill route decisions. It does not execute skills. It does not create generation requests. It does not select tools, providers, workers, or render jobs.

Skill Candidate Scoring and Resolver hands off resolved skill candidates to future skill route and plan assembly contracts. Detailed skill planning contracts, StoryTiming coordination, credit estimates, approval, and execution all happen later.

Core boundary: resolver output is not execution.

## Skill Resolver Doctrine

The resolver maps creative intent to skill capability.

It should not pick tools first. It should not execute skills. It should not force preferred skills everywhere. It should not ignore blocked skills. It should not route premium skills without credit and approval awareness. It should not skip planning contracts.

The resolver should produce selected, recommended, optional, rejected, blocked, lower-cost, restraint, and needs-user-input skill candidates with reasons.

A `no_*` skill can be a valid professional resolver output. A skill can be selected only if it can be planned.

Core principle:

"Concepts describe the idea; resolver decisions decide which skills are allowed to express it."

## Position In Planning Flow

Skill Candidate Scoring and Resolver sits after creative concept selection and before route assembly.

1. User intent and edit preference are collected.
2. Source sequence and media context are understood.
3. Visual Opportunity Engine detects opportunities.
4. Creative Concept Ideation generates and selects concepts.
5. Skill Candidate Scoring / Resolver maps concepts to skill candidates.
6. Skill route decisions are previewed.
7. Skill planning contracts are instantiated later.
8. StoryTiming readiness and conflicts are checked.
9. Credit estimate and approval happen later.
10. Execution happens only after approval later.

Resolver happens after concept selection. Resolver happens before detailed skill planning records. Resolver does not bypass approval. Resolver does not select runtime tools, providers, workers, render jobs, or generator calls.

## Required Input Context

| Input | Why it matters |
| --- | --- |
| `project_id` | Keeps candidates scoped to the current project. |
| `edit_plan_id` | Connects candidates to the active draft or approved edit plan. |
| `visual_opportunity_ids` | Preserves the opportunity trail behind each candidate. |
| `selected_creative_concept_ids` | Ensures resolver starts from selected concepts, not raw effects. |
| `rejected_creative_concept_ids` | Prevents rejected ideas from reappearing without reason. |
| `concept_type` | Shapes likely families and restraint posture. |
| `concept_summary` | Explains the creative idea the skill should express. |
| `possible_skill_families` | Carries candidate families from concept ideation. |
| `possible_skill_keys` | Carries candidate keys that must be canonicalized. |
| `canonical_skill_taxonomy` | Ensures RP-SKILLS-13 family/key vocabulary is used. |
| `skill_alias_map` | Resolves aliases before scoring. |
| `edit_preference_snapshot` | Applies preference, restraint, density, wow target, and credit sensitivity. |
| `preferred_skill_keys` | Adds scoring influence without forcing selection. |
| `blocked_skill_keys` | Produces blocked candidates with reasons unless explicitly overridden. |
| `workflow_context` | Shapes professional expectations for education, product, social, property, testimonial, and clean edits. |
| `platform` | Guides pacing, safe zones, caption density, and viewer expectations. |
| `aspect_ratio` | Affects screen zones, collisions, and route feasibility. |
| `reference_DNA` | Provides safe influence; it must not become copying. |
| `credit_preference` | Pushes lower-cost alternatives and premium optional treatment. |
| `source_proof_status` | Blocks unsupported proof, browser, dashboard, metric, testimonial, or source-sensitive routes. |
| `StoryTiming_density_budget_if_available` | Flags whether a candidate can fit without overloading focus. |
| `prior_skill_usage_repetition_state` | Prevents repeated tricks and supports deliberate motifs. |
| `user_must_follow_rules` | Overrides scoring when a direct instruction is non-negotiable. |
| `user_avoid_rules` | Reduces, rejects, or blocks candidates that violate avoid rules. |
| `approval_credit_constraints` | Marks premium or generated paths for later approval and estimates. |
| `runtime_readiness_notes_if_known` | Records planning-only feasibility without unlocking runtime work. |

## Candidate Mapping Model

Mapping rules:

- Candidate skill families and keys must be canonical from RP-SKILLS-13.
- Aliases must resolve before candidate scoring.
- One selected concept can create multiple skill candidates.
- A multi-skill concept can create a skill bundle.
- A concept may map to `no_*` restraint skills.
- A blocked skill should produce a blocked candidate, not disappear silently.
- A premium concept should produce optional premium candidates and lower-cost alternatives.
- A source-sensitive concept should carry source/proof gating into candidate scoring.
- A skill candidate is not a route until scored and decided.
- A scored candidate is not execution.

## Skill Candidate Type Family

| Candidate type | What it means | When to use | Example |
| --- | --- | --- | --- |
| `primary_skill_candidate` | Main capability that expresses the concept. | One skill carries the concept. | `graphic_design_visual_explain` for a framework card. |
| `support_skill_candidate` | Supporting skill needed by the primary skill. | Main skill needs placement, motion, audio, or QA support. | `motion_design_overlay` supporting a proof card. |
| `optional_premium_candidate` | Strong but heavy or credit-sensitive option. | Premium 3D, Real Motion, generated assets, or custom sound may help. | `three_d_product_feature_breakout`. |
| `lower_cost_alternative_candidate` | Cheaper way to serve the same idea. | Premium candidate is optional or budget-sensitive. | `graphic_design_visual_explain` instead of 3D. |
| `no_action_candidate` | Doing nothing is the professional choice. | Extra visual/audio would weaken the moment. | `no_b_roll` for an emotional pause. |
| `restraint_candidate` | Explicit restraint skill. | User preference, StoryTiming, tone, or source safety says reduce. | `no_music`. |
| `required_candidate` | Skill required to satisfy the user goal or safety. | Rare, must be justified. | `caption_accessibility_planning` for required accessible captions. |
| `blocked_candidate` | Skill is blocked by user, preference, source, budget, policy, or readiness. | Candidate should remain visible with reason. | `caption_design` when user blocks captions. |
| `rejected_candidate` | Skill considered but not chosen. | It is not useful, too dense, too risky, or redundant. | Reject 3D for a minor sentence. |
| `needs_user_input_candidate` | Resolver cannot decide safely without user input. | Missing source, metric, brand, premium, or preference answer. | Ask before proof card uses a claimed metric. |
| `source_confirmation_candidate` | Source status blocks confident routing. | Browser/app/proof/testimonial/source visuals are uncertain. | `browser_annotation_design` needs real screenshot status. |
| `StoryTiming_dependent_candidate` | Candidate may work only if timing/focus allows. | Candidate has visual/audio/text footprint. | Multi-skill hero needs StoryTiming coordination. |
| `QA_sensitive_candidate` | Candidate is fragile enough to need specific QA. | Face, caption, proof, source, speech, or credit risk is high. | Real Motion near a face. |

## Skill Candidate Status Model

| Status | Meaning |
| --- | --- |
| `generated` | Candidate was proposed from a selected concept. |
| `candidate` | Candidate is eligible for scoring. |
| `scored` | Candidate has a score review. |
| `selected` | Candidate is selected for future route assembly. |
| `recommended` | Candidate is recommended but not strictly required. |
| `optional` | Candidate is allowed but not needed. |
| `required` | Candidate is required by user goal, safety, accessibility, or plan integrity. |
| `rejected` | Candidate should not be used for this concept. |
| `blocked_by_user` | Direct user instruction blocks the skill. |
| `blocked_by_preference` | Resolved preference blocks the skill. |
| `blocked_by_budget` | Credit/cost posture blocks or downgrades the skill. |
| `blocked_by_source_status` | Source/proof status is not safe enough. |
| `blocked_by_policy` | Safety, legality, or platform policy blocks the skill. |
| `blocked_by_runtime_readiness` | Current runtime readiness is insufficient for this candidate. |
| `needs_user_input` | Resolver needs clarification before selection. |
| `needs_approval` | Candidate requires later approval before execution. |
| `lower_cost_alternative` | Candidate is an alternative to a heavier option. |
| `superseded` | A better candidate or bundle replaced it. |
| `archived` | Candidate is retained for history but not active. |

## Documentation-only Pseudo-record: SkillCandidate

`SkillCandidate` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable candidate identifier. | `skill_candidate_001` |
| `project_id` | Required | Owning project. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan that owns this candidate. | `edit_plan_v4` |
| `visual_opportunity_id` | Required | Opportunity that led to the concept. | `opportunity_feature_reveal` |
| `creative_concept_id` | Required | Selected creative concept being resolved. | `concept_product_feature_card` |
| `skill_key` | Required | Canonical RP-SKILLS-13 skill key. | `graphic_design_visual_explain` |
| `skill_family` | Required | Canonical skill family. | `graphic_design` |
| `candidate_type` | Required | Candidate type family. | `primary_skill_candidate` |
| `candidate_status` | Required | Candidate status. | `scored` |
| `candidate_reason` | Required | Why this skill is being considered. | `The concept needs a structured feature card.` |
| `concept_fit_summary` | Required | How the skill fits the concept. | `Graphic design expresses the product feature without 3D cost.` |
| `planning_contract_type` | Required | Primary planning contract to instantiate later. | `graphic_design_planning_contract` |
| `secondary_planning_contracts` | Optional | Supporting contracts likely needed. | `overlay_compositing_planning_contract, motion_design_planning_contract` |
| `recommendation_level` | Required | Recommendation level after scoring. | `recommended` |
| `edit_preference_fit` | Required | Preference alignment summary. | `Matches low-credit, medium-density preference.` |
| `workflow_fit` | Required | Workflow fit summary. | `Product demo benefits from clear feature explanation.` |
| `platform_fit` | Required | Platform fit summary. | `Works in 9:16 with lower-third safe zone.` |
| `StoryTiming_fit` | Required | StoryTiming fit summary. | `Needs a two-second focus window after feature phrase.` |
| `source_safety_fit` | Required | Source/proof safety summary. | `No metric shown; source-safe wording only.` |
| `credit_fit` | Required | Credit posture fit summary. | `Lower-cost alternative to 3D.` |
| `approval_tendency` | Required | Later approval expectation. | `approval_if_user_visible` |
| `credit_tendency` | Required | Expected credit tendency. | `medium` |
| `premium_optional` | Required | Whether this is optional premium. | `false` |
| `lower_cost_alternative_skill_keys` | Optional | Lower-cost alternatives if this is heavy. | `graphic_design_visual_explain` |
| `conflicts_with_skill_keys` | Optional | Skills this candidate may conflict with. | `caption_keyword_emphasis` |
| `supports_skill_keys` | Optional | Skills this candidate supports. | `proof_card_design` |
| `required_with_skill_keys` | Optional | Skills required with this candidate. | `safe_zone_layout` |
| `blocked_by_skill_keys` | Optional | Skills that block this candidate. | `no_graphic_design` |
| `user_preference_notes` | Required | Preference notes and conflicts. | `User prefers graphics; no direct blocks.` |
| `source_or_proof_notes` | Required | Source/proof status notes. | `Avoid exact claims unless user confirms source.` |
| `QA_notes` | Required | QA needs. | `Check caption collision and proof wording.` |
| `score_summary` | Required | Human-readable scoring summary. | `Strong concept fit, low source risk, medium density risk.` |
| `status` | Required | General record status. | `active` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Documentation-only Pseudo-record: SkillCandidateBundle

`SkillCandidateBundle` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, resolver logic, route assembly logic, catalog storage, worker spec, provider instruction, or UI.

Some concepts require multiple skills. A bundle does not execute anything. A bundle needs StoryTiming coordination before route assembly.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable bundle identifier. | `skill_bundle_hero_001` |
| `project_id` | Required | Owning project. | `project_launch_demo` |
| `edit_plan_id` | Required | Owning edit plan. | `edit_plan_v4` |
| `creative_concept_id` | Required | Concept this bundle resolves. | `concept_hero_feature_reveal` |
| `bundle_title` | Required | Human-readable bundle title. | `Feature Hero Reveal` |
| `bundle_summary` | Required | Bundle intent. | `Graphic hero card with subtle motion and speech-safe music lift.` |
| `primary_skill_candidate_id` | Required | Main skill candidate. | `skill_candidate_graphic_card` |
| `support_skill_candidate_ids` | Optional | Supporting candidates. | `skill_candidate_motion, skill_candidate_music_ducking` |
| `optional_skill_candidate_ids` | Optional | Optional candidates. | `skill_candidate_3d_breakout` |
| `lower_cost_alternative_bundle_id` | Optional | Cheaper bundle alternative. | `skill_bundle_graphic_only` |
| `StoryTiming_requirements` | Required | Timing/focus needs. | `Needs single primary focus and reduced captions for 3 seconds.` |
| `credit_tendency` | Required | Expected credit tendency. | `medium` |
| `approval_required` | Required | Whether approval is expected later. | `true` |
| `bundle_risk_notes` | Required | Risk notes. | `Could collide with captions and overfill hero beat.` |
| `QA_notes` | Required | Bundle QA notes. | `Check density, speech, source wording, and credit hint.` |
| `status` | Required | Bundle status. | `active` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Recommendation Level Model

| Level | Meaning | When to use | Approval/credit notes | Example |
| --- | --- | --- | --- | --- |
| `required` | Skill is necessary for the plan. | User goal, safety, accessibility, or source clarity requires it. | Still may need approval if user-visible or credit-bearing. | Required caption accessibility plan. |
| `recommended` | Best balanced option. | Strong concept fit and safe cost/density. | Approval depends on visibility and cost. | Graphic feature card. |
| `optional` | Useful but not needed. | Adds polish but concept works without it. | Keep out of required route. | Gentle motion support. |
| `optional_premium` | Strong heavy option. | 3D, Real Motion, generated media, or custom sound may enhance. | Requires credit/approval hint and lower-cost alternative. | 3D product breakout. |
| `lower_cost_alternative` | Safer or cheaper substitute. | Premium candidate is too costly or optional. | Prefer when credit sensitivity is high. | Graphic card instead of 3D. |
| `not_useful` | Candidate does not help enough. | Concept fit is weak. | No approval needed. | SFX for a quiet testimonial. |
| `rejected` | Candidate should not be used. | It conflicts, repeats, distracts, or fails safety. | Record reason. | Reject B-roll over emotional pause. |
| `blocked` | Candidate is blocked. | User, preference, budget, source, policy, or readiness blocks it. | Record blocker. | Captions blocked by user. |
| `do_not_use` | Professional restraint decision. | Skill would cheapen, clutter, or mislead. | No spend. | No transition on serious pause. |
| `needs_user_input` | Cannot decide safely. | Missing source, metric, premium, preference, or permission. | Ask before route assembly. | Confirm proof metric source. |

Required should be rare. Optional premium should be common for heavy 3D, Real Motion, generated content, and custom sound. Lower-cost alternatives should be explicit for heavy optional candidates. Blocked candidates should retain a reason. `do_not_use` is a professional restraint decision.

## Core Scoring Dimensions

Positive dimensions:

- `concept_fit_score`
- `meaning_support_score`
- `viewer_benefit_score`
- `edit_preference_fit_score`
- `workflow_fit_score`
- `platform_fit_score`
- `StoryTiming_fit_score`
- `source_safety_score`
- `novelty_score`
- `professional_taste_score`
- `feasibility_score`
- `credit_fit_score`
- `approval_fit_score`
- `lower_cost_alternative_strength`

Negative/risk dimensions:

- `user_blocked_penalty`
- `avoid_rule_penalty`
- `source_risk_penalty`
- `credit_penalty`
- `visual_density_penalty`
- `audio_density_penalty`
- `caption_collision_penalty`
- `speech_clarity_penalty`
- `face_product_occlusion_penalty`
- `repetition_penalty`
- `tone_mismatch_penalty`
- `runtime_readiness_penalty`
- `reference_copy_risk_penalty`
- `generic_template_penalty`

Documentation-only pseudo formula:

```text
skill_candidate_score =
  concept_fit
+ meaning_support
+ viewer_benefit
+ edit_preference_fit
+ workflow_fit
+ platform_fit
+ StoryTiming_fit
+ source_safety
+ novelty
+ professional_taste
+ feasibility
+ credit_fit
+ approval_fit
- user_blocked_penalty
- avoid_rule_penalty
- source_risk_penalty
- credit_penalty
- visual_density_penalty
- audio_density_penalty
- caption_collision_penalty
- speech_clarity_penalty
- face_product_occlusion_penalty
- repetition_penalty
- tone_mismatch_penalty
- runtime_readiness_penalty
- reference_copy_risk_penalty
- generic_template_penalty
```

Score supports decisions; it does not execute. A lower scoring skill may still be selected if the user explicitly requests it and it is safe and approved. A high scoring skill can still be blocked by user instruction, source risk, credit posture, policy, or runtime readiness.

## Decision Thresholds And Bands

| Band | Meaning | Next step | Example |
| --- | --- | --- | --- |
| `auto_reject` | Candidate fails a hard gate. | Create rejection or blocked candidate. | Unknown proof source for exact metric card. |
| `weak_candidate` | Candidate has low value or weak fit. | Reject unless user explicitly asks. | 3D for a minor aside. |
| `viable_candidate` | Candidate can work with constraints. | Keep as optional or lower-priority recommendation. | Subtle motion callout. |
| `strong_candidate` | Candidate fits concept well. | Recommend or select for route preview. | Graphic visual explain card. |
| `recommended` | Best balanced candidate. | Create route preview later. | Source-backed proof card. |
| `required_if_user_goal_requires` | Candidate becomes required only under explicit goal/safety need. | Mark required with reason. | Accessibility caption planning. |
| `optional_premium` | Strong but heavy or credit-sensitive. | Keep optional, require approval hint and lower-cost alternative. | Real Motion hero. |
| `needs_user_input` | Missing user/source decision prevents safe scoring. | Ask before route assembly. | User must confirm app screenshot source. |
| `blocked` | Candidate cannot be used under current constraints. | Record blocker and alternative. | `no_music` blocks music candidate. |

## Preferred And Blocked Skill Handling

RP-SKILLS-12 preference behavior guides resolver scoring without replacing judgment.

Rules:

- `preferred_skill_keys` add score; they do not force automatic selection.
- `blocked_skill_keys` create blocked candidates unless direct user instruction explicitly overrides.
- Family-level preferences apply to child skills.
- `no_*` skills can represent explicit restraint preferences.
- Low-credit preference lowers premium candidates and boosts alternatives.
- Wow preference boosts ambitious candidates only where the segment earns them.
- Preference conflict must be recorded.

Examples:

- User prefers 3D, but a minor line results in optional or rejected 3D and selected caption emphasis.
- User blocks music, so SoundSync music candidates are blocked; ambience and room tone may remain if allowed.
- User wants more Graphic Design, so `graphic_design_visual_explain` gets a boost but still needs a clarity reason.

## Must-follow And Avoid Rules

Rule types:

- `must_follow_rule`
- `strong_preference`
- `soft_preference`
- `avoid_rule`
- `hard_block`
- `unknown`

Must-follow rules and hard blocks override scoring. Soft preferences influence scoring. Avoid rules can reduce, reject, or block candidates. Unclear conflicts should create a user question. User instructions have priority over Reference DNA, workflow defaults, and AI judgment.

## Credit And Approval Resolver Behavior

Candidate scoring must include credit sensitivity. Premium, heavy, generated, or custom skills should be optional unless directly requested or required by the user-approved plan.

Each candidate must include credit tendency and approval tendency. Resolver should attach lower-cost alternatives where useful. Resolver does not create final credit estimates, reserve credits, spend credits, or call providers. No generation before approval.

Credit-aware candidate decisions:

- `select_low_cost`
- `recommend_balanced`
- `mark_premium_optional`
- `replace_with_lower_cost_alternative`
- `ask_for_approval_later`
- `block_due_to_credit_preference`

## Lower-cost Alternative Resolver Model

Lower-cost alternatives preserve the creative goal while reducing credit, runtime, source, density, or approval burden.

Examples:

- `three_d_overlay_integration` -> `graphic_design_visual_explain`
- `three_d_overlay_integration` -> `three_d_object_broll`
- Real Motion overlay -> source B-roll plus graphic callout
- generated B-roll -> `source_b_roll_selection`
- generated music -> ambience only or subtle library future
- complex animated caption -> basic readable captions
- hero transition -> `clean_cut_transition`
- dense graphics -> `caption_keyword_emphasis`

## Documentation-only Pseudo-record: SkillLowerCostAlternativeDecision

`SkillLowerCostAlternativeDecision` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable lower-cost decision ID. | `skill_alt_decision_001` |
| `project_id` | Required | Owning project. | `project_launch_demo` |
| `edit_plan_id` | Required | Owning edit plan. | `edit_plan_v4` |
| `premium_skill_candidate_id` | Required | Premium/heavy candidate being replaced or downgraded. | `skill_candidate_3d_breakout` |
| `alternative_skill_candidate_id` | Required | Lower-cost candidate. | `skill_candidate_graphic_card` |
| `alternative_reason` | Required | Why the alternative works. | `Graphic card clarifies feature with lower cost.` |
| `creative_tradeoff` | Required | What is lost. | `Less dimensional impact than 3D.` |
| `credit_reduction_reason` | Required | Why credits are reduced. | `No model/provenance or 3D render path needed.` |
| `quality_impact` | Required | Quality impact. | `Slightly less premium, still clear.` |
| `recommended_when` | Required | When to prefer this option. | `Low-credit preference or no premium approval.` |
| `status` | Required | Decision status. | `active` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Skill Rejection Model

Rejections are valuable planning data. They prove restraint, support revisions, explain why the AI did not use everything, and prevent repeated poor suggestions.

Rejection categories:

- `not_concept_fit`
- `not_story_relevant`
- `blocked_by_user`
- `blocked_by_preference`
- `blocked_by_budget`
- `blocked_by_source_status`
- `blocked_by_policy`
- `too_visually_dense`
- `too_audio_dense`
- `too_repetitive`
- `conflicts_with_StoryTiming`
- `conflicts_with_caption_readability`
- `conflicts_with_speech_clarity`
- `conflicts_with_face_or_product_safety`
- `better_simpler_skill_exists`
- `premium_not_worth_cost`
- `runtime_not_ready_future`
- `reference_copy_risk`

## Documentation-only Pseudo-record: RejectedSkillCandidate

`RejectedSkillCandidate` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable rejected candidate ID. | `rejected_skill_001` |
| `project_id` | Required | Owning project. | `project_launch_demo` |
| `edit_plan_id` | Required | Owning edit plan. | `edit_plan_v4` |
| `visual_opportunity_id` | Required | Source opportunity. | `opportunity_feature_reveal` |
| `creative_concept_id` | Required | Concept being resolved. | `concept_product_feature_card` |
| `skill_key` | Required | Canonical skill key rejected. | `three_d_overlay_integration` |
| `skill_family` | Required | Canonical skill family. | `three_d_visuals` |
| `rejection_reason` | Required | Human-readable reason. | `3D is too heavy for a minor feature mention.` |
| `rejection_category` | Required | Category from the model above. | `premium_not_worth_cost` |
| `score_summary` | Required | Score rationale summary. | `High wow, low concept necessity, high credit risk.` |
| `restraint_decision` | Required | Restraint result. | `use_simpler` |
| `lower_cost_or_safer_alternative_skill_key` | Optional | Better alternative. | `graphic_design_visual_explain` |
| `future_reconsideration_condition` | Optional | When to revisit. | `Reconsider if user explicitly approves premium hero moment.` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## StoryTiming Readiness Model

StoryTiming readiness values:

- `ready`
- `ready_with_warnings`
- `needs_coordination`
- `conflicts_detected`
- `blocked_until_resolved`
- `not_applicable`

Skill candidates should declare:

- visual footprint
- audio footprint
- text footprint
- motion footprint
- caption impact
- safe zone needs
- primary/secondary focus expectation
- density impact
- conflict risks

StoryTiming does not happen fully here. Resolver should flag when a candidate needs StoryTiming coordination before becoming a final route.

## Source/Proof Safety Resolver Behavior

Source/proof gating values:

- `verified_safe`
- `source_status_needed`
- `user_confirmation_needed`
- `redaction_needed`
- `safe_wording_needed`
- `blocked_unknown_source`
- `not_applicable`

Rules:

- Proof, evidence, browser, app, metric, pricing, testimonial, and dashboard claims cannot route to visual skills without source status.
- Unknown source cannot be treated as verified proof.
- Browser/app visual skills must not invent exact UI or source details.
- Reference DNA cannot become copied B-roll, graphics, music, style, timing, or structure.
- Source-sensitive candidates may become `needs_user_input` instead of selected.

## Runtime Readiness Resolver Behavior

Runtime readiness values:

- `planning_only`
- `mock_only`
- `future_runtime_needed`
- `provider_needed_future`
- `worker_needed_future`
- `browser_capture_needed_future`
- `generated_asset_needed_future`
- `unsupported_now`
- `not_applicable`

Runtime readiness is documentation and planning metadata only. A candidate can be selected for future planning while still not executable now. Runtime readiness cannot bypass approval or credit gates. This prompt must not add runtime code.

## Skill Relationship And Conflict Handling

Resolver uses RP-SKILLS-13 relationships without creating a runtime graph.

Relationship types:

- `supports`
- `conflicts_with`
- `alternative_to`
- `lower_cost_alternative_to`
- `premium_alternative_to`
- `requires`
- `blocks`
- `supersedes`
- `coordinated_with`
- `child_of`
- `parent_of`

Examples:

- `caption_design` conflicts with dense `proof_card_design` in the same lower-third zone.
- `three_d_overlay_integration` may require overlay compositing and motion design support.
- `transition_design` may require SoundSync transition SFX only if speech safe.
- StoryTiming coordinates all selected skills.
- `no_3d` blocks 3D candidates unless user overrides.

## Documentation-only Pseudo-record: SkillCandidateScoreReview

`SkillCandidateScoreReview` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, resolver logic, scoring runtime, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable score review ID. | `score_review_001` |
| `skill_candidate_id` | Required | Candidate being reviewed. | `skill_candidate_graphic_card` |
| `concept_fit_score` | Required | Concept fit score. | `9` |
| `meaning_support_score` | Required | Meaning support score. | `9` |
| `viewer_benefit_score` | Required | Viewer benefit score. | `8` |
| `edit_preference_fit_score` | Required | Preference fit score. | `8` |
| `workflow_fit_score` | Required | Workflow fit score. | `9` |
| `platform_fit_score` | Required | Platform fit score. | `7` |
| `StoryTiming_fit_score` | Required | StoryTiming fit score. | `7` |
| `source_safety_score` | Required | Source/proof safety score. | `9` |
| `novelty_score` | Required | Freshness score. | `6` |
| `professional_taste_score` | Required | Taste/restraint score. | `9` |
| `feasibility_score` | Required | Planning feasibility score. | `8` |
| `credit_fit_score` | Required | Credit fit score. | `8` |
| `approval_fit_score` | Required | Approval fit score. | `7` |
| `risk_score` | Required | Combined risk summary. | `medium_low` |
| `final_score_band` | Required | Final band. | `recommended` |
| `scoring_reason` | Required | Human-readable reason. | `Strong clarity with manageable density and low cost.` |
| `reviewer_notes` | Optional | Extra review notes. | `Watch caption collision.` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Documentation-only Pseudo-record: SkillResolverRun

`SkillResolverRun` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, resolver logic, scoring runtime, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable resolver run ID. | `resolver_run_001` |
| `project_id` | Required | Owning project. | `project_launch_demo` |
| `edit_plan_id` | Required | Owning edit plan. | `edit_plan_v4` |
| `input_concept_ids` | Required | Concepts resolved. | `concept_product_feature_card` |
| `input_opportunity_ids` | Required | Source opportunities. | `opportunity_feature_reveal` |
| `edit_preference_snapshot_id` | Required | Preference snapshot used. | `preference_snapshot_003` |
| `skill_taxonomy_version` | Required | Taxonomy version or docs reference. | `RP-SKILLS-13 docs` |
| `candidate_count` | Required | Total candidates. | `8` |
| `selected_count` | Required | Selected count. | `2` |
| `recommended_count` | Required | Recommended count. | `2` |
| `optional_count` | Required | Optional count. | `1` |
| `blocked_count` | Required | Blocked count. | `1` |
| `rejected_count` | Required | Rejected count. | `2` |
| `lower_cost_alternative_count` | Required | Lower-cost alternative count. | `1` |
| `needs_user_input_count` | Required | User input count. | `1` |
| `selected_skill_candidate_ids` | Optional | Selected candidates. | `skill_candidate_graphic_card` |
| `rejected_skill_candidate_ids` | Optional | Rejected candidates. | `rejected_skill_3d_minor` |
| `blocked_skill_candidate_ids` | Optional | Blocked candidates. | `skill_candidate_caption_blocked` |
| `run_confidence` | Required | Run confidence. | `medium_high` |
| `created_by_agent` | Required | Agent or human that created it. | `creative_skill_resolver` |
| `status` | Required | Run status. | `complete_docs_only` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Documentation-only Pseudo-record: SkillRouteDecisionPreview

`SkillRouteDecisionPreview` is documentation only. It is not the final schema and not execution. It previews what a future route might become.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable preview ID. | `route_preview_001` |
| `project_id` | Required | Owning project. | `project_launch_demo` |
| `edit_plan_id` | Required | Owning edit plan. | `edit_plan_v4` |
| `edit_plan_segment_id` | Required | Candidate segment. | `segment_03` |
| `visual_opportunity_id` | Required | Source opportunity. | `opportunity_feature_reveal` |
| `creative_concept_id` | Required | Selected concept. | `concept_product_feature_card` |
| `skill_candidate_id` | Required | Resolved candidate. | `skill_candidate_graphic_card` |
| `skill_key` | Required | Canonical skill key. | `graphic_design_visual_explain` |
| `skill_family` | Required | Canonical family. | `graphic_design` |
| `recommendation_level` | Required | Recommendation level. | `recommended` |
| `route_reason` | Required | Why a future route may exist. | `Concept needs a source-safe feature card.` |
| `primary_or_support` | Required | Primary or support role. | `primary` |
| `optional` | Required | Whether route is optional. | `false` |
| `approval_required` | Required | Later approval expectation. | `true` |
| `credit_tendency` | Required | Expected credit tendency. | `medium` |
| `planning_contract_type` | Required | Contract to instantiate later. | `graphic_design_planning_contract` |
| `StoryTiming_readiness` | Required | StoryTiming readiness. | `needs_coordination` |
| `lower_cost_alternative_skill_candidate_id` | Optional | Alternative candidate. | `none` |
| `QA_notes` | Required | QA notes. | `Check safe zones and proof wording.` |
| `status` | Required | Preview status. | `preview_only` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

This is a preview of route intent only. A future RP-SKILLS prompt will define the actual Skill Route and Plan Assembly contract. This prompt does not create runtime routes.

## Resolver QA

Resolver-specific QA checks:

- Candidate uses canonical skill key.
- Candidate maps to planning contract.
- Concept-to-skill reasoning exists.
- Preferred/blocked skill handling is correct.
- User must-follow and avoid rules are honored.
- Source/proof safety is preserved.
- Premium skill has credit/approval hints.
- Lower-cost alternative exists for premium optional skill.
- `no_*` restraint option is considered.
- StoryTiming readiness is flagged.
- Duplicate/repetition is checked.
- Rejected/blocked candidates have reasons.
- No tool/provider-first decision appears.
- No execution is implied.
- No generation before approval.

Blocking examples:

- Non-canonical skill key.
- Skill has no planning contract.
- Blocked skill selected without explicit override.
- Premium skill selected without approval/credit hint.
- Source-unsafe candidate selected.
- Tool or provider selected as skill.
- Resolver implies execution.

Warning examples:

- Candidate score rationale is weak.
- Lower-cost alternative is missing.
- StoryTiming readiness is unclear.
- Too many optional premium skills.
- Preferred skill is rejected without reason.
- Repeated candidate pattern appears.

## Examples

| Example | creative_concept_summary | skill_candidates | selected_skill_candidates | rejected_or_blocked_candidates | recommendation_levels | scoring_reason | lower_cost_alternative | StoryTiming_readiness | credit_approval_notes | QA notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Premium product feature card | Explain product feature with polished card. | `graphic_design_visual_explain`, `motion_design_overlay`, `safe_zone_layout` | `graphic_design_visual_explain`, `motion_design_overlay` | `three_d_overlay_integration` rejected | `recommended`, `support_skill_candidate` | Graphic card is clear and source-safe. | None needed; selected path is balanced. | `needs_coordination` | Approval if user-visible. | Check caption collision. |
| 3D product breakout | Make product feature feel tangible. | `three_d_product_feature_breakout`, `graphic_design_visual_explain` | `three_d_product_feature_breakout` optional | None; lower-cost option kept | `optional_premium` | Strong wow but premium. | `graphic_design_visual_explain` | `needs_coordination` | Premium approval and credit estimate later. | Check model/provenance. |
| Real estate blueprint | Show property layout spatially. | `three_d_overlay_integration`, `source_b_roll_selection` | `three_d_overlay_integration` optional | None; B-roll alternative kept | `optional_premium` | 3D may clarify layout but source footage may suffice. | `source_b_roll_selection` | `needs_coordination` | Approval if premium. | Check source plan and safe zones. |
| Education framework | Teach a named framework. | `graphic_design_visual_explain`, `caption_design`, `motion_design_overlay` | All three as bundle | SFX rejected | `recommended` | Visual hierarchy and captions support learning. | Basic caption-only route. | `ready_with_warnings` | Medium credit, approval if user-visible. | Check readability and density. |
| Emotional pause | Protect speaker expression. | `no_transition`, `no_sfx`, `no_b_roll`, `silence_as_design` | `no_transition`, `no_sfx`, `no_b_roll` | Music swell rejected | `do_not_use`, `required` restraint | Extra layers would cheapen emotion. | Not applicable. | `ready` | No approval needed. | Protect speech and face. |
| Browser annotation | Annotate a screen moment. | `browser_annotation_design`, `safe_zone_layout` | `browser_annotation_design` needs input | Exact UI invention blocked | `needs_user_input`, `blocked_by_source_status` | Source status unknown. | No visual or generic graphic. | `blocked_until_resolved` | Ask for source confirmation. | Do not invent UI labels. |
| Marketing proof | Show proof claim. | `proof_card_design`, `safe_wording_needed`, `source_safety_qa` | `proof_card_design` needs confirmation | Exact metric card blocked | `needs_user_input` | Proof can help only if source verified. | Safe wording caption. | `needs_coordination` | Approval if visible. | Verify claims. |
| Social keyword | Emphasize hook phrase. | `caption_keyword_emphasis`, `beat_aware_motion`, `music_ducking_planning` | Caption emphasis and beat-aware motion | Loud SFX rejected | `recommended` | Helps retention without drowning speech. | Basic readable captions. | `ready_with_warnings` | Low/medium credit. | Check speech safety. |
| Low-credit preference | Clarify product without premium effects. | `real_motion`, `source_b_roll_selection`, `graphic_design_visual_explain` | `source_b_roll_selection`, `graphic_design_visual_explain` | Real Motion rejected | `lower_cost_alternative`, `rejected` | Lower-cost path serves same idea. | Selected path is alternative. | `needs_coordination` | Premium rejected due credit sensitivity. | Check source relevance. |
| User blocked captions | Avoid captions. | `caption_design`, `no_captions`, `graphic_design_visual_explain` | `no_captions` | `caption_design` blocked | `blocked`, `do_not_use` | Direct user preference blocks captions. | Graphic design if clarity needed. | `ready` | No caption approval. | Flag accessibility tradeoff. |
| User prefers 3D but minor sentence | Consider 3D preference with restraint. | `three_d_overlay_integration`, `caption_keyword_emphasis` | `caption_keyword_emphasis` | 3D rejected | `rejected`, `recommended` | Minor line does not earn 3D. | Caption emphasis selected. | `ready` | No premium credit. | Record preference conflict. |
| Multi-skill hero | Big launch beat. | `three_d_product_feature_breakout`, `motion_design_overlay`, `soundsync_music_planning`, `safe_zone_layout` | Bundle optional premium | None yet; lower-cost graphic bundle included | `optional_premium` | Strong idea but dense and premium. | Graphic hero card plus subtle motion. | `needs_coordination` | Approval and estimate required later. | Check density, speech, source/model safety. |

## Anti-patterns

- Skill selected from opportunity without concept.
- Skill selected from concept without scoring.
- Non-canonical skill key.
- Tool/provider chosen as skill.
- Preferred skill forced everywhere.
- Blocked skill silently ignored or selected.
- No lower-cost alternative for premium skill.
- No rejected candidate records.
- No no-op/restraint candidates.
- Premium skill selected without approval/credit hint.
- Source-unsafe skill selected.
- Browser/app exact UI skill selected with unknown source.
- Reference copy risk ignored.
- StoryTiming conflicts ignored.
- Resolver creates execution, job, provider call, generation request, or render/export action.
- Resolver is implemented in this docs-only prompt.

## Future Implementation Notes

Possible future records, tables, or types:

- `skill_resolver_runs`
- `skill_candidates`
- `skill_candidate_score_reviews`
- `skill_candidate_bundles`
- `skill_route_decision_previews`
- `rejected_skill_candidates`
- `skill_lower_cost_alternative_decisions`
- canonical skill taxonomy references
- creative concept references
- visual opportunity references
- edit preference snapshot references
- StoryTiming readiness references
- source/proof safety references
- approval record references later
- credit estimate references later

This document does not create those records now. Future schema/types must avoid duplicating this document's source-of-truth. Runtime skill resolver remains future gated work. Resolver output is planning metadata, not execution.

## Duplicate And Missing-file Notes

Existing owners must be referenced, not replaced:

- RP-SKILLS-01 through RP-SKILLS-15 contracts.
- `source-of-truth-map.md`
- `duplicate-lane-checklist.md`
- `src/lib/adaptive-edit-strategy.ts`
- `src/lib/mock-planner.ts`
- `src/lib/professional-editing-ontology.ts`
- `src/lib/intent-compiler.ts`
- `src/lib/planner-validation.ts`
- `src/lib/prompt-builders.ts`
- `src/lib/workflow-profiles.ts`
- existing type surfaces under `src/types/`
- signature routing docs and `src/types/signature-systems.ts`

Existing overlap already mentions skill candidates, skill scoring influence, preferred and blocked skills, lower-cost alternatives, rejected skill candidates, signature routes, and chosen-before-creative-concept anti-patterns. This document creates a navigation and handoff contract, not a competing resolver runtime.

Requested source-truth file status:

- `audio-library-and-licensing.md` exists.
- `soundsync-music-intelligence.md` is missing in the current repo snapshot.
- `music-reference-dna.md` is missing in the current repo snapshot.
- `lyria-music-generation-plan.md` is missing in the current repo snapshot.

## RP-SKILLS-17 Handoff

Recommended next prompt:

`RP-SKILLS-17 - Skill Route and Plan Assembly Contract`

Scope:

Docs-only skill route and plan assembly contract that defines how selected skill candidates become future `edit_plan_skill_routes` and skill plan records: route reason, segment/time range, primary/support role, optionality, approval status, credit impact, planning contract attachment, StoryTiming readiness, QA requirements, lower-cost alternatives, revision linkage, and handoff to future schema/type-contract work.

Forbidden scope for `RP-SKILLS-17` unless explicitly authorized later:

- Supabase migrations or SQL.
- Runtime code.
- TypeScript implementation.
- React UI.
- Provider calls.
- Workers, jobs, leases, or runtime gates.
- Package installs or package file mutations.
- Skill resolver runtime, skill route runtime, schema/runtime behavior, preference runtime, settings UI, profile storage, runtime orchestration, render/export runtime, media processing, audio generation, music generation, SFX generation, caption rendering, browser/capture/media/generation runtime, prompt router changes, Playwright execution, animation code, design-token changes, or app behavior.
