# Visual Opportunity Engine Contract

## Purpose

This document defines the future Visual Opportunity Engine contract for ReeditPro Creative Skill planning.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, visual analysis runtime, opportunity detector runtime, media analysis runtime, skill resolver code, catalog runtime, package changes, Supabase connections, SQL, credentials, or app behavior.

The Visual Opportunity Engine identifies moments where a skill may be useful before any skill is selected. It does not select skills directly. It does not generate creative concepts directly. It does not create generation requests. It does not execute editing.

Opportunity detection hands off to the future Creative Concept Ideation contract. Creative concepts, skill scoring, planning contracts, StoryTiming coordination, credit estimates, approval, and execution all happen later.

Core boundary: opportunity detection is not execution.

## Visual Opportunity Doctrine

A visual opportunity is a moment where the edit may benefit from a planned creative decision.

The Visual Opportunity Engine is not an effect detector. It does not ask, "What effect can we add?" It asks, "What moment in this video deserves visual, audio, timing, or restraint attention?"

A visual opportunity can lead to visual enhancement, audio support, timing coordination, user question, source/proof caution, lower-cost alternative, premium optional idea, creative concept ideation, or intentional restraint.

The engine should detect moments worth considering, not force action. A high opportunity score does not mean a skill must be used. A restraint/no-op opportunity is valid when doing less is more professional.

The engine must detect where ReeditPro can be out-of-this-world while still protecting taste, clarity, user preference, source truth, credits, and approval.

Core principle:

"Opportunity detection creates possibilities; planning contracts decide what is actually allowed."

## Position In Planning Flow

Opportunity detection sits before creative concept ideation and skill selection.

1. User intent and edit preference are collected.
2. Source sequence and media context are understood.
3. Transcript, visual, and audio observations are considered.
4. Reference DNA is considered as guidance only.
5. Visual, audio, and story opportunities are detected.
6. Creative concept candidates are generated later.
7. Skill candidates are scored later.
8. Skill planning contracts are created later.
9. StoryTiming coordinates selected plans later.
10. Credit estimate and approval happen later.
11. Execution happens only after approval later.

Opportunity detection does not bypass approval and should not create generation requests.

## Required Input Context

| Input | Why it matters |
| --- | --- |
| `project_id` | Keeps opportunities scoped to the current project. |
| `edit_plan_id` | Connects opportunities to the current plan. |
| `edit_plan_segment_id` | Identifies the exact segment or time range. |
| `source_clip_sequence_ids` | Preserves source order and source context. |
| `media_asset_ids` | Links opportunities to available media. |
| `transcript_segment_ids` | Anchors spoken meaning. |
| `transcript_text` | Provides the words that may create an opportunity. |
| `speaker_label` | Helps protect speaker identity, credibility, and voice. |
| `visual_observations` | Provides observed footage context, objects, faces, screens, and scene details. |
| `audio_observations` | Provides speech clarity, ambience, music, silence, and SFX context. |
| `scene_boundaries` | Identifies cuts, scene changes, time jumps, and transition opportunities. |
| `story_beat` | Explains why a moment matters in the story. |
| `user_goal_summary` | Grounds opportunities in the user's goal. |
| `explicit_user_instructions` | Protects direct must-follow and do-not-do instructions. |
| `edit_preference_snapshot` | Guides density, restraint, wow factor, and preferred/blocked families. |
| `workflow_context` | Provides workflow expectations such as social, education, product, property, or clean edit. |
| `platform` | Shapes pacing, caption needs, safe areas, and density. |
| `aspect_ratio` | Affects screen zones, caption placement, and visual fit. |
| `reference_DNA` | Guides style safely without copying. |
| `credit_preference` | Helps flag premium opportunities and lower-cost alternatives. |
| `source_proof_status` | Prevents unsupported proof, evidence, dashboard, browser, or metric claims. |
| `safe_zones_if_known` | Protects faces, captions, product action, UI, redaction areas, and important objects. |
| `prior_selected_rejected_opportunities` | Avoids duplicate detection and respects earlier decisions. |
| `prior_skill_usage_repetition_state` | Prevents repeated hero, 3D, caption, B-roll, transition, or SFX patterns. |

## Opportunity Type Family

| Opportunity type | What it means | Likely skill family handoff | Avoid overusing when | Source/proof caution | Example |
| --- | --- | --- | --- | --- | --- |
| `no_op_restraint_opportunity` | The best professional choice may be doing less. | `story_timing`, `qa`, `core_editing` | Used to avoid solving real clarity problems. | Record why no action protects the edit. | Serious pause stays clean. |
| `spoken_object_reference` | Speaker names a concrete object. | `b_roll`, `three_d_visuals`, `graphic_design`, `caption` | Every object mention becomes 3D. | Object identity must be grounded in transcript/source. | "The camera module" may need visual support. |
| `spoken_product_reference` | Speaker names a product or product category. | `b_roll`, `graphic_design`, `three_d_visuals`, `real_motion` | Product is incidental. | Product visuals must not invent features. | "Our app" may need source-backed screen support. |
| `spoken_place_or_location_reference` | Speaker names a place or location. | `b_roll`, `graphic_design`, `browser_app_visuals` | Location is not relevant to viewer clarity. | Avoid fake maps/locations. | "At the downtown office" may need context. |
| `abstract_concept` | Speaker explains an abstract idea. | `graphic_design`, `stroke_motion`, `three_d_visuals`, `motion_design` | Concept is already clear. | Avoid literalizing sensitive or unsupported ideas. | "Trust compounds over time." |
| `proof_claim` | Moment claims proof, evidence, or validation. | `b_roll`, `graphic_design`, `caption`, `qa` | Source is weak or unknown. | Must carry source status. | "Customers saved hours every week." |
| `result_or_metric_claim` | Moment mentions result, number, metric, price, or percentage. | `graphic_design`, `b_roll`, `caption`, `source_safety_qa` | Metric is unverified. | Unknown evidence cannot be treated as verified. | "Revenue grew 32%." |
| `product_feature` | Moment describes a feature or capability. | `graphic_design`, `three_d_visuals`, `b_roll`, `caption` | Feature is not important or source-backed. | Do not invent UI labels or behavior. | "One-click export" may need callout. |
| `screen_ui_moment` | Moment references on-screen UI. | `browser_app_visuals`, `graphic_design`, `overlay_compositing` | UI is private, unclear, or invented. | Needs source status and redaction later. | Cursor highlights a dashboard panel. |
| `browser_app_moment` | Browser/app visual could support the story. | `browser_app_visuals`, `graphic_design`, `overlay_compositing` | Browser/app capture is unavailable or unsafe. | Do not invent exact pages or metrics. | SaaS demo may need browser frame visual. |
| `data_or_metric` | Data visualization or metric explanation could help. | `graphic_design`, `three_d_visuals`, `caption` | Data is decorative or unsupported. | Must be source-backed. | Chart-like visual for verified trend. |
| `emotional_shift` | Tone or emotion changes meaningfully. | `soundsync`, `transition`, `story_timing`, `stroke_motion`, `no_op_restraint_opportunity` | Music/SFX would cheapen emotion. | Protect speaker credibility. | A testimonial becomes vulnerable. |
| `story_transformation` | Segment marks before/after or change. | `graphic_design`, `motion_design`, `three_d_visuals`, `transition` | Transformation is weak or repetitive. | Avoid exaggerated claims. | "We went from manual to automated." |
| `before_after_moment` | Explicit before/after contrast. | `graphic_design`, `b_roll`, `motion_design`, `transition` | No visual evidence exists. | Source/proof status needed. | Before/after workflow comparison. |
| `location_change` | Location or environment changes. | `b_roll`, `transition`, `story_timing`, `soundsync` | Change is already clear. | Avoid fabricated place visuals. | Moving from exterior to room interior. |
| `time_jump` | Timeline moves forward/backward. | `transition`, `graphic_design`, `caption`, `soundsync` | Time jump is obvious. | Avoid false timestamps. | "Three months later..." |
| `scene_change` | Source footage or story scene changes. | `transition`, `b_roll`, `story_timing` | Clean cut is enough. | Preserve source continuity. | Cut from interview to product footage. |
| `dead_visual_space` | Visual field has room for support. | `overlay_compositing`, `graphic_design`, `b_roll`, `three_d_visuals`, `no_op_restraint_opportunity` | Empty space is intentional. | Do not fill space just because it is available. | Empty right side beside speaker. |
| `visual_monotony_risk` | Long section may feel visually static. | `b_roll`, `graphic_design`, `motion_design`, `caption`, `no_op_restraint_opportunity` | Source content remains engaging. | Avoid filler visuals. | Long talking-head section. |
| `hero_reveal_moment` | Moment may deserve a major visual payoff. | `three_d_visuals`, `real_motion`, `motion_design`, `soundsync`, `story_timing` | Too many hero moments already exist. | Premium work needs approval. | Product launch line. |
| `teaching_moment` | Speaker teaches a concept or step. | `graphic_design`, `caption`, `b_roll`, `three_d_visuals` | Added visuals distract from explanation. | Claim/source safety if examples are factual. | Explaining a three-step framework. |
| `process_or_step_moment` | A sequence or process needs clarity. | `graphic_design`, `caption`, `motion_design`, `b_roll` | Steps are not important. | Do not invent steps. | "First, upload. Then review." |
| `B_roll_gap` | Segment needs supporting visual but none is obvious. | `b_roll`, `three_d_visuals`, `graphic_design` | B-roll would hide emotion or become filler. | Generated/future B-roll needs approval. | Product mention lacks source footage. |
| `transition_bridge` | Moment needs a bridge between scenes or thoughts. | `transition`, `b_roll`, `soundsync`, `motion_design` | Clean cut protects meaning better. | Avoid transition effects over proof/speech. | Awkward cut between topics. |
| `caption_emphasis_moment` | Spoken phrase may need emphasis. | `caption`, `motion_design`, `story_timing` | Too many emphasized captions. | Do not change meaning. | Key quote or phrase. |
| `graphic_explanation_moment` | Designed explanation may clarify. | `graphic_design`, `motion_design`, `caption` | Text would overcrowd screen. | Proof/source safety if factual. | Framework diagram opportunity. |
| `3D_candidate_moment` | Moment may deserve dimensional support. | `three_d_visuals`, `motion_design`, `overlay_compositing` | 3D would feel gimmicky. | Source/model/provenance and approval needed. | Product object breakout. |
| `Stroke_Motion_story_moment` | Drawn/story mark could add meaning. | `stroke_motion`, `motion_design`, `transition` | Stroke is decorative. | Protect source/caption zones. | Hand-drawn line connects ideas. |
| `Real_Motion_candidate_moment` | Realistic overlay-first visual could help. | `real_motion`, `overlay_compositing`, `motion_design` | Face/source risk is high. | Premium approval and safety required. | Realistic product overlay. |
| `SoundSync_cue_moment` | Music/rhythm/ducking cue may matter. | `soundsync`, `story_timing`, `transition` | Silence is stronger. | Rights/provenance later. | Music lift at reveal. |
| `SFX_support_moment` | SFX could support a visual or transition. | `sfx`, `transition`, `motion_design`, `three_d_visuals` | SFX would distract from speech. | Approval if user-visible or premium. | Subtle click with UI reveal. |
| `source_safety_moment` | Moment needs source/proof caution. | `qa`, `b_roll`, `graphic_design`, `caption` | Treated as decoration. | Must flag risk before concept ideation. | Dashboard claim has unknown source. |
| `user_confirmation_needed_moment` | Planning needs user input. | `approval_credit`, `edit_preference`, `qa` | The answer is already explicit. | Do not proceed as verified. | Exact metric needs confirmation. |
| `lower_cost_alternative_moment` | Premium idea needs cheaper option. | `approval_credit`, `graphic_design`, `b_roll`, `no_op_restraint_opportunity` | Used to suppress approved premium style. | Keep premium optional if desired. | Replace 3D with proof card. |

## Opportunity Source Model

| Source type | Guidance |
| --- | --- |
| `transcript_derived` | Cite the spoken meaning and transcript anchor. |
| `visual_observation_derived` | Cite observed footage context, not imagined footage. |
| `audio_observation_derived` | Cite speech, ambience, silence, music, or SFX context. |
| `source_sequence_derived` | Cite source order, scene changes, or cutaway needs. |
| `user_instruction_derived` | Respect direct user instructions and do-not-do rules. |
| `edit_preference_derived` | Use resolved preference, not raw preference guesses. |
| `reference_DNA_derived` | Use as style guidance only and never copy exact reference. |
| `workflow_context_derived` | Use workflow expectations as defaults, not mandates. |
| `platform_derived` | Use platform/aspect needs such as readability and safe area. |
| `QA_or_risk_derived` | Flag safety, proof, density, collision, or approval issues. |
| `AI_inferred` | Carry confidence and user confirmation where needed. |
| `mock_only` | Mark demo/mock opportunities honestly. |
| `unknown` | Do not treat as proof or verified source. |

Reference DNA-derived opportunities are guidance only and must not copy. AI-inferred opportunities should carry confidence and may need confirmation. Unknown opportunities should not become proof claims.

## Opportunity Confidence And Evidence Model

Confidence levels:

- `high`
- `medium`
- `low`
- `needs_user_confirmation`
- `blocked_by_unknown_source`

Evidence/source support levels:

- `direct_transcript`
- `direct_visual_observation`
- `user_instruction`
- `source_clip_context`
- `reference_guidance_only`
- `inferred`
- `claimed_by_user`
- `unknown`
- `not_supported`

High-confidence opportunities can proceed to creative concept ideation. Low-confidence opportunities may still be candidates but should be marked. Source/proof-sensitive opportunities need source status. Unknown evidence cannot be treated as verified.

## Opportunity Status Model

| Status | When used |
| --- | --- |
| `detected` | Opportunity was found but not evaluated. |
| `candidate` | Opportunity is plausible and ready for scoring. |
| `prioritized` | Opportunity scored high enough for next-step consideration. |
| `rejected` | Opportunity is not useful, unsafe, repetitive, or unearned. |
| `deferred` | Opportunity may matter later but lacks current context. |
| `blocked_by_user` | Direct user instruction blocks the opportunity. |
| `blocked_by_preference` | Edit preference blocks or strongly discourages it. |
| `blocked_by_budget` | Credit posture blocks likely next steps. |
| `blocked_by_source_status` | Source/proof state is too uncertain or unsafe. |
| `needs_user_input` | User confirmation is needed before concept ideation. |
| `handed_to_creative_concepts` | Opportunity moved to future creative concept ideation. |
| `superseded` | Another opportunity covers this need better. |
| `archived` | Opportunity is retained for audit only. |

## Documentation-only Pseudo-record: VisualOpportunity

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, opportunity detector logic, skill resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable opportunity identifier. | `opp_product_feature_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `edit_plan_segment_id` | Required | Segment reference. | `segment_product_feature` |
| `opportunity_type` | Required | Canonical opportunity type. | `product_feature` |
| `opportunity_family` | Required | Broader opportunity group. | `visual_explanation` |
| `opportunity_title` | Required | Short title. | `Clarify export feature` |
| `opportunity_summary` | Required | Summary of the detected opportunity. | `Speaker describes one-click export and source UI has room for a callout.` |
| `source_type` | Required | Opportunity source. | `transcript_derived` |
| `evidence_support_level` | Required | Evidence level. | `direct_transcript` |
| `confidence` | Required | Confidence level. | `high` |
| `transcript_anchor_text` | Optional | Spoken anchor text. | `one-click export` |
| `transcript_segment_ids` | Optional | Transcript segment references. | `transcript_012` |
| `visual_observation_ids` | Optional | Visual observation references. | `visual_obs_dashboard_right_space` |
| `audio_observation_ids` | Optional | Audio observation references. | `audio_obs_clear_speech` |
| `story_beat_id` | Optional | Story beat reference. | `beat_feature_reveal` |
| `source_clip_sequence_ids` | Optional | Source sequence references. | `source_seq_004` |
| `detected_need` | Required | What the moment needs. | `Make feature visible without inventing UI.` |
| `why_this_moment_matters` | Required | Story reason. | `Feature is the core value proof in this segment.` |
| `potential_viewer_benefit` | Required | Viewer benefit. | `Viewer understands the product faster.` |
| `possible_skill_families` | Required | Canonical possible families. | `graphic_design, browser_app_visuals, caption` |
| `possible_skill_keys` | Optional | Canonical possible skills. | `feature_callout_design, browser_annotation_design` |
| `no_op_possible` | Required | Whether restraint remains possible. | `true` |
| `source_or_proof_risk` | Required | Source/proof risk. | `medium: UI labels must be source-backed` |
| `user_preference_fit` | Required | Fit with edit preference. | `fits balanced_visual_explain` |
| `reference_DNA_fit` | Optional | Reference DNA fit. | `style guidance only; no copy` |
| `workflow_fit` | Required | Workflow fit. | `Product Demo` |
| `platform_fit` | Required | Platform/aspect fit. | `vertical safe if right-side callout is used` |
| `credit_sensitivity_notes` | Required | Credit posture. | `low-cost graphic first; 3D optional only if approved` |
| `storytiming_notes` | Required | Timing/focus notes. | `Keep speaker face primary; callout enters after key phrase.` |
| `priority_score` | Optional | Priority score. | `78` |
| `risk_score` | Optional | Risk score. | `22` |
| `status` | Required | Opportunity status. | `candidate` |
| `metadata_json` | Optional | Future flexible metadata. | `{\"safeZone\":\"right\"}` |

## Restraint/No-op Opportunity Model

Restraint opportunities matter because professional editing is not "everything everywhere." A moment may need silence, clean cuts, no captions, no 3D, no B-roll, no SFX, or reduced visual density.

Examples:

- Emotional pause should remain clean.
- Speaker face should stay primary.
- User asked for simple edit.
- Visual already communicates the idea.
- Adding 3D would feel gimmicky.
- B-roll would hide a trustworthy testimonial expression.
- Music/SFX would distract from a serious quote.
- Captions should be reduced during a hero visual.
- Transition should be a clean cut.

## Documentation-only Pseudo-record: RestraintOpportunity

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, opportunity detector logic, skill resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable restraint opportunity ID. | `restraint_001` |
| `project_id` | Required | Project reference. | `project_testimonial` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_014` |
| `segment_id` | Required | Segment reference. | `segment_emotional_pause` |
| `restraint_reason` | Required | Why restraint is preferred. | `Speaker expression carries trust better than B-roll.` |
| `primary_focus_to_protect` | Required | Focus being protected. | `speaker_face_and_voice` |
| `blocked_or_reduced_skill_families` | Required | Families to block/reduce. | `b_roll, sfx, motion_design` |
| `allowed_support_skills` | Optional | Support still allowed. | `clean_cuts, room_tone_preservation` |
| `storytiming_notes` | Required | Timing coordination notes. | `Mark as restraint_window with speaker as primary focus.` |
| `user_preference_alignment` | Required | Preference fit. | `matches premium_restrained` |
| `QA_notes` | Required | QA notes. | `Block if visual overlay hides expression.` |
| `status` | Required | Status. | `candidate` |
| `metadata_json` | Optional | Future flexible metadata. | `{\"emotion\":\"serious\"}` |

## Opportunity Scoring Model

Scoring dimensions:

- `meaning_relevance_score`
- `story_importance_score`
- `viewer_clarity_gain_score`
- `proof_or_context_gain_score`
- `emotional_impact_score`
- `visual_wow_potential_score`
- `screen_fit_score`
- `audio_fit_score`
- `edit_preference_fit_score`
- `workflow_fit_score`
- `platform_fit_score`
- `reference_DNA_fit_score`
- `novelty_score`
- `feasibility_score`
- `credit_fit_score`
- `source_safety_score`
- `restraint_score`

Risk dimensions:

- `clutter_risk`
- `speech_distraction_risk`
- `caption_collision_risk`
- `face_or_product_occlusion_risk`
- `source_or_proof_risk`
- `reference_copy_risk`
- `credit_overrun_risk`
- `runtime_readiness_risk`
- `tone_mismatch_risk`
- `repetition_risk`
- `trust_risk`

Documentation-only pseudo logic:

```text
opportunity_priority_score =
  meaning_relevance
+ story_importance
+ viewer_clarity_gain
+ proof_or_context_gain
+ emotional_impact
+ visual_wow_potential
+ screen_fit
+ edit_preference_fit
+ workflow_fit
+ platform_fit
+ novelty
+ feasibility
- clutter_risk
- speech_distraction_risk
- caption_collision_risk
- face_or_product_occlusion_risk
- source_or_proof_risk
- reference_copy_risk
- credit_overrun_risk
- repetition_risk
- tone_mismatch_risk
```

Scores guide prioritization, not automatic selection. Some low-score opportunities should be rejected and documented. Some high-risk opportunities should be converted to restraint or user-question opportunities.

## Opportunity Prioritization Bands

| Band | Meaning | Likely next step | Example |
| --- | --- | --- | --- |
| `ignore` | Not useful enough to record beyond search noise. | Do not hand off. | Minor object mention with no story value. |
| `low` | Possible but weak. | Keep as low-priority or reject. | Small visual monotony risk in short segment. |
| `medium` | Worth concept consideration if low risk. | Hand off if context supports. | Useful B-roll context opportunity. |
| `high` | Strong opportunity with clear viewer benefit. | Hand to creative concept ideation. | Teaching moment needs diagram. |
| `hero_candidate` | Rare, high-impact opportunity. | Hand off with StoryTiming, credit, and approval notes. | Product launch reveal. |
| `needs_user_confirmation` | Important but blocked by uncertainty. | Ask user later before concept ideation. | Exact metric/source unclear. |
| `blocked` | Should not proceed. | Reject, block, or convert to restraint. | User blocked 3D. |

## Skill-family Handoff Mapping

Handoff does not select the final skill. Creative concept ideation comes next.

| Opportunity type | Likely skill family handoff |
| --- | --- |
| `spoken_object_reference` | `b_roll`, `three_d_visuals`, `graphic_design`, `real_motion`, `caption` |
| `abstract_concept` | `graphic_design`, `stroke_motion`, `three_d_visuals`, `motion_design` |
| `proof_claim` | `b_roll`, `graphic_design`, `source_safety_qa`, `caption` |
| `product_feature` | `graphic_design`, `three_d_visuals`, `b_roll`, `caption` |
| `screen_ui_moment` | `browser_app_visuals`, `graphic_design`, `three_d_visuals`, `source_safety_qa` |
| `emotional_shift` | `soundsync`, `transition`, `no_op_restraint_opportunity`, `stroke_motion` |
| `hero_reveal_moment` | `three_d_visuals`, `real_motion`, `motion_design`, `soundsync`, `story_timing` |
| `teaching_moment` | `graphic_design`, `caption`, `b_roll`, `three_d_visuals` |
| `transition_bridge` | `transition`, `b_roll`, `soundsync`, `motion_design` |
| `dead_visual_space` | `overlay_compositing`, `graphic_design`, `b_roll`, `three_d_visuals`, `no_op_restraint_opportunity` |
| `no_op_restraint_opportunity` | `story_timing`, `qa`, blocked/rejected skill candidate records |

## Opportunity Relationship To Skill Taxonomy

The Visual Opportunity Engine uses RP-SKILLS-13 taxonomy:

- `possible_skill_families` must use canonical family keys.
- `possible_skill_keys` must use canonical skill keys.
- Aliases should be resolved before storing future records.
- Opportunity type is not the same as skill key.
- One opportunity can lead to multiple skill candidates.
- One skill can address multiple opportunity types.
- `no_*` skills can represent restraint opportunities.

## Opportunity Relationship To Edit Preference

RP-SKILLS-12 edit preference influences opportunities:

- Visual density preference affects opportunity priority.
- Wow-factor target affects hero candidate detection.
- Blocked skills reduce related opportunity handoff strength.
- Preferred skills raise related opportunity consideration but do not force use.
- Credit sensitivity affects premium opportunity priority.
- Restraint level affects no-op/restraint opportunity strength.
- Motion/caption/B-roll/3D/SoundSync preferences shape next-step concepts.

Examples:

- Out-of-this-world preference raises `hero_candidate` scoring, but only for earned moments.
- Minimal preference increases restraint scoring.
- Low-credit preference pushes lower-cost alternatives.
- No 3D preference blocks or lowers 3D candidate handoff.

## Opportunity Relationship To StoryTiming

RP-SKILLS-11 StoryTiming uses opportunities:

- Opportunities identify possible primary focus windows.
- Hero candidates may become `hero_moment_window`s.
- Restraint opportunities may become `restraint_window`s.
- Caption emphasis opportunities affect caption priority.
- B-roll gaps affect `B_roll_window`s.
- Transition bridge opportunities affect `transition_window` candidates.
- SoundSync cue opportunities affect music/SFX permission windows.
- Conflicts can downgrade opportunities before skill planning.

## Opportunity Relationship To Source/Proof Safety

Rules:

- `proof_claim`, `result_or_metric_claim`, article, evidence, browser, dashboard, and source moments must carry source status.
- Unknown source cannot be treated as verified proof.
- User-provided claims may need safe wording or confirmation.
- Browser/app visuals must not invent exact UI, screens, metrics, pricing, or labels.
- Reference video cannot become copied B-roll or copied visual sequence.
- Sensitive/private data needs redaction planning later.
- Opportunity detection must flag source risk before creative concept ideation.

## Opportunity Relationship To Credit/Approval

- Opportunities do not reserve or spend credits.
- Opportunities can estimate likely credit tendency.
- Premium opportunities should be marked early.
- Optional premium opportunities should carry lower-cost alternative notes.
- Credit-sensitive users may still see premium ideas, but as optional and approval-gated.
- No generation happens before approval.

## Opportunity Relationship To User Questions

Opportunity detection should ask for user input later when:

- Source/proof is unclear.
- Claim sensitivity is unclear.
- User preference conflicts exist.
- Product or brand name is missing.
- Target audience is unclear.
- CTA or offer is unclear.
- Whether captions/music/B-roll/3D are allowed is uncertain.
- Generated/premium idea may be expensive.
- Reference influence is unclear.
- Exact text, quote, or metric needs confirmation.

## Documentation-only Pseudo-record: OpportunityUserQuestion

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, opportunity detector logic, skill resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable question ID. | `opp_question_001` |
| `opportunity_id` | Required | Related opportunity. | `opp_proof_claim_002` |
| `question_type` | Required | Question category. | `source_confirmation` |
| `question_text` | Required | User-facing question. | `Can we show the 32% result as a sourced claim?` |
| `answer_options` | Optional | Possible answers. | `yes_source_backed, use_safe_wording, remove_claim` |
| `why_needed` | Required | Why the question matters. | `Unknown source cannot become verified proof.` |
| `blocks_next_step` | Required | Whether it blocks next step. | `true` |
| `affected_skill_families` | Required | Affected families. | `graphic_design, b_roll, caption` |
| `status` | Required | Question status. | `needs_user_input` |
| `metadata_json` | Optional | Future flexible metadata. | `{\"metric\":\"32%\"}` |

## Opportunity Duplicate And Repetition Model

Duplicate/repetition checks:

- Duplicate opportunity in the same segment.
- Same spoken phrase produces multiple identical opportunities.
- Same visual idea opportunity repeated across segments.
- Same hero opportunity repeated too often.
- Same B-roll gap detected without reason.
- Same 3D candidate repeated mechanically.
- Same caption emphasis repeated mechanically.
- Same transition bridge repeated mechanically.

Actions:

- `merge_duplicate`
- `keep_as_variant`
- `reject_repeated`
- `lower_priority`
- `preserve_if_intentional_pattern`
- `handoff_to_storytiming`

## Documentation-only Pseudo-record: VisualOpportunityEngineRun

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, opportunity detector logic, skill resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable run ID. | `opp_run_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `source_input_summary` | Required | Summary of inputs used. | `Transcript, mock visual observations, preference snapshot, platform.` |
| `edit_preference_snapshot_id` | Optional | Preference snapshot reference. | `resolved_pref_042` |
| `workflow_context` | Required | Workflow context. | `Product Demo` |
| `platform` | Required | Platform. | `vertical social` |
| `opportunity_count` | Required | Count of detected opportunities. | `14` |
| `high_priority_count` | Required | High-priority count. | `4` |
| `hero_candidate_count` | Required | Hero candidate count. | `1` |
| `restraint_count` | Required | Restraint opportunity count. | `3` |
| `needs_user_input_count` | Required | User input count. | `2` |
| `source_risk_count` | Required | Source/proof risk count. | `2` |
| `top_opportunity_ids` | Optional | Top opportunity IDs. | `opp_product_feature_001, opp_hero_001` |
| `rejected_opportunity_ids` | Optional | Rejected opportunity IDs. | `opp_repeated_003` |
| `run_confidence` | Required | Overall confidence. | `medium` |
| `created_by_agent` | Required | Agent or process label. | `docs_only_future_planner` |
| `status` | Required | Run status. | `planning_only` |
| `metadata_json` | Optional | Future flexible metadata. | `{\"notes\":\"mock-only example\"}` |

## Documentation-only Pseudo-record: VisualOpportunityScoreReview

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, opportunity detector logic, skill resolver logic, catalog storage, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable score review ID. | `opp_score_001` |
| `opportunity_id` | Required | Related opportunity. | `opp_product_feature_001` |
| `meaning_relevance_score` | Required | Meaning score. | `9` |
| `story_importance_score` | Required | Story score. | `8` |
| `viewer_clarity_gain_score` | Required | Clarity score. | `8` |
| `proof_or_context_gain_score` | Required | Proof/context score. | `6` |
| `emotional_impact_score` | Required | Emotional score. | `4` |
| `visual_wow_potential_score` | Required | Wow score. | `7` |
| `screen_fit_score` | Required | Screen fit score. | `8` |
| `edit_preference_fit_score` | Required | Preference fit score. | `7` |
| `workflow_fit_score` | Required | Workflow fit score. | `9` |
| `platform_fit_score` | Required | Platform fit score. | `7` |
| `novelty_score` | Required | Novelty score. | `6` |
| `feasibility_score` | Required | Feasibility score. | `8` |
| `credit_fit_score` | Required | Credit fit score. | `7` |
| `source_safety_score` | Required | Source safety score. | `6` |
| `restraint_score` | Required | Restraint score. | `3` |
| `risk_score` | Required | Combined risk score. | `22` |
| `final_priority_band` | Required | Priority band. | `high` |
| `scoring_reason` | Required | Why score was assigned. | `Feature is central, source UI appears available, and low-cost callout fits preference.` |
| `reviewer_notes` | Optional | Notes. | `Ask user before exact metric claim.` |
| `metadata_json` | Optional | Future flexible metadata. | `{\"formula\":\"docs_v1\"}` |

## Opportunity QA

Opportunity QA checks:

- Opportunity has source/context.
- Opportunity is not just "add effect."
- Opportunity is tied to transcript, visual observation, audio observation, story beat, user instruction, or preference.
- Opportunity type is canonical.
- Possible skill families use canonical keys.
- Possible skill keys use canonical keys.
- Source/proof risk is flagged.
- User preference is considered.
- Credit sensitivity is considered.
- No-op/restraint is considered.
- Duplicate opportunities are merged or justified.
- High-priority/hero opportunities are earned.
- Reference DNA is not copied.
- Opportunity does not bypass approval.
- Opportunity is handed off to concept ideation, not execution.

Blocking examples:

- Opportunity implies generation/execution before approval.
- Proof opportunity has unknown source but is treated as verified.
- Reference opportunity copies exact visual sequence.
- Opportunity uses non-canonical skill family/skill key.
- User blocked related skill but opportunity ignores it.

Warning examples:

- Opportunity is vague.
- Opportunity may duplicate another opportunity.
- Opportunity confidence is low.
- Opportunity lacks lower-cost alternative note.
- Hero candidate may be too frequent.

## Examples

| Example | opportunity_type | source_type | evidence_support_level | confidence | why_this_moment_matters | possible_skill_families | possible_skill_keys | no_op_possible | source_or_proof_risk | priority_band | next_step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Spoken product feature | `product_feature` | `transcript_derived` | `direct_transcript` | `high` | Feature is central to viewer understanding. | `graphic_design, b_roll, caption` | `feature_callout_design, source_b_roll_selection` | `true` | `medium: UI must be source-backed` | `high` | Hand off to creative concept ideation. |
| Abstract transformation | `abstract_concept` | `transcript_derived` | `direct_transcript` | `medium` | Transformation idea could become visual metaphor. | `graphic_design, three_d_visuals, stroke_motion` | `graphic_design_visual_explain, three_d_symbolic_metaphor` | `true` | `low` | `medium` | Generate restrained and premium concepts. |
| Real estate room walkthrough | `spoken_place_or_location_reference` | `visual_observation_derived` | `direct_visual_observation` | `high` | Room details support property value. | `b_roll, soundsync, transition` | `source_b_roll_selection, ambient_bridge_transition` | `true` | `low` | `high` | Prioritize source B-roll/context. |
| Marketing proof claim | `proof_claim` | `transcript_derived` | `claimed_by_user` | `needs_user_confirmation` | Claim could improve trust if safe. | `graphic_design, b_roll, caption, qa` | `proof_card_design, source_safety_qa` | `true` | `high: needs source confirmation` | `needs_user_confirmation` | Ask source/proof question. |
| Browser/app mention | `screen_ui_moment` | `transcript_derived` | `direct_transcript` | `medium` | Screen visual could clarify product flow. | `browser_app_visuals, graphic_design` | `browser_annotation_design, source_status_planning` | `true` | `high: exact UI cannot be invented` | `medium` | Handoff with source caution. |
| Education concept | `teaching_moment` | `transcript_derived` | `direct_transcript` | `high` | Framework needs visual clarity. | `graphic_design, caption, motion_design` | `framework_diagram_design, caption_keyword_emphasis` | `true` | `medium if factual claims exist` | `high` | Generate diagram concepts. |
| Emotional pause | `no_op_restraint_opportunity` | `audio_observation_derived` | `direct_visual_observation` | `high` | Silence and face expression carry trust. | `story_timing, qa, core_editing` | `clean_cuts, room_tone_preservation` | `true` | `low` | `high` | Create restraint opportunity. |
| Long talking head | `visual_monotony_risk` | `source_sequence_derived` | `source_clip_context` | `medium` | Viewer may need visual variety. | `b_roll, graphic_design, no_op_restraint_opportunity` | `source_b_roll_selection, no_b_roll` | `true` | `medium if B-roll is filler` | `medium` | Use source B-roll only if relevant. |
| Major launch line | `hero_reveal_moment` | `transcript_derived` | `direct_transcript` | `high` | Launch line may deserve one memorable payoff. | `three_d_visuals, real_motion, soundsync, story_timing` | `three_d_hero_reveal, real_motion_hero_moment` | `true` | `premium approval required` | `hero_candidate` | Hand off with lower-cost alternative. |
| Awkward cut | `transition_bridge` | `source_sequence_derived` | `source_clip_context` | `medium` | Cut may need continuity. | `transition, soundsync, b_roll` | `clean_cut_transition, sound_bridge_transition` | `true` | `low` | `medium` | Compare clean cut and bridge concepts. |
| Missing concrete B-roll | `B_roll_gap` | `transcript_derived` | `direct_transcript` | `medium` | Concrete object lacks support visual. | `b_roll, three_d_visuals, graphic_design` | `source_b_roll_selection, three_d_object_broll` | `true` | `medium: generated/3D needs approval` | `medium` | Prefer source B-roll, optional 3D. |
| Low-credit conversion | `lower_cost_alternative_moment` | `edit_preference_derived` | `user_instruction` | `high` | Premium 3D idea conflicts with low-credit preference. | `graphic_design, b_roll, approval_credit` | `graphic_design_visual_explain, lower_cost_alternative_planning` | `true` | `low` | `high` | Convert to graphic/B-roll alternative. |

## Anti-patterns

- Opportunity is just an effect request.
- Opportunity selects a tool directly.
- Opportunity selects a provider directly.
- Opportunity skips creative concept ideation.
- Opportunity becomes a skill route without planning contract.
- Opportunity ignores user preference.
- Opportunity ignores source/proof risk.
- Opportunity copies reference video.
- Opportunity treats unknown evidence as verified.
- Every sentence becomes a hero opportunity.
- Every pause becomes B-roll opportunity.
- Every object mention becomes 3D.
- No restraint opportunities are recorded.
- Duplicate opportunities are not merged.
- Low-confidence opportunity is treated as high-confidence.
- Opportunity triggers generation before approval.
- Opportunity detector is implemented in a docs-only prompt.

## Future Implementation Notes

Possible future records, tables, or types:

- `visual_opportunity_engine_runs`
- `visual_opportunities`
- `visual_opportunity_score_reviews`
- `restraint_opportunities`
- `opportunity_user_questions`
- `opportunity_duplicate_reviews`
- `creative_concept_candidates` references
- `edit_plan_skill_routes` references
- `rejected_skill_candidates` references
- `storytiming_coordination` references
- `edit_preference_snapshot` references
- `source/proof safety` references
- `credit_estimate` references later

This document does not create those records now. Future schema/types must avoid duplicating this document's source-of-truth. Runtime opportunity detection remains future gated work. Opportunity detection is planning metadata, not execution.

## Duplicate And Missing-file Notes

Current overlap already exists in docs and code, but no dedicated Visual Opportunity Engine contract exists in this repo snapshot.

Relevant existing owners include RP-SKILLS-01 through RP-SKILLS-13 docs, `source-of-truth-map.md`, `duplicate-lane-checklist.md`, `src/lib/adaptive-edit-strategy.ts`, `src/lib/mock-planner.ts`, `src/lib/professional-editing-ontology.ts`, `src/lib/intent-compiler.ts`, `src/lib/planner-validation.ts`, `src/lib/prompt-builders.ts`, `src/lib/workflow-profiles.ts`, and the existing type surfaces under `src/types/`.

Existing overlap mentions visual/audio/story opportunity, hero moments, source/proof safety, visual monotony risk, adaptive strategy, StoryTiming focus windows, B-roll gaps, transition bridges, and source safety. Future prompts must reference those owners instead of creating a competing runtime detector.

Requested source-truth file status:

- `audio-library-and-licensing.md` exists.
- `soundsync-music-intelligence.md` is missing in the current repo snapshot.
- `music-reference-dna.md` is missing in the current repo snapshot.
- `lyria-music-generation-plan.md` is missing in the current repo snapshot.

## RP-SKILLS-15 Handoff

Recommended next prompt:

`RP-SKILLS-15 - Creative Concept Ideation Contract`

Scope:

Docs-only creative concept ideation contract that defines how the planner generates multiple creative concept candidates from visual opportunities before selecting skills: concept title, visual role, skill-family candidates, screen relationship, motion/audio relationship, wow factor, restraint option, lower-cost alternative, why selected, why rejected, credit tendency, approval tendency, and QA handoff.

Forbidden scope for `RP-SKILLS-15` unless explicitly authorized later:

- Supabase migrations or SQL.
- Runtime code.
- TypeScript implementation.
- React UI.
- Provider calls.
- Workers, jobs, leases, or runtime gates.
- Package installs or package file mutations.
- Opportunity detector runtime, skill resolver runtime, creative concept runtime, schema/runtime behavior, preference runtime, settings UI, profile storage, runtime orchestration, render/export runtime, media processing, audio generation, music generation, SFX generation, caption rendering, browser/capture/media/generation runtime, prompt router changes, Playwright execution, animation code, design-token changes, or app behavior.
