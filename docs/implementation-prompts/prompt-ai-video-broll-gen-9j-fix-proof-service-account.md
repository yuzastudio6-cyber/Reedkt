# AI-VIDEO-BROLL-GEN-9J-FIX Proof Service Account And Private Admin Path Approval Prompt

Goal: approve or reject the missing GCP identity and private admin path for the AI-VIDEO-BROLL-GEN-9J controlled L4 private proof. This is approval-only. Do not create a VM, disk, service account, network, firewall rule, IAP setting, bucket, Artifact Registry image, reservation, Cloud Run job, quota request, Docker container, dependency install, model import, model inference, generated frame, generated video, media artifact, Supabase row, SQL mutation, provider call, worker job, storage upload, signed URL, public artifact, credit row, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

Use Gate 9J as source of truth:

- `docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-result.md`
- `docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-change-log.md`
- `docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md`
- `docs/ai-video-broll-generation-gcp-private-proof-execution-plan.md`
- `docs/activation-gcp-staging-command-policy.md`

Approve only if the future proof can name a concrete proof-only service account and a concrete no-public-IP private admin path without exposing secrets or broad roles. The service account must be least-privilege, proof-only, and acceptable for a single `g2-standard-4` L4 VM using the Wan 1.3B private cache and non-user tabletop fixture only.

Required decisions:

- `GCP_CLOUD_RUNTIME`: proof service account identity exists or approved future creation path exists.
- `GCP_CLOUD_RUNTIME`: no-public-IP admin path is approved, preferably IAP or an equivalent private path.
- `COMPLIANCE_SECURITY`: no service-account key file, raw credential, broad owner/editor role, or secret value is introduced.
- `OBSERVABILITY_AUDIT_COST`: sanitized evidence format is accepted for service-account/admin-path checks.
- `BILLING_STRIPE_CREDITS`: no user credit mutation and bounded infrastructure proof cost remains accepted.
- `AI_VIDEO_BROLL_GENERATION`: Wan 1.3B, exact revision, and non-user tabletop fixture remain unchanged.

Allowed in this prompt:

- inspect source docs and read-only GCP metadata if needed;
- record whether a proof-only service account and private admin path are approved;
- update docs/spec diagnostics only;
- recommend a later retry prompt if the missing identity/admin path is approved.

Forbidden in this prompt:

- creating, modifying, or deleting GCP resources;
- creating service accounts, keys, IAM bindings, firewall rules, networks, IAP settings, VMs, disks, buckets, reservations, or Cloud Run jobs;
- running Docker, dependency installs, model imports, or model inference;
- uploading weights or generated artifacts;
- creating signed URLs or public buckets;
- dispatching workers or calling providers;
- touching Supabase or SQL;
- mutating credits;
- claiming runtime readiness, beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

Exit decision if successful:

`ai_video_broll_gen_9j_fix_proof_service_account_private_admin_approval_completed_ready_for_controlled_l4_private_proof_retry`
