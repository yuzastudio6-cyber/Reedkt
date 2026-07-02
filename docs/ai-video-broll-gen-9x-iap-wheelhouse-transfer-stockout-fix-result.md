# AI Video B-roll 9X IAP Wheelhouse Transfer Stockout Fix Result

Decision: `ai_video_broll_gen_9x_iap_wheelhouse_transfer_stockout_fix_ready_for_us_east4_c_transfer_proof_no_vm_no_inference`.

AI-VIDEO-BROLL-GEN-9X reviewed the cleanup-verified 9W `us-east4-a` IAP wheelhouse transfer-proof stockout and ran read-only Google Cloud plus local cache/wheelhouse checks to choose the next bounded no-idle transfer-proof capacity strategy. It did not create a VM, disk, static address, reservation, firewall rule, service account, bucket, Cloud Run job, Docker container, IAP tunnel, SSH session, dependency install, model import, model inference, generated video, generated asset, Supabase row, SQL mutation, signed URL, public artifact, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

The selected strategy is one more bounded no-idle same-region cross-zone transfer proof attempt in `us-east4-c`, recorded only as a future prompt. Capacity reservation, always-on GPU, Cloud Run, queued job, Docker, and delayed retry strategies remain rejected for the immediate next step because the user's current GPU posture is run-when-used and stop-when-idle, and because the transfer proof still needs a no-public-IP VM only long enough to validate private wheelhouse transfer and cleanup.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-9x-iap-wheelhouse-transfer-stockout-fix.md`
- `docs/ai-video-broll-gen-9w-no-idle-l4-iap-wheelhouse-transfer-proof-us-east4-a-result.md`
- `docs/ai-video-broll-gen-9v-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9u-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-c-result.md`
- `docs/ai-video-broll-gen-9t-iap-wheelhouse-transfer-stockout-fix-result.md`
- `docs/ai-video-broll-gen-9s-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-b-result.md`
- `docs/ai-video-broll-gen-9q-no-idle-l4-iap-wheelhouse-transfer-proof-us-west1-a-result.md`
- `docs/ai-video-broll-gen-9o-retry-no-idle-l4-iap-wheelhouse-transfer-proof-result.md`
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

9N remains the one prior no-idle L4 lifecycle proof that reached create/delete cleanup in `us-central1-c`; it did not validate IAP wheelhouse transfer, dependency install, model import, or inference.

## Read-Only Findings

Read-only checks confirmed:

| Area | Result |
| --- | --- |
| Project | `reeditpro` matched through quota verifier |
| Token refresh | passed with stdout suppressed |
| Latest GPU image family | ready; latest image `common-cu129-ubuntu-2404-nvidia-580-v20260626` |
| Project `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |
| Matching proof instances | `0` |
| Matching proof disks | `0` |
| Matching proof addresses | `0` |
| Matching proof reservations | `0` |
| Proof service account | present and enabled; value not stored |
| IAP firewall | present with target tag `ai-video-broll-wan-l4-proof` |
| Required services | Compute, IAM, IAP, Logging, and Monitoring enabled |
| Private model cache | stat-only readiness passed |
| Private model cache runtime files | `19` |
| Private model cache aggregate bytes | `28928887859` |
| Private wheelhouse manifest | present |
| Private wheelhouse complete | `true` |
| Private wheelhouse real wheel count | `66` |
| Private wheelhouse aggregate bytes | `2802483442` |
| Private wheelhouse aggregate SHA-256 | `55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64` |

Candidate zones:

| Zone | Region | Status | `g2-standard-4` visible | `nvidia_l4` visible | Regional L4 quota | Regional CPU quota | Regional SSD quota | 9X disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `us-east4-c` | `us-east4` | `UP` | true | true | limit `1`, usage `0` | limit `200`, usage `0` | limit `500`, usage `0` | selected |
| `us-east1-b` | `us-east1` | `UP` | true | true | limit `1`, usage `0` | limit `200`, usage `0` | limit `500`, usage `0` | available fallback |
| `us-east1-c` | `us-east1` | `UP` | true | true | limit `1`, usage `0` | limit `200`, usage `0` | limit `500`, usage `0` | available fallback |
| `us-east1-d` | `us-east1` | `UP` | true | true | limit `1`, usage `0` | limit `200`, usage `0` | limit `500`, usage `0` | available fallback |
| `us-west4-a` | `us-west4` | `UP` | true | true | limit `1`, usage `0` | limit `200`, usage `0` | limit `500`, usage `0` | available fallback |
| `us-west4-c` | `us-west4` | `UP` | true | true | limit `1`, usage `0` | limit `200`, usage `0` | limit `500`, usage `0` | available fallback |

These checks do not reserve real-time capacity and do not guarantee the next VM create will succeed. They prove only that the checked candidate regions expose the requested shape, quota is visible and unused, no matching proof resources are currently present, and the private cache plus wheelhouse remain ready.

## Selected Capacity Strategy

Select `us-east4-c` as the next bounded no-idle IAP wheelhouse transfer proof target.

Rationale:

- The 9W `us-east4-a` transfer proof stocked out before any VM existed.
- `us-east4-c` is the first untried candidate after `us-east4-a` with visible `g2-standard-4`, visible `nvidia_l4`, zone status `UP`, and unused regional L4 quota.
- Same-region cross-zone retry preserves the current `us-east4` quota context without reserving capacity.
- The same one-L4 `g2-standard-4` shape preserves the smallest currently approved GPU proof size.
- The existing IAP target-tag path remains the no-public-IP transfer path; a future prompt must re-check it immediately before any VM create.
- Capacity reservation is not selected because it is mutating, potentially billable, and can create idle capacity contrary to the requested run-when-used/stop-when-idle posture.
- Always-on GPU is rejected for the same no-idle reason.
- Cloud Run or queued-job scale-to-zero may be a future architecture track, but it is not selected for the immediate transfer proof because it would require a separate Docker/runtime worker path and does not validate the existing private wheelhouse IAP transfer requirement.
- A delayed retry is not selected because untried no-idle transfer targets remain available.

## Required Future Preflight

The future retry prompt must repeat these checks immediately before any VM create:

- active project and auth token refresh;
- `us-east4-c` zone status;
- `g2-standard-4` visibility in `us-east4-c`;
- `nvidia_l4` visibility in `us-east4-c`;
- project `GPUS_ALL_REGIONS` quota;
- regional `NVIDIA_L4_GPUS` quota in `us-east4`;
- CPU and SSD quota in `us-east4`;
- proof service account present and enabled, without recording its value;
- IAP firewall target tag present or an approved equivalent no-public-IP IAP path for the selected zone;
- required services enabled;
- exact proof VM, disk, static address, and reservation absent;
- private cache readiness;
- private Python 3.12 wheelhouse manifest present with expected count and checksum;
- cleanup command and absence verification plan.

## Future 9Y Guardrails

The next execution prompt may attempt exactly one no-public-IP `g2-standard-4` VM with one NVIDIA L4 in `us-east4-c` only after repeated preflight passes.

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
- `crossZoneRetrySelected=true`
- `sameRegionRetrySelected=true`
- `crossRegionRetrySelected=false`
- `selectedRetryZone=us-east4-c`
- `selectedRetryRegion=us-east4`
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

`AI-VIDEO-BROLL-GEN-9Y-NO-IDLE-L4-IAP-WHEELHOUSE-TRANSFER-PROOF-US-EAST4-C: run bounded no-idle L4 VM lifecycle with private wheelhouse IAP transfer validation in us-east4-c and mandatory cleanup, no model inference`
