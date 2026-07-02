# AI-VIDEO-BROLL-GEN-9R-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX

Choose the next approved no-idle L4 transfer proof target or capacity strategy after the cleanup-verified `us-west1-a` 9Q stockout. This prompt is read-only and no-VM.

Exact next prompt: `AI-VIDEO-BROLL-GEN-9R-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof target or capacity strategy after us-west1-a stockout, no VM/no inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md`
- `docs/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `docs/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `docs/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Allowed Read-Only Checks

This future prompt may inspect:

- active project and auth refresh with token stdout suppressed;
- project and regional GPU/CPU/SSD quota;
- zone status, `g2-standard-4` visibility, and `nvidia_l4` visibility across candidate zones;
- whether the proof VM, disk, static address, or reservation exists;
- required services, proof service-account presence, and IAP firewall target-tag presence without storing account values;
- private cache and private Python 3.12 wheelhouse manifest readiness;
- whether a capacity reservation, alternate zone, alternate machine shape, or delayed retry should be proposed as a separate future prompt.

## Forbidden

- VM creation;
- disk, static address, reservation, firewall, IAM, service-account, service-account key, router, Cloud NAT, bucket, image, or Artifact Registry mutation;
- SSH, IAP tunnel, or file transfer;
- Docker;
- runtime dependency install;
- repository clone;
- Wan/Wan2.1 import;
- model load;
- model inference;
- generated frames, generated video, or generated assets;
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

- a selected alternate no-idle L4 transfer-proof target with required future preflight;
- a delayed retry recommendation with no VM;
- a separate capacity strategy prompt if all zone retries are too unstable for bounded transfer proof work.

The output must not store account values, service-account values, tokens, public URLs, signed URLs, raw command logs with credentials, or generated media.
