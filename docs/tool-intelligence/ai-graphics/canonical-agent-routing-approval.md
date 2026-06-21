# AI Graphics Canonical Agent Routing Approval

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_approved_with_warnings`.

This packet approves the PR #634 owner-approval QA evidence as the canonical agent-facing planning-time routing layer for the 21 AI graphics tools. The agent may select tools for planning/study metadata only; all execution and runtime paths remain blocked.

Source evidence: PR #361, PR #376, PR #425, PR #433, PR #441, PR #542, PR #543, PR #544, PR #589, PR #604, PR #607, PR #614, PR #616, PR #617, PR #621, PR #623, PR #627, PR #628, PR #632, PR #634.

Required capabilities covered:

- `chart_overlay`
- `data_visualization`
- `svg_graphics`
- `diagram_graphics`
- `animation_overlay`
- `canvas_scene`
- `webgl_3d_scene`
- `background_removal`
- `subject_segmentation`
- `upscaling`
- `tensor_image_ops`
- `model_runtime_foundation`
- `planning_metadata_only`
- `blocked_or_deferred`

Routing approval status:

- `canonicalAgentRoutingApprovalCompleted`: true
- `sourceCapabilityStudyOwnerApprovalQaAccepted`: true
- `all21ToolsCoveredByRouting`: true
- `allRequiredCapabilitiesCovered`: true
- `canonicalRoutingSchemaCreated`: true
- `capabilityMapCreated`: true
- `rankingPolicyCreated`: true
- `eliminationPolicyCreated`: true
- `fallbackPolicyCreated`: true
- `planningOnlyPolicyCreated`: true
- `safetyBoundaryCreated`: true
- `routingExamplesCreated`: true
- `agentCanSelectForPlanning`: true
- `agentCanExecuteToolsNow`: false
- `routeExecutionApprovedNow`: false
- `workerExecutionApprovedNow`: false
- `toolExecutionApprovedNow`: false
- `browserWebglCanvasRuntimeApprovedNow`: false
- `gpuRuntimeApprovedNow`: false
- `providerRuntimeApprovedNow`: false
- `publicArtifactApprovedNow`: false
- `signedUrlApprovedNow`: false
- `runtimeReadyNow`: false
- `internalBetaReadyNow`: false
- `externalBetaReadyNow`: false
- `productionReadyNow`: false
- `dependencyInstallPerformed`: false
- `packageLockMutationPerformed`: false
- `toolExecutionPerformed`: false
- `workerExecutionPerformed`: false
- `routeExecutionPerformed`: false
- `providerRuntimePerformed`: false
- `browserWebglCanvasRuntimePerformed`: false
- `gpuRuntimePerformed`: false
- `supabaseMutationPerformed`: false
- `gcsUploadPerformed`: false
- `publicArtifactCreated`: false
- `signedUrlCreated`: false

No tool execution, worker execution, route execution, provider/model runtime, dependency install, npm ci, package-lock mutation, CPU/static validation rerun, import smoke, synthetic fixture, browser/WebGL/canvas runtime, GPU runtime, model download, media/Remotion/resvg processing, Supabase mutation, SQL execution, GCS upload, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, PR merge, PR close, or PR retarget was performed.
