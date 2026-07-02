# 3D Visual Planning Contract

## Purpose

This document defines the 3D-visual-specific planning contract for future ReeditPro 3D visual skills.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, animation code, 3D runtime, model loading, package changes, Supabase connections, SQL, credentials, Remotion code, Lottie code, SVG code, Three.js code, Babylon.js code, Blender code, canvas/WebGL runtime, browser runtime, Playwright execution, AI calls, video/image/audio/3D provider calls, or app behavior.

This contract inherits from [skill-planning-contracts.md](skill-planning-contracts.md). It references [transition-planning-contract.md](transition-planning-contract.md) where 3D participates in transitions. It references [overlay-compositing-planning-contract.md](overlay-compositing-planning-contract.md) where 3D is composited into video. It references [graphic-design-planning-contract.md](graphic-design-planning-contract.md) where 3D needs labels, feature callouts, proof cards, or annotations. It references [motion-design-planning-contract.md](motion-design-planning-contract.md) where 3D needs entry, hold, or exit behavior.

This document defines 3D-specific fields and rules that future docs, types, schema, workers, provider plans, render plans, and QA systems must follow if 3D visual skills are eventually implemented.

## 3D Visual Doctrine

3D must not be random decoration.

3D should support meaning, proof, product understanding, spatial understanding, emotional metaphor, screen interaction, or a justified hero/wow moment. 3D must have a role before it has a tool. 3D must be planned against the actual video frame.

3D must respect faces, captions, important objects, footage context, source status, aspect ratio, visual density, and user edit preference. A premium edit can use strong 3D, but not every moment needs 3D. A no-3D decision can be professional. 3D should be extraordinary where it belongs and restrained where it does not.

Core principle:

"Every 3D idea must know whether it is B-roll, overlay, screen interaction, explainer, metaphor, hero reveal, environment extension, transition object, data visualization, or product breakout before execution is considered."

## Universal, Transition, Overlay, Graphic Design, And Motion Inheritance

Every `ThreeDVisualSkillPlan` inherits the universal skill planning envelope from RP-SKILLS-02:

- `planning_reason`
- `restraint_decision`
- Timing envelope.
- Composition envelope.
- Audio relationship envelope where relevant.
- Tool strategy envelope.
- Credit/approval envelope.
- QA envelope.
- Revision envelope.

3D references RP-SKILLS-03 when it behaves like a transition or crosses a cut:

- Transition timing and edge behavior.
- SFX and speech-safety behavior when 3D appears during a transition.
- Transition-object restraint when the moment does not earn premium cost.

3D references RP-SKILLS-04 when it is composited into footage:

- Screen zone.
- Safe area.
- Face/object/caption collision planning.
- Edge treatment.
- Blend, opacity, shadow, and contact behavior.
- Tracking, masking, and occlusion notes.
- Layer order.
- Aspect ratio behavior.
- Source status and redaction where relevant.

3D references RP-SKILLS-05 when it needs visual explanation support:

- Labels, callouts, feature cards, proof cards, and annotations.
- Information hierarchy for 3D explainer moments.
- Typography and readability around 3D.
- Source/proof safety for claims attached to 3D.

3D references RP-SKILLS-06 when it moves:

- 3D entry, hold, and exit motion.
- Motion energy.
- Easing intent.
- Timing anchors.
- Repetition avoidance.

This 3D contract adds:

- 3D role.
- Object/concept type.
- B-roll versus overlay decision.
- Screen/footage relationship.
- Camera angle.
- Scale.
- Depth.
- Perspective.
- Lighting.
- Material.
- Shadow, contact, and reflection.
- Occlusion, masking, and tracking.
- Environment relationship.
- Screen interaction behavior.
- 3D-specific source/model/provenance readiness.
- 3D-specific QA.

Do not duplicate the full universal, transition, overlay/compositing, graphic design, or motion design contracts except when referencing inheritance.

## 3D Role Family

These roles are guidance, not hard-coded execution. A future planner should choose the role because it fits the moment, not because 3D is available.

| Role | What it is | Best use cases | Avoid cases | Typical credit impact | Notes |
| --- | --- | --- | --- | --- | --- |
| `no_3d` | Intentional absence of 3D. | Clean talking head, emotional pause, strong source footage. | User asked for a premium 3D concept and approved it. | `none` | A valid professional decision. |
| `three_d_object_broll` | 3D object appears as B-roll or inset instead of integrated overlay. | Missing object footage, product mention, concept support. | Needs to interact with speaker or real scene. | `medium` / `high` | Lower integration burden than overlay. |
| `three_d_overlay_integration` | 3D object sits inside or over user footage. | Product proof, room object, branded hero. | Face/caption risk or unclear surface. | `high` / `premium` | Needs compositing, scale, lighting, and safety plan. |
| `three_d_screen_interaction` | 3D appears to come from or attach to a phone/app/browser/dashboard/screen. | Product UI, SaaS explanation, app demo. | Unknown source or invented UI details. | `high` / `premium` | Requires source status and safe wording. |
| `three_d_explainer_visual` | 3D teaches a system, mechanism, or process. | Education, product feature, technical explanation. | Simpler 2D diagram is clearer. | `medium` / `high` | Must preserve hierarchy and readability. |
| `three_d_symbolic_metaphor` | 3D object represents an abstract idea. | Transformation, trust, growth, pressure, unlock. | Serious proof needing literal evidence. | `medium` / `high` | Must fit tone and avoid cliche. |
| `three_d_hero_reveal` | Premium high-impact visual payoff. | Product launch, offer reveal, transformation beat. | Minor sentence, low budget, dense speech. | `premium` | Rare and earned. |
| `three_d_environment_extension` | 3D expands or alters perceived environment. | Cinematic brand moment, property, world-building. | Clean edit or unclear room geometry. | `premium` | Highest complexity and QA risk. |
| `three_d_transition_object` | 3D object drives movement between segments. | Product-led cut, chapter shift, dimensional wipe. | Transition would distract from speech. | `high` / `premium` | Inherits RP-SKILLS-03. |
| `three_d_data_visualization` | 3D represents metrics or data spatially. | Growth, scale, funnel, volume, map/globe. | Exact values unavailable or unsupported. | `medium` / `high` | Must avoid false proof. |
| `three_d_product_feature_breakout` | Product component separates, highlights, or explains a feature. | Product demos, tech, physical goods. | No product asset or feature proof. | `high` / `premium` | Needs source/model/proof readiness. |
| `three_d_spatial_callout` | 3D pin, arrow, ring, or object highlights a point in space. | Property detail, product part, app module. | Dense captions or face overlap. | `medium` / `high` | Coordinates with graphic design. |
| `three_d_product_mockup` | Planned 3D mockup of product or package. | Launches, ecommerce, ads. | Exact replication without assets/approval. | `high` / `premium` | Rights and brand review may be needed. |
| `three_d_architectural_model` | Building, floor, blueprint, or property model. | Real estate, property tours, renovation. | No floor/space evidence or budget. | `high` / `premium` | Often works as B-roll or subtle overlay. |
| `three_d_abstract_concept` | Non-literal 3D form for a concept. | Thought leadership, coaching, brand film. | Claims needing evidence. | `medium` / `high` | Must avoid generic stock feel. |
| `three_d_ui_layer_stack` | Dimensional stack of UI/app layers. | SaaS/product explanation. | Unknown or sensitive UI source. | `high` | Needs browser/app safety. |
| `three_d_proof_visualization` | 3D supports proof, result, or evidence. | Case study, testimonial, metric reveal. | Exact data not verified. | `medium` / `high` | Must not invent metrics. |
| `three_d_brand_moment` | Brand-shaped or branded 3D element. | Premium intro, launch, signature moment. | Brand assets unavailable or style copied. | `high` / `premium` | Needs brand review when exact. |

## 3D Role Decision: B-roll Versus Overlay Versus Interaction

### 3D As B-roll

3D as B-roll replaces or supplements footage. It can be full-frame or inset. It supports a concept, object, product, place, system, or mood without needing to sit inside the real scene. It usually has lower scene-integration burden than an overlay because it does not need to match the speaker's lighting, room perspective, surface contact, or occlusion.

### 3D As Overlay

3D as overlay appears inside or over user footage. It must consider face safety, object safety, caption safety, scale, perspective, lighting, shadows, contact, reflections, edge treatment, layer order, and compositing. Overlay integration is premium when it involves tracking, masking, occlusion, or Real Motion-style object behavior.

### 3D As Screen Interaction

3D as screen interaction appears to come from, attach to, or interact with a phone, app, browser, dashboard, UI, or screen. It must respect source status and cannot invent exact UI details, websites, dashboards, metrics, pricing, labels, or evidence pages. Unknown or claimed screen sources need safe wording and may need redaction planning.

### 3D As Explainer

3D as explainer helps teach a process, system, object, product feature, spatial relationship, or abstract idea. It must keep hierarchy, pacing, labels, and read time clear. It should defer to graphic design when 2D structure is clearer or cheaper.

### 3D As Hero Moment

3D as hero moment is a premium reveal or high-impact visual payoff. It should be rare and earned by story importance, product launch value, transformation value, or user-approved premium style.

### 3D As Metaphor

3D as metaphor represents transformation, trust, growth, pressure, unlock, repair, scale, momentum, friction, risk, or relief. It must support the user's story and tone rather than becoming generic decoration.

### 3D As Transition Object

3D as transition object drives movement between segments. It must inherit transition timing, edge behavior, speech safety, SFX safety, and approval behavior from RP-SKILLS-03.

Decision questions:

- Does this moment need 3D, or would graphic design, B-roll, captions, Stroke Motion, or no extra visual be better?
- Does the 3D need to sit inside the footage, or can it be B-roll?
- Is this a hero moment or a support moment?
- Does the screen have safe space?
- Does the user preference allow this level of visual density?
- Is the credit cost justified?
- Is approval required?

## When To Use 3D

Use 3D when:

- A speaker mentions a concrete object, product, device, place, room, or physical feature.
- A product feature would be clearer in 3D.
- An abstract concept needs a memorable spatial metaphor.
- A screen, app, or browser moment can benefit from dimensional explanation.
- Data or a metric needs spatial visualization and the source is safe.
- Real estate, property, architecture, renovation, or space planning benefits from a model, blueprint, or spatial cue.
- Education or explainer content needs object or system visualization.
- A marketing ad needs a premium product or proof hero moment.
- A testimonial or case study needs a symbolic proof/result visual that does not invent evidence.
- A story transformation deserves a visual metaphor.
- Source B-roll is missing but a 3D object can support the spoken point.
- User edit preference supports premium/wow visuals.
- Edit level and credit budget can support heavy planning.
- Safe screen space and timing exist.

## When To Avoid 3D

Avoid, delay, or replace 3D when:

- The user requested clean, simple, minimal, or no extra visuals.
- The moment is minor and does not earn premium cost.
- 3D would distract from important speech.
- 3D would cover face, expression, captions, product, action, or a speaker gesture.
- Footage already communicates the idea clearly.
- 3D would feel gimmicky, template-like, or disconnected from the story.
- 3D repeats a similar object, entrance, rotation, material, or role from earlier segments.
- The 3D role is unclear.
- 3D source, model, provenance, brand permission, or rights status is unclear.
- Screen/app interaction would imply false UI/source details.
- Tracking, masking, or occlusion complexity is too high for budget/readiness.
- A serious or emotional pause needs stillness.
- Credit budget does not justify premium 3D.
- The user has not approved premium/heavy generated visuals.
- Simpler graphic design, B-roll, caption emphasis, Stroke Motion, or no extra visual would be clearer.

## 3D Visual Density And Impact Model

3D impact is not quality. Professional quality can use no 3D. Premium/wow can use high-impact 3D where earned.

| Impact level | Meaning | When to use | Risk if overused | Example |
| --- | --- | --- | --- | --- |
| `none` | No 3D. | Clean edit is stronger. | Missing an earned hero idea. | No 3D during emotional statement. |
| `subtle` | Small, low-density 3D support. | Product marker, safe-zone object, light spatial cue. | Feels unnecessary if repeated. | Small product object near safe zone. |
| `support` | Clear supporting 3D moment. | Spoken object/product mention or missing B-roll. | Distracts if near face/captions. | 3D object B-roll supports product mention. |
| `featured` | 3D carries a key explanation. | Product feature breakout, technical education. | Cost and complexity rise quickly. | Exploded product feature view. |
| `hero` | 3D is the payoff. | Launch, transformation, major proof beat. | Turns edit into gimmick if unearned. | Product launch reveal. |
| `premium_world_build` | 3D extends environment or creates a cinematic spatial world. | Brand film, property, premium campaign. | Highest integration and QA risk. | Spatial world around footage. |

## 3D Style And Material Intent Model

Material/style intent should come from user preference, workflow, footage, brand context, and creative concept. Material/style does not execute anything; it guides future tools/workers. Do not copy reference 3D style exactly.

| Material/style intent | Meaning | Best use cases | Avoid cases | Notes |
| --- | --- | --- | --- | --- |
| `realistic_product` | Looks like a real product object. | Product demos, ecommerce, launch. | Asset/proof unavailable. | Needs source/model review. |
| `premium_glass` | Transparent/refined premium material. | Tech, luxury, hero moments. | Serious proof or low-budget edit. | Can look generic if overused. |
| `matte_minimal` | Soft, clean, non-reflective. | Education, explainers, clean brands. | High-glam product reveal. | Lower visual noise. |
| `metallic_luxury` | Reflective premium metal. | Luxury, automotive, premium offers. | Warm personal stories. | Needs lighting intent. |
| `soft_clay` | Friendly stylized physical form. | Education, social, playful concepts. | Serious legal/financial proof. | Avoid toy-like tone if wrong. |
| `wireframe_blueprint` | Technical outline or model. | Architecture, systems, planning. | Emotional lifestyle edit. | Good for real estate. |
| `architectural_model` | Physical/spatial property model. | Property tour, renovation, space. | No space evidence. | Often premium. |
| `data_crystal` | Dimensional data/proof object. | Metrics, growth, proof visualization. | Unverified numbers. | Must avoid fake precision. |
| `holographic_ui` | Futuristic UI-like dimensional layer. | SaaS, app, tech explainers. | Unknown UI source or sensitive screen. | Needs source safety. |
| `cinematic_object` | Filmic hero object. | Product launch, brand moment. | Dense speech or minor beat. | Usually premium. |
| `playful_object` | Bright, friendly, expressive object. | Social, creator, light product. | Serious tone. | Watch for gimmick risk. |
| `abstract_symbolic` | Non-literal form for idea/emotion. | Thought leadership, transformation. | Evidence-heavy proof. | Needs clear metaphor. |
| `brand_aligned_custom` | Matches brand world or product style. | Brand kit, campaign, launch. | Brand assets absent. | Needs brand review. |
| `source_matched_realistic` | Matches user footage lighting and context. | Real Motion-style overlay. | Tracking/masking unavailable. | Highest integration burden. |
| `stylized_explainer` | Clear, simplified 3D for learning. | Education, product feature, process. | Photoreal product expectation. | Prioritize clarity. |

## 3D Camera, Scale, And Depth Model

3D overlay integration is harder than full-frame 3D B-roll. If perspective or tracking confidence is low, the plan should choose simpler placement. 3D scale should match meaning, not just object realism. Hero moments can exaggerate scale if intentionally planned.

| Concept | Planning meaning | Example |
| --- | --- | --- |
| `camera_angle` | Intended viewing angle for the 3D object/space. | `three_quarter_front` |
| `camera_height` | Perceived height of the camera. | `eye_level` |
| `camera_lens_intent` | Lens feel or perspective pressure. | `slightly_wide_but_not_distorted` |
| `camera_motion_intent` | Camera movement around or through the object. | `slow_push_in` |
| `object_scale_strategy` | How scale supports meaning. | `larger_than_life_product_hero` |
| `scale_relative_to_speaker` | Scale compared with speaker body/face. | `small_enough_to_stay_beside_shoulder` |
| `scale_relative_to_screen` | Scale compared with app/browser/screen frame. | `module_emerges_at_40_percent_screen_width` |
| `depth_position` | Foreground, midground, background, or full-frame depth. | `midground_right` |
| `foreground_midground_background` | Layering relationship. | `3D object midground behind caption layer` |
| `perspective_match_needed` | Whether footage perspective must match. | `true for desk overlay` |
| `parallax_needed` | Whether parallax is needed for integration. | `false for full-frame B-roll` |
| `horizon_or_floor_reference` | Real scene anchor. | `desk edge` |
| `tabletop_or_surface_anchor` | Surface contact point. | `product rests on counter` |
| `screen_plane_anchor` | Screen-attached plane. | `phone screen plane` |
| `world_space_anchor` | Real-world position anchor. | `beside doorway` |
| `floating_space_anchor` | Intentional floating placement. | `upper-right concept object` |
| `full_frame_3d_space` | Separate full-frame 3D scene. | `product exploded view B-roll` |
| `depth_of_field_intent` | Focus/depth softness. | `background softly blurred` |

## 3D Lighting, Shadow, Contact, And Reflection Model

Contact shadows and lighting make 3D feel integrated, but increase complexity. Not every 3D object needs full realism; stylized 3D can be intentionally separate. The plan should define the intended relationship to the footage, not force unsupported rendering.

| Concept | Planning meaning | Example |
| --- | --- | --- |
| `lighting_direction` | Where light appears to come from. | `upper_left_window_match` |
| `lighting_match_needed` | Whether footage lighting must be matched. | `true for realistic overlay` |
| `key_light_intent` | Main light style. | `soft_large_key` |
| `fill_light_intent` | Fill or shadow softness. | `low_contrast_fill` |
| `rim_light_intent` | Edge highlight. | `subtle_premium_rim` |
| `ambient_light_intent` | Overall environmental light. | `warm_room_ambient` |
| `shadow_strategy` | How shadows should behave. | `soft_contact_shadow_only` |
| `contact_shadow_needed` | Whether a contact shadow is needed. | `true on desk surface` |
| `cast_shadow_needed` | Whether object casts a shadow into scene. | `false for holographic UI` |
| `reflection_strategy` | Reflection behavior. | `subtle_screen_reflection` |
| `screen_glow_interaction` | Whether 3D light affects a screen. | `soft blue glow from app card` |
| `light_wrap_needed` | Whether edge light-wrap is needed. | `true for integrated hero object` |
| `color_match_needed` | Whether color should match footage. | `true for realistic object` |
| `grain_match_needed` | Whether grain/noise match matters. | `true for cinematic footage` |
| `blur_match_needed` | Whether motion/defocus blur match matters. | `true for fast camera move` |
| `exposure_match_notes` | Exposure relationship. | `keep object one stop brighter than background` |

## 3D Occlusion, Masking, Tracking, And Safety Model

Occlusion, masking, and tracking can make 3D premium, but increase cost, QA risk, and approval need. If tracking/masking is unavailable or not approved, plan a simpler 3D role such as full-frame 3D B-roll or graphic design alternative. Face/caption/product safety is mandatory.

| Concept | Planning meaning | Example |
| --- | --- | --- |
| `tracking_required` | Whether motion tracking is needed. | `true for desk-following object` |
| `tracking_target` | What would be tracked. | `phone screen corners` |
| `tracking_confidence` | Expected tracking confidence. | `medium` |
| `masking_required` | Whether masks are needed. | `true if object passes behind hand` |
| `mask_type` | Type of mask plan. | `subject_plus_hand_mask` |
| `occlusion_required` | Whether foreground/background occlusion is needed. | `true` |
| `occlusion_target` | What should occlude or be occluded. | `speaker hand in front of object` |
| `foreground_subject_protection` | Subject protection rule. | `never cover face or eyes` |
| `behind_subject_layer` | Whether 3D sits behind subject. | `false` |
| `in_front_of_subject_layer` | Whether 3D sits in front of subject. | `true but outside face area` |
| `face_safe_required` | Whether face safety is required. | `true` |
| `eye_line_protection` | Eye-line protection behavior. | `avoid center face band` |
| `mouth_region_protection` | Mouth/caption/speech protection. | `do not cover mouth` |
| `hand_gesture_protection` | Protect meaningful gestures. | `avoid demo hand path` |
| `product_action_protection` | Protect product action. | `keep unboxing action unobstructed` |
| `caption_collision_strategy` | Caption collision behavior. | `caption above all; 3D stays upper-right` |
| `manual_review_required` | Whether human review is required. | `true for premium overlay` |
| `fallback_if_tracking_unavailable` | Safer fallback. | `use full-frame 3D B-roll instead` |

## 3D Source, Model, And Provenance Planning

This section does not claim real 3D model generation or asset availability. It does not store provider secrets. Future 3D assets must have provenance/rights status.

| Source/model status | Meaning | Rule |
| --- | --- | --- |
| `user_provided_model` | User supplies a 3D model or approved asset. | May need user confirmation and rights review. |
| `generated_model_future` | Future generated model may be needed. | Requires provider, credit, approval, and rights policy later. |
| `stock_model_future` | Future stock model may be selected. | Requires license/provenance review. |
| `procedural_shape` | Simple generated/procedural geometry concept. | Still docs-only here. |
| `simple_primitive` | Basic cube/sphere/ring/line concept. | Useful for explainers and low-cost alternatives. |
| `renderer_generated_object` | Object created by future renderer workflow. | Requires future runtime gate. |
| `AI_video_assist_future` | Future AI video may assist 3D-like output. | Requires provider, credit, approval, and policy. |
| `mock_only` | Placeholder planning only. | Must not imply execution. |
| `source_unknown` | Source not verified. | Must not be treated as proof. |
| `needs_rights_review` | Legal/license status unresolved. | Cannot execute without review. |
| `needs_brand_review` | Exact brand/product replication needs review. | Requires user/brand confirmation. |
| `needs_user_confirmation` | User must confirm source or model. | Do not proceed before confirmation. |

Rules:

- Do not claim real 3D model generation or asset availability in this docs-only prompt.
- Do not store provider secrets.
- User-provided brand/product models may need user confirmation.
- Unknown sources must not be treated as verified proof.
- Exact product/brand replication may require user-provided assets or approval.
- This document does not unlock provider, stock, WebGL, Blender, or model-loading execution.

## ThreeDVisualTimingPlan Pseudo-Record

`ThreeDVisualTimingPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, prompt runtime, or executable contract.

| Field | Required | Description | Example |
| --- | --- | --- | --- |
| `three_d_start_seconds` | Required | Planned start time for the 3D moment. | `12.4` |
| `three_d_end_seconds` | Required | Planned end time for the 3D moment. | `17.8` |
| `duration_seconds` | Required | Total visible duration. | `5.4` |
| `entry_duration_seconds` | Required | Time for 3D entry. | `0.45` |
| `hold_duration_seconds` | Required | Time for readable/visible hold. | `4.2` |
| `exit_duration_seconds` | Required | Time for 3D exit. | `0.75` |
| `timing_anchor_type` | Required | Anchor type such as transcript, story beat, cut, music, SFX, product action, or screen event. | `product_feature_phrase` |
| `transcript_anchor_text` | Optional | Spoken phrase that anchors timing. | `the hidden filter system` |
| `transcript_anchor_id` | Optional | Transcript token or phrase id. | `tr_0024` |
| `story_beat_anchor_id` | Optional | StoryTiming beat id. | `beat_product_breakout` |
| `music_beat_anchor` | Optional | Music beat anchor. | `downbeat_17` |
| `sfx_anchor` | Optional | SFX anchor. | `soft_object_settle` |
| `transition_relationship` | Required | Whether 3D relates to a transition. | `none` |
| `caption_relationship_timing` | Required | Timing relationship to captions. | `caption holds below; 3D starts after keyword` |
| `graphic_relationship_timing` | Required | Timing relationship to labels/callouts/cards. | `label appears after object settle` |
| `pre_entry_buffer` | Required | Buffer before entry. | `0.2` |
| `post_exit_buffer` | Required | Buffer after exit. | `0.3` |
| `hero_hold_seconds` | Optional | Extra hold for hero reveal. | `1.5` |
| `sync_precision_needed` | Required | Timing precision requirement. | `frame_safe_for_sfx_settle` |

## ThreeDSpatialCompositionPlan Pseudo-Record

`ThreeDSpatialCompositionPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, prompt runtime, or executable contract.

| Field | Required | Description | Example |
| --- | --- | --- | --- |
| `three_d_role` | Required | Selected 3D role. | `three_d_product_feature_breakout` |
| `object_type` | Required | Object, concept, scene, model, UI layer, data form, or metaphor. | `filter cartridge model` |
| `object_purpose` | Required | Why the object exists. | `show the hidden feature clearly` |
| `screen_zone` | Required | Screen placement. | `right_mid_safe_zone` |
| `safe_area_strategy` | Required | Safe-area behavior. | `avoid face, captions, and product hands` |
| `b_roll_or_overlay` | Required | Whether 3D is B-roll, overlay, screen interaction, explainer, hero, metaphor, or transition object. | `overlay` |
| `screen_interaction_mode` | Required | Screen/app interaction mode or `none`. | `none` |
| `camera_angle` | Required | Planned camera angle. | `three_quarter_front` |
| `camera_motion_intent` | Required | Camera movement intent. | `slow_push_in` |
| `object_scale_strategy` | Required | Scale approach. | `larger_than_real_to_explain_feature` |
| `depth_position` | Required | Depth layer. | `midground_right` |
| `perspective_match_needed` | Required | Whether perspective match is needed. | `true` |
| `surface_or_anchor_reference` | Required | Surface or anchor. | `demo table plane` |
| `lighting_direction` | Required | Lighting direction. | `upper_left_soft` |
| `material_style_intent` | Required | Material/style intent. | `source_matched_realistic` |
| `shadow_strategy` | Required | Shadow/contact behavior. | `soft_contact_shadow` |
| `reflection_strategy` | Required | Reflection behavior. | `none` |
| `edge_treatment` | Required | Edge/composite treatment. | `soft_integrated_edge` |
| `blend_or_composite_intent` | Required | Blend/composite intent. | `realistic_overlay_composite` |
| `tracking_required` | Required | Whether tracking is required. | `true` |
| `masking_required` | Required | Whether masking is required. | `false` |
| `occlusion_required` | Required | Whether occlusion is required. | `false` |
| `caption_collision_strategy` | Required | Caption collision plan. | `captions stay bottom; 3D right side only` |
| `graphic_label_relationship` | Required | Relationship to labels/callouts. | `small label after settle` |
| `layer_order` | Required | Planned layer order. | `source video, 3D object, label, captions` |
| `aspect_ratio_behavior` | Required | Behavior across aspect ratios. | `collapse to B-roll inset on vertical` |
| `manual_review_required` | Required | Whether manual review is required. | `true` |

## ThreeDMotionBehaviorPlan Pseudo-Record

`ThreeDMotionBehaviorPlan` is documentation-only. It references RP-SKILLS-06 for entry, hold, exit, energy, language, easing, rhythm, repetition, and comfort. It does not duplicate the full motion design contract.

| Field | Required | Description | Example |
| --- | --- | --- | --- |
| `entry_motion` | Required | How the 3D enters. | `soft_depth_push_from_screen` |
| `hold_motion` | Required | Motion while visible. | `mostly_still_with_micro_float` |
| `exit_motion` | Required | How the 3D exits. | `fade_and_scale_down` |
| `motion_energy` | Required | Motion energy from RP-SKILLS-06. | `restrained` |
| `motion_language` | Required | Motion language from RP-SKILLS-06. | `depth_push, settle` |
| `easing_intent` | Required | Easing/curve intent. | `soft_settle` |
| `camera_motion` | Required | Camera motion behavior. | `slow_push_in` |
| `object_motion_path` | Required | Object path. | `screen_to_midground_arc` |
| `rotation_intent` | Required | Rotation plan. | `single_15_degree_turn_then_still` |
| `scale_change_intent` | Required | Scale change. | `grow_from_screen_module_to readable size` |
| `screen_attachment_motion` | Optional | Screen-attached behavior. | `attached_to_phone_screen_until release` |
| `interaction_trigger` | Optional | Trigger that starts the motion. | `speaker says dashboard` |
| `beat_sync_needed` | Required | Whether beat sync is needed. | `true` |
| `sfx_relationship` | Required | SFX relationship. | `soft settle under pause, not under speech` |
| `repetition_limit` | Required | Repetition limit. | `do not repeat this entry later` |
| `fallback_motion_if_complexity_reduced` | Required | Simpler motion fallback. | `static 3D B-roll still` |

## ThreeDVisualSkillPlan Pseudo-Record

`ThreeDVisualSkillPlan` is documentation-only. It is not TypeScript, SQL, JSON schema, a migration, prompt runtime, or executable contract. It includes universal fields by reference and adds 3D-specific fields.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable future plan id. | `3d_plan_product_breakout_01` |
| `project_id` | Required | Project id. | `project_123` |
| `edit_plan_id` | Required | Edit plan id. | `edit_plan_v4` |
| `edit_plan_segment_id` | Required | Segment id. | `segment_03` |
| `skill_key` | Required | Skill key. | `three_d_visual` |
| `three_d_role` | Required | Selected 3D role. | `three_d_product_feature_breakout` |
| `object_type` | Required | Object/concept type. | `filter cartridge` |
| `object_purpose` | Required | Why the 3D object exists. | `make hidden product mechanism clear` |
| `planning_reason` | Required | Taste/meaning reason. | `The speaker explains a hidden mechanism that source footage does not show.` |
| `restraint_decision` | Required | Restraint decision. | `use_3d_featured_because_clarity_gain_is_high` |
| `b_roll_or_overlay` | Required | Role decision. | `overlay` |
| `screen_interaction_mode` | Required | Screen interaction mode or `none`. | `none` |
| `visual_impact_level` | Required | 3D impact level. | `featured` |
| `material_style_intent` | Required | Material/style intent. | `source_matched_realistic` |
| `camera_angle` | Required | Camera angle. | `three_quarter_front` |
| `object_scale_strategy` | Required | Scale approach. | `large_enough_to_explain_feature` |
| `depth_position` | Required | Depth position. | `midground_right` |
| `lighting_direction` | Required | Lighting direction. | `upper_left_soft` |
| `shadow_strategy` | Required | Shadow/contact strategy. | `soft_contact_shadow` |
| `reflection_strategy` | Required | Reflection strategy. | `none` |
| `edge_treatment` | Required | Edge/compositing edge. | `soft_integrated_edge` |
| `tracking_required` | Required | Whether tracking is required. | `true` |
| `masking_required` | Required | Whether masking is required. | `false` |
| `occlusion_required` | Required | Whether occlusion is required. | `false` |
| `source_model_status` | Required | Source/model/provenance status. | `needs_user_confirmation` |
| `source_or_rights_notes` | Required | Rights and source notes. | `No exact product model available; ask user before execution.` |
| `motion_behavior_summary` | Required | 3D motion summary. | `soft entry, hold still, label after settle` |
| `screen_zone` | Required | Screen zone. | `right_mid_safe_zone` |
| `safe_area_strategy` | Required | Safe area behavior. | `avoid face, captions, product hands` |
| `caption_relationship` | Required | Caption relationship. | `captions remain bottom and above all layers` |
| `graphic_label_relationship` | Required | Label/callout relationship. | `one small feature label, no dense card` |
| `audio_relationship_summary` | Required | Music/SFX/speech relationship. | `optional soft settle SFX only during pause` |
| `credit_impact` | Required | Credit impact. | `premium` |
| `approval_required` | Required | Whether approval is required. | `true` |
| `qa_checks` | Required | QA checks. | `face safe, caption safe, source confirmed, no runtime claim` |
| `revision_options` | Required | Revision options. | `convert to B-roll, reduce motion, use graphic card` |
| `lower_cost_alternative` | Required | Lower-cost option. | `static graphic card with product callout` |
| `worker_notes` | Optional | Future worker-safe notes. | `Use approved plan by id; no raw prompt execution.` |
| `must_follow_rules` | Required | Rules that must be followed. | `No generation before approval; no invented product model.` |
| `avoid_rules` | Required | Things to avoid. | `Avoid covering face, captions, or demo hands.` |
| `status` | Required | Planning status. | `planned_requires_approval` |
| `metadata_json` | Optional | Future metadata container. | `{ "rp_skills": "07" }` |

## 3D Scoring Model

Positive signals:

- 3D directly supports spoken meaning.
- Concrete object, product, device, place, screen, room, or system is mentioned.
- Abstract concept benefits from spatial metaphor.
- Product feature needs dimensional explanation.
- Screen/app moment benefits from dimensional interaction.
- Hero/wow moment is earned.
- Safe screen space exists.
- User preference supports premium/wow visuals.
- Edit level/credit budget supports 3D.
- 3D improves clarity more than graphic design/B-roll.
- Reference DNA suggests dimensional visual language without copying.
- Novelty score is high.
- Repetition risk is low.
- Feasible without unsupported tracking/masking.

Negative signals:

- User requested minimal/no extra visuals.
- Moment does not earn 3D.
- 3D role is unclear.
- Face/caption/product collision risk.
- Tracking/masking/occlusion risk too high.
- Source/model/provenance unclear.
- Screen interaction could imply false UI/source details.
- Graphic design/B-roll/captions would be clearer or cheaper.
- Repeated 3D pattern.
- Tone mismatch.
- Credit budget too low.
- Approval missing.
- 3D would distract from speech/emotion.

Documentation-only pseudo formula:

```text
three_d_score =
  meaning_support
+ object_or_concept_fit
+ spatial_clarity_gain
+ wow_potential
+ screen_fit
+ user_preference_fit
+ workflow_fit
+ platform_fit
+ novelty_score
- role_uncertainty
- face_caption_object_risk
- tracking_masking_risk
- source_model_risk
- repetition_penalty
- credit_penalty
- tone_mismatch
- simpler_skill_better_penalty
```

## 3D Relationship To Edit Preference

User direct instruction overrides defaults.

| Edit preference | 3D behavior |
| --- | --- |
| No extra visuals | Avoid 3D unless user explicitly approves a premium idea. |
| Keep visuals minimal | No 3D or subtle optional 3D only where strongly useful. |
| Balanced visual mix | 3D may support one or two key moments. |
| More graphic design | Prefer graphic design unless 3D clearly adds clarity/wow. |
| More Stroke Motion | 3D should not compete with Stroke Motion story layer. |
| Real Motion if useful | 3D/Real Motion-style overlays can be considered where meaningful and approved. |
| Premium/luxury | Use restrained, high-end, soft-integrated 3D. |
| Energetic/social | Stronger 3D only if readable and not gimmicky. |
| Educational | Use 3D explainers/diagrams if they clarify. |
| Product/tech | Use 3D product breakouts/screen interaction where useful. |
| Cinematic | Use 3D atmospheric/world-building where earned. |

## 3D Relationship To Workflow Context

| Workflow context | Likely 3D behavior | Avoid behavior | Notes |
| --- | --- | --- | --- |
| Simple Clean Edit | Usually `no_3d`. | Premium overlays and hero objects. | Clean restraint is often better. |
| Social Short / Viral Clip | One strong 3D hook if approved. | Too many spinning objects. | Readability and pace matter. |
| Talking Head / Personal Brand | Subtle 3D support or no 3D. | Covering face/gesture. | Speaker remains primary. |
| Podcast Clip | Rare 3D; use B-roll or graphic alternative. | Distracting from conversation. | Captions and faces dominate. |
| Vlog / Lifestyle | Occasional metaphor or object B-roll. | Unrealistic overlay that breaks authenticity. | Source footage often carries mood. |
| Product Demo | Product breakout, mockup, or feature explainer. | Invented product details. | Source/model status is critical. |
| Real Estate / Property Tour | Wireframe, blueprint, architectural model, subtle overlay. | Heavy environment extension without space evidence. | Scale and perspective matter. |
| Education / Explainer | 3D system/object visualization where clearer than 2D. | 3D for every definition. | Use hierarchy and hold time. |
| Marketing Ad | Product hero, proof visualization, brand moment. | Premium 3D without approval. | Credit estimate required. |
| Testimonial / Case Study | Optional symbolic proof/result visual. | False proof or fake metrics. | Credibility beats spectacle. |
| Custom / Let AI Decide | Select 3D only if score beats alternatives. | Assuming 3D by default. | Use restraint and approval gates. |

## 3D Relationship To Other Skills

- Transitions: 3D transition objects inherit timing, edge, SFX, and speech-safety rules from RP-SKILLS-03.
- Overlays/compositing: 3D overlays inherit screen zone, safe area, collision, edge, layer order, tracking, masking, and occlusion rules from RP-SKILLS-04.
- Graphic design: labels, callouts, proof cards, and feature cards around 3D inherit hierarchy/readability from RP-SKILLS-05.
- Motion design: entry/hold/exit behavior, energy, easing, and repetition inherit RP-SKILLS-06.
- Captions: captions remain readable and usually above 3D unless explicitly planned otherwise. Full caption contract belongs to RP-SKILLS-09.
- B-roll: full B-roll contract belongs to RP-SKILLS-08. 3D B-roll must not define the whole B-roll system.
- Stroke Motion: 3D must not compete with the same story beat or gesture emphasis.
- Real Motion: realistic object integration may route to Real Motion later; Real Motion remains approval-gated and face-safe.
- Browser/app visuals: 3D screen interaction must respect source status and redaction.
- SoundSync/music/SFX: 3D entry, settle, impact, or transition sounds must stay speech-safe and approval-aware. Full sound/music contract belongs to RP-SKILLS-10.
- StoryTiming: 3D reveals, transitions, hero moments, and conflicts must coordinate with StoryTiming. Full StoryTiming coordination belongs to RP-SKILLS-11.

Conflict examples:

- 3D object covers captions.
- 3D object covers speaker face or product action.
- 3D hero reveal competes with dense graphic card.
- 3D screen interaction implies invented UI behavior.
- 3D transition object triggers SFX under speech.
- 3D object repeats the same role/pattern too often.
- Stroke Motion and 3D both compete for the same story beat.
- Real Motion/3D overlap creates unclear system routing.
- B-roll would be clearer/cheaper than 3D.
- Browser/app visuals need source status/redaction.

## 3D And Real Motion Boundary

Real Motion is an existing ReeditPro signature system for realistic animated overlay objects/scenes inside user footage.

3D Visual skills are a broader planning family. They can include stylized 3D B-roll, abstract 3D, product mockups, screen interaction, data visualization, explainers, hero reveals, transition objects, environment extensions, and Real Motion-style overlay candidates.

Some 3D overlay plans may route into Real Motion later when the intent is realistic object integration inside user footage. Some 3D plans may remain graphic/motion-design/renderer-style and not be Real Motion.

The plan must explicitly say whether the 3D is intended as:

- Real Motion-style overlay.
- Stylized 3D graphic.
- B-roll.
- Explainer.
- Screen interaction.
- Data visualization.
- Product mockup.
- Transition object.
- Environment extension.
- Another documented role.

Real Motion remains premium, overlay-first, face-safe, credit-heavy, and approval-gated.

## 3D And Browser/App/Screen Interaction Safety

| Source status | Meaning | Rule |
| --- | --- | --- |
| `user_provided_screen` | User supplied the screen source. | Can plan interaction if safe and redacted. |
| `uploaded_screenshot` | Screenshot exists in project inputs. | Respect exact source and sensitive data. |
| `authorized_capture_later` | Capture may happen later. | Do not imply it happened now. |
| `internal_mock` | Internal mock visual, not real evidence. | Use safe wording. |
| `unknown_source` | Source is unknown. | Do not claim exact UI or proof. |
| `claimed_source` | User claims source but not verified. | Use safe wording and ask for confirmation later. |
| `redaction_needed` | Sensitive data may be visible. | Redaction planning required. |
| `safe_wording_required` | Evidence wording needs caution. | Avoid exact proof claims. |

Rules:

- Do not use AI to invent exact website/app screenshots, UI labels, dashboards, metrics, pricing, or evidence pages.
- 3D can interact with a planned screen frame only when source status is clear.
- Unknown/claimed source visuals need safe wording.
- Sensitive data requires redaction planning.
- This prompt does not unlock browser capture, Playwright, WebGL, canvas, or runtime execution.

Requested browser-capture reading files are not present in this repo snapshot: `browser-app-capture-planning.md`, `browser-capture-settings-catalog.md`, and `src/lib/browser-capture-planner.ts`. Future browser/app 3D work should reconcile that absence before claiming a browser capture planning contract exists.

## 3D Accessibility, Readability, And Comfort

3D planning must:

- Avoid excessive camera motion.
- Avoid unnecessary spin/rotation.
- Avoid rapid flashing or shake.
- Preserve caption readability.
- Avoid too much simultaneous motion.
- Avoid depth/motion that makes mobile viewing uncomfortable.
- Keep serious/sensitive content restrained.
- Use a reduced-complexity alternative if needed.
- Protect read time for graphics/captions around 3D.

## 3D Repetition And Novelty

Do not use the same floating object pattern for every segment. Do not make every product mention a 3D object. Do not repeat the same entrance, rotation, material, lighting style, or scale without reason. Save hero 3D for actual hero moments.

A recurring 3D motif can be used intentionally as a brand or story device, but must be planned. The same topic can reuse a blueprint family while varying scale, material, timing, layout, and emphasis.

Repetition states:

- `first_use`
- `repeated_intentionally`
- `repeated_unintentionally`
- `overused`
- `avoid_this_pattern_next`

## Credit And Approval Behavior

| 3D behavior | Typical credit impact |
| --- | --- |
| `no_3d` | `none` |
| Simple 3D concept note / placeholder planning | `none` / `low` |
| Simple stylized 3D B-roll plan | `medium` |
| 3D label/callout around existing visual | `medium` |
| 3D object B-roll generation later | `high` / `premium` |
| 3D overlay integration | `high` / `premium` |
| 3D screen interaction | `high` / `premium` |
| 3D explainer visual | `high` / `premium` |
| 3D hero reveal | `premium` |
| 3D environment extension | `premium` |
| Tracking/masking/occlusion-heavy 3D | `premium` |
| Real Motion-style realistic 3D overlay | `premium` |

Rules:

- Premium 3D must be itemized.
- 3D generation/rendering/compositing requires estimate and approval.
- Optional 3D should have lower-cost alternatives.
- Lower-cost alternatives can include graphic design card, B-roll, caption emphasis, Stroke Motion, or no extra visual.
- No generation before approval.
- Tracking, masking, occlusion, source/model review, and brand review increase credit impact.

## 3D QA

3D-specific QA checks:

- 3D has story/meaning reason.
- 3D role is defined.
- 3D is not random decoration.
- B-roll versus overlay behavior is clear.
- Screen placement is safe.
- Face/expression protected.
- Captions readable.
- Important product/action protected.
- Scale/depth/perspective fit the intent.
- Lighting/material/shadow/contact strategy fits intent.
- Edge/compositing behavior fits style.
- Tracking/masking/occlusion planned if needed.
- Screen interaction source status safe.
- Source/model/provenance notes present.
- User preference honored.
- Repetition avoided.
- Motion not distracting.
- Audio/SFX speech safety.
- Reference not copied.
- Credit/approval compliance.
- Lower-cost alternative present for optional premium 3D.

Blocking examples:

- Premium/generated 3D without approval.
- 3D role missing.
- 3D covers face/captions/product/action.
- 3D screen interaction invents exact UI/source details.
- Sensitive screen/source data visible without redaction plan.
- 3D contradicts user "no extra visuals" instruction.
- 3D requires tracking/masking/occlusion but has no readiness/approval path.

Warning examples:

- 3D may be too flashy.
- 3D material may not match premium tone.
- 3D motion may be too much for speech.
- 3D object pattern repeated too often.
- Graphic label/caption spacing needs adjustment.
- Lower-cost alternative should be clearer.

## Revision Behavior

Safe revision options:

- Remove 3D.
- Make 3D subtler.
- Make 3D more premium.
- Make 3D more realistic.
- Make 3D more stylized.
- Make 3D less flashy.
- Move 3D to another safe zone.
- Convert 3D overlay to 3D B-roll.
- Convert 3D to graphic design card.
- Convert 3D to Stroke Motion or simple motion graphic.
- Remove tracking/occlusion complexity.
- Reduce material/glow/reflection/shadow intensity.
- Slow down 3D motion.
- Reduce rotation/camera movement.
- Use no 3D for this moment.
- Lower credit cost.
- Regenerate concept options later.

Revision requires a new credit estimate and approval when it adds premium generation, changes source/model/provider dependency, increases credit impact, adds advanced tracking/masking/occlusion/compositing, changes approved timing materially, introduces new Real Motion/SFX/render work, changes product/source/proof behavior, or changes brand/product replication. Revisions that simplify, remove, or reduce cost may still need plan snapshot updates, but do not imply execution without approval.

## Examples

### Example 1: Simple Clean Talking Head Rejects 3D

| Field | Value |
| --- | --- |
| `skill_key` | `three_d_visual` |
| `three_d_role` | `no_3d` |
| `object_type` | `none` |
| `planning_reason` | Speaker emotion and direct eye contact carry the moment better than an added object. |
| `restraint_decision` | `reject_3d_clean_edit_stronger` |
| `b_roll_or_overlay` | `none` |
| `timing_summary` | No 3D timing. |
| `spatial_composition_summary` | Preserve full speaker frame and captions. |
| `material_style_intent` | `none` |
| `motion_behavior_summary` | No 3D motion. |
| `audio_relationship_summary` | Keep voice-first mix. |
| `credit_impact` | `none` |
| `approval_required` | `false` |
| `lower_cost_alternative` | `no extra visual` |
| `QA checks` | 3D rejected for restraint, captions safe, user preference honored. |

### Example 2: Real Estate Wireframe Overlay

| Field | Value |
| --- | --- |
| `skill_key` | `three_d_visual` |
| `three_d_role` | `three_d_architectural_model` |
| `object_type` | `wireframe floor plan` |
| `planning_reason` | A subtle blueprint overlay helps viewers understand the property layout. |
| `restraint_decision` | `optional_premium_3d_if_approved` |
| `b_roll_or_overlay` | `overlay` |
| `timing_summary` | Appears after the room reveal and holds for 3 seconds. |
| `spatial_composition_summary` | Upper-right safe zone, no face overlap, captions above all. |
| `material_style_intent` | `wireframe_blueprint` |
| `motion_behavior_summary` | Soft draw-on, hold still, fade out before cut. |
| `audio_relationship_summary` | Optional quiet blueprint shimmer, not under speech. |
| `credit_impact` | `premium` |
| `approval_required` | `true` |
| `lower_cost_alternative` | `2D floor-plan graphic card` |
| `QA checks` | Space evidence available, no invented dimensions, caption safe, approval required. |

### Example 3: Product Feature Breakout

| Field | Value |
| --- | --- |
| `skill_key` | `three_d_visual` |
| `three_d_role` | `three_d_product_feature_breakout` |
| `object_type` | `product internal component` |
| `planning_reason` | The feature is hidden in normal footage and 3D clarifies how it works. |
| `restraint_decision` | `use_featured_3d_for_clarity` |
| `b_roll_or_overlay` | `overlay` |
| `timing_summary` | Starts on feature phrase, holds through explanation, exits before product action. |
| `spatial_composition_summary` | Right midground, avoid face and demo hands. |
| `material_style_intent` | `realistic_product` |
| `motion_behavior_summary` | Component separates once, settles, label appears after settle. |
| `audio_relationship_summary` | Optional soft mechanical settle during pause. |
| `credit_impact` | `premium` |
| `approval_required` | `true` |
| `lower_cost_alternative` | `Graphic feature card with product still` |
| `QA checks` | Model/source status confirmed, no invented feature, tracking safe, caption safe. |

### Example 4: Education System Visualization

| Field | Value |
| --- | --- |
| `skill_key` | `three_d_visual` |
| `three_d_role` | `three_d_explainer_visual` |
| `object_type` | `three-part system model` |
| `planning_reason` | The lesson is spatial and a 3D model clarifies the relationship between parts. |
| `restraint_decision` | `use_support_3d_if_readable` |
| `b_roll_or_overlay` | `B-roll` |
| `timing_summary` | Full-frame insert between talking-head beats. |
| `spatial_composition_summary` | Separate B-roll scene; captions continue safely. |
| `material_style_intent` | `stylized_explainer` |
| `motion_behavior_summary` | Stagger parts in, hold labels, simple exit. |
| `audio_relationship_summary` | Music only, no SFX needed. |
| `credit_impact` | `medium` |
| `approval_required` | `false` for planning, `true` before generation. |
| `lower_cost_alternative` | `2D diagram build` |
| `QA checks` | Hierarchy clear, not too fast, no unsupported runtime claim. |

### Example 5: Marketing Hero Reveal

| Field | Value |
| --- | --- |
| `skill_key` | `three_d_visual` |
| `three_d_role` | `three_d_hero_reveal` |
| `object_type` | `offer/product hero object` |
| `planning_reason` | The offer reveal is the main payoff and user preference supports premium visuals. |
| `restraint_decision` | `premium_hero_requires_approval` |
| `b_roll_or_overlay` | `hero` |
| `timing_summary` | Reveal on hook payoff, hold 1.5 seconds, exit into CTA. |
| `spatial_composition_summary` | Center hero, captions shift above safe lower band. |
| `material_style_intent` | `cinematic_object` |
| `motion_behavior_summary` | Slow orbit, light sweep, settle before CTA copy. |
| `audio_relationship_summary` | SFX hit only if speech has pause. |
| `credit_impact` | `premium` |
| `approval_required` | `true` |
| `lower_cost_alternative` | `Premium graphic design hero card` |
| `QA checks` | Credit approved, not under dense speech, reference not copied. |

### Example 6: Testimonial Symbolic Metaphor Optional

| Field | Value |
| --- | --- |
| `skill_key` | `three_d_visual` |
| `three_d_role` | `three_d_symbolic_metaphor` |
| `object_type` | `unlock metaphor` |
| `planning_reason` | A subtle unlock metaphor could support transformation, but credibility matters more. |
| `restraint_decision` | `optional_reject_if_tone_feels_gimmicky` |
| `b_roll_or_overlay` | `B-roll` |
| `timing_summary` | Only in short pause after result statement. |
| `spatial_composition_summary` | Full-frame abstract insert, no fake proof. |
| `material_style_intent` | `abstract_symbolic` |
| `motion_behavior_summary` | Gentle open, hold, fade. |
| `audio_relationship_summary` | No SFX unless user approves. |
| `credit_impact` | `medium` / `high` |
| `approval_required` | `true` if generated. |
| `lower_cost_alternative` | `No extra visual or simple caption emphasis` |
| `QA checks` | Does not imply false result, tone respectful, optional. |

### Example 7: Browser/App Screen Interaction

| Field | Value |
| --- | --- |
| `skill_key` | `three_d_visual` |
| `three_d_role` | `three_d_screen_interaction` |
| `object_type` | `3D module card` |
| `planning_reason` | A dimensional module emerging from a user-provided app screen clarifies the feature. |
| `restraint_decision` | `use_if_source_status_clear` |
| `b_roll_or_overlay` | `screen_interaction` |
| `timing_summary` | Starts after screen appears, holds during feature mention. |
| `spatial_composition_summary` | Attached to uploaded app screen; avoid invented labels and redact sensitive data. |
| `material_style_intent` | `holographic_ui` |
| `motion_behavior_summary` | Card lifts from screen plane, settles, no spin. |
| `audio_relationship_summary` | Optional soft UI tick, not under speech. |
| `credit_impact` | `high` / `premium` |
| `approval_required` | `true` |
| `lower_cost_alternative` | `Graphic callout over uploaded screenshot` |
| `QA checks` | Source provided, no invented UI details, redaction planned, caption safe. |

### Example 8: 3D Object B-roll For Missing Source Footage

| Field | Value |
| --- | --- |
| `skill_key` | `three_d_visual` |
| `three_d_role` | `three_d_object_broll` |
| `object_type` | `generic device object` |
| `planning_reason` | Source B-roll is missing, and a generic object can support the spoken point without scene integration. |
| `restraint_decision` | `use_broll_not_overlay` |
| `b_roll_or_overlay` | `B-roll` |
| `timing_summary` | Full-frame insert for one sentence. |
| `spatial_composition_summary` | Separate 3D scene, no face/caption collision. |
| `material_style_intent` | `matte_minimal` |
| `motion_behavior_summary` | Slow turn, hold, cut back to speaker. |
| `audio_relationship_summary` | Music bed only. |
| `credit_impact` | `medium` / `high` |
| `approval_required` | `true` before generation. |
| `lower_cost_alternative` | `Stock/source B-roll search later or graphic icon card` |
| `QA checks` | Does not imply exact product proof, lower integration burden, safe. |

### Example 9: Rejected 3D Transition Object

| Field | Value |
| --- | --- |
| `skill_key` | `three_d_visual` |
| `three_d_role` | `three_d_transition_object` |
| `object_type` | `floating logo cube` |
| `planning_reason` | Considered for a segment transition, but the cut is minor and does not earn premium cost. |
| `restraint_decision` | `reject_3d_transition_cost_not_earned` |
| `b_roll_or_overlay` | `transition_object_rejected` |
| `timing_summary` | Use simple cut instead. |
| `spatial_composition_summary` | No 3D object; preserve speaker and captions. |
| `material_style_intent` | `none` |
| `motion_behavior_summary` | No 3D motion. |
| `audio_relationship_summary` | No SFX. |
| `credit_impact` | `none` |
| `approval_required` | `false` |
| `lower_cost_alternative` | `clean cut or subtle transition` |
| `QA checks` | Restraint decision documented, no random 3D transition. |

### Example 10: Convert 3D To Graphic Design Alternative

| Field | Value |
| --- | --- |
| `skill_key` | `three_d_visual` |
| `three_d_role` | `three_d_data_visualization` |
| `object_type` | `growth metric object` |
| `planning_reason` | 3D was considered for a metric reveal, but a graphic card is clearer and cheaper. |
| `restraint_decision` | `replace_with_graphic_design` |
| `b_roll_or_overlay` | `none` |
| `timing_summary` | Graphic card appears on metric phrase. |
| `spatial_composition_summary` | 2D card in safe zone, no 3D. |
| `material_style_intent` | `none` |
| `motion_behavior_summary` | Simple graphic reveal. |
| `audio_relationship_summary` | No 3D SFX. |
| `credit_impact` | `low` / `medium` |
| `approval_required` | `false` for graphic planning. |
| `lower_cost_alternative` | `selected graphic design card` |
| `QA checks` | Metric source safe, no fake 3D proof, cost reduced. |

## Anti-Patterns

Avoid these 3D planning failures:

- 3D name only.
- 3D everywhere.
- 3D object with no role.
- 3D used because it is "cool" but not meaningful.
- Same floating object repeated mechanically.
- 3D covers face/expression.
- 3D covers captions.
- 3D covers product/action.
- 3D has no screen placement.
- 3D has no scale/depth plan.
- 3D has no lighting/material/shadow/contact intent.
- 3D assumes tracking/masking/occlusion without readiness/approval.
- 3D screen interaction invents exact UI or dashboard details.
- 3D mimics reference too closely.
- 3D generated without credit estimate.
- Premium 3D without approval.
- 3D chosen before creative concept.
- Worker execution from raw prompt only.
- 3D model/source/provenance ignored.
- 3D turns premium edit into gimmick.

## Future Implementation Notes

Possible future records/tables/types could include:

- `three_d_visual_plans`
- `three_d_spatial_composition_plans`
- `three_d_motion_behavior_plans`
- `three_d_source_model_plans`
- `three_d_qa_requirements`
- `edit_plan_skill_routes` with 3D-related skill keys
- `overlay_compositing_plans`
- `motion_design_plans`
- `graphic_design_plans`
- `storytiming_coordination_records`
- `real_motion_plans` when 3D routes into Real Motion-style overlay behavior later

This document does not create those records now. Future schema/types must avoid duplicating this document's source truth. Future B-roll, caption, SoundSync, and StoryTiming contracts should reference this 3D contract when 3D behavior is needed. Runtime 3D/model/provider implementation remains future gated work.

Existing 3D-adjacent and overlap owners include:

- `docs/creative-skills/source-of-truth-map.md`
- `docs/creative-skills/duplicate-lane-checklist.md`
- `docs/tool-calling/studies/three_js.json`
- `docs/tool-calling/studies/babylon_js.json`
- `docs/tool-calling/studies/cesium_js.json`
- `src/types/reeditpro.ts`
- `src/lib/mock-planner.ts`
- `src/lib/planner-validation.ts`
- `src/lib/render-strategy-planner.ts`
- `src/lib/tool-strategy-planner.ts`
- `src/lib/depth-aware-overlay-planner.ts`
- `src/lib/speaker-visual-layout-planner.ts`
- `src/backend/services/storytiming-event-service.ts`
- `src/backend/services/storytiming-qa-service.ts`
- `docs/sfx-timing-trim-alignment.md`
- `docs/sfx-provider-prompting.md`
- `docs/creative-skills/transition-planning-contract.md`
- `docs/creative-skills/overlay-compositing-planning-contract.md`
- `docs/creative-skills/graphic-design-planning-contract.md`
- `docs/creative-skills/motion-design-planning-contract.md`

This contract is the 3D visual planning doctrine and specialized field envelope. It must not create a parallel Real Motion, depth-aware overlay, StoryTiming, SoundSync/SFX, render strategy, Remotion, provider prompt, tool registry, browser capture, worker, QA, credit, or Supabase lane.

## Next Prompt Handoff

Recommended next prompt:

`RP-SKILLS-08 - B-roll Planning Contract`

Scope:

Docs-only B-roll planning contract that inherits the universal, overlay/compositing, graphic design, motion design, and 3D contracts where relevant and defines B-roll roles, source types, proof/context behavior, full-frame versus inset behavior, existing footage versus generated/future source, 3D object B-roll relationship, browser/app B-roll safety, timing, audio/caption relationships, credit/approval behavior, and B-roll QA.
