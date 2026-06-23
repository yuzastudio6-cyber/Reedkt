# WORKER_RUNTIME_JOBS SOUND CPU Static Payload Result Schema Plan

This schema plan defines categories and required references only. It does not create TypeScript types, database schemas, queues, workers, or runtime validators.

```json worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan
{
  "milestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-STATIC-CONTRACT-PLAN",
  "decision": "worker_runtime_jobs_sound_cpu_static_contract_plan_completed_with_warnings_ready_for_contract_owner_review",
  "sharedPayloadRequirements": {
    "requiredIds": [
      "approvedPlanSnapshotId",
      "workspaceId",
      "projectId",
      "jobId",
      "idempotencyKey"
    ],
    "requiredRuntimeLabels": [
      "workerName",
      "imageName",
      "jobType"
    ],
    "requiredAttemptMetadata": [
      "attempt",
      "maxAttempts"
    ],
    "requiredStaticFlags": [
      "executionAllowedNow:false",
      "mediaAccessAllowed:false",
      "artifactWriteAllowed:false",
      "supabaseWriteAllowed:false",
      "runtimeReadinessClaimed:false"
    ]
  },
  "jobSchemaCategories": [
    {
      "jobType": "sound.package_import_smoke",
      "payloadCategory": "package_manifest_metadata",
      "payloadAllowedFields": [
        "packageNames",
        "expectedVersionPins",
        "importModuleNames"
      ],
      "resultCategory": "import_availability_summary",
      "resultAllowedFields": [
        "metadataCheckedCount",
        "importCheckedCount",
        "failedImportNames",
        "warnings"
      ]
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "payloadCategory": "synthetic_in_memory_numeric_arrays",
      "payloadAllowedFields": [
        "arrayShape",
        "sampleRateLabel",
        "fixtureSeed",
        "operationNames"
      ],
      "resultCategory": "synthetic_analysis_metrics",
      "resultAllowedFields": [
        "metricNames",
        "metricSummary",
        "warnings"
      ]
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "payloadCategory": "synthetic_symbolic_midi_like_data",
      "payloadAllowedFields": [
        "eventCount",
        "trackCount",
        "tempoLabels",
        "instrumentLabels"
      ],
      "resultCategory": "symbolic_metadata_summary",
      "resultAllowedFields": [
        "eventSummary",
        "tempoSummary",
        "instrumentSummary",
        "warnings"
      ]
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "payloadCategory": "synthetic_in_memory_loudness_samples",
      "payloadAllowedFields": [
        "sampleCount",
        "sampleRateLabel",
        "loudnessFixtureLabel",
        "operationNames"
      ],
      "resultCategory": "loudness_metadata_summary",
      "resultAllowedFields": [
        "integratedLoudnessSummary",
        "peakSummary",
        "warnings"
      ]
    }
  ],
  "rejectedPayloadFields": [
    "prompt",
    "rawPrompt",
    "providerPrompt",
    "signedUrl",
    "publicUrl",
    "mediaPath",
    "localFilePath",
    "gcsObjectPath",
    "serviceRoleKey",
    "databaseUrl",
    "modelWeightPath",
    "artifactWriteTarget"
  ],
  "schemaImplementationAdded": false
}
```
