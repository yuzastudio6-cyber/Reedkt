# Qwen2.5-VL 7B L4 Capacity Follow-up Result

## Status

Decision: `qwen2_5_vl_7b_l4_capacity_followup_ready_for_us_east1_b_retry_no_inference`

This packet records a no-VM/no-inference capacity follow-up after the approved Qwen2.5-VL `g2-standard-8` plus one NVIDIA L4 proof shape stocked out in `us-central1-b`, `us-central1-a`, `us-central1-c`, and `us-west1-a`.

This follow-up did not create a VM, disk, address, reservation, firewall rule, service account, service-account key, bucket, Artifact Registry image, Cloud Run job, IAP tunnel, SSH session, dependency install, CUDA proof, vLLM import proof, model import, model inference, generated media, provider call, worker dispatch, Supabase mutation, SQL, public artifact, signed URL, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Source Evidence

- `us-west1-a` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-west1-a-result.md`
- Capacity review: `docs/qwen2-5-vl-7b-l4-capacity-review-result.md`
- `us-central1-c` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-c-result.md`
- `us-central1-a` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-a-result.md`
- `us-central1-b` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md`
- Private wheelhouse import proof: `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`

## Read-only Capacity Findings

Read-only quota checks showed:

| Area | Result |
| --- | --- |
| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |
| Project-wide `CPUS_ALL_REGIONS` quota | limit `32`, usage `0` |
| U.S. regions with `NVIDIA_L4_GPUS` quota | `us-central1`, `us-east1`, `us-east4`, `us-east5`, `us-south1`, `us-west1`, `us-west2`, `us-west3`, `us-west4` |
| `us-east1` `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| Reservation created | false |
| VM created | false |

Read-only exact-shape visibility checks found:

| Candidate zone | `g2-standard-8` visible | `nvidia-l4` visible |
| --- | --- | --- |
| `us-east1-b` | true | true |
| `us-east1-c` | true | true |
| `us-east1-d` | true | true |
| `us-east4-a` | true | true |
| `us-east4-c` | true | true |
| `us-west4-a` | true | true |
| `us-west4-c` | true | true |

Other inspected U.S. zones in `us-west2`, `us-west3`, `us-south1`, and `us-east5` did not show the exact approved `g2-standard-8` plus `nvidia-l4` shape in this read-only check.

## Option Comparison

| Option | Decision | Rationale |
| --- | --- | --- |
| Scheduled retry in stocked-out regions | defer | `us-central1` and `us-west1-a` can be retried later, but immediate same-zone repeat is low signal. |
| Alternate U.S. region retry | recommended | `us-east1-b` has quota available and exact shape visibility without reservation or shape change. |
| Reservation/capacity assurance | later approval only | Worth a separate approval if another cross-region attempt stocks out, because reservations can introduce cost and cleanup risk. |
| Smaller import-smoke shape | not product-valid as runtime proof | A smaller shape may prove wheelhouse import mechanics only; it does not prove the selected L4/G2 target for Qwen2.5-VL. |
| Stop with runtime proof blocked | not yet | One more U.S. region with three visible zones is available before escalating to reservation planning. |

## Capacity Strategy Decision

Select `us-east1-b` as the next bounded retry target.

Rationale:

- It keeps the preferred cost-friendly GPU: one NVIDIA L4 on Google Cloud G2.
- It keeps the preferred Qwen proof machine shape: `g2-standard-8`.
- It stays in the United States.
- The region has `NVIDIA_L4_GPUS` quota limit `1`, usage `0`.
- The project-wide `GPUS_ALL_REGIONS` quota remains limit `1`, usage `0`.
- The exact machine/GPU shape is visible in all three inspected `us-east1` zones.
- It avoids reservation cost for one more controlled attempt.
- It preserves the no-public-IP, IAP-only, proof-service-account path.

If `us-east1-b` stocks out, the next step should be a no-VM reservation/capacity-assurance approval plan, not another unbounded region chase.

## Required Preflight Before Retry

Before any future VM create in `us-east1-b`, repeat:

- active project check;
- active account check;
- Compute Engine and IAP API checks;
- `g2-standard-8` visibility in `us-east1-b`;
- `nvidia-l4` visibility in `us-east1-b`;
- `us-east1` regional `NVIDIA_L4_GPUS` quota check;
- project-wide `GPUS_ALL_REGIONS` quota check;
- proof service account and user-managed key check;
- IAP SSH firewall check;
- exact proof VM/disk/address/reservation absence check in `us-east1-b` / `us-east1`;
- private wheelhouse and model cache presence check;
- final bounded cost and cleanup plan.

## Runtime Gates

- `gcpReadOnlyCommandsExecuted=true`
- `gcpMutatingCommandsExecuted=false`
- `alternateRegionRetrySelected=true`
- `reservationRecommendedNow=false`
- `reservationCreated=false`
- `smallerImportSmokeRecommended=false`
- `vmCreated=false`
- `diskCreated=false`
- `externalIpCreated=false`
- `networkChanged=false`
- `serviceAccountCreated=false`
- `serviceAccountKeyCreated=false`
- `firewallRuleCreated=false`
- `bucketCreated=false`
- `artifactRegistryImageCreated=false`
- `cloudRunJobCreated=false`
- `iapTransferExecuted=false`
- `sshSessionOpened=false`
- `dependencyInstalledOnVm=false`
- `runtimeImportRunOnL4=false`
- `cudaVisibilityCheckedOnL4=false`
- `vllmImportedOnL4=false`
- `sglangImportedOnL4=false`
- `apiServerStarted=false`
- `modelImportRun=false`
- `modelInferenceRun=false`
- `generatedVideoCreated=false`
- `generatedAssetsCreated=false`
- `providerCallsMade=false`
- `workersDispatched=false`
- `supabaseTouched=false`
- `sqlExecuted=false`
- `publicArtifactsCreated=false`
- `signedUrlsCreated=false`
- `creditMutationCreated=false`
- `betaUnlocked=false`
- `productionUnlocked=false`
- `dryRunPassedClaimed=false`
- `generatedLocalFixturePassedClaimed=false`

## Product Boundary

Qwen2.5-VL remains a visual understanding, planning, and QA stack tool. It is not an AI-video generation route, not a provider fallback, and not a substitute for approved edit plans, credit approval, or worker contracts. Wan remains the primary generated B-roll route. Qwen ranks for visual analysis, source-frame understanding, OCR/layout/caption QA, and advisory planning where deterministic tools are insufficient.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_9-RETRY-US-EAST1-B: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof in us-east1-b, no inference`
