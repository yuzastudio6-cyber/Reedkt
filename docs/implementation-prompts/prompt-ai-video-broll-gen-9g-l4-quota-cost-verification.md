# AI-VIDEO-BROLL-GEN-9G L4 Quota And Cost Verification Prompt

Goal: perform a no-mutation verification of NVIDIA L4 availability, one-L4 quota, exact current pricing, and recommended private proof target after Compute Engine API enablement.

Use Gate 9F as source of truth:

- `docs/ai-video-broll-generation-gcp-compute-api-enablement-report.md`
- `docs/ai-video-broll-generation-gcp-compute-api-enablement-change-log.md`
- `docs/ai-video-broll-generation-gcp-compute-api-owner-approval-packet.md`
- `docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md`
- `docs/activation-gcp-staging-command-policy.md`

Allowed in that future prompt:

- confirm Compute Engine API remains enabled;
- run read-only L4 accelerator, region, quota, and machine-type checks;
- inspect official current pricing sources;
- recommend the cheapest acceptable candidate among `us-central1`, `us-east4`, and `us-west1`;
- produce an execution-plan-readiness decision without creating or running anything.

Forbidden in that future prompt:

- creating VMs, disks, service accounts, networks, buckets, Artifact Registry images, reservations, or Cloud Run jobs;
- enabling additional APIs;
- requesting or increasing quota;
- running Docker, GKE, Cloud Run, Compute Engine instances, or model inference;
- uploading weights or generated artifacts;
- creating signed URLs or public buckets;
- dispatching workers or calling providers;
- touching Supabase or SQL;
- mutating credits;
- claiming runtime readiness, beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

If L4 quota and cost are acceptable, recommend a separate private proof execution plan prompt, not inference execution.
