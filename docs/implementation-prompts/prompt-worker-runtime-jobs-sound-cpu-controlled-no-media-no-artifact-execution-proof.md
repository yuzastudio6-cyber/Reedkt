# WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-NO-MEDIA-NO-ARTIFACT-EXECUTION-PROOF: Run Limited SOUND CPU Package Proof, No Media/Artifacts

Use `worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_execution_plan_completed_with_warnings_ready_for_controlled_no_media_no_artifact_execution_proof` as source evidence. Run only the explicitly planned local package-level proof in a disposable venv outside the repo. Do not run ReeditPro workers, routes, tool runtime dispatch, media processing, FFmpeg/ffprobe, provider calls, Supabase, SQL, Docker, GCP, artifact writes, signed URLs, billing, beta unlocks, production unlocks, raw prompt execution, final render, or export.

Allowed future proof scope: create a disposable local venv, install only `server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt`, run metadata/import checks and synthetic in-memory assertions only, then remove the venv. Reject media paths, real user media, `audioread.audio_open`, pydub media open/export/playback, artifact writes, Supabase/SQL, provider/model calls, worker dispatch, route execution, service-role payloads, Docker/GCP, and any beta/production readiness claim.

If any prohibited action is attempted or any cleanup fails, stop and use the matching blocked decision from the cleanup/stop register.
