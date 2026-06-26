# WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-NO-MEDIA-NO-ARTIFACT-EXECUTION-PROOF-FIX: Isolate SOUND CPU Package Import Timeout, No Media/Artifacts

Use `worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_import_or_synthetic_failure` as source evidence. Do not claim package proof passed or tool-call/runtime readiness.

Create a fix packet that isolates the hanging package import with per-module bounded subprocesses in a disposable venv outside the repo. Install only `server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt`. Do not open media files, call `audioread.audio_open`, run pydub media open/export/playback, run FFmpeg/ffprobe, run worker dispatch, execute routes, call ReeditPro tool runtime paths, touch Supabase, run SQL, call providers/models, run Docker/GCP, create artifacts, create signed/public URLs, mutate billing, or unlock beta/production.

If an exact package import timeout is found, record the package and stop with a blocker-specific decision. If the package import blocker is fixed and the full no-media/no-artifact proof passes, record pass evidence and keep runtime/media/artifact/beta/production readiness unclaimed until later gates.
