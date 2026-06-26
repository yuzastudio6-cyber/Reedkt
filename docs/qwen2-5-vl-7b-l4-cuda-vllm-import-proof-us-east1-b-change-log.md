# Qwen2.5-VL 7B L4 CUDA vLLM Import Proof us-east1-b Change Log

Decision: `qwen2_5_vl_7b_l4_cuda_vllm_import_proof_us_east1_b_blocked_by_g2_l4_zonal_stockout`

This change records the controlled Qwen2.5-VL L4 proof retry in `us-east1-b`. Google Cloud returned zonal stockout for the approved `g2-standard-8` plus one NVIDIA L4 shape before any VM existed. The attempted zones so far are `us-central1-b`, `us-central1-a`, `us-central1-c`, `us-west1-a`, and `us-east1-b`, and all returned stockout.

## Files Added

- `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-east1-b-result.md`
- `docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-east1-b-change-log.md`
- `docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-capacity-assurance-plan.md`
- `scripts/validation/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-east1-b-diagnostics.mjs`

## Files Updated

- `package.json`

## Result

```json qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-east1-b-change-log
{
  "phase": "QWEN2_5_VL_STACK_TOOL_9-RETRY-US-EAST1-B",
  "decision": "qwen2_5_vl_7b_l4_cuda_vllm_import_proof_us_east1_b_blocked_by_g2_l4_zonal_stockout",
  "sourceBranch": "codex/qwen2-5-vl-7b-l4-capacity-followup",
  "filesAdded": [
    "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-east1-b-result.md",
    "docs/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-east1-b-change-log.md",
    "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-capacity-assurance-plan.md",
    "scripts/validation/qwen2-5-vl-7b-l4-cuda-vllm-import-proof-us-east1-b-diagnostics.mjs"
  ],
  "filesUpdated": [
    "package.json"
  ],
  "preflight": {
    "projectId": "reeditpro",
    "targetZone": "us-east1-b",
    "targetRegion": "us-east1",
    "machineType": "g2-standard-8",
    "accelerator": "nvidia-l4",
    "machineTypeAvailable": true,
    "acceleratorAvailable": true,
    "regionalL4GpuQuotaLimit": 1,
    "regionalL4GpuQuotaUsage": 0,
    "globalGpusAllRegionsQuotaLimit": 1,
    "globalGpusAllRegionsQuotaUsage": 0,
    "proofServiceAccountUserManagedKeys": 0,
    "iapFirewallRulePresent": true,
    "iapFirewallTargetTag": "ai-video-broll-wan-l4-proof",
    "existingProofInstancePresentBeforeCreate": false,
    "existingProofDiskPresentBeforeCreate": false,
    "existingProofReservationPresentBeforeCreate": false,
    "existingProofAddressPresentBeforeCreate": false,
    "privateModelCachePresent": true,
    "privateWheelhousePresent": true,
    "privateWheelhouseWheelCount": 158
  },
  "createAttempt": {
    "approvedCreateCommandAttempted": true,
    "attemptedVmName": "reeditpro-qwen2-5-vl-l4-proof",
    "attemptedZone": "us-east1-b",
    "attemptedMachineType": "g2-standard-8",
    "attemptedAccelerator": "nvidia-l4",
    "attemptedAcceleratorCount": 1,
    "attemptedNoExternalIp": true,
    "attemptedTargetTag": "ai-video-broll-wan-l4-proof",
    "attemptedServiceAccount": "reeditpro-ai-broll-proof-sa",
    "blockedByQuota": false,
    "blockedByZonalStockout": true,
    "gcpErrorSanitized": true
  },
  "postAttemptResourceState": {
    "proofInstancePresent": false,
    "proofDiskPresent": false,
    "proofReservationPresent": false,
    "proofAddressPresent": false,
    "regionalL4GpuQuotaUsageAfterAttempt": 0,
    "globalGpusAllRegionsQuotaUsageAfterAttempt": 0,
    "cleanupRequired": false,
    "cleanupVerified": true
  },
  "runtimeFlags": {
    "gcpReadOnlyCommandsExecuted": true,
    "gcpMutatingCommandsExecuted": true,
    "approvedCreateCommandAttempted": true,
    "blockedByZonalStockout": true,
    "alternateRegionRetryAttempted": true,
    "vmCreated": false,
    "diskCreated": false,
    "externalIpCreated": false,
    "networkChanged": false,
    "serviceAccountCreated": false,
    "serviceAccountKeyCreated": false,
    "firewallRuleCreated": false,
    "bucketCreated": false,
    "artifactRegistryImageCreated": false,
    "cloudRunJobCreated": false,
    "quotaRequestCreated": false,
    "reservationCreated": false,
    "iapTransferExecuted": false,
    "sshSessionOpened": false,
    "dependencyInstalledOnVm": false,
    "runtimeImportRunOnL4": false,
    "cudaVisibilityCheckedOnL4": false,
    "vllmImportedOnL4": false,
    "sglangImportedOnL4": false,
    "apiServerStarted": false,
    "modelImportRun": false,
    "modelInferenceRun": false,
    "generatedVideoCreated": false,
    "generatedAssetsCreated": false,
    "providerCallsMade": false,
    "workersDispatched": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "publicArtifactsCreated": false,
    "signedUrlsCreated": false,
    "creditMutationCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false
  },
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_9-CAPACITY-ASSURANCE-PLAN: plan Qwen L4 reservation or scheduled retry after repeated stockout, no VM/no inference"
}
```
