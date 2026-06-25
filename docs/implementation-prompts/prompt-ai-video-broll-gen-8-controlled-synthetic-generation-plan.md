# AI-VIDEO-BROLL-GEN-8 Controlled Synthetic Generation Plan Prompt

Goal: create a controlled synthetic generation plan for the Gate 7 Wan 1.3B import-proof lane, without running inference, generating frames, creating video, media processing, FFmpeg, Docker/GCP execution, provider calls, worker dispatch, Supabase mutation, SQL, storage upload, signed URLs, credits, beta, or production.

Use Gate 7 as the source of truth:

- `docs/ai-video-broll-generation-controlled-model-loader-import-result.md`
- `docs/ai-video-broll-generation-controlled-model-loader-import-metadata.md`
- `docs/ai-video-broll-generation-controlled-model-loader-import-change-log.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

Default planning target:

- Wan 1.3B private outside-repo cache at the recorded revision.
- One tiny synthetic non-user-media prompt plan.
- Explicit CPU/GPU memory and runtime estimate before any execution.
- Explicit owner acceptance needed before denoising, frame creation, VAE decode, video writing, or FFmpeg.
- No inference in the planning prompt itself.
- No generated frames.
- No generated video.
- No media processing or FFmpeg.

This prompt must repeat environment preflight, prove target isolation, reject public/signed URL source of truth, avoid package-lock churn, and stage only approved evidence files. It must not claim `dry_run_passed` or `generated_local_fixture_passed`.

Exit criteria:

- A future controlled synthetic generation proof is either approved as a tiny non-user-media local proof or blocked with clear owner reasons.
- Runtime/memory expectations are recorded.
- No media is created in the planning prompt.
- Next prompt is controlled synthetic generation proof only if planning passes and owner gates remain fail-closed.
