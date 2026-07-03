# WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-CONTROLLED-TOOL-EXECUTION-SOURCE-GATE

Create the bounded source path for controlled no-media SOUND CPU tool execution.

Required source evidence:
- Decision `worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_unlock_plan_completed_with_warnings_ready_for_controlled_tool_execution_source_gate`.
- Registered route path `/api/internal/workers/sound-cpu/no-media-agent-call`.
- Existing adapter `scripts/validation/worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter.mjs`.
- Existing real external-agent no-media harness proof accepted 15 tools.

Implementation boundary:
- Add source only for a bounded synthetic/no-media execution path.
- Preserve explicit `toolId`, approved snapshot, workspace, project, job, idempotency, worker, image, job type, and runtime false flags.
- Continue to fail closed for unsafe envelope fields, true runtime flags, real media paths, credentials, Supabase/SQL intents, artifacts, provider/model calls, Docker/Cloud Run, beta, and production.
- Do not process real media, open media files, run FFmpeg/ffprobe, touch Supabase, run SQL, create artifacts, call providers/models, run Docker/Cloud Run, or unlock beta/production.
- Do not claim readiness until a later proof executes the bounded source path and verifies exact coverage/blocked scopes.

Next prompt on pass:
- `WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-CONTROLLED-TOOL-EXECUTION-PROOF`
