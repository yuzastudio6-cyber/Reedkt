# AI-VIDEO-BROLL-GEN-10P-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST2-A

Run one bounded no-idle L4 VM lifecycle proof in `northamerica-northeast2-a` for private wheelhouse payload transfer and offline dependency install readiness validation. This prompt may create at most one prompt-scoped no-public-IP proof VM, must delete it before completion, and must verify cleanup.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10P-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST2-A: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in northamerica-northeast2-a with mandatory cleanup, no model import/no inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.md`
- `docs/ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result.md`
- `docs/ai-video-broll-gen-10m-payload-install-config-availability-fix-result.md`
- `docs/ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Scope

This prompt may run one prompt-scoped `g2-standard-4` VM with one NVIDIA L4 in `northamerica-northeast2-a` only after fresh preflight passes. The VM must use no public IP and must exist only long enough to validate private wheelhouse payload transfer, remote payload readability, offline dependency install readiness, and cleanup. It must not import Wan, instantiate a pipeline, run inference, generate media, create generated assets, mutate Supabase, execute SQL, create storage objects, create signed URLs, mutate credits, unlock beta, or unlock production.

This prompt must not claim `generated_local_fixture_passed`; it is only a bounded payload/install-readiness proof.

## Required Preflight

- Confirm active project `reeditpro` and refresh auth without printing token values.
- Confirm required services are enabled.
- Confirm `northamerica-northeast2-a` zone status is `UP`.
- Confirm `g2-standard-4` is visible in `northamerica-northeast2-a`.
- Confirm `nvidia-l4` is visible in `northamerica-northeast2-a`.
- Confirm project `GPUS_ALL_REGIONS` quota is at least `1` with usage `0`.
- Confirm `northamerica-northeast2` regional `NVIDIA_L4_GPUS` quota is at least `1` with usage `0`.
- Confirm regional CPU and SSD quota are sufficient.
- Confirm proof service account is present and not disabled, without storing its value.
- Confirm IAP firewall or approved equivalent no-public-IP SSH path is present using sanitized JSON reads plus local filtering, not complex `gcloud --filter` expressions.
- Confirm no proof VM, disk, address, or reservation with the proof name exists before create.
- Confirm private model cache readiness.
- Confirm private Python 3.12 wheelhouse manifest readiness.

## Allowed Runtime Shape

- proof VM name: `reeditpro-ai-broll-wan-l4-proof`
- zone: `northamerica-northeast2-a`
- machine type: `g2-standard-4`
- accelerator: one `nvidia-l4`
- public IP: forbidden
- boot disk: auto-delete
- lifecycle: create, validate payload/install readiness, delete, verify absence
- idle GPU: forbidden

## Failure Handling

If GCP returns `ZONE_RESOURCE_POOL_EXHAUSTED`, `resource_availability`, `configuration_availability`, or equivalent create-time capacity refusal before a VM exists, do not retry another zone inside the same prompt. Record cleanup/absence and recommend a scale-to-zero runtime architecture prompt rather than continuing ad hoc zone churn.

If the VM is created but IAP, transfer, or install-readiness validation fails, delete the VM, verify absence, and record the exact failed step without running model import or inference.

## Forbidden Actions

- Do not create more than one VM.
- Do not create a public IP.
- Do not keep the VM idle after validation.
- Do not create reservations.
- Do not use always-on GPUs.
- Do not run Docker unless a later prompt explicitly approves it.
- Do not import Wan, instantiate a pipeline, run inference, or generate media.
- Do not mutate Supabase, SQL, storage, signed URLs, credits, beta, or production.

## Required Result

Record whether payload transfer, remote payload validation, offline dependency install readiness, dependency import readiness, and cleanup passed. Keep `modelImportRun=false`, `modelInferenceRun=false`, `generatedAssetsCreated=false`, and `generatedLocalFixturePassedClaimed=false` regardless of result.
