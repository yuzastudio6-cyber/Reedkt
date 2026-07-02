# AI-VIDEO-BROLL-GEN-9Y-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST4-C

Run a bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in `us-east4-c` and mandatory cleanup, no model inference.

Exact next prompt: `AI-VIDEO-BROLL-GEN-9Y-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST4-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east4-c and mandatory cleanup, no model inference`.

This prompt may attempt exactly one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-east4-c` only after fresh preflight passes. The VM must be deleted before the prompt ends. No idle GPU may remain running.

This prompt must not run model import, model load, model inference, generated video creation, generated asset creation, provider calls, worker dispatch, Supabase mutation, SQL, storage object creation, signed URL creation, public artifact publishing, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Required Source Evidence

- `docs/ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.md`
- `docs/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Required Preflight

Stop before VM create if any preflight check fails.

- active project is `reeditpro`;
- token refresh succeeds with stdout suppressed;
- `us-east4-c` zone status is `UP`;
- `g2-standard-4` is visible in `us-east4-c`;
- `nvidia_l4` is visible in `us-east4-c`;
- project `GPUS_ALL_REGIONS` quota has limit at least `1` and usage `0`;
- `us-east4` regional `NVIDIA_L4_GPUS` quota has limit at least `1` and usage `0`;
- `us-east4` CPU and SSD quotas have sufficient headroom;
- proof service account is present and enabled without storing its value;
- IAP firewall target tag `ai-video-broll-wan-l4-proof` or approved equivalent no-public-IP path is present;
- required services are enabled: Compute, IAM, IAP, Logging, and Monitoring;
- exact proof VM, disk, static address, and reservation are absent;
- private model cache stat-only readiness passes;
- private Python 3.12 wheelhouse manifest is present and complete.

## Allowed Runtime Scope

- Create at most one prompt-scoped VM named `reeditpro-ai-broll-wan-l4-proof`.
- Use no public IP.
- Use boot disk auto-delete.
- Prepare IAP SSH only if the VM create succeeds and the VM has no public IP.
- Transfer only the existing private Python 3.12 wheelhouse for validation.
- Validate only wheelhouse presence/checksum or file count on the VM.
- Delete only resources created by this prompt.
- Verify no proof VM, disk, static address, or reservation remains.

## Forbidden Runtime Scope

- Do not use a public IP.
- Do not create capacity reservations.
- Do not mutate firewall, IAM, service accounts, service-account keys, routers, Cloud NAT, buckets, or images.
- Do not run Docker.
- Do not install dependencies.
- Do not clone repositories.
- Do not import Wan/Wan2.1.
- Do not run model inference.
- Do not create generated frames, generated video, or generated assets.
- Do not call providers.
- Do not dispatch workers.
- Do not touch Supabase.
- Do not execute SQL.
- Do not create storage objects.
- Do not create signed URLs.
- Do not mutate credits.
- Do not unlock beta or production.
- Do not claim `dry_run_passed`.
- Do not claim `generated_local_fixture_passed`.

## Required Result

Record a deterministic result doc, mock result, and smoke that include:

- preflight state;
- whether VM create succeeded;
- whether IAP SSH preparation and private wheelhouse transfer were attempted;
- whether remote wheelhouse validation passed;
- cleanup state and absence verification;
- all runtime side-effect flags;
- exact next prompt.
