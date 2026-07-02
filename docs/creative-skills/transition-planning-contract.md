# Transition Planning Contract

## Purpose

This document defines the transition-specific planning contract for future ReeditPro transition skills.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, package changes, Supabase connections, SQL, credentials, browser/WebGL/canvas runtime, or execution behavior.

This contract inherits from [skill-planning-contracts.md](skill-planning-contracts.md). It defines transition-specific fields and rules that future docs, types, schema, workers, and QA systems must follow when transition work is eventually implemented.

## Transition Doctrine

Transitions are not random effects.

Transitions should connect meaning, motion, space, time, emotion, rhythm, or story. A clean cut is often the best transition. A no-transition decision can be professional. A premium edit can use transitions, but only where they are earned. A strong transition should support the video instead of calling attention to itself unless the transition is intentionally a hero or design moment.

Transition intensity should be earned by the story beat, edit preference, music, platform, and footage.

ReeditPro should not feel like a basic template editor or amateur effect pack. Transition planning must explain why a transition exists, what it connects, how it affects speech, captions, visual continuity, and how it stays within approval and credit boundaries.

## Universal Contract Inheritance

Every `TransitionSkillPlan` inherits the universal skill planning envelope:

- `planning_reason`
- `restraint_decision`
- Timing envelope.
- Composition envelope.
- Audio relationship envelope.
- Tool strategy envelope.
- Credit/approval envelope.
- QA envelope.
- Revision envelope.

The transition contract adds:

- From/to segment relationship.
- Cut point.
- Transition family.
- Duration.
- Edge behavior.
- Motion direction.
- Transition curve.
- Music/SFX/ambient bridge behavior.
- Speech safety.
- Visual continuity checks.
- Transition-specific QA.

Do not duplicate the universal contract fields except when referencing inheritance.

## When To Use Transitions

Transitions are appropriate when they improve:

- Location change.
- Time jump.
- Scene change.
- Emotional shift.
- Story beat change.
- Proof/result reveal.
- Before/after comparison.
- Music beat or downbeat.
- Pacing reset.
- Visual continuity problem.
- Montage rhythm.
- Product/feature reveal.
- Browser/app screen change.
- 3D/Real Motion object-led moment.
- Stroke Motion connected story beat.
- Title/chapter break.
- Social performance moment where energy is appropriate.

The transition must still fit the edit preference, footage, speech, captions, and credit budget.

## When To Avoid Transitions

Transitions should be avoided or minimized when:

- The moment is a serious emotional pause.
- Important speech needs full attention.
- The user asks for simple, clean, or natural editing.
- The transition would feel viral or amateur.
- The same transition pattern repeats too often.
- The transition hides an important expression.
- The transition covers or conflicts with captions.
- Transition SFX would hit under speech.
- Footage already cuts naturally.
- The transition breaks spatial continuity.
- The transition adds visual clutter.
- The transition is only decoration.
- The credit budget does not justify premium transition work.

Doing nothing can be the transition plan.

## Transition Families

These families are planning guidance, not hard-coded execution.

| Family | What it is | Best use cases | Avoid cases | Typical credit impact | Notes |
| --- | --- | --- | --- | --- | --- |
| `clean_cut` | A direct motivated cut. | Talking head, education, interviews, serious beats. | When a discontinuity needs smoothing. | `none` / `low` | Default professional option. |
| `invisible_cut` | A cut designed to disappear. | Retake cleanup, pacing cleanup, speech continuity. | Hero beats needing visible emphasis. | `none` / `low` | Often best for clean edits. |
| `match_cut` | Cut matching shape, action, framing, or meaning. | Visual parallels, before/after, product proof. | Weak visual match or forced cleverness. | `low` / `medium` | Needs source observation confidence. |
| `action_match` | Cut on shared movement or gesture. | Vlog, lifestyle, product handling, sports. | Important facial expression during movement. | `low` | Protects motion continuity. |
| `motion_match` | Cut matching camera or object motion. | Montage, travel, property walkthrough. | Unstable motion or disorienting context. | `low` / `medium` | Can feel premium when subtle. |
| `soft_dissolve` | Gradual visual blend between shots. | Time passage, memory, calm emotional shift. | Fast social pacing or hard proof beats. | `low` | Avoid defaulting to dissolve everywhere. |
| `premium_push` | Subtle push, slide, or camera move. | Luxury, property, premium product reveal. | Serious pauses or user wants no effects. | `low` / `medium` | Should feel controlled. |
| `parallax_push` | Depth-aware push across layers. | Property, product, visual emphasis. | Face/object collision or weak depth plan. | `medium` | Needs composition planning. |
| `whip_or_fast_move` | Fast motion transition. | Energetic social montage. | Luxury, documentary, important speech. | `low` / `medium` | Easy to overuse. |
| `speed_ramp_bridge` | Speed change bridges moments. | Action, sports, energetic montage. | Dialogue-heavy or serious context. | `medium` | Must protect comprehension. |
| `ambient_bridge` | Audio ambience bridges a cut. | Lifestyle, property, documentary, room transitions. | When ambience conflicts or source truth is unclear. | `low` | Often better than SFX. |
| `sound_bridge` | Sound carries across a visual cut. | J-cut/L-cut feel, podcast, documentary. | Key speech conflict or loud cue. | `low` / `medium` | Speech clarity wins. |
| `luma_or_light_wipe` | Light/luma movement reveals next shot. | Premium product, bright environments. | Dark serious scenes or unsupported footage. | `medium` | Edge behavior must be planned. |
| `graphic_wipe` | Graphic shape/panel wipes between scenes. | Marketing, education, branded segments. | Natural documentary or luxury restraint. | `low` / `medium` | Avoid template-pack feeling. |
| `shape_morph` | Shape transforms from one visual to another. | Explainers, product features, Graphic Design. | Weak meaning link or caption collision. | `medium` | Needs design reason. |
| `text_or_caption_bridge` | Text/caption carries the transition. | Education, chaptering, social clarity. | Dense visuals or unreadable timing. | `low` | Captions remain readable. |
| `b_roll_bridge` | B-roll carries continuity across topics. | Talking head, testimonial, product proof. | B-roll hides important emotion. | `low` / `medium` | Must preserve meaning. |
| `browser_frame_transition` | Browser/app frame helps move between screens. | Product demos, tutorials, SaaS. | Unapproved or invented exact screens. | `low` / `medium` | Source status must be clear. |
| `ui_panel_transition` | UI-style panel transition. | SaaS, dashboards, explainers. | Organic/luxury footage unless intentional. | `low` / `medium` | Hard edges often fit. |
| `stroke_motion_connected_transition` | Stroke Motion links story beats. | Spoken story, source reading, conceptual bridge. | Random doodle motion or weak meaning. | `medium` | Must follow Stroke Motion doctrine. |
| `real_motion_object_transition` | Realistic object motion bridges shots. | Premium object or product moments. | Face-safe risk or budget mismatch. | `high` / `premium` | Approval and QA heavy. |
| `three_d_object_transition` | 3D object leads or masks transition. | Product launch, high-value reveal. | Minor sentence or low budget. | `high` / `premium` | Needs 3D role/placement. |
| `data_or_chart_transition` | Data/chart object bridges scenes. | Proof, analytics, business case. | Unverified data or visual clutter. | `medium` | Exact labels need deterministic handling. |
| `chapter_card_transition` | Card/title marks section change. | Education, podcast, webinar, case study. | Overuse or slow pacing. | `low` / `medium` | Can clarify structure. |
| `no_transition` | Intentional absence of transition. | Emotional pause, natural cut, simple edit. | When continuity problem needs repair. | `none` | Must be treated as a valid decision. |

## Transition Intensity Model

| Intensity | Meaning | When to use | Risk if overused | Example |
| --- | --- | --- | --- | --- |
| `none` | No transition beyond the source cut. | Preserve emotion or natural continuity. | Can feel abrupt if continuity is broken. | Preserve an emotional pause. |
| `invisible` | Transition is hidden in the edit. | Talking-head cleanup or clean edit. | May feel flat if every scene needs emphasis. | Talking-head clean edit. |
| `subtle` | Gentle transition support. | Premium, luxury, education, calm changes. | Can become repetitive or sleepy. | Premium property walkthrough. |
| `moderate` | Noticeable but not dominant. | Chapter changes, proof reveals, explainers. | Can distract if speech is dense. | Education segment change. |
| `energetic` | Fast or rhythm-driven transition. | Social montage or high-energy ad. | Can feel amateur/viral if overused. | Social montage beat. |
| `hero` | Transition is a primary design moment. | Major product reveal or story transformation. | Expensive and distracting if unearned. | Product launch reveal. |

## Edge Behavior Model

Transition edge behavior must be planned, not guessed later.

| Edge behavior | Meaning | Best fit |
| --- | --- | --- |
| `hard_edge` | Clear boundary between visual areas. | Graphic panels, UI, comparison layouts. |
| `soft_edge` | Blended or feathered boundary. | Premium overlays, cinematic movement. |
| `feathered_edge` | Soft mask with visible falloff. | Light overlays, environmental bridges. |
| `motion_blur_edge` | Blur hides speed or movement seam. | Whip, push, speed-ramp transitions. |
| `light_wrap_edge` | Light wraps transition boundary. | Real Motion, 3D integration, glow transitions. |
| `masked_edge` | Subject/object/matte defines the edge. | Object-led and face-safe transitions. |
| `graphic_panel_edge` | Designed card or panel edge. | Branded marketing, explainers. |
| `browser_frame_edge` | Browser/app/device frame edge. | Product demo and screen transition. |
| `object_occlusion_edge` | Object passes over or occludes the cut. | 3D/Real Motion object-led transitions. |

Hard edges fit graphic panels, UI transitions, browser frames, comparison layouts, and intentional split screens. Soft edges fit cinematic/premium overlays, Real Motion, 3D integration, light/glow transitions, and atmospheric transitions.

Full overlay/compositing belongs to `RP-SKILLS-04`; this section only defines transition-specific edge behavior.

## TransitionTimingPlan Pseudo-Record

`TransitionTimingPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `cut_point_seconds` | Required | Primary cut or transition decision point. | `12.4` |
| `transition_start_seconds` | Required | Start of visual/audio transition range. | `12.1` |
| `transition_end_seconds` | Required | End of transition range. | `12.8` |
| `duration_frames` | Required | Duration in frames for future timing precision. | `18` |
| `duration_seconds` | Required | Duration in seconds. | `0.6` |
| `pre_roll_seconds` | Optional | Lead-in before cut point. | `0.2` |
| `post_roll_seconds` | Optional | Tail after cut point. | `0.2` |
| `timing_anchor_type` | Required | Anchor type such as phrase end, downbeat, action, or story beat. | `phrase_end` |
| `transcript_anchor_text` | Optional | Spoken phrase anchoring the transition. | `"...and that changed everything."` |
| `story_beat_anchor` | Optional | Story beat the transition supports. | `proof_reveal` |
| `music_beat_anchor` | Optional | Beat/downbeat/drop/resolve anchor. | `downbeat_16` |
| `sfx_anchor` | Optional | SFX hit or ambient bridge anchor. | `soft_air_pass_after_cut` |
| `action_anchor` | Optional | Visual action anchoring the cut. | `door_open_motion` |
| `hold_before_transition` | Optional | Pause/hold before transition. | `0.3s hold for emotional beat` |
| `hold_after_transition` | Optional | Pause/hold after transition. | `0.5s to read chapter card` |
| `sync_precision_needed` | Required | Needed precision level. | `frame` |

## TransitionCompositionPlan Pseudo-Record

`TransitionCompositionPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `from_segment_id` | Required | Segment before transition. | `segment_03` |
| `to_segment_id` | Required | Segment after transition. | `segment_04` |
| `from_visual_state` | Required | Visual state before transition. | `speaker_medium_shot_left` |
| `to_visual_state` | Required | Visual state after transition. | `product_ui_screen_recording` |
| `transition_family` | Required | Selected transition family. | `browser_frame_transition` |
| `edge_behavior` | Required | Planned edge behavior. | `browser_frame_edge` |
| `motion_direction` | Optional | Direction of motion if used. | `left_to_right` |
| `motion_curve` | Optional | Easing/curve guidance. | `ease_out_subtle` |
| `motion_blur` | Optional | Motion blur guidance. | `low` |
| `scale_change` | Optional | Scale push/pull behavior. | `1.0_to_1.04` |
| `parallax_depth` | Optional | Depth/parallax notes. | `foreground card moves 8px faster` |
| `color_luma_continuity` | Optional | Luma/color continuity guidance. | `avoid bright flash between dark scenes` |
| `safe_area_strategy` | Required | How transition respects frame safety. | `avoid lower captions and right-side logo` |
| `face_visibility_protection` | Required | How faces/expressions stay visible. | `do not mask speaker eyes during cut` |
| `caption_collision_strategy` | Required | Caption conflict handling. | `pause caption motion during wipe` |
| `overlay_collision_strategy` | Required | Overlay conflict handling. | `clear product label before transition` |
| `screen_layout_continuity` | Optional | How screen layout carries across segments. | `browser frame persists across cut` |
| `aspect_ratio_notes` | Required | Aspect ratio-specific guidance. | `vertical: keep movement inside central 80%` |

## TransitionAudioPlan Pseudo-Record

`TransitionAudioPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `music_relationship` | Required | How music supports or avoids the transition. | `light_downbeat_support` |
| `beat_sync` | Required | Whether transition syncs to beat. | `true` |
| `beat_type` | Optional | Beat kind if synced. | `downbeat` |
| `sfx_needed` | Required | Whether SFX is needed. | `false` |
| `sfx_type` | Optional | SFX category if used. | `soft_air_pass` |
| `sfx_intensity` | Optional | SFX energy. | `subtle` |
| `sfx_timing` | Optional | SFX timing relationship. | `tail_after_cut` |
| `speech_safety` | Required | How speech remains clear. | `no hit under key phrase` |
| `ducking_needed` | Required | Whether ducking is needed. | `true` |
| `ambient_bridge_needed` | Required | Whether ambience bridges the cut. | `true` |
| `room_tone_strategy` | Required | Room tone continuity guidance. | `carry room tone 0.4s after cut` |
| `silence_preservation` | Optional | Silence or pause preservation. | `preserve 0.5s pause before next line` |
| `audio_tail_strategy` | Optional | Audio tail guidance. | `short fade out after scene change` |
| `avoid_under_speech` | Required | Whether cues must avoid speech. | `true` |
| `audio_qa_notes` | Required | Audio QA notes. | `verify SFX does not mask consonants` |

Transition SFX should not be automatic. Sometimes ambience or room tone is better than SFX. Sometimes silence is the professional choice. Music beat anchors can support transitions, but speech clarity wins.

## TransitionSkillPlan Pseudo-Record

`TransitionSkillPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code. It includes universal fields by reference and adds transition-specific fields.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable transition skill plan identifier. | `transition_segment_03_to_04` |
| `project_id` | Required | Project that owns the transition plan. | `project_product_demo` |
| `edit_plan_id` | Required | Edit plan containing the transition. | `edit_plan_v4` |
| `from_edit_plan_segment_id` | Required | Segment before the transition. | `segment_03` |
| `to_edit_plan_segment_id` | Required | Segment after the transition. | `segment_04` |
| `skill_key` | Required | Skill key. | `transition_design` |
| `transition_family` | Required | Transition family. | `browser_frame_transition` |
| `transition_intensity` | Required | Intensity level. | `moderate` |
| `transition_purpose` | Required | Why the transition exists. | `Move from talking explanation to app proof.` |
| `planning_reason` | Required | Full editorial reason. | `The speaker introduces the feature, so the browser frame transition makes the screen change legible without inventing UI.` |
| `restraint_decision` | Required | Universal restraint decision. | `use_subtle` |
| `cut_point_seconds` | Required | Main cut point. | `18.2` |
| `duration_frames` | Required | Duration in frames. | `14` |
| `duration_seconds` | Required | Duration in seconds. | `0.47` |
| `edge_behavior` | Required | Edge behavior. | `browser_frame_edge` |
| `motion_direction` | Optional | Motion direction. | `upward_reveal` |
| `motion_curve` | Optional | Easing/curve. | `ease_out` |
| `visual_continuity_strategy` | Required | How continuity is protected. | `Carry browser chrome across cut; avoid false screen content.` |
| `audio_strategy` | Required | Audio transition approach. | `Room tone bridge; no SFX hit.` |
| `music_beat_anchor` | Optional | Music anchor if used. | `downbeat_24` |
| `sfx_strategy` | Required | SFX approach. | `no_sfx` |
| `ambient_bridge_strategy` | Required | Ambience/room tone bridge strategy. | `continue source room tone for 0.3s` |
| `speech_safety` | Required | Speech safety rule. | `no transition cue under key phrase` |
| `caption_collision_strategy` | Required | Caption collision handling. | `hold captions stable through frame move` |
| `overlay_collision_strategy` | Required | Overlay collision handling. | `clear callout before transition starts` |
| `credit_impact` | Required | Credit impact. | `low` |
| `approval_required` | Required | Whether approval is required. | `false` |
| `qa_checks` | Required | Transition QA checks. | `story_reason, caption_safe, speech_safe` |
| `revision_options` | Required | Safe revision options. | `make cleaner; remove frame motion; use clean cut` |
| `worker_notes` | Optional | Future worker-safe notes. | `Use approved timing record only; no prompt-only execution.` |
| `must_follow_rules` | Required | Non-negotiable constraints. | `Do not invent exact app screen; do not cover captions.` |
| `avoid_rules` | Required | Things to avoid. | `Avoid flashy wipe; avoid SFX under speech.` |
| `status` | Required | Planning status. | `selected` |
| `metadata_json` | Optional | Documentation-only placeholder for future metadata. | `{ "source": "docs-only example" }` |

## Transition Scoring Model

Future planners should score transition candidates before selecting or rejecting them.

Positive signals:

- Meaningful scene/time/location change.
- Emotional shift.
- Beat-aligned cut.
- Visual continuity problem.
- User preference supports motion.
- Platform supports energetic pacing.
- Reference DNA suggests transition language.
- B-roll or overlay creates a natural bridge.
- Transition improves comprehension.

Negative signals:

- User requested clean/simple/natural.
- Important speech moment.
- Transition would be random.
- Repeated same transition family recently.
- Visual clutter.
- Caption collision.
- Face/expression hidden.
- Music/SFX conflict.
- Credit budget too low.
- Platform/tone mismatch.

Pseudo formula:

```text
transition_score =
  story_need
+ visual_continuity_need
+ rhythm_fit
+ user_preference_fit
+ reference_dna_fit
+ platform_fit
- speech_risk
- clutter_risk
- repetition_penalty
- credit_penalty
- tone_mismatch
```

A high score does not bypass approval, credit, QA, or StoryTiming.

## Relationship To Edit Preference

Direct user instruction overrides defaults.

| Edit preference | Transition guidance |
| --- | --- |
| Clean/minimal | Mostly clean cuts and invisible cuts. |
| Premium/luxury | Subtle soft transitions, ambient bridges, premium push only where earned. |
| Energetic/social | Faster beat-matched transitions where appropriate. |
| Educational | Clean transitions that preserve comprehension. |
| Cinematic | Soft, motivated transitions with ambience/music support. |
| Serious/faith/documentary | Restrained transitions and preserved pauses. |
| Product/marketing | Stronger transition moments for proof, feature, or CTA reveals. |
| No extra visuals | Transitions stay clean unless necessary. |

## Relationship To Workflow Context

| Workflow context | Likely transition behavior | Avoid behavior | Notes |
| --- | --- | --- | --- |
| Simple Clean Edit | Clean cuts, invisible cuts, occasional ambient bridge. | Flashy motion or repeated wipes. | Professional does not mean boring; it means motivated. |
| Social Short / Viral Clip | Beat-matched cuts, energetic moves when story supports it. | Transition every clip by default. | Caption readability still matters. |
| Talking Head / Personal Brand | Invisible cuts, B-roll bridges, subtle audio bridges. | Hiding expression or adding random movement. | Preserve trust and speech clarity. |
| Podcast Clip | J/L-cut feel, chapter cards, clean proof cutaways. | Loud SFX or heavy motion. | Rhythm comes from speech. |
| Vlog / Lifestyle | Ambient bridges, motion matches, soft dissolves. | Template pack energy. | Source ambience can carry continuity. |
| Product Demo | UI/browser frame transitions, clean chapter shifts. | Invented exact screens or unclear source status. | Browser/app visuals need source truth. |
| Real Estate / Property Tour | Premium pushes, soft ambient bridges, motion continuity. | Fast flashy wipes. | Spatial coherence matters. |
| Education / Explainer | Chapter cards, graphic transitions, clean cuts. | Transitions that reduce comprehension. | Readability and hierarchy win. |
| Marketing Ad | Proof/feature/CTA transition moments. | Overusing hero transitions. | Premium transitions need credit/approval. |
| Testimonial / Case Study | B-roll bridges, clean cuts, emotional restraint. | Hiding facial emotion. | Preserve authenticity. |
| Custom / Let AI Decide | Score candidates against story, preference, platform, and budget. | Defaulting to a style without reason. | Explain the transition plan. |

## Relationship To Other Skills

Transition planning coordinates with:

- Captions: transitions must not hide captions or make caption timing unreadable.
- B-roll: B-roll can bridge edits, but should not hide meaningful emotion.
- Graphic design: graphic wipes/cards need exact layout and caption collision checks.
- Motion design: motion language and easing should support the transition, not define it blindly.
- 3D visuals: 3D transition objects need role, placement, face safety, and approval/credit behavior.
- Stroke Motion: connected transitions should support spoken story or source reading.
- Real Motion: object-led transitions need face/object safety and stronger QA.
- Browser/app visuals: frame transitions must not imply false source status or invent private screens.
- SoundSync/music/SFX: transition timing, SFX, music ducking, and ambience must remain speech-first.
- StoryTiming: full timing coordination, conflicts, dependencies, and render handoff belong to `RP-SKILLS-11`.

Conflict examples:

- Transition SFX under speech.
- Graphic wipe colliding with captions.
- 3D transition object covering face.
- Browser frame transition implying false source status.
- Transition hiding emotional expression.
- Repeated transition language reducing premium feel.

## Credit And Approval Behavior

Transition credit behavior:

- `clean_cut` / `invisible_cut`: `none` or `low`.
- `soft_dissolve` / `ambient_bridge`: `low`.
- `graphic_wipe` / `browser_frame_transition`: `low` to `medium`.
- `stroke_motion_connected_transition`: `medium`.
- `real_motion_object_transition`: `high` / `premium`.
- `three_d_object_transition`: `high` / `premium`.
- Custom generated transition: `premium`.

Rules:

- Premium transitions must be itemized.
- Heavy generated transitions require estimate and approval.
- Optional heavy transitions should have lower-cost alternatives.
- No generation before approval.
- Clean cuts can still be professional and should not be treated as low quality.

## Transition QA

Transition-specific QA checks:

- Transition has story reason.
- No random effect.
- Timing feels natural.
- Speech not disrupted.
- SFX not too loud.
- Music beat alignment correct.
- Ambience/room tone continuity.
- Visual continuity.
- Edge behavior fits style.
- Captions not hidden.
- Speaker face/expression protected.
- Transition family not overused.
- User preference honored.
- Reference not copied shot-for-shot.
- Credit/approval compliance.

Blocking examples:

- Premium generated transition without approval.
- Transition hides important speech, captions, or face.
- Loud SFX under key speech.
- Transition contradicts user "clean/no effects" instruction.

Warning examples:

- Transition may feel slightly too energetic.
- Transition family repeated too often.
- Edge treatment may need softening.

## Revision Behavior

Safe revision options:

- Remove transition.
- Make transition cleaner.
- Make transition softer.
- Make transition more premium.
- Lower transition energy.
- Change hard edge to soft edge.
- Remove SFX.
- Use ambient bridge instead.
- Align to beat.
- Replace 3D transition with graphic wipe.
- Replace generated transition with clean cut.
- Lower credit cost.

Revision requires a new credit estimate and approval when it adds premium generation, changes provider/tool dependency, increases credit impact, changes approved timing materially, or introduces new SFX/music/render work. Revisions that simplify, remove, or reduce cost may still need plan snapshot updates, but should not imply execution without approval.

## Examples

### Example 1: Talking Head Invisible Cut

| Field | Example |
| --- | --- |
| `skill_key` | `transition_design` |
| `transition_family` | `invisible_cut` |
| `planning_reason` | The speaker restarts a sentence. Invisible cut preserves flow without adding visual noise. |
| `restraint_decision` | `use_full` |
| `timing_summary` | Cut at phrase restart; no added transition duration. |
| `composition_summary` | Preserve speaker framing; no overlay or motion. |
| `audio_strategy` | Smooth room tone; no SFX. |
| `credit_impact` | `none` |
| `approval_required` | `false` |
| `QA checks` | Speech continuity, face continuity, no random effect. |

### Example 2: Premium Property Ambient Bridge

| Field | Example |
| --- | --- |
| `skill_key` | `transition_design` |
| `transition_family` | `premium_push` with `ambient_bridge` |
| `planning_reason` | The tour moves from exterior to living room; a subtle push and room-tone bridge preserve spatial calm. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | 16-frame push on room entry, after narration pause. |
| `composition_summary` | Soft edge, no face overlap, preserve room lines. |
| `audio_strategy` | Carry ambience 0.5s; no hit SFX. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `QA checks` | Spatial continuity, ambience continuity, luxury restraint. |

### Example 3: Product Demo Browser Frame

| Field | Example |
| --- | --- |
| `skill_key` | `transition_design` |
| `transition_family` | `browser_frame_transition` |
| `planning_reason` | The narration moves from claim to app proof. Browser frame transition makes the source screen relationship clear without inventing exact UI. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Start after "inside the dashboard"; 0.5s frame reveal. |
| `composition_summary` | Browser frame edge, protect captions, use authorized/source screen only. |
| `audio_strategy` | No SFX under speech; optional soft UI tick after phrase. |
| `credit_impact` | `low` |
| `approval_required` | `false` unless generated screen assets are proposed. |
| `QA checks` | Source status, caption collision, speech safety, no invented screen. |

### Example 4: Education Chapter Card

| Field | Example |
| --- | --- |
| `skill_key` | `transition_design` |
| `transition_family` | `chapter_card_transition` |
| `planning_reason` | The lesson shifts from setup to example; a clean chapter card helps comprehension. |
| `restraint_decision` | `use_full` |
| `timing_summary` | 1.0s card after sentence end; no overlap with key speech. |
| `composition_summary` | Hard edge card, readable type, caption-free hold. |
| `audio_strategy` | Music bed ducks; no SFX required. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `QA checks` | Readability, comprehension, timing, no random effect. |

### Example 5: Marketing CTA Proof Reveal

| Field | Example |
| --- | --- |
| `skill_key` | `transition_design` |
| `transition_family` | `graphic_wipe` |
| `planning_reason` | The ad moves from pain point to proof metric; a branded graphic wipe creates a clear proof reveal. |
| `restraint_decision` | `use_optional` |
| `timing_summary` | Beat-aligned 18-frame wipe before metric card. |
| `composition_summary` | Graphic panel edge, no caption collision, metric remains readable. |
| `audio_strategy` | Optional subtle hit after speech; duck music under line. |
| `credit_impact` | `medium` |
| `approval_required` | `true` if custom generated graphic elements are proposed. |
| `QA checks` | Proof clarity, credit approval, caption safety, brand restraint. |

### Example 6: Rejected 3D Transition Object

| Field | Example |
| --- | --- |
| `skill_key` | `transition_design` |
| `transition_family` | `three_d_object_transition` |
| `planning_reason` | A 3D object transition was considered, but the moment is a minor sentence and does not earn premium cost. |
| `restraint_decision` | `replace_with_simpler_skill` |
| `timing_summary` | Use clean cut at phrase end instead. |
| `composition_summary` | No 3D object; preserve speaker face and captions. |
| `audio_strategy` | No SFX; preserve room tone. |
| `credit_impact` | `none` |
| `approval_required` | `false` |
| `QA checks` | Premium restraint, face safety, no random transition. |

## Anti-Patterns

Avoid these transition planning failures:

- Transition name only.
- Transition every clip.
- Same transition repeated mechanically.
- Flashy effect in serious edit.
- Loud SFX under speech.
- Transition hides face/expression.
- Transition hides captions.
- Transition breaks spatial continuity.
- Transition unrelated to story.
- Transition chosen before creative concept.
- 3D transition without role/placement.
- Generated transition without credit estimate.
- Premium transition without approval.
- Copying reference transition shot-for-shot.
- Worker execution from raw prompt only.

## Future Implementation Notes

Possible future records/tables/types:

- `transition_plans`
- `transition_timing_plans`
- `transition_audio_plans`
- `transition_qa_requirements`
- `edit_plan_skill_routes` with `skill_key = transition_design`
- `storytiming_coordination_records`

This document does not create those records now. Future schema/types must avoid duplicating this document's source truth. Future specialized overlay, motion, 3D, and sound contracts must reference this transition contract when they involve transitions.

## Duplicate And Overlap Notes

Existing transition concepts already appear in edit quality docs/types, `src/lib/professional-editing-ontology.ts`, SoundSync transition timing planners, SFX ambient bridge docs/services, StoryTiming docs/types/mock backend services, planner validation, timing validation, and the RP-SKILLS-02 universal contract.

This contract should be treated as the transition planning doctrine and field envelope, not a replacement for those owners. It must not create a parallel StoryTiming, SoundSync, SFX, provider, worker, QA, credit, or Supabase lane.

## Next Prompt Handoff

Recommended next prompt:

`RP-SKILLS-04 - Overlay and Compositing Planning Contract`

Scope:

Docs-only overlay/compositing planning contract that inherits the universal contract and defines screen zones, safe areas, hard/soft edge behavior, blend/opacity/shadow/masking/tracking/layer order, caption/object/face collision strategy, and overlay QA.
