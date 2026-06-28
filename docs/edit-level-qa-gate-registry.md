# Edit Level QA Gate Registry

The RP08 registry contains exactly 30 deterministic QA gate IDs:

- `safety_do_not_copy`
- `copy_risk`
- `source_video_present`
- `source_metadata_ready`
- `export_settings_valid`
- `caption_safe_zone`
- `caption_readability`
- `audio_basic_sanity`
- `audio_music_ducking`
- `sfx_restraint`
- `sound_design_coherence`
- `marker_missing_asset`
- `marker_needs_clarification`
- `marker_conflict`
- `marker_time_range_valid`
- `edit_brief_priority_consistency`
- `preference_dna_match`
- `qwen_response_validation`
- `qwen25vl_visual_confidence`
- `transcript_coverage`
- `source_context_coverage`
- `broll_timing`
- `pacing_consistency`
- `story_arc_quality`
- `style_consistency`
- `graphic_layout_consistency`
- `plan_completeness`
- `render_readiness_future`
- `revision_budget_future`
- `credit_gate_future`

Categories follow the RP08 product contract: safety, source, export, caption, audio, marker, preference, qwen, visual, transcript, planning, render, and credits.

All gates are policy metadata. No QA execution, model call, media processing, render job, or credit operation runs.
