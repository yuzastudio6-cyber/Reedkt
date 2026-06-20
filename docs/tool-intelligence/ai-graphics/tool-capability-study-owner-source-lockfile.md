# AI Graphics Tool Capability Study Owner Source Lockfile

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_owner_review_passed_with_warnings`

Source branch: `origin/codex/rp-ai-graphics-tool-capability-study-ranking-matrix-qa-review`

Owner branch: `codex/rp-ai-graphics-tool-capability-study-ranking-matrix-owner-review`

Duplicate search result: no exact owner-review PR, remote owner-review branch, or target worktree existed before implementation.

## Source Evidence

- PR #361: merged merge `05d429f6029136f0f55fe01375809071b588791c` - historical capability routing contract
- PR #376: merged merge `9296a4a41a143c0a212415d890e6ff544f73bb4b` - historical capability routing study
- PR #425: merged merge `a055ef045db2a6ce127a044bee6219d5933532c3` - Batch 1 package proof
- PR #433: merged merge `dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0` - Batch 2 package proof
- PR #441: merged merge `d174de59471eacf05bed5a5511d661f2e5ba9f0f` - Batch 3 package proof
- PR #542: merged merge `a66a1c0b72263e5e113d95216c373e0fad1071bb` - Track B exclusion context
- PR #543: open/draft/MERGEABLE at `37fea25846987323d1de04098c701816fa24a237` - owner assignment and conflict sync source
- PR #544: merged merge `62f69c6b66d77abf155287ffdb2e9a380541d763` - Track A render/export exclusion context
- PR #589: open/draft/MERGEABLE at `6a55428bfd99d6e745b572df4f1a96c3a22e59cc` - canonical package proof QA source
- PR #604: open/draft/MERGEABLE at `303ac0e00e5979a8857852aef91ac2aa8c2495fe` - runtime-boundary owner QA source
- PR #607: open/draft/MERGEABLE at `12cfc4f29e55db7a5b105ecfc3aba21480396435` - CPU/static approval source
- PR #614: open/draft/MERGEABLE at `31b196f8158f6f3054cf90daaa9ba74d18c95089` - dependency reconciliation source
- PR #616: open/draft/MERGEABLE at `474a88aa31aaff46164d1ff0d9dc469e8d320bf1` - refreshed execution evidence
- PR #617: open/draft/MERGEABLE at `5bc68feeb776f2329cc4a124515709f55aac36cb` - refreshed execution QA evidence
- PR #621: open/draft/MERGEABLE at `cd6ab312d83bb5ebaa30f1ef30f41cf3891c3306` - CPU/static owner review source
- PR #623: open/draft/MERGEABLE at `4952fb0103d05e8f7df1272c0acd7419426f0ea4` - source capability study and ranking matrix
- PR #627: open/draft/MERGEABLE at `6ecd47f38ecef419c2dd8ec1e8fd46feb699911f` - QA review source

## Tools Owner-Reviewed

- `torch_torchvision`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `transformers`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `sam2`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `birefnet`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `real_esrgan`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `kornia`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `rembg`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `transparent_background`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `d3`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `echarts`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `vega_lite`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `vega`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `satori`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `svgdotjs_svg_js`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `viz_js`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `lottie_web`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `animejs`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `three_js`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `pixi_js`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `konva`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `babylonjs`: owner-accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.

## Capability Groups

- `chart_overlay`: owner-accepted product-facing capability group.
- `data_visualization`: owner-accepted product-facing capability group.
- `svg_graphics`: owner-accepted product-facing capability group.
- `diagram_graphics`: owner-accepted product-facing capability group.
- `animation_overlay`: owner-accepted product-facing capability group.
- `canvas_scene`: owner-accepted product-facing capability group.
- `webgl_3d_scene`: owner-accepted product-facing capability group.
- `background_removal`: owner-accepted product-facing capability group.
- `subject_segmentation`: owner-accepted product-facing capability group.
- `upscaling`: owner-accepted product-facing capability group.
- `tensor_image_ops`: owner-accepted product-facing capability group.
- `model_runtime_foundation`: owner-accepted product-facing capability group.
- `planning_metadata_only`: owner-accepted product-facing capability group.
- `blocked_or_deferred`: owner-accepted product-facing capability group.

## Boundary

- Track B exclusion preserved under `TRACK_B_MEDIA_OSS_STEWARD`; Track B media tools are not product-facing AI graphics capabilities and are not claimed, installed, proved, or executed.
- Track A render/export exclusion preserved via PR #544; render/export ownership is not claimed by this owner-review lane.
- Internal labels may appear only as source/exclusion evidence, not as product-facing capability categories.

## Boolean Summary

- `capabilityStudyOwnerReviewCompleted`: `true`
- `sourceCapabilityStudyAccepted`: `true`
- `sourceQaAccepted`: `true`
- `all21AtlasToolsOwnerReviewed`: `true`
- `all13CanonicalPackageProofToolsIncluded`: `true`
- `all6CpuStaticValidatedToolsIncluded`: `true`
- `modelToolsIncludedAsBlockedForExecution`: `true`
- `rankingMatrixOwnerAccepted`: `true`
- `selectionRulesOwnerAccepted`: `true`
- `eliminationRulesOwnerAccepted`: `true`
- `fallbackMapOwnerAccepted`: `true`
- `cloudTargetsOwnerAccepted`: `true`
- `proofStatusOwnerAccepted`: `true`
- `agentRoutingExamplesOwnerAccepted`: `true`
- `priorStudyEvidenceOwnerAccepted`: `true`
- `agentCanSelectForPlanning`: `true`
- `agentCanExecuteToolsNow`: `false`
- `runtimeReadyNow`: `false`
- `internalBetaReadyNow`: `false`
- `productionReadyNow`: `false`
- `dependencyInstallPerformed`: `false`
- `packageLockMutationPerformed`: `false`
- `toolExecutionPerformed`: `false`
- `workerExecutionPerformed`: `false`
- `routeExecutionPerformed`: `false`
- `providerRuntimePerformed`: `false`
- `browserWebglCanvasRuntimePerformed`: `false`
- `gpuRuntimePerformed`: `false`
- `supabaseMutationPerformed`: `false`
- `gcsUploadPerformed`: `false`
- `publicArtifactCreated`: `false`
- `signedUrlCreated`: `false`

## No Scope

No tool execution, worker execution, route execution, provider/model runtime, dependency install, npm ci, package-lock mutation, CPU/static validation rerun, import smoke, synthetic fixture, browser/WebGL/canvas runtime, GPU runtime, model download, media/Remotion/resvg processing, Supabase mutation, SQL execution, GCS upload, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, PR merge, PR close, or PR retarget was performed.
