# AI Graphics Runtime Boundary Handoff Schema

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_handoff_review_passed_with_warnings`

## Handoff Schema

- `handoffId`
- `sourceBoundaryDecision`
- `sourceBoundaryPr`
- `agentSelectionConsumer`
- `requestedCapability`
- `candidateTools`
- `rankedTools`
- `eliminatedTools`
- `runtimeBoundaryByTool`
- `runtimeBoundaryByCapability`
- `proofStatusByTool`
- `missingProofByTool`
- `preferredPlanningTools`
- `fallbackPlanningTools`
- `executionAllowedNow`
- `routeExecutionAllowedNow`
- `workerExecutionAllowedNow`
- `toolExecutionAllowedNow`
- `browserWebglCanvasAllowedNow`
- `gpuModelRuntimeAllowedNow`
- `providerRuntimeAllowedNow`
- `publicArtifactAllowedNow`
- `signedUrlAllowedNow`
- `runtimeReadyNow`
- `internalBetaReadyNow`
- `productionReadyNow`
- `nextProofMilestone`

## Safety Boundary

- Agent selection may consume runtime-boundary metadata only for planning/study metadata.
- CPU/static validated tools remain not agent-executable.
- Browser chart runtime remains future-only.
- Animation runtime remains future-only.
- Browser/canvas/WebGL runtime remains future-only.
- Model CPU/GPU runtime remains future-only.
- Tool Route handoff remains future-only.
- Worker handoff remains future-only.
- Public artifacts and signed URLs remain future-only.
- Track B remains under TRACK_B_MEDIA_OSS_STEWARD as evidence-only exclusion context.
- Track A render/export exclusion via PR #544 remains evidence-only context.
- Internal owner labels are not product-facing capability names.
- No E2E proof, runtime readiness, internal beta, external beta, or production readiness is approved.
