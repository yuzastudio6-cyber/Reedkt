# Overlay and Compositing Planning Contract

## Purpose

This document defines the overlay/compositing-specific planning contract for future ReeditPro visual skills.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, package changes, Supabase connections, SQL, credentials, browser/WebGL/canvas runtime, Playwright execution, AI calls, or app behavior.

This contract inherits from [skill-planning-contracts.md](skill-planning-contracts.md). It references transition edge behavior from [transition-planning-contract.md](transition-planning-contract.md) where transition and overlay behavior intersect.

This document defines overlay/compositing-specific fields and rules that future docs, types, schema, workers, and QA systems must follow when overlay work is eventually implemented.

## Overlay And Compositing Doctrine

Overlays are not random decoration.

Overlays should support meaning, story, proof, comprehension, emotion, spatial context, product clarity, or visual wow moments. They must be planned against the actual frame, not just the transcript or a skill name.

Overlays must respect faces, captions, important objects, source/UI status, aspect ratio, visual density, platform margins, user edit preference, and credit posture. A premium edit can be visually rich, but richness must be earned and controlled. The best overlay sometimes is no overlay.

Core principle:

"Every overlay must know why it exists, where it lives, how it enters and exits, how it blends with the footage, what it must avoid, and how it will be QA'd."

## Universal Contract Inheritance

Every `OverlayCompositingSkillPlan` inherits the universal skill planning envelope:

- `planning_reason`
- `restraint_decision`
- Timing envelope.
- Composition envelope.
- Audio relationship envelope where relevant.
- Tool strategy envelope.
- Credit/approval envelope.
- QA envelope.
- Revision envelope.

The overlay/compositing contract adds:

- Overlay role.
- Screen zone.
- Safe area strategy.
- Face/object/caption collision planning.
- Edge treatment.
- Blend/composite behavior.
- Opacity.
- Shadow, glow, reflection, and contact notes.
- Masking, tracking, and occlusion notes.
- Depth and foreground/background relationship.
- Layer order.
- Aspect ratio behavior.
- Source status for browser/app or evidence-like overlays.
- Overlay-specific QA.

Do not duplicate the full universal contract fields except when referencing inheritance. This document is the specialized overlay/compositing layer over the universal plan.

## Overlay Roles

These roles are planning guidance, not hard-coded execution.

| Role | What it is | Best use cases | Avoid cases | Typical credit impact | Notes |
| --- | --- | --- | --- | --- | --- |
| `caption_overlay` | Timed readable speech or text layer. | Speech comprehension, social readability, accessibility. | Covering faces, product, proof, or other overlays. | `none` / `low` | Caption contract later owns exact caption behavior. |
| `lower_third` | Speaker name, title, role, or context band. | Interviews, personal brand, testimonial context. | Dense lower captions or emotional close-ups. | `none` / `low` | Must not fight captions. |
| `title_or_chapter_card` | Full or partial title/chapter visual. | Education, podcast, webinar, section breaks. | Fast proof moments or overuse. | `low` | Can also relate to transitions. |
| `graphic_design_card` | Designed card with text, layout, image, or shape. | Explanations, offers, proof, summaries. | Exact source proof without verified data. | `low` / `medium` | Full graphic design contract belongs to RP-SKILLS-05. |
| `callout_label` | Small label anchored to a point or object. | Product features, property details, tutorial hints. | Covering the thing it explains. | `low` | Needs anchor and collision plan. |
| `data_chart_overlay` | Chart, metric, comparison, or graph layer. | Proof, business case, education. | Unverified numbers or cramped captions. | `low` / `medium` | Exact data should use controlled sources/tools. |
| `browser_app_frame` | Browser, app, device, or screen frame. | Product demos, SaaS, tutorials. | Invented exact UI, private pages, unclear source. | `low` / `medium` | Requires source status and redaction planning. |
| `ui_panel_overlay` | UI-style panel, drawer, modal, or control card. | Explainers, product flows, dashboards. | Organic footage where UI language feels forced. | `low` / `medium` | Hard edges often fit. |
| `product_feature_overlay` | Visual highlight of a product capability or part. | Product demos, marketing, tutorials. | Hiding product action or unsupported claim. | `low` / `medium` | Source truth and feature wording matter. |
| `b_roll_inset` | Smaller B-roll window over base footage. | Talking head plus proof, podcast clips, demos. | Tiny unreadable inserts or face coverage. | `low` / `medium` | B-roll contract later owns source/generated choice. |
| `picture_in_picture` | One video or visual stream inside another. | Interviews, reaction, product walkthrough. | Caption conflict or too many simultaneous layers. | `low` / `medium` | Needs aspect-ratio and layer order plan. |
| `stroke_motion_layer` | Transparent story-drawing layer. | Spoken story meaning, source reading, conceptual emphasis. | Random doodles or weak story reason. | `medium` | Must follow Stroke Motion source truth. |
| `real_motion_overlay` | Realistic moving object/place/proof overlay. | Premium product, property, symbolic visual moment. | Face risk, unclear source, low budget. | `high` / `premium` | Real Motion stays overlay-first and face-safe. |
| `three_d_object_overlay` | 3D object composited into the scene or layout. | Hero product, object explanation, premium reveal. | Minor sentence, no screen room, no approval. | `high` / `premium` | 3D contract later owns full 3D plan. |
| `three_d_screen_interaction_layer` | 3D object interacting with screen/app/frame. | SaaS/product hero moment, premium demo. | Invented UI or unsupported tracking. | `high` / `premium` | Requires source status and strong QA. |
| `motion_design_shape_layer` | Animated shape, line, wipe, or design object. | Branded energy, education hierarchy, social emphasis. | Decoration-only movement. | `low` / `medium` | Motion design contract later owns choreography. |
| `atmospheric_light_or_glow` | Light, flare, glow, mist, or subtle atmosphere. | Premium cinematic support, mood, hero beats. | Random glow or speech-heavy moments. | `low` / `medium` | Must be subtle unless hero intent is approved. |
| `texture_or_grade_support` | Texture, grain, finishing, or grade-support layer. | Cohesion, mood, premium finish. | Masking source truth or making content unreadable. | `low` | Finish support, not a new proof layer. |
| `object_highlight` | Highlight, ring, outline, pulse, or emphasis. | Product features, tutorials, UI guidance. | Hiding the object or repeating constantly. | `low` | Needs object anchor and timing. |
| `proof_or_evidence_card` | Claimed proof, testimonial, citation, result, or evidence visual. | Case studies, legal-ish proof, business proof. | Unverified facts, invented screenshots, sensitive data. | `low` / `medium` | Must use safe wording and source status. |
| `no_overlay` | Intentional absence of overlay. | Emotional pause, strong source visual, clean edit. | When clarity genuinely needs visual help. | `none` | A valid professional decision. |

## When To Use Overlays

Overlays are appropriate when:

- Speaker name, title, or context needs clarification.
- A key phrase or claim needs emphasis.
- A product feature needs explanation.
- Viewers need visual proof or context.
- Data or comparison needs visual structure.
- A screen/app/browser moment needs framing or highlighting.
- B-roll needs to coexist with a speaker.
- 3D or Real Motion can clarify a concrete object or hero moment.
- Stroke Motion can support story meaning.
- Education/explainer content needs hierarchy.
- Marketing/ad content needs proof, offer, CTA, or feature framing.
- A social short needs readable emphasis.
- A cinematic or premium edit needs subtle atmospheric support.
- The scene has safe visual space for an overlay.
- User edit preference supports overlays.

## When To Avoid Overlays

Overlays should be avoided or minimized when:

- The user asked for no extra visuals.
- An important face or expression would be covered.
- Captions would become unreadable or collide.
- Important product, object, or action would be covered.
- The visual is already strong and needs no extra layer.
- The overlay would feel like decoration.
- The same overlay pattern repeats too often.
- The overlay would make a premium edit feel amateur.
- A serious or emotional pause needs restraint.
- Source status is unclear and the overlay may imply false proof.
- Credit budget does not justify premium overlay or generation.
- Platform/aspect ratio leaves no safe room.
- The overlay conflicts with a transition or other active skill.
- The overlay needs tracking/masking that is not approved or ready.

## Overlay Visual Density Model

Visual density is not the same as quality. Basic/professional edits can be clean. Premium/wow edits can be rich, but richness must be intentional.

| Density | Meaning | When to use | Risk if overused | Example |
| --- | --- | --- | --- | --- |
| `none` | No overlay beyond base footage. | Emotional close-up, strong source visual, clean instruction. | Can miss needed clarity. | Preserve an emotional close-up. |
| `minimal` | One small support layer. | Lower third, simple callout, brief label. | Can feel under-explained if the viewer needs proof. | Clean lower third only. |
| `restrained` | Premium but quiet support. | Luxury, property, testimonial, subtle product cue. | Can become repetitive. | Soft-edge room detail label. |
| `balanced` | Multiple useful layers with breathing room. | Education, demos, social clips. | Can crowd captions or speaker. | Education layout with labels and captions. |
| `rich` | Layered but justified visual system. | Product demo, proof sequence, high-value marketing. | Can feel busy or amateur. | UI, callouts, and B-roll inset around source screen. |
| `hero` | Overlay is the main visual moment. | 3D reveal, Real Motion, major proof/offer reveal. | Expensive and distracting if unearned. | 3D product reveal with caption reduction. |

## Screen Zone Model

A screen zone is planning metadata, not runtime layout code.

| Zone | Meaning | Notes |
| --- | --- | --- |
| `full_frame` | Overlay occupies or transforms the whole frame. | Use only when it does not hide critical source truth. |
| `center_safe` | Center area with face/object/caption safety checked. | Useful for cards or hero moments. |
| `upper_left` | Upper-left quadrant. | Watch platform UI and face line. |
| `upper_right` | Upper-right quadrant. | Common for small labels or proof. |
| `lower_left` | Lower-left quadrant. | Often conflicts with lower-third/captions. |
| `lower_right` | Lower-right quadrant. | Often conflicts with platform UI. |
| `left_third` | Left vertical third. | Useful when speaker is framed right. |
| `right_third` | Right vertical third. | Useful when speaker is framed left. |
| `top_band` | Top horizontal band. | Avoid platform UI and headroom issues. |
| `bottom_band` | Bottom horizontal band. | Captions usually take priority. |
| `side_panel` | Persistent side layout. | Good for demos and education. |
| `lower_third_zone` | Name/title/context zone. | Must coordinate with captions. |
| `background_zone` | Behind subject or behind source content. | May require mask/depth readiness. |
| `foreground_zone` | In front of base video. | Must protect faces and captions. |
| `picture_in_picture_zone` | Inset video/card zone. | Requires stable dimensions. |
| `browser_frame_zone` | Browser/app frame placement area. | Requires source status. |
| `object_anchor_zone` | Zone anchored to an object or feature. | Requires object avoidance/anchor confidence. |
| `custom_zone` | Custom planned zone. | Must explain why defaults do not fit. |

Safe zones must consider aspect ratio. Speaker faces and important objects may override default zones. Caption zone and overlay zone must not collide.

## Safe Area And Collision Model

Overlay planning should name the relevant safe and collision areas:

| Concept | Meaning |
| --- | --- |
| `face_safe_region` | Region that preserves the speaker's face. |
| `face_avoid_zone` | Area overlays should not enter. |
| `eye_line_protection` | Protects eyes and expression. |
| `mouth_region_protection` | Protects speech readability and emotion. |
| `hand_gesture_protection` | Protects meaningful gestures. |
| `important_object_zone` | Protects objects carrying meaning. |
| `product_zone` | Protects product visibility or use. |
| `action_zone` | Protects meaningful motion/action. |
| `caption_safe_zone` | Caption placement/readability area. |
| `caption_collision_zone` | Area where overlay and captions would conflict. |
| `UI/source_content_zone` | Source UI, screen, map, chart, or proof area. |
| `brand/logo_safe_zone` | Area preserving logos or brand marks. |
| `edge_margin` | Frame edge safety. |
| `platform_ui_margin` | TikTok/Reels/Shorts/player UI margin. |
| `redaction_zone` | Sensitive or private area needing concealment. |

Face safety is not only about avoiding the whole face; eyes, mouth, expressions, and gestures may matter. Product/action zones should be preserved when they carry meaning. Caption collision planning is required when overlays share the same time range. Browser/app/source overlays may need redaction and source-status planning.

## Edge Treatment Model

Transition edge behavior lives in RP-SKILLS-03. This document owns persistent overlay/compositing edge behavior.

| Edge treatment | Meaning | Best use cases | Avoid cases | Notes |
| --- | --- | --- | --- | --- |
| `hard_edge` | Crisp boundary. | UI cards, browser frames, comparison layouts. | Cinematic integration that needs blending. | Clean and intentional. |
| `soft_edge` | Gentle blended boundary. | Premium labels, atmospheric overlays. | Exact UI/card systems. | Helps restraint. |
| `feathered_edge` | Mask falloff at boundary. | Light, map, background, depth overlays. | Text-heavy panels. | Needs QA for fuzziness. |
| `masked_edge` | Subject/object/matte defines edge. | Behind-subject or object-aware overlays. | Weak mask confidence. | Future worker readiness matters. |
| `motion_blur_edge` | Blur supports movement. | Moving overlays or fast entrance. | Static proof cards. | Motion design owns detailed choreography later. |
| `light_wrap_edge` | Light wraps around object/subject. | 3D, Real Motion, cinematic composite. | Clean UI panels. | Credit/QA heavier. |
| `glow_edge` | Glow defines edge or emphasis. | Premium hero, neon/social style. | Serious proof or overuse. | Avoid random glow. |
| `shadow_edge` | Drop or cast shadow defines depth. | Cards, UI panels, object grounding. | Flat design that should stay crisp. | Must not reduce readability. |
| `contact_shadow_edge` | Shadow grounds object to surface. | Real Motion or 3D object. | No visible surface or wrong lighting. | Important for realism. |
| `reflection_edge` | Reflection grounds glass/metal/screen. | Luxury, product, 3D hero. | Unmotivated reflection. | Needs lighting match. |
| `glass_panel_edge` | Frosted/translucent panel boundary. | Premium panels, SaaS, luxury. | Busy footage or weak contrast. | Readability wins. |
| `browser_frame_edge` | Browser/app/device chrome edge. | Product demos, tutorials. | Invented exact source content. | Source status required. |
| `cutout_edge` | Isolated object/subject boundary. | Product cutouts, object highlights. | Low-quality cutout or halo. | Mask QA required. |
| `object_occlusion_edge` | Object passes in front/behind source. | 3D/Real Motion/depth interactions. | No tracking/occlusion approval. | Heavy QA and approval. |
| `no_visible_edge` | Overlay has no explicit boundary. | Atmospheric, grade, texture support. | Cards or proof needing clarity. | Still needs reason. |

Hard edges fit UI cards, browser frames, graphic panels, comparison layouts, and intentional design systems. Soft, feathered, and light-wrap edges fit cinematic overlays, Real Motion, 3D integration, atmospheric layers, and premium subtle composites. Edge treatment must be planned before execution.

## Blend, Opacity, And Material Model

These are planning concepts, not exact renderer names or runtime implementations.

| Concept | Intent |
| --- | --- |
| `normal_composite` | Standard layer above or below base video. |
| `multiply_like` | Darkening or ink-like integration. |
| `screen_like` | Lightening or bright-screen integration. |
| `additive_glow_like` | Light/glow contribution. |
| `soft_light_like` | Subtle contrast/grade integration. |
| `glassmorphism_panel` | Translucent blurred premium panel. |
| `matte_panel` | Non-reflective graphic panel. |
| `solid_panel` | Opaque card or block. |
| `translucent_panel` | Partly transparent readable panel. |
| `shadowed_object` | Object needs cast/drop shadow. |
| `contact_shadow` | Object needs grounding contact. |
| `reflection` | Object/surface needs reflection. |
| `blur_backdrop` | Background behind panel should soften. |
| `depth_of_field_hint` | Slight focus/depth guidance. |
| `grain_match` | Overlay should match source texture. |
| `color_match` | Overlay should fit source palette. |
| `lighting_match` | Overlay should fit source direction/intensity. |

Workers later choose exact implementation based on approved tool/runtime readiness. The planner should describe intent, not force unsupported runtime behavior.

## Tracking, Masking, Depth, And Occlusion Model

Overlay planning should declare:

| Concept | Meaning |
| --- | --- |
| `tracking_required` | Overlay must follow camera, screen, object, or face movement. |
| `tracking_target` | The target to track. |
| `tracking_confidence` | Planning estimate or future readiness requirement. |
| `masking_required` | Mask is required to preserve foreground/background. |
| `mask_type` | Subject, object, screen, product, matte, or redaction mask. |
| `occlusion_required` | Overlay must pass behind/in front of real elements. |
| `foreground_subject_protection` | Subject stays readable and protected. |
| `behind_subject_layer` | Overlay belongs behind foreground subject. |
| `in_front_of_subject_layer` | Overlay belongs in front, with safety constraints. |
| `attached_to_screen` | Overlay must align to a screen/app surface. |
| `attached_to_object` | Overlay must align to a product/object. |
| `camera_motion_sensitive` | Camera motion affects feasibility. |
| `depth_relation` | Flat, layered, behind, in front, attached, or spatial. |
| `parallax_needed` | Parallax would improve realism. |
| `manual_review_required` | Human/QA review is required before execution/export. |

Tracking, masking, and occlusion can make overlays premium, but they increase complexity, QA risk, credit impact, and approval burden. If tracking is unavailable or not approved, the plan should choose a simpler overlay.

## Layer Order Model

Possible planned layers:

| Layer | Planning notes |
| --- | --- |
| `base_video` | Source footage remains the base truth. |
| `cleaned_audio_reference` | Audio reference for speech and sync, not a visual layer. |
| `b_roll_full_frame_or_inset` | B-roll may replace or sit over base video. |
| `browser_app_capture_frame` | Browser/app capture frame, with source status. |
| `captions` | Usually readable above or away from visual layers. |
| `lower_thirds` | Coordinate with caption zone. |
| `graphic_panels` | Cards, proof, charts, labels, comparisons. |
| `stroke_motion_transparent_layer` | Transparent story layer. |
| `real_motion_overlay` | Realistic object/place/proof overlay. |
| `three_d_overlay` | 3D object or screen interaction. |
| `atmospheric_effects` | Light, glow, texture, grade support. |
| `transition_layer` | Transition-specific layer owned by RP-SKILLS-03. |
| `color_finish_support` | Finish/grade support. |
| `export_safe_frame_guides` | Planning/QA guides, not final visible output. |

Layer order should be planned to avoid collisions. Some hero visual moments may temporarily reduce or reposition captions. StoryTiming coordination later resolves conflicts across active skills.

## OverlayTimingPlan Pseudo-Record

`OverlayTimingPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `overlay_start_seconds` | Required | Start time for the overlay. | `12.4` |
| `overlay_end_seconds` | Required | End time for the overlay. | `15.1` |
| `duration_seconds` | Required | Planned duration. | `2.7` |
| `entry_timing` | Required | How the overlay enters. | `after_key_phrase` |
| `hold_timing` | Required | How long it remains useful/readable. | `hold_through_feature_phrase` |
| `exit_timing` | Required | How it leaves. | `exit_before_cut` |
| `transcript_anchor_text` | Optional | Spoken phrase anchoring timing. | `"three bedrooms with lake views"` |
| `transcript_anchor_id` | Optional | Transcript anchor reference. | `transcript_04_phrase_02` |
| `story_beat_anchor_id` | Optional | Story beat anchor. | `beat_property_feature` |
| `music_beat_anchor` | Optional | Beat/cue anchor if relevant. | `downbeat_12` |
| `transition_relationship` | Required | Relationship to transition timing. | `clear_before_transition_starts` |
| `caption_relationship_timing` | Required | Timing relationship to captions. | `caption_holds_below_overlay` |
| `pre_entry_buffer` | Optional | Buffer before entry. | `0.2s` |
| `post_exit_buffer` | Optional | Buffer after exit. | `0.3s` |
| `sync_precision_needed` | Required | Needed precision. | `phrase` |

## OverlayCompositionPlan Pseudo-Record

`OverlayCompositionPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `overlay_role` | Required | Planned overlay role. | `callout_label` |
| `screen_zone` | Required | Planned placement zone. | `upper_right` |
| `safe_area_strategy` | Required | How the overlay stays safe. | `avoid face and caption zones` |
| `face_avoidance_required` | Required | Whether face avoidance is required. | `true` |
| `face_safe_region_notes` | Optional | Face-safety notes. | `protect eyes and mouth during testimonial` |
| `object_avoidance_required` | Required | Whether object avoidance is required. | `true` |
| `important_object_notes` | Optional | Object/action notes. | `do not cover product demo hand movement` |
| `caption_collision_strategy` | Required | How captions remain readable. | `move callout to right third above captions` |
| `platform_ui_margin_strategy` | Required | Platform UI safety. | `vertical: keep outside bottom app controls` |
| `edge_treatment` | Required | Planned edge behavior. | `soft_edge` |
| `blend_or_composite_intent` | Required | Blend/composite intent. | `normal_composite with color_match` |
| `opacity_intent` | Optional | Opacity guidance. | `85 percent panel opacity` |
| `shadow_or_contact_strategy` | Optional | Shadow/contact plan. | `subtle contact shadow` |
| `glow_or_light_strategy` | Optional | Glow/light plan. | `no glow` |
| `reflection_strategy` | Optional | Reflection plan. | `none` |
| `tracking_required` | Required | Whether tracking is required. | `false` |
| `masking_required` | Required | Whether masking is required. | `false` |
| `occlusion_required` | Required | Whether occlusion is required. | `false` |
| `depth_relationship` | Required | Depth relationship. | `foreground_panel` |
| `foreground_background_relationship` | Required | Layer relationship to footage. | `above base video, away from speaker` |
| `layer_order` | Required | Planned stacking. | `base_video, captions, callout_label` |
| `aspect_ratio_behavior` | Required | Aspect ratio handling. | `9:16 uses top_band, 16:9 uses right_third` |
| `source_status_notes` | Required when relevant | Source/evidence notes. | `uploaded screenshot, redact email` |
| `manual_review_required` | Required | Whether manual QA review is required. | `true` |

## OverlayCompositingSkillPlan Pseudo-Record

`OverlayCompositingSkillPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, or runtime code. It includes universal fields by reference and adds overlay/compositing-specific fields.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable overlay plan identifier. | `overlay_segment_04_feature_callout` |
| `project_id` | Required | Project that owns the plan. | `project_product_demo` |
| `edit_plan_id` | Required | Edit plan containing the overlay. | `edit_plan_v4` |
| `edit_plan_segment_id` | Required | Segment where overlay is planned. | `segment_04` |
| `skill_key` | Required | Skill key. | `overlay_compositing` |
| `overlay_role` | Required | Overlay role. | `product_feature_overlay` |
| `overlay_purpose` | Required | What the overlay does. | `Clarifies the feature the speaker names.` |
| `planning_reason` | Required | Editorial reason. | `The product button is small, so a callout helps comprehension without covering the demo.` |
| `restraint_decision` | Required | Universal restraint decision. | `use_subtle` |
| `visual_density_level` | Required | Density level. | `restrained` |
| `overlay_start_seconds` | Required | Start time. | `22.1` |
| `overlay_end_seconds` | Required | End time. | `24.8` |
| `screen_zone` | Required | Placement zone. | `right_third` |
| `safe_area_strategy` | Required | Safety plan. | `avoid speaker face and bottom captions` |
| `face_avoidance_required` | Required | Whether face avoidance is required. | `true` |
| `object_avoidance_required` | Required | Whether object/action avoidance is required. | `true` |
| `caption_collision_strategy` | Required | Caption collision plan. | `caption stays lower center; callout stays upper right` |
| `edge_treatment` | Required | Edge treatment. | `soft_edge` |
| `blend_or_composite_intent` | Required | Blend/composite intent. | `normal_composite with color_match` |
| `opacity_intent` | Optional | Opacity guidance. | `90 percent card opacity` |
| `shadow_or_contact_strategy` | Optional | Shadow/contact plan. | `subtle shadow edge` |
| `tracking_required` | Required | Whether tracking is needed. | `false` |
| `masking_required` | Required | Whether masking is needed. | `false` |
| `occlusion_required` | Required | Whether occlusion is needed. | `false` |
| `depth_relationship` | Required | Depth relationship. | `flat_foreground` |
| `foreground_background_relationship` | Required | Relationship to footage. | `above base video, away from UI` |
| `layer_order` | Required | Stack order. | `base_video, captions, product_feature_overlay` |
| `aspect_ratio_behavior` | Required | Aspect behavior. | `adapt to 9:16 by moving to top_band` |
| `source_status_notes` | Required when relevant | Source/evidence notes. | `source is uploaded app capture; do not invent text` |
| `audio_relationship_summary` | Required when relevant | Music/SFX/speech relationship. | `optional soft tick after phrase; no SFX under speech` |
| `credit_impact` | Required | Credit impact. | `low` |
| `approval_required` | Required | Whether approval is required. | `false` |
| `qa_checks` | Required | Overlay QA checks. | `caption_safe, face_safe, source_status` |
| `revision_options` | Required | Safe revision choices. | `remove, move, soften edge, reduce opacity` |
| `worker_notes` | Optional | Future worker-safe notes. | `Use approved plan by ID; no prompt-only execution.` |
| `must_follow_rules` | Required | Non-negotiable constraints. | `Do not cover face, captions, or product action.` |
| `avoid_rules` | Required | Things to avoid. | `Avoid invented UI and random glow.` |
| `status` | Required | Planning status. | `selected` |
| `metadata_json` | Optional | Documentation-only placeholder. | `{ "source": "docs-only example" }` |

## Overlay Scoring Model

Future planners should score overlay candidates before selecting or rejecting them.

Positive signals:

- Spoken meaning needs visual clarity.
- Product/object/feature needs emphasis.
- Screen has safe negative space.
- User preference supports visual richness.
- Workflow context benefits from overlays.
- Reference DNA suggests overlay language without copying.
- Overlay improves comprehension.
- Overlay creates a justified wow moment.
- Overlay can coexist with captions and speaker.
- Overlay can be executed without heavy unsupported tracking.

Negative signals:

- User requested minimal/no visuals.
- Face/expression risk.
- Important object/action risk.
- Caption collision.
- Clutter risk.
- Repeated overlay pattern.
- Source/evidence ambiguity.
- Unsupported tracking/masking.
- Credit budget too low.
- Tone mismatch.
- Overlay would be decoration only.

Pseudo formula:

```text
overlay_score =
  meaning_support
+ screen_fit
+ user_preference_fit
+ workflow_fit
+ wow_potential
+ comprehension_gain
- face_risk
- object_risk
- caption_collision_risk
- clutter_risk
- repetition_penalty
- credit_penalty
- feasibility_risk
- source_status_risk
```

A high score does not bypass approval, credit, QA, or StoryTiming.

## Relationship To Edit Preference

Direct user instruction overrides defaults.

| Edit preference | Overlay guidance |
| --- | --- |
| No extra visuals | Avoid overlays except required captions/lower thirds or user-approved essentials. |
| Keep visuals minimal | Small, restrained overlays only where useful. |
| Balanced visual mix | Overlays can support key moments without taking over. |
| More graphic design | Stronger cards/callouts/layouts where they clarify. |
| More Stroke Motion | Allow transparent story layers where meaningful. |
| Real Motion if useful | Use overlay-first realistic motion only where it improves the segment. |
| Premium/luxury | Subtle, spacious, soft-edged, high-end overlays. |
| Energetic/social | Bolder overlays if readability and story support them. |
| Educational | Clear hierarchy, labels, diagrams, safe caption layout. |

## Relationship To Workflow Context

| Workflow context | Likely overlay behavior | Avoid behavior | Notes |
| --- | --- | --- | --- |
| Simple Clean Edit | No overlay, captions, or minimal lower third. | Decorative cards and generated layers. | Clean can be premium. |
| Social Short / Viral Clip | Readable emphasis, caption-safe labels, occasional bold cards. | Overlay every beat by default. | Platform UI margins matter. |
| Talking Head / Personal Brand | Lower thirds, proof insets, restrained callouts. | Covering expression or trust signals. | Speaker remains primary. |
| Podcast Clip | PIP, quote/proof cards, chapter labels. | Dense visuals under fast speech. | Rhythm comes from speech. |
| Vlog / Lifestyle | Light labels, soft location/product callouts. | Template-pack overlays. | Source ambience and natural footage matter. |
| Product Demo | Browser/app frames, product highlights, callouts. | Invented UI or covering demo action. | Source status must be clear. |
| Real Estate / Property Tour | Soft-edge room labels, feature callouts, atmosphere. | Fast flashy graphics. | Spatial coherence matters. |
| Education / Explainer | Hierarchy cards, labels, diagrams, comparisons. | Reducing comprehension with motion clutter. | Caption readability wins. |
| Marketing Ad | Proof, offer, CTA, feature cards. | Unsupported proof or overusing hero cards. | Approval/credit for premium visuals. |
| Testimonial / Case Study | Proof cards and restrained context. | Hiding emotion or implying unverified facts. | Authenticity matters. |
| Custom / Let AI Decide | Score against story, preference, platform, and budget. | Defaulting to a style without reason. | Explain the overlay plan. |

## Relationship To Other Skills

Overlay/compositing planning coordinates with:

- Captions: overlays must not hide captions or reduce readability.
- Transitions: persistent overlay edges live here; transition edge behavior lives in RP-SKILLS-03.
- B-roll: insets and PIP need source/source-truth and layer planning.
- Graphic design: cards, labels, diagrams, proof, and type hierarchy are detailed in RP-SKILLS-05.
- Motion design: animated shape motion and choreography belong to RP-SKILLS-06.
- 3D visuals: 3D role, camera, light, materials, and object specifics belong to RP-SKILLS-07.
- Stroke Motion: transparent story layers must follow Stroke Motion source truth.
- Real Motion: realistic overlays remain face-safe, credit-heavy, and approval-gated.
- Browser/app visuals: frames need source status and redaction planning.
- SoundSync/music/SFX: SFX may support overlay entry, but speech clarity wins.
- StoryTiming: full conflict graph and timing authority belong to RP-SKILLS-11.

Conflict examples:

- Overlay covers captions.
- Overlay covers speaker face or expression.
- Overlay covers product/action.
- Graphic panel conflicts with transition.
- 3D overlay needs screen space and caption reduction.
- Stroke Motion layer competes with graphic card.
- Browser/app overlay needs source status and redaction.
- SoundSync SFX supports overlay entrance but must avoid speech.
- Too many overlays reduce premium feel.

## Source Status, Browser/App, And Evidence Safety

Overlay planning must classify source/evidence-like visuals:

| Source status | Planning rule |
| --- | --- |
| `user_provided_source` | Use the provided source truth and preserve provenance. |
| `uploaded_screenshot` | Plan placement, redaction, and safe wording. |
| `authorized_browser_app_capture_later` | May be a future source, but this doc does not unlock capture. |
| `internal_mock` | Must be labeled/handled as mock, not proof. |
| `unknown_source` | Avoid proof claims or use safe wording. |
| `claimed_evidence` | Requires cautious wording and QA. |
| `redaction_needed` | Plan redaction zones before display. |
| `sensitive_data_risk` | Do not expose private details without a redaction plan. |
| `safe_wording_required` | Avoid absolute claims unless source truth supports them. |

Rules:

- Do not use AI video to invent exact website/app screenshots, UI labels, dashboards, metrics, pricing, or evidence pages.
- Browser/app overlays should use source status and redaction planning.
- Unknown or claimed evidence must use safe wording.
- This document does not unlock browser capture or Playwright execution.

Requested browser-capture reading files are not present in this repo snapshot: `browser-app-capture-planning.md`, `browser-capture-settings-catalog.md`, and `src/lib/browser-capture-planner.ts`. Future browser/app overlay work should reconcile that absence before claiming a browser capture contract exists.

## Credit And Approval Behavior

| Overlay type | Typical credit behavior |
| --- | --- |
| Simple caption/lower-third overlay | `none` / `low` |
| Static graphic card | `low` |
| Animated graphic overlay | `low` / `medium` |
| Browser/app frame with planning/redaction | `low` / `medium` |
| Stroke Motion transparent layer | `medium` |
| Real Motion overlay | `high` / `premium` |
| 3D overlay or 3D screen interaction | `high` / `premium` |
| Tracking/masking/occlusion-heavy overlay | `high` / `premium` |
| Custom generated overlay | `premium` |

Rules:

- Premium overlays must be itemized.
- Heavy generated overlays require estimate and approval.
- Optional heavy overlays should have lower-cost alternatives.
- No generation before approval.
- If tracking/masking/occlusion increases cost, it must be reflected in the plan.

## Overlay QA

Overlay-specific QA checks:

- Overlay has story/meaning reason.
- No random decoration.
- Visual density balanced.
- Screen zone fits frame.
- Safe area respected.
- Face/expression protected.
- Important object/action protected.
- Captions readable and not hidden.
- Edge treatment fits style.
- Blend/opacity/shadow not distracting.
- Tracking/masking/occlusion acceptable if planned.
- Layer order correct.
- Aspect ratio safe.
- Source/evidence status handled.
- Redaction handled where needed.
- User preference honored.
- Reference not copied shot-for-shot.
- Credit/approval compliance.

Blocking examples:

- Premium generated overlay without approval.
- Overlay covers face, captions, or important object.
- Browser/evidence overlay implies unverified facts.
- Sensitive data visible without redaction plan.
- Overlay contradicts user "no extra visuals" instruction.

Warning examples:

- Overlay may be slightly too dense.
- Edge treatment may need softening.
- Overlay pattern repeated too often.
- Shadow/opacity may need adjustment.

## Revision Behavior

Safe revision options:

- Remove overlay.
- Make overlay smaller.
- Move overlay to another safe zone.
- Soften edge.
- Change hard edge to soft edge.
- Reduce opacity.
- Remove glow/shadow.
- Simplify graphic.
- Replace 3D overlay with graphic card.
- Replace generated overlay with text/caption emphasis.
- Lower visual density.
- Make overlay more premium.
- Make overlay more playful.
- Keep overlay but delay timing.
- Reduce credit cost.

Revision requires a new credit estimate and approval when it adds premium generation, changes provider/tool dependency, increases credit impact, adds tracking/masking/occlusion, changes approved timing materially, or introduces new SFX/music/render work. Revisions that simplify, remove, or reduce cost may still need plan snapshot updates, but do not imply execution without approval.

## Examples

### Example 1: Simple Clean Talking Head

| Field | Example |
| --- | --- |
| `skill_key` | `overlay_compositing` |
| `overlay_role` | `no_overlay` or `lower_third` |
| `planning_reason` | The speaker's expression carries the moment; a minimal lower third is enough for context. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Lower third appears once after first sentence, then clears before dense captions. |
| `composition_summary` | Lower third zone, below face, away from captions. |
| `edge_treatment` | `hard_edge` with restrained panel or `no_visible_edge` if no overlay. |
| `audio_relationship_summary` | No SFX; speech stays primary. |
| `credit_impact` | `none` / `low` |
| `approval_required` | `false` |
| `QA checks` | Face safe, caption safe, no random decoration, user preference honored. |

### Example 2: Premium Real Estate Feature Callout

| Field | Example |
| --- | --- |
| `skill_key` | `overlay_compositing` |
| `overlay_role` | `callout_label` |
| `planning_reason` | The narrator mentions custom millwork while the camera pans; a restrained label helps viewers notice the feature. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Enter after phrase, hold 2 seconds, exit before room cut. |
| `composition_summary` | Upper right, object anchored, away from window lines and captions. |
| `edge_treatment` | `soft_edge` |
| `audio_relationship_summary` | No SFX; music bed remains calm. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `QA checks` | Object safe, spatial calm, caption safe, luxury restraint. |

### Example 3: Product Demo Browser/App Frame

| Field | Example |
| --- | --- |
| `skill_key` | `overlay_compositing` |
| `overlay_role` | `browser_app_frame` |
| `planning_reason` | The speaker moves from claim to app proof; a frame clarifies the source screen without inventing UI. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Frame appears after "inside the dashboard" and clears before next transition. |
| `composition_summary` | Browser frame zone with redaction notes; captions remain outside frame. |
| `edge_treatment` | `browser_frame_edge` |
| `audio_relationship_summary` | Optional soft UI tick after speech, not under speech. |
| `credit_impact` | `low` / `medium` |
| `approval_required` | `true` if generated screen assets are proposed. |
| `QA checks` | Source status, redaction, no invented UI, caption safe. |

### Example 4: Education Graphic Card

| Field | Example |
| --- | --- |
| `skill_key` | `overlay_compositing` |
| `overlay_role` | `graphic_design_card` |
| `planning_reason` | The lesson introduces three steps; a card improves hierarchy while captions remain readable. |
| `restraint_decision` | `use_full` |
| `timing_summary` | Enter after topic sentence; hold long enough to read; exit before example. |
| `composition_summary` | Side panel, captions lower center, text never overlaps speaker. |
| `edge_treatment` | `hard_edge` |
| `audio_relationship_summary` | Music bed ducks; no SFX needed. |
| `credit_impact` | `low` |
| `approval_required` | `false` |
| `QA checks` | Readability, caption safe, hierarchy clear, no clutter. |

### Example 5: Marketing Proof/Offer Card

| Field | Example |
| --- | --- |
| `skill_key` | `overlay_compositing` |
| `overlay_role` | `proof_or_evidence_card` |
| `planning_reason` | The ad needs a clear offer/proof beat; a hard-edge card gives the viewer one readable claim. |
| `restraint_decision` | `use_optional` |
| `timing_summary` | Beat-aligned entry after phrase; hold 1.5 seconds; clear before CTA. |
| `composition_summary` | Center safe card, verified wording only, no caption overlap. |
| `edge_treatment` | `hard_edge` |
| `audio_relationship_summary` | Optional light hit after phrase, speech-safe. |
| `credit_impact` | `low` / `medium` |
| `approval_required` | `true` if custom generated assets or unverified proof are proposed. |
| `QA checks` | Source wording, proof safety, caption safe, credit approval. |

### Example 6: Optional Premium 3D Overlay

| Field | Example |
| --- | --- |
| `skill_key` | `overlay_compositing` |
| `overlay_role` | `three_d_object_overlay` |
| `planning_reason` | The product launch has one hero beat where a 3D object can make the product tangible. |
| `restraint_decision` | `use_optional` |
| `timing_summary` | Start after key phrase, hold 2.2 seconds, clear before speaker returns. |
| `composition_summary` | Right third, face-safe, captions reduced/repositioned during hold. |
| `edge_treatment` | `light_wrap_edge` with `contact_shadow_edge` |
| `audio_relationship_summary` | Music swell after phrase; no SFX under speech. |
| `credit_impact` | `high` / `premium` |
| `approval_required` | `true` |
| `QA checks` | 3D role, face safe, caption reduction, composite feasibility, credit approval. |

### Example 7: Real Motion Or Stroke Motion Layer

| Field | Example |
| --- | --- |
| `skill_key` | `overlay_compositing` |
| `overlay_role` | `stroke_motion_layer` or `real_motion_overlay` |
| `planning_reason` | The speaker describes a before/after change; a transparent layer can support meaning without replacing source footage. |
| `restraint_decision` | `use_subtle` |
| `timing_summary` | Enter on the before/after phrase, hold through explanation, exit before transition. |
| `composition_summary` | Background/side zone, face-safe, captions above or away. |
| `edge_treatment` | `no_visible_edge` for Stroke Motion or `soft_edge` for Real Motion. |
| `audio_relationship_summary` | Optional SoundSync entrance cue only after speech phrase. |
| `credit_impact` | `medium` for Stroke Motion, `high` / `premium` for Real Motion. |
| `approval_required` | `true` for premium generated Real Motion. |
| `QA checks` | Story reason, safe zone, caption safe, no random decoration, approval compliance. |

## Anti-Patterns

Avoid these overlay/compositing planning failures:

- Overlay name only.
- Overlay everywhere.
- Same overlay layout repeated mechanically.
- Overlay covers face/expression.
- Overlay covers product/action.
- Overlay hides captions.
- Overlay ignores aspect ratio/platform UI.
- 3D overlay without role or placement.
- Hard edge when soft integration is needed.
- Soft edge when clean UI card is needed.
- Glow/shadow used randomly.
- Browser/app overlay invents exact screen details.
- Sensitive data shown without redaction plan.
- Tracking/masking assumed without approval/readiness.
- Generated overlay without credit estimate.
- Premium overlay without approval.
- Reference overlay copied shot-for-shot.
- Worker execution from raw prompt only.

## Future Implementation Notes

Possible future records/tables/types:

- `overlay_compositing_plans`
- `overlay_timing_plans`
- `overlay_collision_plans`
- `overlay_qa_requirements`
- `edit_plan_skill_routes` with overlay-related skill keys
- `storytiming_coordination_records`

This document does not create those records now. Future schema/types must avoid duplicating this document's source truth. Future graphic design, motion design, 3D, B-roll, caption, SoundSync, and StoryTiming contracts should reference this overlay/compositing contract when they need screen, layer, collision, or composite planning.

## Duplicate And Overlap Notes

Existing overlay-adjacent ownership already appears in:

- `depth-aware-overlay-composition.md`
- `frame-layout-system.md`
- `speaker-visual-layout-strategy.md`
- `real-motion-system.md`
- `visual-storytelling-architecture.md`
- `open-source-tool-registry.md`
- `provider-prompt-architecture.md`
- `src/types/reeditpro.ts`
- `src/lib/depth-aware-overlay-planner.ts`
- `src/lib/depth-aware-overlays.ts`
- `src/lib/mock-planner.ts`
- `src/lib/planner-validation.ts`
- `server/workers/mask-composition/*`
- `server/workers/text-behind-subject/*`
- `docs/tool-calling/unmerged-owner-evidence-overlay*`
- `docs/creative-skills/skill-planning-contracts.md`
- `docs/creative-skills/transition-planning-contract.md`

This contract is the overlay/compositing planning doctrine and specialized field envelope. It must not create a parallel StoryTiming, frame layout, depth-aware overlay, Real Motion, browser capture, provider, worker, QA, credit, or Supabase lane.

## Next Prompt Handoff

Recommended next prompt:

`RP-SKILLS-05 - Graphic Design Planning Contract`

Scope:

Docs-only graphic design planning contract that inherits the universal and overlay/compositing contracts and defines information hierarchy, layout types, typography intent, graphic systems, callouts, cards, labels, diagrams, comparison layouts, proof cards, design density, animation relationship, and graphic design QA.
