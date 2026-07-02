# AI Video B-roll 10I No-Idle L4 IAP Wheelhouse Transfer Proof Result

Decision: `ai_video_broll_gen_10i_us_west4_c_iap_manifest_transfer_proof_passed_cleanup_verified`.

AI-VIDEO-BROLL-GEN-10I ran one bounded no-idle L4 VM lifecycle in `us-west4-c` after fresh preflight. The proof created one prompt-scoped no-public-IP `g2-standard-4` VM with one `nvidia_l4` accelerator, verified no external NAT IP was present, opened the required IAP SSH path, copied the private Python 3.12 wheelhouse manifest over IAP, validated remote manifest readability, deleted the prompt-created VM, and verified cleanup.

This is IAP transfer/readability evidence only. It does not transfer the full wheelhouse payload, install dependencies, import Wan/Wan2.1, load a model, run inference, create generated frames, create generated video, create generated assets, touch Supabase, execute SQL, create storage objects, create signed URLs, mutate credits, unlock beta, unlock production, claim `dry_run_passed`, or claim `generated_local_fixture_passed`.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c.md`
- `docs/ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-10g-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-a-result.md`
- `docs/ai-video-broll-gen-10f-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-wan-gpu-global-quota-verify-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Fresh Preflight

The execution repeated the required live preflight before VM creation:

| Area | Result |
| --- | --- |
| Project | `reeditpro` matched |
| Token refresh | passed with stdout suppressed |
| Required services | Compute, IAM, IAP, Logging, and Monitoring enabled |
| Zone | `us-west4-c` status `UP` |
| Machine type | `g2-standard-4` visible |
| Accelerator type | `nvidia_l4` visible |
| Image family | ready; latest image `common-cu129-ubuntu-2404-nvidia-580-v20260626` |
| Project `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |
| Project `CPUS_ALL_REGIONS` quota | limit `32`, usage `0` |
| Regional L4 quota | limit `1`, usage `0` |
| Regional CPU quota | limit `200`, usage `0` |
| Regional SSD quota | limit `500`, usage `0` |
| Proof service account | present and enabled; value not stored |
| IAP firewall | present with source `35.235.240.0/20` and target tag `ai-video-broll-wan-l4-proof` |
| Existing proof VM | absent |
| Existing proof disk | absent |
| Existing proof address | absent |
| Existing proof reservation | absent |
| Private cache readiness | stat-only readiness passed |
| Private cache runtime files | `19` |
| Private cache aggregate bytes | `28928887859` |
| Private wheelhouse manifest | present |
| Private wheelhouse complete | `true` |
| Private wheelhouse real wheel count | `66` |
| Private wheelhouse aggregate bytes | `2802483442` |
| Private wheelhouse aggregate SHA-256 | `55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64` |

## Lifecycle Attempt

- proof VM name: `reeditpro-ai-broll-wan-l4-proof`
- target region: `us-west4`
- target zone: `us-west4-c`
- selected GPU: `nvidia_l4`
- machine type: `g2-standard-4`
- no public IP required: `true`
- boot disk auto-delete required: `true`
- create attempted: `true`
- create succeeded: `true`
- external NAT IP present after create: `false`
- IAP SSH readiness: `true`
- IAP manifest transfer attempted: `true`
- IAP manifest transfer succeeded: `true`
- remote manifest readability attempted: `true`
- remote manifest readability passed: `true`
- remote manifest wheel count: `66`
- remote manifest aggregate bytes: `2802483442`
- remote manifest aggregate SHA-256: `55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64`
- full wheelhouse payload transferred: `false`
- dependency install attempted: `false`
- model import attempted: `false`
- model inference attempted: `false`
- cleanup delete attempted: `true`
- cleanup delete succeeded: `true`
- cleanup verified: `true`

## Cleanup Verification

After delete:

- proof instance present: `false`
- proof disk present: `false`
- proof static address present: `false`
- proof reservation present: `false`
- regional L4 quota usage after cleanup: `0`

Cleanup is considered verified because no proof VM, disk, static address, or reservation remained after the prompt-created VM was deleted.

## Runtime Flags

- `gcpMutatingCommandsExecuted=true`
- `computeVmCreateAttempted=true`
- `computeVmCreated=true`
- `computeVmDeleted=true`
- `bootDiskCreatedWithVm=true`
- `bootDiskAutoDeleted=true`
- `externalIpCreated=false`
- `publicIpCreated=false`
- `sshSessionOpened=true`
- `iapTransferExecuted=true`
- `iapTransferSucceeded=true`
- `remoteWheelhouseValidationRun=true`
- `remoteWheelhouseValidationPassed=true`
- `fullWheelhousePayloadTransferred=false`
- `dependencyInstalledOnVm=false`
- `dockerRun=false`
- `modelDownloaded=false`
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

## What This Proves

- The selected `us-west4-c` no-public-IP L4 VM shape can be created for a prompt-scoped no-idle proof.
- The created VM had no external NAT IP.
- The existing IAP SSH path can reach the prompt-scoped VM.
- A private wheelhouse manifest can be transferred over IAP to the VM.
- The remote VM can read the transferred manifest and observe the expected wheel count, aggregate bytes, and aggregate SHA-256.
- The prompt-scoped VM can be deleted immediately after the transfer/readability proof.
- No matching proof VM, disk, static address, or reservation remained after cleanup.

## What This Does Not Prove

- This does not prove full wheelhouse payload transfer, offline dependency install, package import readiness, Wan/Wan2.1 model import, model load, inference, generated video, generated assets, media processing, or final B-roll execution readiness.
- This does not approve keeping an idle GPU VM running.
- This does not approve Docker, dependency install, model import, model inference, generated video, generated assets, Supabase, SQL, storage, signed URLs, credits, beta, or production.
- This does not claim B-roll is external-agent executable end to end.

## Next Prompt

`AI-VIDEO-BROLL-GEN-10J-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-US-WEST4-C: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in us-west4-c with mandatory cleanup, no model import/no inference`
