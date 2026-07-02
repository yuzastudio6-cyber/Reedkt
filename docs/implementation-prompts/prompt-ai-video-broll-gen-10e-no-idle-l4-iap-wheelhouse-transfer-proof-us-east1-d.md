# AI-VIDEO-BROLL-GEN-10E-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-D

Run a bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in `us-east1-d` and mandatory cleanup. Do not run model inference.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10E-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-D: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-d and mandatory cleanup, no model inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result.md`
- `docs/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Scope

This future prompt may run read-only Google Cloud and local cache/wheelhouse checks, then attempt exactly one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-east1-d` only if every preflight check passes. The VM may exist only long enough to validate private Python 3.12 wheelhouse IAP transfer and remote wheelhouse file presence. It must be deleted by the same prompt, and cleanup must verify the proof instance, disk, static address, and reservation are absent.

## Required Preflight

Before any VM create, repeat and record:

- active project is `reeditpro`;
- auth token refresh passes with stdout suppressed;
- required services are enabled;
- `us-east1-d` zone status is `UP`;
- `g2-standard-4` is visible in `us-east1-d`;
- `nvidia_l4` is visible in `us-east1-d`;
- project `GPUS_ALL_REGIONS` quota is at least `1` with usage `0`;
- regional `NVIDIA_L4_GPUS` quota in `us-east1` is at least `1` with usage `0`;
- regional CPU and SSD quota in `us-east1` are sufficient;
- proof service account is present and enabled, without recording its value;
- IAP firewall target tag or an approved equivalent no-public-IP IAP path is present;
- proof VM, disk, static address, and reservation are absent before create;
- private model cache stat-only readiness passes;
- private Python 3.12 wheelhouse manifest is present, complete, and has expected count/checksum;
- cleanup command and absence verification plan are ready.

Stop and record a blocked result before VM create if any preflight check fails.

## Allowed Runtime Shape

If preflight passes, the future prompt may:

- create one no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-east1-d`;
- use the existing proof service account and IAP target tag;
- use boot disk auto-delete;
- transfer the already-approved private Python 3.12 wheelhouse over IAP;
- run remote file-presence and wheelhouse integrity checks only;
- delete only the VM and attached disk created by that prompt;
- verify no matching instance, disk, static address, or reservation remains.

## Forbidden Actions

Do not use a public IP. Do not create capacity reservations. Do not mutate firewall, IAM, service accounts, service-account keys, routers, Cloud NAT, buckets, images, Artifact Registry, Cloud Run, or quota requests. Do not run Docker. Do not install dependencies from the network. Do not clone repositories. Do not import Wan/Wan2.1. Do not run model inference. Do not create generated frames, generated video, generated assets, storage objects, signed URLs, Supabase rows, SQL mutations, credit records, beta unlocks, or production unlocks. Do not claim `dry_run_passed` or `generated_local_fixture_passed`.

## Required Output

The future prompt should produce:

- a sanitized result doc with exact commands summarized, not secret-bearing output;
- a deterministic mock/spec result;
- a smoke that validates cleanup and runtime gate flags;
- cleanup proof for instance, disk, static address, and reservation absence;
- next prompt based on outcome:
  - success: review the IAP wheelhouse transfer result and decide whether a no-inference dependency/import proof is next;
  - stockout: record cleanup-verified stockout and choose the next no-VM capacity strategy;
  - preflight failure: record the specific preflight blocker and do not create a VM.
