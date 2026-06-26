# SOUND Runtime Media Gate 2Z Server Route Proof Output Register

```json sound-runtime-media-gate-2z-server-route-proof-output-register
{
  "decision": "sound_runtime_media_gate_2z_typescript_runtime_loading_fix_passed_with_warnings_ready_for_server_route_execution_proof_owner_review",
  "sanitizedOutput": {
    "nodeVersion": "v26.3.0",
    "proofCommand": "node --experimental-strip-types --input-type=module",
    "modulePath": "./server/workers/sound-cpu/index.ts",
    "proofStatus": "passed",
    "imported": true,
    "exportNames": [
      "SOUND_CPU_SYNTHETIC_IMAGES",
      "SOUND_CPU_SYNTHETIC_JOB_TYPES",
      "SOUND_CPU_SYNTHETIC_REJECTED_PAYLOAD_FIELDS",
      "SOUND_CPU_SYNTHETIC_ROUTE_CONTRACTS",
      "SOUND_CPU_SYNTHETIC_STATIC_RUNTIME_FLAGS",
      "SOUND_CPU_SYNTHETIC_WORKERS",
      "assertSoundCpuSyntheticRouteAccepted",
      "contractForJobType",
      "resolveSoundCpuSyntheticRoute"
    ],
    "exportCount": 9,
    "secretsRedacted": true,
    "environmentVariablesCaptured": false,
    "fileArtifactsCreated": false
  },
  "observedProofState": {
    "routeSourceImportAttempted": true,
    "routeSourceImportCompleted": true,
    "resolverInvoked": true,
    "assertionInvoked": true,
    "acceptedCaseCount": 4,
    "rejectedCaseCount": 5,
    "acceptedJobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "rejectedReasons": [
      "rejected_payload_field",
      "worker_mismatch",
      "image_mismatch",
      "fixture_mismatch",
      "unsafe_runtime_flag"
    ],
    "workerDispatchRun": false,
    "workerExecutionRun": false,
    "toolExecutionRun": false,
    "mediaProcessingRun": false,
    "supabaseSqlRun": false,
    "routeReadinessClaimed": false
  }
}
```
