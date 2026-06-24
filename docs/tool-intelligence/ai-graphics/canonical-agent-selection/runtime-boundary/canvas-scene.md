# Canvas scene Runtime Boundary

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_review_passed_with_warnings`

## Capability
- capabilityId: `canvas_scene`
- runtimeBoundaryBucket: `browser_canvas_webgl_runtime_later`
- additionalRuntimeBoundaryBuckets: `planning_metadata_allowed_now`, `tool_route_handoff_later`, `worker_handoff_later`, `public_artifact_and_signed_url_later`
- candidateTools: `pixi_js`, `konva`
- nextProofMilestone: Browser/canvas sandbox approval is required before execution.

## Required Boundary Fields
- planningSelectionAllowedNow: true
- agentExecutionAllowedNow: false
- toolExecutionAllowedNow: false
- routeExecutionAllowedNow: false
- workerExecutionAllowedNow: false
- browserWebglCanvasAllowedNow: false
- gpuModelRuntimeAllowedNow: false
- providerRuntimeAllowedNow: false
- publicArtifactAllowedNow: false
- signedUrlAllowedNow: false
- runtimeReadyNow: false
- internalBetaReadyNow: false
- productionReadyNow: false

This capability remains product-facing and capability-named. Track B and Track A labels are preserved only as evidence/exclusion context.
