# Canonical Agent Routing Schema QA

## requestCapabilityExtraction

QA status: accepted with warnings.

- `requestedCapability`
- `inputMediaType`
- `desiredOutputType`
- `visualIntent`
- `timeSensitivity`
- `qualityPreference`
- `executionAllowed`
- `artifactPolicy`
- `runtimeConstraints`

## candidateToolRanking

QA status: accepted with warnings.

- `candidateToolId`
- `capabilityFitScore`
- `proofLevelScore`
- `runtimeReadinessScore`
- `costClass`
- `latencyClass`
- `cloudTarget`
- `fallbackRank`
- `selectionReason`
- `blockedReason`

## eliminationResult

QA status: accepted with warnings.

- `toolId`
- `eliminated`
- `eliminationReason`
- `requiredMissingApproval`
- `saferAlternative`

## planningOnlyRecommendation

QA status: accepted with warnings.

- `recommendedToolIds`
- `fallbackToolIds`
- `blockedToolIds`
- `planningSummary`
- `executionAllowedNow`
- `nextProofRequired`

## safetyBoundary

QA status: accepted with warnings.

- `toolExecutionAllowed`
- `workerExecutionAllowed`
- `routeExecutionAllowed`
- `browserWebglCanvasAllowed`
- `gpuRuntimeAllowed`
- `modelWeightsAllowed`
- `publicArtifactAllowed`
- `signedUrlAllowed`
- `betaOrProductionAllowed`
