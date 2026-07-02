# AI-VIDEO-BROLL-GEN-10A-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-B

Run one bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in `us-east1-b`, then mandatory cleanup. This prompt is the future execution prompt selected by AI-VIDEO-BROLL-GEN-9Z after the cleanup-verified `us-east4-c` stockout.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10A-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-b and mandatory cleanup, no model inference`.

This future prompt may attempt exactly one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-east1-b` only after repeated live preflight passes. It must stop before VM create if any preflight check fails. It must delete only resources created by that prompt and verify cleanup before completion.

This future prompt must not use a public IP, create a capacity reservation, keep an idle GPU running, mutate firewall/IAM/service accounts/service-account keys/networking/buckets/images, run Docker, install dependencies, clone repositories, import Wan/Wan2.1, load models, run model inference, create generated frames, create generated video, create generated assets, call providers, dispatch workers, mutate Supabase, execute SQL, create storage objects, create signed URLs, create public artifacts, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Required Source Evidence

- `docs/ai-video-broll-gen-9z-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9y-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-c-result.md`
- `docs/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Required Preflight

Before any VM create, repeat and record:

- active project is `reeditpro`;
- non-interactive token refresh passes with token stdout suppressed;
- `us-east1-b` status is `UP`;
- `g2-standard-4` is visible in `us-east1-b`;
- `nvidia_l4` is visible in `us-east1-b`;
- project `GPUS_ALL_REGIONS` quota limit is at least `1` and usage allows one L4 VM;
- `us-east1` regional `NVIDIA_L4_GPUS` quota limit is at least `1` and usage allows one L4 VM;
- `us-east1` regional CPU and SSD quota are sufficient;
- proof service account is present and enabled, without recording its value;
- IAP firewall target tag `ai-video-broll-wan-l4-proof` is present or an approved equivalent no-public-IP IAP path exists;
- Compute, IAM, IAP, Logging, and Monitoring services are enabled;
- exact proof VM, disk, static address, and reservation are absent;
- private model cache readiness passes;
- private Python 3.12 wheelhouse manifest is present, complete, and checksum-matched;
- cleanup command and absence verification are prepared before create.

## Allowed Runtime Scope

Only after the required preflight passes, the future prompt may:

- create one no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-east1-b`;
- use boot disk auto-delete;
- use the existing IAP-only path to prepare SSH;
- transfer the private Python 3.12 wheelhouse for validation only;
- run remote wheelhouse validation commands that do not install dependencies, import models, or run inference;
- delete the VM created by the prompt;
- verify no proof VM, disk, static address, or reservation remains.

## Required Cleanup

Cleanup must verify:

- proof instance absent;
- proof disk absent;
- proof static address absent;
- proof reservation absent;
- regional L4 quota usage returned to `0` or to the pre-attempt value.

## Stop Conditions

Stop and record a blocked result if:

- preflight fails;
- `us-east1-b` no longer exposes `g2-standard-4` or `nvidia_l4`;
- quota is insufficient;
- a matching proof VM/disk/address/reservation already exists;
- VM create returns resource-pool exhaustion before a VM exists;
- VM create succeeds but any no-public-IP/IAP/cleanup invariant is violated;
- cleanup cannot be verified.
