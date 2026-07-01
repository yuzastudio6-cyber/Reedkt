# Edit Preference Creative Direction Contract

## Purpose

This document defines the Edit Preference Creative Direction contract for future ReeditPro Creative Skill planning.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, preference storage, profile management, settings UI, media processing, audio processing, caption rendering, browser capture, 3D runtime, animation runtime, runtime orchestration, package changes, Supabase connections, SQL, credentials, or app behavior.

The contract describes how future edit preference profiles and resolved edit preference snapshots should influence skill planning, creative concept selection, skill scoring, StoryTiming coordination, approval, credit estimates, QA, and revisions. It does not execute preference resolution.

Edit preference is planning context. It is not a skill, a template, a preset renderer, a provider route, a worker contract, or an instruction to execute effects.

## Doctrine

Edit preference is creative direction, not a rigid template.

Preference guides taste, density, restraint, style, pacing, credit posture, and creative ambition. It should reduce random decisions, make future plans feel more aligned to the user or project, and help the planner decide which creative ideas deserve attention.

Preference must not make every edit the same. It must not force every preferred skill into every segment. It must not override direct user instruction, approval gates, credit estimates, source/proof safety, claim safety, QA, or the specialized planning contracts.

Core principles:

- "Edit preference guides taste, density, restraint, and creative direction, while the footage, transcript, story, platform, and segment-level opportunity decide the final idea."
- "Preference narrows the creative taste lane; it does not remove creative judgment."

Preference should make the AI more tasteful, not less creative. The AI can still propose surprising ideas when the moment earns them, but the plan must explain why the idea fits the preference and why it fits the source material.

## Contract Relationship

This contract coordinates with the existing Creative Skill planning foundation:

| Contract or owner | Relationship |
| --- | --- |
| `skill-planning-contracts.md` | Preference is universal planning context and should influence planning reasons, scoring, approvals, QA, and revisions. |
| `transition-planning-contract.md` | Preference affects transition energy, intensity, repetition, beat awareness, and use/avoid decisions. |
| `overlay-compositing-planning-contract.md` | Preference affects visual density, zones, overlay roles, material treatment, and restraint. |
| `graphic-design-planning-contract.md` | Preference affects VisualExplain density, information hierarchy, proof cards, CTA cards, and graphic style. |
| `motion-design-planning-contract.md` | Preference affects motion intensity, easing language, repetition, comfort, and hero motion permission. |
| `three-d-visual-planning-contract.md` | Preference affects whether 3D is avoided, optional, useful, or hero-level, but does not bypass approval. |
| `b-roll-planning-contract.md` | Preference affects B-roll density, source/proof posture, display mode, and generated/future source boundaries. |
| `caption-planning-contract.md` | Preference affects caption style, density, emphasis, placement, and accessibility tradeoffs. |
| `sound-music-planning-contract.md` | Preference affects SoundSync, music, SFX, ambience, ducking, lyrics policy, rights, and credit posture. |
| `storytiming-coordination-contract.md` | Preference affects focus/density budgets, hero moment permission, multi-layer permission, conflicts, and restraint windows. |

Existing runtime and typed owners remain the source truth for current behavior: `src/types/reeditpro.ts`, `src/types/edit-planning-db.ts`, `src/lib/workflow-profiles.ts`, `src/lib/intent-compiler.ts`, `src/lib/professional-editing-ontology.ts`, `src/lib/adaptive-edit-strategy.ts`, `src/lib/planner-validation.ts`, `src/lib/prompt-builders.ts`, `src/lib/mock-planner.ts`, and current chat-native UI planning cards.

## Preference Priority Order

Future preference resolution should use this priority order:

1. Current chat direct instruction.
2. Explicit must-follow or do-not-do instruction.
3. Project-specific edit preference.
4. Client, brand, or project brief.
5. Workspace or user default preference.
6. Reference DNA as style guidance, never as a copy rule.
7. Workflow context.
8. Platform and aspect requirements.
9. Skill defaults.
10. AI creative judgment.

Rules:

- Higher priority sources override lower priority sources.
- A direct "no" is respected unless a higher safety, accessibility, legal, or project requirement is explicitly documented.
- Missing preference data must not block planning.
- Conflicts must be recorded instead of silently collapsed.
- Reference DNA can guide style, pacing, mood, or density, but it must not override explicit user instruction or copy the reference.
- AI creative judgment fills gaps and proposes options, but it does not bypass approval, credit, source/proof, or QA gates.

## Preference Source Model

| Source | What it means | Confidence guidance | Use | Avoid |
| --- | --- | --- | --- | --- |
| `current_chat_instruction` | The user gave an instruction in the current chat. | Usually `explicit`. | Treat as highest-priority creative direction. | Do not downgrade because of defaults. |
| `project_preference` | A preference saved or stated for this project. | Usually `explicit` or `strong_inferred`. | Guide this edit plan and future project revisions. | Do not make it a workspace default automatically. |
| `workspace_default_preference` | Workspace-level default style direction. | Usually `explicit` or `default`. | Fill gaps when project/user context is absent. | Do not override current chat. |
| `user_default_preference` | User-level default taste. | Usually `explicit` or `default`. | Keep plans familiar to the user. | Do not force sameness across projects. |
| `client_or_brand_preference` | Client, brand, campaign, or brief guidance. | Usually `explicit`. | Align visuals, motion, voice, color, and restraint. | Do not override safety or direct approved changes. |
| `reference_DNA_influence` | Style guidance from reference material. | Usually `strong_inferred` or `weak_inferred`. | Shape rhythm, density, mood, and visual language. | Do not copy exact shots, timings, music, title sequences, captions, or claims. |
| `workflow_context_default` | Defaults from Simple Clean, Social Short, Product Demo, etc. | Usually `default`. | Provide sane starting posture. | Do not override explicit preference. |
| `platform_default` | Requirements from aspect ratio, platform, and consumption context. | Usually `default`. | Protect readability, safe areas, pacing, and density. | Do not treat as creative taste by itself. |
| `AI_inferred_preference` | The planner inferred likely taste from weak signals. | Usually `weak_inferred`. | Suggest options and explain uncertainty. | Do not present as user-stated truth. |
| `mock_only` | Placeholder/demo preference in current mock surfaces. | Usually `default`. | Document demo behavior honestly. | Do not treat as persisted preference. |
| `unknown` | No usable preference is known. | `unknown`. | Let AI decide with professional restraint. | Do not invent user taste. |

## Confidence And Strength

Confidence values:

- `explicit`: directly stated, selected, or confirmed.
- `strong_inferred`: inferred from strong repeated signals or project context.
- `weak_inferred`: inferred from limited signals.
- `default`: supplied by workflow, platform, mock, or product default.
- `unknown`: no reliable preference exists.

Strength values:

- `must_follow`: Required unless the user changes it or a higher safety/legal requirement applies.
- `strong_preference`: Should strongly affect scoring and concept generation.
- `soft_preference`: Should nudge scoring without blocking alternatives.
- `experimental_preference`: Allows bolder options, usually with approval.
- `avoid`: Penalizes or rejects matching skills unless justified.
- `blocked`: Blocks matching skills unless direct user instruction overrides it.

## Documentation-only Pseudo-record: EditPreferenceProfile

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, preference storage, UI, worker spec, provider instruction, or executable contract.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable profile identifier. | `pref_profile_real_estate_luxury` |
| `owner_type` | Required | Owner of the profile. | `project` |
| `owner_id` | Required | Owner reference. | `project_lake_house_listing` |
| `profile_name` | Required | Human-readable profile name. | `Luxury property walkthrough` |
| `profile_scope` | Required | Scope where the profile applies. | `project_only` |
| `status` | Required | Profile lifecycle status. | `active` |
| `visual_density_preference` | Required | Preferred visual density. | `restrained` |
| `motion_intensity_preference` | Required | Preferred motion intensity. | `subtle` |
| `transition_energy_preference` | Required | Preferred transition energy. | `subtle_premium` |
| `caption_style_preference` | Required | Preferred caption style. | `premium_subtle` |
| `caption_density_preference` | Required | Preferred caption density. | `minimal` |
| `B_roll_preference` | Required | Preferred B-roll posture. | `rich_source_B_roll` |
| `graphic_design_preference` | Required | Preferred graphic design posture. | `restrained_premium` |
| `three_d_preference` | Required | Preferred 3D posture. | `3D_hero_moments_when_earned` |
| `Real_Motion_preference` | Required | Preferred Real Motion posture. | `Real_Motion_optional_premium` |
| `Stroke_Motion_preference` | Required | Preferred Stroke Motion posture. | `subtle_Stroke_Motion_if_meaningful` |
| `SoundSync_preference` | Required | Preferred music/audio-support posture. | `premium_mood_bed` |
| `SFX_preference` | Required | Preferred SFX posture. | `minimal_SFX` |
| `pacing_preference` | Required | Preferred pacing direction. | `calm_luxury_with_room_to_breathe` |
| `color_mood_preference` | Required | Preferred color and mood direction. | `warm_premium_natural` |
| `restraint_level` | Required | Preferred restraint. | `premium_restrained` |
| `wow_factor_target` | Required | Desired creative ambition level. | `premium` |
| `premium_skill_tolerance` | Required | Willingness to consider premium/heavy skills. | `approve_optional_premium` |
| `credit_sensitivity` | Required | Credit/cost posture. | `approve_optional_premium` |
| `preferred_skill_keys` | Optional | Skills that should receive a scoring boost. | `B_roll, SoundSync, graphic_design` |
| `blocked_skill_keys` | Optional | Skills that should be blocked unless overridden. | `bold_social_captions` |
| `avoid_rules` | Optional | Preference-specific avoid rules. | `avoid loud transitions during room reveals` |
| `must_follow_rules` | Optional | Preference-specific must-follow rules. | `protect property details and keep text minimal` |
| `source_of_truth_notes` | Optional | Notes about where this preference came from. | `client brief plus direct chat confirmation` |
| `created_from` | Required | Source that created the profile. | `current_chat_instruction` |
| `confidence` | Required | Confidence in this profile. | `explicit` |
| `created_at` | Optional | Future timestamp if implemented. | `2026-06-24T15:30:00Z` |
| `updated_at` | Optional | Future timestamp if implemented. | `2026-06-24T15:45:00Z` |
| `metadata_json` | Optional | Future flexible notes. | `{\"brand\":\"Lake House Group\"}` |

## Resolved Preference Snapshot

A resolved edit preference snapshot is the future planning artifact that freezes the preference inputs used for one edit plan.

The snapshot should make future planning auditable. It should say which preference sources were used, which conflicts were resolved, what the final density/style/credit posture is, and how confident the planner is. It should not become a renderer instruction or a settings profile unless a future approved milestone creates that behavior.

## Documentation-only Pseudo-record: ResolvedEditPreferenceSnapshot

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, preference storage, UI, worker spec, provider instruction, or executable contract.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable snapshot identifier. | `resolved_pref_042` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `source_profile_ids` | Optional | Profiles used to resolve preference. | `pref_profile_workspace_social, pref_profile_project_launch` |
| `source_preference_messages` | Optional | Direct messages or brief excerpts used as evidence. | `make it premium but not busy` |
| `resolved_visual_density` | Required | Final visual density. | `balanced` |
| `resolved_motion_intensity` | Required | Final motion intensity. | `restrained` |
| `resolved_transition_energy` | Required | Final transition energy. | `subtle_premium` |
| `resolved_caption_style` | Required | Final caption style. | `keyword_emphasis` |
| `resolved_caption_density` | Required | Final caption density. | `balanced` |
| `resolved_B_roll_preference` | Required | Final B-roll posture. | `proof_context_first` |
| `resolved_graphic_design_preference` | Required | Final graphic design posture. | `balanced_visual_explain` |
| `resolved_three_d_preference` | Required | Final 3D posture. | `3D_hero_moments_when_earned` |
| `resolved_Real_Motion_preference` | Required | Final Real Motion posture. | `avoid_Real_Motion_unless_requested` |
| `resolved_Stroke_Motion_preference` | Required | Final Stroke Motion posture. | `story_beats_only` |
| `resolved_SoundSync_preference` | Required | Final SoundSync posture. | `subtle_music_bed` |
| `resolved_SFX_preference` | Required | Final SFX posture. | `subtle_visual_support` |
| `resolved_pacing_preference` | Required | Final pacing direction. | `fast_social_but_readable` |
| `resolved_color_mood` | Required | Final color/mood direction. | `clean_bright_confident` |
| `resolved_restraint_level` | Required | Final restraint level. | `balanced` |
| `resolved_wow_factor_target` | Required | Final wow target. | `high_impact` |
| `resolved_credit_sensitivity` | Required | Final credit posture. | `balanced_cost` |
| `resolved_preferred_skill_keys` | Optional | Preferred skills after conflict resolution. | `caption, motion_design, SoundSync` |
| `resolved_blocked_skill_keys` | Optional | Blocked skills after conflict resolution. | `generated_music, 3D_screen_interaction` |
| `resolved_must_follow_rules` | Optional | Must-follow rules after resolution. | `keep claims source-backed` |
| `resolved_avoid_rules` | Optional | Avoid rules after resolution. | `avoid heavy effects over product UI` |
| `conflict_summary` | Optional | Conflicts found. | `Reference DNA was high-energy; user asked for calm premium style.` |
| `resolution_notes` | Optional | How conflicts were resolved. | `Direct user instruction wins; use reference only for polish level.` |
| `confidence` | Required | Confidence in the resolved snapshot. | `explicit` |
| `created_at` | Optional | Future timestamp if implemented. | `2026-06-24T16:10:00Z` |
| `metadata_json` | Optional | Future flexible notes. | `{\"workflow\":\"Product Demo\"}` |

## Preference Conflict Model

Conflict types:

- `direct_instruction_vs_default_preference`
- `reference_DNA_vs_user_preference`
- `workflow_context_vs_project_preference`
- `platform_need_vs_visual_preference`
- `credit_sensitivity_vs_wow_factor`
- `blocked_skill_vs_reference_DNA`
- `no_extra_visuals_vs_caption_accessibility`
- `no_music_vs_reference_music_DNA`
- `premium_visuals_vs_low_credit_cost`
- `clean_style_vs_high_motion_reference`
- `brand_preference_vs_user_instruction`
- `unknown_or_missing_preference`

## Documentation-only Pseudo-record: EditPreferenceConflictResolution

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, preference storage, UI, worker spec, provider instruction, or executable contract.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable conflict resolution identifier. | `pref_conflict_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `conflict_type` | Required | Conflict type. | `reference_DNA_vs_user_preference` |
| `conflicting_sources` | Required | Sources in conflict. | `reference_DNA_influence, current_chat_instruction` |
| `higher_priority_source` | Required | Source that wins by priority. | `current_chat_instruction` |
| `resolution_decision` | Required | Resolved direction. | `Use calm premium pacing, not high-energy reference timing.` |
| `resolution_reason` | Required | Why this decision is correct. | `Direct chat instruction outranks Reference DNA.` |
| `user_confirmation_required` | Required | Whether the user must confirm. | `false` |
| `affected_skill_keys` | Optional | Skill plans affected. | `transition, motion_design, SoundSync` |
| `affected_storytiming_windows` | Optional | StoryTiming windows affected. | `hero_intro_window, proof_card_window` |
| `credit_impact` | Optional | Credit impact. | `reduces optional premium motion concept` |
| `metadata_json` | Optional | Future flexible notes. | `{\"reference\":\"sports_launch_reference\"}` |

## Visual Density Preference

Values:

- `no_extra_visuals`
- `minimal`
- `restrained`
- `balanced`
- `rich`
- `hero_moments_only`
- `maximum_wow_when_earned`
- `let_AI_decide`

Guidance:

- `no_extra_visuals` still allows required captions, safety notices, or accessibility support when justified.
- `minimal` and `restrained` should produce fewer overlays, graphics, B-roll, and 3D candidates.
- `balanced` allows useful supporting visuals without crowding.
- `rich` allows more graphic design, B-roll, motion, and SoundSync when story value is clear.
- `hero_moments_only` and `maximum_wow_when_earned` protect most of the edit from clutter so the best moments can land.
- `let_AI_decide` requires the plan to explain the chosen density from source, story, platform, and workflow.

## Motion Intensity Preference

Values:

- `no_motion`
- `invisible_polish`
- `subtle`
- `restrained`
- `balanced`
- `energetic`
- `hero_motion_when_earned`
- `let_AI_decide`

Guidance:

- Motion preference affects animation, transitions, caption emphasis, overlays, 3D movement, and Graphic Design reveals.
- `no_motion` does not mean bad editing. It means motion should not be a visible creative feature unless required for readability or safety.
- Energetic and hero motion still require timing, comfort, caption readability, speech safety, and QA.

## Transition Energy Preference

Values:

- `clean_cuts_only`
- `invisible_or_clean`
- `subtle_premium`
- `balanced`
- `beat_aware`
- `energetic_social`
- `hero_transitions_only`
- `let_AI_decide`

Guidance:

- Transition energy affects use/avoid decisions, family selection, edge behavior, SFX permission, and repeated transition language.
- `clean_cuts_only` can still be professional and premium.
- Beat-aware or energetic transitions must protect speech, captions, faces, product action, and StoryTiming focus.

## Caption Preference

Caption style values:

- `no_captions`
- `basic_readable`
- `premium_subtle`
- `bold_social`
- `keyword_emphasis`
- `educational_clear`
- `accessibility_first`
- `quote_focused`
- `brand_aligned_custom`
- `let_AI_decide`

Caption density values:

- `none`
- `minimal`
- `restrained`
- `balanced`
- `dense`
- `full_transcript`
- `hero_reduced`
- `let_AI_decide`

Guidance:

- Caption preference must preserve meaning first, readability second, and style third.
- `no_captions` blocks caption candidates unless accessibility, platform, or direct project requirements justify asking for confirmation.
- Caption density must coordinate with overlays, graphics, B-roll, 3D, and StoryTiming fallback zones.
- Translation and multilingual behavior remain future work and must not be implied as implemented.

## B-roll Preference

Values:

- `no_B_roll`
- `source_only`
- `minimal_source_B_roll`
- `balanced_source_B_roll`
- `rich_source_B_roll`
- `proof_context_first`
- `cinematic_B_roll`
- `allow_generated_future_if_approved`
- `allow_3D_B_roll_if_approved`
- `let_AI_decide`

Guidance:

- B-roll preference affects source selection, proof/context posture, density, display mode, and whether optional generated or 3D B-roll can be proposed.
- `source_only` and source-focused values should prefer uploaded footage, approved media, and existing assets.
- Generated/future B-roll is never automatic. It requires credit estimate, approval, and source/proof safety.

## Graphic Design Preference

Values:

- `no_graphics`
- `minimal_labels_only`
- `restrained_premium`
- `balanced_visual_explain`
- `graphic_rich`
- `education_diagram_heavy`
- `proof_cards_allowed`
- `CTA_cards_allowed`
- `brand_aligned_custom`
- `let_AI_decide`

Guidance:

- Graphic Design preference affects VisualExplain use, proof cards, CTA cards, diagrams, labels, type hierarchy, density, and brand alignment.
- Graphic-rich does not mean every sentence gets a card.
- Proof cards and evidence visuals must not invent websites, dashboards, metrics, prices, labels, or exact claims.

## 3D And Real Motion Preference

3D values:

- `no_3D`
- `avoid_3D_unless_requested`
- `subtle_3D_if_useful`
- `3D_B_roll_if_useful`
- `3D_overlay_if_useful`
- `3D_screen_interaction_if_useful`
- `3D_hero_moments_when_earned`
- `out_of_this_world_when_earned`
- `let_AI_decide`

Real Motion values:

- `no_Real_Motion`
- `avoid_Real_Motion_unless_requested`
- `Real_Motion_if_useful`
- `Real_Motion_optional_premium`
- `Real_Motion_hero_moments`
- `let_AI_decide`

Guidance:

- 3D preference affects role selection: B-roll, overlay, screen interaction, explainer, metaphor, hero reveal, environment extension, transition object, data visualization, or product breakout.
- `out_of_this_world_when_earned` means stronger concept generation, not random 3D everywhere.
- Real Motion remains distinct from 3D. Preference can allow it, but future planning must respect Real Motion ownership and runtime boundaries.
- Premium, generated, or heavy visual ideas still require approval, credit estimate, source/model/provenance notes, and QA.

## Stroke Motion Preference

Values:

- `no_Stroke_Motion`
- `avoid_unless_requested`
- `subtle_Stroke_Motion_if_meaningful`
- `story_beats_only`
- `source_reading_when_needed`
- `expressive_Stroke_Motion`
- `let_AI_decide`

Guidance:

- Stroke Motion preference affects hand-drawn marks, path reads, source emphasis, annotations, and expressive story beats.
- Stroke Motion should not cover captions, faces, product action, source evidence, or important UI.
- Expressive Stroke Motion still needs a reason, timing, restraint, and QA.

## SoundSync And SFX Preference

SoundSync values:

- `no_music`
- `ambience_only`
- `voice_first_cleanup`
- `subtle_music_bed`
- `premium_mood_bed`
- `energetic_social_music`
- `cinematic_score`
- `generated_music_future_if_approved`
- `let_AI_decide`

SFX values:

- `no_SFX`
- `minimal_SFX`
- `subtle_visual_support`
- `beat_aware_SFX`
- `rich_sound_design_when_earned`
- `let_AI_decide`

Guidance:

- SoundSync preference affects music role, ambience, silence, beat maps, SFX permission, ducking, lyrics policy, rights/provenance, and credit posture.
- `no_music` must be honored unless direct user instruction changes it or a project requirement is confirmed.
- SFX should support visuals and story. Automatic SFX everywhere is a failure.
- Generated music remains future gated work and requires approval, credit estimate, and rights/provenance planning.

## Restraint And Wow-factor Preference

Restraint level values:

- `strict_restraint`
- `professional_clean`
- `premium_restrained`
- `balanced`
- `expressive`
- `cinematic_rich`
- `maximum_wow_when_earned`

Wow-factor target values:

- `none`
- `subtle_polish`
- `professional`
- `premium`
- `high_impact`
- `out_of_this_world_when_earned`
- `experimental_with_approval`

Guidance:

- Wow-factor does not bypass planning.
- Maximum wow still requires StoryTiming, credit, approval, and QA.
- Strict restraint does not mean low quality.
- Out-of-this-world means better creative concept generation, not random effects everywhere.
- Experimental ideas require approval and a lower-cost or restrained alternative.

## Credit Sensitivity Preference

Values:

- `lowest_cost`
- `balanced_cost`
- `approve_optional_premium`
- `premium_best_result`
- `no_preference_let_AI_estimate`

Guidance:

- Credit sensitivity influences optional premium skills.
- Low credit should push lower-cost alternatives.
- Premium best result still requires estimate and approval.
- Credit preference does not allow unapproved generation.
- Credit sensitivity can reject or downgrade a strong creative idea when the same story goal has a lower-cost path.

## Preferred And Blocked Skills

Preferred skills increase scoring but do not force use. Blocked skills should not be selected unless direct user instruction changes them or a higher requirement is documented and confirmed.

Rules:

- Preferred skills increase candidate scoring only when the segment earns them.
- Blocked skills should create rejection records if they were otherwise good candidates.
- Preferred heavy skills still need approval and credit estimates.
- Skill preference remains segment-aware.
- The system should avoid using preferred skills everywhere.
- A blocked skill cannot be revived by Reference DNA, workflow defaults, or AI creative judgment alone.

Examples:

- A user prefers 3D, but a minor sentence does not earn 3D.
- A user blocks captions, so caption candidates are blocked unless accessibility or project requirements change.
- A user prefers Graphic Design, so VisualExplain gets higher scoring where it clarifies.
- A user prefers minimal visuals, but one hero visual can still be proposed as optional if the project asks for wow.

## Preference Influence On Skill Scoring

Preference modifies future skill scoring; it does not replace the universal planning contract or specialized skill contracts.

Positive score effects:

- Preferred skill match.
- Density match.
- Style match.
- Motion intensity match.
- Wow target match.
- Credit tolerance match.
- Workflow/preference alignment.

Negative score effects:

- Blocked skill.
- Over-density.
- Under-wow for premium target.
- Credit mismatch.
- Tone mismatch.
- Repeated pattern mismatch.
- Direct user avoid rule.
- Source/proof risk.

Documentation-only pseudo logic:

```text
skill_preference_adjustment =
  preferred_skill_bonus
+ style_fit_bonus
+ density_fit_bonus
+ wow_target_fit_bonus
+ credit_tolerance_fit_bonus
- blocked_skill_penalty
- overuse_penalty
- preference_conflict_penalty
- credit_sensitivity_penalty
- user_avoid_penalty
```

Documentation-only pseudo logic:

```text
creative_concept_preference_fit =
  visual_taste_fit
+ motion_taste_fit
+ audio_taste_fit
+ restraint_fit
+ novelty_fit
- generic_template_risk
- sameness_risk
- conflict_with_must_follow_rules
```

## Preference Influence On Creative Concept Generation

Preferences should affect the kinds of concepts generated. They should not create the same concept every time.

Rules:

- Preferences should guide concept families, density, motion language, sound posture, and ambition.
- The AI should still generate multiple candidates when a strong opportunity exists.
- Concepts should vary by footage, transcript, story, platform, workflow, and segment.
- The planner should include at least one lower-cost or restrained alternative for premium ideas.
- Experimental or wow preferences should increase concept ambition but not bypass approval.
- Direct project instructions override default preference concepts.

Examples:

- Premium/luxury preference generates elegant, spacious concepts.
- Energetic/social preference generates stronger beat-aware concepts.
- Educational preference generates diagram/framework concepts.
- Out-of-this-world preference generates bolder 3D, motion, and graphic concepts, but only for earned moments.

## Preference Influence On StoryTiming

Edit preference affects StoryTiming by shaping the allowed density and ambition for each window.

Preference can influence:

- Visual density budget.
- Audio density budget.
- Caption priority.
- Hero moment permission.
- SFX permission.
- Transition permission.
- Multi-layer permission.
- Restraint windows.
- Fallback zone behavior.
- Premium moment approval.
- Conflict resolution priority.

Examples:

- Minimal preference: StoryTiming removes secondary overlays sooner.
- Hero/wow preference: StoryTiming protects one hero moment and reduces competing captions/graphics.
- No music preference: StoryTiming preserves ambience and silence.
- Graphic-rich preference: StoryTiming allows more text layers only if readability QA passes.

## Preference Influence By Workflow Context

Workflow context combines with preference; it does not override higher-priority user instruction.

| Workflow context | How preference should guide planning | What should not be forced | Example |
| --- | --- | --- | --- |
| Simple Clean Edit | Favor clarity, clean cuts, low density, voice-first audio, and low credit. | Do not add graphics or music because defaults exist. | A balanced visual preference may allow one lower third, not a full visual system. |
| Social Short / Viral Clip | Allow stronger captions, faster pacing, beat-aware transitions, and energetic motion if preferred. | Do not make every moment loud or dense. | Bold captions are used for hooks and payoffs, then reduced for breathing room. |
| Talking Head / Personal Brand | Protect face, voice, credibility, and brand tone. | Do not hide expression with overlays. | Premium restrained preference uses subtle lower thirds and clean SoundSync. |
| Podcast Clip | Protect speech, quotes, listening comfort, and caption readability. | Do not force visual-heavy design over conversational value. | Minimal preference keeps captions readable and uses sparse B-roll. |
| Vlog / Lifestyle | Let mood, source footage, and pacing carry the edit. | Do not overproduce intimate moments. | Cinematic B-roll is used where source footage supports atmosphere. |
| Product Demo | Favor screen-safe callouts, proof/context visuals, and readable UI zones. | Do not invent UI labels or metrics. | Graphic Design preference boosts source-backed callouts and optional product breakout. |
| Real Estate / Property Tour | Favor spatial clarity, luxury pacing, source B-roll, and subtle audio. | Do not add aggressive social motion by default. | Premium preference supports restrained B-roll and warm SoundSync. |
| Education / Explainer | Favor clarity, hierarchy, diagrams, captions, and low distraction. | Do not add decorative motion without meaning. | Graphic-rich preference becomes framework diagrams with clean captions. |
| Marketing Ad | Favor proof, CTA, offer clarity, hero moments, and credit-aware premium options. | Do not make unsupported claims. | High-impact preference proposes one hero 3D/product moment and a lower-cost graphic alternative. |
| Testimonial / Case Study | Favor trust, speaker emotion, proof safety, and restrained support. | Do not cover emotional speaker moments. | Proof cards appear only where claims are source-backed. |
| Custom / Let AI Decide | Use source, story, platform, and preference confidence to choose. | Do not invent missing preferences. | Unknown preference produces a balanced plan with documented assumptions. |

## Preference QA

Preference-specific QA should verify:

- Direct user instructions honored.
- Blocked skills not selected.
- Preferred skills considered but not forced.
- Edit preference snapshot exists.
- Preference conflicts resolved.
- Visual density matches preference.
- Motion intensity matches preference.
- Caption preference honored.
- B-roll preference honored.
- 3D/Real Motion preference honored.
- Stroke Motion preference honored.
- SoundSync preference honored.
- Credit sensitivity honored.
- Wow target honored where earned.
- No sameness/template repetition.
- No preference bypass of approval, credit, source safety, proof safety, or QA.
- No Reference DNA override of user preference.

Blocking examples:

- User said no captions but captions were added without requirement or approval.
- User blocked 3D but 3D was selected.
- No music preference was ignored.
- Low-credit preference was ignored by a premium-only plan.
- Generated or premium skill was selected without approval.
- Reference DNA overrode explicit user instruction.

Warning examples:

- Preference confidence is weak.
- Visual density may be slightly high.
- Wow target may be under-served.
- Preferred skill was considered but rejected; ensure the reason is documented.
- Preference conflict may require user confirmation.

## Preference Revision Behavior

Safe revision options:

- Make edit cleaner.
- Make edit more visual.
- Use more graphic design.
- Use less graphic design.
- Use more 3D.
- Remove 3D.
- Make motion subtler.
- Make motion stronger.
- Reduce captions.
- Add captions.
- Remove music.
- Make SoundSync more premium.
- Use source B-roll only.
- Allow optional premium ideas.
- Lower credit cost.
- Make it more out-of-this-world.
- Make it more restrained.
- Update project preference snapshot.
- Save this as future workspace/user preference later.

Rules:

- Some revisions change only the current edit plan.
- Saving as default preference is future behavior and is not implemented here.
- Preference changes may require re-scoring skills and re-estimating credits.
- Premium or generation changes require approval.
- Revisions must not silently mutate workspace/user defaults.

## Examples

Each example below is documentation-only and describes future planning behavior.

| Example | preference_source | resolved_preference_summary | affected_skill_scores | planning_behavior | restraint_behavior | StoryTiming_behavior | credit_behavior | QA checks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Simple clean edit with no extra visuals | `current_chat_instruction` | `visual_density=no_extra_visuals`, `motion=invisible_polish`, `SoundSync=voice_first_cleanup` | Captions, overlays, motion, 3D, and SFX are penalized unless required. | Plan clean cuts, source audio cleanup, and minimal caption fallback if needed. | No decorative visuals. | Primary focus stays on speaker/source. | Lowest-cost path preferred. | Block if extra visuals appear without reason. |
| Premium real estate | `project_preference` | `rich_source_B_roll`, `restrained_premium` graphics, `premium_mood_bed` | B-roll and SoundSync score higher; loud transitions score lower. | Use room pacing, detail cutaways, subtle lower thirds. | Keep luxury whitespace and avoid clutter. | Protect property detail windows. | Premium music may require approval. | Check source/proof, face/property safety, music rights. |
| Social short | `workflow_context_default` plus direct preference | Bold captions, energetic motion, beat-aware transitions. | Captions, motion, transitions, and SFX score higher at hooks/payoffs. | Generate hook-focused concepts and beat-aware pacing. | Reduce density during key speech. | Protect caption read time. | Balanced credits with optional premium beat sync. | Check readability, repetition, speech safety. |
| Education explainer | `client_or_brand_preference` | VisualExplain diagrams, clear captions, low-distraction music. | Graphic Design and captions score higher; SFX scores lower. | Use diagrams for concepts and captions for definitions. | Avoid decorative motion. | Prioritize caption/diagram reading windows. | Prefer low-cost graphics before premium generation. | Check claim accuracy and text hierarchy. |
| Product demo | `project_preference` | Screen-safe graphic callouts and optional 3D product breakout. | Graphic Design scores higher; 3D gets optional hero boost. | Plan callouts from observed UI and one product breakout candidate. | Avoid covering UI labels or product action. | Assign fallback caption zones during screen views. | 3D requires estimate and approval. | Check no invented UI/source details. |
| Marketing ad | `brand_preference` | Proof cards, CTA graphics, optional hero 3D. | Graphic Design, proof cards, and 3D hero candidates score higher. | Propose one high-impact hero and a lower-cost card alternative. | Keep proof moments legible. | Protect CTA and proof windows. | Premium options require approval. | Check claims, credits, and CTA clarity. |
| Testimonial case study | `workflow_context_default` | Trust-first B-roll, restrained music, careful proof wording. | B-roll and SoundSync score higher; bold motion lower. | Use source cutaways and proof cards only when source-backed. | Protect emotional speaker moments. | Speaker face/voice usually primary. | Prefer source-only B-roll. | Check proof wording and emotion safety. |
| Out-of-this-world earned hero | `current_chat_instruction` | One strong 3D hero moment, coordinated restraint elsewhere. | 3D, motion, SoundSync, and transition score higher only in hero window. | Generate bolder hero concepts with lower-cost alternative. | Keep surrounding edit simpler. | Hero window gets protected focus and reduced competitors. | Premium approval required. | Check StoryTiming, credit, source/model/provenance, QA. |
| Low-credit version | `current_chat_instruction` | Replace 3D/Real Motion with source B-roll and graphic cards. | Premium/heavy skills penalized; source B-roll and graphics boosted. | Preserve story value with low-cost source and design choices. | Avoid premium optional concepts unless asked. | Maintain clarity with lower density. | Lowest-cost path wins. | Check that premium-only plan is rejected. |
| Reference DNA conflict | `reference_DNA_influence` plus current chat | Reference is high-energy; user asks calm premium style. | Energetic transitions/motion penalized; subtle premium boosted. | Use reference polish level only, not timing or intensity. | Calm direct instruction wins. | StoryTiming protects slower pacing and silence. | Balanced credits. | Check Reference DNA does not override explicit preference. |

## Anti-patterns

- Preference treated as rigid template.
- Same edit style applied to every project.
- Preferred skill used everywhere.
- Blocked skill selected without override.
- Reference DNA overrides user preference.
- Workflow context overrides user instruction.
- Out-of-this-world means effects everywhere.
- Minimal preference means low quality.
- Low-credit preference ignored.
- No music, no captions, or no 3D ignored.
- Preference not snapshotted.
- Preference conflict silently ignored.
- Preference used to bypass approval.
- Preference used to bypass source/proof safety.
- Preference saved as default without user intent.
- Worker execution from raw preference text only.

## Future Implementation Notes

Possible future records, tables, or types:

- `edit_preference_profiles`
- `edit_preference_profile_versions`
- `resolved_edit_preference_snapshots`
- `edit_preference_conflict_resolutions`
- `edit_preference_skill_adjustments`
- `edit_preference_revision_requests`
- `edit_plan_skill_routes` preference links
- `creative_concept` preference fit scoring
- `StoryTiming` density budget references
- `approval_records` references
- `credit_estimates` references

Future schema, TypeScript, runtime, preference UI, profile saving, and workspace/user preference management must be separately approved. This document does not create those records now.

Future implementation must avoid duplicating this document as a competing source truth. Preferences should be used as planning context, not as direct execution instructions.

## Duplicate And Missing-file Notes

Existing preference and edit-direction ownership already appears in typed/mock/frontend surfaces:

- `src/types/reeditpro.ts` defines current `VisualPreference`, `CreditPreference`, `ResolvedEditingSettings`, and `CompiledEditingIntent` shapes.
- `src/types/edit-planning-db.ts` maps current edit planning records to visual and credit preference fields.
- `src/lib/workflow-profiles.ts` owns current workflow, visual preference, and credit preference options.
- `src/lib/intent-compiler.ts` compiles current user intent and includes Reference DNA safety notes.
- `src/lib/professional-editing-ontology.ts` owns current professional edit styles, pacing, transitions, captions, B-roll, sound, color, and workflow defaults.
- `src/lib/adaptive-edit-strategy.ts`, `src/lib/planner-validation.ts`, `src/lib/prompt-builders.ts`, and `src/lib/mock-planner.ts` already cover adaptive strategy, generation restraint, validation, prompts, and mock planning.
- RP-SKILLS-02 through RP-SKILLS-11 already define universal contracts, specialized skill contracts, and StoryTiming coordination.

This document must remain a navigation and planning contract layer over those owners.

Requested root reading status:

- `audio-library-and-licensing.md` exists.
- `soundsync-music-intelligence.md` is missing in the current repo snapshot.
- `music-reference-dna.md` is missing in the current repo snapshot.
- `lyria-music-generation-plan.md` is missing in the current repo snapshot.

## RP-SKILLS-13 Handoff

Recommended next prompt:

`RP-SKILLS-13 - Skill Taxonomy and Skill Family Catalog Contract`

Scope:

Docs-only skill taxonomy contract that defines top-level skill families, skill keys, launch skill list, naming rules, family relationships, planning-contract mapping, skill lifecycle metadata, skill aliases, duplicate-skill prevention, and how future skill catalog records should map to the RP-SKILLS planning contracts without creating schema or runtime.

Forbidden scope for `RP-SKILLS-13` unless explicitly authorized later:

- Supabase migrations or SQL.
- Runtime code.
- TypeScript implementation.
- React UI.
- Provider calls.
- Workers, jobs, leases, or runtime gates.
- Package installs or package file mutations.
- Preference runtime, settings UI, profile storage, skill registry runtime, schema/runtime behavior, render/export runtime, prompt router changes, browser/capture/media/generation runtime, Playwright execution, animation code, design-token changes, or app behavior.
