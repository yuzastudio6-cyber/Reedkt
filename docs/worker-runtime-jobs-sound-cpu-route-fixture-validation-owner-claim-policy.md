# WORKER_RUNTIME_JOBS SOUND CPU Route Fixture Validation Owner Claim Policy

```json worker-runtime-jobs-sound-cpu-route-fixture-validation-owner-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_route_fixture_validation_owner_review_passed_with_warnings_ready_for_route_readiness_planning",
  "allowedClaims": {
    "gate2jValidationAcceptedForRouteReadinessPlanning": true,
    "futureGate2kRouteReadinessPlanMayProceed": true,
    "fixtureCount": 4,
    "acceptedFixtureCount": 4,
    "rejectedPayloadFieldCount": 14,
    "mismatchCaseCount": 5,
    "routeExecutionRunInOwnerReview": false,
    "workerExecutionRunInOwnerReview": false
  },
  "runtimeFlags": {
    "fixtureValidationRerun": false,
    "routeResolverImported": false,
    "routeExecutionRun": false,
    "serverRouteExecuted": false,
    "workerDispatchRun": false,
    "workerExecutionRun": false,
    "toolExecutionRun": false,
    "mediaFileOpenRun": false,
    "mediaProcessingRun": false,
    "dockerBuildRun": false,
    "dockerRun": false,
    "dockerPush": false,
    "gcpTouched": false,
    "cloudRunTouched": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "artifactCreated": false,
    "signedUrlCreated": false,
    "publicArtifactCreated": false,
    "generatedLocalFixturePassedClaimed": false,
    "dryRunPassedClaimed": false,
    "routeReadinessClaimed": false,
    "workerReadinessClaimed": false,
    "runtimeReadinessClaimed": false,
    "mediaReadinessClaimed": false,
    "betaReadinessClaimed": false,
    "productionReadinessClaimed": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```
