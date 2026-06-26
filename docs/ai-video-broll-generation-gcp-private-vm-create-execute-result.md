# AI Video B-roll Generation GCP Private VM Create Execute Result

Decision: `ai_video_broll_gen_9j_vm_create_execute_blocked_by_gpus_all_regions_quota`

AI-VIDEO-BROLL-GEN-9J-VM-CREATE-EXECUTE repeated the immediate safety preflight and attempted the single approved no-public-IP L4 proof VM create command only after the preflight passed. Google Cloud rejected the request before creating any VM because project-level global GPU quota `GPUS_ALL_REGIONS` has limit `0`.

This result does not create the proof VM. It does not install dependencies, transfer the wheelhouse, open SSH, import models, run inference, create media, or claim runtime readiness. The next step is a quota-focused owner step, not a second create attempt.

## Source Evidence

- `docs/ai-video-broll-generation-gcp-private-vm-create-plan-3-result.md`
- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-create-execute.md`
- `docs/ai-video-broll-generation-python-runtime-alignment-result.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-4-result.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`
- `/Volumes/backup/reeditpro-model-cache/ai-video-broll/wheelhouses/wan-l4-proof-python-deps/python312-linux-x86_64/SHA256SUMS.json`

## Immediate Preflight Result

| Area | Result |
| --- | --- |
| Project | `reeditpro` |
| Zone | `us-central1-b` |
| Zone status | `UP` |
| Machine type | `g2-standard-4` available |
| Machine type shape | 4 vCPU, 16 GB RAM, one NVIDIA L4 |
| Accelerator | `nvidia-l4` available |
| Regional NVIDIA L4 quota | limit `1`, usage `0` |
| Regional preemptible NVIDIA L4 quota | limit `1`, usage `0` |
| Global GPU quota | `GPUS_ALL_REGIONS` limit `0`, usage `0` |
| CPU quota | limit `200`, usage `0` |
| SSD quota | limit `500`, usage `0` |
| Proof service account | present and enabled |
| IAP SSH firewall rule | present for target tag `ai-video-broll-wan-l4-proof` |
| Existing proof VM before create | absent |
| Existing proof disk before create | absent |
| Existing static address before create | absent |
| Existing reservation before create | absent |
| Selected image family | `common-cu129-ubuntu-2404-nvidia-580` |
| Current image observed | `common-cu129-ubuntu-2404-nvidia-580-v20260626` |
| Image status | `READY` |
| Image runtime | CUDA 12.9, Ubuntu 24.04, Python 3.12 |
| Private wheelhouse | Python 3.12 / `cp312`, 66 wheels |
| Private wheelhouse aggregate SHA-256 | `55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64` |

## Create Attempt

The approved command shape was attempted exactly for VM `reeditpro-ai-broll-wan-l4-proof` in `us-central1-b`, using `g2-standard-4`, one `nvidia-l4`, no external IP, the proof service account, IAP target tag, and logging/monitoring scopes only.

The sanitized Google Cloud result was:

```text
Quota GPUS_ALL_REGIONS exceeded. Limit: 0.0 globally.
metric name = compute.googleapis.com/gpus_all_regions
limit name = GPUS-ALL-REGIONS-per-project
```

No token, credential, service-account key, environment value, connection string, or secret was printed.

## Post-Attempt Resource Check

| Resource | Result |
| --- | --- |
| Instance `reeditpro-ai-broll-wan-l4-proof` | absent |
| Disk `reeditpro-ai-broll-wan-l4-proof` | absent |
| Static address `reeditpro-ai-broll-wan-l4-proof` | absent |
| Reservation `reeditpro-ai-broll-wan-l4-proof` | absent |
| Cleanup required | no, because no VM or related resource was created |

## Result

```json ai-video-broll-gen-9j-vm-create-execute-result
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-VM-CREATE-EXECUTE",
  "decision": "ai_video_broll_gen_9j_vm_create_execute_blocked_by_gpus_all_regions_quota",
  "sourceBranch": "codex/ai-video-broll-gen-9j-vm-create-plan-3",
  "sourceCommit": "81845e1",
  "project": {
    "projectId": "reeditpro",
    "targetRegion": "us-central1",
    "targetZone": "us-central1-b",
    "zoneStatus": "UP"
  },
  "preflight": {
    "projectVerified": true,
    "zoneUp": true,
    "machineTypeAvailable": true,
    "acceleratorAvailable": true,
    "regionalL4GpuQuotaLimit": 1,
    "regionalL4GpuQuotaUsage": 0,
    "preemptibleRegionalL4GpuQuotaLimit": 1,
    "preemptibleRegionalL4GpuQuotaUsage": 0,
    "globalGpusAllRegionsQuotaLimit": 0,
    "globalGpusAllRegionsQuotaUsage": 0,
    "cpuQuotaLimit": 200,
    "cpuQuotaUsage": 0,
    "ssdTotalGbQuotaLimit": 500,
    "ssdTotalGbQuotaUsage": 0,
    "proofServiceAccountPresent": true,
    "proofServiceAccountDisabled": false,
    "iapFirewallRulePresent": true,
    "iapFirewallTargetTag": "ai-video-broll-wan-l4-proof",
    "existingProofInstancePresentBeforeCreate": false,
    "existingProofDiskPresentBeforeCreate": false,
    "existingProofAddressPresentBeforeCreate": false,
    "existingProofReservationPresentBeforeCreate": false,
    "wheelhouseManifestPresent": true,
    "wheelhousePythonVersion": "3.12",
    "wheelhouseAbi": "cp312",
    "wheelhouseRealWheelCount": 66,
    "wheelhouseAggregateSha256": "55ab4ba840e664996b29ee684591a500568bbb9ade332d2b48f05af8e79eab64"
  },
  "createAttempt": {
    "approvedCreateCommandAttempted": true,
    "attemptedVmName": "reeditpro-ai-broll-wan-l4-proof",
    "attemptedMachineType": "g2-standard-4",
    "attemptedAccelerator": "nvidia-l4",
    "attemptedAcceleratorCount": 1,
    "attemptedNoExternalIp": true,
    "attemptedTargetTag": "ai-video-broll-wan-l4-proof",
    "attemptedServiceAccount": "reeditpro-ai-broll-proof-sa",
    "attemptedScopes": [
      "logging-write",
      "monitoring-write"
    ],
    "blockedByQuota": true,
    "blockedQuotaMetric": "GPUS_ALL_REGIONS",
    "blockedQuotaLimit": 0,
    "blockedQuotaUsage": 0,
    "gcpErrorSanitized": true
  },
  "postAttemptResourceState": {
    "proofInstancePresent": false,
    "proofDiskPresent": false,
    "proofAddressPresent": false,
    "proofReservationPresent": false,
    "cleanupRequired": false
  },
  "runtimeFlags": {
    "vmCreated": false,
    "diskCreated": false,
    "externalIpCreated": false,
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
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-FIX: request or verify GPUS_ALL_REGIONS quota for controlled L4 proof VM, no VM create/no inference"
}
```

## No-Scope Statement

No VM is created. No disk is created. No external IP is created. No network is created or changed. No Cloud NAT or router is created. No service account, service account key, firewall rule, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request is created. No IAP transfer is run. No SSH command is run. No dependency is installed on a VM. No source repository is cloned. No virtual environment is created. No model weight is downloaded. No model import is attempted. No pipeline is instantiated. No `from_pretrained` call is made. No `torch.load` is called. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No model proof execution flag is passed. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-FIX: request or verify GPUS_ALL_REGIONS quota for controlled L4 proof VM, no VM create/no inference`
