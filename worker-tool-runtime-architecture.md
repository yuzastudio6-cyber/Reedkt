# Worker Tool Runtime Architecture

## Purpose

The Worker Tool Runtime Architecture defines how future backend workers will execute approved ReeditPro edit plans. Frontend planning does not equal execution: tools do not run until the user approves an edit plan and credit estimate, and future workers must execute approved plan snapshots instead of reinterpreting raw chat.

Workers must respect tier, model, credit, frame, layout, safety, and approved fallback rules. Outputs can become generated assets, processed media, QA reports, renderer layers, previews, or final exports.

## Worker Lifecycle

1. User approves the edit plan and credit estimate.
2. The approved plan snapshot is frozen.
3. Future backend reserves credits.
4. A worker job is created from the approved snapshot.
5. The worker loads the approved snapshot.
6. The worker validates source media readiness.
7. The worker runs only approved job steps.
8. The worker writes outputs to storage.
9. The worker records events and status.
10. The worker runs QA checks.
11. The worker retries or falls back only inside approved policy.
12. The worker requests new approval if plan changes exceed the approved allowance.
13. The worker prepares preview/export.
14. Failed ReeditPro generation or tool execution follows future refund/restore policy.

## Worker Groups

- `media_analysis_worker`: transcript, visual, audio, source clip, scene, face/object, and safe-zone analysis.
- `ffmpeg_media_worker`: trim/cut/export/transcode, color filters/LUTs, loudness normalization, audio cleanup, final encoding.
- `color_pipeline_worker`: OpenColorIO/OpenImageIO-style color management, generated asset matching, shot matching, Pro/Premium color operations.
- `audio_soundsync_worker`: FFmpeg/Essentia-style audio analysis, BPM/onset/beat timing, ducking, SFX cue processing, loudness and voice cleanup execution.
- `map_visual_worker`: MapLibre/Turf map assets, route reveals, pins, map cards, and future map frame sequences.
- `dataviz_worker`: D3/ECharts/Vega-Lite charts, diagrams, money flows, timelines, metrics, and process visuals.
- `browser_capture_worker`: Playwright/Sharp screenshots for authorized or user-provided URLs with redaction where planned.
- `mask_tracking_worker`: segmentation, subject masks, contact object masks, hero object masks, tracking, and mask QA.
- `image_asset_worker`: future GPT-Image-2 stills, keyframes, cards, and character reference assets.
- `ai_video_asset_worker`: future Wan/Hailuo/Veo video clips/assets only; Basic/Pro never use Veo, Premium uses Veo final fallback only.
- `remotion_render_worker`: final canvas/timeline composition, layer assembly, captions, cards, panels, asset placement, and previews/exports.
- `qa_worker`: structured QA, plan compliance, visual/audio/model/tier/layout validation.
- `export_worker`: final export preparation, output format/aspect, and storage delivery.

## Execution Modes

- `planning_only`
- `analysis_worker`
- `preprocess_worker`
- `generation_worker`
- `render_worker`
- `postprocess_worker`
- `qa_worker`
- `export_worker`

## Worker Input Contract

Every worker step should receive:

- `approvedPlanSnapshotId`
- `projectId`
- `editPlanVersionId`
- `creditReservationId` when applicable
- `sourceAssetIds`
- `segmentIds`
- `operationIds`
- `visualAssetPlanItemIds`
- `rendererLayerIds`
- `toolStrategyItemIds`
- approved settings
- fallback policy
- QA checks
- status/audit metadata

## Worker Output Contract

Worker outputs can include:

- processed video/audio
- generated image assets
- AI video clip assets
- map/chart/browser visual assets
- mask assets
- timing maps
- renderer composition assets
- QA reports
- final exports
- error reports

## Tool And Runtime Separation

Frontend browser-safe tools installed for previews are not production worker execution. Backend/runtime tools are separate and should not be bundled into the frontend by default:

- FFmpeg
- OpenCV
- OpenColorIO
- OpenImageIO
- Playwright
- Essentia
- librosa
- whisper.cpp
- Rubber Band
- Remotion render environment
- provider clients

## Fallback Policy

Workers may fallback only inside approved policy:

- retry the same model/tool
- simplify prompt/settings
- switch to an approved fallback tool
- split a scene
- convert AI video to still/motion design
- switch to approved fallback layout
- use Hailuo fallback where allowed
- use Veo only for Premium final fallback if the approved route includes it
- request new approval if fallback exceeds the plan

Basic and Pro can never fallback to Veo.

## QA Handoff

Workers should produce QA metadata where applicable:

- color QA
- audio QA
- map/chart/browser label readability
- foreground mask QA
- model/tier policy QA
- frame/safe-zone QA
- prompt adherence QA
- approved snapshot compliance QA

## Security And Safety

Browser capture must be user-authorized and must not bypass authentication, paywalls, CAPTCHAs, or site restrictions. Privacy redaction is required where planned. Documentary/case-study fact safety still applies: real named people and allegations remain neutral unless verified and approved. Provider prompts must come from approved prompt plans, workers must not invent claims or evidence, and secrets/API keys must never be exposed in frontend code.

## Non-Goals

This milestone does not implement real workers, job queues, migrations, storage, cloud infrastructure, tool execution, provider calls, real rendering, or exports.
