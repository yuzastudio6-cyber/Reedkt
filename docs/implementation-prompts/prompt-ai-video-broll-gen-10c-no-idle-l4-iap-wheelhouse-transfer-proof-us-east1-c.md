# AI-VIDEO-BROLL-GEN-10C-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-C

Run one bounded no-idle L4 VM lifecycle proof in `us-east1-c` for private wheelhouse IAP transfer validation only.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10C-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-c and mandatory cleanup, no model inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.md`
- `docs/ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Scope

This future prompt may attempt exactly one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-east1-c`, only after fresh read-only preflight proves the target is still safe. It may transfer the private Python 3.12 wheelhouse over IAP and run remote wheelhouse validation only. It must delete only resources created by the prompt and verify cleanup before completion.

It must not install dependencies, clone repositories, import Wan/Wan2.1, load a model, run inference, create generated frames, create generated video, create generated assets, mutate Supabase, execute SQL, create signed URLs, mutate credits, or unlock beta/production.

## Required Fresh Preflight

Before any VM create:

- active project is `reeditpro`;
- auth refresh passes with token stdout suppressed;
- `us-east1-c` zone status is `UP`;
- `g2-standard-4` is visible in `us-east1-c`;
- `nvidia_l4` is visible in `us-east1-c`;
- project `GPUS_ALL_REGIONS` quota is at least `1` with usage below limit;
- regional `NVIDIA_L4_GPUS` quota in `us-east1` is at least `1` with usage below limit;
- regional CPU and SSD quota are sufficient;
- proof service account is present and enabled, without recording its value;
- IAP firewall target tag or approved equivalent no-public-IP path is present;
- Compute, IAM, IAP, Logging, and Monitoring services are enabled;
- proof VM, disk, static address, and reservation are absent;
- private cache readiness passes;
- private Python 3.12 wheelhouse manifest is present and complete;
- cleanup commands and absence checks are defined before create.

## Allowed Future Runtime Shape

- VM name: `reeditpro-ai-broll-wan-l4-proof`
- Zone: `us-east1-c`
- Machine type: `g2-standard-4`
- Accelerator: one `nvidia_l4`
- Public IP: forbidden
- Boot disk: auto-delete required
- Lifecycle: create, IAP transfer/validation only, delete, verify absence

## Stop Conditions

Stop and record a blocked result if:

- auth, project, zone, machine type, accelerator, quota, service, IAP, resource absence, cache, or wheelhouse preflight fails;
- a matching proof VM, disk, address, or reservation already exists;
- the VM create returns resource-pool exhaustion or another pre-resource failure;
- the VM is created with any public NAT IP;
- IAP transfer cannot be prepared safely;
- cleanup cannot be verified.

## Forbidden Actions

Do not create a capacity reservation. Do not create a public IP. Do not mutate firewall, IAM, service accounts, service-account keys, routers, Cloud NAT, buckets, images, Artifact Registry, Cloud Run, or quota requests. Do not run Docker. Do not install dependencies. Do not clone repositories. Do not import models. Do not run inference. Do not create generated frames, generated video, generated assets, storage objects, signed URLs, Supabase rows, SQL mutations, credit records, beta unlocks, or production unlocks. Do not claim `dry_run_passed` or `generated_local_fixture_passed`.
