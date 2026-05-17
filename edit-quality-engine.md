# Professional Edit Quality Engine

## Purpose

The Professional Edit Quality Engine defines how ReeditPro makes every edit feel professionally edited before any signature system is added.

Every ReeditPro edit, including Basic, must meet a professional editing standard. Basic means lower-compute clean editing, not low-quality editing.

This is an architecture plan only. It does not create migrations, backend services, AI calls, uploads, renders, or workers.

## Edit Levels

### `basic_edit`

Professional clean editing with low compute and low generation cost.

Supports:

- Clean cuts.
- Remove dead space.
- Remove obvious mistakes.
- Preserve meaningful pauses.
- Basic readable captions.
- Audio leveling.
- Voice cleanup.
- Room noise reduction when needed.
- Room tone preservation when appropriate.
- Simple background music only if appropriate.
- Simple transitions only if they help the story.
- Professional preview render.
- Quality check before preview.

Avoids unless explicitly requested and approved:

- Stroke Motion generation.
- Real Motion generation.
- Heavy Graphic Design generation.
- Expensive animation models.
- Unnecessary transitions.
- Loud SFX.
- Heavy motion.
- Forced hooks.

### `pro_edit`

Everything in Basic plus stronger polish:

- Stronger pacing.
- Better caption styling.
- Light transition design.
- Light SFX where useful.
- Background music planning.
- Ducking under voice.
- Beat-aware cuts when useful.
- Light visual emphasis if useful.
- Optional simple Stroke Motion or Graphic Design only if approved.

### `signature_edit`

Professional edit plus segment-by-segment signature investigation:

- Stroke Motion.
- Graphic Design / VisualExplain.
- Real Motion if useful.
- SoundSync support.
- Story beat map.
- Signature routing per segment.
- Credit estimate by system.
- User approval before generation.

Signature systems must not be forced by video type.

### `premium_signature_edit`

Highest-complexity edit:

- Advanced Stroke Motion planning/generation.
- Advanced Graphic Design layouts.
- Real Motion overlays.
- Higher credit estimates.
- Premium SoundSync.
- Multi-step generation.
- More expensive providers.
- Stronger QA.
- Advanced revision loop.

## Edit Level Rule

Edit level controls:

- Complexity.
- Generation depth.
- Credit cost.
- Signature system usage.
- Worker pipeline depth.

Edit level does not control quality.

## Required Tables

### `edit_quality_profiles`

Stores professional editing target for a project or plan.

Fields:

- `id`
- `project_id`
- `edit_plan_id`
- `edit_level`: `basic_edit`, `pro_edit`, `signature_edit`, `premium_signature_edit`
- `target_platform`
- `tone`
- `pacing_goal`
- `caption_goal`
- `audio_goal`
- `transition_goal`
- `signature_allowed`
- `quality_standard`: should default to `professional`
- `status`

### `pacing_analysis`

Analyzes timing, pauses, energy, and retention.

Fields:

- `id`
- `edit_plan_id`
- `media_asset_id`
- `segment_id`
- `speech_density`
- `pause_map_json`
- `dead_space_ranges_json`
- `meaningful_pause_ranges_json`
- `energy_curve_json`
- `recommended_pacing_action`
- `confidence`

### `cut_decisions`

Stores planned cuts and trims.

Fields:

- `id`
- `edit_plan_segment_id`
- `source_clip_sequence_id`
- `cut_type`
- `start_time`
- `end_time`
- `reason`
- `preserve_pause`
- `remove_filler`
- `worker_notes`
- `status`

### `transition_plans`

Stores intelligent transition decisions.

Fields:

- `id`
- `edit_plan_segment_id`
- `from_segment_id`
- `to_segment_id`
- `transition_type`
- `transition_intensity`
- `reason`
- `music_beat_anchor`
- `emotional_tone`
- `avoid_rules_json`
- `status`

Transition logic should depend on user intent, video type, spoken content, emotional tone, scene change, music beat, edit level, platform, and professional editing standards. Transitions must not be random effects.

Examples:

- Talking-head simple edit: mostly clean cuts.
- Emotional moment: preserve breath or soft cut.
- Location change: natural transition or ambient bridge.
- High-energy social edit: faster cuts and beat-matched transitions.
- Premium real estate: smooth, subtle, luxury transitions.
- Education/explainer: clean transitions that preserve understanding.
- Faith/serious content: respectful, minimal transitions.

### `audio_environment_analysis`

Captures voice and sound environment.

Fields:

- `id`
- `media_asset_id`
- `segment_id`
- `room_tone_profile`
- `ambient_sound_type`
- `background_noise_type`
- `reverb_level`
- `echo_level`
- `hum_level`
- `wind_level`
- `traffic_level`
- `crowd_noise_level`
- `voice_clarity_score`
- `cleanup_needed`
- `preserve_ambience`
- `notes`

### `ambient_sound_plans`

Plans room tone and natural ambience.

Fields:

- `id`
- `edit_plan_segment_id`
- `ambient_strategy`
- `room_tone_preservation`
- `noise_reduction_level`
- `ambience_bridge_needed`
- `reason`
- `status`

### `music_plans`

Plans background music and mood.

Fields:

- `id`
- `edit_plan_id`
- `music_role`
- `mood`
- `energy`
- `intro_strategy`
- `ducking_strategy`
- `beat_map_json`
- `rights_status`
- `credit_impact`
- `status`

### `sound_effect_plans`

Plans SFX only where useful.

Fields:

- `id`
- `edit_plan_segment_id`
- `sfx_type`
- `timing_anchor`
- `volume_level`
- `supports_system`: `none`, `stroke_motion`, `graphic_design`, `real_motion`, `transition`
- `reason`
- `avoid_under_speech`
- `status`

### `caption_plans`

Plans caption content, timing, and style.

Fields:

- `id`
- `edit_plan_segment_id`
- `caption_text`
- `start_time`
- `end_time`
- `style_hint`
- `placement_zone`
- `safe_area_strategy`
- `avoid_face_overlap`
- `status`

### `edit_quality_checks`

QA checks before preview.

Fields:

- `id`
- `edit_plan_id`
- `render_id`
- `check_type`
- `status`
- `severity`
- `result_summary`
- `failed_segment_ids_json`
- `recommended_fix`
- `blocks_preview`

Check types:

- `speech_clarity`
- `cut_smoothness`
- `caption_readability`
- `music_balance`
- `sfx_balance`
- `transition_quality`
- `ambient_consistency`
- `story_flow`
- `signature_timing`
- `credit_compliance`
- `user_instruction_compliance`

## SoundSync Music Intelligence

SoundSync Music Intelligence is the dedicated music supervision layer for future ReeditPro audio work. It extends the existing `music_plans` and `sound_effect_plans` concepts with music context analysis, cue sheets, lyrics/instrumental policy, language/culture context, Lyria Pro prompt planning, music QA, and mix/ducking plans.

The system should decide whether a scene needs music, ambience only, one track, or multiple music cues before generation. Lifestyle, vacation, travel, vlog, documentary, and long-form edits may need multi-cue planning for teasers, dialogue beds, montage sections, chapter/title cards, food/social moments, emotional bridges, and outros.

For speech-heavy sections, music should default to instrumental-only, voice-first, and ducking-ready unless the user explicitly asks for lyrics. Language/culture-aware music can be recommended when the footage, transcript, audience, user request, or reference DNA supports it, but the planner must avoid stereotypes and must not copy reference music.

Future Lyria Pro prompts should be created from approved cue sheets and negative prompts, then QA'd for context fit, speech safety, artifacts, transition points, endings, loop points, and reference-DNA alignment before render use. Sometimes the professional decision is no music, or to preserve natural ambience instead of adding a background bed.

## SoundSync By Edit Level

### Basic SoundSync

- Clean voice.
- Smooth levels.
- Preserve natural room tone.
- Reduce harsh noise.
- Music only if appropriate.
- No heavy SFX.

### Pro SoundSync

- Music selection.
- Ducking.
- Light transition SFX.
- Emotional timing.
- Beat-aware cuts.

### Signature SoundSync

- SFX tied to Stroke Motion.
- Audio cues tied to Graphic Design reveals.
- Object SFX tied to Real Motion.
- Music changes tied to story beats.

### Premium SoundSync

- Advanced music arc.
- Custom SFX layering.
- Multi-scene mood control.
- Higher-end ducking and mix QA.

## Worker Notes

Professional edit quality records should create structured notes for downstream workers:

- `edit_instructions`
- `worker_notes`
- `segment_notes`
- `must_follow_rules`
- `avoid_rules`

Examples:

- Preserve emotional pause.
- Avoid loud SFX under speech.
- Keep transition subtle and respectful.
- Preserve room tone under natural walkthrough footage.
- Do not add a forced hook when user requested simple edit.

