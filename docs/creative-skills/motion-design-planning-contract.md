# Motion Design Planning Contract

## Purpose

This document defines the motion-design-specific planning contract for future ReeditPro motion design skills.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, animation code, package changes, Supabase connections, SQL, credentials, Remotion code, Lottie code, SVG code, Three.js code, Babylon.js code, canvas/WebGL runtime, browser runtime, Playwright execution, AI calls, or app behavior.

This contract inherits from [skill-planning-contracts.md](skill-planning-contracts.md). It references transition timing and edge behavior from [transition-planning-contract.md](transition-planning-contract.md) when motion is used as transition support. It references overlay/compositing safety from [overlay-compositing-planning-contract.md](overlay-compositing-planning-contract.md) when motion moves an overlay. It references graphic design structure from [graphic-design-planning-contract.md](graphic-design-planning-contract.md) when motion reveals or animates graphics.

This document defines motion-design-specific fields and rules that future docs, types, schema, workers, and QA systems must follow when motion design is eventually implemented.

## Motion Design Doctrine

Motion design must not be random movement.

Motion should support meaning, hierarchy, rhythm, emotion, comprehension, spatial continuity, product clarity, or a justified wow moment. Motion should not distract from speech, captions, faces, products, important actions, or emotional pauses.

A premium edit can use bold motion where the story earns it, but overusing motion makes the edit feel amateur. A no-motion or near-invisible motion decision can be professional. Every motion pattern needs a reason, a timing anchor, an energy level, and QA.

Core principle:

"Every motion decision must know what it is moving, why it moves, when it moves, how it moves, and when it should stop."

## Universal, Transition, Overlay, And Graphic Design Inheritance

Every `MotionDesignSkillPlan` inherits the universal skill planning envelope from RP-SKILLS-02:

- `planning_reason`
- `restraint_decision`
- Timing envelope.
- Composition envelope.
- Audio relationship envelope where relevant.
- Tool strategy envelope.
- Credit/approval envelope.
- QA envelope.
- Revision envelope.

Motion design references RP-SKILLS-03 when motion behaves like a transition or crosses a cut:

- Cut point and transition timing.
- Transition edge behavior.
- Beat, SFX, and speech-safety behavior for transitions.

Motion design references RP-SKILLS-04 when motion moves a visual layer:

- Screen zone.
- Safe area.
- Face/object/caption collision planning.
- Edge treatment.
- Blend, opacity, shadow, and contact behavior.
- Tracking, masking, and occlusion notes.
- Layer order.
- Aspect ratio behavior.

Motion design references RP-SKILLS-05 when motion reveals or animates graphics:

- Graphic role.
- Information hierarchy.
- Layout family.
- Typography/readability intent.
- Design density.
- Source/proof safety for graphic elements.

The motion design contract adds:

- Motion role.
- Motion subject.
- Motion language.
- Motion energy.
- Easing intent.
- Rhythm and stagger.
- Entry, hold, and exit behavior.
- Timing anchor.
- Repetition avoidance.
- Motion-specific accessibility/readability risk.
- Motion-specific QA.

Do not duplicate the full universal, transition, overlay/compositing, or graphic design contracts except when referencing inheritance.

## Motion Design Roles

These roles are planning guidance, not hard-coded execution.

| Role | What it is | Best use cases | Avoid cases | Typical credit impact | Notes |
| --- | --- | --- | --- | --- | --- |
| `no_motion_design` | Intentional absence of motion. | Emotional pause, strong source footage, clean edit. | When clarity needs reveal or hierarchy. | `none` | A valid professional decision. |
| `invisible_motion_support` | Tiny fades or polish nearly invisible to viewer. | Clean talking head, corporate, simple edits. | Hero moments needing clear emphasis. | `none` / `low` | Professional polish without spectacle. |
| `subtle_reveal` | Gentle reveal for a layer or label. | Premium labels, lower thirds, clean cards. | Energetic social beat that needs punch. | `low` | Often safest default. |
| `graphic_card_reveal` | Motion for a card entering/holding/exiting. | VisualExplain cards, proof, offers. | Dense text or short read time. | `low` / `medium` | Must preserve hierarchy. |
| `callout_motion` | Motion for a callout line, pin, or label. | Product feature, property detail, UI pointer. | Weak anchor or tracking need. | `low` / `medium` | Avoid covering target. |
| `label_motion` | Motion for small labels. | B-roll context, locations, product names. | Repeated labels every few seconds. | `low` | Keep restrained. |
| `kinetic_type_support` | Motion that emphasizes text rhythm. | Social, titles, selected phrase emphasis. | Serious proof, dense captions. | `low` / `medium` | Must not replace caption readability. |
| `caption_emphasis_support` | Motion support for future caption emphasis. | Social captions, keyword moments. | Important speech where motion distracts. | `low` | Full caption contract belongs to RP-SKILLS-09. |
| `shape_motion` | Moving shapes, blocks, lines, or design elements. | Brand moments, explainers, social energy. | Decoration-only movement. | `low` / `medium` | Shape needs a job. |
| `line_or_path_motion` | Line trace or path follow. | Diagrams, maps, relationships, Stroke Motion support. | Random doodle or unreadable path. | `medium` | Coordinate with Stroke Motion. |
| `diagram_build` | Sequential build of diagram elements. | Education, frameworks, process explainers. | Too many steps or rushed read time. | `medium` | Hierarchy wins. |
| `framework_build` | Motion that introduces framework parts. | Courses, coaching, business explainers. | Tiny screens or dense captions. | `medium` | Use with graphic hierarchy. |
| `chart_or_metric_motion` | Motion for chart/data reveal. | Verified data, metrics, results. | Unverified claims or unreadable numbers. | `medium` | Source/proof safety required. |
| `count_up_motion` | Numeric count-up or metric emphasis. | Verified metrics, offer proof. | Fake precision or weak source. | `medium` | Exact numbers need source truth. |
| `icon_motion` | Icon pop, morph, or movement. | Product/education labels. | Generic icon clutter. | `low` / `medium` | Icon should clarify. |
| `UI_highlight_motion` | Motion around UI feature. | Tutorials, SaaS demos. | Invented UI or private data. | `medium` | Source status required. |
| `browser_app_focus_motion` | Motion focus on browser/app region. | App walkthrough, screen proof. | Unsupported capture or redaction risk. | `medium` | Does not unlock browser capture. |
| `B_roll_inset_motion` | Motion for B-roll inset placement. | Talking head plus proof. | Face/caption collision or tiny inset. | `low` / `medium` | Full B-roll contract belongs to RP-SKILLS-08. |
| `picture_in_picture_motion` | Motion for PIP layer. | Podcasts, demos, interviews. | Too much movement around speaker. | `low` / `medium` | Keep stable after entry. |
| `transition_motion_support` | Motion supporting a cut/transition. | Scene shift, proof reveal, product reveal. | Emotional pauses or speech conflict. | `low` / `medium` | Transition contract owns transition behavior. |
| `Stroke_Motion_support` | Motion support around Stroke Motion layer timing. | Story lines, source reading, concept links. | Competing with Stroke Motion drawing. | `medium` | Stroke Motion remains owner. |
| `Real_Motion_support` | Motion support around Real Motion layer entry/settle. | Premium object/proof moments. | Face risk or budget mismatch. | `high` / `premium` | Real Motion remains owner. |
| `three_d_entry_exit_support` | Motion support for 3D object entry/exit. | Product hero, spatial reveal. | 3D role not defined. | `high` / `premium` | Full 3D contract belongs to RP-SKILLS-07. |
| `hero_motion_moment` | Motion is the primary visual beat. | Product launch, major transformation, premium CTA. | Minor sentence or low credit budget. | `high` / `premium` | Must be earned and approved. |
| `emotional_motion_accent` | Small motion for emotion, pause, or tone. | Storytelling, testimonial, cinematic. | Manipulative or distracting motion. | `low` / `medium` | Silence/stillness may be better. |
| `ambient_motion_layer` | Slow background or atmospheric motion. | Premium, cinematic, luxury. | Busy talking-head or proof scenes. | `low` / `medium` | Must stay subtle. |

## Use Motion When

Motion design is appropriate when:

- A graphic needs reveal hierarchy.
- Viewer attention needs controlled guidance.
- A product feature reveal needs emphasis.
- A diagram or framework should build over time.
- Data/metric should appear with readable emphasis.
- A browser/app screen needs focus or highlight motion.
- A B-roll inset or PIP needs smooth placement.
- A transition needs motion continuity.
- Caption/keyword emphasis needs subtle support later.
- 3D/Real Motion needs entry/exit support later.
- Stroke Motion timing needs coordination.
- SoundSync beat/mood supports motion.
- A social platform benefits from motion energy.
- A premium/wow moment is earned by the story.
- User edit preference supports motion.

## Avoid Motion When

Motion design should be avoided or minimized when:

- The user requested clean, simple, or no extra visuals.
- A serious emotional pause needs stillness.
- Important speech would be distracted.
- Captions would become hard to read.
- Face, expression, product, or action would be hidden.
- The visual is already strong without movement.
- Motion repeats the same pattern too often.
- Motion would make the edit feel like a template pack.
- Motion energy conflicts with tone.
- Motion is only decoration.
- Source/proof graphic needs trust and should stay stable.
- Credit budget does not justify complex/generated motion.
- Platform/duration does not allow enough read time.
- Motion could cause accessibility or comfort issues.
- Motion requires unsupported runtime, tracking, or masking.

## Motion Energy Model

Motion energy is not quality. Basic/professional can be low motion. Premium/wow can be high motion only where earned.

| Energy | Meaning | When to use | Risk if overused | Example |
| --- | --- | --- | --- | --- |
| `none` | No motion design. | Serious pause, strong footage, source proof. | Can feel static if clarity needs sequence. | Preserve serious emotional pause. |
| `invisible` | Tiny fade or micro-polish. | Clean edits, corporate, talking head. | May under-emphasize key moment. | Tiny fade for professional polish. |
| `subtle` | Gentle readable motion. | Premium labels, lower thirds, soft cards. | Can become repetitive. | Premium property feature label. |
| `restrained` | Controlled but noticeable motion. | Personal brand, explainers, B-roll insets. | Can feel too safe for social. | Personal brand lower third. |
| `balanced` | Clear motion supporting hierarchy. | Education, product demos, diagrams. | Can clutter if many layers move. | Education diagram build. |
| `energetic` | Strong rhythm and movement. | Social montage, ads, creator content. | Can feel amateur or harm speech. | Social montage emphasis. |
| `hero` | Motion is a main visual event. | Product launch, transformation, CTA. | Expensive and distracting if unearned. | Product launch reveal. |

## Motion Language Model

Motion language should not be repeated mechanically. Glitch, shake, bounce, whip, and high-impact motion require tone justification. Premium/luxury motion often prefers subtle, smooth, spatial, restrained movement. Educational motion often prefers clear sequential build.

| Motion language | What it is | Best use cases | Avoid cases | Notes |
| --- | --- | --- | --- | --- |
| `fade` | Opacity reveal or hide. | Clean polish, captions, lower thirds. | Hero moments needing spatial movement. | Often safest. |
| `slide` | Moves in/out across a direction. | Cards, panels, lower thirds. | Motion over face/captions. | Direction must be planned. |
| `push` | Layer or camera-like push forward. | Premium transitions, emphasis. | Dense text or speech-heavy moments. | Can feel cinematic. |
| `pull` | Layer recedes or pulls away. | Exits, reveal of source footage. | Tiny elements. | Good for clearing space. |
| `scale` | Size change. | Pop emphasis, product highlight. | Unstable proof/text. | Avoid jumpy scaling. |
| `blur_in` | Blur resolves into focus. | Premium reveal, atmospheric layer. | Exact text if readability suffers. | Needs read-time QA. |
| `blur_out` | Blur exits or softens. | Scene clearing, transition support. | Important source/proof visuals. | Do not hide proof. |
| `mask_reveal` | Mask exposes element. | Cards, diagrams, clean wipes. | Weak mask or unknown runtime readiness. | Planning only here. |
| `wipe` | Edge reveals layer. | Graphic panels, transitions. | Serious emotional content. | RP-SKILLS-03 owns transition use. |
| `draw_on` | Element draws on. | Lines, diagrams, Stroke Motion support. | Long path with little meaning. | Keep timing readable. |
| `line_trace` | Line follows route/relationship. | Process, map, relationship. | Random decoration. | Often needs SFX restraint. |
| `path_follow` | Object follows a path. | Map route, product flow. | Unsupported tracking/path source. | Source must be clear. |
| `morph` | Shape changes into another. | Concept link, design transition. | Weak meaning link. | Avoid template feel. |
| `orbit` | Circular/spatial motion. | Framework, 3D support. | Dense labels or serious proof. | Can feel premium if subtle. |
| `parallax` | Layers move at different speeds. | Depth/premium spatial feel. | Face/caption collision. | Needs composition plan. |
| `depth_push` | Motion suggests depth. | Product/3D/Real Motion support. | Unsupported depth plan. | Handoff to 3D if needed. |
| `float` | Slow drifting motion. | Ambient/premium background. | Proof or captions. | Keep restrained. |
| `pulse` | Brief emphasis pulse. | Keyword, icon, feature point. | Repeated every word. | Use sparingly. |
| `elastic_bounce` | Playful spring/bounce. | Youth/social/playful content. | Luxury, serious, corporate proof. | Tone justification required. |
| `snap` | Fast decisive move. | Social, CTA, UI focus. | Emotional or quiet moments. | Can feel harsh. |
| `count_up` | Number animates upward. | Verified metrics. | Unverified data or fake precision. | Source safety required. |
| `stagger` | Items reveal one after another. | Lists, cards, steps. | Too many items. | Protect read time. |
| `cascade` | Related stagger in wave/sequence. | Card stacks, social proof. | Serious proof or dense text. | Avoid overuse. |
| `reveal_build` | Progressive construction. | Diagrams, frameworks, education. | Short duration. | Good for comprehension. |
| `hold_still` | Motion stops for reading. | Text, proof, charts. | When energy needs no stop. | Essential for read time. |
| `settle` | Motion eases into rest. | Premium cards, 3D/Real Motion support. | Jumpy social style if too slow. | Signals finish. |
| `drift` | Slow continuous movement. | Atmospheric layer. | Captions or proof cards. | Avoid motion sickness. |
| `shake_or_impact` | Impact hit or shake. | Rare emphasis, energetic ad. | Speech, proof, premium calm. | High tone risk. |
| `glitch_like` | Distortion-style movement. | Tech/problem moments. | Trust, proof, luxury, sensitive content. | Requires explicit reason. |
| `light_sweep` | Light passes across surface. | Premium CTA, product, logo. | Serious proof or overuse. | Keep subtle. |
| `screen_attached_motion` | Motion attached to browser/app screen. | Product UI highlight. | Invented UI or redaction risk. | Source status required. |
| `object_attached_motion` | Motion anchored to object. | Product feature callout. | Weak tracking/anchor. | May require tracking later. |

## Easing And Curve Intent Model

These are planning concepts, not animation curve implementation. Future workers/tools choose exact implementation. The planner should describe motion feel, not hard-code unsupported runtime behavior.

| Easing intent | Meaning | Best use cases | Avoid cases | Notes |
| --- | --- | --- | --- | --- |
| `linear` | Constant speed. | Data scans, progress, technical motion. | Premium organic motion. | Can feel mechanical. |
| `ease_in` | Starts slow, accelerates. | Exits, build-up. | Readable entry that needs clarity. | Use carefully. |
| `ease_out` | Starts quicker, settles. | Reveals, labels, cards. | Hard impact moments. | Common polished choice. |
| `ease_in_out` | Smooth start and end. | Premium panels, spatial moves. | Fast social snaps. | Balanced feel. |
| `soft_settle` | Gentle landing/rest. | Luxury, real estate, premium UI. | Energetic short-form. | Good for restraint. |
| `spring_like` | Natural spring motion. | Playful UI, light social. | Serious proof, luxury, compliance. | Avoid bounce overload. |
| `snap_like` | Fast and decisive. | Social CTA, UI focus. | Sensitive speech. | Readability risk. |
| `elastic_like` | Exaggerated playful bounce. | Rare playful brand moment. | Corporate, documentary, premium calm. | Tone justification required. |
| `cinematic_slow` | Slow, deliberate motion. | Property, documentary, hero reveal. | Fast tutorial steps. | Protect pacing. |
| `energetic_fast` | Quick, beat-aware motion. | Social, montage, ads. | Dense captions or speech. | Needs speech safety. |
| `stepped` | Discrete jumps/steps. | Step diagrams, process builds. | Smooth premium motion. | Good for education. |
| `beat_locked` | Motion tied to beat/cue. | Montage, social, title reveal. | Speech conflict. | SoundSync coordination later. |
| `custom_intent` | Human-described curve. | Brand-specific or unusual motion. | No clear description. | Must remain planning-only. |

## MotionTimingPlan Pseudo-Record

`MotionTimingPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `motion_start_seconds` | Required | Start time for motion. | `12.4` |
| `motion_end_seconds` | Required | End time for motion. | `15.2` |
| `duration_seconds` | Required | Total motion range. | `2.8` |
| `entry_duration_seconds` | Required | Entry/reveal duration. | `0.35` |
| `hold_duration_seconds` | Required | Stable hold/read duration. | `2.0` |
| `exit_duration_seconds` | Required | Exit duration. | `0.25` |
| `timing_anchor_type` | Required | Anchor type. | `transcript_phrase` |
| `transcript_anchor_text` | Optional | Spoken anchor. | `"here are the three steps"` |
| `transcript_anchor_id` | Optional | Transcript anchor reference. | `transcript_06_phrase_01` |
| `story_beat_anchor_id` | Optional | Story beat anchor. | `beat_framework_reveal` |
| `music_beat_anchor` | Optional | Music cue/beat. | `downbeat_16` |
| `sfx_anchor` | Optional | SFX cue relationship. | `soft_pop_after_phrase` |
| `transition_relationship` | Required | Relationship to transitions. | `motion clears before cut` |
| `caption_relationship_timing` | Required | Caption timing relationship. | `captions hold stable during reveal` |
| `graphic_relationship_timing` | Required when relevant | Graphic timing relationship. | `card enters first, bullets stagger after` |
| `pre_motion_buffer` | Optional | Lead-in buffer. | `0.2s` |
| `post_motion_buffer` | Optional | Tail buffer. | `0.3s` |
| `read_time_protection_seconds` | Required | Minimum stable read time. | `1.8` |
| `sync_precision_needed` | Required | Timing precision. | `phrase` |

## MotionBehaviorPlan Pseudo-Record

`MotionBehaviorPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `motion_role` | Required | Motion role. | `diagram_build` |
| `motion_subject` | Required | What moves. | `three step cards and arrows` |
| `motion_language` | Required | Motion language. | `stagger, draw_on, settle` |
| `motion_energy` | Required | Energy level. | `balanced` |
| `easing_intent` | Required | Easing feel. | `ease_out` |
| `rhythm_pattern` | Required | Rhythm/staging pattern. | `one card per phrase` |
| `stagger_strategy` | Optional | Stagger behavior. | `150ms between labels` |
| `direction` | Optional | Direction of motion. | `left_to_right` |
| `motion_path` | Optional | Path or trajectory. | `arrow follows process flow` |
| `speed_intent` | Required | Speed feel. | `readable_medium` |
| `acceleration_intent` | Optional | Acceleration feel. | `soft_start_fast_settle` |
| `settle_behavior` | Required | How motion comes to rest. | `soft_settle_before_reading` |
| `repetition_limit` | Required | Repetition limit. | `use once in segment` |
| `loop_allowed` | Required | Whether looping is allowed. | `false` |
| `hold_behavior` | Required | Behavior during hold. | `hold_still_for_read_time` |
| `exit_behavior` | Required | Exit behavior. | `fade_after_caption` |
| `accessibility_notes` | Required | Accessibility/comfort notes. | `no flashing, no shake` |
| `readability_risk_notes` | Required | Readability risk notes. | `do not animate text during read hold` |

## MotionCompositionPlan Pseudo-Record

`MotionCompositionPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `screen_zone` | Required | Screen zone. | `right_third` |
| `safe_area_strategy` | Required | Safe-area plan. | `avoid face and lower captions` |
| `face_avoidance_required` | Required | Whether face avoidance is required. | `true` |
| `object_avoidance_required` | Required | Whether object/action avoidance is required. | `true` |
| `caption_collision_strategy` | Required | Caption safety plan. | `caption stays stable below motion` |
| `graphic_layout_relationship` | Required when relevant | Relationship to graphic layout. | `reveals side_card_layout from RP-SKILLS-05` |
| `overlay_composition_reference` | Required | Overlay/composite reference. | `overlay safe zone and layer order from RP-SKILLS-04` |
| `edge_treatment_reference` | Optional | Edge treatment reference. | `soft_edge on moving label` |
| `layer_order` | Required | Planned stacking. | `base_video, captions, moving_callout` |
| `foreground_background_relationship` | Required | Relationship to source footage. | `above base video, away from speaker` |
| `depth_relationship` | Required | Depth relationship. | `flat_foreground` |
| `tracking_required` | Required | Whether tracking is required. | `false` |
| `masking_required` | Required | Whether masking is required. | `false` |
| `occlusion_required` | Required | Whether occlusion is required. | `false` |
| `aspect_ratio_behavior` | Required | Aspect-ratio plan. | `9:16 moves to top_band` |
| `platform_ui_margin_strategy` | Required | Platform UI safety. | `avoid bottom controls on shorts` |

## MotionDesignSkillPlan Pseudo-Record

`MotionDesignSkillPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code. It includes universal fields by reference and adds motion-design-specific fields.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable motion plan identifier. | `motion_segment_06_diagram_build` |
| `project_id` | Required | Project that owns the plan. | `project_training_video` |
| `edit_plan_id` | Required | Edit plan containing the motion. | `edit_plan_v4` |
| `edit_plan_segment_id` | Required | Segment where motion is planned. | `segment_06` |
| `skill_key` | Required | Skill key. | `motion_design_overlay` |
| `motion_role` | Required | Motion role. | `diagram_build` |
| `motion_subject` | Required | What moves. | `framework cards and arrows` |
| `motion_purpose` | Required | What the motion improves. | `Builds the framework in the order spoken.` |
| `planning_reason` | Required | Editorial reason. | `The speaker lists steps quickly, so sequential motion improves comprehension.` |
| `restraint_decision` | Required | Universal restraint decision. | `use_full` |
| `motion_energy` | Required | Motion energy. | `balanced` |
| `motion_language` | Required | Motion language. | `stagger, draw_on, settle` |
| `easing_intent` | Required | Easing intent. | `ease_out` |
| `rhythm_pattern` | Required | Rhythm pattern. | `one element per phrase` |
| `timing_anchor_type` | Required | Timing anchor type. | `transcript_phrase` |
| `motion_start_seconds` | Required | Start time. | `24.1` |
| `motion_end_seconds` | Required | End time. | `27.4` |
| `entry_duration_seconds` | Required | Entry duration. | `0.4` |
| `hold_duration_seconds` | Required | Hold duration. | `2.4` |
| `exit_duration_seconds` | Required | Exit duration. | `0.3` |
| `screen_zone` | Required | Screen zone. | `center_safe` |
| `safe_area_strategy` | Required | Safe-area plan. | `avoid face and bottom captions` |
| `caption_relationship` | Required | Caption relationship. | `captions remain stable during motion` |
| `graphic_relationship` | Required when relevant | Graphic relationship. | `reveals GraphicDesignStructurePlan steps` |
| `overlay_composition_plan_id` | Optional | Future overlay composition reference. | `overlay_comp_segment_06` |
| `transition_relationship` | Required | Transition relationship. | `motion exits before next cut` |
| `audio_relationship_summary` | Required when relevant | Audio/SFX/music relationship. | `optional soft click after speech phrase` |
| `repetition_limit` | Required | Repetition guard. | `do not repeat this reveal in next segment` |
| `accessibility_notes` | Required | Comfort/readability notes. | `no flashing or shake; hold still for reading` |
| `credit_impact` | Required | Credit impact. | `medium` |
| `approval_required` | Required | Whether approval is required. | `false` |
| `qa_checks` | Required | QA checks. | `readability, speech_safe, no_repetition` |
| `revision_options` | Required | Safe revision choices. | `slow down, reduce stagger, make static` |
| `worker_notes` | Optional | Future worker-safe notes. | `Use approved plan by ID; no prompt-only execution.` |
| `must_follow_rules` | Required | Non-negotiable constraints. | `Do not cover captions or animate during key phrase.` |
| `avoid_rules` | Required | Things to avoid. | `Avoid bounce, shake, and copied reference timing.` |
| `status` | Required | Planning status. | `selected` |
| `metadata_json` | Optional | Documentation-only placeholder. | `{ "source": "docs-only example" }` |

## Motion Scoring Model

Future planners should score motion design candidates before selecting or rejecting them.

Positive signals:

- Motion improves hierarchy.
- Motion supports story or emotion.
- Motion helps comprehension.
- Motion creates justified wow moment.
- Motion matches edit preference.
- Motion matches workflow/platform.
- Motion can be timed to speech/music/story beat.
- Safe screen space exists.
- Motion can coexist with captions and speaker.
- Reference DNA suggests motion language without copying.
- Motion variation avoids repetition.

Negative signals:

- User requested minimal/no extra visuals.
- Motion distracts from speech.
- Motion hurts caption readability.
- Face/product/action collision.
- Repeated motion pattern.
- Tone mismatch.
- Motion feels template-like.
- Source/proof graphic should stay stable.
- Accessibility/comfort risk.
- Unsupported tracking/masking/runtime.
- Credit budget too low.
- Motion is decoration only.

Pseudo formula:

```text
motion_design_score =
  meaning_support
+ hierarchy_gain
+ rhythm_fit
+ user_preference_fit
+ workflow_fit
+ platform_fit
+ wow_potential
+ novelty_score
- speech_distraction_risk
- readability_risk
- collision_risk
- repetition_penalty
- tone_mismatch
- accessibility_risk
- credit_penalty
- feasibility_risk
```

A high score does not bypass approval, credit, QA, source safety, or StoryTiming.

## Relationship To Edit Preference

Direct user instruction overrides defaults.

| Edit preference | Motion design guidance |
| --- | --- |
| No extra visuals | Avoid motion except clean micro-polish if necessary. |
| Keep visuals minimal | Subtle fades/slides only where useful. |
| Balanced visual mix | Controlled motion for key graphics/overlays. |
| More graphic design | Motion can reveal cards/diagrams clearly. |
| More Stroke Motion | Motion design should support, not compete with, Stroke Motion. |
| Real Motion if useful | Motion design can support Real Motion entry/exit but should avoid clutter. |
| Premium/luxury | Soft, spatial, restrained motion. |
| Energetic/social | Stronger beat-aware motion where readability stays high. |
| Educational | Sequential, readable builds. |
| Corporate | Clean, confident, not gimmicky. |
| Cinematic | Slow, motivated, atmosphere-aware motion. |

## Relationship To Workflow Context

| Workflow context | Likely motion behavior | Avoid behavior | Notes |
| --- | --- | --- | --- |
| Simple Clean Edit | None or invisible fade polish. | Bouncy reveals and moving cards. | Clean can be premium. |
| Social Short / Viral Clip | Energetic but readable beats and keyword motion. | Motion every word by default. | Speech and captions still win. |
| Talking Head / Personal Brand | Subtle lower-third/card reveals. | Movement over face/expression. | Preserve trust. |
| Podcast Clip | Quote/card/PIP entrance with stable holds. | Constant visual motion. | Rhythm comes from speech. |
| Vlog / Lifestyle | Natural labels, soft PIP/B-roll motion. | Corporate diagram builds. | Keep authenticity. |
| Product Demo | UI highlight, feature card reveal, focus motion. | Invented screen behavior. | Source status required. |
| Real Estate / Property Tour | Soft feature label reveal, slow push, ambient motion. | Fast social energy. | Spatial calm matters. |
| Education / Explainer | Step reveals, diagram builds, readable sequencing. | Rushed labels. | Comprehension wins. |
| Marketing Ad | Offer/proof/CTA motion with beat-aware timing. | Unsupported claims or unreadable speed. | Approval for premium/generated motion. |
| Testimonial / Case Study | Subtle quote/proof reveal, restrained accents. | Hiding emotion or sensational motion. | Authenticity matters. |
| Custom / Let AI Decide | Score against story, preference, platform, source, and budget. | Defaulting to movement without reason. | Explain the motion plan. |

## Relationship To Other Skills

Motion design coordinates with:

- Transitions: transition timing and edge behavior belong to RP-SKILLS-03.
- Overlays/compositing: moving layers must follow screen, collision, edge, layer, and source safety from RP-SKILLS-04.
- Graphic design: motion should reveal hierarchy from RP-SKILLS-05 without harming readability.
- Captions: caption animation details belong to RP-SKILLS-09.
- B-roll: B-roll inset/PIP movement belongs to RP-SKILLS-08 for full source planning.
- 3D visuals: 3D role, camera, lighting, depth, and material belong to RP-SKILLS-07.
- Stroke Motion: motion design supports but should not compete with stroke storytelling.
- Real Motion: entry/settle support should stay face-safe and approval-gated.
- Browser/app visuals: motion must not imply wrong source confidence or invented UI.
- SoundSync/music/SFX: beat/SFX support should avoid speech.
- StoryTiming: full timing authority, conflict graph, and render handoff belong to RP-SKILLS-11.

Conflict examples:

- Motion makes captions unreadable.
- Graphic animation competes with 3D hero object.
- Too much movement over speaker face.
- Motion reveals proof card too quickly to read.
- SFX hit under key speech.
- Repeated animation reduces premium feel.
- Browser/app highlight motion implies wrong source confidence.
- Transition motion collides with overlay entry.
- Stroke Motion and graphic motion both compete for attention.

## Motion Accessibility And Comfort

Motion accessibility and comfort planning should consider:

- Avoid excessive flashing.
- Avoid unnecessary shake.
- Avoid rapid repetitive motion.
- Preserve readability.
- Avoid too much simultaneous motion.
- Respect serious/sensitive content.
- Avoid motion that causes discomfort on short-form/mobile.
- Allow reduced-motion alternative later.
- Use warning/blocking QA when motion is too intense.

This is planning guidance, not runtime accessibility implementation.

## Motion Repetition And Novelty

Rules:

- Do not use the same reveal on every graphic.
- Do not use the same motion path across unrelated moments.
- Do not repeat hero motion unless intentionally part of a design system.
- Vary motion energy by story importance.
- Save the strongest motion for the strongest moment.
- Repeated motion can be used as a deliberate brand pattern only if planned.

Repetition states:

| State | Meaning |
| --- | --- |
| `first_use` | First use of this motion pattern in the edit. |
| `repeated_intentionally` | Repetition is a planned system or brand pattern. |
| `repeated_unintentionally` | Repetition occurred without a clear reason. |
| `overused` | Pattern is reducing quality or premium feel. |
| `avoid_this_pattern_next` | Next motion should use a different language/energy. |

## Credit And Approval Behavior

| Motion type | Typical credit behavior |
| --- | --- |
| No motion / invisible polish | `none` |
| Simple static-to-visible fade/slide | `low` |
| Simple graphic reveal | `low` |
| Staggered cards/labels | `low` / `medium` |
| Diagram build | `medium` |
| Chart/count-up animation | `medium` |
| Browser/app highlight motion | `medium` |
| Custom motion graphic sequence | `medium` / `high` |
| Stroke Motion support | `medium` |
| Real Motion support | `high` / `premium` |
| 3D entry/exit support | `high` / `premium` |
| Generated motion asset | `premium` |
| Tracking/masking/occlusion-heavy motion | `high` / `premium` |

Rules:

- Premium/generated motion must be itemized.
- Heavy motion requires estimate and approval.
- Optional heavy motion should have lower-cost alternatives.
- No generation before approval.
- If motion complexity increases tracking, masking, render, or provider cost, reflect that in the plan.

## Motion Design QA

Motion-design-specific QA checks:

- Motion has story/meaning reason.
- Motion supports hierarchy/comprehension.
- Motion timing feels natural.
- Motion does not distract from speech.
- Captions remain readable.
- Face/expression protected.
- Important object/action protected.
- Motion energy fits tone.
- Easing/motion language fits edit preference.
- Motion pattern not repeated mechanically.
- Read time protected.
- Audio/SFX relationship safe.
- Accessibility/comfort risk acceptable.
- Reference not copied.
- Credit/approval compliance.
- Motion does not feel generic/template-like.

Blocking examples:

- Premium generated motion without approval.
- Motion hides captions, face, product, or action.
- Rapid motion makes text unreadable.
- Loud SFX/motion hit under important speech.
- Motion contradicts user "clean/no effects" instruction.
- Animation implies unverified proof/source behavior.

Warning examples:

- Motion may be too energetic.
- Easing may feel too playful for premium tone.
- Motion pattern repeated too often.
- Read time may be slightly short.
- Graphic reveal may need slower timing.

## Revision Behavior

Safe revision options:

- Remove motion.
- Make motion subtler.
- Make motion smoother.
- Make motion more premium.
- Make motion more energetic.
- Slow down motion.
- Speed up motion.
- Change easing intent.
- Reduce stagger.
- Reduce bounce/shake.
- Replace motion with static graphic.
- Replace generated motion with simple fade.
- Move motion away from captions/face.
- Lower credit cost.
- Regenerate concept options later.

Revision requires a new credit estimate and approval when it adds premium generation, changes provider/tool dependency, increases credit impact, adds advanced motion/tracking/masking/compositing, changes approved timing materially, introduces new 3D/Real Motion/SFX/render work, or changes source/proof behavior. Revisions that simplify, remove, or reduce cost may still need plan snapshot updates, but do not imply execution without approval.

## Examples

### Example 1: Simple Clean Talking Head

| Field | Example |
| --- | --- |
| `skill_key` | `motion_design_overlay` |
| `motion_role` | `no_motion_design` or `invisible_motion_support` |
| `planning_reason` | The speaker's face and voice carry the moment; motion should not distract. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Optional 0.2s lower-third fade after first sentence only. |
| `motion_energy` | `none` / `invisible` |
| `motion_language` | `fade` or `hold_still` |
| `easing_intent` | `ease_out` |
| `composition_summary` | Lower-third safe zone, face-safe, captions stable. |
| `audio_relationship_summary` | No SFX; speech primary. |
| `credit_impact` | `none` |
| `approval_required` | `false` |
| `QA checks` | Speech safe, caption safe, no random movement. |

### Example 2: Premium Real Estate Feature Label

| Field | Example |
| --- | --- |
| `skill_key` | `motion_design_overlay` |
| `motion_role` | `subtle_reveal` |
| `planning_reason` | A soft feature label helps viewers notice custom millwork without breaking spatial calm. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Enter after feature phrase, hold 2 seconds, exit before room cut. |
| `motion_energy` | `subtle` |
| `motion_language` | `fade, soft_settle` |
| `easing_intent` | `soft_settle` |
| `composition_summary` | Upper right object-safe label, away from captions. |
| `audio_relationship_summary` | No SFX; music remains calm. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `QA checks` | Luxury restraint, product safe, caption safe, no repeated label motion. |

### Example 3: Product Feature Card Reveal

| Field | Example |
| --- | --- |
| `skill_key` | `motion_design_overlay` |
| `motion_role` | `graphic_card_reveal` |
| `planning_reason` | The feature card should enter on the spoken feature and then hold still for reading. |
| `restraint_decision` | `use_full` |
| `timing_summary` | Slide in after "auto reports"; hold 2.5 seconds; fade before next screen. |
| `motion_energy` | `restrained` |
| `motion_language` | `slide, settle, hold_still` |
| `easing_intent` | `ease_out` |
| `composition_summary` | Right third, source UI visible, captions lower safe. |
| `audio_relationship_summary` | Optional soft UI tick after phrase; no SFX under speech. |
| `credit_impact` | `low` |
| `approval_required` | `false` unless generated custom asset is proposed. |
| `QA checks` | Read time, source status, caption safe, speech safe. |

### Example 4: Education Diagram Build

| Field | Example |
| --- | --- |
| `skill_key` | `motion_design_overlay` |
| `motion_role` | `diagram_build` |
| `planning_reason` | The concept has three steps; sequential build follows the teaching order. |
| `restraint_decision` | `use_full` |
| `timing_summary` | One step appears per phrase; diagram holds 3 seconds after completion. |
| `motion_energy` | `balanced` |
| `motion_language` | `stagger, draw_on, reveal_build` |
| `easing_intent` | `stepped` |
| `composition_summary` | Center safe diagram, captions simplified during build. |
| `audio_relationship_summary` | No SFX required; optional quiet ticks after phrases only. |
| `credit_impact` | `medium` |
| `approval_required` | `false` for docs-only planning; `true` if generated assets later. |
| `QA checks` | Hierarchy, read time, caption safe, no random motion. |

### Example 5: Marketing Offer / Proof Motion

| Field | Example |
| --- | --- |
| `skill_key` | `motion_design_overlay` |
| `motion_role` | `hero_motion_moment` |
| `planning_reason` | The ad reaches the proof/offer beat; one beat-aware reveal can make the CTA land. |
| `restraint_decision` | `use_optional` |
| `timing_summary` | Reveal on downbeat after spoken proof; hold before CTA line. |
| `motion_energy` | `energetic` |
| `motion_language` | `snap, light_sweep, settle` |
| `easing_intent` | `beat_locked` |
| `composition_summary` | Full-frame takeover only during caption-light moment. |
| `audio_relationship_summary` | Soft hit after speech; avoid key words. |
| `credit_impact` | `medium` / `high` |
| `approval_required` | `true` if custom generated motion is proposed. |
| `QA checks` | Claim safety, speech safety, read time, approval. |

### Example 6: Browser/App Focus Motion

| Field | Example |
| --- | --- |
| `skill_key` | `motion_design_overlay` |
| `motion_role` | `browser_app_focus_motion` |
| `planning_reason` | The app demo needs a focus highlight on an existing source screen area. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Pulse after "click reports"; hold stable; clear before screen change. |
| `motion_energy` | `restrained` |
| `motion_language` | `pulse, screen_attached_motion, settle` |
| `easing_intent` | `ease_out` |
| `composition_summary` | Browser frame zone, redaction plan, captions below. |
| `audio_relationship_summary` | No SFX under speech. |
| `credit_impact` | `medium` |
| `approval_required` | `true` if source capture/generation is proposed. |
| `QA checks` | No invented UI, redaction, source status, caption safe. |

### Example 7: 3D Entry / Exit Support

| Field | Example |
| --- | --- |
| `skill_key` | `motion_design_overlay` |
| `motion_role` | `three_d_entry_exit_support` |
| `planning_reason` | A future 3D product object needs a planned entry and settle so it does not collide with captions. |
| `restraint_decision` | `use_optional` |
| `timing_summary` | Enter after product phrase, settle for 2 seconds, exit before speaker close-up. |
| `motion_energy` | `hero` |
| `motion_language` | `depth_push, light_sweep, settle` |
| `easing_intent` | `cinematic_slow` |
| `composition_summary` | Right third, face-safe, caption density reduced. |
| `audio_relationship_summary` | Music swell after phrase; no hit under speech. |
| `credit_impact` | `high` / `premium` |
| `approval_required` | `true` |
| `QA checks` | 3D handoff to RP-SKILLS-07, caption safe, approval, no unsupported runtime. |

### Example 8: Rejected Emotional Pause Motion

| Field | Example |
| --- | --- |
| `skill_key` | `motion_design_overlay` |
| `motion_role` | `no_motion_design` |
| `planning_reason` | The speaker pauses after a personal line; stillness protects emotion better than movement. |
| `restraint_decision` | `do_not_use` |
| `timing_summary` | No motion during pause; resume normal captions after next phrase. |
| `motion_energy` | `none` |
| `motion_language` | `hold_still` |
| `easing_intent` | `custom_intent` |
| `composition_summary` | Preserve source frame and face. |
| `audio_relationship_summary` | Preserve silence/room tone; no SFX. |
| `credit_impact` | `none` |
| `approval_required` | `false` |
| `QA checks` | Emotional restraint, no random motion, speech safe. |

## Anti-Patterns

Avoid these motion design planning failures:

- Motion name only.
- Motion everywhere.
- Same reveal repeated mechanically.
- Bounce/shake/glitch without tone reason.
- Motion hides face/expression.
- Motion hides product/action.
- Motion makes captions unreadable.
- Motion too fast for read time.
- Motion chosen before creative concept.
- Motion ignores user preference.
- Motion fights music/speech.
- Motion turns premium edit into template pack.
- 3D motion without role/placement.
- Browser/app motion implies invented screen behavior.
- Generated motion without credit estimate.
- Premium motion without approval.
- Reference motion copied exactly.
- Worker execution from raw prompt only.

## Future Implementation Notes

Possible future records/tables/types:

- `motion_design_plans`
- `motion_timing_plans`
- `motion_behavior_plans`
- `motion_composition_plans`
- `motion_qa_requirements`
- `edit_plan_skill_routes` with `skill_key = motion_design_overlay` or related skill keys
- `overlay_compositing_plans`
- `graphic_design_plans`
- `storytiming_coordination_records`

This document does not create those records now. Future schema/types must avoid duplicating this document's source truth. Future 3D, B-roll, caption, SoundSync, and StoryTiming contracts should reference this motion design contract when motion behavior is needed. Runtime animation implementation remains future gated work.

## Duplicate And Overlap Notes

Existing motion-design-adjacent ownership already appears in:

- `src/lib/professional-editing-ontology.ts`
- `src/lib/timing-presets.ts`
- `src/lib/style-modes.ts`
- `src/lib/map-animation-planner.ts`
- `src/lib/dataviz-planner.ts`
- `src/lib/render-strategy-planner.ts`
- `src/lib/prompt-builders.ts`
- `src/lib/provider-router.ts`
- `src/lib/mock-planner.ts`
- `src/lib/planner-validation.ts`
- `src/types/reeditpro.ts`
- `src/types/storytiming.ts`
- `src/types/generation.ts`
- `docs/storytiming-planner-service.md`
- `docs/storytiming-render-manifest-plan.md`
- `docs/storytiming-qa-plan.md`
- `docs/sfx-director-service.md`
- `docs/sfx-timing-trim-alignment.md`
- `docs/music-sfx-timing-integration.md`
- `docs/production-remotion-render-execution-policy.md`
- `docs/tool-calling/studies/remotion.json`
- `docs/creative-skills/transition-planning-contract.md`
- `docs/creative-skills/overlay-compositing-planning-contract.md`
- `docs/creative-skills/graphic-design-planning-contract.md`

This contract is the motion design planning doctrine and specialized field envelope. It must not create a parallel StoryTiming, SoundSync/SFX, render strategy, Remotion, provider prompt, map animation, data-viz animation, caption animation, transition, overlay/compositing, graphic design, tool registry, worker, QA, credit, or Supabase lane.

Requested browser-capture reading files are not present in this repo snapshot: `browser-app-capture-planning.md`, `browser-capture-settings-catalog.md`, and `src/lib/browser-capture-planner.ts`. Future browser/app motion work should reconcile that absence before claiming a browser capture planning contract exists.

## Next Prompt Handoff

Recommended next prompt:

`RP-SKILLS-07 - 3D Visual Planning Contract`

Scope:

Docs-only 3D visual planning contract that inherits the universal, overlay/compositing, graphic design, transition, and motion design contracts where relevant and defines 3D roles, object purpose, B-roll versus overlay behavior, screen interaction, camera angle, depth, scale, lighting, material, shadow/contact strategy, occlusion/masking/tracking, entry/exit motion, compositing notes, credit/approval behavior, and 3D QA.
