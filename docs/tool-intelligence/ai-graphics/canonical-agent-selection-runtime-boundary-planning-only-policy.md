# Planning-Only Policy

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_review_passed_with_warnings`

Agent may select, rank, eliminate, fallback, and explain missing proof for planning/study metadata only. It may not execute tools or create artifacts.

## Boundary Booleans
- agentCanSelectForPlanning=true
- agentCanExecuteToolsNow=false
- routeExecutionApprovedNow=false
- workerExecutionApprovedNow=false
- toolExecutionApprovedNow=false
- browserWebglCanvasRuntimeApprovedNow=false
- gpuRuntimeApprovedNow=false
- providerRuntimeApprovedNow=false
- publicArtifactApprovedNow=false
- signedUrlApprovedNow=false
- runtimeReadyNow=false
- internalBetaReadyNow=false
- productionReadyNow=false
