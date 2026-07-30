# Caption Direction Skill Family

## Identity

- Canonical target key: `caption_design`
- Display name: Caption Direction
- Kind: `composite_skill`
- Restraint counterpart: `no_captions`
- Compatibility alias: `caption_direction` may resolve to `caption_design`, never become a second skill.

## Relationship model

The existing professional/creative skill catalog should gain versioned `composed_of` and `component_of` relationships with cycle detection. A mini skill is an ordinary reusable Creative Skill used as a component; it is not a separate taxonomy.

Activation is scene-aware. The parent selects only the capabilities justified by the approved strategy and evidence. Numerical settings such as font size, stroke width, blur, and duration belong in typed profiles, not as global skills.

## Proposed components

### Foundation and strategy

`caption_role_direction`, `caption_transcript_integrity`, `caption_opportunity_mapping`, `caption_integration_classification`, `caption_space_reservation`, `caption_blocking_preview`, `caption_approval_envelope`, `caption_restraint`

### Linguistic direction

`semantic_phrase_design`, `caption_line_breaking`, `caption_rhythm_direction`, `caption_text_transformation`, `caption_quote_safety`, `caption_claim_safety`

### Visual design

`caption_visual_hierarchy`, `multi_style_typography_direction`, `optical_caption_sizing`, `semantic_scale_direction`, `semantic_color_direction`, `adaptive_caption_legibility`, `caption_color_management`

### Spatial and compositing

`spatial_sentence_composition`, `spatial_caption_compositing`, `typographic_depth_choreography`, `subject_occluded_typography`, `object_anchored_typography`, `environmental_typography`, `persistent_topic_list_typography`, `hero_typography_direction`, `caption_camera_coordination`, `caption_broll_co_composition`, `caption_collision_avoidance`, `occlusion_readability_qa`

### Motion and transformation

`caption_animation`, `kinetic_type_support`, `semantic_kinetic_typography`, `caption_to_visual_bridge`, `caption_mode_switching`, `typographic_scene_continuity`

### Sound

`caption_sound_choreography`, `caption_sound_restraint`, `caption_final_mix_handoff`

### Accessibility and language

`caption_speaker_identification`, `caption_accessibility_planning`, `reduced_motion_caption_projection`, `caption_localization`, `multilingual_caption_layout`

### Finish and QA

`picture_lock_readiness`, `late_bound_caption_resolution`, `final_frame_spatial_analysis`, `multi_format_caption_recomposition`, `caption_revision_impact_analysis`, `caption_readability_qa`, `caption_render_qa`, `caption_delivery_qa`

## Legacy mapping

| Current skill | Initial target mapping |
| --- | --- |
| `captions.clean_readable_captions` | parent activation + readability/accessibility components |
| `captions.speech_aligned_subtitles` | transcript integrity + timing projection |
| `captions.small_premium_subtitles` | style profile preset, not a parent skill |
| `captions.bold_social_captions` | semantic/hero typography components |
| `captions.keyword_emphasis` | semantic kinetic typography |
| `captions.lower_third_labels` | attribution/label track |
| `captions.accessibility_review` | accessibility planning and delivery QA |
| `captions.multilingual_placeholder_policy` | localization and multilingual layout |
| `captions.no_caption_policy` | `no_captions` compatibility alias |

CAP-01 implements these IDs and compatibility mappings after evidence-backed
self-review, preserving legacy snapshots and current consumers.
