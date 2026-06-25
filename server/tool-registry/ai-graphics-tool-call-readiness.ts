import { productionToolProfiles } from './production-tool-profiles'
import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
  ProductionToolProfile,
} from './production-tool-types'

export const AI_GRAPHICS_TOOL_CALL_READINESS_DECISION =
  'ai_graphics_tool_call_readiness_contract_prepared_with_warnings'

export type AiGraphicsCanonicalToolId =
  | 'torch_torchvision'
  | 'transformers'
  | 'sam2'
  | 'birefnet'
  | 'real_esrgan'
  | 'kornia'
  | 'rembg'
  | 'transparent_background'
  | 'd3'
  | 'echarts'
  | 'vega_lite'
  | 'vega'
  | 'satori'
  | 'svgdotjs_svg_js'
  | 'viz_js'
  | 'lottie_web'
  | 'animejs'
  | 'three_js'
  | 'pixi_js'
  | 'konva'
  | 'babylonjs'

export const AI_GRAPHICS_CANONICAL_TOOL_IDS = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
] as const satisfies readonly AiGraphicsCanonicalToolId[]

export type AiGraphicsCapabilityId =
  | 'chart_overlay'
  | 'data_visualization'
  | 'svg_graphics'
  | 'diagram_graphics'
  | 'animation_overlay'
  | 'canvas_scene'
  | 'webgl_3d_scene'
  | 'background_removal'
  | 'subject_segmentation'
  | 'upscaling'
  | 'tensor_image_ops'
  | 'model_runtime_foundation'
  | 'planning_metadata_only'
  | 'blocked_or_deferred'

export const AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS = [
  'chart_overlay',
  'data_visualization',
  'svg_graphics',
  'diagram_graphics',
  'animation_overlay',
  'canvas_scene',
  'webgl_3d_scene',
  'background_removal',
  'subject_segmentation',
  'upscaling',
  'tensor_image_ops',
  'model_runtime_foundation',
  'planning_metadata_only',
  'blocked_or_deferred',
] as const satisfies readonly AiGraphicsCapabilityId[]

export type AiGraphicsInstallSurface =
  | 'node_package_lock'
  | 'gpu_worker_requirements'
  | 'dedicated_gpu_runtime_image'
  | 'production_registry_alias'
  | 'planning_only_wrapper'

export type AiGraphicsRuntimeTarget =
  | 'node_cpu_static'
  | 'browser_chart_runtime_later'
  | 'browser_animation_runtime_later'
  | 'browser_canvas_webgl_runtime_later'
  | 'native_linux_amd64_nvidia_l4_gpu_worker'
  | 'native_linux_amd64_nvidia_l4_dedicated_runtime'
  | 'planning_only_no_runtime'

export type AiGraphicsReadinessStatus =
  | 'declared_locked_and_phase0_proof_passed'
  | 'declared_locked_but_runtime_proof_pending'
  | 'declared_locked_but_fixture_blocked'
  | 'docker_install_proof_target_prepared'
  | 'runtime_gate_prepared_pending_native_gpu'
  | 'planning_wrapper_no_production_profile'

export type AiGraphicsRankingTier = 'Tier A' | 'Tier B' | 'Tier C' | 'Tier D' | 'Blocked'

export interface AiGraphicsRankingScore {
  capabilityFit: number
  outputQualityPotential: number
  reliabilityProof: number
  cloudReadiness: number
  costEfficiency: number
  integrationSimplicity: number
  safetyAndControl: number
  totalScore: number
}

export interface AiGraphicsToolCallReadinessRecord {
  toolId: AiGraphicsCanonicalToolId
  displayName: string
  packageName: string
  productionToolId: ProductionToolId | null
  productionWorkerType: ProductionRegistryWorkerType | 'none'
  capabilities: AiGraphicsCapabilityId[]
  rankingTier: AiGraphicsRankingTier
  rankingScore: AiGraphicsRankingScore
  installSurface: AiGraphicsInstallSurface
  installEvidence: string[]
  installStatus: AiGraphicsReadinessStatus
  runtimeTarget: AiGraphicsRuntimeTarget
  proofStatus: string
  runtimeStatus: string
  gpuRequiredForRuntime: boolean
  cpuRuntimeAllowed: boolean
  agentCanSelectForPlanning: true
  agentCanExecuteNow: false
  routeExecutionApprovedNow: false
  workerExecutionApprovedNow: false
  toolExecutionApprovedNow: false
  providerRuntimeApprovedNow: false
  browserWebglCanvasRuntimeApprovedNow: false
  gpuRuntimeApprovedNow: false
  runtimeReadyNow: false
  internalBetaReadyNow: false
  productionReadyNow: false
  blockersBeforeExecution: string[]
  nextProofMilestone: string
}

export interface AiGraphicsCapabilitySelectionRecord {
  capabilityId: AiGraphicsCapabilityId
  rankedPlanningTools: AiGraphicsCanonicalToolId[]
  preferredPlanningTools: AiGraphicsCanonicalToolId[]
  conditionalPlanningTools: AiGraphicsCanonicalToolId[]
  fallbackPlanningTools: AiGraphicsCanonicalToolId[]
  eliminatedTools: AiGraphicsCanonicalToolId[]
  agentCanSelectForPlanning: true
  agentCanExecuteNow: false
  requiredProofBeforeExecution: string[]
}

const falseExecutionGates = {
  agentCanExecuteNow: false,
  routeExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  browserWebglCanvasRuntimeApprovedNow: false,
  gpuRuntimeApprovedNow: false,
  runtimeReadyNow: false,
  internalBetaReadyNow: false,
  productionReadyNow: false,
} as const

function score(
  capabilityFit: number,
  outputQualityPotential: number,
  reliabilityProof: number,
  cloudReadiness: number,
  costEfficiency: number,
  integrationSimplicity: number,
  safetyAndControl: number,
): AiGraphicsRankingScore {
  return {
    capabilityFit,
    outputQualityPotential,
    reliabilityProof,
    cloudReadiness,
    costEfficiency,
    integrationSimplicity,
    safetyAndControl,
    totalScore:
      capabilityFit +
      outputQualityPotential +
      reliabilityProof +
      cloudReadiness +
      costEfficiency +
      integrationSimplicity +
      safetyAndControl,
  }
}

function record(input: Omit<
  AiGraphicsToolCallReadinessRecord,
  | 'agentCanSelectForPlanning'
  | 'agentCanExecuteNow'
  | 'routeExecutionApprovedNow'
  | 'workerExecutionApprovedNow'
  | 'toolExecutionApprovedNow'
  | 'providerRuntimeApprovedNow'
  | 'browserWebglCanvasRuntimeApprovedNow'
  | 'gpuRuntimeApprovedNow'
  | 'runtimeReadyNow'
  | 'internalBetaReadyNow'
  | 'productionReadyNow'
>): AiGraphicsToolCallReadinessRecord {
  return {
    ...input,
    agentCanSelectForPlanning: true,
    ...falseExecutionGates,
  }
}

const gpuRuntimeBlockers = [
  'native linux/amd64 NVIDIA L4 runtime proof is required',
  'approved private model-weight or model-cache manifests are required where applicable',
  'worker execution must remain behind approved snapshot and credit gates',
]

const browserRuntimeBlockers = [
  'browser/canvas/WebGL sandbox proof is required',
  'render/export ownership remains outside this planning contract',
  'public artifact and signed URL gates remain blocked',
]

export const aiGraphicsToolCallReadinessRecords = [
  record({
    toolId: 'torch_torchvision',
    displayName: 'Torch/Torchvision',
    packageName: 'torch + torchvision',
    productionToolId: null,
    productionWorkerType: 'gpu_ai_worker',
    capabilities: ['model_runtime_foundation', 'tensor_image_ops', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Blocked',
    rankingScore: score(16, 15, 2, 2, 3, 2, 5),
    installSurface: 'gpu_worker_requirements',
    installEvidence: ['docker/prod/gpu-worker/requirements.gpu.txt: torch==2.5.1+cu124', 'torchvision==0.20.1+cu124'],
    installStatus: 'runtime_gate_prepared_pending_native_gpu',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_gpu_worker',
    proofStatus: 'docker_install_proof_target_prepared',
    runtimeStatus: 'blocked_pending_native_nvidia_runtime_and_cuda_tensor_probe',
    gpuRequiredForRuntime: true,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: gpuRuntimeBlockers,
    nextProofMilestone: 'native_gpu_runtime_readiness_with_torch_cuda_probe',
  }),
  record({
    toolId: 'transformers',
    displayName: 'Transformers',
    packageName: 'transformers',
    productionToolId: null,
    productionWorkerType: 'gpu_ai_worker',
    capabilities: ['model_runtime_foundation', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Blocked',
    rankingScore: score(15, 15, 2, 2, 3, 2, 5),
    installSurface: 'gpu_worker_requirements',
    installEvidence: ['docker/prod/gpu-worker/requirements.gpu.txt: transformers==4.57.6'],
    installStatus: 'runtime_gate_prepared_pending_native_gpu',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_gpu_worker',
    proofStatus: 'docker_install_proof_target_prepared',
    runtimeStatus: 'blocked_pending_model_boundary_and_native_gpu_runtime',
    gpuRequiredForRuntime: true,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: gpuRuntimeBlockers,
    nextProofMilestone: 'native_gpu_runtime_readiness_with_model_manifest_boundary',
  }),
  record({
    toolId: 'sam2',
    displayName: 'SAM 2',
    packageName: 'facebookresearch/sam2',
    productionToolId: 'sam2',
    productionWorkerType: 'gpu_ai_worker',
    capabilities: ['subject_segmentation', 'background_removal', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Blocked',
    rankingScore: score(22, 18, 1, 1, 2, 2, 4),
    installSurface: 'dedicated_gpu_runtime_image',
    installEvidence: ['docker/prod/sam2-runtime/requirements.sam2.txt', 'pinned git source install at 2b90b9f5ceec907a1c18123530e92e794ad901a4'],
    installStatus: 'runtime_gate_prepared_pending_native_gpu',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_dedicated_runtime',
    proofStatus: 'docker_install_proof_target_prepared',
    runtimeStatus: 'blocked_pending_native_gpu_runtime_and_private_checkpoint_manifest',
    gpuRequiredForRuntime: true,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: gpuRuntimeBlockers,
    nextProofMilestone: 'sam2_native_gpu_fixture_runtime_with_reviewed_checkpoint_manifest',
  }),
  record({
    toolId: 'birefnet',
    displayName: 'BiRefNet',
    packageName: 'transformers + ZhengPeng7/BiRefNet model snapshot',
    productionToolId: 'birefnet',
    productionWorkerType: 'gpu_ai_worker',
    capabilities: ['background_removal', 'subject_segmentation', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Blocked',
    rankingScore: score(21, 17, 1, 1, 3, 2, 4),
    installSurface: 'dedicated_gpu_runtime_image',
    installEvidence: ['docker/prod/birefnet-runtime/requirements.birefnet.txt: transformers==4.57.6', 'private BiRefNet model snapshot required'],
    installStatus: 'runtime_gate_prepared_pending_native_gpu',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_dedicated_runtime',
    proofStatus: 'docker_install_proof_target_prepared',
    runtimeStatus: 'blocked_pending_native_gpu_runtime_and_private_model_manifest',
    gpuRequiredForRuntime: true,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: gpuRuntimeBlockers,
    nextProofMilestone: 'birefnet_native_gpu_fixture_runtime_with_reviewed_model_manifest',
  }),
  record({
    toolId: 'real_esrgan',
    displayName: 'Real-ESRGAN',
    packageName: 'realesrgan',
    productionToolId: 'real_esrgan',
    productionWorkerType: 'gpu_ai_worker',
    capabilities: ['upscaling', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Blocked',
    rankingScore: score(22, 18, 1, 1, 3, 2, 4),
    installSurface: 'dedicated_gpu_runtime_image',
    installEvidence: ['docker/prod/real-esrgan-runtime/requirements.real-esrgan.txt: realesrgan==0.3.0'],
    installStatus: 'runtime_gate_prepared_pending_native_gpu',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_dedicated_runtime',
    proofStatus: 'docker_install_proof_target_prepared',
    runtimeStatus: 'blocked_pending_native_gpu_runtime_and_private_weight_manifest',
    gpuRequiredForRuntime: true,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: gpuRuntimeBlockers,
    nextProofMilestone: 'real_esrgan_native_gpu_fixture_runtime_with_reviewed_weight_manifest',
  }),
  record({
    toolId: 'kornia',
    displayName: 'Kornia',
    packageName: 'kornia',
    productionToolId: 'kornia',
    productionWorkerType: 'gpu_ai_worker',
    capabilities: ['tensor_image_ops', 'model_runtime_foundation', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Blocked',
    rankingScore: score(18, 15, 2, 3, 5, 4, 5),
    installSurface: 'gpu_worker_requirements',
    installEvidence: ['docker/prod/gpu-worker/requirements.gpu.txt: kornia==0.8.1', 'docker/prod/birefnet-runtime/requirements.birefnet.txt: kornia==0.8.1'],
    installStatus: 'runtime_gate_prepared_pending_native_gpu',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_gpu_worker',
    proofStatus: 'docker_install_proof_target_prepared',
    runtimeStatus: 'blocked_pending_native_gpu_runtime_for_tensor_ops',
    gpuRequiredForRuntime: true,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: gpuRuntimeBlockers,
    nextProofMilestone: 'kornia_gpu_tensor_fixture_runtime',
  }),
  record({
    toolId: 'rembg',
    displayName: 'rembg',
    packageName: 'rembg[gpu]',
    productionToolId: 'rembg',
    productionWorkerType: 'gpu_ai_worker',
    capabilities: ['background_removal', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Tier D',
    rankingScore: score(16, 12, 1, 1, 4, 4, 4),
    installSurface: 'gpu_worker_requirements',
    installEvidence: ['docker/prod/gpu-worker/requirements.gpu.txt: rembg[gpu]==2.0.69'],
    installStatus: 'runtime_gate_prepared_pending_native_gpu',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_gpu_worker',
    proofStatus: 'docker_install_proof_target_prepared',
    runtimeStatus: 'blocked_pending_native_gpu_runtime_and_model_cache_policy',
    gpuRequiredForRuntime: true,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: gpuRuntimeBlockers,
    nextProofMilestone: 'rembg_native_gpu_fixture_runtime_and_model_cache_review',
  }),
  record({
    toolId: 'transparent_background',
    displayName: 'transparent-background',
    packageName: 'transparent-background',
    productionToolId: 'transparent_background',
    productionWorkerType: 'gpu_ai_worker',
    capabilities: ['background_removal', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Tier D',
    rankingScore: score(15, 12, 1, 1, 4, 4, 4),
    installSurface: 'gpu_worker_requirements',
    installEvidence: ['docker/prod/gpu-worker/requirements.gpu.txt: transparent-background==1.3.4'],
    installStatus: 'runtime_gate_prepared_pending_native_gpu',
    runtimeTarget: 'native_linux_amd64_nvidia_l4_gpu_worker',
    proofStatus: 'docker_install_proof_target_prepared',
    runtimeStatus: 'blocked_pending_native_gpu_runtime_and_model_cache_policy',
    gpuRequiredForRuntime: true,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: gpuRuntimeBlockers,
    nextProofMilestone: 'transparent_background_native_gpu_fixture_runtime_and_model_cache_review',
  }),
  record({
    toolId: 'd3',
    displayName: 'D3',
    packageName: 'd3',
    productionToolId: 'd3',
    productionWorkerType: 'planning_only',
    capabilities: ['chart_overlay', 'data_visualization', 'svg_graphics', 'diagram_graphics', 'planning_metadata_only'],
    rankingTier: 'Tier A',
    rankingScore: score(24, 17, 15, 8, 9, 8, 9),
    installSurface: 'node_package_lock',
    installEvidence: ['package.json: d3 ^7.9.0', 'package-lock.json node_modules/d3'],
    installStatus: 'declared_locked_and_phase0_proof_passed',
    runtimeTarget: 'node_cpu_static',
    proofStatus: 'phase0_proof_passed',
    runtimeStatus: 'cpu_static_proof_passed_but_agent_execution_blocked',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: true,
    blockersBeforeExecution: ['Tool Route and Worker execution approval are still required before agent execution.'],
    nextProofMilestone: 'tool_route_worker_handoff_for_cpu_static_chart_metadata',
  }),
  record({
    toolId: 'echarts',
    displayName: 'ECharts',
    packageName: 'echarts',
    productionToolId: 'echarts',
    productionWorkerType: 'planning_only',
    capabilities: ['chart_overlay', 'data_visualization', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Tier B',
    rankingScore: score(20, 16, 10, 6, 8, 7, 7),
    installSurface: 'node_package_lock',
    installEvidence: ['package.json: echarts ^6.1.0', 'package-lock.json node_modules/echarts'],
    installStatus: 'declared_locked_but_runtime_proof_pending',
    runtimeTarget: 'browser_chart_runtime_later',
    proofStatus: 'canonical_package_import_static_fixture_proof_only',
    runtimeStatus: 'blocked_pending_browser_chart_runtime',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: browserRuntimeBlockers,
    nextProofMilestone: 'browser_chart_runtime_sandbox_proof',
  }),
  record({
    toolId: 'vega_lite',
    displayName: 'Vega-Lite',
    packageName: 'vega-lite',
    productionToolId: 'vega_lite',
    productionWorkerType: 'planning_only',
    capabilities: ['chart_overlay', 'data_visualization', 'planning_metadata_only'],
    rankingTier: 'Tier A',
    rankingScore: score(25, 18, 15, 8, 9, 9, 9),
    installSurface: 'node_package_lock',
    installEvidence: ['package.json: vega-lite ^6.4.3', 'package-lock.json node_modules/vega-lite'],
    installStatus: 'declared_locked_and_phase0_proof_passed',
    runtimeTarget: 'node_cpu_static',
    proofStatus: 'phase0_proof_passed',
    runtimeStatus: 'cpu_static_compile_proof_passed_but_agent_execution_blocked',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: true,
    blockersBeforeExecution: ['Tool Route and Worker execution approval are still required before agent execution.'],
    nextProofMilestone: 'tool_route_worker_handoff_for_cpu_static_chart_spec_validation',
  }),
  record({
    toolId: 'vega',
    displayName: 'Vega',
    packageName: 'vega',
    productionToolId: null,
    productionWorkerType: 'none',
    capabilities: ['chart_overlay', 'data_visualization', 'planning_metadata_only'],
    rankingTier: 'Tier A',
    rankingScore: score(23, 17, 15, 8, 8, 8, 9),
    installSurface: 'planning_only_wrapper',
    installEvidence: ['package.json: vega ^6.2.0', 'package-lock.json node_modules/vega'],
    installStatus: 'declared_locked_and_phase0_proof_passed',
    runtimeTarget: 'node_cpu_static',
    proofStatus: 'phase0_proof_passed',
    runtimeStatus: 'cpu_static_parse_proof_passed_but_no_production_tool_profile_yet',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: true,
    blockersBeforeExecution: ['Add an explicit production registry profile before Tool Route or Worker execution.'],
    nextProofMilestone: 'production_registry_profile_for_vega_cpu_static_validation',
  }),
  record({
    toolId: 'satori',
    displayName: 'Satori',
    packageName: 'satori',
    productionToolId: null,
    productionWorkerType: 'none',
    capabilities: ['svg_graphics', 'planning_metadata_only'],
    rankingTier: 'Tier A',
    rankingScore: score(23, 17, 13, 7, 8, 7, 9),
    installSurface: 'planning_only_wrapper',
    installEvidence: ['package.json: satori ^0.26.0', 'package-lock.json node_modules/satori'],
    installStatus: 'declared_locked_but_fixture_blocked',
    runtimeTarget: 'node_cpu_static',
    proofStatus: 'import_passed_text_svg_blocked_missing_approved_font_fixture',
    runtimeStatus: 'blocked_pending_approved_font_fixture_for_text_svg_layout',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: true,
    blockersBeforeExecution: ['Approved deterministic font fixture is required before Satori text SVG layout execution.'],
    nextProofMilestone: 'satori_font_fixture_runtime_proof',
  }),
  record({
    toolId: 'svgdotjs_svg_js',
    displayName: '@svgdotjs/svg.js',
    packageName: '@svgdotjs/svg.js',
    productionToolId: null,
    productionWorkerType: 'none',
    capabilities: ['svg_graphics', 'diagram_graphics', 'planning_metadata_only'],
    rankingTier: 'Tier A',
    rankingScore: score(24, 17, 15, 8, 9, 9, 9),
    installSurface: 'planning_only_wrapper',
    installEvidence: ['package.json: @svgdotjs/svg.js ^3.2.5', 'package-lock.json node_modules/@svgdotjs/svg.js'],
    installStatus: 'declared_locked_and_phase0_proof_passed',
    runtimeTarget: 'node_cpu_static',
    proofStatus: 'phase0_proof_passed_with_jsdom_adapter',
    runtimeStatus: 'cpu_static_svg_construction_proof_passed_but_no_production_tool_profile_yet',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: true,
    blockersBeforeExecution: ['Add an explicit production registry profile before Tool Route or Worker execution.'],
    nextProofMilestone: 'production_registry_profile_for_svgdotjs_cpu_static_svg_construction',
  }),
  record({
    toolId: 'viz_js',
    displayName: '@viz-js/viz',
    packageName: '@viz-js/viz',
    productionToolId: null,
    productionWorkerType: 'none',
    capabilities: ['diagram_graphics', 'svg_graphics', 'planning_metadata_only'],
    rankingTier: 'Tier A',
    rankingScore: score(24, 17, 14, 8, 9, 8, 9),
    installSurface: 'planning_only_wrapper',
    installEvidence: ['package.json: @viz-js/viz ^3.28.0', 'package-lock.json node_modules/@viz-js/viz'],
    installStatus: 'declared_locked_and_phase0_proof_passed',
    runtimeTarget: 'node_cpu_static',
    proofStatus: 'phase0_proof_passed',
    runtimeStatus: 'cpu_static_graphviz_wasm_proof_passed_but_no_production_tool_profile_yet',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: true,
    blockersBeforeExecution: ['Add an explicit production registry profile before Tool Route or Worker execution.'],
    nextProofMilestone: 'production_registry_profile_for_viz_js_cpu_static_diagram_generation',
  }),
  record({
    toolId: 'lottie_web',
    displayName: 'Lottie Web',
    packageName: 'lottie-web',
    productionToolId: 'lottie',
    productionWorkerType: 'render_worker',
    capabilities: ['animation_overlay', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Tier B',
    rankingScore: score(20, 16, 10, 6, 8, 8, 7),
    installSurface: 'production_registry_alias',
    installEvidence: ['package.json: lottie-web ^5.13.0', 'productionToolId alias: lottie'],
    installStatus: 'declared_locked_but_runtime_proof_pending',
    runtimeTarget: 'browser_animation_runtime_later',
    proofStatus: 'canonical_package_import_static_fixture_proof_only',
    runtimeStatus: 'blocked_pending_animation_runtime_approval',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: ['Animation runtime and render-worker execution approval are required.'],
    nextProofMilestone: 'animation_runtime_manifest_fixture_proof',
  }),
  record({
    toolId: 'animejs',
    displayName: 'Anime.js',
    packageName: 'animejs',
    productionToolId: null,
    productionWorkerType: 'none',
    capabilities: ['animation_overlay', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Tier B',
    rankingScore: score(19, 15, 10, 6, 8, 8, 7),
    installSurface: 'planning_only_wrapper',
    installEvidence: ['package.json: animejs ^4.4.1', 'package-lock.json node_modules/animejs'],
    installStatus: 'declared_locked_but_runtime_proof_pending',
    runtimeTarget: 'browser_animation_runtime_later',
    proofStatus: 'canonical_package_import_manifest_proof_only',
    runtimeStatus: 'blocked_pending_animation_runtime_approval_and_production_profile',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: ['Animation runtime proof and explicit production registry profile are required.'],
    nextProofMilestone: 'animejs_animation_runtime_profile_and_fixture_proof',
  }),
  record({
    toolId: 'three_js',
    displayName: 'Three.js',
    packageName: 'three',
    productionToolId: 'three_js',
    productionWorkerType: 'render_worker',
    capabilities: ['webgl_3d_scene', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Tier B',
    rankingScore: score(20, 17, 8, 5, 6, 6, 7),
    installSurface: 'node_package_lock',
    installEvidence: ['package.json: three ^0.184.0', 'package-lock.json node_modules/three'],
    installStatus: 'declared_locked_but_runtime_proof_pending',
    runtimeTarget: 'browser_canvas_webgl_runtime_later',
    proofStatus: 'canonical_package_import_manifest_proof_only',
    runtimeStatus: 'blocked_pending_browser_webgl_canvas_sandbox',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: browserRuntimeBlockers,
    nextProofMilestone: 'browser_webgl_sandbox_fixture_proof',
  }),
  record({
    toolId: 'pixi_js',
    displayName: 'PixiJS',
    packageName: 'pixi.js',
    productionToolId: 'pixijs',
    productionWorkerType: 'render_worker',
    capabilities: ['canvas_scene', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Tier B',
    rankingScore: score(20, 16, 8, 5, 7, 6, 7),
    installSurface: 'production_registry_alias',
    installEvidence: ['package.json: pixi.js ^8.19.0', 'productionToolId alias: pixijs'],
    installStatus: 'declared_locked_but_runtime_proof_pending',
    runtimeTarget: 'browser_canvas_webgl_runtime_later',
    proofStatus: 'canonical_package_import_manifest_proof_only',
    runtimeStatus: 'blocked_pending_browser_webgl_canvas_sandbox',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: browserRuntimeBlockers,
    nextProofMilestone: 'browser_canvas_webgl_sandbox_fixture_proof',
  }),
  record({
    toolId: 'konva',
    displayName: 'Konva',
    packageName: 'konva',
    productionToolId: 'konva',
    productionWorkerType: 'planning_only',
    capabilities: ['canvas_scene', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Tier B',
    rankingScore: score(19, 15, 9, 6, 7, 6, 7),
    installSurface: 'node_package_lock',
    installEvidence: ['package.json: konva ^10.3.0', 'package-lock.json node_modules/konva'],
    installStatus: 'declared_locked_but_runtime_proof_pending',
    runtimeTarget: 'browser_canvas_webgl_runtime_later',
    proofStatus: 'canonical_package_import_manifest_proof_only',
    runtimeStatus: 'blocked_pending_browser_canvas_sandbox',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: browserRuntimeBlockers,
    nextProofMilestone: 'browser_canvas_sandbox_fixture_proof',
  }),
  record({
    toolId: 'babylonjs',
    displayName: 'Babylon.js',
    packageName: 'babylonjs',
    productionToolId: 'babylon_js',
    productionWorkerType: 'render_worker',
    capabilities: ['webgl_3d_scene', 'planning_metadata_only', 'blocked_or_deferred'],
    rankingTier: 'Tier C',
    rankingScore: score(18, 16, 8, 5, 5, 6, 7),
    installSurface: 'production_registry_alias',
    installEvidence: ['package.json: babylonjs ^9.12.0', 'productionToolId alias: babylon_js'],
    installStatus: 'declared_locked_but_runtime_proof_pending',
    runtimeTarget: 'browser_canvas_webgl_runtime_later',
    proofStatus: 'canonical_package_import_manifest_proof_only',
    runtimeStatus: 'blocked_pending_browser_webgl_canvas_sandbox',
    gpuRequiredForRuntime: false,
    cpuRuntimeAllowed: false,
    blockersBeforeExecution: browserRuntimeBlockers,
    nextProofMilestone: 'browser_webgl_sandbox_fixture_proof',
  }),
] as const satisfies readonly AiGraphicsToolCallReadinessRecord[]

export const aiGraphicsCapabilitySelectionRecords = [
  {
    capabilityId: 'chart_overlay',
    rankedPlanningTools: ['vega_lite', 'd3', 'echarts', 'vega'],
    preferredPlanningTools: ['vega_lite', 'd3'],
    conditionalPlanningTools: ['echarts'],
    fallbackPlanningTools: ['vega'],
    eliminatedTools: ['three_js', 'sam2', 'real_esrgan'],
    agentCanSelectForPlanning: true,
    agentCanExecuteNow: false,
    requiredProofBeforeExecution: ['browser chart runtime approval for echarts', 'Tool Route and Worker execution approval'],
  },
  {
    capabilityId: 'data_visualization',
    rankedPlanningTools: ['vega_lite', 'vega', 'd3', 'echarts'],
    preferredPlanningTools: ['vega_lite', 'vega', 'd3'],
    conditionalPlanningTools: ['echarts'],
    fallbackPlanningTools: ['d3'],
    eliminatedTools: ['sam2', 'real_esrgan'],
    agentCanSelectForPlanning: true,
    agentCanExecuteNow: false,
    requiredProofBeforeExecution: ['visualization runtime approval', 'artifact boundary approval'],
  },
  {
    capabilityId: 'svg_graphics',
    rankedPlanningTools: ['svgdotjs_svg_js', 'satori', 'd3'],
    preferredPlanningTools: ['svgdotjs_svg_js', 'satori'],
    conditionalPlanningTools: ['d3'],
    fallbackPlanningTools: ['d3'],
    eliminatedTools: ['sam2', 'real_esrgan'],
    agentCanSelectForPlanning: true,
    agentCanExecuteNow: false,
    requiredProofBeforeExecution: ['static SVG output contract approval', 'public artifact boundary approval'],
  },
  {
    capabilityId: 'diagram_graphics',
    rankedPlanningTools: ['viz_js', 'svgdotjs_svg_js'],
    preferredPlanningTools: ['viz_js'],
    conditionalPlanningTools: ['svgdotjs_svg_js'],
    fallbackPlanningTools: ['svgdotjs_svg_js'],
    eliminatedTools: ['vega_lite'],
    agentCanSelectForPlanning: true,
    agentCanExecuteNow: false,
    requiredProofBeforeExecution: ['diagram output contract approval', 'artifact boundary approval'],
  },
  {
    capabilityId: 'animation_overlay',
    rankedPlanningTools: ['lottie_web', 'animejs'],
    preferredPlanningTools: ['lottie_web', 'animejs'],
    conditionalPlanningTools: [],
    fallbackPlanningTools: ['animejs'],
    eliminatedTools: ['real_esrgan', 'sam2'],
    agentCanSelectForPlanning: true,
    agentCanExecuteNow: false,
    requiredProofBeforeExecution: ['animation manifest/runtime approval'],
  },
  {
    capabilityId: 'canvas_scene',
    rankedPlanningTools: ['pixi_js', 'konva'],
    preferredPlanningTools: ['pixi_js', 'konva'],
    conditionalPlanningTools: [],
    fallbackPlanningTools: ['konva'],
    eliminatedTools: ['sam2', 'real_esrgan'],
    agentCanSelectForPlanning: true,
    agentCanExecuteNow: false,
    requiredProofBeforeExecution: ['browser/canvas sandbox approval'],
  },
  {
    capabilityId: 'webgl_3d_scene',
    rankedPlanningTools: ['three_js', 'babylonjs'],
    preferredPlanningTools: ['three_js', 'babylonjs'],
    conditionalPlanningTools: [],
    fallbackPlanningTools: ['babylonjs'],
    eliminatedTools: ['vega_lite', 'sam2'],
    agentCanSelectForPlanning: true,
    agentCanExecuteNow: false,
    requiredProofBeforeExecution: ['browser/WebGL sandbox approval'],
  },
  {
    capabilityId: 'background_removal',
    rankedPlanningTools: ['sam2', 'birefnet', 'rembg', 'transparent_background'],
    preferredPlanningTools: ['sam2', 'birefnet'],
    conditionalPlanningTools: ['rembg', 'transparent_background'],
    fallbackPlanningTools: ['rembg', 'transparent_background'],
    eliminatedTools: ['vega_lite', 'd3'],
    agentCanSelectForPlanning: true,
    agentCanExecuteNow: false,
    requiredProofBeforeExecution: ['native GPU runtime proof', 'approved model manifests', 'mask QA and worker handoff approval'],
  },
  {
    capabilityId: 'subject_segmentation',
    rankedPlanningTools: ['sam2', 'birefnet'],
    preferredPlanningTools: ['sam2', 'birefnet'],
    conditionalPlanningTools: [],
    fallbackPlanningTools: ['birefnet'],
    eliminatedTools: ['vega_lite', 'real_esrgan'],
    agentCanSelectForPlanning: true,
    agentCanExecuteNow: false,
    requiredProofBeforeExecution: ['native GPU runtime proof', 'approved segmentation checkpoint manifests'],
  },
  {
    capabilityId: 'upscaling',
    rankedPlanningTools: ['real_esrgan'],
    preferredPlanningTools: ['real_esrgan'],
    conditionalPlanningTools: [],
    fallbackPlanningTools: ['real_esrgan'],
    eliminatedTools: ['vega_lite', 'd3'],
    agentCanSelectForPlanning: true,
    agentCanExecuteNow: false,
    requiredProofBeforeExecution: ['native GPU runtime proof', 'approved Real-ESRGAN weight manifest'],
  },
  {
    capabilityId: 'tensor_image_ops',
    rankedPlanningTools: ['kornia', 'torch_torchvision'],
    preferredPlanningTools: ['kornia'],
    conditionalPlanningTools: ['torch_torchvision'],
    fallbackPlanningTools: ['kornia'],
    eliminatedTools: ['echarts', 'lottie_web'],
    agentCanSelectForPlanning: true,
    agentCanExecuteNow: false,
    requiredProofBeforeExecution: ['native GPU tensor runtime proof or explicit CPU-only worker approval'],
  },
  {
    capabilityId: 'model_runtime_foundation',
    rankedPlanningTools: ['torch_torchvision', 'transformers'],
    preferredPlanningTools: ['torch_torchvision', 'transformers'],
    conditionalPlanningTools: [],
    fallbackPlanningTools: ['transformers'],
    eliminatedTools: ['vega_lite', 'd3'],
    agentCanSelectForPlanning: true,
    agentCanExecuteNow: false,
    requiredProofBeforeExecution: ['native GPU runtime proof', 'model boundary approval'],
  },
] as const satisfies readonly AiGraphicsCapabilitySelectionRecord[]

export function listAiGraphicsToolCallReadiness(): AiGraphicsToolCallReadinessRecord[] {
  return [...aiGraphicsToolCallReadinessRecords]
}

export function getAiGraphicsToolCallReadiness(
  toolId: AiGraphicsCanonicalToolId | string,
): AiGraphicsToolCallReadinessRecord | undefined {
  return aiGraphicsToolCallReadinessRecords.find((record) => record.toolId === toolId)
}

export function listAiGraphicsCapabilitySelections(): AiGraphicsCapabilitySelectionRecord[] {
  return [...aiGraphicsCapabilitySelectionRecords]
}

export function getAiGraphicsCapabilitySelection(
  capabilityId: AiGraphicsCapabilityId | string,
): AiGraphicsCapabilitySelectionRecord | undefined {
  return aiGraphicsCapabilitySelectionRecords.find((record) => record.capabilityId === capabilityId)
}

export function getAiGraphicsMappedProductionProfile(
  toolId: AiGraphicsCanonicalToolId | string,
): ProductionToolProfile | undefined {
  const readiness = getAiGraphicsToolCallReadiness(toolId)

  if (!readiness?.productionToolId) return undefined

  return productionToolProfiles.find((profile) => profile.toolId === readiness.productionToolId)
}

export function listAiGraphicsGpuRuntimeRequiredTools(): AiGraphicsToolCallReadinessRecord[] {
  return aiGraphicsToolCallReadinessRecords.filter((record) => record.gpuRequiredForRuntime)
}

export function selectAiGraphicsPlanningToolsForCapability(
  capabilityId: AiGraphicsCapabilityId | string,
): AiGraphicsToolCallReadinessRecord[] {
  const selection = getAiGraphicsCapabilitySelection(capabilityId)

  if (!selection) return []

  return selection.rankedPlanningTools
    .map((toolId) => getAiGraphicsToolCallReadiness(toolId))
    .filter((record): record is AiGraphicsToolCallReadinessRecord => Boolean(record))
}
