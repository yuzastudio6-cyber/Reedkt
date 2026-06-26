# Qwen2.5-VL 7B L4 CUDA vLLM Import Proof Result

## Status

Decision: `qwen2_5_vl_7b_l4_cuda_vllm_import_proof_blocked_by_gpus_all_regions_quota`

This packet records the Qwen2.5-VL L4 CUDA visibility and vLLM import proof preflight. The proof stopped before VM creation because project-wide Google Cloud quota `GPUS_ALL_REGIONS` is still `0`.

This result does not create a VM, disk, network, firewall rule, service account, key, bucket, Artifact Registry image, reservation, Cloud Run job, Docker container, remote virtual environment, dependency install, IAP transfer, SSH session, CUDA runtime proof, vLLM import proof on GPU, model import, model inference, generated video, generated asset, public artifact, signed URL, Supabase row, SQL mutation, provider call, worker job, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Baseline Inputs

- Workstream: `AI_VIDEO_BROLL_GENERATION`
- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Prior import proof: `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- Private model cache: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Private wheelhouse: `/Volumes/backup/reeditpro-model-cache/vlm/qwen2.5-vl-7b-instruct/wheelhouses/qwen2.5-vl-7b-python312-linux-x86_64`
- Loader gate: `server/workers/vlm-runtime/qwen2_5_vl_private_loader_gate.py`
- Runtime requirements: `server/workers/vlm-runtime/requirements.vlm.txt`

The private model cache and wheelhouse are already verified by prior gates. The fixed metadata loader proof passed in an isolated Linux Python 3.12 environment. This gate was only allowed to progress to L4 CUDA visibility and vLLM import proof if Google Cloud safety preflight proved a single cost-bounded L4 VM target was possible.

## Read-only Preflight Commands

The following sanitized read-only checks were run:

```bash
gcloud --version
gcloud --quiet config get-value project
gcloud --quiet auth list --filter=status:ACTIVE --format=value(account)
gcloud --quiet services list --enabled --project=reeditpro --filter=config.name=compute.googleapis.com --format=value(config.name)
gcloud --quiet compute machine-types describe g2-standard-8 --project=reeditpro --zone=us-central1-b --format=json(name,guestCpus,memoryMb,description)
gcloud --quiet compute accelerator-types describe nvidia-l4 --project=reeditpro --zone=us-central1-b --format=json(name,description)
gcloud --quiet compute regions describe us-central1 --project=reeditpro --format=json(quotas)
gcloud --quiet compute project-info describe --project=reeditpro --format=json(quotas)
gcloud --quiet compute instances list --project=reeditpro --filter=name~reeditpro.*qwen OR name~reeditpro.*broll OR name~proof --format=json(name,zone,status,machineType,tags.items,serviceAccounts.email)
gcloud --quiet iam service-accounts describe reeditpro-ai-broll-proof-sa@reeditpro.iam.gserviceaccount.com --project=reeditpro --format=json(email,disabled,displayName)
gcloud --quiet compute firewall-rules describe reeditpro-ai-broll-proof-iap-ssh --project=reeditpro --format=json(name,disabled,direction,sourceRanges,allowed,targetTags)
```

No mutating Google Cloud command was run.

## Read-only Preflight Result

| Area | Result |
| --- | --- |
| Active project | `reeditpro` |
| Active account | present |
| Compute Engine API | enabled |
| Target zone | `us-central1-b` |
| Preferred machine type | `g2-standard-8` |
| Preferred machine type visible | true |
| Preferred machine type shape | 8 vCPU, 32 GiB RAM, one NVIDIA L4 |
| Accelerator | `nvidia-l4` |
| Accelerator visible | true |
| Regional NVIDIA L4 quota | limit `1`, usage `0` |
| Regional preemptible NVIDIA L4 quota | limit `1`, usage `0` |
| Project-wide `GPUS_ALL_REGIONS` quota | limit `0`, usage `0` |
| Existing Qwen/B-roll/proof VM | none found |
| Proof service account | present |
| IAP SSH firewall | present, enabled, TCP 22 from `35.235.240.0/20` to tag `ai-video-broll-wan-l4-proof` |

The regional L4 quota and preferred `g2-standard-8` target are ready for planning, but project-wide `GPUS_ALL_REGIONS=0` blocks any L4 VM create attempt. A VM create attempt would repeat the older Wan path failure before any CUDA or vLLM proof could run.

## Selected Cost-friendly Target

The selected first proof target remains:

- Project: `reeditpro`
- Region: `us-central1`
- Zone: `us-central1-b`
- Machine type: `g2-standard-8`
- GPU: one NVIDIA L4
- Access: no public IP, IAP-only
- Service account: proof-only service account
- First proof type: CUDA visibility and vLLM import only
- Inference: not allowed

`g2-standard-8` is preferred over `g2-standard-4` for this Qwen proof because the Qwen2.5-VL dependency stack is heavier than the earlier Wan 1.3B tabletop proof and the extra system memory reduces install/import pressure while keeping the same one-L4 GPU count. `g2-standard-4` remains the minimum import-smoke shape only if memory pressure stays low.

## Proof Outcome

- L4 CUDA visibility proof attempted: false
- vLLM GPU import proof attempted: false
- Metadata loader proof repeated on L4: false
- VM created: false
- IAP transfer run: false
- Remote dependency install run: false
- SSH session opened: false
- Cleanup required: false
- Blocker: `GPUS_ALL_REGIONS` limit is `0`

The correct next step is quota-focused owner work, not another VM create attempt.

## Runtime Gates

- `gcpReadOnlyCommandsExecuted=true`
- `gcpMutatingCommandsExecuted=false`
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

Qwen2.5-VL remains a visual understanding, planning, and QA stack tool. It is not an AI-video generation route, not a provider fallback, and not a substitute for approved edit plans, credit approval, or worker contracts. Wan remains the primary generated B-roll route. Qwen should rank for visual analysis, source-frame understanding, OCR/layout/caption QA, and advisory planning where deterministic tools are insufficient.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_10: request or verify GPUS_ALL_REGIONS quota for Qwen L4 import proof, no VM/no inference`
