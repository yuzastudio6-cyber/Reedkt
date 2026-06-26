# Qwen2.5-VL 7B L4 Reservation Create Change Log

Decision: `qwen2_5_vl_7b_l4_reservation_create_blocked_by_us_east1_b_gpu_availability_no_vm_no_inference`

This change records the bounded reservation-create attempt for Qwen2.5-VL in `us-east1-b`. Google Cloud rejected the reservation create before a reservation existed because the requested GPU shape was unavailable in the zone.

## Files Added

- `docs/qwen2-5-vl-7b-l4-reservation-create-result.md`
- `docs/qwen2-5-vl-7b-l4-reservation-create-change-log.md`
- `docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-capacity-followup.md`
- `scripts/validation/qwen2-5-vl-7b-l4-reservation-create-diagnostics.mjs`

## Files Updated

- `package.json`

## Result

```json qwen2-5-vl-7b-l4-reservation-create-change-log
{
  "phase": "QWEN2_5_VL_STACK_TOOL_9-RESERVATION-CREATE",
  "decision": "qwen2_5_vl_7b_l4_reservation_create_blocked_by_us_east1_b_gpu_availability_no_vm_no_inference",
  "sourceBranch": "codex/qwen2-5-vl-7b-l4-reservation-approval",
  "filesAdded": [
    "docs/qwen2-5-vl-7b-l4-reservation-create-result.md",
    "docs/qwen2-5-vl-7b-l4-reservation-create-change-log.md",
    "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-capacity-followup.md",
    "scripts/validation/qwen2-5-vl-7b-l4-reservation-create-diagnostics.mjs"
  ],
  "filesUpdated": [
    "package.json"
  ],
  "preflight": {
    "projectId": "reeditpro",
    "targetZone": "us-east1-b",
    "targetRegion": "us-east1",
    "reservationName": "reeditpro-qwen2-5-vl-l4-proof-reservation",
    "reservationPresentBeforeCreate": false,
    "proofInstancePresentBeforeCreate": false,
    "proofDiskPresentBeforeCreate": false,
    "proofAddressPresentBeforeCreate": false,
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
    "iapFirewallTargetTag": "ai-video-broll-wan-l4-proof"
  },
  "reservationCreateAttempt": {
    "reservationCreateCommandAttempted": true,
    "attemptedReservationName": "reeditpro-qwen2-5-vl-l4-proof-reservation",
    "attemptedZone": "us-east1-b",
    "attemptedVmCount": 1,
    "attemptedMachineType": "g2-standard-8",
    "attemptedAccelerator": "nvidia-l4",
    "attemptedAcceleratorCount": 1,
    "attemptedSpecificReservationRequired": true,
    "attemptedReservationSharingPolicy": "DISALLOW_ALL",
    "blockedByQuota": false,
    "blockedByReservationGpuAvailability": true,
    "gcpErrorSanitized": true
  },
  "postAttemptResourceState": {
    "reservationPresent": false,
    "proofInstancePresent": false,
    "proofDiskPresent": false,
    "proofAddressPresent": false,
    "regionalL4GpuQuotaUsageAfterAttempt": 0,
    "globalGpusAllRegionsQuotaUsageAfterAttempt": 0,
    "cleanupRequired": false,
    "cleanupVerified": true
  },
  "runtimeFlags": {
    "gcpReadOnlyCommandsExecuted": true,
    "gcpMutatingCommandsExecuted": true,
    "reservationCreateCommandAttempted": true,
    "blockedByReservationGpuAvailability": true,
    "blockedByQuota": false,
    "reservationCreated": false,
    "reservationDeleted": false,
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
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_9-RESERVATION-CAPACITY-FOLLOWUP: compare alternate L4 reservation targets after us-east1-b reservation stockout, no VM/no inference"
}
```
