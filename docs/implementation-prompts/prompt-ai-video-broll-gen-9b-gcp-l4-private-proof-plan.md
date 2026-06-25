# AI-VIDEO-BROLL-GEN-9B GCP L4 Private Synthetic Proof Plan Prompt

Goal: create a no-cloud-execution plan for a future private single-L4 synthetic proof of the Wan 1.3B non-user-media fixture. Do not run Google Cloud commands, Docker, Cloud Run, GKE, SQL, Supabase, providers, workers, inference, media processing, FFmpeg, storage uploads, signed URLs, public artifacts, credit mutations, beta, or production.

Use Gate 9A as the source of truth:

- `docs/ai-video-broll-generation-runtime-memory-owner-review.md`
- `docs/ai-video-broll-generation-runtime-memory-cost-target-matrix.md`
- `docs/ai-video-broll-generation-controlled-synthetic-generation-proof-result.md`
- `docs/ai-video-broll-generation-controlled-synthetic-generation-runtime-estimate.md`
- `docs/ai-video-broll-generation-controlled-model-weight-download-manifest.md`

The plan must define:

- selected GCP region candidates and why they are private/proof-only;
- exact L4-class target shape to request in a future owner-approved execution prompt;
- fresh official pricing check requirement;
- quota check requirement;
- maximum runtime and cost cap;
- private model cache transfer policy with no public bucket and no signed URL source of truth;
- no public endpoint;
- no user media;
- no worker dispatch unless Worker Runtime accepts the private job shape;
- no Supabase mutation until Supabase owner accepts artifact rows/storage;
- cleanup and rollback plan;
- blocked fallback to LTX if L4 quota/cost/policy fails.

The plan may inspect docs and local files only. Passing this plan must still not claim `dry_run_passed`, `generated_local_fixture_passed`, runtime readiness, beta, or production.
