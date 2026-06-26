# Qwen2.5-VL 7B GPUS_ALL_REGIONS Quota Fix Result

## Status

Decision: `qwen2_5_vl_7b_gpus_all_regions_quota_fix_approved_ready_for_l4_import_retry`

This packet records the minimal Google Cloud quota preference created for the Qwen2.5-VL L4 CUDA visibility and vLLM import proof path.

The only cloud mutation in this gate was creating a quota preference for project `reeditpro` to move `GPUS_ALL_REGIONS` from `0` to `1`. No VM, disk, external IP, network, firewall rule, service account, service-account key, bucket, Artifact Registry image, reservation, Cloud Run job, IAP transfer, SSH session, dependency install, CUDA import proof, vLLM import proof, API server, model import, model inference, generated video, generated asset, public artifact, signed URL, Supabase row, SQL mutation, provider call, worker job, credit mutation, beta unlock, production unlock, `dry_run_passed` claim, or `generated_local_fixture_passed` claim was created.

## Baseline Inputs

- Workstream: `AI_VIDEO_BROLL_GENERATION`
- Stack tool: `qwen_vl`
- Model ID: `Qwen/Qwen2.5-VL-7B-Instruct`
- Revision: `cc594898137f460bfe9f0759e9844b3ce807cfb5`
- Blocked preflight: `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-result.md`
- Prior import proof: `docs/qwen2-5-vl-7b-wheelhouse-import-proof-result.md`
- Quota service: `compute.googleapis.com`
- Quota ID: `GPUS-ALL-REGIONS-per-project`
- Quota metric: `compute.googleapis.com/gpus_all_regions`
- Target project: `reeditpro`
- Target location: `global`

## Read-only Discovery

Read-only quota discovery showed:

- stable `gcloud services quota` group available: false
- beta `gcloud beta quotas preferences` group available: true
- quota info list available: true
- quota preference list available: true
- existing quota preferences before create: none
- quota increase eligibility: true
- quota ID: `GPUS-ALL-REGIONS-per-project`
- applicable location: `global`

The target quota was eligible for a minimal increase request.

## Quota Preference Created

Sanitized command shape:

```bash
gcloud beta quotas preferences create \
  --project=reeditpro \
  --service=compute.googleapis.com \
  --quota-id=GPUS-ALL-REGIONS-per-project \
  --preferred-value=1 \
  --preference-id=qwen2-5-vl-gpus-all-regions-1 \
  --email=<approved-owner-email> \
  --justification='One controlled no-public-IP NVIDIA L4 G2 VM for Qwen2.5-VL CUDA visibility and vLLM import proof only; no inference, no production, no public IP.' \
  --format=json
```

The actual command output was sanitized before being recorded in this repository.

Result:

- quota preference created: true
- quota preference name: `projects/reeditpro/locations/global/quotaPreferences/qwen2-5-vl-gpus-all-regions-1`
- preferred value: `1`
- initial granted value: `0`
- initial reconciling: true
- approval after recheck: true
- final granted value: `1`
- state detail: `Quota request approved to 1`

## Effective Quota Recheck

After the preference was approved, read-only project quota inspection returned:

| Quota | Limit | Usage |
| --- | ---: | ---: |
| `GPUS_ALL_REGIONS` | `1` | `0` |

The Qwen L4 import proof is no longer blocked by project-wide global GPU quota.

## Remaining Preconditions Before VM Retry

Before any VM creation, the retry must still repeat:

- active project check;
- active account check;
- Compute Engine API check;
- `g2-standard-8` machine type visibility in `us-central1-b`;
- `nvidia-l4` accelerator visibility in `us-central1-b`;
- regional `NVIDIA_L4_GPUS` quota check;
- project-wide `GPUS_ALL_REGIONS` quota check;
- proof service account check;
- IAP SSH firewall check;
- existing proof VM/disk/address/reservation absence check;
- final bounded cost and cleanup plan.

## Runtime Gates

- `quotaPreferenceCreated=true`
- `quotaPreferenceApproved=true`
- `quotaRequestCreated=true`
- `gcpMutatingCommandsExecuted=true`
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

`QWEN2_5_VL_STACK_TOOL_9-RETRY: run Qwen2.5-VL L4 CUDA visibility and vLLM import proof, no inference`
