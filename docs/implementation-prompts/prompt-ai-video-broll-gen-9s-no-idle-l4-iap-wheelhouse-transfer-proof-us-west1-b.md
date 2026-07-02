# AI-VIDEO-BROLL-GEN-9S-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-B

Run one bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in `us-west1-b`, mandatory cleanup, and no model inference.

Exact next prompt: `AI-VIDEO-BROLL-GEN-9S-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-WEST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-west1-b and mandatory cleanup, no model inference`.

This future prompt may create at most one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-west1-b` after repeated preflight passes. It may validate IAP transfer of the already-approved private Python 3.12 wheelhouse only, then must delete only the VM it creates and verify the proof instance, disk, static address, and reservation are absent before completion.

## Required Source Evidence

- `docs/ai-video-broll-gen-9r-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md`
- `docs/ai-video-broll-gen-9p-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `docs/ai-video-broll-gen-9o-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
- `docs/ai-video-broll-gen-9n-no-idle-l4-lifecycle-proof-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Preflight

Before any VM create, repeat:

- active project and auth token refresh;
- `us-west1-b` zone status;
- `g2-standard-4` visibility in `us-west1-b`;
- `nvidia_l4` visibility in `us-west1-b`;
- project `GPUS_ALL_REGIONS` quota;
- regional `NVIDIA_L4_GPUS` quota;
- CPU and SSD quota;
- proof service account present and enabled, without recording its value;
- IAP firewall target tag present or an approved equivalent no-public-IP IAP path for the selected zone;
- required services enabled;
- exact proof VM, disk, static address, and reservation absent;
- private model cache readiness;
- private Python 3.12 wheelhouse manifest present with expected count and checksum;
- final cleanup command plan.

Stop before VM create if any preflight check fails or any matching proof resource already exists.

## Execution Boundary

Allowed in this future prompt after preflight:

- create at most one no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-west1-b`;
- verify the created VM has no external NAT IP;
- transfer or validate transfer of the approved private Python 3.12 wheelhouse over IAP only;
- run only minimal remote file/manifest validation needed to prove the wheelhouse transfer;
- record sanitized transfer success, blocked, or failed evidence;
- delete only the VM created by that prompt;
- verify no proof instance, disk, static address, or reservation remains.

Forbidden:

- public IP;
- capacity reservation;
- firewall, IAM, service-account, key, router, Cloud NAT, bucket, image, or Artifact Registry mutation unless a future prompt explicitly approves a missing cross-region IAP prerequisite before VM creation;
- Docker;
- runtime internet dependency install;
- repository clone;
- dependency install on the VM unless a later prompt explicitly authorizes install after transfer validation;
- Wan/Wan2.1 import;
- model load;
- model inference;
- generated frames, generated video, generated assets;
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

- wheelhouse transfer validation passed with cleanup verified;
- transfer validation blocked or failed with cleanup verified;
- cleanup failure result that clearly blocks further execution.

The prompt must not store account values, service-account values, tokens, public URLs, signed URLs, raw command logs with credentials, or generated media.
