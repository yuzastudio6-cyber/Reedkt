# AI Graphics Tool Capability Study QA Source Lockfile

Decision: `ai_graphics_tool_capability_study_and_ranking_matrix_qa_passed_with_warnings`

Source branch: `origin/codex/rp-ai-graphics-tool-capability-study-ranking-matrix`

QA branch: `codex/rp-ai-graphics-tool-capability-study-ranking-matrix-qa-review`

Duplicate search result: no exact QA PR, remote QA branch, or target worktree existed before implementation.

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
- PR #612: open/draft/MERGEABLE at `5f870b9e493170cb9c02a03d33a719f1801560c8` - stale lineage blocked source
- PR #614: open/draft/MERGEABLE at `31b196f8158f6f3054cf90daaa9ba74d18c95089` - dependency reconciliation source
- PR #616: open/draft/MERGEABLE at `474a88aa31aaff46164d1ff0d9dc469e8d320bf1` - refreshed execution evidence
- PR #617: open/draft/MERGEABLE at `5bc68feeb776f2329cc4a124515709f55aac36cb` - refreshed execution QA evidence
- PR #621: open/draft/MERGEABLE at `cd6ab312d83bb5ebaa30f1ef30f41cf3891c3306` - CPU/static owner review source
- PR #623: open/draft/MERGEABLE at `4952fb0103d05e8f7df1272c0acd7419426f0ea4` - source capability study and ranking matrix

## Tools QA Reviewed

- `torch_torchvision`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `transformers`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `sam2`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `birefnet`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `real_esrgan`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `kornia`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `rembg`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `transparent_background`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `d3`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `echarts`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `vega_lite`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `vega`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `satori`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `svgdotjs_svg_js`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `viz_js`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `lottie_web`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `animejs`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `three_js`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `pixi_js`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `konva`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.
- `babylonjs`: accepted with warnings; planning/study selection allowed; execution/runtime/beta/production false.

## Capability Groups

- `chart_overlay`: product-facing capability group accepted.
- `data_visualization`: product-facing capability group accepted.
- `svg_graphics`: product-facing capability group accepted.
- `diagram_graphics`: product-facing capability group accepted.
- `animation_overlay`: product-facing capability group accepted.
- `canvas_scene`: product-facing capability group accepted.
- `webgl_3d_scene`: product-facing capability group accepted.
- `background_removal`: product-facing capability group accepted.
- `subject_segmentation`: product-facing capability group accepted.
- `upscaling`: product-facing capability group accepted.
- `tensor_image_ops`: product-facing capability group accepted.
- `model_runtime_foundation`: product-facing capability group accepted.
- `planning_metadata_only`: product-facing capability group accepted.
- `blocked_or_deferred`: product-facing capability group accepted.

## Boundary

- Track B exclusion preserved under `TRACK_B_MEDIA_OSS_STEWARD`; Track B media tools are not product-facing AI graphics capabilities and are not claimed, installed, proved, or executed.
- Track A render/export exclusion preserved via PR #544; render/export ownership is not claimed by this QA lane.
- Internal labels may appear only as source/exclusion evidence, not as product-facing capability categories.

## Boolean Summary

- `capabilityStudyQaCompleted`: `true`
- `sourceCapabilityStudyAccepted`: `true`
- `all21AtlasToolsQaReviewed`: `true`
- `all13CanonicalPackageProofToolsIncluded`: `true`
- `all6CpuStaticValidatedToolsIncluded`: `true`
- `modelToolsIncludedAsBlockedForExecution`: `true`
- `rankingMatrixQaAccepted`: `true`
- `selectionRulesQaAccepted`: `true`
- `eliminationRulesQaAccepted`: `true`
- `fallbackMapQaAccepted`: `true`
- `cloudTargetsQaAccepted`: `true`
- `proofStatusQaAccepted`: `true`
- `agentRoutingExamplesQaAccepted`: `true`
- `priorStudyEvidenceAccepted`: `true`
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
