# WORKER_RUNTIME_JOBS SOUND CPU Phase 40 Caption Render Runtime Hook Blocked-State Index Export Source Claim Policy

```json worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase40_caption_render_runtime_hook_blocked_state_index_export_source_gate_completed_with_warnings_ready_for_static_import_proof_no_media_no_artifacts",
  "allowedClaims": {
    "phase40IndexExportSourceGateCompleted": true,
    "failClosedIndexExportsAdded": true,
    "staticImportProofMayProceed": true,
    "dispatchWiringChangedToday": false,
    "hookExecutionApprovedToday": false
  },
  "forbiddenClaims": {
    "generated_local_fixture_passed": false,
    "dry_run_passed": false,
    "runtimeReadiness": false,
    "workerReadiness": false,
    "mediaReadiness": false,
    "artifactReadiness": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false
  },
  "executionClaims": {
    "dockerBuild": false,
    "dockerRun": false,
    "dockerPush": false,
    "gcpCloudRun": false,
    "workerDispatch": false,
    "routeExecution": false,
    "toolExecution": false,
    "providerModelCall": false,
    "mediaProcessing": false,
    "artifactCreation": false,
    "supabaseSql": false
  }
}
```

The packet may claim the fail-closed index export only. It may not claim import proof, execution, media, artifacts, beta, or production.
