# Skill QA And Validation Contract

`RP-SKILLS-19` defines the documentation-only Skill QA and Validation contract for future Creative Skill planning.

This document is not runtime code, a TypeScript contract, a SQL schema, a migration, a QA runtime, a validation script, a diagnostics script, a worker spec, a provider instruction, a render/export system, a billing/credit runtime, an approval runtime, or a UI surface. It defines how future planning records should be checked before user approval, credit estimate display, preview, revision, or future execution.

Planning QA does not execute QA, render previews, run diagnostics scripts, call providers, start workers, reserve credits, approve plans, or mutate app behavior. It hands off to future diagnostics, type, schema, mock-planner, worker, and QA milestones.

## Purpose

Skill QA and Validation checks whether the Creative Skill planning chain is complete, professional, safe, approval-gated, credit-aware, and ready to show to a user or hand forward to later gates.

It validates:

- Planning completeness.
- Professional taste.
- Creative quality.
- Overuse and underuse.
- StoryTiming conflicts.
- Caption readability.
- Speech clarity.
- Face/product/action safety.
- Source/proof safety.
- Reference do-not-copy rules.
- User instruction and edit preference compliance.
- Credit/approval compliance.
- No-generation-before-approval boundaries.
- Runtime/tool/provider boundaries.
- Revision readiness.
- Diagnostics readiness for future static checks.

Planning-not-execution doctrine: QA decides whether the plan is professional enough to show, approve, preview, or eventually execute. It does not execute anything.

## Skill QA Doctrine

QA is part of professional creativity. It protects the edit from becoming a pile of random effects, a generic template, unreadable captions, unplanned 3D, loud SFX under speech, source-unsafe proof visuals, hidden premium work, or repeated patterns that make every edit feel the same.

QA must validate both overuse and underuse:

- Overuse QA catches too much visual noise, too many effects, too much motion, too many SFX, too much text, or too many competing focal points.
- Underuse QA catches generic, low-effort plans when the user asked for premium, out-of-this-world, high-impact, or strong creative direction.

QA must produce actionable fixes, not vague criticism. It should separate blocking failures from warnings, preserve user instructions, protect story meaning, and keep future execution approval-gated.

Principle: "QA should not make the edit boring; QA should make the edit professionally safe, clear, intentional, and impressive where earned."

## Position In Planning Flow

Planning QA appears after credit/approval planning and before user-facing plan display or future execution readiness.

1. User intent and edit preference are collected.
2. Source sequence and media context are understood.
3. Visual Opportunity Engine detects opportunities.
4. Creative Concept Ideation selects and rejects concepts.
5. Skill Candidate Scoring and Resolver selects and rejects skill candidates.
6. Skill Route and Plan Assembly creates route intent.
7. Skill Credit and Approval Planning prepares estimate items and approval groups.
8. Skill QA validates planning completeness and professional readiness.
9. User-facing plan and estimate can be shown when blockers are cleared.
10. User approval happens later.
11. Future execution, generation, rendering, or worker jobs happen only after approval and future job gates.
12. Preview QA happens later and is separate.
13. Revision QA happens later and is separate.

Planning QA can happen before user approval. Preview/render QA is a later future-gated layer. This contract defines planning QA only.

## Required Input Context

Skill QA must not run from a skill name alone. It needs the whole planning chain.

| Input | Required | Why it matters |
| --- | --- | --- |
| `project_id` | Required | Anchors QA to the project and audit path. |
| `edit_plan_id` | Required | Links QA to the planned edit. |
| `source_clip_sequence_ids` | Required when clips exist | Confirms source order, source coverage, and clip-specific safety. |
| `intent_analysis` | Required | Shows what the user asked for and what the plan must satisfy. |
| `edit_preference_snapshot` | Required when available | Checks visual density, motion, captions, B-roll, 3D, SoundSync, restraint, and credit sensitivity. |
| `workflow_context` | Required | Distinguishes social, education, product, case study, real estate, documentary, and other workflow needs. |
| `platform` | Required when known | Sets safe zones, caption density, pacing, and output expectations. |
| `aspect_ratio` | Required when known | Changes placement, crop, and collision risk. |
| `reference_DNA` | Optional | Checks inspiration, preference, and do-not-copy boundaries. |
| `visual_opportunities` | Required | Ensures chosen ideas trace to real opportunities. |
| `creative_concepts` | Required | Ensures selected ideas have a reason and viewer benefit. |
| `skill_candidates` | Required | Checks canonical skill keys, rejection reasons, and preferred/blocked handling. |
| `skill_routes` | Required | Checks route reason, role, scope, time range, and user-visible summary. |
| `route_bundles` | Required | Checks cross-route coordination and conflicts. |
| `required_plan_record_sets` | Required | Confirms every selected skill has its planning contract records. |
| `StoryTiming coordination plans` | Required when timing exists | Checks primary focus, density, permissions, conflicts, and time windows. |
| `credit estimate items` | Required when credit-bearing | Checks estimate item links, premium itemization, and lower-cost alternatives. |
| `approval groups` | Required when approval needed | Checks user approval scope and no-generation-before-approval copy. |
| `source/proof safety statuses` | Required when claims/assets appear | Prevents invented proof, unknown rights, and unsafe screenshots. |
| `transcript/caption confidence` | Required for captions/speech | Protects meaning, line breaks, read time, and translation flags. |
| `visual/audio observations` | Required when available | Grounds QA in actual footage, speech, ambience, product, faces, action, and gaps. |
| `user must-follow rules` | Required when present | Direct user instruction outranks inferred preference. |
| `user avoid rules` | Required when present | Blocks unwanted skills, styles, music, captions, or generated assets. |
| `lower-cost alternatives` | Required for optional premium routes when useful | Prevents premium-only plans where simpler choices could work. |
| `rejected/blocked candidates` | Required when present | Preserves auditability and prevents accidental re-entry. |
| `revision context` | Required for revisions | Checks changed routes, credit impact, approval reset, and user-facing copy. |

## QA Stage Model

| QA stage | What it checks | Conceptual timing | Blocking example | Notes |
| --- | --- | --- | --- | --- |
| `source_input_QA` | Source order, transcript confidence, proof status, rights/provenance, visual/audio observations. | Before opportunity selection. | Unknown proof source used as verified evidence. | Does not inspect media at runtime. |
| `opportunity_QA` | Opportunity source, evidence, confidence, duplicate/repetition, no-op restraint. | After opportunity detection. | Hero opportunity has no source/context. | Keeps opportunities grounded. |
| `concept_QA` | Concept traceability, viewer benefit, creative role, source safety, lower-cost alternative. | After concept ideation. | Selected concept not tied to an opportunity. | Prevents random idea selection. |
| `skill_candidate_QA` | Canonical skill key, family mapping, preferred/blocked handling, recommendation level. | After resolver. | Non-canonical skill key selected. | Uses taxonomy as vocabulary. |
| `skill_route_QA` | Route reason, route type/status, role, scope, timing, contract attachment. | After route assembly. | Route has no reason or contract. | Routes are not execution. |
| `planning_contract_QA` | Required fields, timing, composition, audio, tool, credit, approval, QA, revision envelopes. | After specialized planning. | 3D plan lacks placement/depth role. | Checks contract completeness. |
| `StoryTiming_QA` | Primary focus, density, safe zones, conflicts, permissions, ducking, transitions, SFX. | After StoryTiming coordination. | Captions, 3D, and proof card collide. | References StoryTiming owners. |
| `credit_approval_QA` | Estimate items, approval groups, premium itemization, lower-cost choices, no-generation gates. | After credit/approval planning. | Premium generated 3D lacks approval group. | Does not reserve or spend. |
| `user_visible_plan_QA` | Summary clarity, warnings, blockers, user copy, hidden premium work. | Before plan display. | User plan hides source blocker. | Blocks misleading user display. |
| `pre_approval_QA` | Blockers cleared before asking for approval. | Before approval request. | Approval asks for work that cannot be estimated. | Planning-only in this prompt. |
| `pre_execution_readiness_QA_later` | Future readiness for jobs/workers/providers after approval. | Later milestone. | Runtime readiness treated as execution approval. | Future-gated, not implemented here. |
| `preview_QA_later` | Render/audio/caption/output quality after preview exists. | Later milestone. | Render hides captions or corrupts audio. | Separate from planning QA. |
| `revision_QA` | Affected routes, changed estimates, new approvals, safe repair options. | During revision planning. | Revision adds generated B-roll without new approval. | Preserves audit trail. |
| `export_QA_later` | Final export readiness after preview and QA. | Later milestone. | Export proceeds with blocking preview QA. | Future-gated, not implemented here. |

## QA Severity Model

| Severity | Meaning | User-visible behavior | Future system behavior | Example |
| --- | --- | --- | --- | --- |
| `pass` | Requirement is satisfied. | No warning needed. | Can progress if no other blockers exist. | Caption plan has safe placement and read time. |
| `info` | Audit note only. | Usually hidden or summarized. | Does not block. | Route uses a conservative lower-cost option. |
| `warning` | Plan can continue with disclosure or later review. | May show as caution. | Does not block by itself. | Transition repeats twice but remains motivated. |
| `needs_review` | User or human review is needed. | Ask or disclose before approval. | May block approval until answered. | Source metric needs confirmation. |
| `blocking` | Plan should not move forward until fixed. | Show clear blocker and fix. | Blocks user plan display, approval, preview, or future execution as configured. | Captions cover speaker mouth. |
| `critical` | Severe safety, source, runtime, approval, or execution boundary failure. | Show serious blocker. | Must block progression and require repair/audit. | Plan says provider already generated an asset before approval. |

Blocking and critical issues should prevent preview or future execution readiness later. Warnings can allow planning to continue if disclosed. `needs_review` may require user input or human review. `info` provides audit trail.

## QA Status Model

| Status | Meaning |
| --- | --- |
| `not_started` | QA has not been planned. |
| `pending_inputs` | Required input context is missing. |
| `running_future` | Placeholder for future runtime; not used by this docs-only prompt. |
| `passed` | All relevant checks passed cleanly. |
| `passed_with_warnings` | No blockers, but warnings remain. Not the same as clean pass. |
| `needs_review` | User/human review is required. |
| `failed_blocking` | Blocking issue prevents progression. |
| `failed_critical` | Critical issue prevents progression. |
| `waived_with_reason` | Rare, auditable waiver with explicit reason. |
| `superseded` | A newer plan, route, or revision replaced the QA item. |
| `cancelled` | QA item is no longer relevant. |

`waived_with_reason` should be rare and auditable. `superseded` preserves history without implying the old QA passed.

## SkillQARequirement

Documentation-only pseudo-record for a required QA check. This is not TypeScript and not SQL.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable QA requirement ID. | `skill_qa_req_caption_mouth_safe_001` |
| `project_id` | Required | Project context. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan being checked. | `edit_plan_v6` |
| `QA_stage` | Required | QA stage model value. | `StoryTiming_QA` |
| `QA_type` | Required | QA category model value. | `caption_readability` |
| `linked_record_type` | Required | Type of linked planning record. | `CaptionPlacementPlan` |
| `linked_record_id` | Required | Linked planning record ID. | `caption_place_hero_001` |
| `linked_skill_key` | Optional | Canonical skill key. | `caption_keyword_emphasis` |
| `linked_skill_family` | Optional | Canonical skill family. | `caption` |
| `linked_route_id` | Optional | Route under review. | `skill_route_caption_001` |
| `linked_concept_id` | Optional | Creative concept under review. | `concept_hero_emphasis_001` |
| `linked_opportunity_id` | Optional | Opportunity under review. | `visual_opp_hook_001` |
| `severity` | Required | Default severity if requirement fails. | `blocking` |
| `QA_summary` | Required | Short check summary. | `Captions must avoid speaker mouth and eyes.` |
| `pass_condition` | Required | What passing means. | `Caption zone stays clear of face and remains readable.` |
| `fail_condition` | Required | What failure means. | `Caption overlaps mouth during key phrase.` |
| `warning_condition` | Optional | What creates a warning. | `Caption near face but not blocking expression.` |
| `blocks_user_plan_display` | Required | Whether failure blocks plan display. | `true` |
| `blocks_credit_estimate` | Required | Whether failure blocks estimate display. | `false` |
| `blocks_approval` | Required | Whether failure blocks approval. | `true` |
| `blocks_preview_later` | Required | Whether failure blocks future preview readiness. | `true` |
| `blocks_future_execution_later` | Required | Whether failure blocks future execution readiness. | `true` |
| `recommended_fix` | Required | Actionable fix. | `Move captions to lower safe zone or reduce 3D object size.` |
| `user_visible_message` | Optional | Message safe for user. | `Captions need to move so they do not cover the speaker.` |
| `internal_notes` | Optional | Planner/QA notes. | `Check against 9:16 safe zone and 3D hero window.` |
| `status` | Required | QA status model value. | `pending_inputs` |
| `metadata_json` | Optional | Future metadata placeholder; not schema. | `{ "docs_only": true }` |

## SkillQAResult

Documentation-only pseudo-record for the outcome of a QA requirement.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable QA result ID. | `skill_qa_result_caption_mouth_safe_001` |
| `QA_requirement_id` | Required | Linked requirement. | `skill_qa_req_caption_mouth_safe_001` |
| `project_id` | Required | Project context. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan being checked. | `edit_plan_v6` |
| `result_status` | Required | QA status model value. | `failed_blocking` |
| `severity` | Required | Severity after review. | `blocking` |
| `result_summary` | Required | Summary of result. | `Caption placement conflicts with speaker mouth.` |
| `evidence_summary` | Required | Evidence behind result. | `Planned caption zone overlaps face-safe region in hero window.` |
| `failed_record_ids` | Optional | Failed records. | `caption_place_hero_001, story_window_hero_001` |
| `failed_skill_keys` | Optional | Failed skill keys. | `caption_keyword_emphasis` |
| `recommended_fix` | Required | Actionable fix. | `Move captions below face and shorten line breaks.` |
| `can_auto_repair_later` | Required | Whether future system may repair without user choice. | `true` |
| `requires_user_input` | Required | Whether user must answer. | `false` |
| `requires_reestimate` | Required | Whether credit estimate must change. | `false` |
| `requires_new_approval` | Required | Whether approval must reset. | `true` |
| `blocks_preview` | Required | Whether future preview is blocked. | `true` |
| `blocks_future_execution` | Required | Whether future execution is blocked. | `true` |
| `reviewer_type` | Required | Reviewer source. | `planning_agent_future` |
| `created_at` | Optional | Future timestamp placeholder. | `future_runtime_timestamp` |
| `metadata_json` | Optional | Future metadata placeholder; not schema. | `{ "source": "RP-SKILLS-19" }` |

## QA Category Model

| QA category | What it checks | Example blocking issue | Example warning issue |
| --- | --- | --- | --- |
| `planning_completeness` | Required links, contracts, records, reasons, summaries. | Route lacks planning contract. | User summary could be clearer. |
| `professional_taste` | Restraint, polish, purpose, taste, pacing. | Every clip gets random flashy transition. | Edit may feel slightly generic. |
| `creative_quality` | Idea strength, viewer benefit, earned wow factor. | Premium request has no concept. | Stronger hero idea may be useful. |
| `overuse_detection` | Too many layers, effects, motions, SFX, text, 3D, layouts. | Visual density makes scene unreadable. | Repeated transition appears often. |
| `underuse_detection` | Missed opportunities and generic output. | High-priority hero opportunity ignored. | Premium/wow target may need stronger concept. |
| `repetition_detection` | Reused patterns, motifs, layouts, transitions, cues. | Same 3D object pattern appears everywhere. | Same card layout repeats often. |
| `StoryTiming_coordination` | Focus, density, safe zones, permissions, conflicts. | No primary focus in overloaded window. | Density high but understandable. |
| `caption_readability` | Source, accuracy, line breaks, timing, placement, contrast, meaning. | Captions change meaning. | Caption timing is tight but readable. |
| `speech_clarity` | Speech priority, ducking, SFX, lyrics, source cuts. | SFX masks key phrase. | Music energy may be slightly high. |
| `face_product_action_safety` | Face, mouth, eyes, hands, product, action visibility. | 3D covers product action. | Overlay sits near face safe zone. |
| `source_proof_safety` | Claims, metrics, rights, redaction, browser/app exactness, provenance. | Unknown source treated as verified proof. | Source note needs clearer wording. |
| `reference_do_not_copy` | Reference DNA inspiration without copying. | Plan copies reference visual/audio. | Motif is close to reference style. |
| `edit_preference_compliance` | Preference snapshot alignment. | Low-credit preference ignored by premium-only plan. | Preferred style partially reflected. |
| `user_instruction_compliance` | Direct must-follow/avoid rules. | User says no music but music route selected. | User asked for faster pacing but plan is moderate. |
| `credit_approval_compliance` | Estimate links, approvals, premium itemization, no spend. | Premium generated 3D lacks approval group. | Estimate copy needs clearer optionality. |
| `no_generation_before_approval` | Generated/provider/worker/render work remains gated. | Plan implies generation already happened. | Approval gate copy could be stronger. |
| `tool_provider_boundary` | Tools/providers stay planning metadata. | Provider secret referenced in plan. | Tool readiness note is vague. |
| `runtime_boundary` | No runtime, browser, media, QA, diagnostics, render, or worker execution. | Route creates job before approval. | Future runtime wording needs caution. |
| `revision_readiness` | Revision links, estimates, approvals, StoryTiming changes, audit. | Revision adds generated B-roll without new approval. | Revision copy missing tradeoff. |
| `user_visible_copy_clarity` | User summary, blocker language, approval copy. | User plan hides blocker. | Warning copy is too technical. |
| `accessibility_readability` | Readability, contrast, captions, comfort, motion intensity. | Text unreadable or motion discomfort likely. | Contrast needs final preview check. |
| `trust_safety` | Truthfulness, privacy, sensitive data, provenance, claims. | Private data visible without redaction plan. | Claim wording should be more cautious. |
| `export_readiness_later` | Future final output readiness. | Export implied before preview QA. | Export QA dependency unclear. |

## Planning Completeness QA

Required completeness checks:

- Visual opportunity has source/context.
- Creative concept traces to opportunity.
- Skill candidate uses canonical skill key.
- Skill route links to concept/candidate.
- Skill route has route reason.
- Planning contract is attached.
- Required plan records are identified.
- StoryTiming readiness is present.
- Credit/approval tendency is present.
- QA requirements are attached.
- Lower-cost alternative is present for premium optional routes when useful.
- Revision linkage is present when relevant.
- User-visible summary is present.

Blocking examples:

- Route has no planning contract.
- Premium route lacks approval/credit hint.
- Skill route has no reason.
- Concept is not linked to opportunity.
- Non-canonical skill key is used.

## Professional Taste QA

Professional taste QA checks:

- Visual/audio choices are earned.
- The edit is not a random effect pile.
- Restraint is used where appropriate.
- Hero moments are protected.
- Visual density matches preference and story.
- Audio density matches speech and story.
- Selected skills serve meaning.
- No generic template behavior dominates.
- No overused motion, transition, or SFX pattern weakens the edit.
- Premium/wow request is not under-served.
- Basic/simple edit is still high quality.

Blocking examples:

- Every clip gets a flashy transition without reason.
- 3D is used everywhere without role.
- Captions are unreadable due to style.
- Music/SFX overpowers speech.

Warning examples:

- Edit may feel slightly generic.
- Visual density is high but not blocking.
- Premium/wow target may need stronger concept.

## Overuse And Underuse QA

Overuse QA checks:

- Too many visual layers.
- Too many moving elements.
- Too many text layers.
- Too many SFX.
- Repeated transitions.
- Repeated 3D/object patterns.
- Repeated B-roll roles.
- Repeated graphic layouts.
- Captions overanimated.
- Music too dense.

Underuse QA checks:

- Premium/wow preference ignored.
- High-priority opportunity not addressed.
- No concept generated for hero opportunity.
- Product demo lacks feature clarity.
- Education clip lacks explanation support.
- Marketing ad lacks proof/CTA clarity.
- B-roll gap ignored in long talking-head section.
- Audio polish missing where needed.

Underuse QA prevents boring generic output. Overuse QA prevents amateur clutter. Both must consider user preference and workflow.

## StoryTiming QA

StoryTiming QA checks:

- Primary focus clear.
- Secondary support does not compete.
- Caption zone clear.
- Overlay, graphic, 3D, and B-roll zones do not collide.
- Visual density budget respected.
- Audio density budget respected.
- SFX permission exists.
- Transition permission exists.
- Music ducking required where speech exists.
- Hero moment protected.
- Restraint windows respected.
- Conflict resolutions documented.

Blocking examples:

- Captions collide with 3D hero object.
- SFX under key speech.
- No primary focus in overloaded window.
- StoryTiming conflict unresolved.

## Caption QA

Caption QA checks:

- Caption source known.
- Accuracy status known.
- Meaning preserved.
- Line breaks readable.
- Read time adequate.
- Placement safe.
- Face, mouth, and eyes protected.
- Product/action protected.
- Contrast/readability acceptable in plan.
- Animation supports reading.
- Captions do not duplicate graphics without purpose.
- Translation/multilingual future review flagged.
- Claim/quote accuracy protected.

Blocking examples:

- Captions change meaning.
- Captions cover speaker mouth/eyes.
- Captions are unreadable.
- User said no captions and captions are forced.

## Speech Clarity And Sound QA

Speech/audio QA checks:

- Speech priority assigned.
- Music ducking planned where needed.
- Lyrics policy defined.
- SFX avoids important speech.
- Room tone/ambience plan exists where needed.
- B-roll audio behavior planned.
- Source audio jumps avoided.
- Music/SFX not copied from reference.
- No generated/custom music without approval.
- Silence/ambience preserved where professional.

Blocking examples:

- Lyrics under important speech without approval.
- Loud SFX under key phrase.
- Unknown music source treated as safe.
- No ducking for speech-heavy section.

## Visual Safety QA

Visual safety QA checks:

- Face-safe placement.
- Eye/mouth protection.
- Hand gesture protection.
- Product/action visibility.
- Safe zones.
- Platform UI margins.
- Redaction zones.
- Source/evidence visual safety.
- Browser/app exact-screen caution.
- Tracking/masking/occlusion readiness.
- 3D scale/depth/lighting intent where needed.

Blocking examples:

- 3D covers face/captions/product.
- Browser/app visual invents exact UI.
- Sensitive data visible without redaction plan.
- Real Motion face-safe rule missing.

## Source/Proof Safety QA

Source/proof QA checks:

- Source status known.
- Proof/context level correct.
- Claim sensitivity flagged.
- User confirmation requested where needed.
- Browser/app/source visuals do not invent facts.
- Reference DNA not copied.
- Exact quotes, metrics, offers, UI labels, or pricing are not invented.
- Sensitive/private data redaction planned.
- Music/audio rights and provenance status known where relevant.

Blocking examples:

- Unknown source treated as verified proof.
- Copied reference visual/audio.
- Unverified metric used in proof card.
- Sensitive screenshot used without redaction plan.

## Credit And Approval QA

Credit/approval QA checks:

- Every credit item links to route/concept.
- Premium optional items itemized.
- Approval group exists where needed.
- Lower-cost alternatives linked.
- Estimate does not imply spend/reservation.
- Approval does not imply job started.
- No-generation-before-approval language present.
- Reservation/spend boundary respected.
- Revision credit impact planned.
- Source-sensitive approval present where needed.

Blocking examples:

- Premium generated 3D lacks approval group.
- Estimate implies credits already spent.
- Route implies generation before approval.
- Subscription described as unlimited AI editing.

## User Instruction And Edit Preference QA

User instruction and edit preference QA checks:

- Must-follow rules honored.
- Avoid rules honored.
- Direct project instruction priority preserved.
- Blocked skills not selected.
- Preferred skills considered but not forced.
- Visual density preference followed.
- Motion intensity preference followed.
- Caption preference followed.
- B-roll preference followed.
- 3D/Real Motion preference followed.
- SoundSync preference followed.
- Credit sensitivity honored.
- Reference DNA does not override user instructions.

Blocking examples:

- User says no music but music selected.
- User blocks captions but captions added.
- Low-credit preference ignored by premium-only plan.
- Reference copied over user preference.

## Tool/Provider/Runtime Boundary QA

Boundary QA checks:

- No tool/provider execution implied.
- No worker job created from planning-only route.
- No provider secret referenced.
- No runtime readiness treated as execution readiness.
- No browser/app capture implied without future authorization.
- No generated assets implied before approval.
- No rendering/export implied before approval.
- Tool candidates remain planning metadata.

Blocking examples:

- Plan says provider has already generated asset.
- Plan stores API key.
- Route creates job before approval.
- Browser screenshot implied as captured when only planned.

## Revision Readiness QA

Revision readiness QA checks:

- Route revision links exist.
- Lower-cost alternatives exist.
- Rejected candidates preserved.
- Affected StoryTiming windows known.
- Credit reestimate needed flagged.
- New approval needed flagged.
- Safe revision options present.
- User-visible revision copy clear.

Examples:

- Remove 3D route and activate graphic alternative.
- Move captions away from 3D.
- Remove SFX under speech.
- Lower cost by replacing generated B-roll with source B-roll.

## QA Blocker Versus Warning Matrix

| Category | Pass | Warning | Blocking | Critical | Recommended action |
| --- | --- | --- | --- | --- | --- |
| `planning_completeness` | All links and records present. | Summary wording thin. | Missing planning contract. | Route claims execution with no plan. | Attach contract or remove route. |
| `professional_taste` | Skills are earned. | Slightly generic. | Random effect pile. | Plan undermines user intent. | Reduce clutter or strengthen concept. |
| `caption_readability` | Readable and safe. | Tight read time. | Captions cover mouth. | Captions change meaning. | Reposition or rewrite. |
| `speech_clarity` | Speech is protected. | Music energy high. | SFX masks phrase. | Lyrics obscure key claim. | Duck, remove, or replace audio. |
| `face_product_action_safety` | Important visuals visible. | Near safe-zone edge. | Overlay covers product. | Face/identity obscured in sensitive moment. | Move layer or change route. |
| `source/proof_safety` | Source truth verified. | Confirmation note unclear. | Unknown source used as proof. | Copied reference or invented metric. | Confirm source or use safe wording. |
| `credit/approval_compliance` | Estimate and approval clear. | Optionality copy thin. | Premium item lacks approval. | Generation implied before approval. | Add approval group or remove item. |
| `StoryTiming_conflict` | Focus and density clear. | Dense but readable. | Unresolved collision. | No primary focus in key moment. | Resolve timing or simplify. |
| `runtime_boundary` | Planning-only. | Future wording vague. | Job implied before approval. | Provider secret or generation claimed. | Rewrite boundary and block route. |
| `edit_preference_compliance` | Preferences honored. | Partial style match. | Avoid rule ignored. | Direct user instruction violated. | Replan around direct instruction. |
| `revision_readiness` | Revision links clear. | Copy could improve. | New approval not flagged. | Revision hides credit increase. | Create revision QA and credit impact. |

## SkillQAReport

Documentation-only pseudo-record for an aggregate QA report.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable QA report ID. | `skill_qa_report_edit_plan_v6` |
| `project_id` | Required | Project context. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan being checked. | `edit_plan_v6` |
| `QA_scope` | Required | Scope of QA report. | `planning_pre_approval` |
| `QA_status` | Required | QA status model value. | `passed_with_warnings` |
| `highest_severity` | Required | Highest severity in results. | `warning` |
| `passed_count` | Required | Passed requirement count. | `18` |
| `warning_count` | Required | Warning count. | `2` |
| `needs_review_count` | Required | Needs-review count. | `0` |
| `blocking_count` | Required | Blocking count. | `0` |
| `critical_count` | Required | Critical count. | `0` |
| `QA_requirement_ids` | Required | Linked requirements. | `skill_qa_req_caption_mouth_safe_001` |
| `QA_result_ids` | Required | Linked results. | `skill_qa_result_caption_mouth_safe_001` |
| `blocker_summary` | Required | Summary of blockers. | `No blockers.` |
| `warning_summary` | Required | Summary of warnings. | `Music energy may need review.` |
| `recommended_next_actions` | Required | Next actions. | `Disclose warning and keep approval gate.` |
| `can_show_user_plan` | Required | Conceptual gate decision. | `true` |
| `can_show_credit_estimate` | Required | Conceptual gate decision. | `true` |
| `can_request_approval` | Required | Conceptual gate decision. | `true` |
| `can_start_future_execution_later` | Required | Conceptual gate decision. | `false` |
| `created_by_agent` | Optional | Future creator/source. | `planning_agent_future` |
| `metadata_json` | Optional | Future metadata placeholder; not schema. | `{ "docs_only": true }` |

## SkillQARepairRecommendation

Documentation-only pseudo-record for an actionable repair recommendation.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable repair recommendation ID. | `skill_qa_repair_caption_move_001` |
| `QA_result_id` | Required | Linked QA result. | `skill_qa_result_caption_mouth_safe_001` |
| `project_id` | Required | Project context. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan being repaired. | `edit_plan_v6` |
| `affected_record_type` | Required | Record type to repair. | `CaptionPlacementPlan` |
| `affected_record_id` | Required | Record ID to repair. | `caption_place_hero_001` |
| `repair_type` | Required | Repair class. | `reposition_layer` |
| `repair_summary` | Required | Short repair summary. | `Move captions below the speaker mouth.` |
| `suggested_change` | Required | Specific suggested change. | `Use lower-safe-zone placement and reduce to two lines.` |
| `affects_credit_estimate` | Required | Whether estimate changes. | `false` |
| `requires_user_input` | Required | Whether user must decide. | `false` |
| `requires_new_approval` | Required | Whether approval must reset. | `true` |
| `safe_to_auto_apply_later` | Required | Whether future system may apply safely. | `true` |
| `metadata_json` | Optional | Future metadata placeholder; not schema. | `{ "source": "RP-SKILLS-19" }` |

## QA Scoring Model

Planning QA may produce component scores:

- `planning_completeness_score`
- `professional_taste_score`
- `StoryTiming_score`
- `readability_score`
- `speech_clarity_score`
- `safety_score`
- `source_truth_score`
- `credit_approval_score`
- `preference_compliance_score`
- `revision_readiness_score`

Documentation-only pseudo formula:

```text
skill_plan_QA_score = planning_completeness + professional_taste + StoryTiming_score + readability_score + speech_clarity_score + safety_score + source_truth_score + credit_approval_score + preference_compliance_score + revision_readiness_score - blocking_issue_penalty - critical_issue_penalty - unresolved_conflict_penalty - runtime_boundary_violation_penalty
```

Any critical or blocking issue can override the numeric score. The score supports decisions but does not execute anything.

## QA Gate Model

Conceptual gates:

| Gate | Meaning | Planning behavior |
| --- | --- | --- |
| `can_show_user_plan` | The user-facing plan can be shown. | Block if summary would hide blockers or unsafe claims. |
| `can_show_credit_estimate` | Credit estimate can be shown. | Block if required estimate context or approval grouping is missing. |
| `can_request_user_approval` | Approval can be requested. | Block if critical/blocking QA issues remain. |
| `can_create_credit_reservation_later` | Future runtime could reserve after approval. | Future-only; not implemented here. |
| `can_start_future_jobs_later` | Future jobs could start after approval/gates. | Future-only; not implemented here. |
| `can_show_preview_later` | Future preview can be shown after output QA. | Future-only; not implemented here. |
| `can_export_later` | Future export can happen after final QA. | Future-only; not implemented here. |

This prompt does not implement gates. Missing blockers should stop progression. Warnings can proceed with disclosure.

## Examples

| Example | QA_category | linked_skill_or_route | issue_summary | severity | recommended_fix | blocks_what | user_visible_message |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Clean edit plan passes with warning | `planning_completeness` | `skill_route_clean_edit_001` | Base clean edit has no lower-cost alternative, which is acceptable because no premium route exists. | `warning` | Note that lower-cost alternative is not needed. | Nothing. | `The base edit is ready; no premium alternative is needed.` |
| 2. 3D hero route blocked | `credit_approval_compliance` | `skill_route_3d_hero_001` | Approval/credit item missing for optional premium 3D. | `blocking` | Add estimate item and approval group, or remove 3D. | Approval and future execution. | `The optional 3D visual needs a separate approval choice.` |
| 3. Caption mouth collision | `caption_readability` | `skill_route_caption_001` | Captions cover speaker mouth. | `blocking` | Move captions to safe zone and shorten lines. | User plan display, approval, preview later. | `Captions need to move so the speaker remains visible.` |
| 4. SoundSync energy warning | `speech_clarity` | `skill_route_soundsync_001` | Music may be slightly too energetic for speech-led section. | `warning` | Lower energy or add ducking note. | Nothing if disclosed. | `Music should stay subtle under the speaker.` |
| 5. B-roll proof source unknown | `source_proof_safety` | `skill_route_broll_proof_001` | Proof visual source status is unknown. | `blocking` | Confirm source or use neutral wording. | Plan display and approval. | `Please confirm this proof source before it appears on screen.` |
| 6. Transition repetition warning | `overuse_detection` | `skill_route_transition_001` | Same transition repeats too often. | `warning` | Vary or reduce transitions. | Nothing if not distracting. | `I will reduce repeated transitions so the edit feels polished.` |
| 7. Dense graphic hierarchy warning | `professional_taste` | `skill_route_graphic_design_001` | Graphic hierarchy is too dense. | `warning` | Simplify to one primary claim and one support point. | Nothing if revised before approval. | `The graphic can be clearer with fewer elements.` |
| 8. StoryTiming collision blocked | `StoryTiming_coordination` | `route_bundle_hero_001` | 3D, captions, and proof card collide in one window. | `blocking` | Pick one primary focus and move support layers. | Plan display, approval, preview later. | `This moment has too many visual layers; I need to simplify it.` |
| 9. User said no music | `user_instruction_compliance` | `skill_route_music_001` | Music route selected despite user avoid rule. | `critical` | Remove music route and preserve silence/ambience. | Plan display, approval, execution. | `You asked for no music, so I will remove the music plan.` |
| 10. Premium underuse warning | `underuse_detection` | `concept_hero_001` | Premium/wow preference has no strong concept for high-priority hero opportunity. | `warning` | Add a stronger earned hero concept or explain restraint. | Nothing if user accepts restrained plan. | `This could use a stronger opening idea if you want more wow.` |
| 11. Runtime boundary blocked | `runtime_boundary` | `skill_route_generated_asset_001` | Plan implies provider generation already happened. | `critical` | Rewrite as planned future generation behind approval. | Plan display, approval, execution. | `No generated asset has been created yet; this remains approval-gated.` |
| 12. Revision readiness passes | `revision_readiness` | `skill_route_3d_hero_001` | Lower-cost graphic alternative and affected routes are linked. | `pass` | Keep revision audit note. | Nothing. | `The lower-cost revision path is ready to review.` |

## Anti-patterns

- QA only checks technical correctness, not taste.
- QA ignores overuse.
- QA ignores underuse.
- QA ignores user preference.
- QA ignores source/proof safety.
- QA ignores StoryTiming.
- QA ignores credit/approval.
- QA accepts skill route without planning contract.
- QA allows premium item without approval group.
- QA treats warnings as clean pass.
- QA treats approval as spend/reservation.
- QA creates runtime execution.
- QA stores provider secrets.
- QA fixes plans silently without audit.
- QA hides blockers from user-facing plan.
- QA allows copied reference material.

## Future Implementation Notes

Possible future records, tables, or types may include:

- `skill_QA_requirements`
- `skill_QA_results`
- `skill_QA_reports`
- `skill_QA_repair_recommendations`
- `skill_QA_gate_decisions`
- `edit_quality_checks` references
- `QA_report` records
- `edit_plan_skill_routes` references
- `StoryTiming` references
- `credit_estimate` references
- `approval_records` references
- `revision_requests` references
- `job_events` references later

This document does not create those records now. Future schema/types must avoid duplicating this docs-only source truth. Runtime QA, validation scripts, diagnostics scripts, media inspection, provider checks, worker checks, and preview/export QA remain future-gated work. QA output is planning metadata, not execution.

## Relationship To Existing edit_quality_checks / planner-validation Direction

Existing docs, types, and libraries already define edit quality checks, QA reports, planner validation, StoryTiming QA, caption/cut QA, music/SFX timing QA, SFX/music QA mocks, approved snapshot validation, credit approval gates, and professional edit quality records.

This contract is skill-specific QA guidance that must reconcile with those existing quality and validation source truths later. It must not replace `edit-quality-engine.md`, existing `edit_quality_checks` direction, `src/lib/planner-validation.ts`, StoryTiming QA, SFX/music QA, credit approval gates, QA report records, or backend mock QA services.

Future implementation should map skill QA into the existing edit quality / QA report flow instead of creating a disconnected QA system.

## Duplicate And Overlap Notes

Reference these owners instead of duplicating them:

- `docs/storytiming-qa-plan.md` for StoryTiming QA guidance.
- `docs/caption-cut-timing-integration.md` for caption/cut QA.
- `docs/music-sfx-timing-integration.md` for SoundSync timing QA.
- `src/lib/planner-validation.ts` for current planner validation.
- `src/types/storytiming.ts` for StoryTiming QA check records.
- `src/types/audio-music.ts` for music/SFX QA records and statuses.
- `docs/credit-runtime-approval-gate.md` and `docs/credit-reservation-spend-refund-flow.md` for credit/approval runtime boundaries.
- Prior RP-SKILLS contracts for planning, StoryTiming, credit/approval, source/proof safety, and revision requirements.

No new QA runtime, validation runtime, diagnostics runtime, schema lane, worker lane, provider lane, render/export lane, or UI lane is created here.

## Missing-file Notes

Current repo inspection found:

- `audio-library-and-licensing.md` exists.
- `soundsync-music-intelligence.md` is missing.
- `music-reference-dna.md` is missing.
- `lyria-music-generation-plan.md` is missing.

Sound/music QA should reference existing audio owners and `audio-library-and-licensing.md`; it must not pretend the missing root docs exist.

## RP-SKILLS-20 Handoff

Recommended next prompt:

`RP-SKILLS-20 - Skill Diagnostics and Static Validation Contract`

Scope:

Docs-only diagnostics/static validation contract that defines future repository checks and validation scripts for the Creative Skill System docs/types/schema: duplicate skill keys, missing planning contracts, missing when-to-avoid rules, premium skill without approval/credit hints, non-canonical skill keys, prompt duplication, runtime unlock detection, package mutation detection, migration timing checks, docs completeness, and CI/static validation boundaries.

Forbidden scope for `RP-SKILLS-20` unless explicitly authorized later:

- Supabase migrations or SQL.
- Runtime code.
- TypeScript implementation.
- React UI.
- Provider calls.
- Workers, jobs, leases, or runtime gates.
- Package installs or package file mutations.
- QA runtime, validation script implementation, diagnostics runtime, schema/runtime behavior, credit runtime, billing, Stripe, wallet, ledger, reservation, approval runtime, skill route runtime, plan assembly runtime, resolver runtime, catalog runtime, concept generator runtime, visual analysis, opportunity detector runtime, preference runtime, settings UI, profile storage, runtime orchestration, render/export runtime, media processing, audio generation, music generation, SFX generation, caption rendering, browser/capture/media/generation runtime, prompt router changes, Playwright execution, animation code, design-token changes, or app behavior.
