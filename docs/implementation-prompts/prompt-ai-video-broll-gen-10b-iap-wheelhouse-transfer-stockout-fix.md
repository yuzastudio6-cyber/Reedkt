# AI-VIDEO-BROLL-GEN-10B-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX

Choose the next approved no-idle L4 transfer proof capacity strategy after the cleanup-verified `us-east1-b` stockout. This prompt is read-only and no-VM.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10B-IAP-WHEELHOUSE-TRANSFER-STOCKOUT-FIX: choose next approved no-idle L4 transfer proof capacity strategy after us-east1-b stockout, no VM/no inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.md`
- `docs/ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result.md`
- `docs/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Scope

This prompt may inspect read-only GCP metadata, quota, zone, machine-type, accelerator, service, IAP firewall, and proof-resource absence state. It may inspect local private cache and wheelhouse manifests. It must not create or delete VMs, disks, addresses, reservations, firewall rules, service accounts, service-account keys, networks, buckets, images, Cloud Run jobs, or quota requests.

## Capacity Strategy Requirements

Evaluate only no-idle options first:

- alternate untried zones with visible `g2-standard-4` and `nvidia_l4`;
- cross-zone retry inside `us-east1`;
- cross-region retry only if local zone choices are exhausted or unsuitable;
- delayed retry only if no safe no-idle target remains;
- capacity reservation only as a separate explicitly approved future prompt, because it is mutating and potentially billable;
- Cloud Run or queued-job scale-to-zero only as a separate runtime architecture track, not as a direct replacement for this transfer-proof prompt.

The selected next prompt must still require:

- active project and auth refresh;
- selected zone `UP`;
- selected zone exposes `g2-standard-4`;
- selected zone exposes `nvidia_l4`;
- project `GPUS_ALL_REGIONS` quota at least `1`;
- selected region `NVIDIA_L4_GPUS` quota at least `1`;
- selected region CPU and SSD quota sufficient;
- proof service account present without storing its value;
- IAP firewall or approved equivalent no-public-IP path;
- required services enabled;
- proof VM, disk, address, and reservation absent;
- private cache readiness;
- private wheelhouse manifest readiness;
- cleanup verification plan.

## Forbidden Actions

Do not create a VM. Do not create a disk, static address, reservation, firewall rule, service account, service-account key, router, Cloud NAT, bucket, image, Artifact Registry resource, Cloud Run job, or quota request. Do not SSH. Do not run IAP transfer commands. Do not install dependencies. Do not import models. Do not run inference. Do not create generated frames, video, or assets. Do not touch Supabase. Do not execute SQL. Do not create storage objects. Do not create signed URLs. Do not mutate credits. Do not unlock beta or production. Do not claim `dry_run_passed` or `generated_local_fixture_passed`.
