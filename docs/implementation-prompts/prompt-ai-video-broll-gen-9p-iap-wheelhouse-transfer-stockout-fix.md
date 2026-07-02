# AI-VIDEO-BROLL-GEN-9P-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX

Choose an approved alternate no-idle L4 transfer proof zone or capacity strategy after two cleanup-verified `us-central1-c` resource-pool failures before VM creation.

Exact next prompt: `AI-VIDEO-BROLL-GEN-9P-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose approved alternate no-idle L4 transfer proof zone or capacity strategy, no VM/no inference`.

This is a planning/readiness prompt only. It must not create a VM, disk, address, reservation, firewall rule, service account, service-account key, router, Cloud NAT, bucket, image, Artifact Registry image, Cloud Run job, Docker container, IAP tunnel, SSH session, storage object, signed URL, generated asset, generated video, or credit record.

## Required Source Evidence

- `docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `docs/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `docs/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.md`
- `docs/ai-video-broll-gen-9m-no-idle-l4-lifecycle-proof-result.md`
- `docs/ai-video-broll-gen-9l-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9l-no-idle-l4-lifecycle-proof-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Allowed Read-only Work

- Inspect active project and auth health with token stdout suppressed.
- Inspect available zones, machine types, and L4 accelerator visibility.
- Inspect project `GPUS_ALL_REGIONS` quota and candidate regional `NVIDIA_L4_GPUS` quota.
- Inspect exact proof resource absence for any candidate zone before recommending it.
- Inspect private cache and wheelhouse readiness with no model import or inference.
- Decide whether the next bounded transfer proof should retry `us-central1-c`, select a different zone with quota, or use a non-idle reservation/capacity strategy that still deletes any prompt-scoped resource.

## Forbidden Work

- no VM creation;
- no reservations;
- no public IP;
- no firewall/IAM/network mutation;
- no Docker;
- no runtime internet dependency install;
- no repository clone;
- no dependency install;
- no Wan/Wan2.1 import;
- no model load;
- no model inference;
- no generated frames, generated video, or generated assets;
- no provider calls;
- no worker dispatch;
- no Supabase;
- no SQL;
- no storage writes;
- no signed URLs;
- no public artifacts;
- no credit mutation;
- no beta or production unlock;
- no `dry_run_passed` claim;
- no `generated_local_fixture_passed` claim.

## Expected Output

Record one of:

- an approved alternate no-idle L4 transfer proof prompt with zone and cleanup requirements;
- a capacity strategy prompt if no zone is acceptable;
- a blocked report if no safe candidate can be chosen.

The output must not store account values, service-account values, tokens, public URLs, signed URLs, raw command logs with credentials, or generated media.
