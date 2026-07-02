# Edit Level Source Understanding Layers

RP-EDITLEVEL-06 defines these mock/local source context layers:

- `source_metadata`
- `browser_local_playback`
- `media_extraction_metadata`
- `keyframe_sampling_plan`
- `speech_transcript`
- `qwen25vl_visual_segments`
- `qwen25vl_marker_windows`
- `audio_soundsync_segments`
- `graphic_text_segments`
- `preference_dna_context`
- `edit_brief_marker_context`
- `marker_context_package`
- `source_video_understanding_package`
- `qwen3_reasoning_context`

Layer status describes current runnable state, not product ambition. Model/provider/worker/media layers remain `provider_required`, `worker_required`, `runtime_disabled`, or `future_gated` and must not claim execution.

Source understanding routing only; no tools execute, no media processing runs, no render happens, and no credits are reserved or spent.
