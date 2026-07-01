# Universal Skill Planning Contracts

## Purpose

This document defines the universal planning contract for every future ReeditPro Creative Skill.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, package changes, Supabase connections, SQL, credentials, render/export logic, browser/WebGL/canvas runtime, or execution behavior.

The universal contract is the shared planning envelope that later specialized skill contracts inherit. It protects ReeditPro from random effects, duplicated logic, unplanned execution, and skill routes that bypass intent, StoryTiming, credit, approval, QA, or worker boundaries.

## Core Rule

No skill should execute from only a skill name.

Every selected skill must first become a planned creative decision with:

- Reason.
- Timing.
- Screen/composition relationship.
- User preference alignment.
- Audio relationship if relevant.
- Tool/worker strategy.
- Credit/approval behavior.
- QA checks.
- Revision behavior.

A skill name can start investigation. It cannot start generation, rendering, provider calls, worker dispatch, credit reservation, credit spend, or final export.

## Universal Skill Planning Lifecycle

Every future skill plan should follow this lifecycle:

1. Input context collected.
2. Visual/audio/story opportunity identified.
3. Creative concept candidates generated.
4. Skill candidate selected or rejected.
5. Universal skill planning contract created.
6. Specialized planning contract attached later if needed.
7. StoryTiming / composition coordination checks conflicts.
8. Tool candidates ranked.
9. Credit estimate created.
10. User approval requested if needed.
11. Future job/worker execution only after approval.
12. QA checks created.
13. Preview reviewed.
14. Revision maps back to affected skill plan.

This prompt defines only the planning contract foundation. It does not execute skills.

## Required Input Context

Every future skill planner should consider this input context before selecting or rejecting a skill:

| Context | Why it matters |
| --- | --- |
| `project_id` | Ties the skill plan to a project and future audit trail. |
| `edit_plan_id` | Keeps the skill inside the approved or draft edit plan. |
| `segment_id` | Limits the skill to the relevant edit-plan segment. |
| `source_clip_ids` | Preserves source truth and source-order context. |
| `transcript_segment_ids` | Anchors the skill to spoken meaning and timing. |
| `visual_observations` | Identifies faces, objects, screens, camera motion, product details, and visual risks. |
| `audio_observations` | Identifies speech clarity, silence, music, ambience, noise, and ducking needs. |
| `story_beat` | Explains what the moment is doing in the edit. |
| `workflow_context` | Guides expectations without forcing a skill. |
| `platform` | Shapes pacing, readability, aspect ratio, density, and delivery constraints. |
| `aspect_ratio` | Determines safe zones, placement, captions, and composition choices. |
| `edit_level` | Sets complexity, review depth, provider eligibility, and credit posture. |
| `user_custom_instruction` | Direct instructions override skill defaults. |
| `resolved_edit_preference_snapshot` | Captures project/workspace preference, avoid rules, density, style, and wow-factor target. |
| `reference_dna` | Provides safe style guidance without copying shots, lyrics, timing, or structure. |
| `credit_preference` | Helps choose full, subtle, optional, delayed, or lower-cost routes. |
| `existing_selected_skills_in_time_range` | Prevents clutter, repetition, and collisions. |
| `safe_zones_face_zones_object_zones` | Protects faces, captions, product details, UI, and important source visuals. |
| `prior_skill_usage_repetition_state` | Avoids mechanical reuse of the same trick across segments. |

## UniversalSkillPlan Pseudo-Record

`UniversalSkillPlan` is a documentation-only pseudo-record. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable planning identifier for this skill plan. | `usp_segment_03_3d_product_reveal` |
| `project_id` | Required | Project that owns the plan. | `project_lake_como_listing` |
| `edit_plan_id` | Required | Draft or approved edit plan that contains the skill plan. | `edit_plan_v4` |
| `edit_plan_segment_id` | Required | Segment where the skill is considered. | `segment_03` |
| `skill_key` | Required | Specific skill candidate. | `3d_overlay_integration` |
| `skill_family` | Required | Larger family for routing and future specialized contracts. | `3d_visual` |
| `skill_plan_status` | Required | Planning status from the status model below. | `selected` |
| `visual_opportunity_id` | Optional | Opportunity that led to this skill candidate. | `opportunity_product_transformation` |
| `creative_concept_id` | Optional | Selected or rejected concept reference. | `concept_module_emerges_from_screen` |
| `planning_reason` | Required | Human-readable reason the skill belongs or does not belong. | `The product transformation line needs one premium visual beat.` |
| `creative_intent` | Required | Editorial purpose of the skill. | `Make the workflow change visible without turning the whole edit into spectacle.` |
| `why_this_skill` | Required | Why this skill is the right capability. | `3D can show the product module as a tangible object.` |
| `why_here` | Required | Why this moment is the right placement. | `The speaker names the product benefit for the first time.` |
| `why_now` | Required | Why the skill should occur at this timing. | `It lands after the phrase "changes the workflow."` |
| `why_not_simpler` | Required | Why a simpler route is insufficient, or why simpler won. | `A caption alone would not show the transformation.` |
| `why_not_bigger` | Required | Why the plan avoids overuse or stronger spectacle. | `A full environment reveal would distract from the app screen.` |
| `user_preference_alignment` | Required | How the plan follows project or user preferences. | `Matches premium tech preference and avoids flashy viral pacing.` |
| `reference_dna_alignment` | Optional | How safe style inspiration applies without copying. | `Uses calm premium motion, not the reference's exact reveal timing.` |
| `workflow_context_alignment` | Required | How workflow context shapes the decision. | `Product demo needs clarity around the feature.` |
| `story_or_meaning_alignment` | Required | How the skill supports the story beat. | `Makes investment and transformation feel concrete.` |
| `restraint_decision` | Required | Restraint decision from the model below. | `use_subtle` |
| `timing_summary` | Required | Summary of start/end/anchor/timing behavior. | `Starts after "major investment"; holds 2.5 seconds; exits before CTA.` |
| `composition_summary` | Required for visual skills | Placement, zones, layers, edge, and safety summary. | `Right third, below eye line, soft edge, no face overlap.` |
| `audio_relationship_summary` | Required when relevant | Music, SFX, ambience, ducking, or speech-safety relationship. | `No SFX under speech; light music swell after phrase.` |
| `tool_strategy_summary` | Required | Planning-only tool/worker candidate summary. | `Future Remotion/3D/compositing route; no runtime execution here.` |
| `credit_impact` | Required | Credit impact from the credit model below. | `high` |
| `approval_required` | Required | Whether explicit approval is needed before execution. | `true` |
| `approval_status` | Required | Approval state for this skill plan. | `awaiting_approval` |
| `qa_required` | Required | Whether QA checks must be created. | `true` |
| `revision_allowed` | Required | Whether revisions can target this plan. | `true` |
| `worker_notes` | Optional | Future worker-safe notes. | `Load approved plan by ID; do not infer placement from raw prompt.` |
| `must_follow_rules` | Required | Non-negotiable constraints. | `Do not cover face; do not start provider call before approval.` |
| `avoid_rules` | Required | Things the skill must avoid. | `Avoid hard-edge card; avoid loud transition SFX.` |
| `created_by_agent` | Required | Planning agent or human that created the plan. | `creative_skill_planner` |
| `status` | Required | General record status if separate from skill plan status. | `active` |
| `metadata_json` | Optional | Documentation-only placeholder for future extra metadata. | `{ "source": "docs-only example" }` |

## Planning Status Model

| Status | When to use |
| --- | --- |
| `draft` | The skill plan exists but is incomplete. |
| `candidate` | The skill is being considered but is not selected. |
| `selected` | The skill is planned as part of the edit proposal. |
| `rejected` | The skill was considered and intentionally not used. |
| `blocked_by_user` | A user instruction blocks the skill. |
| `blocked_by_budget` | Credit preference or budget blocks the skill. |
| `blocked_by_missing_input` | Required source, transcript, layout, timing, or preference context is missing. |
| `blocked_by_policy` | Policy, provider, reference, privacy, source truth, or tier rules block the skill. |
| `awaiting_user_input` | The planner needs a user choice before selection. |
| `awaiting_approval` | The skill is planned but cannot execute before approval. |
| `approved` | The user approved the plan and credit behavior. |
| `ready_for_execution_later` | The approved plan is ready for future worker/runtime execution. |
| `superseded` | A newer plan replaced this skill plan. |
| `cancelled` | The user or planner removed the skill plan from consideration. |

## Restraint Decision Model

| Decision | Meaning | When to use | Example |
| --- | --- | --- | --- |
| `use_full` | The skill should be a primary creative move. | The story beat justifies a strong moment. | A product launch hero moment deserves a planned premium 3D reveal. |
| `use_subtle` | The skill should stay quiet, secondary, or refined. | The skill helps but should not dominate. | A luxury property overlay should be restrained and premium. |
| `use_optional` | The skill is good but should be presented as optional. | It is credit-heavy or taste-sensitive. | Real Motion or 3D is helpful but should be removable. |
| `delay` | The skill may fit later, not now. | The current phrase needs clarity or a quieter beat first. | A graphic card should wait until after an important spoken phrase. |
| `replace_with_simpler_skill` | A lighter skill solves the need better. | Cost, screen density, tone, or timing makes the original too heavy. | Use graphic design instead of 3D to lower cost. |
| `do_not_use` | The skill is not justified. | It would distract, collide, repeat, or violate preference/policy. | A serious emotional pause should stay clean. |

## Planning Reason Requirements

A good planning reason must answer:

- What is happening in the segment?
- What is the spoken or visual meaning?
- What opportunity was detected?
- Why is this skill useful?
- Why does it fit the user's edit preference?
- Why does it fit the screen?
- Why is the intensity appropriate?
- Why is this not random decoration?
- What would make the skill amateur if misused?

Bad example:

> Add cool 3D here.

Good example:

> The speaker describes the product as transforming workflow. A subtle 3D product module emerging from the app screen makes that transformation visible, fits the premium tech preference, avoids the speaker's face, and is limited to a short hero moment so the rest of the edit stays clean.

## Timing Plan Envelope

These shared timing fields may be needed by any skill plan. Transition-specific detail belongs to `RP-SKILLS-03`.

| Field | Purpose |
| --- | --- |
| `start_time_seconds` | Planned start time in the edit timeline. |
| `end_time_seconds` | Planned end time in the edit timeline. |
| `duration_seconds` | Duration of the skill moment. |
| `timing_anchor_type` | Anchor type such as transcript phrase, story beat, visual action, cut point, or music beat. |
| `timing_anchor_text` | Human-readable anchor text. |
| `transcript_anchor_id` | Transcript segment or phrase anchor. |
| `story_beat_anchor_id` | Story beat anchor. |
| `music_beat_anchor` | Music beat, cue, or bar reference if relevant. |
| `entry_timing` | How the skill enters. |
| `hold_timing` | How long it remains readable or emotionally useful. |
| `exit_timing` | How it exits without hurting the next beat. |
| `transition_in` | Planning-only summary of the incoming transition relationship. |
| `transition_out` | Planning-only summary of the outgoing transition relationship. |
| `sync_precision_needed` | Whether frame, phrase, beat, or loose timing is required. |

## Composition Plan Envelope

These shared composition fields may be needed by any visual skill plan. Full overlay/compositing detail belongs to `RP-SKILLS-04`.

| Field | Purpose |
| --- | --- |
| `screen_zone` | Target area such as lower third, right third, center, full frame, or background. |
| `safe_area_strategy` | How the skill respects platform and frame safety. |
| `face_avoidance_required` | Whether faces must remain uncovered. |
| `object_avoidance_required` | Whether products, UI, hands, proof visuals, or important objects must remain clear. |
| `caption_collision_strategy` | How captions stay readable. |
| `foreground_background_relationship` | Whether the skill sits in front of, behind, beside, or around source footage. |
| `depth_relationship` | Flat, layered, spatial, tracked, or integrated depth relationship. |
| `hard_edge_or_soft_edge` | Edge style for layout and compositing. |
| `edge_treatment_notes` | Notes for border, feather, glow, mask, or panel edge behavior. |
| `blend_mode_notes` | Notes for visual blending if relevant. |
| `opacity_notes` | Transparency or opacity guidance. |
| `shadow_or_contact_notes` | Shadow, contact, grounding, and realism notes. |
| `tracking_or_masking_needed` | Whether future tracking/masking is required. |
| `layer_order` | Planned z-order or stacking relationship. |
| `aspect_ratio_constraints` | Constraints caused by vertical, square, or horizontal output. |

## Audio Relationship Envelope

These shared audio fields may be needed by any skill plan. Full sound/music detail belongs to `RP-SKILLS-10`.

| Field | Purpose |
| --- | --- |
| `music_relationship` | Whether music drives, supports, stays neutral, ducks, or is absent. |
| `sfx_relationship` | Whether SFX supports the skill, is optional, or is avoided. |
| `speech_safety` | How speech remains clear. |
| `ducking_needed` | Whether music/SFX must duck around speech. |
| `ambient_preservation` | How source ambience should be preserved or repaired. |
| `room_tone_preservation` | How room tone continuity should be protected. |
| `beat_sync_needed` | Whether timing should sync to beats. |
| `avoid_under_speech` | Whether audio events must avoid key spoken words. |
| `audio_qa_notes` | QA notes for speech, loudness, noise, or emotional tone. |

## Tool Strategy Envelope

These fields are planning metadata only. Tool candidates do not execute anything. Future workers must load approved records by ID. Provider/tool execution stays behind future approval and worker boundaries.

| Field | Purpose |
| --- | --- |
| `tool_candidates` | Ranked list of possible tool families or render approaches. |
| `preferred_tool_family` | Preferred family if approved and available. |
| `fallback_tool_family` | Safer or lower-cost fallback family. |
| `deterministic_renderer_preferred` | Whether exact layout/text/timing favors deterministic rendering. |
| `ai_generation_required` | Whether generative AI is required or avoidable. |
| `future_worker_target` | Future worker family, not a live dispatch. |
| `runtime_readiness` | Planning-only readiness status such as docs-only, mock, planned, blocked, or future. |
| `provider_dependency` | Whether external provider output may be needed later. |
| `editable_output_required` | Whether the output should remain editable. |
| `transparent_overlay_required` | Whether transparent overlay output is needed. |
| `word_timing_required` | Whether word-level timing is required. |
| `browser_or_screen_source_required` | Whether authorized browser/screen source capture is required. |
| `manual_review_required` | Whether the user or QA must inspect before execution/export. |

## Credit And Approval Envelope

| Field | Purpose |
| --- | --- |
| `credit_impact` | One of `none`, `low`, `medium`, `high`, or `premium`. |
| `estimate_required` | Whether the skill must appear in a credit estimate. |
| `approval_required` | Whether explicit approval is required before execution. |
| `premium_skill` | Whether the skill is premium or credit-heavy. |
| `can_remove_to_lower_cost` | Whether the user can remove it to reduce cost. |
| `lower_cost_alternative` | Simpler route that preserves meaning. |
| `approval_group` | Grouping for approval UI or future records. |
| `approval_copy` | Human-readable approval text. |
| `credit_reason` | Why the skill costs what it costs. |

Credit estimates come before generation. Credits are not reserved or spent until approval. Premium skills should be itemized. Optional heavy skills should have downgrade or remove alternatives.

## QA Envelope

| Field | Purpose |
| --- | --- |
| `qa_required` | Whether QA checks must be created. |
| `qa_check_types` | Universal and skill-specific QA categories. |
| `blocks_preview_if_failed` | Whether a failed check blocks preview. |
| `user_preference_compliance_check` | Confirms direct instructions and preferences were honored. |
| `visual_density_check` | Confirms the edit is not cluttered or underwhelming for the target. |
| `repetition_check` | Confirms skills are not repeated mechanically. |
| `safe_area_check` | Confirms face, object, caption, and platform safety where relevant. |
| `speech_safety_check` | Confirms audio does not harm speech clarity. |
| `credit_compliance_check` | Confirms credit estimate and approval gates are respected. |
| `reference_copy_check` | Confirms Reference DNA was not copied shot-for-shot. |
| `skill_specific_qa_notes` | Placeholder for future specialized QA. |

Universal QA examples:

- Visual earned by story.
- Not random decoration.
- Visual density balanced.
- Skill not repeated mechanically.
- User instruction honored.
- Credit and approval compliance.
- Reference not copied.
- Captions, face, object, and speech safety if relevant.

## Revision Envelope

| Field | Purpose |
| --- | --- |
| `revision_allowed` | Whether a revision can target this plan. |
| `revision_scope` | What can change without replacing the whole plan. |
| `revision_cost_behavior` | Whether revision is free, re-estimated, or requires new approval. |
| `affected_skill_plan_ids` | Skill plans affected by the revision. |
| `affected_concept_ids` | Creative concepts affected by the revision. |
| `affected_tool_strategy` | Tool strategy affected by the revision. |
| `requires_new_approval` | Whether the revision needs new approval. |
| `safe_revision_options` | Safe alternatives the user can request. |

Examples:

- Make 3D less flashy.
- Replace 3D with graphic design.
- Lower credit cost.
- Remove transition SFX.
- Soften overlay edge.
- Move caption zone.
- Make visual idea more premium.
- Make visual idea more restrained.

## RejectedSkillCandidate Pseudo-Record

`RejectedSkillCandidate` is a documentation-only pseudo-record. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Description | Example value |
| --- | --- | --- |
| `skill_key` | Skill that was considered. | `3d_hero_reveal` |
| `segment_id` | Segment where it was considered. | `segment_02` |
| `opportunity_id` | Opportunity that raised the candidate. | `opportunity_emotional_pause` |
| `concept_id` | Creative concept considered. | `concept_glass_stage_reveal` |
| `rejection_reason` | Why it was rejected. | `Too much spectacle for a serious pause.` |
| `restraint_decision` | Restraint decision that applies. | `do_not_use` |
| `future_reconsideration_condition` | When to reconsider. | `Only if user asks for a more cinematic premium version.` |

Rejected skill candidates should sometimes be stored because they prove restraint, avoid repeated reconsideration, help the user understand why the AI did not use everything, and support revision alternatives.

## Conflict And Coordination Handoff

Each universal skill plan must hand off to future StoryTiming coordination. The full StoryTiming coordination contract belongs to `RP-SKILLS-11`.

Each skill plan should declare:

- Visual footprint.
- Audio footprint.
- Caption footprint.
- Timing footprint.
- Credit footprint.
- Conflict risks.

Examples:

- 3D overlay conflicts with lower-third captions.
- Graphic card should not appear during a transition.
- SFX should not hit under key speech.
- B-roll cutaway may hide a facial emotion.
- Music swell may conflict with a serious pause.

StoryTiming remains the coordination owner. The skill contract should describe its footprint and risks, not create a parallel timing authority.

## Specialized Contract Inheritance

| Future contract | Prompt id | What it adds | Why it must not duplicate universal fields |
| --- | --- | --- | --- |
| Transition contract | `RP-SKILLS-03` | Cut point, duration, hard/soft edge, motion direction, beat anchor, ambient bridge, SFX relationship, no-random-transition QA. | It inherits reason, timing envelope, audio relationship, credit, approval, QA, and revision fields. |
| Overlay/compositing contract | `RP-SKILLS-04` | Edge detail, masks, tracking, blend, contact shadow, layer order, collision handling. | It extends composition fields instead of redefining the whole skill plan. |
| Graphic design contract | `RP-SKILLS-05` | Layout hierarchy, type, exact text, proof cards, chart/diagram/card constraints. | It inherits story, preference, timing, approval, and QA fields. |
| Motion design contract | `RP-SKILLS-06` | Motion language, easing, choreography, readability windows, renderer expectations. | It inherits timing, composition, tool, and QA envelopes. |
| 3D visual contract | `RP-SKILLS-07` | 3D role, object, camera, light, material, tracking, occlusion, composite feasibility. | It extends 3D/composition concerns without duplicating universal credit/approval and reason fields. |
| B-roll contract | `RP-SKILLS-08` | Source/generated B-roll choice, meaning preservation, cutaway timing, source truth, licensing/provenance. | It inherits lifecycle, timing, QA, and revision behavior. |
| Caption contract | `RP-SKILLS-09` | Caption text, phrase timing, animation, readability, collision zones, platform style. | It inherits timing, composition, preference, and QA envelopes. |
| Sound/music contract | `RP-SKILLS-10` | Music role, cue sheet, beat map, SFX policy, ducking, ambience, loudness, speech safety. | It extends audio fields while inheriting reason, approval, credit, QA, and revision fields. |
| StoryTiming coordination contract | `RP-SKILLS-11` | Conflict graph, timing authority, footprints, dependencies, adjustment rules, render manifest handoff. | It coordinates skill footprints rather than redefining each skill plan. |

## Examples

### Example 1: 3D Overlay Integration

| Field | Example |
| --- | --- |
| `skill_key` | `3d_overlay_integration` |
| `planning_reason` | The speaker presents the property as a major investment. A restrained 3D glass-house blueprint beside the real footage makes the premium value tangible without covering the agent's face. |
| `restraint_decision` | `use_optional` |
| `timing_summary` | Start after the phrase "major investment"; hold 2.5 seconds; exit before the next room cut. |
| `composition_summary` | Right third, soft edge, no face overlap, below caption zone, subtle contact shadow. |
| `audio_relationship_summary` | Light music swell after the phrase; no SFX under speech. |
| `credit_impact` | `high` |
| `approval_required` | `true` |
| `QA checks` | 3D role defined, face-safe placement, caption collision, composite feasibility, credit approval, visual earned by story. |

### Example 2: Transition Restraint

| Field | Example |
| --- | --- |
| `skill_key` | `transition_design` |
| `planning_reason` | The edit moves from a serious client quote into a proof shot. A subtle clean cut with ambient bridge protects the emotion better than a flashy transition. |
| `restraint_decision` | `replace_with_simpler_skill` |
| `timing_summary` | Cut at sentence end; preserve a short breath before proof shot. |
| `composition_summary` | No visual transition overlay; maintain source framing. |
| `audio_relationship_summary` | Preserve room tone and carry ambience for continuity; no hit SFX. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `QA checks` | No random transition, speech/emotion preserved, timing clean, ambience continuity. |

### Example 3: Caption Animation Around 3D

| Field | Example |
| --- | --- |
| `skill_key` | `caption_animation` |
| `planning_reason` | A 3D hero visual needs screen space, so captions should become simpler and lower density during the reveal while remaining readable. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Reduce caption animation during the 3D hold; return to normal style after exit. |
| `composition_summary` | Caption zone moves to lower safe area, with shorter phrase chunks and no overlap with the hero object. |
| `audio_relationship_summary` | Speech remains primary; no sound cue needed. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `QA checks` | Caption readability, collision with 3D, visual density, user preference compliance. |

### Example 4: SoundSync / Music Restraint

| Field | Example |
| --- | --- |
| `skill_key` | `soundsync_music_planning` |
| `planning_reason` | The speaker explains a sensitive customer story. Ambience-only or very light ducked music protects speech clarity and avoids making the moment feel manipulative. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Keep music bed below speech; no beat hits during the key sentence. |
| `composition_summary` | No visual composition impact except preserving caption readability during the pause. |
| `audio_relationship_summary` | Ambience preserved, light bed ducked below speech, no SFX under important words. |
| `credit_impact` | `medium` |
| `approval_required` | `true` if custom music generation is proposed; otherwise `false` for planning-only mix guidance. |
| `QA checks` | Speech safety, ducking, ambience preservation, no random SFX, credit/approval compliance. |

## Anti-Patterns

Avoid these planning failures:

- Skill name only.
- Effect everywhere.
- Same animation repeated every segment.
- 3D without role.
- 3D without screen placement.
- Transition without story reason.
- Overlay without edge/safe-zone plan.
- Captions colliding with graphics.
- Music under important speech without ducking.
- Premium skill without credit estimate.
- Generation before approval.
- Reference copied shot-for-shot.
- Tool selected before creative concept.
- Worker execution from raw prompt only.

## Future RP-SKILLS Sequence

Recommended next prompt:

`RP-SKILLS-03 - Transition Planning Contract`

Scope for next prompt:

Docs-only specialized transition planning contract that inherits this universal contract and defines transition-specific fields like cut point, duration, hard/soft edge, motion direction, beat anchor, ambient bridge, SFX relationship, and no-random-transition QA.
