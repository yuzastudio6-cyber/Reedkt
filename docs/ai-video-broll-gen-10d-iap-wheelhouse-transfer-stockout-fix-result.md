# AI Video B-roll 10D IAP Wheelhouse Transfer Stockout Fix Result

Decision: `ai_video_broll_gen_10d_iap_wheelhouse_transfer_stockout_fix_ready_for_us_east1_d_transfer_proof_no_vm_no_inference`.

AI-VIDEO-BROLL-GEN-10D reviewed the cleanup-verified 10C `us-east1-c` IAP wheelhouse transfer-proof stockout and ran read-only Google Cloud plus local cache/wheelhouse checks to choose the next bounded no-idle transfer-proof capacity strategy. It did not create a VM, disk, static address, reservation, firewall rule, service account, bucket, Cloud Run job, Docker container, IAP tunnel, SSH session, dependency install, model import, model inference, generated video, generated asset, Supabase row, SQL mutation, signed URL, public artifact, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

The selected strategy is one bounded same-region cross-zone no-idle transfer proof attempt in `us-east1-d`, recorded only as a future prompt. Capacity reservation, always-on GPU, immediate Cloud Run, queued job, Docker, public IP, and delayed retry strategies remain rejected for the immediate next step because the user's GPU posture is run-when-used and stop-when-idle, and because the transfer proof still needs a no-public-IP VM only long enough to validate private wheelhouse transfer and cleanup.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-10d-iap-wheelhouse-transfer-stockout-fix.md`
- `docs/ai-video-broll-gen-10c-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-c-result.md`
- `docs/ai-video-broll-gen-10b-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-10a-no-idle-l4-iap-wheelhouse-transfer-proof-us-east1-b-result.md`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Cleanup-Verified Stockout Summary

| Prompt | Zone | Region | Outcome | Cleanup |
| --- | --- | --- | --- | --- |
| 9O transfer proof | `us-central1-c` | `us-central1` | resource pool exhausted before transfer VM existed | cleanup verified |
| 9O retry transfer proof | `us-central1-c` | `us-central1` | repeated resource pool exhaustion before transfer VM existed | cleanup verified |
| 9Q transfer proof | `us-west1-a` | `us-west1` | resource pool exhausted before transfer VM existed | cleanup verified |
| 9S transfer proof | `us-west1-b` | `us-west1` | resource pool exhausted before transfer VM existed | cleanup verified |
| 9U transfer proof | `us-west1-c` | `us-west1` | resource pool exhausted before transfer VM existed | cleanup verified |
| 9W transfer proof | `us-east4-a` | `us-east4` | resource pool exhausted before transfer VM existed | cleanup verified |
| 9Y transfer proof | `us-east4-c` | `us-east4` | resource pool exhausted before transfer VM existed | cleanup verified |
| 10A transfer proof | `us-east1-b` | `us-east1` | resource pool exhausted before transfer VM existed | cleanup verified |
| 10C transfer proof | `us-east1-c` | `us-east1` | resource pool exhausted before transfer VM existed | cleanup verified |

9N remains the one prior no-idle L4 lifecycle proof that reached create/delete cleanup in `us-central1-c`; it did not validate IAP wheelhouse transfer, dependency install, model import, or inference.

## Read-Only Findings

Read-only checks confirmed:

| Area | Result |
| --- | --- |
| Project | `reeditpro` matched |
| Token refresh | passed with stdout suppressed |
| Required services | Compute, IAM, IAP, Logging, and Monitoring enabled |
| Candidate zone | `us-east1-d` |
| Candidate zone status | `UP` |
| Machine type | `g2-standard-4` visible |
| Accelerator | `nvidia-l4` visible |
| Project `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |
| Project `CPUS_ALL_REGIONS` quota | limit `32`, usage `0` |
| Regional L4 quota | limit `1`, usage `0` |
| Regional CPU quota | limit `200`, usage `0` |
| Regional SSD quota | limit `500`, usage `0` |
| IAP firewall | present with source `35.235.240.0/20` and target tag `ai-video-broll-wan-l4-proof` |
| Proof service account | present and enabled; value not stored |
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

Candidate zones:

| Zone | Region | Status | `g2-standard-4` visible | `nvidia_l4` visible | Regional L4 quota | Regional CPU quota | Regional SSD quota | 10D disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `us-east1-b` | `us-east1` | previously `UP` | previously true | previously true | limit `1`, usage `0` | limit `200`, usage `0` | limit `500`, usage `0` | rejected_recent_stockout |
| `us-east1-c` | `us-east1` | previously `UP` | previously true | previously true | limit `1`, usage `0` | limit `200`, usage `0` | limit `500`, usage `0` | rejected_recent_stockout |
| `us-east1-d` | `us-east1` | `UP` | true | true | limit `1`, usage `0` | limit `200`, usage `0` | limit `500`, usage `0` | selected |

These checks do not reserve real-time capacity and do not guarantee the next VM create will succeed. They prove only that the checked candidate zone exposes the requested shape, quota is visible and unused, no matching proof resources are currently present, and the private cache plus wheelhouse remain ready.

## Selected Capacity Strategy

Select `us-east1-d` as the next bounded no-idle IAP wheelhouse transfer proof target.

Rationale:

- `us-east1-b` produced a cleanup-verified transfer-proof stockout before any VM existed.
- `us-east1-c` produced a cleanup-verified transfer-proof stockout before any VM existed.
- `us-east1-d` is the remaining same-region cross-zone candidate with visible `g2-standard-4`, visible `nvidia_l4`, zone status `UP`, and unused regional L4 quota.
- The same one-L4 `g2-standard-4` shape preserves the smallest currently approved GPU proof size.
- The existing IAP target-tag path remains the no-public-IP transfer path; a future prompt must re-check it immediately before any VM create.
- Capacity reservation is not selected because it is mutating, potentially billable, and can create idle capacity contrary to the requested run-when-used/stop-when-idle posture.
- Always-on GPU is rejected for the same no-idle reason.
- Cloud Run or queued-job scale-to-zero may be a future architecture track, but it is not selected for the immediate transfer proof because it would require a separate Docker/runtime worker path and does not validate the existing private wheelhouse IAP transfer requirement.
- A delayed retry is not selected because the remaining same-region transfer target is currently visible and no safe no-VM reason blocks selecting it as the next future proof target.

## Required Future Preflight

The future retry prompt must repeat these checks immediately before any VM create:

- active project and auth refresh;
- `us-east1-d` zone status;
- `g2-standard-4` visibility in `us-east1-d`;
- `nvidia_l4` visibility in `us-east1-d`;
- project `GPUS_ALL_REGIONS` quota;
- regional `NVIDIA_L4_GPUS` quota in `us-east1`;
- CPU and SSD quota in `us-east1`;
- proof service account present and enabled, without recording its value;
- IAP firewall or an approved equivalent no-public-IP IAP path for the selected zone;
- required services enabled;
- exact proof VM, disk, static address, and reservation absent;
- private cache readiness;
- private Python 3.12 wheelhouse manifest present with expected count and checksum;
- cleanup command and absence verification plan.

## Future 10E Guardrails

The next execution prompt may attempt exactly one no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-east1-d` only after repeated preflight passes.

It must not:

- use a public IP;
- create capacity reservations;
- mutate firewall, IAM, service accounts, service-account keys, routers, Cloud NAT, buckets, or images;
- run Docker;
- install dependencies;
- clone repositories;
- import Wan/Wan2.1;
- run model inference;
- create generated frames, generated video, or generated assets;
- call providers;
- dispatch workers;
- touch Supabase;
- execute SQL;
- create storage objects;
- create signed URLs;
- mutate credits;
- unlock beta or production;
- claim `dry_run_passed`;
- claim `generated_local_fixture_passed`.

## Runtime Gates

- `gcpReadOnlyCommandsExecuted=true`
- `localWheelhouseReadOnlyChecksExecuted=true`
- `sameRegionRetrySelected=true`
- `crossZoneRetrySelected=true`
- `crossRegionRetrySelected=false`
- `selectedRetryZone=us-east1-d`
- `selectedRetryRegion=us-east1`
- `capacityReservationSelected=false`
- `alwaysOnGpuSelected=false`
- `cloudRunScaleToZeroSelected=false`
- `queuedJobScaleToZeroSelected=false`
- `delayedRetrySelected=false`
- `gcpMutatingCommandsExecuted=false`
- `vmCreated=false`
- `diskCreated=false`
- `externalIpCreated=false`
- `reservationCreated=false`
- `networkChanged=false`
- `serviceAccountCreated=false`
- `serviceAccountKeyCreated=false`
- `firewallRuleCreated=false`
- `dockerRun=false`
- `sshSessionOpened=false`
- `iapTransferExecuted=false`
- `dependencyInstalledOnVm=false`
- `modelImportRun=false`
- `modelInferenceRun=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `providerCallsMade=false`
- `workersDispatched=false`
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

`AI-VIDEO-BROLL-GEN-10E-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST1-D: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east1-d and mandatory cleanup, no model inference`
