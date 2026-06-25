# AI-VIDEO-BROLL-GEN-5 Controlled Dependency Install Proof Prompt

Goal: run a controlled dependency install proof for the approved small-preview AI video B-roll dependency lane only, without model weights, imports, inference, generated video, Docker/GCP execution, provider calls, worker dispatch, Supabase mutation, SQL, storage, signed URLs, credits, beta, or production.

Use Gate 4 as the source of truth:

- `docs/ai-video-broll-generation-runtime-gpu-owner-review.md`
- `docs/ai-video-broll-generation-runtime-gpu-tier-decision.md`
- `docs/ai-video-broll-generation-runtime-owner-acceptance-map.md`
- `docs/ai-video-broll-generation-gate-4-blocker-register.md`

Default proof target:

- Small-preview dependency lane only.
- Wan 1.3B and LTX dependency metadata first.
- No model weights.
- No model import.
- No generated video.
- No media processing or FFmpeg.

This prompt must repeat environment preflight, prove target isolation, avoid package-lock churn unless explicitly expected, and stage only approved evidence files. It must not claim `dry_run_passed` or `generated_local_fixture_passed`.

Exit criteria:

- Dependencies are installed only if the future prompt explicitly authorizes it and the environment passes safety preflight.
- No model weights are present.
- No model import or inference occurs.
- Cleanup and package diff policy are recorded.
- Next prompt is controlled weight download proof only if dependency install proof passes.
