# Model runtime foundation Runtime Boundary

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_review_passed_with_warnings`

## Capability
- capabilityId: `model_runtime_foundation`
- runtimeBoundaryBucket: `model_cpu_gpu_runtime_later`
- additionalRuntimeBoundaryBuckets: `planning_metadata_allowed_now`, `tool_route_handoff_later`, `worker_handoff_later`, `public_artifact_and_signed_url_later`
- candidateTools: `torch_torchvision`, `transformers`
- nextProofMilestone: Foundation model runtime remains blocked pending model/provenance/runtime proof.

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
