# AI-VIDEO-BROLL-GEN-9C GCP L4 Prerequisite Verification Prompt

Goal: verify prerequisites for the future GCP L4 private synthetic proof without mutating cloud resources, running inference, creating media, dispatching workers, uploading storage, creating signed URLs, touching Supabase, executing SQL, mutating credits, or unlocking beta/production.

Use Gate 9B as the source of truth:

- `docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md`
- `docs/ai-video-broll-generation-gcp-l4-cost-quota-preflight-plan.md`
- `docs/ai-video-broll-generation-gcp-l4-private-cache-transfer-policy.md`
- `docs/ai-video-broll-generation-runtime-memory-owner-review.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`

Allowed in that future prompt only if explicitly repeated there:

- read-only local tool availability checks;
- read-only active Google Cloud account/project identity check without printing secrets;
- read-only L4 quota and region availability checks;
- read-only official pricing source check.

Forbidden in that future prompt:

- creating, deleting, or mutating any Google Cloud resource;
- running Cloud Run, GKE, Docker build/run/push, or model inference;
- uploading model weights or generated artifacts;
- creating signed URLs or public buckets;
- dispatching workers or calling providers;
- touching Supabase or SQL;
- mutating credits;
- claiming runtime readiness, beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

If verification passes, recommend the next prompt as an owner-reviewed execution plan only, not execution itself.
