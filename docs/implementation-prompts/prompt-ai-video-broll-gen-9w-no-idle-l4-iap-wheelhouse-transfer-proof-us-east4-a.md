# AI-VIDEO-BROLL-GEN-9W-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST4-A

Run one bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in `us-east4-a` and mandatory cleanup, no model inference.

Exact next prompt: `AI-VIDEO-BROLL-GEN-9W-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST4-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east4-a and mandatory cleanup, no model inference`.

This future prompt may create at most one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-east4-a` only after fresh preflight passes. The VM may be used only to validate private Python 3.12 wheelhouse transfer over the approved no-public-IP IAP path, then it must be cleaned up before the prompt completes.

## Required Source Evidence

- `docs/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.md`
- `docs/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.md`
- `docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md`
- `docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `docs/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Fresh Preflight Required

Stop before VM create if any preflight check fails.

Required checks:

- active project is `reeditpro`;
- auth token refresh passes with stdout suppressed;
- `us-east4-a` zone status is `UP`;
- `g2-standard-4` is visible in `us-east4-a`;
- `nvidia_l4` is visible in `us-east4-a`;
- project `GPUS_ALL_REGIONS` quota limit is at least `1` with usage `0`;
- regional `NVIDIA_L4_GPUS` quota in `us-east4` is at least `1` with usage `0`;
- regional CPU and SSD quota in `us-east4` can support one `g2-standard-4` VM and boot disk;
- proof service account is present and enabled without storing its value;
- IAP firewall target tag `ai-video-broll-wan-l4-proof` or approved equivalent no-public-IP path is present;
- Compute, IAM, IAP, Logging, and Monitoring APIs are enabled;
- exact proof VM, disk, static address, and reservation are absent;
- private model cache readiness passes;
- private Python 3.12 wheelhouse manifest is present, complete, and has expected count/checksum;
- cleanup trap and absence verification are prepared before create.

## Allowed Runtime Scope

Only these actions may occur after passing preflight:

- create one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-east4-a`;
- use boot disk auto-delete;
- transfer the already prepared private Python 3.12 wheelhouse through IAP;
- validate wheelhouse presence/checksum on the VM;
- delete only the VM/resources created by this prompt;
- verify instance, disk, static address, reservation, and GPU usage cleanup.

## Forbidden Runtime Scope

Do not:

- use a public IP;
- create or use capacity reservations;
- create always-on GPU capacity;
- mutate firewall, IAM, service accounts, service-account keys, routers, Cloud NAT, buckets, or images;
- run Docker;
- install dependencies;
- clone repositories;
- import Wan/Wan2.1;
- load models;
- run model inference;
- create generated frames, generated video, or generated assets;
- call providers;
- dispatch workers;
- touch Supabase;
- execute SQL;
- create storage objects;
- create signed URLs;
- create public artifacts;
- mutate credits;
- unlock beta or production;
- claim `dry_run_passed`;
- claim `generated_local_fixture_passed`.

## Required Result

Record a result document and deterministic mock result whether the proof passes or blocks. The result must include sanitized preflight, create/transfer/cleanup outcome, all side-effect gates, and the exact next prompt based on outcome.
