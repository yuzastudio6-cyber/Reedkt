# SOUND-RUNTIME-MEDIA-GATE-2F Controlled Synthetic Route Source Validation

After `WORKER_RUNTIME_JOBS-SOUND-CPU-ACTUAL-SYNTHETIC-ROUTE-SOURCE-OWNER-REVIEW` merges with an explicit pass decision, plan a controlled source-validation gate for the fail-closed synthetic route source created in Gate 2E.

This prompt must not execute workers, execute routes, process media, open media files, run FFmpeg/ffprobe, run Docker, push images, call GCP, mutate Supabase, run SQL, create artifacts, unlock beta, unlock production, claim `generated_local_fixture_passed`, claim `dry_run_passed`, or claim runtime/media/worker readiness unless a later owner-approved execution gate explicitly allows the exact action.
