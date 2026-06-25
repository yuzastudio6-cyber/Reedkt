# SOUND-RUNTIME-MEDIA-GATE-2E Actual Synthetic Worker Route Source

After `WORKER_RUNTIME_JOBS-SOUND-CPU-SYNTHETIC-ROUTE-SOURCE-OWNER-REVIEW` merges with decision `worker_runtime_jobs_sound_cpu_synthetic_route_source_owner_review_passed_with_warnings_ready_for_actual_synthetic_route_source_gate`, create only the approved fail-closed synthetic worker route source files. The source must remain synthetic-only and must reject raw prompts, uploaded media, signed/public artifact URLs, provider outputs, secrets, service-role payloads, model-weight paths, artifact write targets, Supabase mutations, SQL text, Docker commands, and GCP commands.

Do not execute workers, execute routes, execute tools, process uploaded media, open media files, run FFmpeg/ffprobe, run Docker, push images, call GCP, mutate Supabase, run SQL, create artifacts, unlock beta, unlock production, claim `generated_local_fixture_passed`, claim `dry_run_passed`, or claim runtime/media/worker readiness.
