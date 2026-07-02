# AI-VIDEO-BROLL-GEN-10M Payload Install Config Availability Fix

Choose the next approved no-idle L4 payload/install-readiness proof strategy after the cleanup-verified `northamerica-northeast1-b` 10L configuration availability failure.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10M-PAYLOAD-INSTALL-CONFIG-AVAILABILITY-FIX: choose next approved no-idle L4 payload/install-readiness proof strategy after northamerica-northeast1-b configuration availability failure, no VM/no inference`.

This prompt must be no-VM and no-inference. It must not create a Compute Engine VM, disk, address, reservation, firewall rule, service account, bucket, Cloud Run job, Docker container, IAP tunnel, SSH session, dependency install, model import, model inference, generated video, generated asset, Supabase row, SQL mutation, signed URL, public artifact, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Source Evidence

- `docs/ai-video-broll-gen-10l-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast1-b-result.md`
- `docs/ai-video-broll-gen-10k-payload-install-stockout-fix-result.md`
- `docs/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.md`
- `docs/external-agent-tool-execution-readiness-rollup.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Required Analysis

- Treat `configuration_availability` as separate from quota and metadata visibility.
- Record that `northamerica-northeast1-b` returned `ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS` for `g2-standard-4` plus one `nvidia_l4`.
- Do not blindly retry `northamerica-northeast1-b`.
- Compare remaining no-idle options such as same-region backup zones, cross-region North America zones, delayed retry policy, and scale-to-zero architecture planning.
- Keep capacity reservation and always-on GPU rejected unless a future explicit approval changes the no-idle posture.
- Preserve the run-when-used and stop-when-idle policy: no idle GPU VM, no capacity reservation, and no always-on proof host by default.
- Preserve the full private wheelhouse and cache readiness evidence.
- Select exactly one recommended next prompt.

## Required Output

- A result doc explaining what failed, why it failed, what not to retry blindly, and how the next strategy reduces the same failure risk.
- A deterministic mock result spec.
- A text/static smoke.
- Updated B-roll external-agent readiness surfaces.

## Runtime Gates

- `vmCreated=false`
- `iapTransferExecuted=false`
- `dependencyInstalledOnVm=false`
- `modelImportRun=false`
- `modelInferenceRun=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `storageObjectsCreated=false`
- `signedUrlsCreated=false`
- `publicArtifactsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`
