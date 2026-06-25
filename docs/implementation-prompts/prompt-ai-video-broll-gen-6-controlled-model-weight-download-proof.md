# AI-VIDEO-BROLL-GEN-6 Controlled Model Weight Download Proof Prompt

Goal: run a controlled model weight download proof for the approved small-preview AI video B-roll lane, without model import, inference, generated video, Docker/GCP execution, provider calls, worker dispatch, Supabase mutation, SQL, storage upload, signed URLs, credits, beta, or production.

Use Gate 5 as the source of truth:

- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`
- `docs/ai-video-broll-generation-controlled-dependency-install-result.md`
- `docs/ai-video-broll-generation-controlled-install-change-log.md`
- `docs/ai-video-broll-generation-controlled-install-rollback-report.md`

Default proof target:

- Wan 1.3B or LTX small-preview official Hugging Face source only.
- Exact source URL and model identifier from Gate 2.
- Private ignored cache path only.
- SHA-256 per file after download.
- No model import.
- No inference.
- No generated video.
- No media processing or FFmpeg.

This prompt must repeat environment preflight, prove target isolation, reject public/signed URL source of truth, avoid package-lock churn, and stage only approved evidence files. It must not claim `dry_run_passed` or `generated_local_fixture_passed`.

Exit criteria:

- One approved small-preview weight source is downloaded only if the future prompt explicitly authorizes it and the environment passes safety preflight.
- Every downloaded file has SHA-256 evidence.
- No model import or inference occurs.
- Cleanup/private cache policy is recorded.
- Next prompt is model loader/import proof only if weight download proof passes.
