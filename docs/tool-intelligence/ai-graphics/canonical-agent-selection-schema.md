# Canonical Agent Selection Schema

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Required schema fields: `requestId`, `requestedCapability`, `inputIntent`, `inputMediaType`, `desiredOutputType`, `visualIntent`, `candidateTools`, `rankedTools`, `eliminatedTools`, `preferredPlanningTools`, `fallbackPlanningTools`, `requiredProofBeforeExecution`, `executionAllowedNow`, `routeExecutionAllowedNow`, `workerExecutionAllowedNow`, `browserWebglCanvasAllowedNow`, `gpuModelRuntimeAllowedNow`, `publicArtifactAllowedNow`, `signedUrlAllowedNow`, `runtimeReadyNow`, `internalBetaReadyNow`, `productionReadyNow`.

Required sections: capability extraction, ranking, elimination, fallback, planning-only recommendation, and safety boundary.
