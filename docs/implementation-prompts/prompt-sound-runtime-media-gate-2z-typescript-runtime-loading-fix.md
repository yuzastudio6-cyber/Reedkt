# SOUND-RUNTIME-MEDIA-GATE-2Z-TYPESCRIPT-RUNTIME-LOADING-FIX: Fix controlled server route TypeScript loading blocker, no worker/media/Supabase execution

Use this prompt only after decision `sound_runtime_media_gate_2z_blocked_typescript_runtime_loading`.

Resolve the controlled server route proof loading blocker caused by Node native TypeScript stripping failing to resolve the extensionless `./synthetic-route-decision` import from `server/workers/sound-cpu/index.ts`.

The fix must not force broad dependency hydration, must not run `npx tsx` unless an existing verified hydrated environment is explicitly accepted, must not execute workers, must not execute tools, must not open or process media, must not run FFmpeg/ffprobe, must not run Docker build/run/push, must not call GCP/Cloud Run/Secret Manager, must not touch Supabase, must not execute SQL, must not create artifacts, must not create signed/public URLs, must not call providers/models, and must not claim route/worker/runtime/media/beta/production readiness.

If the fix requires source changes, keep them narrowly scoped to the approved SOUND CPU route source loading path and preserve public API/runtime boundaries. If the fix cannot be made safely, stop and report the exact blocker.
