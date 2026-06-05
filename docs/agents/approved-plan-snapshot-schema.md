# Approved Plan Snapshot Schema

Workers may execute only approved plan snapshots. Raw chat is never a worker instruction.

Required fields:

- `planId`
- `planVersion`
- `createdAt`
- `sourceRequestId`
- `approvedByPolicy`
- `rawPromptExecution=false`
- `inputArtifactScope`
- `outputArtifactScope`
- `selectedToolRoutes`
- `selectedIntents`
- `rejectedIntents`
- `safetyFlags`
- `budgetLimits`
- `privacyLimits`
- `runtimeLimits`
- `allowedBuckets`
- `allowedPrefixes`
- `publicArtifactAllowed=false`
- `providerCallsAllowed`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `broadMediaAllowed=false`
- `qaRequirements`
- `rollbackPolicy`

Workers must reject unknown scope, tool, action, bucket, or prefix. Signed URLs are not source of truth. Public artifacts remain blocked unless a later phase explicitly approves them.

Phase 52D candidate snapshots are not approved for runtime. They preserve `approvedByPolicy=false`, `workerExecutionAllowed=false`, and `approvedForRuntime=false` until a later approved-plan snapshot validation/system reconciliation phase explicitly promotes them.
