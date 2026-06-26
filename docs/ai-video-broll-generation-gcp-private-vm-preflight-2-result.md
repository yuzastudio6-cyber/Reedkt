# AI Video B-roll Generation GCP Private VM Preflight 2 Result

Decision: `ai_video_broll_gen_9j_vm_preflight_2_blocked_iap_api_disabled_and_no_private_egress`

AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-2 performed read-only Google Cloud and local-cache preflight checks for the controlled Wan 1.3B L4 proof path. The cost-friendly GPU target remains `g2-standard-4` with one `nvidia-l4` in `us-central1-b`, but the preflight is blocked before VM creation because the Cloud Identity-Aware Proxy API is disabled and the no-public-IP dependency setup path does not yet have private egress or an approved transferred wheelhouse.

This gate did not create a VM, disk, network, service account, service account key, firewall rule, static address, reservation, image, bucket, Cloud NAT, router, Artifact Registry image, Cloud Run job, quota request, dependency install, model import, inference run, generated frame, generated video, media file, Supabase row, SQL mutation, provider call, worker dispatch, signed URL, public artifact, credit row, beta unlock, production unlock, runtime-readiness claim, `dry_run_passed` claim, or `generated_local_fixture_passed` claim.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-2.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-download-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-author-result.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md`
- `server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

## Read-Only GCP Preflight

| Area | Result |
| --- | --- |
| Project | `reeditpro` |
| Project lifecycle | `ACTIVE` |
| Default compute zone | unset; future commands must pass `--zone=us-central1-b` |
| Target region | `us-central1` |
| Target zone | `us-central1-b` |
| Zone status | `UP` |
| Machine type | `g2-standard-4` |
| Machine shape | 4 vCPU, 16 GB RAM, 1 NVIDIA L4 |
| Accelerator | `nvidia-l4` |
| Regional L4 quota | limit `1`, usage `0` |
| Regional preemptible L4 quota | limit `1`, usage `0` |
| Regional CPU quota | limit `200`, usage `0` |
| Regional SSD quota | limit `500` GB, usage `0` |
| Existing instances | none |
| Existing disks | none |
| Existing static addresses | none |
| Existing reservations | none |
| Existing custom images | none |

## Identity And Firewall

| Area | Result |
| --- | --- |
| Proof service account ID | `reeditpro-ai-broll-proof-sa` |
| Proof service account display name | `ReEditPro AI B-roll L4 proof only` |
| User-managed keys | `0` |
| Project roles | `roles/logging.logWriter`, `roles/monitoring.metricWriter` |
| IAP SSH firewall rule | present |
| IAP SSH rule disabled | no |
| IAP SSH source range | `35.235.240.0/20` |
| IAP SSH target tag | `ai-video-broll-wan-l4-proof` |
| Open default SSH firewall rule | present; future proof VM must use `--no-address` and never rely on external SSH |
| IAP API | disabled |

## Network And Egress

The current default subnet in `us-central1` has `privateIpGoogleAccess=false`. No Cloud NAT/router was found in `us-central1`.

For security, the future proof VM must not use an external IP address. With no public IP, the VM cannot rely on normal internet egress for `pip install` unless a later gate adds one of these safe dependency paths:

1. an approved local wheelhouse/dependency bundle transferred over IAP after the API is enabled;
2. an approved no-public-IP private egress path such as Cloud NAT, with cost and cleanup controls;
3. another reviewed private artifact path that keeps provider keys, signed URLs, user media, and public artifacts out of scope.

External-IP VM creation is rejected for this lane while the project still has the default `tcp:22` firewall open from `0.0.0.0/0`.

## Private Cache And Transfer Preflight

| Area | Result |
| --- | --- |
| Private cache path | `/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b` |
| Private cache size on disk | approximately `27G` |
| Runtime-essential files | `19` |
| Manifest aggregate bytes | `28928887859` |
| Future VM cache prefix | `/tmp/reeditpro-private-model-cache` |
| Future proof output prefix | `/tmp/reeditpro-private-proof-output` |
| Future HF home prefix | `/tmp/reeditpro-private-hf-home` |
| Future transfer method | blocked until IAP API is enabled and no-public-IP dependency path is accepted |

## Cost-Friendly Runtime Shape

`g2-standard-4` remains the selected proof shape because it is the smallest G2/L4 machine type found in the target zone, provides one 24 GB L4 GPU, and is aligned with the Diffusers Wan 1.3B guidance that small text-to-video runs need roughly 11 GB VRAM. This avoids jumping to A100/H100-class pricing before a controlled proof requires it.

For the first controlled proof, on-demand L4 is preferred over spot/preemptible because dependency setup, cache transfer, and proof cleanup need a predictable short window. Cost control should come from a strict runtime cap, no external IP, auto-delete boot disk, no reservation, cleanup verification, and no repeated inference loops. Spot/preemptible can be reconsidered after the proof runner is reliable.

Recommended future VM shape after blockers are fixed:

- zone: `us-central1-b`
- machine type: `g2-standard-4`
- accelerator: `nvidia-l4,count=1`
- provisioning: on-demand for first proof
- external IP: none
- target tag: `ai-video-broll-wan-l4-proof`
- service account ID: `reeditpro-ai-broll-proof-sa`
- boot disk: auto-delete, enough free space for cache, venv, and temporary proof output
- first runner action: `--validate-only`
- execution flag: not passed until a later explicit execution prompt

## Blockers

1. `iap.googleapis.com` is disabled, so the IAP SSH transfer/control path is not ready.
2. No-public-IP dependency installation is not ready because there is no Cloud NAT/private egress plan and no approved transferred wheelhouse.
3. External-IP VM creation is rejected while default SSH from `0.0.0.0/0` exists.
4. VM creation remains blocked until the next gate resolves IAP and dependency egress without weakening the no-public-IP posture.

## Result

```json ai-video-broll-gen-9j-vm-preflight-2-result
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-2",
  "decision": "ai_video_broll_gen_9j_vm_preflight_2_blocked_iap_api_disabled_and_no_private_egress",
  "sourceBranch": "codex/ai-video-broll-gen-9j-cache-validate",
  "sourceCommit": "40cdc8d9",
  "gcpReadOnlyPreflight": {
    "projectId": "reeditpro",
    "projectLifecycleState": "ACTIVE",
    "targetRegion": "us-central1",
    "targetZone": "us-central1-b",
    "defaultComputeZoneSet": false,
    "zoneStatus": "UP",
    "computeApiEnabled": true,
    "iamApiEnabled": true,
    "loggingApiEnabled": true,
    "monitoringApiEnabled": true,
    "iapApiEnabled": false,
    "gcpMutatingCommandsExecuted": false
  },
  "machineAndQuota": {
    "machineType": "g2-standard-4",
    "guestCpus": 4,
    "memoryMb": 16384,
    "accelerator": "nvidia-l4",
    "acceleratorCount": 1,
    "regionalL4QuotaLimit": 1,
    "regionalL4QuotaUsage": 0,
    "regionalPreemptibleL4QuotaLimit": 1,
    "regionalPreemptibleL4QuotaUsage": 0,
    "regionalCpuQuotaLimit": 200,
    "regionalCpuQuotaUsage": 0,
    "regionalSsdTotalGbLimit": 500,
    "regionalSsdTotalGbUsage": 0,
    "costFriendlyShapeSelected": true,
    "onDemandPreferredForFirstProof": true
  },
  "identityAndFirewall": {
    "proofServiceAccountId": "reeditpro-ai-broll-proof-sa",
    "proofServiceAccountExists": true,
    "proofServiceAccountUserManagedKeyCount": 0,
    "proofServiceAccountRoles": [
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter"
    ],
    "iapSshFirewallRuleExists": true,
    "iapSshFirewallRuleDisabled": false,
    "iapSshSourceRange": "35.235.240.0/20",
    "iapSshTargetTag": "ai-video-broll-wan-l4-proof",
    "defaultSshOpenToWorld": true,
    "externalIpVmRejected": true
  },
  "networkAndDependencyPath": {
    "defaultNetworkExists": true,
    "defaultSubnetUsCentral1Exists": true,
    "privateIpGoogleAccess": false,
    "cloudNatFoundInUsCentral1": false,
    "noPublicIpVmRequired": true,
    "noPublicIpDependencyPathReady": false,
    "approvedWheelhouseReady": false,
    "requiresIapAndEgressFix": true
  },
  "existingProofResources": {
    "instancesFound": 0,
    "disksFound": 0,
    "staticAddressesFound": 0,
    "reservationsFound": 0,
    "customImagesFound": 0
  },
  "cacheAndRunner": {
    "privateCachePath": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b",
    "runtimeEssentialFileCount": 19,
    "manifestAggregateBytes": 28928887859,
    "futureVmCachePrefix": "/tmp/reeditpro-private-model-cache",
    "futureProofOutputPrefix": "/tmp/reeditpro-private-proof-output",
    "futureHfHomePrefix": "/tmp/reeditpro-private-hf-home",
    "runnerValidateOnlyMustRunFirst": true,
    "futureExecutionFlagAllowedNow": false
  },
  "runtimeFlags": {
    "vmPreflightPassed": false,
    "vmCreateAllowedNext": false,
    "iapApiEnabledNow": false,
    "cloudNatCreated": false,
    "networkMutated": false,
    "vmCreated": false,
    "diskCreated": false,
    "serviceAccountCreated": false,
    "serviceAccountKeyCreated": false,
    "firewallRuleCreated": false,
    "staticAddressCreated": false,
    "reservationCreated": false,
    "dependencyInstallRun": false,
    "modelImportRun": false,
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
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "betaProductionUnlockClaimed": false
  },
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-GCP-IAP-EGRESS-FIX: enable IAP API and approve no-public-IP dependency path, no VM/no inference"
}
```

## No-Scope Statement

No VM is created. No disk is created. No network is created or changed. No Cloud NAT or router is created. No service account, service account key, firewall rule, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request is created. No dependency is installed. No virtual environment is created. No model import is attempted. No pipeline is instantiated. No `from_pretrained` call is made. No `torch.load` is called. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No model proof execution flag is passed. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-GCP-IAP-EGRESS-FIX: enable IAP API and approve no-public-IP dependency path, no VM/no inference`
