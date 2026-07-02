# AI-VIDEO-BROLL-GEN-9M-NO-IDLE-L4-PROOF-EXECUTE-US-CENTRAL1-A

Run one bounded no-idle L4 VM lifecycle proof in `us-central1-a` with mandatory cleanup and no model inference.

Exact next prompt: `AI-VIDEO-BROLL-GEN-9M-NO-IDLE-L4-PROOF-EXECUTE-US-CENTRAL1-A: run bounded no-idle L4 VM lifecycle proof in us-central1-a with mandatory cleanup, no model inference`.

This future prompt may create at most one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-central1-a` after repeated preflight passes. It must delete only the VM it creates and verify the proof instance, disk, static address, and reservation are absent before completion.

## Required Source Evidence

- `docs/ai-video-broll-gen-9l-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.md`
- `docs/implementation-prompts/prompt-ai-video-broll-gen-9k-no-idle-l4-proof.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`

## Preflight

Before any VM create, repeat:

- active project and auth token refresh;
- `us-central1-a` zone status;
- `g2-standard-4` visibility in `us-central1-a`;
- `nvidia_l4` visibility in `us-central1-a`;
- project `GPUS_ALL_REGIONS` quota;
- regional `NVIDIA_L4_GPUS` quota;
- CPU and SSD quota;
- proof service account present and enabled, without recording its value;
- IAP firewall target tag present;
- required services enabled;
- exact proof VM, disk, static address, and reservation absent;
- private cache readiness;
- final cleanup command plan.

Stop before VM create if any preflight check fails or any matching proof resource already exists.

## Execution Boundary

Allowed in this future prompt after preflight:

- create at most one no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-central1-a`;
- record sanitized create success or stockout failure;
- delete only the VM created by that prompt;
- verify no proof instance, disk, static address, or reservation remains.

Forbidden:

- public IP;
- capacity reservation;
- firewall, IAM, service-account, key, router, Cloud NAT, bucket, or image mutation;
- Docker;
- dependency install;
- Wan/Wan2.1 import;
- model inference;
- generated frames, generated video, generated assets;
- provider calls;
- worker dispatch;
- Supabase;
- SQL;
- storage writes;
- signed URLs;
- public artifacts;
- credit mutation;
- beta or production unlock;
- `dry_run_passed` claim;
- `generated_local_fixture_passed` claim.

## Expected Output

Record one of:

- lifecycle proof passed with cleanup verified;
- stockout or safety-blocked result with cleanup/absence verified;
- cleanup failure result that clearly blocks further execution.

The prompt must not store account values, service-account values, tokens, public URLs, signed URLs, raw command logs with credentials, or generated media.
