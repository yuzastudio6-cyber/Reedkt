# TOOL-STUDY-0 Track B Media Processing Capability Routing Contract

Owner: `TRACK_B_MEDIA_PROCESSING`

Recommended branch: `codex/rp-tool-study-0-track-b-media-processing`

Recommended PR title: `[tool-study] Track B media processing capability routing contract`

Readiness target: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

Supabase milestone sync: `blocked_current_branch_missing_sync_layer`

## Owned Tools

- `paddleocr`
- `paddlepaddle`
- `opencv`
- `pyav`
- `pyscenedetect`
- `sharp_libvips`
- `duckdb`
- `polars`
- `deepfilternet`
- `signalsmith_stretch`
- `demucs_blocked`
- `qwen3_vl_blocked`
- `vllm_blocked`
- `media_capability_profiler`
- `desktop_capability_profiler`
- `local_worker_sidecar_planning`
- `media_cost_estimator`
- `tool_route_manifest_integration`

## Owned Capabilities

- `ocr_text_in_frame_planning`
- `frame_image_analysis_planning`
- `scene_detection_planning`
- `shot_boundary_planning`
- `video_metadata_extraction_planning`
- `media_derivative_planning`
- `image_resize_thumbnail_derivative_planning`
- `audio_environment_analysis_planning`
- `voice_noise_cleanup_planning`
- `time_stretch_speed_change_planning`
- `media_table_query_analysis_planning`
- `media_pipeline_manifest_planning`
- `generated_local_fixture_analysis`
- `private_artifact_manifest_policy`
- `demucs_future_stem_separation_planning`
- `qwen_vlm_future_visual_understanding_planning`
- `vllm_future_serving_planning`

## Explicitly Not Owned

- Track A final render/export.
- AI Tools creative graphics.
- Provider Gateway model calls or Qwen/DeepSeek provider execution.
- Worker Runtime execution.
- Supabase schema, RLS, migrations, or writes.
- Map/geospatial route logic.
- Web search/capture execution.
- Sound/Music/Audio creative planning ownership unless explicitly handed off.
- Public artifact delivery.
- Signed URL delivery.
- Production or external beta unlock.
- Billing, credits, Stripe, or payment mutation.

## Related Workstreams

- `TRACK_A_RENDER_EXPORT`
- `AI_TOOLS_CREATIVE_GRAPHICS`
- `WORKER_RUNTIME_JOBS`
- `PROVIDER_GATEWAY_MODELS`
- `SUPABASE_RLS_STORAGE_DATABASE`
- `OBSERVABILITY_AUDIT_COST`
- `COMPLIANCE_SECURITY`
- `FRONTEND_PRODUCT_UX`
- `MAP_GEOSPATIAL`
- `WEB_SEARCH_CAPTURE`
- `SOUND_MUSIC_AUDIO`
- `BILLING_STRIPE_CREDITS`

## Allowed Scope

- Docs/diagnostics only.
- Track B route ownership and media capability routing policy.
- OCR, frame/image, scene/shot, metadata, derivative, audio cleanup, time-stretch, and blocked VLM/Demucs planning.
- Private manifest/checksum/source-of-truth policy.
- Future approved-plan, artifact-scope, local sidecar, cost estimator, and Worker Runtime handoff policy.

## Blocked Scope

- Track B runtime.
- Real media processing.
- FFmpeg or FFprobe execution.
- OCR execution.
- OpenCV, PyAV, PySceneDetect, Sharp/libvips execution.
- DeepFilterNet or Signalsmith Stretch execution.
- Demucs runtime.
- Qwen/VLM or vLLM runtime.
- Worker execution.
- Tool execution.
- Route execution.
- Provider/model calls.
- Supabase mutation.
- SQL, migrations, schema, or RLS changes.
- Google Cloud API calls.
- Secret Manager API calls.
- GCS upload or storage transfer.
- Public artifacts.
- Signed URL creation.
- Credit/billing mutation.
- Internal beta, external beta, production, paid production, or broad media unlock.

## Required Docs And Files

- `README.md`
- `AGENTS.md`
- `video-understanding-report.md`
- `source-cleanup-trim-planning.md`
- `trim-selects-qa-policy.md`
- `soundsync-audio-pipeline-planning.md`
- `launch-tool-stack-update.md`
- `open-source-tool-registry.md`
- `tool-settings-catalog.md`
- `tool-strategy-planner.md`
- `docs/tool-studies/`
- `docs/track-b-tool-route-manifest.md`
- `docs/track-b-tool-readiness-summary.md`
- `docs/track-b-consumer-boundary-policy.md`
- `docs/activation-phase-tool-route-0-execution-unlock-audit-results.md`
- `docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md`
- `docs/activation-phase-provider-output-plan-snapshot-contract-results.md`

Record absent optional paths as `missing_on_base`; do not create unrelated runtime, cross-chat, agents, or Supabase sync trees.

## Diagnostics

- Verify all Track B docs exist.
- Verify all required tool IDs and capability IDs are present.
- Verify `blocked_current_branch_missing_sync_layer` is recorded.
- Verify the exact no-scope statement is present.
- Verify the package script exists.
- Fail on positive claims enabling public artifacts, signed URL source-of-truth, raw prompt execution, worker/provider/tool/route execution, Supabase mutation, media processing execution, FFmpeg/FFprobe execution, OCR/OpenCV/PyAV/PySceneDetect execution, DeepFilterNet/Signalsmith/Demucs runtime, Qwen/VLM/vLLM runtime, beta unlock, or production unlock.

## Validation

- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent tool-study:track-b-media-processing:diagnostics`
- `npm run build`
- `npm run build:server`
- changed-file safety scan
- staged safety scan
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`

## Final Response Format

- branch
- PR link
- draft status
- commit
- files changed
- source-of-truth read status
- tools/capabilities studied
- capability map
- tool combination map
- routing policy
- handoff contract
- internal beta gap map
- blocked-use register
- diagnostics
- main readiness decision
- internal beta blockers
- external beta blockers
- production blockers
- production capability enabled
- Supabase classification
- cross-chat impact
- affected workstreams
- handoff needed
- duplicate risk
- evidence docs
- blockers
- next Supabase action
- Supabase milestone sync
- exact no-scope statement
- recommended next prompt

## Exact No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
