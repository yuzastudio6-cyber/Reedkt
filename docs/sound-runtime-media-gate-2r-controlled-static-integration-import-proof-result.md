# SOUND Runtime Media Gate 2R Controlled Static Integration Import Proof Result

```json sound-runtime-media-gate-2r-controlled-static-integration-import-proof-result
{
  "decision": "sound_runtime_media_gate_2r_controlled_static_integration_import_proof_passed_with_warnings_ready_for_import_proof_owner_review",
  "sourceVerification": {
    "baseSourceHead": "938e808aaf9d4fdab475ec5be0ef671f46ad1b86",
    "pr846": {
      "status": "merged",
      "mergeCommit": "938e808aaf9d4fdab475ec5be0ef671f46ad1b86",
      "decision": "worker_runtime_jobs_sound_cpu_route_readiness_evaluator_static_integration_source_owner_review_passed_with_warnings_ready_for_controlled_static_import_proof"
    }
  },
  "proofResult": {
    "staticIntegrationSourcePath": "server/workers/sound-cpu/route-readiness-evaluator-static-integration.mjs",
    "evaluatorSourcePath": "server/workers/sound-cpu/route-readiness-evaluator.mjs",
    "sourceFixAppliedInThisPacket": true,
    "moduleImported": true,
    "staticEvaluationFunctionCalled": true,
    "fixtureCount": 9,
    "acceptedFixtureCount": 4,
    "rejectedPayloadFieldCount": 14,
    "mismatchCaseCount": 5,
    "matchesExpectedStaticShape": true,
    "readinessClaim": false,
    "runtimeFlagsAllFalse": true,
    "closedClaimsAllFalse": true,
    "routeResolverImported": false,
    "serverRouteExecuted": false,
    "workerDispatchRun": false,
    "workerExecutionRun": false,
    "toolExecutionRun": false,
    "mediaProcessingRun": false,
    "dockerOrGcpRun": false,
    "supabaseOrSqlRun": false,
    "artifactCreated": false
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-ROUTE-READINESS-EVALUATOR-CONTROLLED-IMPORT-PROOF-OWNER-REVIEW: review controlled static integration import proof, no route execution"
}
```
