# AI Video B-roll 10P No-Idle L4 IAP Wheelhouse Payload Install Proof Northamerica Northeast2-A Result

Decision: `ai_video_broll_gen_10p_northamerica_northeast2_a_payload_install_proof_blocked_iap_oslogin_publickey_cleanup_verified`.

AI-VIDEO-BROLL-GEN-10P attempted one bounded no-idle L4 payload/install-readiness proof in `northamerica-northeast2-a`. The target capacity path improved: the prompt-scoped `g2-standard-4` VM with one NVIDIA L4 was created successfully with no public IP, then deleted with cleanup verified. The proof did not reach wheelhouse payload transfer because IAP SSH failed with `Permission denied (publickey)`.

This result changes the blocker. The next prompt should not chase another GPU zone. Capacity and no-public-IP VM creation passed in `northamerica-northeast2-a`; the remaining blocker is IAP/OS Login access readiness before any future GPU VM is created.

Specifically, capacity and no-public-IP VM creation passed; IAP/OS Login publickey access did not.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a.md`
- `docs/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Fresh Preflight

| Area | Result |
| --- | --- |
| Project | `reeditpro` matched |
| Token refresh | passed with stdout suppressed |
| Required services | Compute, IAM, IAP, Logging, and Monitoring enabled |
| Zone | `northamerica-northeast2-a` status `UP` |
| Machine type | `g2-standard-4` available |
| Accelerator type | `nvidia_l4` available after correcting the local command shape |
| Image family | ready; latest image `common-cu129-ubuntu-2404-nvidia-580-v20260626` |
| Project `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` before create |
| Project `CPUS_ALL_REGIONS` quota | limit `32`, usage `0` before create |
| Regional CPU quota | limit `100`, usage `0` before create |
| Regional SSD quota | limit `500`, usage `0` before create |
| Regional L4 quota | limit `1`, usage `0` before create |
| Proof service account | present and not reported disabled; value not stored |
| IAP firewall | present with source `35.235.240.0/20`, target tag `ai-video-broll-wan-l4-proof`, and TCP `22` |
| Existing proof VM | absent |
| Existing proof disk | absent |
| Existing proof address | absent |
| Existing proof reservation | absent |
| Private model cache | stat-only readiness passed |
| Private model cache file count | `19` |
| Private model cache aggregate bytes | `28928887859` |
| Private wheelhouse manifest | present |
| Private wheelhouse complete | `true` |
| Private wheelhouse real wheel count | `66` |
| Private wheelhouse aggregate bytes | `2802483442` |
| Private wheelhouse aggregate SHA-256 | `55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64` |

Two preflight improvements were found and corrected before VM creation:

- `gcloud compute accelerator-types list --zones ...` was an invalid command shape for this CLI; the safe replacement is `gcloud compute accelerator-types describe nvidia-l4 --zone ... --format=value(name)`.
- The first local model-cache path check used the wrong slash-shaped repo path; the authoritative private cache path is the `/Volumes/backup/reeditpro-model-cache/...` path recorded above.

## Lifecycle Attempt

- proof VM name: `reeditpro-ai-broll-wan-l4-proof`
- target zone: `northamerica-northeast2-a`
- selected GPU: `nvidia_l4`
- machine type: `g2-standard-4`
- no public IP required: `true`
- no public IP verified after create: `true`
- boot disk auto-delete required: `true`
- create attempted: `true`
- create succeeded: `true`
- network IP observed: private RFC1918 address only
- public NAT IP present: `false`
- image license observation: Python 3.10 image marker was present in the create output; remote Python could not be verified because SSH did not open
- IAP SSH readiness attempted: `true`
- IAP SSH opened: `false`
- IAP SSH blocker: `permission_denied_publickey`
- gcloud local SSH key generated: `true`
- known hosts entry updated by gcloud: `true`
- full wheelhouse payload transfer attempted: `false`
- remote payload validation attempted: `false`
- offline dependency install attempted: `false`
- dependency import readiness attempted: `false`
- model import attempted: `false`
- model inference attempted: `false`
- delete attempted: `true`
- delete succeeded: `true`
- cleanup verified: `true`

## Cleanup Verification

After the blocked 10P attempt:

- proof instance present: `false`
- proof disk present: `false`
- proof static address present: `false`
- proof reservation present: `false`
- regional `NVIDIA_L4_GPUS` quota usage: `0`
- project `GPUS_ALL_REGIONS` quota usage: `0`

Cleanup was verified with exact-name JSON reads and local filtering. No prompt-scoped VM, disk, address, or reservation remains.

## Runtime Flags

- `gcpMutatingCommandsExecuted=true`
- `computeVmCreateAttempted=true`
- `computeVmCreated=true`
- `computeVmDeleted=true`
- `bootDiskCreatedWithVm=true`
- `bootDiskAutoDeleted=true`
- `externalIpCreated=false`
- `cleanupVerified=true`
- `sshSessionOpened=false`
- `iapTransferExecuted=false`
- `iapTransferSucceeded=false`
- `fullWheelhousePayloadTransferred=false`
- `remoteWheelhouseValidationRun=false`
- `remoteWheelhouseValidationPassed=false`
- `dependencyInstalledOnVm=false`
- `dependencyImportReadinessRun=false`
- `dependencyImportReadinessPassed=false`
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

## Failure Analysis

What failed:

- IAP SSH reached the authentication path but the VM rejected the key: `Permission denied (publickey)`.
- The failure happened after successful VM creation and no-public-IP verification, before payload transfer.
- The root cause is not proven from this prompt because SSH never opened. The likely class is OS Login/public-key readiness: account role, OS Login profile/key propagation, Linux username mapping, or image/metadata interaction.

What did not fail:

- GCP project/auth/service checks passed.
- `northamerica-northeast2-a` had usable create-time G2/L4 capacity for one prompt-scoped VM.
- The VM had no public IP.
- The boot disk auto-delete cleanup path worked.
- Private model cache and private wheelhouse manifest evidence remained ready.

What to do better next time:

- Do not create another GPU VM until IAP/OS Login access readiness is validated or fixed outside a paid L4 lifecycle.
- Add a no-GPU/no-VM IAP/OS Login access fix step that compares the previously passing 10I SSH posture with the 10P metadata/image/user mapping.
- Verify OS Login profile/key posture and required IAM roles before a GPU VM exists; if a short-lived OS Login key mutation is needed, it must be explicitly approved in a separate prompt.
- Avoid verbose `gcloud compute ssh --troubleshoot` output as a primary evidence source; prefer narrow sanitized checks and exact error capture.
- Keep using JSON plus local filtering for resource cleanup and quota checks.

## What This Proves

- `northamerica-northeast2-a` can create the selected `g2-standard-4` plus one `nvidia_l4` shape at least once.
- The no-public-IP requirement was satisfied.
- The prompt-scoped VM lifecycle can be cleaned up, including disk cleanup, without leaving idle GPU resources.
- The blocker has moved from resource availability to IAP/OS Login access.

## What This Does Not Prove

- This does not prove IAP SSH access readiness.
- This does not prove full wheelhouse payload transfer, remote payload validation, offline dependency install, dependency import readiness, model import, model load, inference, generated video, generated assets, media processing, or final B-roll execution readiness.
- This does not approve another ad hoc GPU VM create.
- This does not approve project metadata SSH keys, public IP, always-on GPU, capacity reservation, Docker, dependency install, model import, model inference, generated video, generated assets, Supabase, SQL, storage, signed URLs, credits, beta, or production.
- This does not claim B-roll is external-agent executable end to end.

## Next Prompt

`AI-VIDEO-BROLL-GEN-10Q-IAP-OSLOGIN-ACCESS-FIX: diagnose and plan no-public-IP IAP/OS Login access after northeast2-a VM create success and publickey failure, no GPU VM/no inference`
