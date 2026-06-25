# AI-VIDEO-BROLL-GEN-9A Runtime Memory Owner Review Prompt

Goal: review the AI-VIDEO-BROLL-GEN-9 blocked proof result and choose the next cost-friendly synthetic proof target without running inference, creating media, using user media, dispatching workers, calling providers, touching Supabase, executing SQL, uploading storage, creating signed URLs, mutating credits, or unlocking beta/production.

Use Gate 9 as the source of truth:

- `docs/ai-video-broll-generation-controlled-synthetic-generation-proof-result.md`
- `docs/ai-video-broll-generation-controlled-synthetic-generation-proof-preflight.md`
- `docs/ai-video-broll-generation-controlled-synthetic-generation-runtime-estimate.md`
- `docs/ai-video-broll-generation-controlled-synthetic-generation-owner-gate-register.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`

The review must decide exactly one next path:

1. Approve a future local proof only if a higher-memory local GPU target can be proven and stays cost-friendly.
2. Approve a future cost-friendly cloud proof target, likely a single L4-class GPU, only after GCP/Worker Runtime owner acceptance and no public endpoint.
3. Redirect to a smaller secondary model proof, such as LTX, if the owner accepts that it better fits local memory and the B-roll use case.
4. Keep proof execution blocked if no target can satisfy memory, cost, policy, and owner gates.

The review must preserve the Gate 0 ranking unless it explicitly records why the proof target changes: Wan remains primary for realistic stock-style B-roll, LTX remains secondary for fast preview/image-to-video/motion graphics, Mochi remains fallback/research, and HunyuanVideo remains premium gated/blocked.

No generated media may be created in this owner review. Passing this review must still not claim `dry_run_passed`, `generated_local_fixture_passed`, runtime readiness, beta, or production.
