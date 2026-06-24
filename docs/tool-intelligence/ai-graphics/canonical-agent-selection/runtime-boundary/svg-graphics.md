# SVG graphics Runtime Boundary

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_review_passed_with_warnings`

## Capability
- capabilityId: `svg_graphics`
- runtimeBoundaryBucket: `planning_metadata_allowed_now`
- additionalRuntimeBoundaryBuckets: `cpu_static_execution_previously_validated_but_not_agent_executable_now`, `tool_route_handoff_later`, `worker_handoff_later`, `public_artifact_and_signed_url_later`
- candidateTools: `svgdotjs_svg_js`, `satori`, `d3`
- nextProofMilestone: CPU/static proof may be referenced; SVG/string/artifact generation remains blocked.

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
