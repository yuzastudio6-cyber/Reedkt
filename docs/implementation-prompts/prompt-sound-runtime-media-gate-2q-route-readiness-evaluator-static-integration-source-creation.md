# SOUND-RUNTIME-MEDIA-GATE-2Q: Route readiness evaluator static integration source creation, no execution

Create static integration source only after `WORKER_RUNTIME_JOBS` accepts Gate 2P with decision `worker_runtime_jobs_sound_cpu_route_readiness_evaluator_static_integration_plan_owner_review_passed_with_warnings_ready_for_static_integration_source_creation`.

Allowed source path: `server/workers/sound-cpu/route-readiness-evaluator-static-integration.mjs`. The source may import only `server/workers/sound-cpu/route-readiness-evaluator.mjs` and static fixture records. It must not import route resolvers, execute server routes, dispatch workers, execute workers, execute tools, open or process media, run FFmpeg/ffprobe, run Docker build/run/push, call GCP/Cloud Run, touch Supabase, execute SQL, create artifacts, create signed/public URLs, call providers/models, unlock beta, unlock production, claim `generated_local_fixture_passed`, claim `dry_run_passed`, or claim route/worker/runtime/media readiness.

After source creation, require Worker Runtime owner review before any evaluator import/run, route import, route execution, worker dispatch, or runtime readiness gate.
