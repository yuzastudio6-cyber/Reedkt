# Qwen2.5-VL 7B L4 Reservation Create US West4 A Change Log

Decision: `qwen2_5_vl_7b_l4_reservation_create_us_west4_a_blocked_by_gpu_availability_no_vm_no_inference`

This change records the bounded reservation-create attempt for Qwen2.5-VL in `us-west4-a`. Google Cloud rejected the reservation create before a reservation existed because the requested GPU shape was unavailable in the zone.

## Files Added

- `docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-a-result.md`
- `docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-a-change-log.md`
- `docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create-us-west4-c.md`
- `scripts/validation/qwen2-5-vl-7b-l4-reservation-create-us-west4-a-diagnostics.mjs`

## Files Updated

- `package.json`

## Result

```json qwen2-5-vl-7b-l4-reservation-create-us-west4-a-change-log
{
  "phase": "QWEN2_5_VL_STACK_TOOL_9-RESERVATION-CREATE-US-WEST4-A",
  "decision": "qwen2_5_vl_7b_l4_reservation_create_us_west4_a_blocked_by_gpu_availability_no_vm_no_inference",
  "sourceBranch": "codex/qwen2-5-vl-7b-l4-reservation-capacity-followup",
  "filesAdded": [
    "docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-a-result.md",
    "docs/qwen2-5-vl-7b-l4-reservation-create-us-west4-a-change-log.md",
    "docs/implementation-prompts/prompt-qwen2-5-vl-7b-l4-reservation-create-us-west4-c.md",
    "scripts/validation/qwen2-5-vl-7b-l4-reservation-create-us-west4-a-diagnostics.mjs"
  ],
  "filesUpdated": [
    "package.json"
  ],
  "preflight": {
    "projectId": "reeditpro",
    "targetZone": "us-west4-a",
    "targetRegion": "us-west4",
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
    "proofServiceAccountPresent": true,
    "proofServiceAccountRoles": [
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter"
    ],
    "iapFirewallRulePresent": true,
    "iapFirewallTargetTag": "ai-video-broll-wan-l4-proof"
  },
  "reservationCreateAttempt": {
    "reservationCreateCommandAttempted": true,
    "attemptedReservationName": "reeditpro-qwen2-5-vl-l4-proof-reservation",
    "attemptedZone": "us-west4-a",
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
  "fallbackTarget": {
    "selectedZone": "us-west4-c",
    "machineTypeAvailable": true,
    "acceleratorAvailable": true,
    "reservationPresent": false,
    "proofInstancePresent": false
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
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_9-RESERVATION-CREATE-US-WEST4-C: create bounded L4 reservation for Qwen proof in us-west4-c, no VM/no inference"
}
```
