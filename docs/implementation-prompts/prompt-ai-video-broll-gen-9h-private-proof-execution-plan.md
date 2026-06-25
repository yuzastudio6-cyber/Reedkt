# AI-VIDEO-BROLL-GEN-9H Private Proof Execution Plan Prompt

Goal: produce a no-execution private proof execution plan for the Wan 1.3B single-L4 proof target selected by AI-VIDEO-BROLL-GEN-9G. This prompt must write only plan/spec/diagnostic evidence. It must not create a VM, disk, service account, network, bucket, Artifact Registry image, reservation, Cloud Run job, Docker container, model output, generated frame, generated video, public artifact, signed URL, Supabase row, SQL mutation, provider call, worker job, credit row, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

Use Gate 9G as source of truth:

- `docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-report.md`
- `docs/ai-video-broll-generation-gcp-l4-quota-cost-verification-change-log.md`
- `docs/ai-video-broll-generation-gcp-compute-api-enablement-report.md`
- `docs/ai-video-broll-generation-gcp-l4-private-synthetic-proof-plan.md`
- `docs/activation-gcp-staging-command-policy.md`

Recommended future target from Gate 9G:

- Project: `reeditpro`.
- Region: `us-central1`.
- Default zone candidate: `us-central1-b`.
- Zone fallback order: `us-central1-a`, then `us-central1-c`.
- Machine type: `g2-standard-4`.
- Accelerator: one NVIDIA L4.
- Planning price: USD `0.706832276` per hour for the officially extracted Iowa (`us-central1`) G2 L4 row.
- Max runtime cap: 60 minutes.
- Placeholder cap: USD `2.00`, before separately bounded disk/network/storage costs.

Allowed in that future prompt:

- define exact future command text for a private, non-production, no-public-endpoint proof plan;
- define service account, no-secret, no-public-IP, private model cache transfer, checksum, disk, cleanup, and cost boundaries as text only;
- define execution abort criteria and cleanup verification criteria;
- include final official pricing recheck requirements before any later VM creation prompt;
- include owner acceptance checklist for GCP, Worker Runtime, Billing, Storage, and AI_VIDEO_BROLL_GENERATION.

Forbidden in that future prompt:

- creating VMs, disks, service accounts, networks, buckets, Artifact Registry images, reservations, Cloud Run jobs, or quota requests;
- enabling additional APIs;
- running Docker, GKE, Cloud Run, Compute Engine instances, or model inference;
- installing dependencies, downloading weights, importing model modules, or instantiating a pipeline;
- uploading weights or generated artifacts;
- creating signed URLs or public buckets;
- dispatching workers or calling providers;
- touching Supabase or SQL;
- mutating credits;
- claiming runtime readiness, beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

Exit decision if successful:

`ai_video_broll_gen_9h_private_proof_execution_plan_completed_ready_for_owner_execution_approval`
