# Qwen2.5-VL 7B L4 CUDA vLLM Import Proof us-west1-a Result

## Status

Decision: `qwen2_5_vl_7b_l4_cuda_vllm_import_proof_us_west1_a_blocked_by_g2_l4_zonal_stockout`

This packet records the controlled Qwen2.5-VL L4 CUDA visibility and vLLM import proof retry in `us-west1-a`.

The retry repeated the safety preflight, then attempted the one approved no-public-IP `g2-standard-8` / NVIDIA L4 proof VM in `us-west1-a`. Google Cloud rejected the VM create before an instance existed because the zone was stocked out for that machine/GPU shape. This means `us-central1-b`, `us-central1-a`, `us-central1-c`, and `us-west1-a` have now all returned zonal stockout for the same approved Qwen proof shape.

No VM, disk, external IP, reservation, SSH session, IAP transfer, dependency install on VM, CUDA proof, vLLM import proof, model import, model inference, generated media, provider call, worker dispatch, Supabase mutation, SQL, public artifact, signed URL, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim was created.

## Source Evidence

- `us-west1-a` prompt: `docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-us-west1-a.md`
- Capacity review: `docs/qwen2-5-vl-7b-l4-capacity-review-result.md`
- Prior `us-central1-c` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-c-result.md`
- Prior `us-central1-a` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-central1-a-result.md`
- Prior `us-central1-b` stockout: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-retry-result.md`
- Quota fix: `docs/qwen2-5-vl-7b-gpus-all-regions-quota-fix-result.md`
- Private wheelhouse import proof: `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`

## Safety Preflight

The following preflight checks passed before the `us-west1-a` create attempt:

| Area | Result |
| --- | --- |
| Active project | `reeditpro` |
| Active account | present |
| Compute Engine API | enabled |
| IAP API | enabled |
| Target zone | `us-west1-a` |
| Machine type | `g2-standard-8` visible |
| Machine type shape | 8 vCPU, 32 GiB RAM, one NVIDIA L4 |
| Accelerator | `nvidia-l4` visible |
| Regional `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| Regional `PREEMPTIBLE_NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |
| Project-wide `CPUS_ALL_REGIONS` quota | limit `32`, usage `0` |
| Proof service-account user-managed keys | none |
| IAP SSH firewall | enabled, TCP 22 from `35.235.240.0/20` to tag `ai-video-broll-wan-l4-proof` |
| Exact proof VM before create | absent |
| Exact proof disk before create | absent |
| Exact proof reservation before create | absent |
| Exact proof address before create | absent |
| Private model cache | present |
| Private Linux wheelhouse | present, 158 wheels |

## Create Attempt

The approved create attempt targeted:

- VM name: `reeditpro-qwen2-5-vl-l4-proof`
- Zone: `us-west1-a`
- Machine type: `g2-standard-8`
- GPU: one `nvidia-l4`
- Image family: `common-cu129-ubuntu-2404-nvidia-580`
- Boot disk: auto-delete, 180 GB `pd-balanced`
- Network: default VPC/subnet, no external IP
- Access: IAP-only through the existing proof firewall tag
- Service account: existing proof-only service account
- Scopes: logging and monitoring only

The sanitized Google Cloud result was:

```text
ZONE_RESOURCE_POOL_EXHAUSTED_WITH_DETAILS
g2-standard-8 with 1 nvidia-l4 accelerator is currently unavailable in us-west1-a.
reason: resource_availability
state: STOCKOUT
sub-state: STOCKOUT
```

No token, credential, service-account key, environment value, connection string, or secret was printed.

## Post-attempt Resource Check

After the blocked create attempt:

| Resource | Result |
| --- | --- |
| Instance `reeditpro-qwen2-5-vl-l4-proof` in `us-west1-a` | absent |
| Disk `reeditpro-qwen2-5-vl-l4-proof` in `us-west1-a` | absent |
| Reservation `reeditpro-qwen2-5-vl-l4-proof` in `us-west1-a` | absent |
| Address `reeditpro-qwen2-5-vl-l4-proof` in `us-west1` | absent |
| Regional `NVIDIA_L4_GPUS` usage after attempt | `0` |
| Project-wide `GPUS_ALL_REGIONS` usage after attempt | `0` |
| Cleanup required | false |
| Cleanup verified | true |

## Proof Outcome

- approved create command attempted: true
- blocked by quota: false
- blocked by zonal stockout: true
- cross-region retry attempted: true
- VM created: false
- IAP transfer run: false
- SSH session opened: false
- remote dependency install run: false
- L4 CUDA visibility proof attempted: false
- vLLM GPU import proof attempted: false
- metadata loader proof repeated on L4: false
- model import run: false
- model inference run: false
- cleanup verified: true

The correct next step is not another immediate blind zone retry. The next step should compare scheduled retry windows, reservation/capacity options, and whether a smaller no-inference import-smoke shape is acceptable without weakening the selected production GPU target.

## Runtime Gates

- `gcpReadOnlyCommandsExecuted=true`
- `gcpMutatingCommandsExecuted=true`
- `approvedCreateCommandAttempted=true`
- `blockedByZonalStockout=true`
- `crossRegionRetryAttempted=true`
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
- `quotaRequestCreated=false`
- `reservationCreated=false`
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

`QWEN2_5_VL_STACK_TOOL_9-CAPACITY-FOLLOWUP: compare scheduled retry, reservation, and smaller import-smoke options after L4 stockout, no VM/no inference`
