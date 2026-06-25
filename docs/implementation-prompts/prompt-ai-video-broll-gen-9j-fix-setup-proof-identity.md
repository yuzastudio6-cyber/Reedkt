# AI-VIDEO-BROLL-GEN-9J-FIX-SETUP Create Proof Service Account And Private Admin Path Prompt

Goal: create or bind the missing proof-only GCP identity and no-public-IP private admin path required before retrying the controlled Wan 1.3B L4 private proof. This future prompt may only touch GCP identity and admin-path setup if final preflight repeats and the setup remains least-privilege. It must not create a VM or run inference.

Use Gate 9J-FIX as source of truth:

- `docs/ai-video-broll-generation-gcp-proof-service-account-private-admin-approval.md`
- `docs/ai-video-broll-generation-gcp-proof-service-account-private-admin-change-log.md`
- `docs/ai-video-broll-generation-gcp-controlled-l4-private-proof-result.md`
- `docs/ai-video-broll-generation-gcp-private-proof-owner-execution-approval.md`
- `docs/google-cloud/production-gcp-iam-plan.md`
- `docs/activation-gcp-staging-command-policy.md`

Allowed in that future prompt only if final preflight passes:

- create or identify one proof-only service account for the Wan 1.3B private proof;
- bind minimal logging and monitoring roles only;
- create or verify a no-public-IP private admin path such as IAP;
- create or verify the narrow firewall rule needed for that private admin path;
- record sanitized evidence without emails, credentials, secret values, public URLs, or signed URLs.

Forbidden in that future prompt:

- creating VMs, disks, buckets, reservations, Cloud Run jobs, Docker containers, or model outputs;
- granting owner, editor, broad storage admin, provider-secret access, Supabase access, or unrelated worker permissions;
- reusing the default compute identity or an existing worker identity as the proof VM identity;
- creating service-account keys, raw credential files, committed secrets, or raw Google credential environment payloads;
- enabling public IP, public SSH ingress, public bucket access, signed URLs, storage uploads, providers, workers, Supabase, SQL, media processing, FFmpeg, credits, beta, production, `dry_run_passed`, or `generated_local_fixture_passed`.

Exit decision if successful:

`ai_video_broll_gen_9j_fix_setup_proof_identity_completed_ready_for_controlled_l4_private_proof_retry`
