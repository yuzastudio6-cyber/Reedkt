# AI-VIDEO-BROLL-GEN-10O-PAYLOAD-INSTALL-RESOURCE-AVAILABILITY-FIX

Choose the next approved no-idle payload/install-readiness strategy after the cleanup-verified `northamerica-northeast1-c` 10N resource availability failure. This is a no-VM strategy prompt.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10O-PAYLOAD-INSTALL-RESOURCE-AVAILABILITY-FIX: choose next approved no-idle payload/install-readiness strategy after northamerica-northeast1-c resource availability failure, no VM/no inference`.

## Required Source Evidence

- `docs/ai-video-broll-gen-10n-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-c-result.md`
- `docs/ai-video-broll-gen-10m-payload-install-config-availability-fix-result.md`
- `docs/ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b-result.md`
- `docs/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Scope

This prompt may inspect repo evidence, private cache metadata, private wheelhouse metadata, and read-only GCP region/zone/quota visibility. It must not create a VM, disk, reservation, firewall, service account, bucket, Docker container, Cloud Run job, storage object, signed URL, generated video, generated asset, provider call, worker dispatch, Supabase row, SQL mutation, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Required Analysis

- Explain why `northamerica-northeast1-b` and `northamerica-northeast1-c` both failed despite green quota and metadata visibility.
- Account for the avoidable 10N preflight command-shape failure: the first firewall check used an invalid `gcloud --filter` expression and was corrected by reading JSON and filtering locally. Keep future firewall/resource inspections on sanitized JSON plus local parsing rather than complex `gcloud --filter` expressions.
- Re-check whether another approved no-idle L4 payload/install proof target exists, including `northamerica-northeast2-a` and `northamerica-northeast2-b`.
- Consider whether a delayed retry, a different machine/GPU shape, or a scale-to-zero runtime architecture path is safer than another immediate zonal retry.
- Preserve the user’s GPU policy: run only when used, stop/delete when idle, and do not use always-on GPUs as a workaround.
- Reject capacity reservation unless a later explicit cost/idle policy accepts it.

## Required Result

Record one of:

- a selected next bounded no-idle payload/install-readiness proof target with fresh preflight requirements;
- a delayed-retry recommendation with no resource mutation;
- a separate scale-to-zero runtime architecture prompt if zonal L4 cold-start failures make repeated VM proof attempts too brittle.

The result must explain how the next attempt avoids repeating the same failure pattern and must keep model import, inference, generated media, Supabase, SQL, storage, signed URLs, credits, beta, and production blocked.
