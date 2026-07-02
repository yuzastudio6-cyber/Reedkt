# StoryTiming Coordination Contract

## Purpose

This document defines the StoryTiming coordination contract for future ReeditPro Creative Skill plans.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, media processing, audio processing, caption rendering, browser capture, 3D runtime, animation runtime, runtime orchestration, package changes, Supabase connections, SQL, credentials, or app behavior.

StoryTiming coordinates all previous RP-SKILLS planning contracts:

- RP-SKILLS-02 universal skill planning.
- RP-SKILLS-03 transitions.
- RP-SKILLS-04 overlays/compositing.
- RP-SKILLS-05 Graphic Design / VisualExplain.
- RP-SKILLS-06 motion design.
- RP-SKILLS-07 3D visuals.
- RP-SKILLS-08 B-roll.
- RP-SKILLS-09 captions.
- RP-SKILLS-10 SoundSync/music/SFX.

This document defines how future docs, types, schema, workers, render handoff records, approval records, credit estimates, and QA systems should reason about skill conflicts, density, focus, timing, approvals, and QA if StoryTiming coordination is eventually implemented. It does not execute editing.

## StoryTiming Doctrine

StoryTiming is not a timeline effect.

StoryTiming is the coordination layer between story, visuals, captions, motion, audio, and editing. It protects viewer focus. It decides what is primary, what is secondary, what waits, what gets removed, what gets quieter, and what must block preview until fixed.

A professional edit is not "everything everywhere." A professional edit can still be rich, cinematic, and out-of-this-world, but the viewer should always know what to look at and hear. StoryTiming uses restraint to make hero moments stronger. StoryTiming can decide that no extra visual or sound should happen in a moment.

StoryTiming must align user preference, story beats, screen safety, speech clarity, credit cost, and approval.

Core principle:

"Every moment needs one clear primary focus unless a deliberate multi-layer design moment is planned."

## Contract Inheritance And Coordination Role

StoryTiming coordinates the outputs of individual planning contracts. It does not redefine those contracts.

| Contract | What StoryTiming receives | What StoryTiming coordinates |
| --- | --- | --- |
| RP-SKILLS-02 universal planning | Planning reason, timing, composition, audio, tool, credit, approval, QA, revision envelope. | Whether the selected skill can coexist with other skills in the same time range. |
| RP-SKILLS-03 transitions | Transition window, family, intensity, edge behavior, audio/SFX notes. | Transition permission, caption safety, face/product safety, SFX safety, and repeated transition language. |
| RP-SKILLS-04 overlay/compositing | Screen zone, safe area, collision plan, edge treatment, layer order. | Overlay zones, collision resolution, text layer limits, face/product protection, and density. |
| RP-SKILLS-05 graphic design | Information hierarchy, layout, typography/readability, proof/source safety. | Graphic timing, hierarchy against captions, proof card safety, and multi-text readability. |
| RP-SKILLS-06 motion design | Motion subject, timing, energy, easing, entry/hold/exit, comfort. | Motion stacking, readability, speech/music anchors, repetition, and stillness when needed. |
| RP-SKILLS-07 3D visual | 3D role, timing, screen zone, hero timing, object path, source/model/provenance, approval. | Hero windows, caption fallback, graphic support, SFX permission, face/product safety, and premium approval. |
| RP-SKILLS-08 B-roll | B-roll window, source status, display mode, source audio, proof/context level. | Cutaway windows, caption movement, source audio, emotional speaker protection, and proof/source safety. |
| RP-SKILLS-09 captions | Caption timing, placement zone, read time, density, accuracy, collision risks. | Caption zones, fallback zones, read-time protection, audio/motion restraint, and quote/claim windows. |
| RP-SKILLS-10 Sound/Music | Cue windows, ducking windows, SFX permissions, ambience/room tone, lyrics policy. | Speech protection, SFX permission, music ducking, audio density, silence, and sound/visual density balance. |

## Coordination Inputs

StoryTiming should use these inputs when future implementation is approved:

| Input | Why it matters |
| --- | --- |
| `project_id` | Keeps coordination scoped to the current project. |
| `edit_plan_id` | Connects coordination to the current edit plan. |
| `edit_plan_segment_ids` | Defines segment windows and source/output timing. |
| `story_beat_ids` | Identifies meaning, emotion, setup, payoff, CTA, and hero beats. |
| `transcript_segment_ids` | Protects speech meaning, quotes, captions, and important phrases. |
| `source_clip_sequence_ids` | Preserves source order, cutaways, B-roll windows, and media provenance. |
| `selected_skill_plan_ids` | Lists active planned skills that need coordination. |
| `rejected_skill_candidate_ids` | Prevents rejected/unsafe skills from being revived by coordination. |
| `edit preference snapshot` | Aligns density, wow factor, restraint, and skill priority with user preference. |
| `workflow context` | Guides social, education, property, testimonial, product, or clean-edit behavior. |
| `platform/aspect ratio` | Affects safe zones, caption placement, text layers, and density. |
| `reference DNA` | Guides style/pacing without copying reference assets. |
| `credit preference` | Helps downgrade optional premium/heavy moments. |
| `visual observation safe zones` | Protects faces, products, hands, actions, redaction areas, and UI. |
| `audio observation data` | Protects speech, ambience, room tone, music/SFX timing, and silence. |
| `caption plans` | Provides timing, read time, zones, density, and accuracy/claim risks. |
| `overlay/compositing plans` | Provides layer order, collision, material, edge, and safe-area behavior. |
| `graphic design plans` | Provides information hierarchy, source/proof safety, and text layer needs. |
| `motion design plans` | Provides motion timing, energy, subject, easing, and repetition risk. |
| `3D visual plans` | Provides hero windows, object paths, depth/occlusion, and premium approval notes. |
| `B-roll plans` | Provides source/proof status, display mode, source audio, and cutaway timing. |
| `transition plans` | Provides transition windows, edge behavior, and audio/SFX notes. |
| `sound/music plans` | Provides music cues, SFX permissions, ducking windows, and ambience strategy. |
| `QA warnings` | Carries existing domain warnings into cross-skill coordination. |
| `approval requirements` | Prevents premium/generated/heavy skills from proceeding without approval. |

## Coordination Lifecycle

This lifecycle is documentation-only. It is not executable orchestration.

1. Collect selected and optional skill plans.
2. Create time windows for each skill.
3. Identify primary visual/audio focus per time range.
4. Detect conflicts.
5. Resolve conflicts through priority, delay, move, reduce, replace, or remove decisions.
6. Assign caption zones and overlay zones.
7. Decide transition permission.
8. Decide SFX permission.
9. Decide music ducking and speech protection windows.
10. Validate visual/audio density.
11. Mark premium/optional moments for credit/approval.
12. Create QA requirements.
13. Produce revision impact notes.
14. Handoff to future edit plan, approval, worker, render, and QA records.

This prompt defines the contract only and does not execute the lifecycle.

## Time Window Model

StoryTiming windows describe where skills and story constraints exist on the timeline.

Window types:

- `story_beat_window`
- `speech_window`
- `caption_window`
- `transition_window`
- `B_roll_window`
- `overlay_window`
- `graphic_window`
- `motion_window`
- `three_d_window`
- `Stroke_Motion_window`
- `Real_Motion_window`
- `music_cue_window`
- `SFX_window`
- `silence_window`
- `hero_moment_window`
- `restraint_window`
- `QA_sensitive_window`

## Documentation-only Pseudo-record: StoryTimingWindow

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, orchestration code, worker spec, or render/export logic.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable window identifier. | `story_window_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `start_seconds` | Required | Window start time. | `8.2` |
| `end_seconds` | Required | Window end time. | `12.0` |
| `duration_seconds` | Required | Window duration. | `3.8` |
| `window_type` | Required | Window type. | `hero_moment_window` |
| `linked_segment_ids` | Required | Related edit plan segments. | `segment_product_reveal` |
| `linked_skill_plan_ids` | Required | Skill plans active or constrained. | `three_d_skill_002, caption_skill_004` |
| `linked_story_beat_id` | Optional | Related story beat. | `beat_payoff` |
| `linked_transcript_segment_ids` | Optional | Related transcript segments. | `transcript_seg_018` |
| `primary_focus` | Required | Primary focus for the window. | `3D_visual_moment` |
| `secondary_support` | Required | Allowed secondary support. | `subtle_music_support` |
| `density_level` | Required | Visual/audio density summary. | `visual hero, audio voice_first_light_support` |
| `conflict_risk` | Required | Risk level. | `medium` |
| `approval_required` | Required | Whether approval is required. | `true` |
| `qa_required` | Required | Whether QA is required. | `true` |
| `notes` | Optional | Coordination notes. | `Move captions to fallback zone during object pass.` |

## Primary Focus Model

Primary focus values:

- `speaker_face`
- `speaker_voice`
- `spoken_quote`
- `product_action`
- `source_footage_action`
- `caption_reading`
- `B_roll_context`
- `graphic_design_explanation`
- `3D_visual_moment`
- `Stroke_Motion_story`
- `Real_Motion_object`
- `browser_app_visual`
- `transition_moment`
- `music_emotion`
- `silence_emotion`
- `CTA_or_offer`
- `proof_or_evidence`
- `no_single_focus_multi_layer_design`

Most windows should have one primary focus. Secondary support can exist but must not compete. Multi-layer design is allowed only when deliberately planned and QA'd. Hero moments should not have competing hero elements.

## Secondary Support Model

Secondary support roles:

- `captions_support`
- `subtle_music_support`
- `ambience_support`
- `B_roll_support`
- `lower_third_support`
- `graphic_label_support`
- `light_motion_support`
- `soft_SFX_support`
- `background_texture_support`
- `room_tone_support`
- `no_secondary_support`

Secondary support should help the primary focus, not steal attention.

## Visual Density Model

| Visual density | Meaning | When appropriate | Warning signs | Example |
| --- | --- | --- | --- | --- |
| `none` | No extra visual layer. | Voice-only, emotional pause, pure source moment. | Edit needs proof/context. | Speaker close-up. |
| `minimal` | One light support layer. | Clean edits, premium restraint. | Too plain for requested social energy. | Small caption only. |
| `restrained` | One or two controlled support layers. | Business, property, testimonial. | Text begins to crowd face/product. | Caption plus lower third. |
| `balanced` | Several coordinated layers with clear hierarchy. | Product demo, education, social. | Viewer focus begins to split. | Captions plus graphic card plus light motion. |
| `rich` | Dense but planned visual composition. | Launch, montage, high-energy explainers. | Text/motion competes with speech. | Split-screen B-roll with graphics. |
| `hero` | One earned high-impact visual moment. | 3D/Real Motion/product reveal. | Multiple hero elements compete. | 3D product breakout. |
| `overloaded` | Too many simultaneous demands. | Never as final state. | Captions, graphics, 3D, B-roll, and motion all compete. | QA risk. |

Overloaded is a QA risk. Hero density can be professional when a moment earns it. Basic/simple edits can be professional with low density. Visual density must align with edit preference and workflow.

## Audio Density Model

| Audio density | Meaning | When appropriate | Warning signs | Example |
| --- | --- | --- | --- | --- |
| `silence` | Intentional silence. | Emotional pause, serious beat. | Feels accidental or awkward. | Pause before testimonial payoff. |
| `room_tone_only` | Natural room tone only. | Interviews, podcasts, faith, documentary. | Room tone jumps. | Clean talking-head cut. |
| `ambience_only` | Natural ambience without music. | Property, vlog, travel, documentary. | Ambience masks speech. | Cafe scene under voiceover. |
| `voice_first_light_support` | Speech with subtle music/ambience. | Talking head, education, business. | Music distracts from captions. | Low bed under narration. |
| `music_bed` | Music supports mood. | Social, property, product, intro/outro. | Speech starts to feel buried. | Instrumental bed. |
| `music_plus_light_SFX` | Music plus restrained SFX. | Product demo, social, graphic reveals. | SFX under key words. | Card reveal with soft hit. |
| `rich_sound_design` | Coordinated music/SFX/ambience. | Earned hero or montage. | Fatigue or trust loss. | 3D hero with controlled sound. |
| `overloaded` | Too much audio at once. | Never as final state. | Speech/captions suffer. | Loud music, SFX, ambience, lyrics. |

Audio density must protect speech and captions. Overloaded audio is a QA risk. Silence can be a premium decision.

## Focus And Density Budget

`FocusDensityBudget` is planning guidance, not runtime enforcement. Its purpose is preventing amateur over-layering.

| Field | Description | Example value |
| --- | --- | --- |
| `time_range` | Coordinated time range. | `8.2-12.0` |
| `visual_density_level` | Visual density allowed. | `hero` |
| `audio_density_level` | Audio density allowed. | `voice_first_light_support` |
| `primary_focus` | Main focus. | `3D_visual_moment` |
| `max_simultaneous_visual_skills` | Maximum visual skills in the range. | `2` |
| `max_simultaneous_motion_elements` | Maximum moving elements. | `1` |
| `max_simultaneous_text_layers` | Maximum text layers. | `1` |
| `SFX_allowed` | Whether SFX may occur. | `true_if_after_speech_phrase` |
| `transition_allowed` | Whether transition may occur. | `false` |
| `music_ducking_required` | Whether music must duck. | `true` |
| `caption_priority` | Caption priority. | `medium_with_fallback_zone` |
| `hero_moment_allowed` | Whether hero density is allowed. | `true` |
| `restraint_required` | Whether restraint is required. | `true_for_text_layers` |
| `reason` | Why budget exists. | `Protect 3D reveal and spoken CTA.` |

## Safe Zones And Spatial Coordination

Coordinated zones:

- `speaker_face_zone`
- `mouth_eye_protection_zone`
- `hand_gesture_zone`
- `product_action_zone`
- `caption_zone`
- `fallback_caption_zone`
- `overlay_zone`
- `graphic_zone`
- `3D_zone`
- `B_roll_inset_zone`
- `browser_app_zone`
- `lower_third_zone`
- `transition_effect_zone`
- `platform_UI_safe_margin`
- `redaction_zone`

Zones may change over time. Captions need fallback zones during 3D, B-roll, graphic, overlay, or lower-third moments. Face/product/action protection can override planned overlays. Browser/app/source visuals may need redaction/source-safe zones.

## Caption Coordination

Rules:

- Captions should remain readable when speech is primary.
- Captions can reduce/move during hero visual moments if accessibility/user preference allows.
- Captions must not collide with 3D, graphics, B-roll, lower thirds, overlays, browser/app visuals, or platform UI.
- Captions should not be hidden by transitions.
- Dense captions need lower motion/audio distraction.
- Quote/claim captions need strong speech protection.
- Fallback caption zones should be planned.

## Overlay And Graphic Coordination

Rules:

- Overlays/graphics should not fight captions.
- Graphic cards should not appear during an important face/emotion window unless planned.
- Graphic hierarchy should not compete with captions.
- Lower thirds and captions need spacing.
- Proof cards need source/status safety.
- Multiple text layers require readability QA.
- Overlay edge/safe-zone behavior comes from RP-SKILLS-04.
- Graphic structure comes from RP-SKILLS-05.

## Motion Coordination

Rules:

- Avoid too many simultaneous moving elements.
- Motion should support the primary focus.
- Motion energy should align with story beat.
- Serious moments can require stillness.
- Motion should not make captions unreadable.
- Motion should not cover faces, products, or actions.
- Repeated motion patterns should be detected.
- Motion timing should respect speech, music, and transition anchors.

## Transition Coordination

Rules:

- Transition permission depends on story need, speech safety, and visual density.
- Transition windows should not hide captions, faces, or key product action.
- SFX should not hit under key speech.
- Clean cut/no transition can be the coordination decision.
- Transition timing should coordinate with B-roll, graphics, 3D, and music.
- Repeated transition language should be detected.

## B-roll Coordination

Rules:

- B-roll should not hide important speaker emotion.
- B-roll can continue under voiceover with captions.
- B-roll source audio must coordinate with music and room tone.
- B-roll can cover cuts but should not become filler.
- Inset/PIP B-roll must respect caption/graphic zones.
- B-roll source/proof status affects graphics and wording.
- B-roll may replace a costly 3D/Real Motion moment.

## 3D, Real Motion, And Stroke Motion Coordination

Rules:

- 3D/Real Motion hero moments need primary focus windows.
- Captions may need fallback zones or reduced density.
- Graphics should annotate, not compete, during 3D moments.
- SFX must be speech-safe.
- 3D/Real Motion must protect faces and products.
- Stroke Motion story beats need clear timing and should not compete with unrelated graphics.
- Do not route 3D and Real Motion into the same moment without clear role separation.
- Real Motion remains premium, overlay-first, face-safe, credit-heavy, and approval-gated.
- Stroke Motion source-reading and meaning-expansion requirements remain owned by existing Stroke Motion docs.

## Browser/App/Source Visual Coordination

Rules:

- Exact browser/app/source visuals must be user-provided, authorized later, or clearly mock/internal.
- Do not invent exact UI, dashboard, pricing, metrics, article, or evidence page details.
- Source status and redaction affect graphic, B-roll, and overlay plans.
- Screen visuals need caption/overlay zone planning.
- Browser/app visual motion/SFX must not imply false interaction.
- Unknown/claimed evidence needs safe wording.

## SoundSync Coordination

Rules:

- Speech clarity wins.
- Music ducking windows should align to speech/caption importance.
- SFX permission should be explicit.
- Lyrics under speech require approval.
- Ambience/room tone can be the primary audio decision.
- SoundSync can support visual skills but should not make every visual loud.
- Silence can be a StoryTiming decision.
- Music energy should follow story energy, not generic template energy.

## Conflict Types

| Conflict type | Meaning | Example | Likely resolution |
| --- | --- | --- | --- |
| `caption_visual_collision` | Captions collide with visual layer. | Caption covers 3D object. | `move_caption_zone` |
| `face_safety_conflict` | Face/expression is covered. | Overlay blocks speaker eyes. | `move_overlay_zone` |
| `product_action_conflict` | Product/action is hidden. | Caption covers cursor path. | `move_caption_zone` |
| `text_layer_conflict` | Too many readable text layers. | Captions, lower third, proof card overlap. | `reduce_caption_density` |
| `visual_density_overload` | Too many visual demands. | 3D, B-roll, graphics, captions all active. | `reduce_visual_density` |
| `audio_density_overload` | Too much audio demand. | Music, SFX, ambience, speech all fight. | `duck_music_more` |
| `speech_clarity_conflict` | Speech becomes hard to follow. | Music bed too strong. | `duck_music_more` |
| `SFX_under_speech_conflict` | SFX hits key words. | Whoosh under CTA phrase. | `remove_SFX` |
| `motion_readability_conflict` | Motion hurts reading. | Caption animates during graphic reveal. | `reduce_motion_energy` |
| `transition_timing_conflict` | Transition hides timing/meaning. | Flash cut during quote. | `replace_transition_with_clean_cut` |
| `B_roll_emotion_conflict` | B-roll hides emotion. | Cutaway during tearful quote. | `delay_secondary` |
| `source_status_conflict` | Source/proof status is unsafe. | Dashboard metric unverified. | `require_user_input` |
| `credit_approval_conflict` | Premium skill lacks approval. | 3D hero marked active without approval. | `require_user_approval` |
| `repetition_conflict` | Pattern repeats too much. | Same whoosh on every transition. | `reduce_visual_density` |
| `tone_mismatch_conflict` | Layer conflicts with tone. | Playful SFX in serious testimonial. | `remove_SFX` |
| `reference_copy_risk` | Reference is too closely copied. | Music/visual mimics protected reference. | `require_user_input` |
| `runtime_readiness_conflict` | Planned action implies forbidden runtime. | Provider call or render execution in docs prompt. | `block_preview_until_fixed` |

## Conflict Resolution Actions

Resolution actions:

- `keep_primary_remove_secondary`
- `delay_secondary`
- `move_overlay_zone`
- `move_caption_zone`
- `reduce_caption_density`
- `reduce_visual_density`
- `reduce_motion_energy`
- `remove_SFX`
- `duck_music_more`
- `preserve_silence`
- `replace_3D_with_graphic`
- `replace_B_roll_with_caption_or_graphic`
- `replace_transition_with_clean_cut`
- `require_user_approval`
- `require_user_input`
- `mark_optional`
- `block_preview_until_fixed`
- `accept_with_warning`

Resolution should prefer user instruction and professional clarity. Premium optional items can be downgraded to lower credit cost. Some conflicts should block preview; others are warnings.

## Permission Gates

| Permission gate | When allowed | When blocked | Approval/credit notes |
| --- | --- | --- | --- |
| `transition_permission` | Transition supports story, timing, and readability. | It hides speech/caption/face/product or repeats mechanically. | Usually low credit; premium transitions may need approval. |
| `SFX_permission` | SFX supports an exact visual/audio moment and is speech-safe. | SFX hits key words or adds gimmick/density. | Generated/custom SFX requires approval. |
| `hero_visual_permission` | One earned hero moment has primary focus. | Multiple hero elements compete. | Premium hero work needs approval. |
| `premium_3D_permission` | 3D role, source/model/provenance, and credit are approved. | 3D is decorative or conflicts with speech/captions. | High/premium credit. |
| `Real_Motion_permission` | Real Motion is useful, face-safe, overlay-first, approved. | It obscures people/products or duplicates 3D/B-roll. | Premium approval required. |
| `dense_caption_permission` | Accessibility/education/user preference supports density. | Hero visual, proof screen, or speech clarity needs restraint. | Usually no generation credit. |
| `multi_text_layer_permission` | Text hierarchy is clear and readable. | Captions, graphics, lower thirds, proof cards compete. | QA required. |
| `browser_source_visual_permission` | Source is user-provided, authorized later, or mock/internal. | Exact UI/source/evidence is invented or sensitive. | Redaction/source review may be needed. |
| `generated_music_permission` | Credit estimate, approval, rights/provenance plan exist. | No approval or provider/runtime gate. | Premium/future only. |
| `generated_B_roll_permission` | Source need, approval, credit, and future provider gate exist. | Existing source or graphic can solve it. | High/premium future work. |
| `generated_graphic_permission` | Graphic need, source safety, approval, and credit exist. | It duplicates captions or invents proof. | Credit depends on future path. |
| `silence_preservation_permission` | Silence supports emotion/trust/story. | User requests energetic music and speech is not harmed. | Usually no credit. |

## Documentation-only Pseudo-record: StoryTimingCoordinationPlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, orchestration code, worker spec, or render/export logic.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable coordination plan id. | `coord_plan_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `coordination_scope` | Required | Scope of coordination. | `segment_and_adjacent_windows` |
| `time_range_start_seconds` | Required | Coordination range start. | `8.2` |
| `time_range_end_seconds` | Required | Coordination range end. | `12.0` |
| `linked_segment_ids` | Required | Related edit plan segments. | `segment_product_reveal` |
| `linked_story_beat_ids` | Required | Related story beats. | `beat_payoff` |
| `linked_skill_plan_ids` | Required | Active skill plans. | `caption_skill_004, three_d_skill_002` |
| `primary_focus` | Required | Primary focus. | `3D_visual_moment` |
| `secondary_support_roles` | Required | Allowed secondary support. | `subtle_music_support, captions_support` |
| `visual_density_level` | Required | Visual density. | `hero` |
| `audio_density_level` | Required | Audio density. | `voice_first_light_support` |
| `caption_zone` | Required | Primary caption zone. | `upper_center_safe` |
| `fallback_caption_zone` | Required | Fallback caption zone. | `lower_center_safe_after_hero` |
| `overlay_zone` | Required | Overlay zone. | `right_third_excluding_face` |
| `graphic_zone` | Required | Graphic zone. | `deferred_until_after_3D` |
| `B_roll_window_ids` | Optional | Related B-roll windows. | `broll_window_003` |
| `three_d_window_ids` | Optional | Related 3D windows. | `three_d_window_001` |
| `Real_Motion_window_ids` | Optional | Related Real Motion windows. | `none` |
| `Stroke_Motion_window_ids` | Optional | Related Stroke Motion windows. | `none` |
| `transition_permission` | Required | Transition permission. | `clean_cut_only` |
| `SFX_permission` | Required | SFX permission. | `allowed_after_key_phrase` |
| `music_ducking_required` | Required | Music ducking need. | `true` |
| `speech_protection_windows` | Required | Protected speech windows. | `8.2-9.4` |
| `safe_zone_notes` | Required | Safe-zone notes. | `protect face, product, caption fallback` |
| `conflict_summary` | Required | Conflict summary. | `3D object and captions share lower center` |
| `resolution_actions` | Required | Resolution actions. | `move_caption_zone, delay_graphic` |
| `approval_required` | Required | Whether approval is required. | `true` |
| `credit_impact_summary` | Required | Credit impact summary. | `premium 3D requires approval; captions low/no cost` |
| `qa_checks` | Required | QA checks. | `caption readability, speech clarity, safe zones, approval` |
| `revision_impact_notes` | Required | Revision impacts. | `Removing 3D allows captions to stay lower center.` |
| `worker_notes` | Optional | Future worker notes. | `No worker unlocked by this doc.` |
| `must_follow_rules` | Required | Must-follow rules. | `one primary focus; speech first; no runtime execution` |
| `avoid_rules` | Required | Avoid rules. | `no competing hero elements; no SFX under speech` |
| `status` | Required | Planning status. | `planned_pending_approval` |
| `metadata_json` | Optional | Future metadata bucket if implemented later. | `{ "docs_only": true }` |

## Documentation-only Pseudo-record: StoryTimingConflictResolutionPlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, orchestration code, worker spec, or render/export logic.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable resolution plan id. | `conflict_resolution_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `conflict_type` | Required | Conflict type. | `caption_visual_collision` |
| `conflict_window_start_seconds` | Required | Conflict start. | `8.2` |
| `conflict_window_end_seconds` | Required | Conflict end. | `12.0` |
| `affected_skill_plan_ids` | Required | Affected skills. | `caption_skill_004, three_d_skill_002` |
| `primary_focus_at_risk` | Required | Focus at risk. | `3D_visual_moment` |
| `conflict_summary` | Required | Conflict description. | `Caption lower-center zone overlaps 3D object path.` |
| `severity` | Required | Severity. | `high` |
| `resolution_action` | Required | Selected action. | `move_caption_zone` |
| `resolution_reason` | Required | Why action is chosen. | `Protect hero object while keeping speech readable.` |
| `user_approval_required` | Required | Whether user approval is required. | `false` |
| `credit_impact_change` | Required | Credit change. | `none` |
| `QA_followup_required` | Required | Follow-up QA. | `true` |
| `status` | Required | Status. | `planned` |
| `metadata_json` | Optional | Future metadata bucket if implemented later. | `{ "docs_only": true }` |

## Documentation-only Pseudo-record: StoryTimingDensityBudgetPlan

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, orchestration code, worker spec, or render/export logic.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable density budget id. | `density_budget_001` |
| `project_id` | Required | Project reference. | `project_launch_demo` |
| `edit_plan_id` | Required | Edit plan reference. | `edit_plan_042` |
| `time_range_start_seconds` | Required | Budget start. | `8.2` |
| `time_range_end_seconds` | Required | Budget end. | `12.0` |
| `visual_density_level` | Required | Visual density. | `hero` |
| `audio_density_level` | Required | Audio density. | `voice_first_light_support` |
| `max_text_layers` | Required | Max text layers. | `1` |
| `max_motion_elements` | Required | Max moving elements. | `1` |
| `max_visual_hero_elements` | Required | Max hero elements. | `1` |
| `caption_priority` | Required | Caption priority. | `medium_with_accessibility_check` |
| `speech_priority` | Required | Speech priority. | `high` |
| `SFX_allowed` | Required | Whether SFX is allowed. | `true_after_phrase_only` |
| `transition_allowed` | Required | Whether transition is allowed. | `false` |
| `hero_moment_allowed` | Required | Whether hero is allowed. | `true` |
| `restraint_required` | Required | Whether restraint is required. | `true` |
| `reason` | Required | Reason for budget. | `Protect single 3D hero reveal and speech.` |
| `QA_notes` | Required | QA notes. | `Check captions, object path, speech ducking.` |

## StoryTiming Scoring Model

StoryTiming scoring is planning guidance only. It is not runtime logic, TypeScript, SQL, JSON schema, prompt code, orchestration code, or a weighted model.

Positive signals:

- One clear primary focus.
- Captions readable.
- Speech clear.
- Hero moment protected.
- Visual density matches preference.
- Audio density matches story.
- Safe zones protected.
- Transitions motivated.
- SFX permitted and safe.
- B-roll supports meaning.
- 3D/Real Motion used where earned.
- Graphics improve understanding.
- Repetition avoided.
- Approval/credit state clear.

Negative signals:

- Too many simultaneous visual elements.
- Too many text layers.
- Captions collide.
- Speech buried.
- SFX under key words.
- Face/product/action covered.
- 3D/graphics/B-roll compete.
- Music energy mismatched.
- Repeated effects.
- Source status unclear.
- Premium items not approved.
- User preference violated.

Documentation-only pseudo logic:

```text
coordination_score =
  focus_clarity
+ speech_clarity
+ caption_readability
+ story_alignment
+ preference_fit
+ safe_zone_compliance
+ density_balance
+ hero_moment_protection
+ skill_synergy
- visual_overload
- audio_overload
- collision_risk
- repetition_penalty
- source_status_risk
- credit_approval_risk
- tone_mismatch
```

## Edit Preference And Workflow Influence

Edit preference influence:

- `no extra visuals`: Keep source/speech primary; avoid optional overlays, SFX, 3D, and B-roll unless required.
- `keep visuals minimal`: Allow captions, subtle music, room tone, and rare support graphics.
- `balanced visual mix`: Coordinate captions, B-roll, graphics, motion, and SoundSync around clear focus.
- `more graphic design`: Give graphics planned windows and reduce competing captions/motion.
- `more Stroke Motion`: Protect source-reading and meaning-expansion windows.
- `Real Motion if useful`: Use only when it has a clear role, approval, face safety, and credit fit.
- `premium/luxury`: Favor restrained density, subtle motion, room tone/ambience, and fewer stronger moments.
- `energetic/social`: Allow higher density but protect captions and speech.
- `educational`: Prioritize explanation hierarchy, captions, low-distraction audio, and stillness when needed.
- `corporate`: Keep hierarchy clean, trust-first, and not gimmicky.
- `cinematic`: Use silence, emotion, transitions, and hero moments with restraint.
- `documentary/testimonial/faith restraint`: Protect speech, emotion, room tone, source truth, and silence.

Workflow guidance:

| Workflow | Coordination behavior | Avoid behavior |
| --- | --- | --- |
| Simple Clean Edit | Speaker voice/face primary, minimal captions, low density. | Optional effects fighting speech. |
| Social Short / Viral Clip | Captions, beat music, B-roll, and transitions coordinated around readable speech. | SFX and transitions on every beat. |
| Talking Head / Personal Brand | Speaker trust primary with restrained captions/graphics. | Hiding expression with B-roll. |
| Podcast Clip | Speaker voice and speaker labels primary. | Music/SFX under dense conversation. |
| Vlog / Lifestyle | Natural B-roll, ambience, and light motion. | Overproduced generic effects. |
| Product Demo | Product action/screen visual primary with callouts and captions. | Covering cursor/product action. |
| Real Estate / Property Tour | B-roll/property visuals primary with subtle captions/music. | Loud SFX or dense text over room reveals. |
| Education / Explainer | Graphic/caption hierarchy primary. | Motion/music distracting from learning. |
| Marketing Ad | CTA/proof/hero moments coordinated with approval gates. | Claims hidden by music/SFX/transition. |
| Testimonial / Case Study | Quote/speaker trust primary with source-safe B-roll. | Manipulative music or unverified proof. |
| Custom / Let AI Decide | Choose one focus per moment and document why. | Stacking all skills because they are available. |

## Credit And Approval Behavior

StoryTiming itself is planning coordination. It can aggregate credit impact from selected skills, identify premium/optional moments, and recommend lower-cost alternatives.

Rules:

- Mark heavy 3D, Real Motion, generated B-roll, generated graphics, generated music, custom SFX, and complex motion as approval-required.
- Preserve no-generation-before-approval.
- Recommend lower-cost alternatives when density or cost is too high.
- Approval changes may alter coordination windows.
- Optional premium items can be marked optional, downgraded, delayed, or replaced.

## StoryTiming QA

StoryTiming QA must verify:

- Primary focus clear.
- Visual density balanced.
- Audio density balanced.
- Captions readable.
- Speech clear.
- Face/expression protected.
- Product/action protected.
- Safe zones respected.
- Overlays/graphics/3D/B-roll not colliding.
- Transitions motivated.
- SFX permitted and speech-safe.
- Music ducking appropriate.
- Silence/room tone preserved where needed.
- Source status/redaction handled.
- Repetition avoided.
- User preference honored.
- Premium approvals present.
- Credit compliance.
- No random effects.
- No generic template pile-up.
- Hero moments protected.

Blocking examples:

- Premium skill active without approval.
- Captions unreadable.
- Speech buried.
- Face/product/action covered.
- SFX under key speech.
- Source/evidence unsafe.
- User "no extra visuals/no music/no captions" instruction violated.
- Generated skill planned as executed before approval.

Warning examples:

- Visual density may be high.
- Audio energy may be too strong.
- Transition family repeated.
- Caption fallback zone may need adjustment.
- Hero moment has too many support layers.

## Revision Behavior

Safe revision options:

- Make edit cleaner.
- Make edit more visual.
- Reduce visual density.
- Increase visual density at key moments.
- Remove 3D.
- Replace 3D with graphic design.
- Remove B-roll.
- Use more source B-roll.
- Reduce captions.
- Move captions.
- Remove SFX.
- Duck music more.
- Remove music.
- Preserve ambience/silence.
- Delay graphic.
- Simplify motion.
- Replace transition with clean cut.
- Lower credit cost.
- Add stronger hero moment.
- Regenerate creative concept options later.

Revisions map back to affected skill plans. A revision may require a new estimate/approval if it adds premium/generated/custom work, increases density, changes source/proof use, or alters approved timing windows.

## Examples

These examples are planning examples only. They are not fixtures, prompts, runtime data, TypeScript, JSON schema, SQL, orchestration instructions, worker jobs, or renderer instructions.

### 1. Simple Clean Talking-head Edit

- `primary_focus`: `speaker_voice`
- `secondary_support_roles`: `captions_support, room_tone_support`
- `visual_density_level`: `minimal`
- `audio_density_level`: `room_tone_only`
- `caption_zone`: `lower_center_safe`
- `active_skills`: captions only if requested/accessibility needed.
- `conflict_summary`: No major conflict.
- `resolution_actions`: `keep_primary_remove_secondary`
- `approval_required`: `false`
- `QA checks`: Speech clarity, caption readability, face safety.

### 2. Social Short / Viral Clip

- `primary_focus`: `caption_reading`
- `secondary_support_roles`: `subtle_music_support, soft_SFX_support`
- `visual_density_level`: `balanced`
- `audio_density_level`: `music_plus_light_SFX`
- `caption_zone`: `center_lower_safe`
- `active_skills`: captions, transitions, SoundSync, light B-roll.
- `conflict_summary`: Beat/SFX can compete with captions.
- `resolution_actions`: `duck_music_more, remove_SFX`
- `approval_required`: `true` for generated music/SFX.
- `QA checks`: Caption read time, SFX permission, music ducking.

### 3. Premium Property Tour

- `primary_focus`: `B_roll_context`
- `secondary_support_roles`: `subtle_music_support, graphic_label_support`
- `visual_density_level`: `restrained`
- `audio_density_level`: `voice_first_light_support`
- `caption_zone`: `upper_or_lower_safe_by_room_label`
- `active_skills`: B-roll, subtle captions, room labels, SoundSync.
- `conflict_summary`: Room labels and captions may collide.
- `resolution_actions`: `move_caption_zone, reduce_caption_density`
- `approval_required`: `true` for generated/premium assets.
- `QA checks`: Room label readability, source audio continuity, premium restraint.

### 4. Product Demo

- `primary_focus`: `product_action`
- `secondary_support_roles`: `graphic_label_support, captions_support`
- `visual_density_level`: `balanced`
- `audio_density_level`: `voice_first_light_support`
- `caption_zone`: `above_product_action_path`
- `active_skills`: screen visual, graphic callouts, captions, speech-safe SFX.
- `conflict_summary`: Captions/graphics can cover cursor or action.
- `resolution_actions`: `move_caption_zone, move_overlay_zone`
- `approval_required`: `false` unless generated graphics/SFX are added.
- `QA checks`: Product action visibility, UI source safety, speech clarity.

### 5. Education / Explainer

- `primary_focus`: `graphic_design_explanation`
- `secondary_support_roles`: `captions_support, light_motion_support`
- `visual_density_level`: `balanced`
- `audio_density_level`: `voice_first_light_support`
- `caption_zone`: `below_diagram_or_fallback`
- `active_skills`: diagrams, captions, low-distraction music, motion.
- `conflict_summary`: Diagram and captions compete for reading attention.
- `resolution_actions`: `reduce_motion_energy, move_caption_zone`
- `approval_required`: `false`
- `QA checks`: Explanation hierarchy, caption read time, audio distraction.

### 6. Marketing Ad

- `primary_focus`: `CTA_or_offer`
- `secondary_support_roles`: `subtle_music_support, graphic_label_support`
- `visual_density_level`: `rich`
- `audio_density_level`: `music_plus_light_SFX`
- `caption_zone`: `CTA_safe_fallback`
- `active_skills`: proof card, CTA, music lift, possible hero visual.
- `conflict_summary`: Offer clarity can be buried by sound/hero visual.
- `resolution_actions`: `duck_music_more, require_user_approval`
- `approval_required`: `true`
- `QA checks`: Claim safety, CTA readability, approval, credit.

### 7. Testimonial / Case Study

- `primary_focus`: `spoken_quote`
- `secondary_support_roles`: `B_roll_support, ambience_support`
- `visual_density_level`: `restrained`
- `audio_density_level`: `ambience_only`
- `caption_zone`: `lower_center_safe`
- `active_skills`: quote captions, trust-first B-roll, subtle ambience.
- `conflict_summary`: B-roll may hide emotion or source proof may be unsafe.
- `resolution_actions`: `delay_secondary, require_user_input`
- `approval_required`: `true` for claim-sensitive proof.
- `QA checks`: Quote accuracy, speaker emotion, source status, room tone.

### 8. 3D Hero Visual

- `primary_focus`: `3D_visual_moment`
- `secondary_support_roles`: `subtle_music_support`
- `visual_density_level`: `hero`
- `audio_density_level`: `voice_first_light_support`
- `caption_zone`: `upper_center_safe_or_reduced`
- `active_skills`: 3D, captions, SoundSync.
- `conflict_summary`: 3D object path conflicts with captions/graphics.
- `resolution_actions`: `move_caption_zone, delay_secondary`
- `approval_required`: `true`
- `QA checks`: 3D hero focus, speech safety, caption fallback, credit approval.

### 9. Stroke Motion Story Moment

- `primary_focus`: `Stroke_Motion_story`
- `secondary_support_roles`: `captions_support, room_tone_support`
- `visual_density_level`: `restrained`
- `audio_density_level`: `voice_first_light_support`
- `caption_zone`: `away_from_draw_path`
- `active_skills`: Stroke Motion, captions, subtle sound.
- `conflict_summary`: Graphics/B-roll would compete with story animation.
- `resolution_actions`: `delay_secondary, reduce_visual_density`
- `approval_required`: `false` unless premium/generation is added.
- `QA checks`: Draw path clarity, source meaning, caption placement.

### 10. Overloaded Conflict Case

- `primary_focus`: `no_single_focus_multi_layer_design`
- `secondary_support_roles`: too many active supports.
- `visual_density_level`: `overloaded`
- `audio_density_level`: `overloaded`
- `caption_zone`: `conflicted`
- `active_skills`: captions, graphics, 3D, B-roll, transition, SFX.
- `conflict_summary`: Too many skills collide and no focus is clear.
- `resolution_actions`: `replace_3D_with_graphic, replace_transition_with_clean_cut, remove_SFX`
- `approval_required`: `true` if any premium item remains.
- `QA checks`: Focus clarity, density, collisions, speech, credit.

## Anti-patterns

Fail future StoryTiming planning when it includes:

- Everything active at once.
- No primary focus.
- Captions, graphics, and 3D all competing.
- Music and SFX overpower speech.
- Transition hides important expression.
- B-roll hides emotional moment.
- 3D hero moment plus dense graphics plus dense captions.
- Same effect pattern repeated mechanically.
- Source/evidence visual without source safety.
- Visual density ignores user preference.
- Audio density ignores caption/speech needs.
- Premium skill active without approval.
- Worker execution from raw prompt only.
- Generated/rendered action before approval.
- Timeline coordination treated as frontend-only state.
- Runtime code, TypeScript, migrations, installs, package mutations, orchestration runtime, provider calls, workers, Supabase work, render/export, media processing, audio processing, caption rendering, browser/capture/media/WebGL/canvas/3D runtime, generation runtime, or app behavior changes in a docs-only prompt.

## Future Implementation Notes

If StoryTiming coordination is eventually approved, future implementation may need records or typed contracts similar to these names, but none are created now:

- `storytiming_coordination_plans`
- `storytiming_windows`
- `storytiming_conflict_resolution_plans`
- `storytiming_density_budget_plans`
- `storytiming_permission_gates`
- `storytiming_qa_requirements`
- `edit_plan_skill_routes` references
- `caption_plans` references
- `transition_plans` references
- `overlay_compositing_plans` references
- `graphic_design_plans` references
- `motion_design_plans` references
- `three_d_visual_plans` references
- `B_roll_plans` references
- `sound_music_plans` references
- Stroke Motion / Real Motion plan references
- `approval_records` references
- `credit_estimates` references
- job orchestration references later

This document does not create those records now. Future schema/types must avoid duplicating this doc's source truth. Runtime coordination/orchestration remains future gated work.

## Duplicate And Overlap Notes

Direct Creative Skill StoryTiming coordination doctrine lives in `docs/creative-skills/` only.

Existing StoryTiming owners already cover timing behavior:

- `src/types/storytiming.ts` owns current StoryTiming source systems, map status, track types, anchors, events, authorities, conflicts, dependencies, QA checks, render timing manifest records, caption timing records, cut timing records, music beat grid records, music ducking timing records, SoundSync timing integration records, and core rules.
- `docs/storytiming-planner-service.md` documents the mock/local StoryTiming planner and Master Timing Map flow.
- `docs/storytiming-qa-plan.md` owns StoryTiming QA guidance and cross-system timing QA boundaries.
- `docs/storytiming-render-manifest-plan.md` owns render timing manifest planning.
- `docs/caption-cut-timing-integration.md` owns caption/cut timing integration.
- `docs/music-sfx-timing-integration.md` owns SoundSync music/SFX timing integration.
- `docs/backend-api-skeleton.md` records mock StoryTiming planner, caption/cut timing, and SoundSync timing backend boundaries.
- Backend StoryTiming services and orchestrators own current mock timing event, dependency, conflict, QA, caption, cut, music, SFX, render manifest, and chat summary flows.
- Prior RP-SKILLS contracts own their specialized planning fields; StoryTiming coordinates their footprints instead of redefining them.

Future StoryTiming coordination work must reference these owners rather than creating parallel timing event types, caption timing records, SoundSync timing records, render manifests, QA gates, worker contracts, orchestration lanes, approval flows, credit flows, or UI behavior.

Requested root reading files missing in this repo snapshot:

- `soundsync-music-intelligence.md`
- `music-reference-dna.md`
- `lyria-music-generation-plan.md`

The requested `audio-library-and-licensing.md` file exists in the repo root. Related Lyria docs exist under `docs/`, including `docs/lyria-integration-adapter.md` and `docs/lyria-worker-plan.md`, but those are not the requested root files and should not be treated as replacements without explicit reconciliation.

## RP-SKILLS-12 Handoff

Recommended next prompt:

`RP-SKILLS-12 - Edit Preference Creative Direction Contract`

Allowed scope for `RP-SKILLS-12`:

- Docs-only edit preference creative direction contract under `docs/creative-skills/`.
- Define user/workspace/project preference profiles, resolved edit preference snapshots, visual density preference, motion intensity preference, caption style preference, B-roll preference, 3D preference, graphic design preference, SoundSync preference, restraint level, wow-factor target, preferred/blocked skills, priority order, and how preferences guide skill scoring without making every edit identical.

Forbidden scope for `RP-SKILLS-12` unless explicitly authorized later:

- Supabase migrations or SQL.
- Runtime code.
- TypeScript implementation.
- React UI.
- Provider calls.
- Workers, jobs, leases, or runtime gates.
- Package installs or package file mutations.
- Runtime orchestration, render/export runtime, media processing, audio generation, music generation, SFX generation, caption rendering, browser/capture/media/generation runtime, prompt router changes, Playwright execution, animation code, design-token changes, or app behavior.
