# Creative Concept Ideation Contract

## Purpose

This document defines the future Creative Concept Ideation contract for ReeditPro Creative Skill planning.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, concept generator runtime, visual analysis runtime, media analysis runtime, opportunity detector runtime, skill resolver code, catalog runtime, package changes, Supabase connections, SQL, credentials, or app behavior.

The contract defines how future planners generate and evaluate creative concepts from visual opportunities. It does not select final skills directly. It does not execute editing. It does not create generation requests.

Creative Concept Ideation hands off concepts to future Skill Candidate Scoring and Resolver contracts. Skill planning contracts, StoryTiming, credit estimates, approval, and execution all happen later.

Core boundary: concept ideation is not execution.

## Creative Concept Doctrine

A creative concept is a planned idea for how to respond to an opportunity.

Creative concept ideation is not "choose an effect." It asks, "What is the best creative idea for this opportunity?"

A concept should be more specific than a skill name and more creative than a generic effect. It should say what the viewer will see, hear, or feel and why that improves the edit.

A concept can involve one skill or multiple skills. A concept can be selected, rejected, optional, lower-cost, premium, or restraint/no-op. Concept ideation should preserve creative freedom while staying inside ReeditPro standards.

A strong concept should be fresh for the video, not repeated mechanically across projects. A concept must not copy reference content shot-for-shot or copy protected style, music, assets, screens, claims, or exact timing.

Core principle:

"A concept is the creative idea; a skill is the capability used to express it."

## Position In Planning Flow

Concept ideation sits after visual opportunity detection and before skill routing.

1. User intent and edit preference are collected.
2. Source sequence and media context are understood.
3. Visual Opportunity Engine detects opportunities.
4. Creative Concept Ideation generates candidates.
5. Concept candidates are scored and selected/rejected.
6. Skill Candidate Scoring / Resolver maps selected concepts to skills later.
7. Skill planning contracts are created later.
8. StoryTiming coordinates selected plans later.
9. Credit estimate and approval happen later.
10. Execution happens only after approval later.

Concept ideation does not bypass approval and does not create generation requests.

## Required Input Context

| Input | Why it matters |
| --- | --- |
| `project_id` | Keeps concepts scoped to the current project. |
| `edit_plan_id` | Connects concept candidates to the current edit plan. |
| `visual_opportunity_ids` | Ensures every concept traces to detected opportunities. |
| `opportunity_type` | Explains the type of need that prompted ideation. |
| `opportunity_summary` | Summarizes why the opportunity matters. |
| `transcript_anchor_text` | Grounds concept in spoken meaning. |
| `visual_observation_summary` | Grounds concept in observed footage, layout, objects, faces, UI, or scene context. |
| `audio_observation_summary` | Grounds concept in speech clarity, silence, ambience, music, or SFX needs. |
| `story_beat` | Shows how the concept serves the story. |
| `source_clip_context` | Preserves source order, media availability, and source status. |
| `user_goal_summary` | Keeps the idea aligned with the user's requested outcome. |
| `explicit_user_instructions` | Protects must-follow and do-not-do rules. |
| `resolved_edit_preference_snapshot` | Shapes ambition, density, motion, 3D, B-roll, captions, SoundSync, and restraint. |
| `workflow_context` | Guides social, education, product, testimonial, property, or clean-edit behavior. |
| `platform` | Affects pacing, text density, safe zones, and viewer expectations. |
| `aspect_ratio` | Affects screen relationship and collision risk. |
| `reference_DNA` | Provides style guidance only; never copy. |
| `credit_preference` | Triggers lower-cost alternatives and premium optional handling. |
| `source_proof_status` | Prevents unsupported proof, metric, testimonial, browser, or dashboard concepts. |
| `safe_zones_if_known` | Protects faces, captions, products, UI, source evidence, and redaction areas. |
| `skill_taxonomy_canonical_families` | Keeps family and key handoff canonical. |
| `StoryTiming_density_budget_if_available` | Prevents concepts from overloading focus or density. |
| `prior_concept_history_repetition_state` | Prevents repeated ideas and supports deliberate motifs. |
| `lower_cost_requirement_if_applicable` | Ensures premium concepts have cheaper alternatives. |

## Creative Concept Type Family

| Concept type | What it means | Likely skill family handoff | Avoid overusing when | Source/proof caution | Example |
| --- | --- | --- | --- | --- | --- |
| `no_op_restraint_concept` | The best idea is to do less. | `core_editing`, `story_timing`, `qa` | Used to avoid needed clarity. | Explain what is protected. | Keep emotional pause clean. |
| `clean_edit_concept` | Use edit craft without extra creative layers. | `core_editing`, `transition`, `audio_cleanup` | Moment needs visual explanation. | Preserve meaning. | Clean cut plus room tone. |
| `caption_emphasis_concept` | Use captions or text emphasis to clarify. | `caption`, `motion_design` | User blocked captions or density is high. | Do not alter meaning. | Emphasize key phrase. |
| `transition_concept` | Use a meaningful edge between moments. | `transition`, `motion_design`, `soundsync`, `sfx` | Clean cut is stronger. | Protect speech/captions/proof. | Ambient bridge into next scene. |
| `B_roll_concept` | Use supporting footage or inset. | `b_roll`, `overlay_compositing` | B-roll is filler or hides emotion. | Source/proof status matters. | Source detail cutaway. |
| `graphic_design_concept` | Use designed visual explanation. | `graphic_design`, `overlay_compositing`, `motion_design` | Text would overcrowd. | No invented claims. | Framework diagram. |
| `motion_design_concept` | Use motion language to guide attention. | `motion_design`, `transition`, `graphic_design` | Motion distracts or repeats. | Protect readability. | Gentle callout reveal. |
| `three_d_visual_concept` | Use dimensional visual support. | `three_d_visuals`, `motion_design`, `overlay_compositing` | 3D feels gimmicky or source is unsafe. | Provenance and approval later. | Product feature in 3D. |
| `three_d_object_broll_concept` | Use 3D object as B-roll or inset. | `three_d_visuals`, `b_roll` | Source B-roll is clearer. | Premium approval later. | 3D object cutaway. |
| `three_d_overlay_concept` | Integrate 3D into source frame. | `three_d_visuals`, `overlay_compositing`, `motion_design` | Face/source safety is unclear. | Occlusion and source/model safety. | Object hovering beside product. |
| `three_d_screen_interaction_concept` | Make 3D interact with screen/app visual. | `three_d_visuals`, `browser_app_visuals`, `graphic_design` | UI/source details are invented. | Screen evidence must be real. | 3D module emerges from app screen. |
| `Stroke_Motion_concept` | Use meaning-first drawn/story layer. | `stroke_motion`, `motion_design` | Stroke is decorative. | Protect captions/source. | Drawn line connects two ideas. |
| `Real_Motion_concept` | Use realistic overlay-first visual. | `real_motion`, `overlay_compositing`, `motion_design` | Face/product safety is risky. | Premium and face-safe. | Realistic product element enters frame. |
| `browser_app_visual_concept` | Use browser/app visual support. | `browser_app_visuals`, `graphic_design`, `overlay_compositing` | Source/capture is unavailable. | Do not invent UI. | User-provided screenshot annotation. |
| `SoundSync_music_concept` | Use music/mood/rhythm support. | `soundsync`, `story_timing` | Silence is stronger or user blocked music. | Rights/provenance later. | Warm lift during reveal. |
| `SFX_support_concept` | Use SFX to support a visual/action. | `sfx`, `motion_design`, `transition` | SFX distracts from speech. | Approval if user-visible. | Subtle tick on graphic reveal. |
| `multi_skill_concept` | Combine multiple families deliberately. | Multiple canonical families. | Density is too high. | Requires StoryTiming. | 3D hero with reduced captions and music lift. |
| `lower_cost_alternative_concept` | Cheaper way to serve the same idea. | `graphic_design`, `b_roll`, `caption`, `core_editing` | It weakens a user-approved premium moment. | Document tradeoff. | Graphic card instead of 3D. |
| `premium_optional_concept` | Stronger option that likely needs approval/credits. | Premium/heavy families. | Presented as already approved. | Credit/approval required. | Real Motion hero moment. |
| `source_safe_concept` | Safer wording/visual path for uncertain source. | `qa`, `caption`, `graphic_design`, `b_roll` | Used to hide unsupported claims. | Must preserve truth. | Caption says "reported" instead of exact proof. |
| `user_confirmation_concept` | Concept cannot proceed without user input. | `approval_credit`, `edit_preference`, `qa` | Answer is already explicit. | Ask before selection. | Confirm exact metric before proof card. |

## Creative Visual Role Model

Concept roles:

- `proof`
- `context`
- `clarity`
- `emphasis`
- `story_transformation`
- `emotional_support`
- `product_understanding`
- `spatial_understanding`
- `screen_interaction`
- `abstract_metaphor`
- `hero_reveal`
- `premium_polish`
- `pacing_relief`
- `cut_cover`
- `teaching_support`
- `CTA_support`
- `trust_support`
- `ambience_support`
- `restraint`

A concept can have multiple roles, but one should be primary. Role clarity prevents random effects.

## Candidate Generation Requirements

For each meaningful opportunity, future planning should usually generate:

- One strong creative idea.
- One restrained/professional idea.
- One lower-cost alternative if the strong idea is premium.
- One no-op/restraint candidate when the moment may not earn extra visuals/audio.
- One user-confirmation candidate if source, preference, proof, or premium approval is unclear.

Not every opportunity needs many candidates. Minor opportunities may only need selected no-op or simple caption/cut candidates. Hero opportunities should have multiple options. Concepts must not be repeated mechanically.

## Documentation-only Pseudo-record: CreativeConceptCandidate

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, concept generator logic, skill resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable concept identifier. | `concept_feature_callout_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `opportunity_id` | Required | Source opportunity. | `opp_product_feature_001` |
| `concept_type` | Required | Canonical concept type. | `graphic_design_concept` |
| `concept_title` | Required | Short title. | `Clean feature callout beside app screen` |
| `concept_summary` | Required | Summary of the idea. | `Use a source-safe callout to make one-click export visible without 3D.` |
| `primary_role` | Required | Main role. | `product_understanding` |
| `secondary_roles` | Optional | Supporting roles. | `clarity, premium_polish` |
| `creative_intent` | Required | Editorial purpose. | `Make the feature understandable in one glance.` |
| `viewer_benefit` | Required | Viewer benefit. | `Viewer understands the product value faster.` |
| `what_viewer_sees` | Required | Visual experience. | `A restrained label and arrow tied to the source UI area.` |
| `what_viewer_hears` | Optional | Audio experience. | `Voice remains primary with no SFX.` |
| `timing_intent` | Required | Timing idea. | `Enter after the phrase one-click export, hold two seconds.` |
| `screen_relationship` | Required | Screen placement/composition. | `Right-side safe zone, away from face and captions.` |
| `motion_relationship` | Optional | Motion relationship. | `Subtle fade/slide only.` |
| `audio_relationship` | Optional | Audio relationship. | `No music change; speech protected.` |
| `caption_relationship` | Optional | Caption coordination. | `Caption remains lower safe zone.` |
| `B_roll_relationship` | Optional | B-roll relationship. | `Alternative to source B-roll if no cutaway exists.` |
| `three_d_relationship` | Optional | 3D relationship. | `Lower-cost alternative to 3D product breakout.` |
| `graphic_design_relationship` | Optional | Graphic design relationship. | `Primary visual explanation is graphic callout.` |
| `transition_relationship` | Optional | Transition relationship. | `No transition needed.` |
| `possible_skill_families` | Required | Canonical possible families. | `graphic_design, overlay_compositing, caption` |
| `possible_skill_keys` | Required | Canonical possible skill keys. | `feature_callout_design, safe_zone_layout` |
| `source_or_proof_assumptions` | Required | Source/proof assumptions. | `UI area is visible in source; do not invent labels.` |
| `edit_preference_fit` | Required | Preference fit. | `Fits balanced_visual_explain and low-credit posture.` |
| `reference_DNA_fit` | Optional | Reference DNA fit. | `Use polish level only; no copy.` |
| `workflow_fit` | Required | Workflow fit. | `Product Demo` |
| `platform_fit` | Required | Platform/aspect fit. | `Vertical-safe if callout stays right.` |
| `novelty_notes` | Required | Freshness notes. | `Use once; avoid repeated arrow card pattern.` |
| `restraint_notes` | Required | Restraint consideration. | `No 3D unless user approves premium option.` |
| `lower_cost_alternative_notes` | Optional | Lower-cost alternative notes. | `This is the lower-cost option to a 3D breakout.` |
| `premium_optional` | Required | Whether concept is premium optional. | `false` |
| `credit_tendency` | Required | Credit tendency. | `low` |
| `approval_tendency` | Required | Approval tendency. | `approval_if_user_visible` |
| `risk_notes` | Required | Risk notes. | `Medium source/UI accuracy risk.` |
| `QA_notes` | Required | QA notes. | `Check no invented UI label and no caption collision.` |
| `status` | Required | Concept status. | `candidate` |
| `metadata_json` | Optional | Future flexible metadata. | `{\"safeZone\":\"right\"}` |

## Concept Status Model

| Status | When used |
| --- | --- |
| `generated` | Concept was generated but not evaluated. |
| `candidate` | Concept is plausible and ready for scoring. |
| `shortlisted` | Concept is a serious contender. |
| `selected` | Concept is selected for future skill candidate scoring. |
| `rejected` | Concept is rejected with reason. |
| `optional` | Concept is optional and not required. |
| `lower_cost_alternative` | Concept is a cheaper alternative to a premium idea. |
| `premium_optional` | Concept may be strong but requires estimate/approval. |
| `deferred` | Concept may be useful later. |
| `blocked_by_user` | Direct instruction blocks it. |
| `blocked_by_preference` | Edit preference blocks it. |
| `blocked_by_budget` | Credit posture blocks it. |
| `blocked_by_source_status` | Source/proof state blocks it. |
| `needs_user_input` | User must answer before selection. |
| `superseded` | Another concept is a better fit. |
| `archived` | Retained only for audit/history. |

## Documentation-only Pseudo-record: CreativeConceptSelection

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, concept generator logic, skill resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable selection ID. | `concept_selection_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `opportunity_id` | Required | Source opportunity. | `opp_product_feature_001` |
| `selected_concept_id` | Required | Selected concept. | `concept_feature_callout_001` |
| `selected_reason` | Required | Why selected. | `Clear, source-safe, low-cost, and preference-aligned.` |
| `selected_primary_role` | Required | Primary role. | `product_understanding` |
| `selected_skill_family_candidates` | Required | Candidate families. | `graphic_design, overlay_compositing` |
| `selected_skill_key_candidates` | Required | Candidate skills. | `feature_callout_design, safe_zone_layout` |
| `why_best_fit` | Required | Why best fit. | `Explains feature without premium 3D or source invention.` |
| `edit_preference_alignment` | Required | Preference alignment. | `Matches balanced visual density and low-credit preference.` |
| `StoryTiming_alignment` | Required | StoryTiming alignment. | `Short hold after key phrase; captions remain readable.` |
| `credit_alignment` | Required | Credit alignment. | `Low-cost concept selected over premium 3D.` |
| `approval_required` | Required | Approval need. | `approval_if_user_visible` |
| `lower_cost_alternative_concept_id` | Optional | Lower-cost alternative reference. | `none; selected concept is lower-cost path` |
| `rejected_concept_ids` | Optional | Rejected concepts. | `concept_3d_breakout_002` |
| `QA_requirements` | Required | QA requirements. | `Check source UI accuracy and caption collision.` |
| `status` | Required | Selection status. | `selected` |
| `metadata_json` | Optional | Future flexible metadata. | `{\"selectionBand\":\"strong\"}` |

## Documentation-only Pseudo-record: CreativeConceptRejection

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, concept generator logic, skill resolver logic, catalog storage, worker spec, provider instruction, or UI.

Rejection categories:

- `not_story_relevant`
- `too_expensive`
- `too_visually_dense`
- `too_generic`
- `too_repetitive`
- `conflicts_with_user_preference`
- `conflicts_with_source_safety`
- `conflicts_with_tone`
- `conflicts_with_caption_readability`
- `conflicts_with_speech_clarity`
- `conflicts_with_StoryTiming`
- `unsupported_runtime_future`
- `reference_copy_risk`
- `better_simpler_option_exists`

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable rejection ID. | `concept_rejection_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `opportunity_id` | Required | Source opportunity. | `opp_product_feature_001` |
| `rejected_concept_id` | Required | Rejected concept. | `concept_3d_breakout_002` |
| `rejection_reason` | Required | Why rejected. | `Premium 3D is unnecessary for a simple feature mention.` |
| `rejection_category` | Required | Rejection category. | `better_simpler_option_exists` |
| `restraint_decision` | Required | Restraint result. | `Use graphic callout instead of 3D.` |
| `future_reconsideration_condition` | Optional | When to reconsider. | `If user asks for premium 3D hero concept.` |
| `lower_cost_or_safer_alternative_id` | Optional | Alternative concept. | `concept_feature_callout_001` |
| `affected_skill_families` | Required | Affected families. | `three_d_visuals, graphic_design` |
| `metadata_json` | Optional | Future flexible metadata. | `{\"creditPosture\":\"low\"}` |

Rejected concepts prove professional restraint. Rejections help avoid repeated bad ideas and provide revision alternatives later.

## Concept Scoring Model

Scoring dimensions:

- `meaning_fit_score`
- `viewer_benefit_score`
- `clarity_gain_score`
- `emotional_impact_score`
- `wow_factor_score`
- `professional_taste_score`
- `edit_preference_fit_score`
- `workflow_fit_score`
- `platform_fit_score`
- `StoryTiming_fit_score`
- `source_safety_score`
- `novelty_score`
- `feasibility_score`
- `credit_fit_score`
- `lower_cost_availability_score`

Risk dimensions:

- `clutter_risk`
- `speech_distraction_risk`
- `caption_collision_risk`
- `face_or_product_occlusion_risk`
- `source_or_proof_risk`
- `reference_copy_risk`
- `generic_template_risk`
- `repetition_risk`
- `credit_overrun_risk`
- `runtime_readiness_risk`
- `tone_mismatch_risk`

Documentation-only pseudo logic:

```text
creative_concept_score =
  meaning_fit
+ viewer_benefit
+ clarity_gain
+ emotional_impact
+ wow_factor
+ professional_taste
+ edit_preference_fit
+ workflow_fit
+ platform_fit
+ StoryTiming_fit
+ source_safety
+ novelty
+ feasibility
+ credit_fit
- clutter_risk
- speech_distraction_risk
- caption_collision_risk
- face_or_product_occlusion_risk
- source_or_proof_risk
- reference_copy_risk
- generic_template_risk
- repetition_risk
- credit_overrun_risk
- tone_mismatch_risk
```

Scores guide selection, not automatic execution. High wow does not win if source safety, speech clarity, or StoryTiming fails. A lower-wow concept can be selected if it is more professional for the moment.

## Concept Priority Bands

| Band | Meaning | Likely next step | Example |
| --- | --- | --- | --- |
| `reject` | Concept should not proceed. | Create rejection record. | 3D for minor object mention. |
| `low` | Weak but possible. | Defer or reject. | Simple caption emphasis with low benefit. |
| `medium` | Plausible concept. | Compare with alternatives. | Source B-roll cutaway. |
| `strong` | Clear best-fit candidate. | Select for skill candidate scoring. | Source-safe feature callout. |
| `hero_candidate` | Rare high-impact concept. | Shortlist with StoryTiming and approval notes. | 3D launch reveal. |
| `optional_premium` | Strong premium option. | Keep optional with estimate/approval later. | Real Motion hero moment. |
| `lower_cost_alternative` | Cheaper viable path. | Pair with premium concept. | Graphic card instead of 3D. |
| `needs_user_confirmation` | Needs user input. | Ask later before selection. | Exact metric proof card. |
| `blocked` | Cannot proceed. | Block by user/preference/source/budget. | User said no music. |

## Concept Relationship To Visual Opportunity

- Every concept must trace back to one or more visual opportunities.
- Concepts should not appear out of nowhere.
- One opportunity can produce multiple concepts.
- One concept can address multiple related opportunities.
- A concept may intentionally choose no action.
- The concept must preserve opportunity source/proof risk.

## Concept Relationship To Skill Taxonomy

- `possible_skill_families` must use canonical family keys from RP-SKILLS-13.
- `possible_skill_keys` must use canonical skill keys.
- Concept type is not skill key.
- Skill resolver later decides actual skill route.
- Concepts can propose multiple skill candidates.
- Concepts can include `no_*` restraint skill candidates.

Examples:

- Concept: `glass house blueprint builds beside property footage`; possible skills: `three_d_overlay_integration`, `motion_design_overlay`, `graphic_design_visual_explain`, `soundsync_music_planning`.
- Concept: `use no 3D, keep speaker face clean`; possible skills: `no_3d`, `clean_cuts`, `caption_design`.

## Concept Relationship To Edit Preference

RP-SKILLS-12 influences concepts:

- Visual density preference shapes concept ambition.
- Motion intensity preference shapes movement.
- 3D preference affects 3D concepts.
- B-roll preference affects source footage concepts.
- SoundSync preference affects audio concepts.
- Credit sensitivity creates lower-cost alternatives.
- Wow target raises or lowers hero concepts.
- Blocked skills prevent related concepts unless user overrides.
- Preferred skills are considered but not forced.

Examples:

- Out-of-this-world preference: generate bold ideas, but only for earned moments.
- Minimal preference: generate restraint/simple concepts first.
- Low-credit preference: generate lower-cost alternatives.
- No 3D preference: do not select 3D concepts; record rejection if relevant.

## Concept Relationship To StoryTiming

RP-SKILLS-11 influences concepts:

- Concept must fit primary focus.
- Concept must not overload visual/audio density.
- Hero concepts need protected windows.
- Captions may move or reduce around hero concepts.
- SFX/music must be speech-safe.
- Concepts may be rejected if StoryTiming cannot fit them.
- Multi-skill concepts need density budget.
- Concept should identify potential conflicts early.

## Concept Relationship To Source/Proof Safety

Rules:

- Proof, metric, result, testimonial, browser, and app concepts need source status.
- Unknown source cannot become proof concept.
- Concepts must not invent exact screens, dashboards, prices, metrics, testimonials, or claims.
- Reference DNA can inspire broad structure or mood, not exact copying.
- Source-sensitive concepts may become user-confirmation concepts.
- Sensitive/private visuals may require redaction planning later.
- Concepts should include safe wording notes where needed.

## Concept Relationship To Credit/Approval

- Concepts do not reserve or spend credits.
- Concepts should include credit tendency and approval tendency.
- Premium concepts should be optional where possible.
- Lower-cost alternatives should be generated for premium concepts.
- Concepts can be selected as recommended but optional.
- Final credit estimate comes later.
- No generation happens before approval.

## Concept Relationship To Tools, Providers, And Workers

- Concepts should not select a tool/provider as the first decision.
- Concepts may include broad tool family hints later, but no execution.
- Tool/provider routing belongs to later contracts.
- Concept should focus on creative intent and feasibility, not implementation.
- No provider secrets, runtime flags, or generation requests are allowed.

## Lower-cost Alternative Model

Lower-cost alternative types:

- `no_action`
- `clean_cut`
- `caption_emphasis`
- `source_B_roll`
- `simple_graphic_card`
- `simple_motion_reveal`
- `ambience_only`
- `no_SFX`
- `no_3D`
- `graphic_instead_of_3D`
- `B_roll_instead_of_Real_Motion`
- `static_card_instead_of_generated_visual`
- `existing_source_asset_instead_of_generated_B_roll`

## Documentation-only Pseudo-record: CreativeConceptLowerCostAlternative

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, concept generator logic, skill resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable lower-cost alternative ID. | `concept_alt_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `premium_concept_id` | Required | Premium concept being replaced or paired. | `concept_3d_breakout_002` |
| `alternative_concept_id` | Required | Lower-cost concept. | `concept_feature_callout_001` |
| `cost_reduction_reason` | Required | Why it costs less. | `Uses graphic callout instead of 3D generation.` |
| `creative_tradeoff` | Required | Creative tradeoff. | `Less spectacle, more clarity.` |
| `quality_impact` | Required | Quality impact. | `Still professional and source-safe.` |
| `recommended_when` | Required | When to choose it. | `Low-credit preference or unapproved premium visual.` |
| `metadata_json` | Optional | Future flexible metadata. | `{\"premiumSkill\":\"three_d_product_feature_breakout\"}` |

## Restraint Concept Model

Restraint concept types:

- `protect_speaker_face`
- `protect_emotional_pause`
- `protect_product_action`
- `protect_caption_reading`
- `protect_source_truth`
- `reduce_visual_density`
- `reduce_audio_density`
- `avoid_repetition`
- `avoid_premium_cost`
- `user_preference_restraint`
- `tone_restraint`

Restraint concepts are not lack of creativity. Restraint can make a later hero moment stronger. Restraint concepts should be first-class candidates.

## Concept Duplicate And Novelty Model

Duplicate/repetition checks:

- Same concept repeated in same project.
- Same 3D object idea repeated.
- Same graphic card idea repeated.
- Same caption emphasis idea repeated.
- Same transition idea repeated.
- Same SoundSync/SFX idea repeated.
- Same hero reveal repeated too often.
- Concept too similar to reference.
- Concept too generic/template-like.

Actions:

- `merge_duplicate`
- `vary_concept`
- `reject_repeated`
- `lower_priority`
- `preserve_if_intentional_motif`
- `handoff_to_StoryTiming`

Repetition can be a deliberate motif only if planned. The same topic may reuse a blueprint family, but variation is required.

## Concept User-question Model

Concept ideation should ask user questions when:

- Premium concept is expensive.
- User preference conflict exists.
- Source/proof is unclear.
- Exact claim, metric, offer, or title is unclear.
- Product or brand asset is required.
- 3D/model/source is needed.
- Music/reference influence is unclear.
- Generated/future visual requires approval.
- No clear creative direction exists and multiple strong paths exist.

## Documentation-only Pseudo-record: CreativeConceptUserQuestion

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, concept generator logic, skill resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable question ID. | `concept_question_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `opportunity_id` | Required | Source opportunity. | `opp_proof_claim_002` |
| `concept_id` | Required | Related concept. | `concept_proof_card_001` |
| `question_type` | Required | Question type. | `source_confirmation` |
| `question_text` | Required | User-facing question. | `Can we show this 32% claim as sourced proof?` |
| `answer_options` | Optional | Answer choices. | `yes_source_backed, use_safe_wording, remove_claim` |
| `why_needed` | Required | Why answer matters. | `Unknown source cannot become verified proof.` |
| `blocks_selection` | Required | Whether it blocks selection. | `true` |
| `affected_skill_families` | Required | Affected families. | `graphic_design, caption, b_roll` |
| `credit_or_approval_notes` | Required | Credit/approval notes. | `Proof card is low credit but source-sensitive.` |
| `status` | Required | Status. | `needs_user_input` |
| `metadata_json` | Optional | Future flexible metadata. | `{\"metric\":\"32%\"}` |

## Documentation-only Pseudo-record: CreativeConceptIdeationRun

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, concept generator logic, skill resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable run ID. | `concept_run_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `opportunity_ids` | Required | Opportunities used. | `opp_product_feature_001, opp_hero_001` |
| `input_summary` | Required | Input summary. | `Two high-priority opportunities, product demo workflow, balanced preference.` |
| `edit_preference_snapshot_id` | Optional | Preference snapshot. | `resolved_pref_042` |
| `workflow_context` | Required | Workflow context. | `Product Demo` |
| `platform` | Required | Platform. | `vertical social` |
| `generated_candidate_count` | Required | Generated count. | `8` |
| `selected_candidate_count` | Required | Selected count. | `2` |
| `rejected_candidate_count` | Required | Rejected count. | `4` |
| `lower_cost_alternative_count` | Required | Lower-cost count. | `2` |
| `restraint_candidate_count` | Required | Restraint count. | `2` |
| `premium_optional_count` | Required | Premium optional count. | `1` |
| `needs_user_input_count` | Required | User input count. | `1` |
| `selected_concept_ids` | Optional | Selected concepts. | `concept_feature_callout_001` |
| `rejected_concept_ids` | Optional | Rejected concepts. | `concept_3d_breakout_002` |
| `run_confidence` | Required | Run confidence. | `medium` |
| `created_by_agent` | Required | Agent label. | `docs_only_future_planner` |
| `status` | Required | Run status. | `planning_only` |
| `metadata_json` | Optional | Future flexible metadata. | `{\"notes\":\"mock-only example\"}` |

## Concept QA

Concept-specific QA checks:

- Concept traces to opportunity.
- Concept has clear creative intent.
- Concept is more specific than skill/effect name.
- Concept has viewer benefit.
- Concept has primary role.
- Possible skill families and keys are canonical.
- Concept respects edit preference.
- Concept respects StoryTiming.
- Concept considers source/proof safety.
- Concept considers speech/caption safety.
- Concept considers credit/approval tendency.
- Premium concept has lower-cost alternative.
- Restraint/no-op considered.
- Rejected concepts have reasons.
- No reference copying.
- No tool/provider-first concept.
- No generation/execution implied.

Blocking examples:

- Concept implies provider/generation execution before approval.
- Concept copies reference exactly.
- Proof concept has unknown source but treats it as verified.
- Concept uses non-canonical skill families/keys.
- User blocked related skill and concept ignores it.
- Premium concept has no approval/credit note.

Warning examples:

- Concept is vague.
- Concept may be too generic.
- Concept lacks lower-cost alternative.
- Concept may overload StoryTiming.
- Concept repeats similar idea too often.

## Examples

| Example | opportunity_type | candidate_concepts | selected_concept | rejected_concepts | why_selected | why_rejected | possible_skill_keys | restraint_or_lower_cost_option | credit_tendency | approval_tendency | QA notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Product feature | `product_feature` | Graphic callout; 3D product breakout; source B-roll detail. | Graphic callout. | 3D breakout optional; source B-roll if unavailable. | Clear, source-safe, low-cost. | 3D too premium for minor moment. | `feature_callout_design, three_d_product_feature_breakout, source_b_roll_selection` | Graphic callout instead of 3D. | `low` | `approval_if_user_visible` | Check UI/source accuracy. |
| Abstract transformation | `abstract_concept` | Symbolic 3D metaphor; Stroke Motion story layer; restrained caption-only. | Stroke Motion story layer if approved, otherwise caption-only. | 3D metaphor if too abstract. | Meaning-first and less generic. | 3D risk of decoration. | `stroke_motion_story_layer, three_d_symbolic_metaphor, caption_keyword_emphasis` | Caption-only. | `medium` | `approval_if_user_visible` | Avoid reference copying. |
| Real estate investment line | `hero_reveal_moment` | 3D glass blueprint hero; premium feature card; no-3D source B-roll. | Premium feature card. | 3D glass blueprint optional. | Luxury feel with lower risk. | 3D needs approval and may distract. | `three_d_hero_reveal, proof_card_design, source_b_roll_selection` | Source B-roll alternative. | `medium` | `approval_if_user_visible` | Property/source safety. |
| Education teaching moment | `teaching_moment` | Framework diagram; step-by-step graphic; B-roll example. | Framework diagram. | B-roll if source is weak. | Best clarity for concept. | B-roll may be less direct. | `framework_diagram_design, diagram_build_motion, caption_line_breaking` | Static framework card. | `medium` | `approval_if_user_visible` | Check hierarchy and readability. |
| Marketing proof claim | `proof_claim` | Proof card; caption emphasis; source-safe wording. | Source-safe proof card if confirmed. | Exact metric card until source confirmed. | Trust-building with caution. | Unknown proof cannot be verified. | `proof_card_design, caption_keyword_emphasis, source_safety_qa` | Caption emphasis with safe wording. | `low` | `source_confirmation_needed` | Needs source confirmation. |
| Browser/app screen | `screen_ui_moment` | User screenshot annotation; invented UI mock; no visual. | User screenshot annotation. | Invented UI mock. | Source-backed and useful. | Inventing UI is unsafe. | `browser_annotation_design, source_status_planning, safe_zone_layout` | No visual if source missing. | `medium` | `source_confirmation_needed` | Check redaction and exact UI labels. |
| Emotional pause | `emotional_shift` | Restraint; music swell; transition SFX. | Restraint. | Music/SFX. | Speaker expression is primary. | Audio support would cheapen tone. | `clean_cuts, room_tone_preservation, no_sfx` | No-op restraint. | `none` | `no_approval_needed` | Protect face and speech. |
| B-roll gap | `B_roll_gap` | Source B-roll plan; optional 3D object B-roll; simple graphic card. | Source B-roll plan. | 3D optional. | Source-first and lower risk. | 3D premium not necessary. | `source_b_roll_selection, three_d_object_broll, simple_graphic_card` | Graphic card if no source B-roll. | `low` | `approval_if_user_visible` | Avoid filler B-roll. |
| Hero launch line | `hero_reveal_moment` | Premium 3D hero reveal; motion graphic hero card; lower-cost CTA card. | Motion graphic hero card. | 3D hero optional. | Strong but controllable. | 3D needs approval and cost estimate. | `three_d_hero_reveal, hero_motion_moment, cta_card_design` | CTA card. | `high` | `approval_if_premium` | StoryTiming hero window needed. |
| Low-credit preference | `product_feature` | Real Motion; 3D; source B-roll plus graphic. | Source B-roll plus graphic. | Real Motion and 3D. | Fits low-credit preference. | Premium concepts conflict with budget. | `source_b_roll_selection, graphic_design_visual_explain, no_3d` | Selected lower-cost path. | `low` | `approval_if_user_visible` | Record premium rejections. |
| No captions preference | `caption_emphasis_moment` | No-caption concept; minimal caption; accessible caption. | No-caption concept with accessibility note. | Minimal caption unless user approves. | Honors user preference. | Caption conflicts with direct preference. | `no_captions, caption_accessibility_planning` | No-caption restraint. | `none` | `no_approval_needed` | Flag accessibility tradeoff. |
| Reference DNA conflict | `transition_bridge` | Viral transition; restrained premium motion; clean cut. | Restrained premium motion or clean cut. | Viral transition. | User asked calm premium. | Reference energy conflicts with instruction. | `motion_design_overlay, clean_cut_transition, no_transition` | Clean cut. | `low` | `approval_if_user_visible` | Reference DNA must not override user. |

## Anti-patterns

- Concept is just a skill name.
- Concept is just a tool/provider name.
- Concept jumps to execution.
- Concept skips opportunity tracing.
- Concept ignores user preference.
- Concept ignores source/proof safety.
- Concept copies reference shot-for-shot.
- Concept invents exact UI/claims/metrics.
- Concept always picks 3D.
- Concept never considers restraint.
- Concept never offers lower-cost alternative.
- Concept repeats same idea mechanically.
- Concept overloads StoryTiming.
- Concept hides captions, speech, face, or product.
- Concept treats premium idea as approved.
- Concept creates generation request.
- Concept generator is implemented in docs-only prompt.

## Future Implementation Notes

Possible future records, tables, or types:

- `creative_concept_ideation_runs`
- `creative_concept_candidates`
- `creative_concept_selections`
- `creative_concept_rejections`
- `creative_concept_lower_cost_alternatives`
- `creative_concept_user_questions`
- `creative_concept_score_reviews`
- `visual_opportunities` references
- `edit_preference_snapshots` references
- canonical skill taxonomy references
- StoryTiming references
- skill candidate scoring references
- `credit_estimate` references later
- `approval_records` references later

This document does not create those records now. Future schema/types must avoid duplicating this document's source-of-truth. Runtime concept generation remains future gated work. Concept ideation is planning metadata, not execution.

## Duplicate And Missing-file Notes

Current overlap already exists in docs and code, but no dedicated Creative Concept Ideation contract exists in this repo snapshot.

Relevant existing owners include RP-SKILLS-01 through RP-SKILLS-14 docs, `source-of-truth-map.md`, `duplicate-lane-checklist.md`, `src/lib/adaptive-edit-strategy.ts`, `src/lib/mock-planner.ts`, `src/lib/professional-editing-ontology.ts`, `src/lib/intent-compiler.ts`, `src/lib/planner-validation.ts`, `src/lib/prompt-builders.ts`, `src/lib/workflow-profiles.ts`, and the existing type surfaces under `src/types/`.

Existing overlap mentions creative concepts, creative intent, wow factor, lower-cost alternatives, selected/rejected concept ideas, and chosen-before-creative-concept anti-patterns. Future prompts must reference those owners instead of creating a competing runtime generator.

Requested source-truth file status:

- `audio-library-and-licensing.md` exists.
- `soundsync-music-intelligence.md` is missing in the current repo snapshot.
- `music-reference-dna.md` is missing in the current repo snapshot.
- `lyria-music-generation-plan.md` is missing in the current repo snapshot.

## RP-SKILLS-16 Handoff

Recommended next prompt:

`RP-SKILLS-16 - Skill Candidate Scoring and Resolver Contract`

Scope:

Docs-only skill candidate scoring/resolver contract that defines how selected creative concepts become skill candidates and skill routes: candidate mapping, scoring formula, required/recommended/optional/blocked decisions, preferred/blocked skill handling, credit/approval hints, lower-cost alternatives, rejection records, StoryTiming readiness, duplicate avoidance, and handoff to future skill planning contracts.

Forbidden scope for `RP-SKILLS-16` unless explicitly authorized later:

- Supabase migrations or SQL.
- Runtime code.
- TypeScript implementation.
- React UI.
- Provider calls.
- Workers, jobs, leases, or runtime gates.
- Package installs or package file mutations.
- Concept generator runtime, visual analysis runtime, opportunity detector runtime, skill resolver runtime, schema/runtime behavior, preference runtime, settings UI, profile storage, runtime orchestration, render/export runtime, media processing, audio generation, music generation, SFX generation, caption rendering, browser/capture/media/generation runtime, prompt router changes, Playwright execution, animation code, design-token changes, or app behavior.
