# AI-VIDEO-BROLL-GEN-10G-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST4-A

Run one bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in `us-west4-a` and mandatory cleanup. Do not run model inference.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10G-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST4-A: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west4-a and mandatory cleanup, no model inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-10e-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-d-result.md`
- `docs/ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/external-agent-tool-execution-readiness-rollup.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Scope

If fresh preflight passes, attempt exactly one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-west4-a` only long enough to validate private Python 3.12 wheelhouse transfer over IAP and remote manifest readability. Delete the prompt-created VM and verify cleanup before completion.

This prompt must preserve the run-when-used and stop-when-idle GPU posture. It must not install dependencies, import Wan/Wan2.1, run inference, generate media, or unlock beta/production.

## Required Fresh Preflight

- active project is `reeditpro`;
- auth refresh passes with token stdout suppressed;
- required services are enabled;
- `us-west4-a` zone status is `UP`;
- `g2-standard-4` is visible in `us-west4-a`;
- `nvidia-l4` is visible in `us-west4-a`;
- project `GPUS_ALL_REGIONS` quota is at least `1` with usage `0`;
- regional `NVIDIA_L4_GPUS` quota in `us-west4` is at least `1` with usage `0`;
- CPU and SSD quota in `us-west4` are sufficient for one `g2-standard-4` proof VM;
- proof service account is present and not disabled, without storing secret values;
- IAP firewall path is present for target tag `ai-video-broll-wan-l4-proof`;
- no matching proof VM, disk, static address, or reservation exists;
- private model cache stat-only readiness still passes;
- private Python 3.12 wheelhouse manifest remains present and complete;
- cleanup command and absence verification are prepared before any create attempt.

Stop and record a blocked result if any fresh preflight check fails.

## Allowed Runtime Window

Only after preflight passes, the prompt may:

- create one no-public-IP `g2-standard-4` VM with one `nvidia-l4` in `us-west4-a`;
- use only the prompt-scoped proof VM name `reeditpro-ai-broll-wan-l4-proof`;
- use boot disk auto-delete;
- connect only through IAP for the transfer validation;
- transfer or inspect only the private wheelhouse needed for Python 3.12 dependency readiness;
- run remote file listing/checksum/manifest validation for the wheelhouse only;
- delete only the VM created by this prompt;
- verify no proof VM, disk, static address, or reservation remains after cleanup.

## Forbidden Actions

Do not create a public IP. Do not create or modify a capacity reservation. Do not mutate firewall, IAM, service accounts, service-account keys, routers, Cloud NAT, buckets, images, Artifact Registry, Cloud Run, or quota requests. Do not run Docker. Do not install dependencies. Do not clone repositories. Do not import models. Do not run inference. Do not create generated frames, generated video, generated assets, storage objects, signed URLs, Supabase rows, SQL mutations, credit records, beta unlocks, or production unlocks. Do not claim `dry_run_passed` or `generated_local_fixture_passed`.

## Required Output

Produce a sanitized result doc/spec/smoke that records the exact lifecycle outcome. If the VM create stocks out before a VM exists, record cleanup-verified absence. If the VM is created, verify no public IP, validate only the private wheelhouse transfer/readability path, delete the VM, and verify cleanup. In every outcome, keep model inference and generated asset gates false.
