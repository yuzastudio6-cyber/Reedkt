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
