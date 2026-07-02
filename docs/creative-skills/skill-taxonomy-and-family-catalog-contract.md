# Skill Taxonomy And Family Catalog Contract

## Purpose

This document defines the future ReeditPro Creative Skill taxonomy and Skill Family Catalog contract.

This is documentation only. It does not create schema, code, prompts, TypeScript contracts, migrations, workers, UI, providers, rendering, skill resolver code, catalog storage, runtime skill catalog loading, runtime orchestration, package changes, Supabase connections, SQL, credentials, or app behavior.

The contract defines official naming, grouping, launch skill list, duplicate prevention, lifecycle metadata, aliases, relationship rules, and planning-contract mapping for future skill records. It does not execute skills.

This document does not replace existing source truths for signature systems, edit quality, StoryTiming, generation providers, tools, jobs, credits, approval, media, QA, or Supabase planning. It is a navigation and planning metadata layer over those owners.

## Skill Taxonomy Doctrine

The taxonomy is not a menu of effects.

The taxonomy is ReeditPro's professional editing vocabulary. It tells the AI what creative capabilities exist, how they are grouped, how they map to planning contracts, and how they should be named without duplicating or blurring responsibilities.

Skill taxonomy is vocabulary, not runtime execution.

A skill is a professional creative capability. A skill family groups related capabilities. A skill key identifies a specific creative capability. A skill key must be stable, lowercase, snake_case, and specific.

A skill must map to at least one planning contract. A skill should never be selected without a planning reason. No skill should execute from only a skill name.

A skill is not the same as a tool, worker, provider, prompt, frontend UI component, workflow label, credit tier, or one-click effect. A skill can be preferred or blocked by edit preference, but preference does not force execution.

A skill can be recommended, optional, rejected, blocked, or superseded. A skill can have lower-cost alternatives. A skill can also be a no-action skill, such as `no_captions`, `no_3d`, `no_music`, `no_transition`, or `no_b_roll`, when restraint is the professional decision.

Core principle:

"Skill taxonomy gives the AI vocabulary; planning contracts give the AI discipline."

## Boundaries

| Concept | What it is | What it is not | Example |
| --- | --- | --- | --- |
| `skill_family` | A canonical group of related creative capabilities. | A runtime module, UI nav group, or provider category. | `three_d_visuals` is a family. |
| `skill_key` | Stable canonical identifier for one creative capability. | A display label, alias, tool name, prompt name, or route name. | `three_d_object_broll` is a skill key. |
| `skill_role` | The role a skill plays in a specific plan. | A separate canonical skill unless it has distinct planning needs. | `object B-roll` is a role. |
| `subskill` | A narrower documented mode under a skill. | A duplicate key created only for wording variation. | `keyword emphasis` under `caption_design`. |
| `planning_contract_type` | The docs contract that defines required planning fields and QA. | An executable schema or TypeScript type in this prompt. | `three_d_visual_planning_contract`. |
| `tool_candidate` | A possible future implementation tool. | A skill. | Three.js or Babylon.js would be tool candidates later, not skills. |
| `worker_target` | A possible future worker or orchestration target. | A skill or approval to run a worker. | Real Motion Worker would be a future worker, not a skill. |
| `provider_candidate` | A possible downstream provider or model family. | A skill key or permission to call a provider. | A video generation provider is not a skill. |
| `prompt_contract` | A future prompt shape that plans or translates a skill. | The skill itself or a runtime prompt execution. | A prompt that plans 3D is a prompt contract, not the skill itself. |
| `UI affordance` | A button, chip, slider, card, or chat action that lets a user express intent. | The skill itself or proof the skill is selected. | A frontend button for "more 3D" is a UI affordance, not the skill. |

## Naming Rules

Skill key rules:

- Use lowercase snake_case only.
- Use nouns or noun phrases where possible.
- Include the family prefix only when it prevents ambiguity.
- Avoid vague names like `cool_effect`, `enhance`, `magic`, `viral`, or `wow_effect`.
- Avoid tool names as skill names.
- Avoid provider names as skill names.
- Avoid workflow names as skill names.
- Avoid credit or tier names as skill names.
- Avoid hard-coded style names from a reference.
- Use `future` only in docs notes, not as a skill key unless absolutely necessary.
- Use `no_*` skill keys for intentional restraint decisions.
- Keep aliases separate from canonical keys.
- Never create a duplicate skill key with the same meaning.
- Deprecate rather than silently rename once implemented later.

Good names:

- `clean_cuts`
- `pacing_cleanup`
- `transition_design`
- `caption_design`
- `caption_animation`
- `b_roll_planning`
- `graphic_design_visual_explain`
- `motion_design_overlay`
- `three_d_object_broll`
- `three_d_overlay_integration`
- `soundsync_music_planning`
- `sfx_design`
- `no_3d`

Bad names:

- `cool_3d`
- `viral_magic`
- `use_threejs`
- `premium_effect`
- `qwen_animation`
- `reference_style_clone`
- `make_it_pop`
- `auto_broll_everywhere`

## Canonical Top-level Skill Families

| Family | Purpose | Belongs here | Does not belong here | Primary planning contract(s) | Notes |
| --- | --- | --- | --- | --- | --- |
| `core_editing` | Foundation edit decisions. | Cuts, pacing cleanup, dead space, filler, mistakes, source order, structure. | Decorative visual effects or provider work. | `universal_skill_plan` | Foundation for every edit. |
| `story_timing` | Cross-skill timing and focus coordination. | Focus/density budgets, conflicts, story windows. | Individual skill execution. | `storytiming_coordination_contract` | Coordinates all families. |
| `caption` | Spoken/text meaning on screen. | Caption design, animation, line breaks, emphasis, accessibility. | General overlays or proof cards. | `caption_planning_contract`, `overlay_compositing_planning_contract` | Text overlay family with its own contract. |
| `transition` | Meaningful edge behavior between moments. | Clean cuts, bridge transitions, graphic/object/3D transitions. | Random effects. | `transition_planning_contract` | Can involve motion, SFX, graphics, B-roll, or 3D. |
| `b_roll` | Supporting visuals that prove, clarify, cover, or emotionally support. | Source B-roll, cutaways, proof/context visuals, insets. | Captions, lower thirds, or unrelated stock. | `b_roll_planning_contract`, `overlay_compositing_planning_contract` | Can include screen, future generated, or 3D B-roll planning. |
| `overlay_compositing` | Layering and screen-safe placement. | Safe zones, layer order, collision avoidance, masks, edge treatment. | Core caption language or graphic hierarchy by itself. | `overlay_compositing_planning_contract` | Supports many visual families. |
| `graphic_design` | VisualExplain and structured graphic communication. | Lower thirds, callouts, proof cards, diagrams, CTA cards. | Raw source footage or standalone 3D. | `graphic_design_planning_contract`, `overlay_compositing_planning_contract` | Existing signature-system overlap. |
| `motion_design` | Planned motion language. | Overlay motion, graphic reveals, kinetic type, beat-aware motion. | Transition family by itself or runtime animation code. | `motion_design_planning_contract` | Supports many visual families. |
| `three_d_visuals` | Dimensional visual ideas with role and placement. | 3D B-roll, overlays, screen interactions, explainers, hero reveals. | Three.js/Babylon.js runtime or model loading. | `three_d_visual_planning_contract` | Tool-agnostic and approval-aware. |
| `stroke_motion` | Meaning-first drawn/marked story layer. | Spoken story, source reading, meaning expansion, connected transitions. | Generic scribbles or animation runtime. | `motion_design_planning_contract`, `overlay_compositing_planning_contract` | Signature-system overlap. |
| `real_motion` | Realistic overlay-first visual system. | Object integration, face-safe placement, hero moments. | Generic 3D or provider calls. | `overlay_compositing_planning_contract`, `motion_design_planning_contract` | Signature-system overlap and premium-heavy. |
| `browser_app_visuals` | Browser/app/screen visual planning. | Frames, app screens, dashboard visuals, annotations, redaction. | Browser capture runtime or private-page access. | `overlay_compositing_planning_contract`, `graphic_design_planning_contract` | Current browser capture planning files remain missing. |
| `audio_cleanup` | Voice-first cleanup and audio consistency. | Noise reduction planning, leveling, ambience, room tone. | Music generation or SFX design. | `sound_music_planning_contract` | Must protect speech. |
| `soundsync` | Music, rhythm, cue, ducking, and mood planning. | Music cues, beat maps, reference music guidance, generated music future planning. | Audio provider calls or music generation. | `sound_music_planning_contract`, `storytiming_coordination_contract` | Root requested music docs are missing. |
| `sfx` | Planned sound effects. | Transition SFX, graphic reveal SFX, object SFX, motion support. | Automatic SFX everywhere. | `sound_music_planning_contract`, `transition_planning_contract` | Supports visuals and timing. |
| `color_finish` | Color and final look planning. | Color mood, consistency, platform finish. | Design tokens or render runtime. | `universal_skill_plan` | Future specialized contract may be needed. |
| `render_export` | Render/export package planning. | Render manifests, aspect adaptation, preview/export packaging. | Actual render/export execution. | `universal_skill_plan`, `storytiming_coordination_contract` | Must stay downstream of approved plans. |
| `qa` | Quality checks across planning. | Professional edit QA, caption QA, density QA, source safety. | Skill selection by itself. | `universal_skill_plan`, `storytiming_coordination_contract` | Cross-cutting family. |
| `approval_credit` | Approval and credit planning. | Credit estimates, premium approval, lower-cost alternatives. | Ledger mutation or payment logic. | `universal_skill_plan`, `edit_preference_creative_direction_contract` | Hints only, not spend. |
| `reference_dna` | Safe reference influence. | Style adaptation, do-not-copy rules, caption/transition/music guidance. | Reference cloning. | `universal_skill_plan`, `edit_preference_creative_direction_contract` | Guidance, not execution. |
| `edit_preference` | Preference resolution and skill scoring influence. | Preference snapshots, conflicts, preferred/blocked scoring. | Settings UI or profile storage. | `edit_preference_creative_direction_contract` | Planning context only. |

## Skill Family Relationship Model

- `core_editing` is the foundation for every plan.
- `story_timing` coordinates all families.
- `caption` is an overlay/text family but has its own contract.
- `transition` can involve motion, SFX, B-roll, 3D, or graphics.
- `b_roll` can be source footage, screen visual, generated future planning, or 3D B-roll.
- `overlay_compositing` supports captions, graphics, 3D, Real Motion, Stroke Motion, B-roll insets, and browser/app visuals.
- `graphic_design` uses overlay/compositing and may use motion.
- `motion_design` supports transitions, overlays, graphics, captions, 3D, Stroke Motion, and Real Motion.
- `three_d_visuals` can be B-roll, overlay, screen interaction, explainer, transition, or hero visual.
- `stroke_motion` is a signature system and meaning-first story layer.
- `real_motion` is a signature system and realistic overlay-first visual system.
- `soundsync` and `sfx` support timing, mood, transitions, visuals, and speech clarity.
- `qa` cuts across all families.

## Launch Skill List

This launch list is documentation-only taxonomy. It is not a registry, database seed, runtime resolver, TypeScript enum, prompt route, or UI list.

### Core Editing

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `clean_cuts` | Clean Cuts | `core_editing` | Use precise edits without visible transition effects. | `universal_skill_plan` | `none` | `no_approval_needed` | Professional restraint skill. |
| `pacing_cleanup` | Pacing Cleanup | `core_editing` | Improve pace while preserving meaning. | `universal_skill_plan` | `low` | `no_approval_needed` | Source/truth aware. |
| `dead_space_removal` | Dead Space Removal | `core_editing` | Remove unneeded silence or visual dead space. | `universal_skill_plan` | `low` | `no_approval_needed` | Must not remove intentional pauses. |
| `filler_removal` | Filler Removal | `core_editing` | Remove filler speech where safe. | `universal_skill_plan` | `low` | `approval_if_user_visible` | Transcript meaning must be protected. |
| `mistake_removal` | Mistake Removal | `core_editing` | Remove mistakes or restarts. | `universal_skill_plan` | `low` | `approval_if_user_visible` | Preserve context. |
| `source_order_preservation` | Source Order Preservation | `core_editing` | Keep source sequence intentional. | `universal_skill_plan` | `none` | `no_approval_needed` | References source sequence owners. |
| `recommended_structure_planning` | Recommended Structure Planning | `core_editing` | Propose edit structure. | `universal_skill_plan` | `low` | `approval_if_user_visible` | Plan-first only. |

### Story Timing

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `storytiming_coordination` | StoryTiming Coordination | `story_timing` | Coordinate focus, density, and timing across skills. | `storytiming_coordination_contract` | `medium` | `approval_if_user_visible` | Coordinates all selected skills. |
| `story_beat_mapping` | Story Beat Mapping | `story_timing` | Map meaning and narrative beats. | `storytiming_coordination_contract` | `low` | `no_approval_needed` | Supports timing. |
| `focus_density_budgeting` | Focus Density Budgeting | `story_timing` | Budget visual/audio focus by window. | `storytiming_coordination_contract` | `low` | `no_approval_needed` | Preference-aware. |
| `skill_conflict_resolution` | Skill Conflict Resolution | `story_timing` | Resolve collisions and competing skills. | `storytiming_coordination_contract` | `low` | `user_confirmation_needed` | May affect visible plan. |

### Caption

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `no_captions` | No Captions | `caption` | Intentionally omit captions. | `caption_planning_contract` | `none` | `no_approval_needed` | Valid restraint unless accessibility requires confirmation. |
| `caption_design` | Caption Design | `caption` | Plan readable caption style. | `caption_planning_contract` | `low` | `approval_if_user_visible` | Canonical caption skill. |
| `caption_animation` | Caption Animation | `caption` | Plan caption motion/emphasis. | `caption_planning_contract` | `medium` | `approval_if_user_visible` | Must protect readability. |
| `caption_line_breaking` | Caption Line Breaking | `caption` | Plan line breaks and read time. | `caption_planning_contract` | `low` | `no_approval_needed` | Meaning-first. |
| `caption_keyword_emphasis` | Caption Keyword Emphasis | `caption` | Emphasize important words. | `caption_planning_contract` | `low` | `approval_if_user_visible` | Avoid meaning changes. |
| `caption_speaker_identification` | Caption Speaker Identification | `caption` | Label speakers when useful. | `caption_planning_contract` | `low` | `approval_if_user_visible` | Requires accuracy. |
| `caption_accessibility_planning` | Caption Accessibility Planning | `caption` | Plan accessibility-first captions. | `caption_planning_contract` | `low` | `no_approval_needed` | May override style preference with documentation. |
| `caption_translation_future_planning` | Caption Translation Future Planning | `caption` | Plan future translation needs. | `caption_planning_contract` | `variable` | `approval_always` | Does not implement translation. |

### Transition

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `no_transition` | No Transition | `transition` | Use no designed transition. | `transition_planning_contract` | `none` | `no_approval_needed` | Clean cuts can be premium. |
| `transition_design` | Transition Design | `transition` | Plan meaningful transitions. | `transition_planning_contract` | `medium` | `approval_if_user_visible` | Canonical transition skill. |
| `clean_cut_transition` | Clean Cut Transition | `transition` | Use clean cuts as transition language. | `transition_planning_contract` | `none` | `no_approval_needed` | Restraint option. |
| `ambient_bridge_transition` | Ambient Bridge Transition | `transition` | Bridge with ambience or atmosphere. | `transition_planning_contract` | `low` | `approval_if_user_visible` | Coordinates with SoundSync. |
| `sound_bridge_transition` | Sound Bridge Transition | `transition` | Bridge using audio continuity. | `transition_planning_contract` | `low` | `approval_if_user_visible` | Protect speech. |
| `graphic_transition` | Graphic Transition | `transition` | Use graphic element as edge behavior. | `transition_planning_contract` | `medium` | `approval_if_user_visible` | Maps to graphic/motion contracts. |
| `object_transition` | Object Transition | `transition` | Use object motion or source action as transition. | `transition_planning_contract` | `medium` | `approval_if_user_visible` | Source/action aware. |
| `three_d_transition_object` | 3D Transition Object | `transition` | Use 3D object as transition element. | `transition_planning_contract` | `premium` | `approval_if_premium` | Also maps to 3D contract. |

### B-roll

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `no_b_roll` | No B-roll | `b_roll` | Intentionally omit B-roll. | `b_roll_planning_contract` | `none` | `no_approval_needed` | Valid restraint. |
| `b_roll_planning` | B-roll Planning | `b_roll` | Plan supporting B-roll. | `b_roll_planning_contract` | `medium` | `approval_if_user_visible` | Canonical B-roll skill. |
| `source_b_roll_selection` | Source B-roll Selection | `b_roll` | Select B-roll from existing source. | `b_roll_planning_contract` | `low` | `approval_if_user_visible` | Source-first. |
| `b_roll_cutaway` | B-roll Cutaway | `b_roll` | Cover or clarify with cutaway. | `b_roll_planning_contract` | `low` | `approval_if_user_visible` | Protect emotional moments. |
| `b_roll_proof_visual` | B-roll Proof Visual | `b_roll` | Show proof or evidence visual. | `b_roll_planning_contract` | `medium` | `source_confirmation_needed` | No invented evidence. |
| `b_roll_context_visual` | B-roll Context Visual | `b_roll` | Add context or atmosphere. | `b_roll_planning_contract` | `medium` | `approval_if_user_visible` | Avoid filler. |
| `b_roll_inset_layout` | B-roll Inset Layout | `b_roll` | Plan PIP/inset B-roll. | `b_roll_planning_contract` | `medium` | `approval_if_user_visible` | Uses overlay contract. |
| `generated_b_roll_future_planning` | Generated B-roll Future Planning | `b_roll` | Plan future generated B-roll. | `b_roll_planning_contract` | `premium` | `approval_always` | Does not generate media. |
| `three_d_object_broll` | 3D Object B-roll | `b_roll` | Use 3D object as B-roll. | `three_d_visual_planning_contract` | `premium` | `approval_if_premium` | Also belongs to 3D visuals. |

### Overlay Compositing

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `no_overlay` | No Overlay | `overlay_compositing` | Intentionally omit overlays. | `overlay_compositing_planning_contract` | `none` | `no_approval_needed` | Valid restraint. |
| `overlay_compositing` | Overlay Compositing | `overlay_compositing` | Plan layered visual composition. | `overlay_compositing_planning_contract` | `medium` | `approval_if_user_visible` | Canonical overlay skill. |
| `safe_zone_layout` | Safe Zone Layout | `overlay_compositing` | Protect platform and source-safe zones. | `overlay_compositing_planning_contract` | `low` | `no_approval_needed` | Supports many families. |
| `face_safe_placement` | Face-safe Placement | `overlay_compositing` | Protect faces, eyes, mouth, expression. | `overlay_compositing_planning_contract` | `low` | `no_approval_needed` | Blocking QA if missing. |
| `caption_collision_avoidance` | Caption Collision Avoidance | `overlay_compositing` | Avoid caption/visual collisions. | `overlay_compositing_planning_contract` | `low` | `no_approval_needed` | Coordinates captions. |
| `layer_order_planning` | Layer Order Planning | `overlay_compositing` | Plan visual stack order. | `overlay_compositing_planning_contract` | `low` | `no_approval_needed` | Prevents clutter. |
| `edge_treatment_planning` | Edge Treatment Planning | `overlay_compositing` | Plan persistent overlay edges. | `overlay_compositing_planning_contract` | `low` | `approval_if_user_visible` | Supports polish. |
| `tracking_masking_future_planning` | Tracking/Masking Future Planning | `overlay_compositing` | Plan future tracking/masking needs. | `overlay_compositing_planning_contract` | `high` | `approval_if_premium` | Does not execute tracking. |

### Graphic Design

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `no_graphic_design` | No Graphic Design | `graphic_design` | Intentionally omit graphic design. | `graphic_design_planning_contract` | `none` | `no_approval_needed` | Valid restraint. |
| `graphic_design_visual_explain` | Graphic Design VisualExplain | `graphic_design` | Explain ideas through designed graphics. | `graphic_design_planning_contract` | `medium` | `approval_if_user_visible` | Canonical VisualExplain skill. |
| `lower_third_design` | Lower Third Design | `graphic_design` | Plan lower thirds. | `graphic_design_planning_contract` | `low` | `approval_if_user_visible` | Keep readable. |
| `feature_callout_design` | Feature Callout Design | `graphic_design` | Highlight product or feature details. | `graphic_design_planning_contract` | `medium` | `source_confirmation_needed` | No invented UI/claims. |
| `proof_card_design` | Proof Card Design | `graphic_design` | Present source-backed proof. | `graphic_design_planning_contract` | `medium` | `source_confirmation_needed` | Evidence safety required. |
| `comparison_layout_design` | Comparison Layout Design | `graphic_design` | Compare items clearly. | `graphic_design_planning_contract` | `medium` | `approval_if_user_visible` | Hierarchy required. |
| `framework_diagram_design` | Framework Diagram Design | `graphic_design` | Explain framework or model. | `graphic_design_planning_contract` | `medium` | `approval_if_user_visible` | Education-friendly. |
| `cta_card_design` | CTA Card Design | `graphic_design` | Plan call-to-action cards. | `graphic_design_planning_contract` | `medium` | `approval_if_user_visible` | Claim/offer safety. |
| `browser_annotation_design` | Browser Annotation Design | `graphic_design` | Annotate browser/app visuals. | `graphic_design_planning_contract` | `medium` | `source_confirmation_needed` | No invented screens. |

### Motion Design

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `no_motion_design` | No Motion Design | `motion_design` | Intentionally omit motion design. | `motion_design_planning_contract` | `none` | `no_approval_needed` | Valid restraint. |
| `motion_design_overlay` | Motion Design Overlay | `motion_design` | Plan motion for overlays. | `motion_design_planning_contract` | `medium` | `approval_if_user_visible` | Canonical motion skill. |
| `graphic_reveal_motion` | Graphic Reveal Motion | `motion_design` | Reveal graphics with motion. | `motion_design_planning_contract` | `medium` | `approval_if_user_visible` | Readability first. |
| `callout_motion` | Callout Motion | `motion_design` | Move or reveal callouts. | `motion_design_planning_contract` | `medium` | `approval_if_user_visible` | Must not distract. |
| `diagram_build_motion` | Diagram Build Motion | `motion_design` | Build diagrams over time. | `motion_design_planning_contract` | `medium` | `approval_if_user_visible` | Education-friendly. |
| `kinetic_type_support` | Kinetic Type Support | `motion_design` | Support text with motion. | `motion_design_planning_contract` | `medium` | `approval_if_user_visible` | Not caption replacement. |
| `beat_aware_motion` | Beat-aware Motion | `motion_design` | Align motion to beat or rhythm. | `motion_design_planning_contract` | `high` | `approval_if_credit_bearing` | Coordinates SoundSync. |
| `hero_motion_moment` | Hero Motion Moment | `motion_design` | Plan a high-impact motion moment. | `motion_design_planning_contract` | `high` | `approval_if_premium` | StoryTiming protected. |

### 3D Visuals

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `no_3d` | No 3D | `three_d_visuals` | Intentionally omit 3D. | `three_d_visual_planning_contract` | `none` | `no_approval_needed` | Valid professional restraint. |
| `three_d_object_broll` | 3D Object B-roll | `three_d_visuals` | Use 3D object as B-roll. | `three_d_visual_planning_contract` | `premium` | `approval_if_premium` | Lower integration than overlay. |
| `three_d_overlay_integration` | 3D Overlay Integration | `three_d_visuals` | Integrate 3D into source frame. | `three_d_visual_planning_contract` | `premium` | `approval_if_premium` | Needs occlusion/safe-zone planning. |
| `three_d_screen_interaction` | 3D Screen Interaction | `three_d_visuals` | Make 3D interact with screen/app visual. | `three_d_visual_planning_contract` | `premium` | `approval_if_premium` | Browser/app safety. |
| `three_d_explainer_visual` | 3D Explainer Visual | `three_d_visuals` | Explain concept with 3D. | `three_d_visual_planning_contract` | `premium` | `approval_if_premium` | May have graphic alternative. |
| `three_d_symbolic_metaphor` | 3D Symbolic Metaphor | `three_d_visuals` | Use 3D metaphor for abstract idea. | `three_d_visual_planning_contract` | `premium` | `approval_if_premium` | Must avoid random decoration. |
| `three_d_hero_reveal` | 3D Hero Reveal | `three_d_visuals` | Plan a major 3D hero moment. | `three_d_visual_planning_contract` | `premium` | `approval_always` | StoryTiming-protected. |
| `three_d_environment_extension` | 3D Environment Extension | `three_d_visuals` | Extend or augment environment. | `three_d_visual_planning_contract` | `premium` | `approval_always` | Source/model provenance needed. |
| `three_d_transition_object` | 3D Transition Object | `three_d_visuals` | Use 3D object as transition. | `three_d_visual_planning_contract` | `premium` | `approval_if_premium` | Also transition family. |
| `three_d_data_visualization` | 3D Data Visualization | `three_d_visuals` | Present source-backed data in 3D. | `three_d_visual_planning_contract` | `premium` | `source_confirmation_needed` | No invented metrics. |
| `three_d_product_feature_breakout` | 3D Product Feature Breakout | `three_d_visuals` | Break out product features in 3D. | `three_d_visual_planning_contract` | `premium` | `approval_always` | Source/provenance required. |

### Stroke Motion

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `no_stroke_motion` | No Stroke Motion | `stroke_motion` | Intentionally omit Stroke Motion. | `motion_design_planning_contract` | `none` | `no_approval_needed` | Valid restraint. |
| `stroke_motion_story_layer` | Stroke Motion Story Layer | `stroke_motion` | Add meaning-first stroke layer. | `motion_design_planning_contract` | `high` | `approval_if_premium` | Signature-system overlap. |
| `stroke_motion_spoken_story_mode` | Stroke Motion Spoken Story Mode | `stroke_motion` | Support spoken story visually. | `motion_design_planning_contract` | `high` | `approval_if_premium` | Timing sensitive. |
| `stroke_motion_source_reading_mode` | Stroke Motion Source Reading Mode | `stroke_motion` | Trace or read source material. | `motion_design_planning_contract` | `high` | `source_confirmation_needed` | Source-safe. |
| `stroke_motion_meaning_expansion` | Stroke Motion Meaning Expansion | `stroke_motion` | Expand meaning with strokes. | `motion_design_planning_contract` | `high` | `approval_if_premium` | Not decoration. |
| `stroke_motion_connected_transition` | Stroke Motion Connected Transition | `stroke_motion` | Use strokes to connect moments. | `transition_planning_contract` | `high` | `approval_if_premium` | Also transition/motion. |

### Real Motion

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `no_real_motion` | No Real Motion | `real_motion` | Intentionally omit Real Motion. | `overlay_compositing_planning_contract` | `none` | `no_approval_needed` | Valid restraint. |
| `real_motion_overlay` | Real Motion Overlay | `real_motion` | Plan realistic overlay-first visual. | `overlay_compositing_planning_contract` | `premium` | `approval_if_premium` | Signature-system overlap. |
| `real_motion_object_integration` | Real Motion Object Integration | `real_motion` | Integrate realistic object into frame. | `overlay_compositing_planning_contract` | `premium` | `approval_always` | Face/source safe. |
| `real_motion_face_safe_placement` | Real Motion Face-safe Placement | `real_motion` | Plan Real Motion around face safety. | `overlay_compositing_planning_contract` | `high` | `approval_if_premium` | Required safety concept. |
| `real_motion_hero_moment` | Real Motion Hero Moment | `real_motion` | Plan a major Real Motion moment. | `overlay_compositing_planning_contract` | `premium` | `approval_always` | StoryTiming-protected. |

### Browser App Visuals

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `no_browser_app_visual` | No Browser/App Visual | `browser_app_visuals` | Intentionally omit browser/app visuals. | `overlay_compositing_planning_contract` | `none` | `no_approval_needed` | Valid restraint. |
| `browser_app_visual_planning` | Browser/App Visual Planning | `browser_app_visuals` | Plan browser/app visuals without capture runtime. | `overlay_compositing_planning_contract` | `medium` | `source_confirmation_needed` | Browser capture files missing. |
| `browser_frame_visual` | Browser Frame Visual | `browser_app_visuals` | Plan a browser frame visual. | `overlay_compositing_planning_contract` | `medium` | `source_confirmation_needed` | No invented sites. |
| `app_screen_visual` | App Screen Visual | `browser_app_visuals` | Plan an app screen visual. | `overlay_compositing_planning_contract` | `medium` | `source_confirmation_needed` | Source status required. |
| `dashboard_visual_planning` | Dashboard Visual Planning | `browser_app_visuals` | Plan dashboard visual support. | `graphic_design_planning_contract` | `medium` | `source_confirmation_needed` | No invented metrics. |
| `browser_annotation_visual` | Browser Annotation Visual | `browser_app_visuals` | Annotate browser/app visual. | `graphic_design_planning_contract` | `medium` | `source_confirmation_needed` | UI label safety. |
| `browser_redaction_planning` | Browser Redaction Planning | `browser_app_visuals` | Plan redaction of sensitive browser/app details. | `overlay_compositing_planning_contract` | `medium` | `source_confirmation_needed` | Privacy/safety. |
| `source_status_planning` | Source Status Planning | `browser_app_visuals` | Record source/proof status. | `universal_skill_plan` | `low` | `source_confirmation_needed` | Avoid invented evidence. |

### Audio Cleanup

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `voice_cleanup_planning` | Voice Cleanup Planning | `audio_cleanup` | Plan voice cleanup. | `sound_music_planning_contract` | `medium` | `approval_if_credit_bearing` | Voice-first. |
| `room_tone_preservation` | Room Tone Preservation | `audio_cleanup` | Preserve useful room tone. | `sound_music_planning_contract` | `low` | `no_approval_needed` | Naturalism. |
| `noise_reduction_planning` | Noise Reduction Planning | `audio_cleanup` | Plan noise reduction. | `sound_music_planning_contract` | `medium` | `approval_if_credit_bearing` | Avoid artifacts. |
| `audio_leveling_planning` | Audio Leveling Planning | `audio_cleanup` | Plan level consistency. | `sound_music_planning_contract` | `low` | `no_approval_needed` | Speech clarity. |
| `ambience_preservation` | Ambience Preservation | `audio_cleanup` | Preserve ambience where meaningful. | `sound_music_planning_contract` | `low` | `no_approval_needed` | Supports mood. |

### SoundSync

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `no_music` | No Music | `soundsync` | Intentionally omit music. | `sound_music_planning_contract` | `none` | `no_approval_needed` | Valid restraint. |
| `soundsync_music_planning` | SoundSync Music Planning | `soundsync` | Plan music role and mood. | `sound_music_planning_contract` | `medium` | `approval_if_user_visible` | Canonical music skill. |
| `music_cue_planning` | Music Cue Planning | `soundsync` | Plan music cue points. | `sound_music_planning_contract` | `medium` | `approval_if_user_visible` | StoryTiming-aware. |
| `music_ducking_planning` | Music Ducking Planning | `soundsync` | Plan speech-safe ducking. | `sound_music_planning_contract` | `low` | `no_approval_needed` | Speech protection. |
| `beat_map_planning` | Beat Map Planning | `soundsync` | Plan beat/rhythm map. | `sound_music_planning_contract` | `medium` | `approval_if_credit_bearing` | Supports transitions/motion. |
| `reference_music_dna_planning` | Reference Music DNA Planning | `soundsync` | Plan safe reference music influence. | `sound_music_planning_contract` | `medium` | `source_confirmation_needed` | Root requested doc missing. |
| `generated_music_future_planning` | Generated Music Future Planning | `soundsync` | Plan future generated music option. | `sound_music_planning_contract` | `premium` | `approval_always` | Does not generate music. |

### SFX

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `no_sfx` | No SFX | `sfx` | Intentionally omit SFX. | `sound_music_planning_contract` | `none` | `no_approval_needed` | Valid restraint. |
| `sfx_design` | SFX Design | `sfx` | Plan purposeful SFX. | `sound_music_planning_contract` | `medium` | `approval_if_user_visible` | No automatic SFX everywhere. |
| `transition_sfx_planning` | Transition SFX Planning | `sfx` | Plan SFX for transitions. | `sound_music_planning_contract` | `medium` | `approval_if_user_visible` | Coordinates transition contract. |
| `graphic_reveal_sfx` | Graphic Reveal SFX | `sfx` | Support graphic reveals with sound. | `sound_music_planning_contract` | `medium` | `approval_if_user_visible` | Use sparingly. |
| `motion_design_sfx` | Motion Design SFX | `sfx` | Support motion design. | `sound_music_planning_contract` | `medium` | `approval_if_user_visible` | Comfort-aware. |
| `three_d_object_sfx` | 3D Object SFX | `sfx` | Support 3D object moments. | `sound_music_planning_contract` | `high` | `approval_if_premium` | Coordinates 3D. |
| `stroke_motion_sfx` | Stroke Motion SFX | `sfx` | Support Stroke Motion. | `sound_music_planning_contract` | `high` | `approval_if_premium` | Signature-aware. |
| `real_motion_sfx` | Real Motion SFX | `sfx` | Support Real Motion. | `sound_music_planning_contract` | `high` | `approval_if_premium` | Signature-aware. |

### Color Finish

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `color_mood_planning` | Color Mood Planning | `color_finish` | Plan color mood. | `universal_skill_plan` | `low` | `approval_if_user_visible` | Future specialized contract possible. |
| `color_consistency_planning` | Color Consistency Planning | `color_finish` | Plan consistency across clips. | `universal_skill_plan` | `medium` | `approval_if_credit_bearing` | Not design-token work. |
| `premium_finish_planning` | Premium Finish Planning | `color_finish` | Plan premium final polish. | `universal_skill_plan` | `high` | `approval_if_premium` | Credit-aware. |
| `platform_export_finish_planning` | Platform Export Finish Planning | `color_finish` | Plan platform-specific finish needs. | `universal_skill_plan` | `medium` | `approval_if_user_visible` | Coordinates render/export. |

### Render Export

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `render_manifest_planning` | Render Manifest Planning | `render_export` | Plan future render manifest needs. | `storytiming_coordination_contract` | `medium` | `approval_if_user_visible` | Does not render. |
| `aspect_ratio_adaptation_planning` | Aspect Ratio Adaptation Planning | `render_export` | Plan aspect adaptations. | `universal_skill_plan` | `medium` | `approval_if_user_visible` | Safe zones matter. |
| `export_package_planning` | Export Package Planning | `render_export` | Plan export package contents. | `universal_skill_plan` | `low` | `approval_if_user_visible` | Does not export. |
| `preview_render_planning` | Preview Render Planning | `render_export` | Plan preview render readiness. | `storytiming_coordination_contract` | `medium` | `approval_if_credit_bearing` | No render execution. |

### QA

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `professional_edit_qa` | Professional Edit QA | `qa` | Validate professional edit quality. | `universal_skill_plan` | `low` | `no_approval_needed` | Cross-cutting. |
| `skill_plan_qa` | Skill Plan QA | `qa` | Validate skill plans. | `universal_skill_plan` | `low` | `no_approval_needed` | Contract adherence. |
| `storytiming_qa` | StoryTiming QA | `qa` | Validate coordination and timing. | `storytiming_coordination_contract` | `low` | `no_approval_needed` | Cross-skill. |
| `caption_readability_qa` | Caption Readability QA | `qa` | Validate caption readability. | `caption_planning_contract` | `low` | `no_approval_needed` | Blocking where needed. |
| `speech_clarity_qa` | Speech Clarity QA | `qa` | Validate speech clarity. | `sound_music_planning_contract` | `low` | `no_approval_needed` | Voice-first. |
| `visual_density_qa` | Visual Density QA | `qa` | Validate density and focus. | `storytiming_coordination_contract` | `low` | `no_approval_needed` | Preference-aware. |
| `credit_approval_qa` | Credit Approval QA | `qa` | Validate approval/credit handling. | `universal_skill_plan` | `low` | `no_approval_needed` | No spend. |
| `user_instruction_compliance_qa` | User Instruction Compliance QA | `qa` | Validate direct instruction compliance. | `edit_preference_creative_direction_contract` | `low` | `no_approval_needed` | High priority. |
| `source_safety_qa` | Source Safety QA | `qa` | Validate source/proof safety. | `universal_skill_plan` | `low` | `no_approval_needed` | No invented evidence. |

### Approval Credit

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `credit_estimate_planning` | Credit Estimate Planning | `approval_credit` | Plan future credit estimates. | `universal_skill_plan` | `none` | `no_approval_needed` | Does not reserve credits. |
| `premium_skill_approval` | Premium Skill Approval | `approval_credit` | Plan approval need for premium skills. | `universal_skill_plan` | `none` | `approval_always` | Does not approve itself. |
| `lower_cost_alternative_planning` | Lower-cost Alternative Planning | `approval_credit` | Identify lower-cost alternatives. | `universal_skill_plan` | `none` | `no_approval_needed` | Required for heavy optional ideas. |
| `credit_reservation_gate_planning` | Credit Reservation Gate Planning | `approval_credit` | Plan where credit reservation would be required. | `universal_skill_plan` | `none` | `approval_if_credit_bearing` | No ledger mutation. |

### Reference DNA

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `reference_dna_style_adaptation` | Reference DNA Style Adaptation | `reference_dna` | Adapt style safely. | `edit_preference_creative_direction_contract` | `low` | `source_confirmation_needed` | No cloning. |
| `reference_dna_do_not_copy_rules` | Reference DNA Do-not-copy Rules | `reference_dna` | Enforce safe reference boundaries. | `universal_skill_plan` | `none` | `no_approval_needed` | QA support. |
| `reference_caption_style_guidance` | Reference Caption Style Guidance | `reference_dna` | Use reference caption style safely. | `caption_planning_contract` | `low` | `source_confirmation_needed` | No exact copying. |
| `reference_transition_guidance` | Reference Transition Guidance | `reference_dna` | Use reference transition ideas safely. | `transition_planning_contract` | `low` | `source_confirmation_needed` | No exact timing copy. |
| `reference_music_dna_guidance` | Reference Music DNA Guidance | `reference_dna` | Use reference music guidance safely. | `sound_music_planning_contract` | `low` | `source_confirmation_needed` | Root requested doc missing. |

### Edit Preference

| skill_key | Display name | Family | Short purpose | Primary planning contract | Credit tendency | Approval tendency | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `edit_preference_resolution` | Edit Preference Resolution | `edit_preference` | Resolve preference inputs. | `edit_preference_creative_direction_contract` | `low` | `no_approval_needed` | No settings runtime. |
| `edit_preference_snapshot` | Edit Preference Snapshot | `edit_preference` | Snapshot resolved preference for plan. | `edit_preference_creative_direction_contract` | `none` | `no_approval_needed` | Documentation model only. |
| `preference_conflict_resolution` | Preference Conflict Resolution | `edit_preference` | Resolve conflicting preferences. | `edit_preference_creative_direction_contract` | `low` | `user_confirmation_needed` | Priority-aware. |
| `preferred_skill_scoring` | Preferred Skill Scoring | `edit_preference` | Boost preferred canonical skills. | `edit_preference_creative_direction_contract` | `none` | `no_approval_needed` | Does not force execution. |
| `blocked_skill_filtering` | Blocked Skill Filtering | `edit_preference` | Block canonical skills from selection. | `edit_preference_creative_direction_contract` | `none` | `no_approval_needed` | Direct instruction can override. |

## Skill Lifecycle Statuses

Catalog lifecycle statuses describe the status of a skill in the future catalog:

- `proposed`
- `draft`
- `active_planning_only`
- `seeded_future`
- `deprecated`
- `replaced`
- `blocked`
- `archived`

Route/use statuses describe a skill in one edit plan:

- `candidate`
- `recommended`
- `optional`
- `selected`
- `rejected`
- `blocked_by_user`
- `blocked_by_preference`
- `blocked_by_budget`
- `blocked_by_missing_input`
- `blocked_by_source_status`
- `blocked_by_policy`
- `awaiting_approval`
- `approved`
- `superseded`
- `cancelled`

Catalog lifecycle is about whether a skill exists and how it should be used across the product. Per-edit route/use status is about one plan, one segment, one user, and one moment.

## Skill Recommendation Levels

Recommendation levels:

- `required`
- `recommended`
- `optional`
- `lower_cost_alternative`
- `not_useful`
- `blocked`
- `do_not_use`

Guidance:

- `required` should be rare and justified.
- `recommended` should have a planning reason and QA path.
- `optional` is important for premium, credit-heavy, generated, or visually bold skills.
- `lower_cost_alternative` should exist for heavy optional skills.
- `not_useful` and `do_not_use` are professional restraint decisions.

## Skill Complexity And Credit Tendency

Complexity values:

- `none`
- `low`
- `medium`
- `high`
- `premium`

Credit tendency values:

- `none`
- `low`
- `medium`
- `high`
- `premium`
- `variable`

Credit tendency is not a final estimate. Final estimate depends on duration, generation, tool, provider, QA, revision risk, source status, approval, and plan details.

Basic edits can use low/medium skills while remaining professional. Premium skills require explicit itemization later.

## Skill Approval Tendency

Approval tendency values:

- `no_approval_needed`
- `approval_if_user_visible`
- `approval_if_credit_bearing`
- `approval_if_premium`
- `approval_always`
- `user_confirmation_needed`
- `source_confirmation_needed`

Premium, heavy, generated, source-sensitive, or user-visible skills tend to need approval. Approval tendency is catalog metadata, not execution permission. Actual approval is handled through future approval records and credit estimates.

## Documentation-only Pseudo-record: SkillAlias

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, catalog storage, resolver logic, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `alias` | Required | Non-canonical phrase or old key. | `broll` |
| `canonical_skill_key` | Required | Canonical key the alias maps to. | `b_roll_planning` |
| `reason` | Required | Why the alias exists. | `Common user shorthand.` |
| `status` | Required | Alias status. | `active_alias` |
| `avoid_new_usage` | Required | Whether new records should avoid the alias. | `true` |
| `notes` | Optional | Additional notes. | `Store canonical key in future records.` |

Alias examples:

| Alias | Canonical skill key | Reason |
| --- | --- | --- |
| `broll` | `b_roll_planning` | Common shorthand. |
| `3d_broll` | `three_d_object_broll` | Short 3D phrase. |
| `visual_explain` | `graphic_design_visual_explain` | Existing product phrase. |
| `captions` | `caption_design` | Generic user term. |
| `music` | `soundsync_music_planning` | Generic user term. |
| `realmotion` | `real_motion_overlay` | Collapsed product spelling. |

Rules:

- Aliases help interpretation.
- Aliases should not be used as canonical keys.
- Deprecated names must map to a canonical key or be blocked.
- Future migrations/types should store canonical keys.

## Duplicate Skill Prevention

Before adding a skill:

1. Search existing skill keys.
2. Search aliases.
3. Search planning contracts.
4. Check if it is a role under an existing skill.
5. Check if it is a tool, provider, worker, prompt, UI label, workflow, or preference instead of a skill.
6. Check if it belongs to an existing family.
7. Check if a `no_*` restraint skill already covers it.
8. Add only if it has a distinct planning need.
9. Map it to a planning contract.
10. Add notes for why it is not duplicate.

## Documentation-only Pseudo-record: SkillDuplicateReview

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, catalog storage, resolver logic, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `proposed_skill_key` | Required | Proposed canonical key. | `three_d_product_feature_breakout` |
| `proposed_family` | Required | Proposed family. | `three_d_visuals` |
| `similar_existing_skill_keys` | Required | Similar current keys. | `three_d_object_broll, three_d_explainer_visual` |
| `similar_aliases` | Optional | Similar aliases. | `3d_product` |
| `duplicate_risk` | Required | Duplicate risk level. | `medium` |
| `decision` | Required | Decision. | `allow_distinct_skill` |
| `decision_reason` | Required | Why it is or is not duplicate. | `Product feature breakout has source/provenance and approval needs distinct from generic 3D B-roll.` |
| `planning_contract_mapping` | Required | Required planning contracts. | `universal_skill_plan, three_d_visual_planning_contract` |
| `reviewer_notes` | Optional | Notes for future reviewer. | `Check product demo workflow overlap.` |
| `status` | Required | Review status. | `reviewed` |

## Skill To Planning Contract Mapping

Every skill maps to at least the universal contract. Specialized skills map to one or more specialized contracts. StoryTiming coordinates all selected skill plans. Edit preference influences all skill scoring.

| Family | Required planning contract mapping |
| --- | --- |
| `core_editing` | `universal_skill_plan` |
| `story_timing` | `universal_skill_plan`, `storytiming_coordination_contract` |
| `caption` | `universal_skill_plan`, `caption_planning_contract`, `overlay_compositing_planning_contract` |
| `transition` | `universal_skill_plan`, `transition_planning_contract`, optional `motion_design_planning_contract`, optional `sound_music_planning_contract`, optional `three_d_visual_planning_contract` |
| `b_roll` | `universal_skill_plan`, `b_roll_planning_contract`, optional `overlay_compositing_planning_contract`, optional `three_d_visual_planning_contract` |
| `overlay_compositing` | `universal_skill_plan`, `overlay_compositing_planning_contract` |
| `graphic_design` | `universal_skill_plan`, `graphic_design_planning_contract`, `overlay_compositing_planning_contract`, optional `motion_design_planning_contract` |
| `motion_design` | `universal_skill_plan`, `motion_design_planning_contract`, optional `transition_planning_contract`, optional `sound_music_planning_contract` |
| `three_d_visuals` | `universal_skill_plan`, `three_d_visual_planning_contract`, optional `overlay_compositing_planning_contract`, optional `b_roll_planning_contract`, optional `motion_design_planning_contract` |
| `stroke_motion` | `universal_skill_plan`, `motion_design_planning_contract`, `overlay_compositing_planning_contract`, optional `transition_planning_contract` |
| `real_motion` | `universal_skill_plan`, `overlay_compositing_planning_contract`, `motion_design_planning_contract` |
| `browser_app_visuals` | `universal_skill_plan`, `overlay_compositing_planning_contract`, optional `graphic_design_planning_contract` |
| `audio_cleanup` | `universal_skill_plan`, `sound_music_planning_contract` |
| `soundsync` | `universal_skill_plan`, `sound_music_planning_contract`, `storytiming_coordination_contract` |
| `sfx` | `universal_skill_plan`, `sound_music_planning_contract`, optional `transition_planning_contract`, optional `motion_design_planning_contract` |
| `color_finish` | `universal_skill_plan` |
| `render_export` | `universal_skill_plan`, `storytiming_coordination_contract` |
| `qa` | `universal_skill_plan`, relevant specialized contract, `storytiming_coordination_contract` |
| `approval_credit` | `universal_skill_plan`, `edit_preference_creative_direction_contract` |
| `reference_dna` | `universal_skill_plan`, `edit_preference_creative_direction_contract`, relevant specialized contract |
| `edit_preference` | `universal_skill_plan`, `edit_preference_creative_direction_contract` |

## Skill To Source-of-truth Mapping

| Source truth | Current role |
| --- | --- |
| `edit-quality-engine.md` | Professional editing, cuts, transitions, captions, music, SFX, and QA. |
| `signature-systems.md` | Stroke Motion, Graphic Design / VisualExplain, Real Motion, and SoundSync identity. |
| `stroke-motion-data-model.md` | Stroke Motion planning details. |
| `real-motion-system.md` | Real Motion details. |
| `generation-provider-architecture.md` | Provider/tool boundary. |
| `job-orchestration-architecture.md` | Workers/jobs boundary. |
| `intent-led-edit-planning.md` | Plan-first workflow. |
| `database-architecture.md` | Future schema boundary. |
| `type-contracts.md` | Future type contract pattern. |
| `design.md` | Visual design rules. |
| `src/types/signature-systems.ts` | Existing `SignatureSystemCatalogRecord`; not the same as future Creative Skill catalog. |
| `src/types/reeditpro.ts` | Existing edit preference, compiled intent, and planner-facing types. |
| `src/types/edit-planning-db.ts` | Existing edit planning DB preference fields. |
| `src/lib/mock-planner.ts` | Current mock planning behavior. |
| `src/lib/professional-editing-ontology.ts` | Current professional editing taxonomy and defaults. |
| `src/lib/intent-compiler.ts` | Current intent compilation and Reference DNA safety notes. |
| `src/lib/adaptive-edit-strategy.ts` | Current adaptive strategy and generation restraint. |
| `src/lib/planner-validation.ts` | Current planner validation and QA. |
| `src/lib/prompt-builders.ts` | Current prompt planning boundaries. |
| `src/lib/workflow-profiles.ts` | Current workflow/preference options. |
| Current RP-SKILLS docs | Skill planning doctrine, universal/specialized contracts, StoryTiming coordination, and edit preference direction. |

Requested source-truth files missing in this repo snapshot:

- `soundsync-music-intelligence.md`
- `music-reference-dna.md`
- `lyria-music-generation-plan.md`

The requested `audio-library-and-licensing.md` file exists in the repo root.

## Documentation-only Pseudo-record: CreativeSkillCatalogRecord

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, catalog storage, resolver logic, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable catalog record ID. | `skill_caption_design` |
| `skill_key` | Required | Canonical skill key. | `caption_design` |
| `display_name` | Required | Human-readable name. | `Caption Design` |
| `skill_family` | Required | Canonical family. | `caption` |
| `skill_type` | Required | Skill category. | `planning_capability` |
| `short_purpose` | Required | Brief purpose. | `Plan readable captions.` |
| `plain_language_definition` | Required | User-friendly definition. | `Design captions that preserve meaning and are easy to read.` |
| `professional_standard` | Required | Professional bar. | `Meaning first, readability second, style third.` |
| `primary_planning_contract` | Required | Main planning contract. | `caption_planning_contract` |
| `secondary_planning_contracts` | Optional | Additional contracts. | `overlay_compositing_planning_contract, storytiming_coordination_contract` |
| `related_skill_keys` | Optional | Related canonical skills. | `caption_line_breaking, caption_keyword_emphasis` |
| `alternative_skill_keys` | Optional | Alternatives. | `no_captions` |
| `lower_cost_alternative_skill_keys` | Optional | Lower-cost alternatives. | `caption_line_breaking` |
| `default_recommendation_level` | Required | Default recommendation. | `recommended` |
| `default_complexity` | Required | Default complexity. | `low` |
| `default_credit_tendency` | Required | Credit tendency hint. | `low` |
| `default_approval_tendency` | Required | Approval tendency hint. | `approval_if_user_visible` |
| `edit_preference_affinities` | Optional | Preference affinities. | `caption_style_preference, caption_density_preference` |
| `workflow_affinities` | Optional | Workflow affinities. | `Social Short, Education / Explainer` |
| `platform_affinities` | Optional | Platform affinities. | `vertical social, silent autoplay` |
| `when_to_use_summary` | Required | When to use. | `Use when speech meaning benefits from on-screen text.` |
| `when_to_avoid_summary` | Required | When to avoid. | `Avoid when user asked for no captions and no accessibility requirement exists.` |
| `no_action_counterpart_skill_key` | Optional | No-action counterpart. | `no_captions` |
| `tool_candidate_notes` | Optional | Future tool notes. | `Renderer can vary later; no tool chosen here.` |
| `worker_target_notes` | Optional | Future worker notes. | `Caption rendering remains future runtime.` |
| `provider_boundary_notes` | Optional | Provider boundary. | `No ASR/translation provider call from taxonomy.` |
| `QA_family` | Required | QA family. | `caption_readability_qa` |
| `lifecycle_status` | Required | Catalog lifecycle. | `active_planning_only` |
| `version` | Required | Docs/catalog version. | `docs_v1` |
| `owner_doc` | Required | Owner documentation. | `docs/creative-skills/caption-planning-contract.md` |
| `metadata_json` | Optional | Flexible future metadata. | `{\"aliases\":[\"captions\"]}` |

## Documentation-only Pseudo-record: CreativeSkillFamilyRecord

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, catalog storage, resolver logic, worker spec, provider instruction, or UI.

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `id` | Required | Stable family record ID. | `family_three_d_visuals` |
| `family_key` | Required | Canonical family key. | `three_d_visuals` |
| `display_name` | Required | Human-readable family name. | `3D Visuals` |
| `purpose` | Required | Family purpose. | `Plan dimensional visual ideas by role.` |
| `belongs_to` | Optional | Parent family if applicable. | `visual_skills` |
| `child_family_keys` | Optional | Child families. | `none` |
| `primary_planning_contract` | Required | Main contract. | `three_d_visual_planning_contract` |
| `related_contracts` | Optional | Related contracts. | `overlay_compositing_planning_contract, motion_design_planning_contract` |
| `canonical_skill_keys` | Required | Skill keys in the family. | `no_3d, three_d_object_broll, three_d_overlay_integration` |
| `source_of_truth_docs` | Required | Owner docs. | `docs/creative-skills/three-d-visual-planning-contract.md` |
| `duplicate_risk_notes` | Optional | Duplication notes. | `Avoid tool names like threejs as skills.` |
| `lifecycle_status` | Required | Family lifecycle. | `active_planning_only` |
| `metadata_json` | Optional | Flexible future metadata. | `{\"signatureOverlap\":false}` |

## Documentation-only Pseudo-record: CreativeSkillRelationship

This pseudo-record is documentation only. It is not TypeScript, SQL, JSON schema, migration, runtime code, prompt code, catalog storage, resolver logic, worker spec, provider instruction, or UI.

Relationship types:

- `supports`
- `conflicts_with`
- `alternative_to`
- `lower_cost_alternative_to`
- `premium_alternative_to`
- `requires`
- `blocks`
- `supersedes`
- `coordinated_with`
- `child_of`
- `parent_of`

| Field | Required | Description | Example value |
| --- | --- | --- | --- |
| `from_skill_key` | Required | Source skill. | `caption_design` |
| `to_skill_key` | Required | Target skill. | `graphic_design_visual_explain` |
| `relationship_type` | Required | Relationship type. | `conflicts_with` |
| `reason` | Required | Why the relationship matters. | `Both can occupy the same text zone.` |
| `can_coexist` | Required | Whether they can coexist. | `true_with_storytiming` |
| `requires_storytiming_coordination` | Required | Whether StoryTiming coordination is required. | `true` |
| `credit_relationship` | Required | Credit relationship. | `none` |
| `approval_relationship` | Required | Approval relationship. | `approval_if_both_user_visible` |
| `notes` | Optional | Additional notes. | `Move captions to fallback zone during dense graphic.` |

Relationship examples:

- `caption_design` conflicts with dense `graphic_design_visual_explain` if they share the same screen zone.
- `three_d_object_broll` is a lower-integration alternative to `three_d_overlay_integration`.
- `graphic_design_visual_explain` can be a lower-cost alternative to `three_d_explainer_visual`.
- `transition_sfx_planning` supports `transition_design`.
- `storytiming_coordination` coordinates all selected skills.

## Taxonomy Influence On Edit Preference

The taxonomy supports RP-SKILLS-12:

- `preferred_skill_keys` must use canonical keys.
- `blocked_skill_keys` must use canonical keys.
- Aliases must resolve before scoring.
- Family-level preferences can influence all child skills.
- A blocked family can block child skills.
- A preferred family can boost child skills without forcing them.
- `no_*` skills can represent restraint preferences.
- Preference conflicts should reference canonical skill keys.

## Taxonomy Influence On StoryTiming

The taxonomy supports RP-SKILLS-11:

- Skill families help StoryTiming classify visual, audio, text, and motion density.
- Skill relationships help detect conflicts.
- No-action skills help record restraint decisions.
- Skill complexity helps identify premium or hero moments.
- Planning contract mapping tells StoryTiming what footprint data to expect.
- `related_skill_keys` help find dependencies and alternatives.

## Taxonomy Influence On Credit And Approval

- `default_credit_tendency` is only a hint.
- `default_approval_tendency` is only a hint.
- Final estimates depend on plan details, duration, generation, tool, provider, QA, revision risk, and approval.
- Premium, generated, or source-sensitive skills must still be itemized.
- No-action skills can lower credit cost.
- Lower-cost alternatives must be discoverable.
- Credit/approval logic remains future gated and must not be bypassed by taxonomy.

## Taxonomy Influence On Tools, Workers, And Providers

- `tool_candidate_notes` are planning metadata only.
- Tool names are not skill keys.
- `worker_target_notes` are future orchestration hints only.
- `provider_boundary_notes` must not contain secrets.
- Catalog records should never store API keys or credentials.
- Future tool routing must consult provider/tool readiness and approval gates.
- Skills should be tool-agnostic enough to support multiple execution methods.

## Taxonomy QA

Taxonomy QA checks:

- Canonical key is snake_case.
- Display name is clear.
- Family exists.
- Skill is not a tool, provider, worker, prompt, or UI label.
- Planning contract is mapped.
- `when_to_use_summary` and `when_to_avoid_summary` exist.
- Credit tendency exists.
- Approval tendency exists.
- No duplicate or alias conflict exists.
- Source-of-truth doc owner exists or missing owner is recorded honestly.
- Related and alternative skills are canonical.
- No runtime or execution is implied.
- No provider secret or credential reference exists.
- No reference-style cloning language exists.
- No generic template behavior exists.
- No skill requires use everywhere.

Blocking examples:

- Duplicate skill key.
- Skill key is a tool/provider name.
- Skill has no planning contract.
- Premium skill has no approval tendency.
- Skill implies execution without approval.
- Skill stores credential/provider secret.
- Skill encourages copying reference exactly.

Warning examples:

- Skill purpose overlaps another skill.
- Skill family may be too broad.
- `when_to_avoid_summary` is weak.
- No lower-cost alternative for premium skill.
- Alias conflict is likely.

## Examples

| skill_key | family | primary_planning_contract | default_credit_tendency | default_approval_tendency | when_to_use_summary | when_to_avoid_summary | related_or_alternative_skills | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `caption_design` | `caption` | `caption_planning_contract` | `low` | `approval_if_user_visible` | Use when speech meaning benefits from readable on-screen text. | Avoid when user requested no captions and no accessibility/project requirement exists. | `caption_line_breaking, caption_keyword_emphasis, no_captions` | Meaning first, readability second, style third. |
| `transition_design` | `transition` | `transition_planning_contract` | `medium` | `approval_if_user_visible` | Use when a story edge needs intentional rhythm or bridge. | Avoid when clean cuts preserve meaning better. | `clean_cut_transition, ambient_bridge_transition, no_transition` | Transitions are not random effects. |
| `graphic_design_visual_explain` | `graphic_design` | `graphic_design_planning_contract` | `medium` | `approval_if_user_visible` | Use when a concept, proof point, or structure needs visual explanation. | Avoid when source footage or captions already clarify enough. | `framework_diagram_design, proof_card_design, three_d_explainer_visual` | Can be lower-cost alternative to 3D. |
| `motion_design_overlay` | `motion_design` | `motion_design_planning_contract` | `medium` | `approval_if_user_visible` | Use when overlay motion improves hierarchy or attention. | Avoid when motion would harm readability or comfort. | `graphic_reveal_motion, no_motion_design` | Must know what moves, why, when, how, and when it stops. |
| `three_d_overlay_integration` | `three_d_visuals` | `three_d_visual_planning_contract` | `premium` | `approval_if_premium` | Use when 3D meaningfully interacts with the source frame. | Avoid when B-roll or graphics can explain more cheaply. | `three_d_object_broll, graphic_design_visual_explain, no_3d` | Requires source/model/provenance and QA. |
| `three_d_object_broll` | `three_d_visuals` | `three_d_visual_planning_contract` | `premium` | `approval_if_premium` | Use when a 3D object can clarify without full overlay integration. | Avoid when source B-roll is available and clearer. | `source_b_roll_selection, three_d_overlay_integration` | Lower-integration 3D option. |
| `b_roll_planning` | `b_roll` | `b_roll_planning_contract` | `medium` | `approval_if_user_visible` | Use when supporting visuals prove, clarify, cover, or emotionally support. | Avoid when it becomes random filler. | `source_b_roll_selection, no_b_roll` | Source/proof status matters. |
| `soundsync_music_planning` | `soundsync` | `sound_music_planning_contract` | `medium` | `approval_if_user_visible` | Use when music supports speech, emotion, rhythm, or pacing. | Avoid when silence, ambience, or no music is better. | `no_music, music_ducking_planning, generated_music_future_planning` | Rights/provenance and ducking matter. |
| `storytiming_coordination` | `story_timing` | `storytiming_coordination_contract` | `medium` | `approval_if_user_visible` | Use when multiple skills or density decisions need coordination. | Avoid treating it as a timeline effect. | `focus_density_budgeting, skill_conflict_resolution` | Coordinates all selected skills. |
| `no_3d` | `three_d_visuals` | `three_d_visual_planning_contract` | `none` | `no_approval_needed` | Use when restraint, budget, source fit, or user preference argues against 3D. | Avoid when user explicitly approved an earned 3D moment. | `three_d_object_broll, graphic_design_visual_explain` | No-action skill is a professional decision. |

## Anti-patterns

- Skill named after a tool.
- Skill named after a provider.
- Skill named after a prompt.
- Skill named after a UI button.
- Skill named after a workflow.
- Vague skill like `make_it_pop`.
- Duplicate skill with different spelling.
- Generic 3D skill without role.
- Generic motion skill without role.
- Skill has no `when_to_avoid_summary`.
- Skill has no planning contract.
- Skill hard-codes one style.
- Skill forces use everywhere.
- Skill bypasses StoryTiming.
- Skill bypasses approval/credits.
- Skill stores provider credentials.
- Skill copies reference style exactly.
- Skill catalog tries to implement runtime.

## Future Implementation Notes

Possible future records, tables, or types:

- `creative_skill_families`
- `creative_skills`
- `creative_skill_aliases`
- `creative_skill_relationships`
- `creative_skill_duplicate_reviews`
- `creative_skill_contract_mappings`
- `creative_skill_workflow_affinities`
- `creative_skill_preference_affinities`
- `creative_skill_credit_approval_hints`
- `edit_plan_skill_routes`
- `rejected_skill_candidates`
- `storytiming_coordination` references
- `edit_preference_snapshots` references
- `credit_estimate` references
- `approval_records` references

This document does not create those records now. Future schema/types must avoid duplicating this document's source-of-truth. Runtime skill catalog loading and resolution remain future gated work. Skill taxonomy is planning metadata, not execution.

## RP-SKILLS-14 Handoff

Recommended next prompt:

`RP-SKILLS-14 - Visual Opportunity Engine Contract`

Scope:

Docs-only visual opportunity contract that defines how the planner detects moments where a skill might improve the video before selecting any skill: spoken object references, abstract concepts, proof claims, product features, screen/UI moments, data/metrics, emotional shifts, story transformations, location changes, dead visual space, hero reveal moments, teaching moments, B-roll gaps, transition bridges, and restraint/no-op opportunities.

Forbidden scope for `RP-SKILLS-14` unless explicitly authorized later:

- Supabase migrations or SQL.
- Runtime code.
- TypeScript implementation.
- React UI.
- Provider calls.
- Workers, jobs, leases, or runtime gates.
- Package installs or package file mutations.
- Skill resolver runtime, catalog runtime, schema/runtime behavior, visual opportunity runtime, runtime orchestration, render/export runtime, media analysis, audio generation, music generation, SFX generation, caption rendering, browser/capture/media/generation runtime, prompt router changes, Playwright execution, animation code, design-token changes, or app behavior.
