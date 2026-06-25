# AI-VIDEO-BROLL-GEN-7 Model Loader Import Proof Prompt

Goal: run a controlled model loader/import proof for the Gate 6 Wan 1.3B private cache, without inference, generated video, media processing, FFmpeg, Docker/GCP execution, provider calls, worker dispatch, Supabase mutation, SQL, storage upload, signed URLs, credits, beta, or production.

Use Gate 6 as the source of truth:

- `docs/ai-video-broll-generation-controlled-model-weight-download-result.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-change-log.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

Default proof target:

- Wan 1.3B private outside-repo cache at the recorded revision.
- Fresh throwaway Python environment using the Gate 5 requirements manifest.
- Import dependency modules and inspect model/config metadata only.
- No prompt.
- No inference.
- No text encoding call.
- No denoising step.
- No VAE encode/decode.
- No scheduler run.
- No generated frames.
- No generated video.
- No media processing or FFmpeg.

This prompt must repeat environment preflight, prove target isolation, reject public/signed URL source of truth, avoid package-lock churn, and stage only approved evidence files. It must not claim `dry_run_passed` or `generated_local_fixture_passed`.

Exit criteria:

- Dependency imports and model loader metadata checks pass only if the future prompt explicitly authorizes them and the environment passes safety preflight.
- No inference occurs.
- No generated media is created.
- Cleanup/private cache policy is recorded.
- Next prompt is controlled synthetic generation planning only if import proof passes and owner gates remain fail-closed.
