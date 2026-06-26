# AI Video B-roll Generation GCP IAP Egress Fix Result

Decision: `ai_video_broll_gen_9j_gcp_iap_egress_fix_iap_enabled_wheelhouse_path_approved_vm_still_blocked`

AI-VIDEO-BROLL-GEN-9J-GCP-IAP-EGRESS-FIX resolved the first controlled L4 proof blocker by enabling the Cloud Identity-Aware Proxy API for the verified `reeditpro` project. It also selected the safe no-public-IP dependency path for the next VM readiness gate: build a local wheelhouse/dependency bundle in a later prompt and transfer it over IAP after a final no-runtime preflight.

This gate still does not authorize VM creation. The dependency path is approved as the correct future strategy, but it is not ready because the wheelhouse has not been built or validated. Cloud NAT is not created, external-IP VM creation remains rejected, and all model/runtime execution remains blocked.

## Source Evidence

- `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-gcp-iap-egress-fix.md`
- `docs/ai-video-broll-generation-gcp-private-vm-preflight-2-result.md`
- `docs/ai-video-broll-generation-gcp-private-cache-validate-result.md`
- `docs/ai-video-broll-generation-gcp-private-diffusers-cache-manifest.md`
- `docs/ai-video-broll-generation-gcp-private-proof-runner-dependency-approval.md`
- `server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt`

## Verified Project And Runtime Target

| Area | Result |
| --- | --- |
| Project | `reeditpro` |
| Project lifecycle | `ACTIVE` |
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

`g2-standard-4` remains the preferred first proof shape because it is the smallest L4 shape available in the target zone and keeps the proof cost lower than A100/H100-class alternatives while still matching the Wan 1.3B Diffusers VRAM envelope.

## IAP API Result

The preflight re-checked that `compute.googleapis.com`, `iam.googleapis.com`, `logging.googleapis.com`, and `monitoring.googleapis.com` were already enabled, then enabled `iap.googleapis.com` for the verified `reeditpro` project.

Sanitized command:

```text
gcloud services enable iap.googleapis.com --project=reeditpro
```

Sanitized result:

```text
Operation finished successfully.
```

Post-check confirmed `iap.googleapis.com` is enabled. No VM, disk, firewall rule, service account, key, router, Cloud NAT, static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, quota request, dependency install, model import, inference, generated frame, generated video, Supabase mutation, provider call, worker dispatch, signed URL, public artifact, credit mutation, beta unlock, or production unlock occurred.

## Dependency Path Decision

Approved future no-public-IP dependency path:

```text
local wheelhouse / dependency bundle
+ transfer over IAP
+ install only from server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt
+ no runtime internet dependency install
```

Why this is the right next path:

- avoids the recurring cost and cleanup burden of Cloud NAT for the first proof;
- preserves the no-public-IP VM posture;
- avoids the open default SSH exposure risk;
- keeps dependency versions tied to the committed requirements manifest;
- avoids ad hoc source repository clones on the proof VM;
- creates an auditable artifact for later transfer/install validation.

The wheelhouse is not created in this prompt. It must be built and validated in a later no-VM/no-inference prompt before VM creation is allowed.

## Rejected Paths

| Path | Status | Reason |
| --- | --- | --- |
| External-IP proof VM | rejected | default SSH from `0.0.0.0/0` remains present |
| Cloud NAT/private egress now | rejected | not needed for first proof if a wheelhouse transfer is used; would add cost and cleanup work |
| VM-side unpinned `pip install` | rejected | not tied tightly enough to the committed requirements manifest |
| VM-side source repository clone | rejected | duplicates model/provider/runtime source paths and weakens provenance |
| Runtime model download on VM | rejected | approved private Diffusers cache already exists and must remain the source |

## Remaining Blockers

1. The local wheelhouse/dependency bundle does not exist yet.
2. No wheelhouse checksum manifest exists yet.
3. No IAP transfer dry-run or command packet exists yet.
4. No VM readiness repeat has confirmed the approved path after IAP enablement.
5. VM creation remains blocked until a later prompt proves the no-public-IP dependency path is ready.

## Result

```json ai-video-broll-gen-9j-gcp-iap-egress-fix-result
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-GCP-IAP-EGRESS-FIX",
  "decision": "ai_video_broll_gen_9j_gcp_iap_egress_fix_iap_enabled_wheelhouse_path_approved_vm_still_blocked",
  "sourceBranch": "codex/ai-video-broll-gen-9j-vm-preflight-2",
  "sourceCommit": "a14d671",
  "projectVerification": {
    "projectId": "reeditpro",
    "projectLifecycleState": "ACTIVE",
    "targetRegion": "us-central1",
    "targetZone": "us-central1-b",
    "zoneStatus": "UP"
  },
  "apiState": {
    "computeApiEnabled": true,
    "iamApiEnabled": true,
    "loggingApiEnabled": true,
    "monitoringApiEnabled": true,
    "iapApiWasEnabledBeforeThisPrompt": false,
    "iapApiEnabledByThisPrompt": true,
    "iapApiEnabledAfterThisPrompt": true,
    "gcpMutatingCommandsExecuted": true,
    "onlyGcpMutation": "enable_iap_googleapis_com"
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
    "costFriendlyShapeSelected": true
  },
  "identityAndFirewall": {
    "proofServiceAccountId": "reeditpro-ai-broll-proof-sa",
    "proofServiceAccountExists": true,
    "proofServiceAccountUserManagedKeyCount": 0,
    "iapSshFirewallRuleExists": true,
    "iapSshFirewallRuleDisabled": false,
    "iapSshSourceRange": "35.235.240.0/20",
    "iapSshTargetTag": "ai-video-broll-wan-l4-proof",
    "defaultSshOpenToWorld": true,
    "externalIpVmRejected": true
  },
  "dependencyPathDecision": {
    "selectedPath": "local_wheelhouse_transfer_over_iap",
    "selectedPathApproved": true,
    "selectedPathReadyNow": false,
    "wheelhouseCreated": false,
    "wheelhouseChecksumManifestCreated": false,
    "cloudNatApprovedNow": false,
    "cloudNatCreated": false,
    "externalIpVmApproved": false,
    "runtimeInternetPipInstallApproved": false,
    "sourceRepoCloneApproved": false
  },
  "networkAndResources": {
    "defaultNetworkExists": true,
    "defaultSubnetUsCentral1Exists": true,
    "privateIpGoogleAccess": false,
    "cloudNatFoundInUsCentral1": false,
    "instancesFound": 0,
    "disksFound": 0,
    "staticAddressesFound": 0,
    "reservationsFound": 0
  },
  "cacheAndRunner": {
    "privateCachePath": "/Volumes/backup/reeditpro-model-cache/ai-video-broll/Wan-AI__Wan2.1-T2V-1.3B-Diffusers/0fad780a534b6463e45facd96134c9f345acfa5b",
    "privateCacheSizeOnDisk": "27G",
    "runtimeEssentialFileCount": 19,
    "manifestAggregateBytes": 28928887859,
    "requirementsManifest": "server/workers/ai-video-broll-controlled-install/requirements.ai-video-broll.txt",
    "runnerValidateOnlyMustRunFirst": true,
    "futureExecutionFlagAllowedNow": false
  },
  "runtimeFlags": {
    "vmPreflightPassed": false,
    "vmCreateAllowedNext": false,
    "vmCreated": false,
    "diskCreated": false,
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
    "dependencyInstallRun": false,
    "wheelhouseCreated": false,
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
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-3: re-check controlled L4 proof VM readiness, no inference"
}
```

## No-Scope Statement

No VM is created. No disk is created. No firewall rule is created or changed. No service account is created. No service account key is created. No router is created. No Cloud NAT is created. No static address is created. No reservation is created. No custom image is created. No bucket is created. No Artifact Registry image is created. No Cloud Run job is created. No quota request is created. No dependency is installed. No wheelhouse is created. No virtual environment is created. No model import is attempted. No pipeline is instantiated. No `from_pretrained` call is made. No `torch.load` is called. No text encoding is run. No denoising step is run. No scheduler is run. No VAE encode or decode is run. No inference is run. No generated frame is created. No generated video is created. No media processing is run. No FFmpeg command is run. No model proof execution flag is passed. No Supabase command is run. No SQL is executed. No provider is called. No worker is dispatched. No storage object is uploaded. No signed URL is created. No public artifact is created. No credit estimate, credit approval, reservation, spend, refund, or release is created. No beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` claim is made.

## Next Prompt

`AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-3: re-check controlled L4 proof VM readiness, no inference`
