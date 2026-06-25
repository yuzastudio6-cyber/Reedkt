# AI-VIDEO-BROLL-GEN-9F Compute API Enablement Prompt

Goal: enable only the Compute Engine API for the accepted `reeditpro` non-production private proof scope, then record whether the API is enabled. This prompt is not an inference or resource-creation prompt.

Use Gate 9E as source of truth:

- `docs/ai-video-broll-generation-gcp-compute-api-owner-approval-packet.md`
- `docs/ai-video-broll-generation-gcp-compute-api-owner-approval-change-log.md`
- `docs/ai-video-broll-generation-gcp-compute-api-quota-owner-setup-plan.md`
- `docs/ai-video-broll-generation-gcp-l4-prerequisite-verification-report.md`
- `docs/activation-gcp-staging-command-policy.md`

Allowed in that future prompt only if the source state still matches:

- confirm active project is still `reeditpro`;
- confirm active account is present without storing account value;
- enable only `compute.googleapis.com` if it is still disabled;
- verify Compute Engine API enabled status after the command;
- record no VM, quota request, Docker, inference, storage, provider, worker, Supabase, SQL, or credit action occurred.

Forbidden in that future prompt:

- creating VMs, disks, service accounts, networks, buckets, Artifact Registry images, reservations, or Cloud Run jobs;
- requesting or increasing quota;
- running Docker, GKE, Cloud Run, Compute Engine instances, or model inference;
- uploading weights or generated artifacts;
- creating signed URLs or public buckets;
- dispatching workers or calling providers;
- touching Supabase or SQL;
- mutating credits;
- claiming runtime readiness, beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

If API enablement succeeds, recommend a later no-mutation L4 quota verification retry.
