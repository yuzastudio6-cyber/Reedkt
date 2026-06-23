# Canonical Routing Schema Canonicalization Owner Approval

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_owner_approved_with_warnings`.

Owner-approved schema sections:

- `requestCapabilityExtraction`: requestedCapability, inputMediaType, desiredOutputType, visualIntent, timeSensitivity, qualityPreference, executionAllowed, artifactPolicy, runtimeConstraints
- `candidateToolRanking`: candidateToolId, capabilityFitScore, proofLevelScore, runtimeReadinessScore, costClass, latencyClass, cloudTarget, fallbackRank, selectionReason, blockedReason
- `eliminationResult`: toolId, eliminated, eliminationReason, requiredMissingApproval, saferAlternative
- `planningOnlyRecommendation`: recommendedToolIds, fallbackToolIds, blockedToolIds, planningSummary, executionAllowedNow, nextProofRequired
- `safetyBoundary`: toolExecutionAllowed, workerExecutionAllowed, routeExecutionAllowed, browserWebglCanvasAllowed, gpuRuntimeAllowed, modelWeightsAllowed, publicArtifactAllowed, signedUrlAllowed, betaOrProductionAllowed
