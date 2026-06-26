# Qwen2.5-VL 7B L4 Capacity Review Result

## Status

Decision: `qwen2_5_vl_7b_l4_capacity_review_ready_for_us_west1_a_retry_no_inference`

This packet records the no-VM capacity review after `us-central1-b`, `us-central1-a`, and `us-central1-c` all returned zonal stockout for the approved Qwen2.5-VL `g2-standard-8` plus one NVIDIA L4 proof shape.

This is a planning-only result. It did not create a VM, disk, address, reservation, firewall rule, service account, bucket, Cloud Run job, IAP tunnel, SSH session, dependency install, CUDA proof, vLLM import proof, model import, model inference, generated media, provider call, worker dispatch, Supabase mutation, SQL, public artifact, signed URL, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Source Evidence

- `us-central1-b` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md`
- `us-central1-a` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-a-result.md`
- `us-central1-c` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-c-result.md`
- Stockout plan: `docs/qwen2-5-vl-7b-l4-stockout-plan-result.md`
- Quota fix: `docs/qwen2-5-vl-7b-gpus-all-regions-quota-fix-result.md`
- Private wheelhouse import proof: `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`

## Read-only Capacity Findings

Read-only regional quota and shape visibility checks showed:

| Area | Result |
| --- | --- |
| Same-region zones attempted | `us-central1-b`, `us-central1-a`, `us-central1-c` |
| Same-region result | all stocked out for `g2-standard-8` + one `nvidia-l4` |
| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |
| Project-wide `CPUS_ALL_REGIONS` quota | limit `32`, usage `0` |
| Regions with `NVIDIA_L4_GPUS` limit available | multiple, including `us-west1`, `us-east1`, `us-east4` |
| `g2-standard-8` visible in `us-west1-a` | true |
| `nvidia-l4` visible in `us-west1-a` | true |
| `us-west1-a` status | `UP` |
| `us-west1` `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| `us-west1` `PREEMPTIBLE_NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| `us-west1` CPU quota | limit `100`, usage `0` |
| `us-west1` SSD quota | limit `500`, usage `0` |
| Exact proof VM in `us-west1-a` | absent |
| Exact proof disk in `us-west1-a` | absent |
| Exact proof reservation in `us-west1-a` | absent |
| Exact proof regional address in `us-west1` | absent |

These checks do not guarantee real-time capacity, but they identify a safe next bounded retry target outside the stocked-out `us-central1` zones.

## Capacity Strategy Decision

Select `us-west1-a` as the next bounded retry target.

Rationale:

- It keeps the preferred cost-friendly GPU: one NVIDIA L4 on Google Cloud G2.
- It keeps the preferred Qwen proof machine shape: `g2-standard-8`.
- It stays in the United States and avoids a larger cross-continent proof path.
- It has regional `NVIDIA_L4_GPUS` quota limit `1`, usage `0`.
- It keeps project-wide `GPUS_ALL_REGIONS` within the approved limit `1`, usage `0`.
- It avoids reservation cost and does not require a capacity reservation.
- It preserves the no-public-IP, IAP-only, proof-service-account path.
- It has no preexisting exact proof VM, disk, reservation, or address.

Do not retry `us-central1` again without either a scheduled retry window or an explicit capacity/reservation review.

## Required Preflight Before Retry

Before any future VM create in `us-west1-a`, repeat:

- active project check;
- active account check;
- Compute Engine and IAP API checks;
- `g2-standard-8` visibility in `us-west1-a`;
- `nvidia-l4` visibility in `us-west1-a`;
- `us-west1` regional `NVIDIA_L4_GPUS` quota check;
- project-wide `GPUS_ALL_REGIONS` quota check;
- proof service account and user-managed key check;
- IAP SSH firewall check;
- exact proof VM/disk/address/reservation absence check in `us-west1-a` / `us-west1`;
- private wheelhouse and model cache presence check;
- final bounded cost and cleanup plan.

## Retry Guardrails

The future retry may attempt exactly one no-public-IP `g2-standard-8` VM with one NVIDIA L4 in `us-west1-a` only after the repeated preflight passes.

The future retry must not:

- use public IP access;
- create capacity reservations;
- change firewall/network policy;
- create service accounts or keys;
- use a different GPU class;
- downgrade to `g2-standard-4` without a separate memory-risk approval;
- run inference;
- call `model.generate`;
- start `vllm serve`;
- start SGLang;
- start an API server;
- dispatch workers;
- call providers;
- touch Supabase;
- execute SQL;
- generate media or assets;
- create public artifacts;
- create signed URLs;
- mutate credits;
- unlock beta or production;
- claim `dry_run_passed`;
- claim `generated_local_fixture_passed`.

## Runtime Gates

- `gcpReadOnlyCommandsExecuted=true`
- `gcpMutatingCommandsExecuted=false`
- `crossRegionRetrySelected=true`
- `vmCreated=false`
- `diskCreated=false`
- `externalIpCreated=false`
- `networkChanged=false`
- `serviceAccountCreated=false`
- `serviceAccountKeyCreated=false`
- `firewallRuleCreated=false`
- `reservationCreated=false`
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

`QWEN2_5_VL_STACK_TOOL_9-RETRY-US-WEST1-A: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof in us-west1-a, no inference`
