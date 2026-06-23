# WORKER_RUNTIME_JOBS SOUND CPU Static Job Contract Register

The register records the only SOUND CPU jobs accepted for static contract planning. All entries remain blocked for current worker execution.

```json worker-runtime-jobs-sound-cpu-static-job-contract-register
{
  "milestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-STATIC-CONTRACT-PLAN",
  "decision": "worker_runtime_jobs_sound_cpu_static_contract_plan_completed_with_warnings_ready_for_contract_owner_review",
  "contractRows": [
    {
      "jobType": "sound.package_import_smoke",
      "workerName": "sound-cpu-analysis-worker",
      "imageName": "reeditpro/sound-cpu-analysis-worker",
      "payloadSchemaCategory": "package_manifest_metadata",
      "resultSchemaCategory": "import_availability_summary",
      "allowedInputScope": "pinned package names and metadata only",
      "mediaAccessAllowed": false,
      "artifactWriteAllowed": false,
      "supabaseWriteAllowed": false,
      "acceptedForFutureStaticPlanning": true,
      "acceptedForExecutionToday": false
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "workerName": "sound-cpu-analysis-worker",
      "imageName": "reeditpro/sound-cpu-analysis-worker",
      "payloadSchemaCategory": "synthetic_in_memory_numeric_arrays",
      "resultSchemaCategory": "synthetic_analysis_metrics",
      "allowedInputScope": "small deterministic numeric arrays only",
      "mediaAccessAllowed": false,
      "artifactWriteAllowed": false,
      "supabaseWriteAllowed": false,
      "acceptedForFutureStaticPlanning": true,
      "acceptedForExecutionToday": false
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "workerName": "sound-audio-metadata-worker",
      "imageName": "reeditpro/sound-audio-metadata-worker",
      "payloadSchemaCategory": "synthetic_symbolic_midi_like_data",
      "resultSchemaCategory": "symbolic_metadata_summary",
      "allowedInputScope": "synthetic symbolic event arrays only",
      "mediaAccessAllowed": false,
      "artifactWriteAllowed": false,
      "supabaseWriteAllowed": false,
      "acceptedForFutureStaticPlanning": true,
      "acceptedForExecutionToday": false
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "workerName": "sound-audio-metadata-worker",
      "imageName": "reeditpro/sound-audio-metadata-worker",
      "payloadSchemaCategory": "synthetic_in_memory_loudness_samples",
      "resultSchemaCategory": "loudness_metadata_summary",
      "allowedInputScope": "synthetic in-memory sample arrays only",
      "mediaAccessAllowed": false,
      "artifactWriteAllowed": false,
      "supabaseWriteAllowed": false,
      "acceptedForFutureStaticPlanning": true,
      "acceptedForExecutionToday": false
    }
  ],
  "runtimeFlags": {
    "workerExecutionRun": false,
    "routeExecutionRun": false,
    "toolExecutionRun": false,
    "dockerBuildRun": false,
    "gcpTouched": false,
    "mediaProcessingRun": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "modelWeightsDownloaded": false,
    "artifactCreated": false,
    "runtimeReadinessClaimed": false,
    "workerReadinessClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "dryRunPassedClaimed": false
  }
}
```
