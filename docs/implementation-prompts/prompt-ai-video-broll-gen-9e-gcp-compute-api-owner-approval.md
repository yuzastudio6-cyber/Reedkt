# AI-VIDEO-BROLL-GEN-9E GCP Compute API Owner Approval Packet Prompt

Goal: collect an explicit GCP/platform owner decision for the Compute Engine API and L4 quota visibility setup needed before a no-mutation verification retry.

Use Gate 9D as source of truth:

- `docs/ai-video-broll-generation-gcp-compute-api-quota-owner-setup-plan.md`
- `docs/ai-video-broll-generation-gcp-compute-api-quota-setup-change-log.md`
- `docs/ai-video-broll-generation-gcp-l4-prerequisite-verification-report.md`
- `docs/activation-gcp-staging-command-policy.md`
- `docs/activation-gcp-staging-resource-map.md`

The approval packet should decide:

- whether `reeditpro` is accepted as the non-production private proof project or whether a separate proof project is required;
- whether a later prompt may enable Compute Engine API for the accepted proof project;
- whether a later prompt may perform read-only L4 quota and region checks after API enablement;
- whether quota increase planning is allowed if one L4 is unavailable;
- what budget guard and cleanup evidence are required before any execution plan.

Forbidden in that future prompt:

- enabling the Compute Engine API;
- requesting quota;
- creating, deleting, or mutating any Google Cloud resource;
- running Cloud Run, GKE, Docker build/run/push, or model inference;
- uploading model weights or generated artifacts;
- creating signed URLs or public buckets;
- dispatching workers or calling providers;
- touching Supabase or SQL;
- mutating credits;
- claiming runtime readiness, beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

If owner approval is granted, recommend a later setup or verification retry prompt, still separate from inference execution.
