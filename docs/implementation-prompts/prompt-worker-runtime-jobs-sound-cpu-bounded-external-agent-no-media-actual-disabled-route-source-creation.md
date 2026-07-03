# WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-AGENT-NO-MEDIA-ACTUAL-DISABLED-ROUTE-SOURCE-CREATION

Use `worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_source_owner_review_passed_with_warnings_ready_for_actual_disabled_route_source_creation` as source evidence.

Goal: create only the disabled no-media external-agent route source file for `/api/internal/workers/sound-cpu/no-media-agent-call`.

Allowed source file:
- `server/routes/sound-cpu-no-media-agent-call-routes.ts`

Required source behavior:
- Disabled by default with explicit false runtime flags.
- Internal route shape only; do not register the route in the server app during this gate.
- Return stdout-safe JSON-style blocked results only.
- Require approved snapshot, workspace, project, job, idempotency, worker, image, job type, and static false runtime flags in request shape.
- Reject unsafe envelopes fail-closed, including raw prompts, media paths, signed URLs, provider blobs, service-role payloads, model-weight paths, and artifact write targets.
- No persistence, no Supabase, no SQL, no worker dispatch, no tool execution, no media open/process/write, no providers/models, no Docker/GCP, no artifacts, no beta, and no production unlock.

Duplicate guard:
- Reinspect `server/routes/sound-cpu-worker-routes.ts`, `server/workers/sound-cpu/disabled-dispatch-route.ts`, and `server/workers/sound-cpu/disabled-route-registry.ts`.
- Do not retarget those adjacent disabled worker-job route files unless a later owner prompt explicitly says to.
- Stop if another same-purpose no-media agent-call route source already exists.

Expected pass decision:
`worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_source_created_with_warnings_ready_for_source_owner_review`

Expected blocker decision:
`worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_source_creation_blocked`
