# AI-VIDEO-BROLL-GEN-9D GCP Compute API And L4 Quota Owner Setup Plan Prompt

Goal: define the owner-reviewed setup plan needed before AI-VIDEO-BROLL-GEN can verify L4 quota for a future private synthetic proof.

Use Gate 9C as source of truth:

- `docs/ai-video-broll-generation-gcp-l4-prerequisite-verification-report.md`
- `docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md`
- `docs/ai-video-broll-generation-gcp-l4-cost-quota-preflight-plan.md`
- `docs/activation-gcp-staging-command-policy.md`
- `docs/activation-gcp-staging-resource-map.md`

The setup plan should cover:

- Compute Engine API owner acceptance for the active non-production project;
- whether `reeditpro` is the intended non-production proof project or whether a separate proof project is required;
- L4 quota request/readiness plan for `us-central1`, `us-east4`, and `us-west1`;
- cost cap and budget guard plan for the first proof;
- no-public-endpoint and cleanup requirements;
- clear separation between API/quota setup planning and any resource creation.

Forbidden in that future prompt:

- enabling the Compute Engine API;
- creating, deleting, or mutating any Google Cloud resource;
- running Cloud Run, GKE, Docker build/run/push, or model inference;
- uploading model weights or generated artifacts;
- creating signed URLs or public buckets;
- dispatching workers or calling providers;
- touching Supabase or SQL;
- mutating credits;
- claiming runtime readiness, beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

If the owner setup plan is accepted, recommend a later no-mutation verification retry before any execution plan.
