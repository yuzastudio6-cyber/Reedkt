# AI Video B-roll 10K Payload Install Stockout Fix Result

Decision: `ai_video_broll_gen_10k_payload_install_stockout_fix_ready_for_northamerica_northeast1_b_payload_install_proof_no_vm_no_inference`.

AI-VIDEO-BROLL-GEN-10K reviewed the cleanup-verified `us-west4-c` 10J payload/install-readiness stockout and ran read-only Google Cloud plus local cache/wheelhouse checks to choose the next capacity strategy. It did not create a VM, disk, static address, reservation, firewall rule, service account, bucket, Cloud Run job, Docker container, IAP tunnel, SSH session, dependency install, model import, model inference, generated video, generated asset, Supabase row, SQL mutation, signed URL, public artifact, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

The selected strategy is one future bounded cross-region no-idle payload/install-readiness proof in `northamerica-northeast1-b`. This target is selected because it is an unattempted North America zone with `g2-standard-4` and `nvidia-l4` visible, regional L4 quota limit `1`, CPU quota limit `200`, SSD quota limit `500`, the existing IAP firewall path, and no matching proof resources. The strategy rejects a blind same-zone retry in `us-west4-c` because 10J just stocked out there, while preserving the user's run-when-used and stop-when-idle posture.

Capacity reservation, always-on GPU, public IP, immediate Docker/Cloud Run execution, queued worker execution, model import, and inference remain rejected for this prompt. A future scale-to-zero Cloud Run or worker architecture may be the better long-term runtime shape, but it needs its own design and evidence path; 10K only selects the next no-idle payload/install proof target.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-10k-payload-install-stockout-fix.md`
- `docs/ai-video-broll-gen-10j-no-idle-l4-iap-wheelhouse-payload-install-proof-us-west4-c-result.md`
- `docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md`
- `docs/ai-video-broll-gen-10h-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/external-agent-tool-execution-readiness-rollup.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Read-Only Findings

| Area | Result |
| --- | --- |
| Project | `reeditpro` matched |
| Token refresh | passed with stdout suppressed |
| Project `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |
| Project `CPUS_ALL_REGIONS` quota | limit `32`, usage `0` |
| Candidate region | `northamerica-northeast1` status `UP` |
| Candidate zone | `northamerica-northeast1-b` status `UP` |
| Candidate machine type | `g2-standard-4` visible |
| Candidate accelerator | `nvidia-l4` visible |
| Regional `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| Regional `CPUS` quota | limit `200`, usage `0` |
| Regional `SSD_TOTAL_GB` quota | limit `500`, usage `0` |
| Proof service account | present and not disabled; value not stored |
| IAP firewall | present with source `35.235.240.0/20`, target tag `ai-video-broll-wan-l4-proof`, and TCP `22` |
| Matching proof instances | `0` |
| Matching proof disks | `0` |
| Matching proof addresses | `0` |
| Matching proof reservations | `0` |
| Private model cache | stat-only readiness passed |
| Private model cache runtime files | `19` |
| Private model cache aggregate bytes | `28928887859` |
| Private wheelhouse manifest | present |
| Private wheelhouse complete | `true` |
| Private wheelhouse real wheel count | `66` |
| Private wheelhouse aggregate bytes | `2802483442` |
| Private wheelhouse aggregate SHA-256 | `55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64` |

## Candidate Strategy Matrix

| Candidate | Evidence | Disposition |
| --- | --- | --- |
| Same-zone `us-west4-c` retry | 10I proved no-public-IP IAP manifest transfer/readability there, but 10J stocked out before VM creation during payload/install proof | rejected as immediate blind retry |
| Cross-zone `us-west4-a` retry | same region and quota surface, but 10G stocked out before VM creation | rejected recent stockout |
| Cross-region previously attempted US zones | `us-central1`, `us-west1`, `us-east1`, and `us-east4` have repeated cleanup-verified stockout evidence across multiple L4/G2 zones | rejected recent stockout chain |
| `northamerica-northeast1-b` | unattempted, `UP`, `g2-standard-4` visible, `nvidia-l4` visible, L4 quota `1/0`, CPU quota `200/0`, SSD quota `500/0` | selected |
| `northamerica-northeast1-c` | unattempted, `UP`, `g2-standard-4` visible, `nvidia-l4` visible, same regional quota surface | backup same-region zone |
| `northamerica-northeast2-a` | unattempted, `UP`, `g2-standard-4` visible, `nvidia-l4` visible, L4 quota `1/0`, CPU quota `100/0`, SSD quota `500/0` | backup cross-region zone |
| `northamerica-northeast2-b` | unattempted, `UP`, `g2-standard-4` visible, `nvidia-l4` visible, same regional quota surface as `northamerica-northeast2-a` | backup cross-region zone |
| Capacity reservation | might reduce stockouts, but is mutating and can reserve billable/idle capacity | rejected for no-idle posture |
| Always-on GPU VM | would avoid cold-start stockouts but keeps GPU running when no one is using it | rejected |
| Immediate Cloud Run or queued worker execution | aligns with future scale-to-zero direction, but requires a separate Docker/runtime/worker path and does not validate the current private IAP wheelhouse payload/install proof | deferred to separate architecture prompt |

## Selected Capacity Strategy

Select `northamerica-northeast1-b` as the next bounded no-idle payload/install-readiness proof target.

Rationale:

- It is unattempted in the current B-roll stockout chain.
- It is in North America, which keeps the proof close enough for operational testing while avoiding recently exhausted US zones.
- It exposes the exact approved small proof shape: `g2-standard-4` plus one `nvidia-l4`.
- It has visible unused regional L4 quota and enough CPU/SSD quota for the proof VM.
- The existing IAP firewall target-tag path is not zone-specific and remains compatible with a no-public-IP VM.
- Proof VM, disk, static address, and reservation resources remain absent.
- The private model cache and Python 3.12 wheelhouse remain ready for payload/install proof work.
- A same-zone retry would repeat the exact zone that just stocked out.
- Capacity reservation and always-on GPU conflict with the requested run-when-used/stop-when-idle posture.

## Required Future Preflight

The future 10L execution prompt must repeat these checks immediately before any VM create:

- active project and auth refresh;
- `northamerica-northeast1-b` zone status;
- `g2-standard-4` visibility in `northamerica-northeast1-b`;
- `nvidia-l4` visibility in `northamerica-northeast1-b`;
- project `GPUS_ALL_REGIONS` quota;
- `northamerica-northeast1` regional `NVIDIA_L4_GPUS` quota;
- `northamerica-northeast1` CPU and SSD quota;
- proof service account present and enabled, without recording its value;
- IAP firewall or approved equivalent no-public-IP path present;
- required services enabled;
- exact proof VM, disk, static address, and reservation absent;
- private model cache readiness;
- private Python 3.12 wheelhouse manifest present with expected count and checksum;
- cleanup command and absence verification plan.

## Runtime Gates

- `gcpReadOnlyCommandsExecuted=true`
- `localCacheReadOnlyChecksExecuted=true`
- `localWheelhouseReadOnlyChecksExecuted=true`
- `sameZoneRetrySelected=false`
- `sameRegionRetrySelected=false`
- `crossRegionRetrySelected=true`
- `unattemptedRegionSelected=true`
- `selectedRetryRegion=northamerica-northeast1`
- `selectedRetryZone=northamerica-northeast1-b`
- `capacityReservationSelected=false`
- `alwaysOnGpuSelected=false`
- `cloudRunScaleToZeroSelected=false`
- `queuedJobScaleToZeroSelected=false`
- `delayedRetrySelected=false`
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

## Next Prompt

`AI-VIDEO-BROLL-GEN-10L-NO-IDLE-L4-IAP-WHEELHOUSE-PAYLOAD-INSTALL-PROOF-NORTHAMERICA-NORTHEAST1-B: run bounded no-idle L4 VM lifecycle with private wheelhouse payload transfer and offline dependency install readiness validation in northamerica-northeast1-b with mandatory cleanup, no model import/no inference`
