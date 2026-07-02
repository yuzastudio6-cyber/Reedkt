# AI-VIDEO-BROLL-GEN-9U-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-C

Run one bounded no-idle L4 VM lifecycle with private Python 3.12 wheelhouse IAP transfer validation in `us-west1-c`, then mandatory cleanup. This prompt may attempt at most one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 only after fresh preflight passes.

Exact next prompt: `AI-VIDEO-BROLL-GEN-9U-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-c and mandatory cleanup, no model inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.md`
- `docs/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md`
- `docs/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `docs/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `docs/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Required Fresh Preflight

Stop before VM create if any preflight check fails.

- active project is `reeditpro`;
- auth token refresh passes with stdout suppressed;
- `us-west1-c` zone status is `UP`;
- `g2-standard-4` is visible in `us-west1-c`;
- `nvidia_l4` is visible in `us-west1-c`;
- project `GPUS_ALL_REGIONS` quota limit is at least `1` and usage is `0`;
- regional `NVIDIA_L4_GPUS` quota limit is at least `1` and usage is `0`;
- CPU and SSD quota are sufficient for one proof VM;
- proof service account is present and enabled without recording its value;
- IAP SSH firewall target tag is present or an approved equivalent no-public-IP IAP path exists;
- Compute, IAM, IAP, Logging, and Monitoring services are enabled;
- exact proof VM, disk, static address, and reservation are absent;
- private cache readiness passes stat-only;
- private Python 3.12 wheelhouse manifest is present with expected count and checksum;
- cleanup command and post-attempt absence verification are ready.

## Allowed Runtime Action

If and only if every fresh preflight check passes, the future prompt may create at most one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-west1-c`, perform private wheelhouse IAP transfer validation, then delete only resources created by that prompt and verify absence.

## Forbidden

- more than one VM create attempt;
- any public IP;
- capacity reservations;
- firewall, IAM, service-account, service-account-key, router, Cloud NAT, bucket, image, or Artifact Registry mutation;
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

## Required Result

Record the exact outcome:

- preflight pass/fail;
- whether the single allowed VM create attempt was made;
- whether the VM existed;
- whether IAP transfer validation was attempted and passed;
- cleanup/delete action;
- post-cleanup proof VM, disk, address, and reservation absence;
- all runtime and generation gates.

Do not store account values, service-account values, tokens, concrete public URLs, signed URLs, raw command logs with credentials, or generated media.
