# Qwen2.5-VL 7B L4 Stockout Plan Result

## Status

Decision: `qwen2_5_vl_7b_l4_stockout_plan_ready_for_us_central1_a_retry_no_inference`

This packet plans the next Qwen2.5-VL L4 CUDA visibility and vLLM import proof retry after the approved `us-central1-b` create attempt was blocked by zonal stockout.

This is a planning-only result. It did not create a VM, disk, address, reservation, firewall rule, service account, bucket, Cloud Run job, IAP tunnel, SSH session, dependency install, CUDA proof, vLLM import proof, model import, model inference, generated media, provider call, worker dispatch, Supabase mutation, SQL, public artifact, signed URL, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Source Evidence

- Quota fix: `docs/qwen2-5-vl-7b-gpus-all-regions-quota-fix-result.md`
- Stockout result: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md`
- Wheelhouse proof: `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- Private model cache: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private wheelhouse: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64`

## Read-only Availability Findings

Read-only Google Cloud checks showed:

| Area | Result |
| --- | --- |
| Prior blocked zone | `us-central1-b` |
| Prior failure | `ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS` / `STOCKOUT` |
| `g2-standard-8` visible in `us-central1-a` | true |
| `nvidia-l4` visible in `us-central1-a` | true |
| `us-central1-a` status | `UP` |
| `g2-standard-8` visible in `us-central1-c` | true |
| `nvidia-l4` visible in `us-central1-c` | true |
| `us-central1-c` status | `UP` |
| Regional `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| Regional `PREEMPTIBLE_NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |
| Exact proof VM in `us-central1-a` | absent |
| Exact proof disk in `us-central1-a` | absent |
| Exact proof reservation in `us-central1-a` | absent |
| Exact proof VM in `us-central1-c` | absent |
| Exact proof disk in `us-central1-c` | absent |
| Exact proof reservation in `us-central1-c` | absent |
| Exact proof regional address | absent |

These checks do not guarantee real-time capacity, but they prove the alternate same-region retry shape is valid and does not require a new regional quota path.

## Selected Retry Path

Select `us-central1-a` as the next bounded retry target.

Rationale:

- It keeps the preferred cost-friendly GPU: one NVIDIA L4 on Google Cloud G2.
- It keeps the preferred Qwen proof machine shape: `g2-standard-8`.
- It stays in `us-central1`, where the approved regional L4 quota is already `1/0`.
- It avoids cross-region quota requests.
- It preserves the no-public-IP, IAP-only, proof-service-account path.
- It has no preexisting exact proof VM, disk, reservation, or address.

`us-central1-c` remains the second same-region retry candidate if `us-central1-a` is also stocked out in a future approved retry.

## Required Preflight Before Retry

Before any future VM create in `us-central1-a`, repeat:

- active project check;
- active account check;
- Compute Engine and IAP API checks;
- `g2-standard-8` visibility in `us-central1-a`;
- `nvidia-l4` visibility in `us-central1-a`;
- regional `NVIDIA_L4_GPUS` quota check;
- project-wide `GPUS_ALL_REGIONS` quota check;
- proof service account and user-managed key check;
- IAP SSH firewall check;
- exact proof VM/disk/address/reservation absence check;
- private wheelhouse and model cache presence check;
- final bounded cost and cleanup plan.

## Retry Guardrails

The future retry may attempt exactly one no-public-IP `g2-standard-8` VM with one NVIDIA L4 in `us-central1-a` only after the repeated preflight passes.

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
- `alternateZoneSelected=true`
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

`QWEN2_5_VL_STACK_TOOL_9-RETRY-US-CENTRAL1-A: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof in us-central1-a, no inference`
