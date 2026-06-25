# AI-VIDEO-BROLL-GEN-3 Dependency Install Plan Prompt

Goal: create a planning-only dependency install packet for Gate 2 eligible AI video B-roll candidates.

Use Gate 2 as the source of truth:

- `docs/ai-video-broll-generation-weight-source-checksum-plan.md`
- `docs/ai-video-broll-generation-weight-source-manifest-plan.md`
- `docs/ai-video-broll-generation-checksum-private-cache-policy.md`
- `docs/ai-video-broll-generation-gate-2-blocker-register.md`

Eligible planning candidates:

- Wan / Wan2.1 small T2V first, with 14B lanes deferred to GPU review.
- LTX / LTX-Video with exact version split.
- Mochi 1 fallback/research.

Blocked candidate:

- HunyuanVideo until legal, territory, commercial, and output-use review is accepted.

This prompt must not download weights, install dependencies, run inference, generate video, run Docker, call GCP, mutate Supabase, execute SQL, create storage objects, create signed URLs, call providers, dispatch workers, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

Exit criteria:

- Dependency options are ranked by cost and GPU requirements.
- CPU-only boundaries are explicit.
- Python, CUDA, PyTorch, diffusers, and model-specific runtime paths are planned without installation.
- Package-lock, node_modules, model caches, Docker files, GCP files, Supabase files, and generated media remain untouched.
- Next prompt is runtime GPU owner review only if dependency planning is accepted.
