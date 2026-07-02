# WORKER_RUNTIME_JOBS SOUND CPU Phase 145 Dispatch Contract Source Plan

```json worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase145-dispatch-contract-source-plan",
  "futureSourcePath": "server/workers/sound-cpu/dispatch-contract.ts",
  "futureRouteIntegrationPath": "server/routes/sound-cpu-worker.ts",
  "sourceCreationAllowedInThisGate": false,
  "plannedExports": [
    "SOUND_CPU_DISPATCH_CONTRACT_VERSION",
    "SOUND_CPU_DISPATCH_ALLOWED_WORKERS",
    "SOUND_CPU_DISPATCH_ALLOWED_IMAGES",
    "SOUND_CPU_DISPATCH_ALLOWED_JOB_TYPES",
    "validateSoundCpuDispatchContractPayload",
    "buildDisabledSoundCpuDispatchEnvelope"
  ],
  "plannedBehavior": {
    "validateApprovedSnapshotReference": true,
    "validateWorkspaceProjectJobIds": true,
    "validateIdempotencyKey": true,
    "validateWorkerName": true,
    "validateImageName": true,
    "validateJobType": true,
    "validatePrivateManifestReference": true,
    "failClosedWithoutDispatch": true,
    "performWorkerDispatch": false,
    "mutateSupabaseJobRows": false,
    "writeArtifacts": false
  }
}
```

The future adapter should normalize a route-safe dispatch envelope and fail closed until worker and Supabase gates explicitly unlock execution.
