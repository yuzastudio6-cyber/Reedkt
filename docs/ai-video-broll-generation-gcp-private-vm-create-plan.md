# AI Video B-roll Generation GCP Private VM Create Plan

Decision: `ai_video_broll_gen_9j_vm_create_plan_blocked_pending_python_runtime_alignment`

AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN repeated the controlled no-public-IP L4 VM creation checks and drafted the future VM create/delete command shape for the Wan 1.3B proof path. The GCP resource shape remains viable: `g2-standard-4` in `us-central1-b`, one `nvidia-l4`, no external IP, IAP-only access, the existing proof service account, and the existing IAP SSH target tag.

VM creation is still blocked because the private dependency wheelhouse is Python 3.13 / `cp313`, while the current inspected Google Deep Learning VM image candidates report Python 3.12. A no-index offline install from the completed wheelhouse would not be safe to attempt on a Python 3.12 runtime.

This gate did not create a VM, disk, network, service account, service account key, firewall rule, router, Cloud NAT, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, quota request, IAP transfer, SSH session, virtual environment, dependency install, model download, model import, inference run, generated frame, generated video, media file, Supabase row, SQL mutation, provider call, worker dispatch, signed URL, public artifact, credit row, beta unlock, production unlock, runtime-readiness claim, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-create-plan.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md`
- `docs/ai-video-broll-generation-gcp-private-wheelhouse-fix-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-3-result.md`
- `docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md`
- `docs/ai-video-broll-generation-python-cuda-compatibility-plan.md`
- `docs/ai-video-broll-generation-runtime-gpu-tier-decision.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64/SHA256SUMS.json`

## Read-only GCP Preflight

| Area | Result |
| --- | --- |
| Project | `reeditpro` |
| Zone | `us-central1-b` |
| Zone status | `UP` |
| Machine type | `g2-standard-4` available |
| Accelerator | `nvidia-l4` available |
| NVIDIA L4 quota | limit `1`, usage `0` |
| CPU quota | limit `200`, usage `0` |
| SSD quota | limit `500`, usage `0` |
| Existing proof VM | absent |
| Existing proof disk | absent |
| Existing static address | absent |
| Existing reservation | absent |
| Proof service account | present and enabled |
| IAP SSH firewall rule | `reeditpro-ai-broll-proof-iap-ssh` present for target tag `ai-video-broll-wan-l4-proof` |
| Broad default SSH firewall | present in project; future VM has no external IP and should use the IAP target tag only |
| Required services | Compute, IAM, IAP, Logging, Monitoring enabled |

## Image And Python Runtime Finding

| Candidate image family | Current image | Description | Compatibility with wheelhouse |
| --- | --- | --- | --- |
| `common-cu129-ubuntu-2404-nvidia-580` | `common-cu129-ubuntu-2404-nvidia-580-v20260616` | CUDA 12.9, Ubuntu 24.04, Python 3.12 | blocked for `cp313` wheelhouse |
| `pytorch-2-9-cu129-ubuntu-2404-nvidia-580` | `pytorch-2-9-cu129-ubuntu-2404-nvidia-580-v20260616` | CUDA 12.9, PyTorch 2.9, Ubuntu 24.04, Python 3.12 | blocked for `cp313` wheelhouse |

The completed private wheelhouse reports:

- Python version: `3.13`
- ABI: `cp313`
- Torch wheel: `torch-2.12.1-cp313-cp313-manylinux_2_28_x86_64.whl`
- Real wheel count: `66`
- Aggregate SHA-256: `366835269639cd0d7bd24fcb876d39f94bca2bb9c4772735a16fa2458dfbfc11`

The VM create command is therefore drafted but not execution-ready.

## Draft Future VM Create Command

This command is retained as future shape only. It was not executed and must not be executed until the Python runtime alignment prompt resolves the `cp313` versus Python 3.12 image mismatch.

```bash
gcloud compute instances create reeditpro-ai-broll-wan-l4-proof \
  --project=reeditpro \
  --zone=us-central1-b \
  --machine-type=g2-standard-4 \
  --accelerator=type=nvidia-l4,count=1 \
  --maintenance-policy=TERMINATE \
  --provisioning-model=STANDARD \
  --image-family=common-cu129-ubuntu-2404-nvidia-580 \
  --image-project=deeplearning-platform-release \
  --boot-disk-size=150GB \
  --boot-disk-type=pd-balanced \
  --boot-disk-auto-delete \
  --no-address \
  --tags=ai-video-broll-wan-l4-proof \
  --service-account=reeditpro-ai-broll-proof-sa@reeditpro.iam.gserviceaccount.com \
  --scopes=logging-write,monitoring-write \
  --metadata=block-project-ssh-keys=TRUE,enable-oslogin=TRUE
```

## Draft Future Cleanup Command

This command is retained as future shape only and was not executed.

```bash
gcloud compute instances delete reeditpro-ai-broll-wan-l4-proof \
  --project=reeditpro \
  --zone=us-central1-b \
  --quiet
```

Cleanup requirements for a later execution prompt:

- delete only the proof VM created by that prompt;
- verify the instance no longer exists;
- verify no static address, disk, reservation, router, Cloud NAT, bucket, or custom image was created unless explicitly approved in that same future prompt;
- stop immediately if the target VM name resolves to an unexpected existing instance.

## Runtime Alignment Requirement

Before VM creation can move to an execute prompt, one of these alignment paths must be selected and validated:

1. Select a no-public-IP L4 image that clearly provides Python 3.13 and a compatible NVIDIA/CUDA runtime.
2. Rebuild the private wheelhouse for the selected VM image's Python version, likely Python 3.12 for the inspected Deep Learning VM families.
3. Produce an owner-approved offline Python 3.13 runtime packet that can be transferred over IAP without source builds, runtime internet installs, Cloud NAT, repository clone, or VM source compilation.

The second path is likely the simplest and safest if the GCP Deep Learning VM image family remains Python 3.12.

## Result

```json ai-video-broll-gen-9j-vm-create-plan-result
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-VM-CREATE-PLAN",
  "decision": "ai_video_broll_gen_9j_vm_create_plan_blocked_pending_python_runtime_alignment",
  "sourceBranch": "codex/ai-video-broll-gen-9j-vm-preflight-4",
  "sourceCommit": "9e99556",
  "project": {
    "projectId": "reeditpro",
    "targetRegion": "us-central1",
    "targetZone": "us-central1-b",
    "zoneStatus": "UP"
  },
  "futureVmShape": {
    "futureVmName": "reeditpro-ai-broll-wan-l4-proof",
    "machineType": "g2-standard-4",
    "accelerator": "nvidia-l4",
    "acceleratorCount": 1,
    "targetTag": "ai-video-broll-wan-l4-proof",
    "serviceAccountId": "reeditpro-ai-broll-proof-sa",
    "externalIpAllowed": false,
    "iapOnlyAccessRequired": true,
    "bootDiskGb": 150,
    "bootDiskType": "pd-balanced",
    "bootDiskAutoDelete": true,
    "cloudNatRequired": false,
    "sourceRepositoryCloneAllowed": false
  },
  "gcpPreflight": {
    "machineTypeAvailable": true,
    "acceleratorAvailable": true,
    "l4GpuQuotaLimit": 1,
    "l4GpuQuotaUsage": 0,
    "cpuQuotaLimit": 200,
    "cpuQuotaUsage": 0,
    "ssdTotalGbQuotaLimit": 500,
    "ssdTotalGbQuotaUsage": 0,
    "proofServiceAccountPresent": true,
    "proofServiceAccountDisabled": false,
    "iapFirewallRulePresent": true,
    "iapFirewallTargetTag": "ai-video-broll-wan-l4-proof",
    "broadDefaultSshFirewallPresent": true,
    "existingProofInstancePresent": false,
    "existingProofDiskPresent": false,
    "existingProofAddressPresent": false,
    "existingProofReservationPresent": false
  },
  "candidateImages": [
    {
      "family": "common-cu129-ubuntu-2404-nvidia-580",
      "image": "common-cu129-ubuntu-2404-nvidia-580-v20260616",
      "descriptionPython": "3.12",
      "status": "READY",
      "compatibleWithWheelhouse": false
    },
    {
      "family": "pytorch-2-9-cu129-ubuntu-2404-nvidia-580",
      "image": "pytorch-2-9-cu129-ubuntu-2404-nvidia-580-v20260616",
      "descriptionPython": "3.12",
      "status": "READY",
      "compatibleWithWheelhouse": false
    }
  ],
  "wheelhouseRuntime": {
    "path": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python313-linux-x86_64",
    "pythonVersion": "3.13",
    "abi": "cp313",
    "realWheelCount": 66,
    "aggregateBytes": 2802293613,
    "aggregateSha256": "366835269639cd0d7bd24fcb876d39f94bca2bb9c4772735a16fa2458dfbfc11",
    "torchWheel": "torch-2.12.1-cp313-cp313-manylinux_2_28_x86_64.whl"
  },
  "createPlan": {
    "vmCreateCommandShapeDrafted": true,
    "vmCleanupCommandShapeDrafted": true,
    "vmCreateExecutionReady": false,
    "pythonRuntimeCompatibleWithWheelhouse": false,
    "blockedReason": "inspected_deep_learning_vm_images_report_python_3_12_but_private_wheelhouse_is_cp313_python_3_13",
    "nextGateRequiresPythonRuntimeAlignment": true
  },
  "runtimeFlags": {
    "vmCreated": false,
    "diskCreated": false,
    "networkChanged": false,
    "serviceAccountCreated": false,
    "serviceAccountKeyCreated": false,
    "firewallRuleCreated": false,
    "routerCreated": false,
    "cloudNatCreated": false,
    "staticAddressCreated": false,
    "reservationCreated": false,
    "customImageCreated": false,
    "bucketCreated": false,
    "artifactRegistryImageCreated": false,
    "cloudRunJobCreated": false,
    "quotaRequestCreated": false,
    "iapTransferExecuted": false,
    "sshSessionOpened": false,
    "dependencyInstalledOnVm": false,
    "sourceRepositoryCloned": false,
    "modelDownloaded": false,
    "modelImported": false,
    "pipelineInstantiated": false,
    "modelFromPretrainedCalled": false,
    "torchLoadCalled": false,
    "modelInferenceRun": false,
    "generatedFramesCreated": false,
    "generatedVideoCreated": false,
    "mediaProcessingRun": false,
    "ffmpegRun": false,
    "providerCalled": false,
    "workerDispatched": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "storageUploaded": false,
    "signedUrlsCreated": false,
    "publicArtifactsCreated": false,
    "creditMutationCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false,
    "runtimeReadinessClaimed": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false
  },
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-PYTHON-RUNTIME-ALIGNMENT: align VM Python runtime with private wheelhouse, no VM/no inference"
}
```

## No-Scope Statement

No VM is created. No disk is created. No network is created or changed. No Cloud NAT or router is created. No service account, service account key, firewall rule, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request is created. No IAP transfer is run. No SSH command is run. No dependency is installed on a VM. No source repository is cloned. No virtual environment is created. No model weight is downloaded. No model import is attempted. No pipeline is instantiated. No `from_pretrained` call is made. No `torch.load` is called. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No model proof execution flag is passed. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-PYTHON-RUNTIME-ALIGNMENT: align VM Python runtime with private wheelhouse, no VM/no inference`
