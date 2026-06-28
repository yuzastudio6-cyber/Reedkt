# Edit Level Tool Capability Registry

The RP-EDITLEVEL-05 registry defines the product capability IDs used by the mock/local Tool Capability Router.

## Capability IDs

`qwen_3_reasoning`, `qwen25vl_visual_understanding`, `speech_transcript`, `media_extraction`, `audio_soundsync`, `graphic_design_understanding`, `preference_dna`, `edit_brief`, `edit_brief_marker_chat`, `edit_brief_marker_qa`, `edit_brief_plan_hints`, `source_video_playback`, `source_video_understanding_package`, `media_asset_repository`, `storage_runtime`, `deepseek_tool_code`, `render_worker`, and `credit_gate`.

## Statuses

Supported statuses are `available_mock`, `available_beta`, `runtime_disabled`, `provider_required`, `worker_required`, `storage_required`, `future_gated`, `not_required`, and `degraded_fallback`.

`available_mock` and `available_beta` are display/readiness states only. They do not authorize execution. `provider_required`, `worker_required`, `storage_required`, and `future_gated` identify future implementation requirements.

## Existing Tool Stack Mapping

The router keeps product capability IDs separate from existing tool registry IDs. Browser-safe metadata may reference `src/lib/tool-registry.ts` IDs such as `remotion`, `audioflux`, `whisper_cpp`, `playwright`, `d3`, `echarts`, `ffmpeg`, or `sharp`. Server-only production registry concepts remain backend metadata and are not imported by React components.

Missing requested legacy docs in this checkout remain reported as missing: `docs/reeditpro-tool-stack-integration-registry.md`, video-context Qwen/tool-readiness docs, and several older roadmap/status docs.
