# SOUND Runtime Media Gate 2N Evaluator Source Content Plan

```json sound-runtime-media-gate-2n-evaluator-source-content-plan
{
  "decision": "sound_runtime_media_gate_2n_route_readiness_evaluator_source_creation_plan_completed_with_warnings_ready_for_source_plan_owner_review",
  "plannedSourceShape": {
    "moduleType": "node_builtins_only_static_evaluator",
    "futureExports": [
      "evaluateSoundCpuRouteReadinessFixtures",
      "summarizeSoundCpuRouteReadiness"
    ],
    "inputRecords": [
      "routeId",
      "routeCategory",
      "workerName",
      "imageName",
      "jobType",
      "requiredPayloadFields",
      "rejectedPayloadFields",
      "fixtureCaseId"
    ],
    "outputRecords": [
      "routeContractCount",
      "acceptedFixtureCount",
      "rejectedPayloadFieldCount",
      "mismatchCaseCount",
      "readinessClaim"
    ],
    "routeContractCount": 4,
    "acceptedFixtureCount": 4,
    "rejectedPayloadFieldCount": 14,
    "mismatchCaseCount": 5
  },
  "prohibitedSourceShape": {
    "routeResolverImports": true,
    "serverRouteImports": true,
    "workerDispatchImports": true,
    "toolExecutionImports": true,
    "mediaFileOpen": true,
    "ffmpegOrFfprobe": true,
    "dockerOrGcpCalls": true,
    "supabaseOrSqlCalls": true,
    "artifactWrites": true,
    "signedOrPublicUrls": true,
    "providerOrModelCalls": true,
    "readinessUnlocks": true
  }
}
```
