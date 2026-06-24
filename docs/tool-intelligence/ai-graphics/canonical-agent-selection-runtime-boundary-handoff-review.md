# AI Graphics Canonical Agent Selection Runtime Boundary Handoff Review

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_handoff_review_passed_with_warnings`

- Branch: `codex/rp-ai-graphics-canonical-agent-selection-runtime-boundary-handoff-review`
- Base: `codex/rp-ai-graphics-canonical-agent-selection-runtime-boundary-canonicalization-owner-approval-qa-review`
- Draft PR: pending creation
- Draft status: pending creation
- Check status: pending creation
- Duplicate search result: Preflight found no exact runtime-boundary handoff review PR, remote branch, or worktree.

## Handoff Result

This review connects PR #715 runtime-boundary canonicalization owner-approval QA to canonical agent selection. Canonical agent selection may consume runtime-boundary metadata to plan, rank, eliminate, explain missing proof, and recommend preferred/fallback planning tools only.

- PR #715: open/draft/CLEAN at `9ff65730f9a88041e9f0d2f1b8f273711bef1a1e`; runtime-boundary canonicalization owner-approval QA accepted with warnings.
- PR #714: source owner approval accepted with warnings.
- PR #710: source owner review accepted with warnings.
- PR #709: source canonicalization QA accepted with warnings.
- PR #705: source canonicalization review accepted with warnings.
- PR #704/#700/#699/#696/#694: runtime-boundary owner-approval QA, owner approval, owner review, QA, and review evidence accepted with warnings.
- PR #692/#689/#688/#686/#685/#683/#681/#677/#674/#671: canonical agent-selection chain cited as compatible source context.
- PR #668/#665/#661/#657/#656/#651/#646/#645/#642/#638: canonical agent-routing chain cited as compatible source context.
- PR #623: product/agent-facing capability study and ranking matrix source cited.
- PR #621: CPU/static validation owner-review evidence for `d3`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, and `viz_js` cited.
- PR #425/#433/#441: package-proof merge evidence cited with merge SHAs `a055ef045db2a6ce127a044bee6219d5933532c3`, `dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0`, and `d174de59471eacf05bed5a5511d661f2e5ba9f0f`.
- PR #376/#361: historical AI graphics study/routing evidence cited.
- PR #542/#544: Track B and Track A exclusions cited as evidence-only context.

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

## Handoff Contract

Allowed behavior:

- agent may read runtime-boundary metadata
- agent may select tools for planning/study only
- agent may rank tools
- agent may eliminate tools
- agent may explain missing proof
- agent may recommend preferred and fallback tools for planning
- agent may return next proof milestones
- agent may expose why execution is blocked

Blocked behavior:

- no tool execution
- no Tool Route execution
- no Worker execution
- no provider/model execution
- no browser/WebGL/canvas runtime
- no GPU/model runtime
- no model-weight download
- no media processing
- no Supabase mutation
- no SQL
- no GCS upload
- no signed URL
- no public artifact
- no beta unlock
- no production unlock

- Tool Route placeholder: future-only; routeExecutionApprovedNow remains false.
- Worker placeholder: future-only; workerExecutionApprovedNow remains false.
- Runtime proof placeholder: future-only; browser/WebGL/canvas and GPU/model runtime remain false.

## Tools

- `torch_torchvision`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `transformers`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `sam2`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `birefnet`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `real_esrgan`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `kornia`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `rembg`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `transparent_background`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `d3`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `echarts`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `vega_lite`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `vega`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `satori`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `svgdotjs_svg_js`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `viz_js`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `lottie_web`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `animejs`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `three_js`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `pixi_js`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `konva`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.
- `babylonjs`: handoff reviewed; planning/study metadata allowed; execution/runtime/storage/public/beta/production gates false.

## Capabilities

- `chart_overlay`: handoff reviewed for canonical agent selection planning/study metadata only.
- `data_visualization`: handoff reviewed for canonical agent selection planning/study metadata only.
- `svg_graphics`: handoff reviewed for canonical agent selection planning/study metadata only.
- `diagram_graphics`: handoff reviewed for canonical agent selection planning/study metadata only.
- `animation_overlay`: handoff reviewed for canonical agent selection planning/study metadata only.
- `canvas_scene`: handoff reviewed for canonical agent selection planning/study metadata only.
- `webgl_3d_scene`: handoff reviewed for canonical agent selection planning/study metadata only.
- `background_removal`: handoff reviewed for canonical agent selection planning/study metadata only.
- `subject_segmentation`: handoff reviewed for canonical agent selection planning/study metadata only.
- `upscaling`: handoff reviewed for canonical agent selection planning/study metadata only.
- `tensor_image_ops`: handoff reviewed for canonical agent selection planning/study metadata only.
- `model_runtime_foundation`: handoff reviewed for canonical agent selection planning/study metadata only.

## Runtime Buckets

- `planning_metadata_allowed_now`: preserved in handoff; no current execution approval.
- `cpu_static_execution_previously_validated_but_not_agent_executable_now`: preserved in handoff; no current execution approval.
- `browser_chart_runtime_later`: preserved in handoff; no current execution approval.
- `animation_runtime_later`: preserved in handoff; no current execution approval.
- `browser_canvas_webgl_runtime_later`: preserved in handoff; no current execution approval.
- `model_cpu_gpu_runtime_later`: preserved in handoff; no current execution approval.
- `tool_route_handoff_later`: preserved in handoff; no current execution approval.
- `worker_handoff_later`: preserved in handoff; no current execution approval.
- `public_artifact_and_signed_url_later`: preserved in handoff; no current execution approval.

## Required Booleans

- `canonicalAgentSelectionRuntimeBoundaryHandoffReviewCompleted`: true
- `sourceRuntimeBoundaryCanonicalizationOwnerApprovalQaAccepted`: true
- `all21ToolsCoveredByRuntimeBoundaryHandoff`: true
- `allRequiredCapabilitiesCoveredByRuntimeBoundaryHandoff`: true
- `allRuntimeBucketsCoveredByRuntimeBoundaryHandoff`: true
- `handoffSchemaCreated`: true
- `handoffContractCreated`: true
- `handoffToolMapCreated`: true
- `handoffCapabilityMapCreated`: true
- `handoffProofStatusCreated`: true
- `handoffMissingProofCreated`: true
- `handoffPlanningOnlyPolicyCreated`: true
- `handoffBlockedUseRegisterCreated`: true
- `toolRoutePlaceholderCreated`: true
- `workerPlaceholderCreated`: true
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
