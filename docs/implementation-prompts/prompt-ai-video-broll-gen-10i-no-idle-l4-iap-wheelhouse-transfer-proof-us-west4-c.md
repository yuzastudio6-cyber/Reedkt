# AI-VIDEO-BROLL-GEN-10I-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST4-C

Run one bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in `us-west4-c` and mandatory cleanup. Do not run model inference.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10I-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST4-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west4-c and mandatory cleanup, no model inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.md`
- `docs/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Scope

If fresh preflight passes, attempt exactly one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-west4-c` only long enough to validate private Python 3.12 wheelhouse transfer over IAP and remote manifest readability. Delete the prompt-created VM and verify cleanup before completion.

This prompt must not install dependencies, import Wan/Wan2.1, run inference, create generated frames, create generated video, create generated assets, touch Supabase, execute SQL, create storage objects, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Fresh Preflight Required Before VM Create

Stop and record a blocked result before any VM create if any check fails:

- active project is `reeditpro`;
- auth refresh passes with token stdout suppressed;
- required services are enabled;
- `us-west4-c` zone status is `UP`;
- `g2-standard-4` is visible in `us-west4-c`;
- `nvidia-l4` is visible in `us-west4-c`;
- project `GPUS_ALL_REGIONS` quota is at least `1` with usage `0`;
- regional `NVIDIA_L4_GPUS` quota in `us-west4` is at least `1` with usage `0`;
- CPU and SSD quota in `us-west4` are sufficient for one `g2-standard-4` proof VM;
- proof service account is present and not disabled, without recording its value;
- IAP firewall or approved equivalent no-public-IP path is present for the target tag;
- matching proof VM, disk, static address, and reservation are absent;
- private model cache stat-only readiness passes;
- private Python 3.12 wheelhouse manifest is present, complete, and has the expected aggregate SHA-256;
- cleanup command and absence verification plan are ready.

## Allowed Runtime Actions

Only after fresh preflight passes:

- create one no-public-IP `g2-standard-4` VM with one `nvidia-l4` in `us-west4-c`;
- use boot disk auto-delete;
- use the existing proof target tag and service account;
- open only the required IAP SSH/transfer path for wheelhouse manifest transfer validation;
- validate remote wheelhouse manifest readability only;
- delete only the prompt-created VM;
- verify no matching VM, disk, static address, or reservation remains.

## Forbidden Actions

Do not create public IPs, capacity reservations, new firewall rules, service accounts, service-account keys, routers, Cloud NAT, buckets, images, Artifact Registry resources, Cloud Run jobs, Docker containers, dependency installs, repository clones, model imports, model loads, model inference, generated video, generated assets, Supabase rows, SQL mutations, signed URLs, public artifacts, credit mutations, beta unlocks, production unlocks, `dry_run_passed` claims, or `generated_local_fixture_passed` claims.

## Required Output

Produce a sanitized result doc/spec/smoke that records the exact outcome. If the create attempt stocks out before a VM exists, record the sanitized stockout and verify absence. If transfer validation runs, report only sanitized summaries and cleanup evidence.
