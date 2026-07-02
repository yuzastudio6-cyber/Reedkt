# AI-VIDEO-BROLL-GEN-10N-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST1-C

Run one bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in `northamerica-northeast1-c`, then clean up. This is the future execution prompt selected by AI-VIDEO-BROLL-GEN-10M after the cleanup-verified `northamerica-northeast1-b` configuration availability failure.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10N-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST1-C: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in northamerica-northeast1-c with mandatory cleanup, no model import/no inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10m-payload-install-config-availability-fix-result.md`
- `docs/ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b-result.md`
- `docs/ai-video-broll-gen-10k-payload-install-stockout-fix-result.md`
- `docs/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Scope

This future prompt may attempt exactly one prompt-scoped no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `northamerica-northeast1-c` only after repeated preflight passes. It may transfer only the private Python 3.12 wheelhouse payload, validate remote payload presence, and run offline dependency install readiness checks if safe. It must delete the prompt-created VM and verify cleanup before completion.

This prompt must not run model import, model load, model inference, generated video creation, generated asset creation, FFmpeg, Docker, provider calls, worker dispatch, Supabase mutation, SQL, storage upload, signed URL creation, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Required Preflight

- active project is `reeditpro`;
- auth refresh passes with token stdout suppressed;
- Compute, IAM, IAP, Logging, and Monitoring APIs are enabled;
- `northamerica-northeast1-c` zone status is `UP`;
- `g2-standard-4` is visible in `northamerica-northeast1-c`;
- `nvidia-l4` is visible in `northamerica-northeast1-c`;
- latest approved Deep Learning VM image is available;
- project `GPUS_ALL_REGIONS` quota limit is at least `1` with usage `0`;
- `northamerica-northeast1` regional `NVIDIA_L4_GPUS` quota limit is at least `1` with usage `0`;
- `northamerica-northeast1` CPU and SSD quota are sufficient;
- proof service account is present and not disabled, without recording its value;
- IAP firewall or approved equivalent no-public-IP path is present;
- proof VM, disk, static address, and reservation are absent before create;
- private model cache stat-only readiness passes;
- private Python 3.12 wheelhouse manifest is present, complete, and matches expected count/checksum;
- cleanup and absence verification commands are prepared before create.

## Execution Bounds

- Create at most one no-public-IP `g2-standard-4` VM with one `nvidia-l4` in `northamerica-northeast1-c`.
- Use the proof VM name `reeditpro-ai-broll-wan-l4-proof`.
- Use boot disk auto-delete.
- Use only IAP/no-public-IP access.
- Transfer only the private wheelhouse payload.
- Run only offline dependency install readiness checks.
- Do not import Wan, instantiate a pipeline, run inference, or generate media.
- Delete only resources created by this prompt.
- Verify no proof VM, disk, static address, or reservation remains.

## Failure Handling

- If preflight fails, stop before create and record the specific preflight blocker.
- If GCP returns resource pool exhaustion or configuration availability failure, do not retry another zone inside the same prompt.
- If a VM is created, cleanup must run before completion.
- If cleanup cannot be verified, report manual cleanup required and do not claim readiness.

## Expected Result

Record either:

- full private wheelhouse payload transfer plus offline dependency install readiness evidence with cleanup verified; or
- a cleanup-verified blocked result with the exact blocker and next safer prompt.

This future prompt does not claim external-agent B-roll execution readiness, beta readiness, production readiness, `dry_run_passed`, or `generated_local_fixture_passed`.
