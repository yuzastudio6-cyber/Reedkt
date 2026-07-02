# Skill Route And Plan Assembly Contract

## Purpose

This document defines the future Skill Route and Plan Assembly contract for ReeditPro Creative Skill planning.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, skill route runtime, plan assembly runtime, skill resolver runtime, catalog runtime, package changes, Supabase connections, SQL, credentials, or app behavior.

The contract defines how selected skill candidates become future route records and required planning records. It does not execute skills. It does not create jobs. It does not create generation requests. It does not reserve or spend credits.

Skill Route and Plan Assembly hands off to future credit/approval, type-contract, schema, mock planner, and worker/job milestones. It prepares planning metadata only.

Core boundary: skill routes are not execution.

## Skill Route Doctrine

A skill route is an auditable planning decision.

A route links user intent, source context, opportunity, concept, skill candidate, segment/time range, and future planning contract. A route can be primary, support, optional, premium optional, lower-cost alternative, or no-action/restraint.

A route must never be created without a reason. A route must never execute a tool or provider. A route must not bypass StoryTiming, QA, approval, or credit estimate. A route should be specific enough for a future planner or worker to understand what needs to be planned next. A route should preserve rejected, blocked, and lower-cost alternatives for revision and cost control.

Core principle:

"Routes connect planning records; workers execute only after approval and future job orchestration."

## Position In Planning Flow

Route assembly sits after skill candidate scoring and before future schema/type implementation.

1. User intent and edit preference are collected.
2. Source sequence and media context are understood.
3. Visual Opportunity Engine detects opportunities.
4. Creative Concept Ideation selects and rejects concepts.
5. Skill Candidate Scoring / Resolver selects and rejects skill candidates.
6. Skill Route and Plan Assembly creates route intent and required plan record requirements.
7. StoryTiming coordination validates and coordinates route windows.
8. Credit estimate and approval happen later.
9. Future type/schema records happen later.
10. Future jobs/workers run only after approval later.
11. QA, preview, and revision happen later.

Route assembly happens after resolver. Route assembly happens before final credit estimate and approval. Route assembly does not execute or generate anything.

## Required Input Context

| Input | Why it matters |
| --- | --- |
| `project_id` | Keeps routes scoped to the current project. |
| `edit_plan_id` | Connects routes to the draft or approved edit plan. |
| `edit_plan_segment_id` | Places the route in a specific segment when applicable. |
| `source_clip_sequence_ids` | Preserves source order and source ownership. |
| `visual_opportunity_ids` | Preserves the opportunity trail. |
| `creative_concept_ids` | Ensures routes come after concept ideation. |
| `selected_skill_candidate_ids` | Ensures routes come from scored resolver output. |
| `rejected_skill_candidate_ids` | Preserves audit and revision alternatives. |
| `skill_candidate_bundles` | Carries multi-skill relationships. |
| `canonical_skill_taxonomy` | Ensures canonical family/key references. |
| `planning_contract_mappings` | Identifies required planning contracts. |
| `edit_preference_snapshot` | Applies preference, restraint, density, wow target, and credit sensitivity. |
| `StoryTiming_readiness` | Shows whether route windows need coordination. |
| `workflow_context` | Guides route role and professional fit. |
| `platform` | Affects safe zones, timing, density, and user-visible copy. |
| `aspect_ratio` | Shapes route placement and collision risk. |
| `source_proof_status` | Protects proof, browser/app, metric, testimonial, and source-sensitive routes. |
| `credit_preference` | Shapes lower-cost links and premium optional status. |
| `approval_constraints` | Identifies later approval requirements. |
| `QA_requirements` | Carries blocking and warning checks into route assembly. |
| `user_must_follow_rules` | Preserves direct instruction priority. |
| `user_avoid_rules` | Prevents route assembly from reviving avoided skills. |
| `lower_cost_alternatives` | Links premium routes to alternatives. |
| `runtime_readiness_notes` | Records future readiness without enabling runtime. |
| `revision_linkage_needs` | Keeps routes editable and auditable. |

## Route Decision Types

| Route decision type | What it means | When to use | Example |
| --- | --- | --- | --- |
| `primary_skill_route` | Main skill route for a concept. | One route carries the main idea. | Product feature graphic card. |
| `support_skill_route` | Supporting route for another route. | Motion, layout, audio, QA, or source safety supports the primary route. | Motion reveal supporting graphic card. |
| `optional_skill_route` | Useful but not required. | Skill adds polish but can be removed. | Subtle caption emphasis. |
| `optional_premium_skill_route` | Premium or heavy optional route. | 3D, Real Motion, generated media, or custom sound is not required. | 3D product breakout. |
| `lower_cost_alternative_route` | Cheaper replacement for premium route. | Credit sensitivity or approval uncertainty exists. | Graphic card instead of 3D. |
| `no_action_route` | Explicitly do nothing. | Extra work would weaken the edit. | No B-roll over emotional pause. |
| `restraint_route` | Planned restraint route. | User preference, tone, density, or source safety blocks more. | `no_3d`. |
| `blocked_route_reference` | Route reference kept for audit. | Candidate is blocked but should remain explainable. | Captions blocked by user. |
| `rejected_route_reference` | Rejected route kept for revision history. | Candidate was considered and rejected. | SFX rejected under speech. |
| `user_confirmation_route` | Route cannot proceed without user answer. | Source, metric, preference, brand, or approval is unclear. | Confirm proof metric before card. |
| `source_confirmation_route` | Route depends on source verification. | Browser/app/proof/source details are uncertain. | App screenshot annotation needs confirmation. |
| `StoryTiming_dependent_route` | Route needs StoryTiming before final route readiness. | Multi-layer or hero route affects focus. | 3D hero reveal bundle. |
| `QA_sensitive_route` | Route needs explicit QA requirements. | Face, caption, proof, source, speech, or credit risk is high. | Real Motion near a face. |

## Route Status Model

| Route status | Meaning |
| --- | --- |
| `draft` | Route is being assembled. |
| `proposed` | Route can be shown or reviewed. |
| `selected` | Route is selected for future planning. |
| `optional` | Route is optional. |
| `awaiting_user_input` | Route needs user answer before readiness. |
| `awaiting_approval` | Route needs later approval. |
| `approved_for_planning` | Route may proceed to planning records only. |
| `approved_for_future_execution_later` | Route still needs future credit/job gates before execution. |
| `rejected` | Route should not be used. |
| `blocked` | Route is blocked by user, source, policy, budget, or readiness. |
| `superseded` | Route was replaced by another route. |
| `cancelled` | Route was cancelled by user or revision. |
| `ready_for_credit_estimate` | Route has enough context for future estimate. |
| `waiting_StoryTiming` | Route waits on StoryTiming coordination. |
| `waiting_source_confirmation` | Route waits on source/proof confirmation. |
| `waiting_preference_resolution` | Route waits on preference conflict resolution. |
| `waiting_QA_review` | Route waits on QA. |

`approved_for_planning` does not mean approved for generation or execution. `approved_for_future_execution_later` still requires later credit, approval, and job gates. Rejected and blocked route references are useful for audit and revision.

## Documentation-only Pseudo-record: EditPlanSkillRoute

`EditPlanSkillRoute` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, route assembly logic, resolver logic, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable route identifier. | `route_001_graphic_card` |
| `project_id` | Required | Owning project. | `project_launch_demo` |
| `edit_plan_id` | Required | Owning edit plan. | `edit_plan_v4` |
| `edit_plan_segment_id` | Required when segment-scoped | Segment or plan area. | `segment_03` |
| `source_clip_sequence_ids` | Optional | Source clips used or protected. | `source_clip_02, source_clip_03` |
| `visual_opportunity_id` | Required | Source opportunity. | `opportunity_feature_reveal` |
| `creative_concept_id` | Required | Source creative concept. | `concept_feature_card` |
| `skill_candidate_id` | Required | Source skill candidate. | `skill_candidate_graphic_card` |
| `skill_key` | Required | Canonical skill key. | `graphic_design_visual_explain` |
| `skill_family` | Required | Canonical skill family. | `graphic_design` |
| `route_type` | Required | Route decision type. | `primary_skill_route` |
| `route_status` | Required | Route status. | `proposed` |
| `primary_or_support_role` | Required | Route role. | `primary_visual` |
| `route_reason` | Required | Why this route exists. | `Explain the product feature at the first clear mention.` |
| `planning_reason` | Required | Why planning records are required. | `A visible card needs hierarchy, timing, placement, and QA.` |
| `time_range_start_seconds` | Optional | Start time. | `42.4` |
| `time_range_end_seconds` | Optional | End time. | `45.2` |
| `duration_seconds` | Optional | Duration. | `2.8` |
| `timing_anchor_summary` | Required | Timing anchor. | `Starts after phrase "new feature".` |
| `planning_contract_type` | Required | Primary contract. | `graphic_design_planning_contract` |
| `secondary_planning_contracts` | Optional | Supporting contracts. | `overlay_compositing_planning_contract, motion_design_planning_contract` |
| `required_plan_record_types` | Required | Plan records future work must create. | `GraphicDesignSkillPlan, OverlayCompositionPlan, SkillRouteQARequirement` |
| `StoryTiming_readiness` | Required | StoryTiming state. | `needs_coordination` |
| `StoryTiming_window_id` | Optional | Future StoryTiming window. | `story_window_feature_01` |
| `visual_footprint_summary` | Required for visual routes | Visual footprint. | `Lower-third card in right safe zone.` |
| `audio_footprint_summary` | Required when relevant | Audio footprint. | `No SFX; speech remains primary.` |
| `text_footprint_summary` | Required when relevant | Text footprint. | `Two-line feature title, no exact metric.` |
| `motion_footprint_summary` | Required when relevant | Motion footprint. | `Soft reveal and exit before next cut.` |
| `source_safety_status` | Required | Source/proof status. | `source_verified` |
| `credit_tendency` | Required | Credit tendency. | `medium` |
| `approval_required` | Required | Whether later approval is expected. | `true` |
| `approval_scope` | Required | Approval scope. | `approval_needed_for_user_visible_plan` |
| `premium_optional` | Required | Whether route is optional premium. | `false` |
| `lower_cost_alternative_route_ids` | Optional | Linked alternatives. | `route_002_caption_only` |
| `related_route_ids` | Optional | Related routes. | `route_003_motion_support` |
| `conflicts_with_route_ids` | Optional | Conflicting routes. | `route_004_dense_caption` |
| `supports_route_ids` | Optional | Routes this route supports. | `route_005_proof_card` |
| `QA_requirement_ids` | Required | QA requirement references. | `route_qa_001, route_qa_002` |
| `revision_group_id` | Required | Revision grouping. | `revision_group_feature_visual` |
| `user_visible_summary` | Required | User-facing summary. | `Add a clean product feature card at the first feature mention.` |
| `worker_planning_notes` | Optional | Future worker-safe notes. | `No worker execution before approved route and credit gates.` |
| `must_follow_rules` | Required | Required rules. | `Do not cover speaker face.` |
| `avoid_rules` | Required | Avoid rules. | `Avoid invented metrics.` |
| `status` | Required | General record status. | `active` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Documentation-only Pseudo-record: EditPlanSkillRouteBundle

`EditPlanSkillRouteBundle` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, route assembly logic, worker spec, provider instruction, or UI.

A bundle is not execution. A bundle groups route decisions that must be understood together. Bundles need StoryTiming and credit/approval review.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable bundle ID. | `route_bundle_hero_001` |
| `project_id` | Required | Owning project. | `project_launch_demo` |
| `edit_plan_id` | Required | Owning edit plan. | `edit_plan_v4` |
| `creative_concept_id` | Required | Concept behind bundle. | `concept_hero_reveal` |
| `bundle_title` | Required | Bundle title. | `Feature Hero Reveal` |
| `bundle_summary` | Required | Bundle intent. | `3D optional hero with motion, SoundSync, and safe-zone support.` |
| `primary_route_id` | Required | Main route. | `route_3d_hero` |
| `support_route_ids` | Optional | Support routes. | `route_motion_support, route_ducking_support` |
| `optional_route_ids` | Optional | Optional routes. | `route_sfx_support` |
| `lower_cost_alternative_bundle_id` | Optional | Alternative bundle. | `route_bundle_graphic_hero` |
| `StoryTiming_requirements` | Required | Timing/focus requirements. | `Needs protected hero window and reduced captions.` |
| `credit_tendency` | Required | Bundle credit tendency. | `premium` |
| `approval_required` | Required | Later approval expectation. | `true` |
| `route_conflict_notes` | Required | Conflict notes. | `May conflict with captions and speech-safe audio.` |
| `QA_notes` | Required | QA notes. | `Check density, source/model status, credits, and speech.` |
| `status` | Required | Bundle status. | `proposed` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Planning Contract Attachment Model

Planning contract types:

- `universal_skill_plan`
- `transition_planning_contract`
- `overlay_compositing_planning_contract`
- `graphic_design_planning_contract`
- `motion_design_planning_contract`
- `three_d_visual_planning_contract`
- `b_roll_planning_contract`
- `caption_planning_contract`
- `sound_music_planning_contract`
- `storytiming_coordination_contract`
- `edit_preference_creative_direction_contract`

Rules:

- Every route must attach `universal_skill_plan`.
- Specialized routes must attach relevant specialized contracts.
- Multi-skill routes may attach multiple contracts.
- Contract attachment does not create the final plan record yet.
- Contract attachment tells future schema/type/runtime work what details are required before execution.

## Documentation-only Pseudo-record: SkillPlanningContractAttachment

`SkillPlanningContractAttachment` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, route assembly logic, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable attachment ID. | `contract_attachment_001` |
| `route_id` | Required | Route being attached. | `route_001_graphic_card` |
| `planning_contract_type` | Required | Attached contract. | `graphic_design_planning_contract` |
| `required` | Required | Whether attachment is required. | `true` |
| `required_before_credit_estimate` | Required | Needed before estimate readiness. | `true` |
| `required_before_approval` | Required | Needed before approval. | `true` |
| `required_before_future_execution` | Required | Needed before future execution. | `true` |
| `attachment_reason` | Required | Why this contract is attached. | `Graphic route needs hierarchy, timing, layout, and QA.` |
| `expected_plan_record_type` | Required | Future plan record type. | `GraphicDesignSkillPlan` |
| `status` | Required | Attachment status. | `active` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Required Plan Record Assembly Model

Route assembly identifies which future plan records are needed before execution can ever be considered.

Examples:

- `transition_design` route requires transition plan, timing plan, audio plan, and QA requirements.
- `three_d_overlay_integration` route requires 3D spatial composition, motion behavior, overlay compositing, source/model/provenance, and QA requirements.
- `caption_design` route requires caption text, timing, placement, style/readability, and QA requirements.
- `soundsync_music_planning` route requires music cue, ducking/speech safety, ambience/room tone, and QA requirements.
- `b_roll_planning` route requires source selection, timing, composition, audio relationship, and QA requirements.
- `storytiming_coordination` route requires windows, density budget, conflict resolution, and permission gates.

## Documentation-only Pseudo-record: RequiredSkillPlanRecordSet

`RequiredSkillPlanRecordSet` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, route assembly logic, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable record-set ID. | `record_set_graphic_001` |
| `route_id` | Required | Route requiring records. | `route_001_graphic_card` |
| `skill_key` | Required | Canonical skill key. | `graphic_design_visual_explain` |
| `required_record_types` | Required | Required future records. | `GraphicDesignSkillPlan, OverlayCompositionPlan, SkillRouteQARequirement` |
| `optional_record_types` | Optional | Optional future records. | `MotionBehaviorPlan` |
| `source_record_dependencies` | Optional | Source dependencies. | `visual_opportunity, creative_concept, skill_candidate` |
| `required_before_credit_estimate` | Required | Whether needed before estimate. | `true` |
| `required_before_approval` | Required | Whether needed before approval. | `true` |
| `required_before_execution_later` | Required | Whether needed before future execution. | `true` |
| `missing_record_risks` | Required | Risks if records are missing. | `Vague layout, unknown caption collision, weak QA.` |
| `status` | Required | Record-set status. | `active` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Route Timing And Segment Mapping

Route timing rules:

- Route time range must fit the segment or explain cross-segment behavior.
- Transition routes may cross segment boundaries.
- B-roll routes may cover a cut or sit under voiceover.
- Caption routes must align to transcript timing.
- 3D, Real Motion, and graphic hero routes need protected windows.
- SoundSync routes may span multiple segments.
- StoryTiming routes can span a full edit or beat windows.
- Routes can be segment-level, beat-level, project-level, or export-level.

Route scopes:

- `segment`
- `story_beat`
- `transition_between_segments`
- `multi_segment`
- `full_edit`
- `export_package`
- `revision_scope`

## Primary/Support/Optional Role Model

Route roles:

- `primary_visual`
- `primary_audio`
- `primary_text`
- `support_visual`
- `support_audio`
- `support_text`
- `timing_support`
- `QA_support`
- `source_safety_support`
- `approval_credit_support`
- `optional_premium`
- `lower_cost_alternative`
- `restraint`

Each time window should usually have one primary focus. Support routes should not compete with primary routes. Optional premium routes should be user-visible in plan/estimate. Lower-cost alternatives should connect to the premium route they replace.

## StoryTiming Readiness Handoff

StoryTiming readiness values:

- `ready`
- `ready_with_warnings`
- `needs_coordination`
- `waiting_StoryTiming_window`
- `conflict_detected`
- `blocked_until_resolved`
- `not_applicable`

Each route must declare:

- visual footprint
- audio footprint
- text footprint
- motion footprint
- caption impact
- safe-zone needs
- primary/support expectation
- density impact
- conflict risks
- hero window need
- SFX permission need
- transition permission need

Route assembly does not solve all coordination. It prepares StoryTiming to solve conflicts.

## Source/Proof Safety Handoff

Source/proof safety statuses:

- `not_applicable`
- `source_verified`
- `user_provided`
- `project_source`
- `claimed_by_user`
- `reference_guidance_only`
- `needs_source_confirmation`
- `needs_redaction`
- `needs_safe_wording`
- `blocked_unknown_source`
- `blocked_policy_or_rights`

Rules:

- Source-sensitive routes must carry source status.
- Browser/app/evidence/proof routes cannot imply verified proof unless supported.
- Reference DNA cannot become copied visuals, audio, captions, transitions, timing, or style.
- Sensitive data and private screens require redaction planning.
- Source/proof status can block route readiness.

## Approval Scope Model

Approval scopes:

- `no_user_approval_needed_for_planning`
- `approval_needed_for_user_visible_plan`
- `approval_needed_for_credit_bearing_work`
- `approval_needed_for_premium_optional_skill`
- `approval_needed_for_generated_asset`
- `approval_needed_for_source_sensitive_visual`
- `approval_needed_for_lyrics_or_custom_music`
- `approval_needed_for_revision`
- `approval_needed_before_future_execution`

Route assembly can mark approval requirements but cannot grant approval. Future approval records must handle actual approval. Approval for planning does not equal approval for generation or execution.

## Credit Impact Model

Credit tendency values:

- `none`
- `low`
- `medium`
- `high`
- `premium`
- `variable`

Route credit behaviors:

- `included_in_basic_planning`
- `estimate_required`
- `optional_credit_item`
- `can_remove_to_lower_cost`
- `premium_itemize`
- `future_generated_asset_credit`
- `future_render_or_compositing_credit`
- `no_credit_impact`

Route credit tendency is not the final estimate. Final estimate requires a future credit estimation contract. Route assembly should preserve lower-cost alternatives.

## Lower-cost Alternative Route Model

Lower-cost route links connect a premium route to a safer or cheaper route.

Examples:

- 3D overlay -> graphic card.
- Real Motion object -> source B-roll plus callout.
- Generated B-roll -> source clip B-roll.
- Complex animated captions -> basic readable captions.
- Custom music -> ambience only.

## Documentation-only Pseudo-record: LowerCostAlternativeRouteLink

`LowerCostAlternativeRouteLink` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, route assembly logic, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable link ID. | `lower_cost_link_001` |
| `premium_route_id` | Required | Premium route being replaced. | `route_3d_hero` |
| `alternative_route_id` | Required | Alternative route. | `route_graphic_hero` |
| `replaced_skill_key` | Required | Premium skill key. | `three_d_overlay_integration` |
| `alternative_skill_key` | Required | Alternative skill key. | `graphic_design_visual_explain` |
| `creative_tradeoff` | Required | What changes creatively. | `Less dimensional impact, still clear.` |
| `estimated_credit_reduction_reason` | Required | Why cost is reduced. | `No 3D model/provenance/render path.` |
| `quality_impact` | Required | Quality impact. | `Lower wow, similar clarity.` |
| `recommended_when` | Required | When to choose alternative. | `Low-credit preference or no premium approval.` |
| `user_visible_copy` | Required | User-facing explanation. | `Use a polished graphic card instead of the optional 3D reveal.` |
| `status` | Required | Link status. | `active` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Route Conflict Model

Route conflict types:

- `caption_visual_collision`
- `face_safety_conflict`
- `product_action_conflict`
- `text_layer_conflict`
- `visual_density_conflict`
- `audio_density_conflict`
- `speech_clarity_conflict`
- `SFX_under_speech_conflict`
- `motion_readability_conflict`
- `transition_timing_conflict`
- `B_roll_emotion_conflict`
- `source_status_conflict`
- `credit_approval_conflict`
- `repetition_conflict`
- `tone_mismatch_conflict`
- `reference_copy_risk`
- `runtime_readiness_conflict`

## Documentation-only Pseudo-record: SkillRouteConflictFlag

`SkillRouteConflictFlag` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, route assembly logic, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable conflict ID. | `route_conflict_001` |
| `route_id` | Required | Affected route. | `route_graphic_card` |
| `conflicting_route_id` | Optional | Conflicting route. | `route_caption_keyword` |
| `conflict_type` | Required | Conflict type. | `caption_visual_collision` |
| `severity` | Required | Conflict severity. | `warning` |
| `conflict_summary` | Required | Human-readable conflict. | `Graphic card and caption both want lower third.` |
| `recommended_resolution` | Required | Suggested resolution. | `Move card to right safe zone or shorten caption.` |
| `blocks_credit_estimate` | Required | Blocks estimate readiness. | `false` |
| `blocks_approval` | Required | Blocks approval. | `false` |
| `blocks_future_execution` | Required | Blocks future execution. | `true` |
| `QA_followup_required` | Required | Whether QA must follow up. | `true` |
| `status` | Required | Conflict status. | `open` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Route QA Requirement Model

QA types include:

- `user_instruction_compliance`
- `planning_contract_completeness`
- `StoryTiming_readiness`
- `caption_readability`
- `speech_clarity`
- `face_safe_placement`
- `product_action_visibility`
- `source_safety`
- `reference_not_copied`
- `visual_density`
- `audio_density`
- `credit_approval_compliance`
- `lower_cost_alternative_presence`
- `runtime_boundary_compliance`
- `professional_taste`

## Documentation-only Pseudo-record: SkillRouteQARequirement

`SkillRouteQARequirement` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, route assembly logic, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable QA ID. | `route_qa_001` |
| `route_id` | Required | Route being checked. | `route_graphic_card` |
| `QA_type` | Required | QA type. | `caption_readability` |
| `QA_summary` | Required | QA requirement summary. | `Verify graphic card does not cover captions.` |
| `blocks_preview_if_failed` | Required | Blocks preview if failed. | `true` |
| `blocks_credit_estimate_if_failed` | Required | Blocks estimate readiness if failed. | `false` |
| `blocks_future_execution_if_failed` | Required | Blocks future execution if failed. | `true` |
| `related_contract` | Required | Related contract. | `overlay_compositing_planning_contract` |
| `severity` | Required | Severity. | `blocking` |
| `status` | Required | QA status. | `pending` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Revision Linkage Model

Routes should connect to:

- route group
- creative concept
- skill candidate
- required plan records
- StoryTiming window
- credit estimate item later
- approval item later
- QA requirement
- lower-cost alternative
- user-visible summary

Revision examples:

- Remove 3D route and activate graphic lower-cost alternative.
- Move captions away from 3D window.
- Remove SFX from transition route.
- Replace B-roll route with clean speaker shot.
- Lower visual density by disabling support graphics.

## Documentation-only Pseudo-record: SkillRouteRevisionLink

`SkillRouteRevisionLink` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, route assembly logic, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable revision link ID. | `revision_link_001` |
| `route_id` | Required | Route being revised. | `route_3d_hero` |
| `revision_group_id` | Required | Revision group. | `revision_group_hero_visual` |
| `revision_scope` | Required | Scope of revision. | `story_beat` |
| `safe_revision_options` | Required | Safe options. | `Use graphic lower-cost route, shorten duration, remove SFX.` |
| `credit_reestimate_needed` | Required | Whether estimate changes. | `true` |
| `new_approval_needed` | Required | Whether approval changes. | `true` |
| `affected_related_route_ids` | Optional | Related routes affected. | `route_motion_support` |
| `affected_required_plan_records` | Optional | Plan records affected. | `ThreeDVisualSkillPlan, MotionTimingPlan` |
| `user_visible_revision_copy` | Required | User-facing revision copy. | `Swap the optional 3D moment for a lower-cost graphic card.` |
| `status` | Required | Link status. | `active` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## User-visible Route Summary Model

Routes need user-visible summaries because the user must understand visible work, optional premium choices, lower-cost alternatives, source/proof caveats, and revision options without believing execution has started.

Rules:

- User-facing copy should explain what the skill does and why.
- Do not expose internal-only jargon unless needed.
- Premium/optional routes must be clear.
- Lower-cost alternatives should be understandable.
- Source/proof caveats should be honest.
- Do not imply execution has started.
- Do not imply credits are spent.

## Documentation-only Pseudo-record: SkillRouteUserVisibleSummary

`SkillRouteUserVisibleSummary` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, route assembly logic, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable summary ID. | `route_summary_001` |
| `route_id` | Required | Route being summarized. | `route_graphic_card` |
| `headline` | Required | Short user-facing label. | `Product feature card` |
| `summary` | Required | What will be planned. | `Plan a clean card that explains the feature at the first mention.` |
| `reason` | Required | Why it helps. | `The viewer needs a quick visual anchor.` |
| `credit_copy` | Required | Credit wording. | `Estimated later; lower-cost than 3D.` |
| `approval_copy` | Required | Approval wording. | `You will approve visible work before execution.` |
| `lower_cost_copy` | Optional | Alternative wording. | `Use captions only if you want less visual design.` |
| `source_safety_copy` | Required | Source/proof wording. | `No exact claims are shown unless confirmed.` |
| `revision_options_copy` | Required | Revision wording. | `Can be removed, shortened, or swapped for captions.` |
| `status` | Required | Summary status. | `draft` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Route Assembly Lifecycle

1. Receive selected skill candidates.
2. Validate canonical skill keys and contract mappings.
3. Create route intent records.
4. Attach planning contracts.
5. Identify required plan record set.
6. Attach timing/segment scope.
7. Attach StoryTiming readiness and conflict flags.
8. Attach source/proof safety.
9. Attach credit/approval tendency.
10. Attach lower-cost alternatives.
11. Attach QA requirements.
12. Attach revision links.
13. Prepare user-visible route summaries.
14. Mark routes `ready_for_credit_estimate` only when required planning context is sufficient.
15. Handoff to future credit/approval contract.

This lifecycle is docs-only and does not run.

## Documentation-only Pseudo-record: SkillPlanAssemblyRun

`SkillPlanAssemblyRun` is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, route assembly logic, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable assembly run ID. | `assembly_run_001` |
| `project_id` | Required | Owning project. | `project_launch_demo` |
| `edit_plan_id` | Required | Owning edit plan. | `edit_plan_v4` |
| `input_skill_candidate_ids` | Required | Selected candidates assembled. | `skill_candidate_graphic_card` |
| `created_route_ids` | Required | Created route IDs. | `route_graphic_card` |
| `created_bundle_ids` | Optional | Created bundle IDs. | `route_bundle_hero_001` |
| `required_plan_record_set_ids` | Required | Required record set IDs. | `record_set_graphic_001` |
| `conflict_flag_ids` | Optional | Conflict flags. | `route_conflict_001` |
| `QA_requirement_ids` | Required | QA requirements. | `route_qa_001` |
| `lower_cost_link_ids` | Optional | Lower-cost links. | `lower_cost_link_001` |
| `revision_link_ids` | Required | Revision links. | `revision_link_001` |
| `user_visible_summary_ids` | Required | User-visible summaries. | `route_summary_001` |
| `ready_for_credit_estimate` | Required | Whether ready for estimate. | `false` |
| `missing_requirements_summary` | Required | Missing needs. | `Waiting on StoryTiming window and source confirmation.` |
| `run_confidence` | Required | Confidence. | `medium_high` |
| `created_by_agent` | Required | Agent or human. | `skill_route_assembler` |
| `status` | Required | Run status. | `complete_docs_only` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "docs_only": true }` |

## Route Assembly Readiness Gates

| Gate | Pass condition | Fail condition | Warning condition | Next action |
| --- | --- | --- | --- | --- |
| `canonical_skill_key_gate` | Route uses canonical RP-SKILLS-13 key. | Missing or non-canonical key. | Alias not documented. | Resolve taxonomy. |
| `planning_contract_mapping_gate` | Universal and specialized contracts are attached. | No planning contract. | Secondary contract unclear. | Attach contracts. |
| `route_reason_gate` | Reason is specific and concept-linked. | Skill name only. | Reason is generic. | Rewrite reason. |
| `timing_scope_gate` | Time range or scope is clear. | No timing/scope. | Cross-segment behavior unclear. | Add scope. |
| `StoryTiming_readiness_gate` | Readiness declared. | Missing readiness. | Warnings unresolved. | Hand off to StoryTiming. |
| `source_safety_gate` | Source/proof status declared. | Sensitive source unknown. | Safe wording needed. | Confirm source or redact. |
| `credit_approval_hint_gate` | Credit and approval tendency present. | Premium route lacks hint. | Variable credit. | Add estimate/approval hints. |
| `QA_requirement_gate` | QA requirements attached. | No QA for visible route. | QA incomplete. | Add QA requirements. |
| `lower_cost_alternative_gate` | Premium optional has alternative or explanation. | Missing alternative. | Alternative weak. | Link lower-cost route. |
| `revision_linkage_gate` | Revision link exists. | No revision path. | Affected routes unclear. | Add revision link. |
| `user_visible_summary_gate` | User summary is clear and honest. | Missing or implies execution. | Too vague. | Rewrite summary. |

## Route Assembly Scoring / Completeness Model

Positive factors:

- route reason clear
- timing scope clear
- planning contracts attached
- required plan records identified
- StoryTiming readiness known
- source safety known
- credit/approval tendency known
- lower-cost alternatives linked when needed
- QA requirements attached
- revision linkage present
- user-visible copy present

Negative factors:

- missing contract mapping
- vague route reason
- unclear time range
- unresolved source risk
- unresolved StoryTiming conflict
- missing approval/credit hint for premium skill
- missing lower-cost alternative for optional premium route
- missing QA requirements
- runtime/execution implied

Documentation-only pseudo formula:

```text
route_assembly_completeness =
  route_reason_clarity
+ timing_scope_clarity
+ contract_attachment_completeness
+ required_plan_record_completeness
+ StoryTiming_readiness
+ source_safety_clarity
+ credit_approval_clarity
+ QA_requirement_completeness
+ revision_linkage_completeness
- unresolved_conflicts
- source_risk
- approval_gap
- contract_gap
- vague_user_visible_copy
- runtime_implication_risk
```

Completeness supports readiness decisions only. It does not execute, approve, reserve credits, or create jobs.

## Route Assembly QA

Route-assembly-specific QA checks:

- Route uses canonical skill key.
- Route links to opportunity, concept, and candidate.
- Route reason exists.
- Time range or scope exists.
- Planning contract is attached.
- Required plan records are identified.
- Primary/support/optional role is clear.
- StoryTiming readiness is present.
- Source/proof safety is present.
- Credit/approval tendency is present.
- Lower-cost alternative is linked for optional premium route.
- QA requirements are attached.
- Revision linkage is present.
- User-visible summary is clear.
- No runtime/tool/provider execution is implied.
- No generation before approval.

Blocking examples:

- Route has no planning contract.
- Route has no skill key or non-canonical skill key.
- Premium route lacks approval/credit hint.
- Source-sensitive route lacks source safety status.
- Route implies generation/execution.
- Route bypasses StoryTiming.
- Route lacks reason.

Warning examples:

- User-visible summary is too vague.
- StoryTiming readiness is unclear.
- Lower-cost alternative is missing.
- QA requirements are incomplete.
- Route conflicts are likely but not blocking yet.

## Examples

| Example | selected_skill_candidate | route_type | route_reason | time_range_or_scope | planning_contracts_attached | required_plan_records | StoryTiming_readiness | source_safety_status | credit_approval_notes | QA requirements | lower_cost_alternative | user_visible_summary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Social keyword captions | `caption_keyword_emphasis` | `primary_skill_route` | Emphasize hook phrase. | `segment 01, phrase window` | `universal_skill_plan, caption_planning_contract` | `CaptionTimingPlan, CaptionTextPlan, CaptionPlacementPlan` | `ready_with_warnings` | `not_applicable` | Low credit; approval if user-visible. | Readability, line breaks, safe zones. | Basic readable captions. | Add keyword emphasis to the hook caption. |
| Ambient bridge | `transition_design` | `primary_skill_route` | Smooth story edge between scenes. | `transition_between_segments` | `universal_skill_plan, transition_planning_contract, sound_music_planning_contract` | `TransitionTimingPlan, TransitionAudioPlan` | `needs_coordination` | `not_applicable` | Medium; approval if user-visible/SFX. | Speech safety, SFX timing. | Clean cut transition. | Plan a subtle bridge into the next scene. |
| Product feature card | `graphic_design_visual_explain` | `primary_skill_route` | Explain feature at first mention. | `segment 03, 42.4-45.2` | `universal_skill_plan, graphic_design_planning_contract, overlay_compositing_planning_contract` | `GraphicDesignSkillPlan, OverlayCompositionPlan` | `needs_coordination` | `source_verified` | Medium; approval if visible. | Proof wording, caption collision. | Caption emphasis only. | Add a clean product feature card. |
| Graphic reveal support | `motion_design_overlay` | `support_skill_route` | Reveal graphic without clutter. | `same as graphic card` | `universal_skill_plan, motion_design_planning_contract` | `MotionTimingPlan, MotionBehaviorPlan` | `ready_with_warnings` | `not_applicable` | Low/medium. | Motion comfort, readability. | Static graphic. | Add subtle motion to the graphic. |
| Optional 3D overlay | `three_d_overlay_integration` | `optional_premium_skill_route` | Premium product moment. | `protected hero window` | `universal_skill_plan, three_d_visual_planning_contract, overlay_compositing_planning_contract` | `ThreeDVisualSkillPlan, OverlayCompositionPlan` | `needs_coordination` | `needs_source_confirmation` | Premium; approval required. | Source/model/provenance, face safety. | Graphic card. | Optional 3D reveal, with graphic fallback. |
| 3D object B-roll | `three_d_object_broll` | `lower_cost_alternative_route` | Use 3D as separated B-roll instead of integrated overlay. | `segment 04 cutaway` | `universal_skill_plan, three_d_visual_planning_contract, b_roll_planning_contract` | `ThreeDVisualSkillPlan, BRollCompositionPlan` | `ready_with_warnings` | `needs_model_provenance` | High but lower than integration. | Provenance, repetition. | Source B-roll. | Use a simpler 3D object cutaway. |
| Source cutaway B-roll | `source_b_roll_selection` | `primary_skill_route` | Cover cut and clarify product. | `under voiceover` | `universal_skill_plan, b_roll_planning_contract` | `BRollTimingPlan, BRollSourceSelectionPlan` | `ready` | `project_source` | Low/medium. | Source relevance, emotion protection. | No B-roll. | Use source footage as a cutaway. |
| SoundSync music | `soundsync_music_planning` | `support_skill_route` | Support emotional lift while protecting speech. | `multi_segment` | `universal_skill_plan, sound_music_planning_contract, storytiming_coordination_contract` | `MusicCuePlan, DuckingSpeechSafetyPlan` | `needs_coordination` | `not_applicable` | Medium; rights/approval later. | Ducking, no lyrics. | Ambience only. | Plan music with speech-safe ducking. |
| Rejected SFX | `sfx_design` | `rejected_route_reference` | SFX would sit under speech. | `transition edge` | `universal_skill_plan, sound_music_planning_contract` | `SkillRouteQARequirement` | `blocked_until_resolved` | `not_applicable` | No credit. | Speech clarity. | No SFX. | Do not add SFX under this spoken line. |
| No 3D restraint | `no_3d` | `restraint_route` | User blocked 3D. | `full_edit` | `universal_skill_plan, three_d_visual_planning_contract` | `SkillRouteRevisionLink` | `ready` | `not_applicable` | No credit. | User instruction compliance. | Graphic or B-roll alternatives. | Keep this edit free of 3D. |
| Multi-skill hero bundle | `three_d_product_feature_breakout + motion + SoundSync` | `optional_premium_skill_route` bundle | Big launch beat. | `hero story beat` | `three_d, motion, sound, overlay, storytiming contracts` | `EditPlanSkillRouteBundle, RequiredSkillPlanRecordSet` | `needs_coordination` | `needs_source_confirmation` | Premium; approval required. | Density, speech, source/model. | Graphic hero card. | Optional premium hero bundle with lower-cost fallback. |
| Browser annotation blocked | `browser_annotation_design` | `source_confirmation_route` | Annotate app screen only if source is real. | `segment screen moment` | `universal_skill_plan, graphic_design_planning_contract, overlay_compositing_planning_contract` | `RequiredSkillPlanRecordSet, SkillRouteQARequirement` | `blocked_until_resolved` | `blocked_unknown_source` | Approval after source confirmation. | Redaction, no invented UI. | Generic graphic. | Confirm the screen source before planning annotation. |

## Anti-patterns

- Route created directly from opportunity without concept/resolver.
- Route has skill name only.
- Route has no planning contract.
- Route has no time range/scope.
- Route has no route reason.
- Route uses non-canonical skill key.
- Route selects tool/provider/worker instead of skill.
- Route bypasses StoryTiming.
- Route bypasses source safety.
- Route bypasses credit/approval.
- Premium route has no lower-cost alternative.
- Rejected/blocked routes disappear without audit.
- Route implies generation has started.
- Route creates worker/job/generation request.
- Route assembly implemented in this docs-only prompt.

## Future Implementation Notes

Possible future records, tables, or types:

- `edit_plan_skill_routes`
- `edit_plan_skill_route_bundles`
- `skill_planning_contract_attachments`
- `required_skill_plan_record_sets`
- `lower_cost_alternative_route_links`
- `skill_route_conflict_flags`
- `skill_route_QA_requirements`
- `skill_route_revision_links`
- `skill_route_user_visible_summaries`
- `skill_plan_assembly_runs`
- visual opportunity references
- creative concept references
- skill candidate references
- StoryTiming references
- source/proof safety references
- credit estimate references later
- approval record references later
- future specialized skill plan records

This document does not create those records now. Future schema/types must avoid duplicating this document's source-of-truth. Runtime skill route/assembly remains future gated work. Route assembly output is planning metadata, not execution.

## Relationship To Existing `signature_routes`

Existing `signature_routes` concepts already represent broad signature system routing in docs, types, mock planner behavior, and StoryTiming services. Creative Skill routes are broader and include captions, transitions, B-roll, graphics, motion design, 3D, SoundSync, QA, edit preference, approval/credit support, and no-action routes.

Future implementation may keep `signature_routes` as compatibility/specialized routes or map signature routes into broader skill routes. This prompt must not delete or replace existing `signature_routes` docs/types. Future schema/type work must reconcile carefully.

## Duplicate And Missing-file Notes

Existing owners must be referenced, not replaced:

- RP-SKILLS-01 through RP-SKILLS-16 contracts.
- `source-of-truth-map.md`
- `duplicate-lane-checklist.md`
- existing `edit_plan_skill_routes` references in prior RP-SKILLS docs.
- `signature_routes` types and mock planner behavior.
- `src/types/planning.ts`
- `src/types/reeditpro.ts`
- `src/types/edit-planning-db.ts`
- `src/lib/mock-planner.ts`
- `src/lib/planner-validation.ts`
- `src/lib/intent-compiler.ts`
- `src/lib/prompt-builders.ts`
- StoryTiming docs and services.
- credit/approval and worker/job boundary docs.

Existing overlap already mentions `edit_plan_skill_routes`, `signature_routes`, route previews, planning records, credit estimates, approval gates, QA, and StoryTiming windows. This document creates a navigation and handoff contract, not a competing route runtime or schema.

Requested source-truth file status:

- `audio-library-and-licensing.md` exists.
- `soundsync-music-intelligence.md` is missing in the current repo snapshot.
- `music-reference-dna.md` is missing in the current repo snapshot.
- `lyria-music-generation-plan.md` is missing in the current repo snapshot.

## RP-SKILLS-18 Handoff

Recommended next prompt:

`RP-SKILLS-18 - Skill Credit and Approval Planning Contract`

Scope:

Docs-only credit and approval planning contract that defines how skill routes and route bundles become credit estimate items and approval groups: required versus optional premium items, lower-cost alternatives, estimate readiness, approval copy, credit impact ranges, approval statuses, reservation boundary, no-generation-before-approval gates, revision credit behavior, and audit/QA rules.

Forbidden scope for `RP-SKILLS-18` unless explicitly authorized later:

- Supabase migrations or SQL.
- Runtime code.
- TypeScript implementation.
- React UI.
- Provider calls.
- Workers, jobs, leases, or runtime gates.
- Package installs or package file mutations.
- Skill route runtime, plan assembly runtime, schema/runtime behavior, preference runtime, settings UI, profile storage, runtime orchestration, render/export runtime, media processing, audio generation, music generation, SFX generation, caption rendering, browser/capture/media/generation runtime, prompt router changes, Playwright execution, animation code, design-token changes, or app behavior.
