# AI-VIDEO-BROLL-GEN-4 Runtime GPU Owner Review Prompt

Goal: review the Gate 3 dependency plan and decide whether a future controlled dependency install proof can be attempted for the AI video B-roll lane.

Use Gate 3 as the source of truth:

- `docs/ai-video-broll-generation-dependency-install-plan.md`
- `docs/ai-video-broll-generation-runtime-dependency-matrix.md`
- `docs/ai-video-broll-generation-python-cuda-compatibility-plan.md`
- `docs/ai-video-broll-generation-gate-3-blocker-register.md`

This prompt must not download weights, install dependencies, create virtual environments, run inference, generate video, run Docker, call GCP, mutate Supabase, execute SQL, create storage objects, create signed URLs, call providers, dispatch workers, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

Exit criteria:

- Runtime owner accepts or rejects small-preview, mid-720p, high-research, and premium-gated GPU tiers.
- Worker Runtime, Provider Gateway, Track A, Track B, Storage, Billing, Observability, and Product Beta owners remain mapped.
- CPU-only boundary remains diagnostics-only.
- Next prompt is controlled dependency install proof only if owner acceptance is recorded.
