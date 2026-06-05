# Agent-To-Tool Plan Bridge Policy

Phase 52D is existing-evidence-only.

Allowed outputs:

- seven `candidate_only` approved-plan snapshot candidates:
  - `conservative_color_adjustment`
  - `caption_burnin_preview`
  - `text_behind_subject_preview`
  - `slow_motion_segment`
  - `web_research_planning_context`
  - `route_map_overlay`
  - `location_context_card`
- four blocked or handoff-only records:
  - `motion_graphics_lower_third`
  - `noise_cleanup`
  - `qwen_vlm_visual_understanding_request`
  - `demucs_stem_separation_request`
- handoff packets for Track A, web search, map/geospatial, AI Tools graphics, Track B audio/VLM, Worker Runtime, and Supabase milestone sync.

Every record must preserve:

- `rawPromptExecution=false`
- `workerExecutionAllowed=false`
- `approvedForRuntime=false`
- `publicArtifactAllowed=false`
- `signedUrlSourceOfTruthAllowed=false`
- production, external beta, paid production, and broad media blocked.

Ownership boundaries:

- Track A owns visual-video render/export runtime.
- This chat owns web search/capture planning, map/geospatial planning, shared agent architecture, and system readiness.
- AI Tools owns creative graphics and motion design runtime.
- Track B owns audio/OCR/VLM/data/media processing runtime.
- Worker Runtime owns future approved-snapshot execution.
- Supabase milestone sync stores private `gs://` references and structured metadata only.
