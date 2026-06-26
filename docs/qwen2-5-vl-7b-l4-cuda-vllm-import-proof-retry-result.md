# Qwen2.5-VL 7B L4 CUDA vLLM Import Proof Retry Result

## Status

Decision: `qwen2_5_vl_7b_l4_cuda_vllm_import_proof_retry_blocked_by_g2_l4_zonal_stockout`

This packet records the Qwen2.5-VL L4 CUDA visibility and vLLM import proof retry after the project-wide `GPUS_ALL_REGIONS` quota was approved to `1`.

The retry repeated the safety preflight, then attempted the one approved no-public-IP `g2-standard-8` / NVIDIA L4 proof VM in `us-central1-b`. Google Cloud rejected the VM create before an instance existed because the zone was stocked out for that machine/GPU shape. No VM, disk, external IP, reservation, SSH session, IAP transfer, dependency install on VM, CUDA proof, vLLM import proof, model import, model inference, generated media, provider call, worker dispatch, Supabase mutation, SQL, public artifact, signed URL, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim was created.

## Baseline Inputs

- Workstream: `AI_VIDEO_BROLL_GENERATION`
- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Prior quota fix: `docs/qwen2-5-vl-7b-gpus-all-regions-quota-fix-result.md`
- Prior wheelhouse import proof: `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- Prior blocked L4 proof: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-result.md`
- Private model cache: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private wheelhouse: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64`
- Loader gate: `server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py`

## Safety Preflight

The following preflight checks passed before the create attempt:

| Area | Result |
| --- | --- |
| Active project | `reeditpro` |
| Active account | present |
| Compute Engine API | enabled |
| IAP API | enabled |
| Target zone | `us-central1-b` |
| Machine type | `g2-standard-8` visible |
| Machine type shape | 8 vCPU, 32 GiB RAM, one NVIDIA L4 |
| Accelerator | `nvidia-l4` visible |
| Image family | `common-cu129-ubuntu-2404-nvidia-580` |
| Observed image | `common-cu129-ubuntu-2404-nvidia-580-v20260626` |
| Image status | `READY` |
| Regional `NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| Regional `PREEMPTIBLE_NVIDIA_L4_GPUS` quota | limit `1`, usage `0` |
| Project-wide `GPUS_ALL_REGIONS` quota | limit `1`, usage `0` |
| Regional CPU quota | limit `200`, usage `0` |
| Regional SSD quota | limit `500`, usage `0` |
| Proof service account | present |
| Proof service-account user-managed keys | none |
| IAP SSH firewall | enabled, TCP 22 from `35.235.240.0/20` to tag `ai-video-broll-wan-l4-proof` |
| Exact proof VM before create | absent |
| Exact proof disk before create | absent |
| Exact proof address before create | absent |
| Exact proof reservation before create | absent |
| Private wheelhouse | present, 159 files, about 4.7 GiB |
| Private model cache | present, about 15 GiB |

## Create Attempt

The approved create attempt targeted:

- VM name: `reeditpro-qwen2-5-vl-l4-proof`
- Zone: `us-central1-b`
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
g2-standard-8 with 1 nvidia-l4 accelerator is currently unavailable in us-central1-b.
reason: resource_availability
state: STOCKOUT
sub-state: STOCKOUT
```

No token, credential, service-account key, environment value, connection string, or secret was printed.

## Post-attempt Resource Check

After the blocked create attempt:

| Resource | Result |
| --- | --- |
| Instance `reeditpro-qwen2-5-vl-l4-proof` | absent |
| Disk `reeditpro-qwen2-5-vl-l4-proof` | absent |
| Address `reeditpro-qwen2-5-vl-l4-proof` | absent |
| Reservation `reeditpro-qwen2-5-vl-l4-proof` | absent |
| Cleanup required | false |
| Cleanup verified | true |

## Proof Outcome

- approved create command attempted: true
- blocked by quota: false
- blocked by zonal stockout: true
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

The correct next step is a stockout/zone strategy prompt, not a second ad hoc VM create attempt.

## Runtime Gates

- `gcpReadOnlyCommandsExecuted=true`
- `gcpMutatingCommandsExecuted=true`
- `approvedCreateCommandAttempted=true`
- `blockedByZonalStockout=true`
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

`QWEN2_5_VL_STACK_TOOL_9-STOCKOUT-PLAN: plan alternate G2/L4 zone retry or scheduled same-zone retry, no VM/no inference`
