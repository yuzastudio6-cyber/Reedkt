import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export type QwenVlRoutingUseCaseId =
  | 'source_frame_understanding'
  | 'product_demo_step_understanding'
  | 'broll_candidate_review'
  | 'generated_asset_visual_qa'
  | 'caption_visual_consistency_qa'
  | 'ocr_layout_reasoning'
  | 'chart_screen_reasoning'
  | 'safe_zone_planning_signal'
  | 'ai_video_generation'
  | 'final_render_export'
  | 'raw_chat_worker_execution'
  | 'direct_frontend_invocation'
  | 'unbounded_long_video_analysis'

export type QwenVlRoutingRank =
  | 'primary_vlm'
  | 'secondary_advisory'
  | 'blocked'

export type QwenVlRuntimeUseCase =
  | 'visual_understanding'
  | 'broll_candidate_review'
  | 'frame_asset_qa'
  | 'caption_visual_consistency_qa'

export type QwenVlRoutingSideEffectGates = {
  mayCallProvider: false
  mayDispatchWorker: false
  mayInvokeCloudRun: false
  mayRunInference: false
  mayDownloadModel: false
  mayCreateGeneratedAsset: false
  mayCreatePublicArtifact: false
  mayCreateSignedUrl: false
  mayRunMediaProcessing: false
  mayRunRenderExport: false
  mayUseRawPrompt: false
  mayRunInFrontend: false
  cpuExecutionAllowed: false
}

export type QwenVlRoutingRuntimeGates = {
  approvedSnapshotRequired: true
  creditReservationRequired: true
  queueLeaseRequired: true
  privateSourceRefsRequired: true
  privateModelPathRequired: true
  boundedVisualTokenBudgetRequired: true
  scaleToZeroGpuRuntimeRequired: true
  rawPromptAllowed: false
  publicUrlAllowed: false
  signedUrlAllowed: false
  providerRouteAllowed: false
  frontendInvocationAllowed: false
}

export type QwenVlUseCaseRoutingDecision = {
  useCaseId: QwenVlRoutingUseCaseId
  rank: QwenVlRoutingRank
  toolId: 'qwen_vl'
  workerType: ProductionRegistryWorkerType
  requiredRuntimeUseCase: QwenVlRuntimeUseCase | null
  preferredAfter: ProductionToolId[]
  preferredBefore: ProductionToolId[]
  mustNotReplace: ProductionToolId[]
  why: string
  executionBlockedUntil: string[]
  runtimeGates: QwenVlRoutingRuntimeGates
  sideEffectGates: QwenVlRoutingSideEffectGates
}

const runtimeGates: QwenVlRoutingRuntimeGates = {
  approvedSnapshotRequired: true,
  creditReservationRequired: true,
  queueLeaseRequired: true,
  privateSourceRefsRequired: true,
  privateModelPathRequired: true,
  boundedVisualTokenBudgetRequired: true,
  scaleToZeroGpuRuntimeRequired: true,
  rawPromptAllowed: false,
  publicUrlAllowed: false,
  signedUrlAllowed: false,
  providerRouteAllowed: false,
  frontendInvocationAllowed: false,
}

const sideEffectGates: QwenVlRoutingSideEffectGates = {
  mayCallProvider: false,
  mayDispatchWorker: false,
  mayInvokeCloudRun: false,
  mayRunInference: false,
  mayDownloadModel: false,
  mayCreateGeneratedAsset: false,
  mayCreatePublicArtifact: false,
  mayCreateSignedUrl: false,
  mayRunMediaProcessing: false,
  mayRunRenderExport: false,
  mayUseRawPrompt: false,
  mayRunInFrontend: false,
  cpuExecutionAllowed: false,
}

const runtimeExecutionBlockers = [
  'private_invocation_auth_preflight_must_pass',
  'worker_runtime_dispatch_must_be_accepted',
  'approved_snapshot_and_credit_reservation_must_exist',
  'qwen_runtime_inference_gate_must_be_enabled_by_future_owner_prompt',
]

const blockedUseBlockers = [
  'qwen_vl_is_visual_understanding_only',
  'raw_prompt_execution_is_forbidden',
  'final_render_export_is_owned_by_render_pipeline',
  'ai_video_generation_is_owned_by_wan_ltx_or_other_ai_video_routes',
]

function decision(input: Omit<QwenVlUseCaseRoutingDecision, 'toolId' | 'workerType' | 'runtimeGates' | 'sideEffectGates'>): QwenVlUseCaseRoutingDecision {
  return {
    ...input,
    toolId: 'qwen_vl',
    workerType: 'gpu_ai_worker',
    runtimeGates,
    sideEffectGates,
  }
}

export const QWEN_VL_USE_CASE_ROUTING_DECISIONS: QwenVlUseCaseRoutingDecision[] = [
  decision({
    useCaseId: 'source_frame_understanding',
    rank: 'primary_vlm',
    requiredRuntimeUseCase: 'visual_understanding',
    preferredAfter: ['opencv', 'paddleocr'],
    preferredBefore: ['remotion'],
    mustNotReplace: ['paddleocr', 'opencv'],
    why: 'Use Qwen as the primary VLM when structured edit planning needs semantic understanding of sampled private source frames after deterministic sampling and OCR regions exist.',
    executionBlockedUntil: runtimeExecutionBlockers,
  }),
  decision({
    useCaseId: 'product_demo_step_understanding',
    rank: 'primary_vlm',
    requiredRuntimeUseCase: 'visual_understanding',
    preferredAfter: ['opencv', 'paddleocr'],
    preferredBefore: ['remotion', 'opentimelineio'],
    mustNotReplace: ['paddleocr', 'opencv'],
    why: 'Use Qwen to identify demo-step meaning and UI context from approved frame references while deterministic OCR remains the source for exact screen text.',
    executionBlockedUntil: runtimeExecutionBlockers,
  }),
  decision({
    useCaseId: 'broll_candidate_review',
    rank: 'primary_vlm',
    requiredRuntimeUseCase: 'broll_candidate_review',
    preferredAfter: ['wan_video', 'ltx_video', 'mochi_video'],
    preferredBefore: ['remotion'],
    mustNotReplace: ['wan_video', 'ltx_video'],
    why: 'Use Qwen to review whether private generated or selected B-roll candidates match the approved plan; Qwen must not generate the B-roll itself.',
    executionBlockedUntil: runtimeExecutionBlockers,
  }),
  decision({
    useCaseId: 'generated_asset_visual_qa',
    rank: 'primary_vlm',
    requiredRuntimeUseCase: 'frame_asset_qa',
    preferredAfter: ['wan_video', 'ltx_video', 'mochi_video'],
    preferredBefore: ['remotion', 'ffmpeg'],
    mustNotReplace: ['ffmpeg', 'ffprobe', 'remotion'],
    why: 'Use Qwen as visual QA on private generated frame or clip references before composition/export, while media integrity and export checks stay with deterministic render/media tools.',
    executionBlockedUntil: runtimeExecutionBlockers,
  }),
  decision({
    useCaseId: 'caption_visual_consistency_qa',
    rank: 'secondary_advisory',
    requiredRuntimeUseCase: 'caption_visual_consistency_qa',
    preferredAfter: ['paddleocr', 'opencv'],
    preferredBefore: ['remotion', 'libass'],
    mustNotReplace: ['paddleocr', 'libass', 'remotion'],
    why: 'Use Qwen as an advisory check for caption/visual consistency after deterministic OCR and safe-zone passes, not as the final caption renderer or exact text authority.',
    executionBlockedUntil: runtimeExecutionBlockers,
  }),
  decision({
    useCaseId: 'ocr_layout_reasoning',
    rank: 'secondary_advisory',
    requiredRuntimeUseCase: 'visual_understanding',
    preferredAfter: ['paddleocr'],
    preferredBefore: ['remotion'],
    mustNotReplace: ['paddleocr'],
    why: 'Use Qwen to reason about OCR layout context only after PaddleOCR extracts exact text and regions; exact text truth remains deterministic.',
    executionBlockedUntil: runtimeExecutionBlockers,
  }),
  decision({
    useCaseId: 'chart_screen_reasoning',
    rank: 'secondary_advisory',
    requiredRuntimeUseCase: 'visual_understanding',
    preferredAfter: ['d3', 'echarts', 'paddleocr'],
    preferredBefore: ['remotion'],
    mustNotReplace: ['d3', 'echarts', 'vega_lite', 'paddleocr'],
    why: 'Use Qwen to explain chart or screen context only as advisory reasoning; controlled chart/dataviz tools remain responsible for exact values, labels, and visuals.',
    executionBlockedUntil: runtimeExecutionBlockers,
  }),
  decision({
    useCaseId: 'safe_zone_planning_signal',
    rank: 'secondary_advisory',
    requiredRuntimeUseCase: 'caption_visual_consistency_qa',
    preferredAfter: ['opencv', 'paddleocr'],
    preferredBefore: ['remotion', 'libass'],
    mustNotReplace: ['opencv', 'paddleocr', 'remotion'],
    why: 'Use Qwen to provide advisory no-cover and semantic salience signals, while deterministic regions and Remotion layout still own final safe-zone decisions.',
    executionBlockedUntil: runtimeExecutionBlockers,
  }),
  decision({
    useCaseId: 'ai_video_generation',
    rank: 'blocked',
    requiredRuntimeUseCase: null,
    preferredAfter: ['wan_video', 'ltx_video', 'mochi_video'],
    preferredBefore: [],
    mustNotReplace: ['wan_video', 'ltx_video', 'mochi_video', 'hunyuan_video'],
    why: 'Qwen2.5-VL is not a generated B-roll or AI video generation route; Wan remains the primary open-source B-roll route and LTX remains the fast-preview secondary route.',
    executionBlockedUntil: blockedUseBlockers,
  }),
  decision({
    useCaseId: 'final_render_export',
    rank: 'blocked',
    requiredRuntimeUseCase: null,
    preferredAfter: ['remotion', 'ffmpeg', 'ffprobe'],
    preferredBefore: [],
    mustNotReplace: ['remotion', 'ffmpeg', 'ffprobe'],
    why: 'Qwen can advise visual QA but must not render, mux, export, publish, or replace Track A/render pipeline ownership.',
    executionBlockedUntil: blockedUseBlockers,
  }),
  decision({
    useCaseId: 'raw_chat_worker_execution',
    rank: 'blocked',
    requiredRuntimeUseCase: null,
    preferredAfter: [],
    preferredBefore: [],
    mustNotReplace: ['opentimelineio'],
    why: 'Workers must execute approved snapshots and structured payloads, never raw chat or raw prompt fields.',
    executionBlockedUntil: blockedUseBlockers,
  }),
  decision({
    useCaseId: 'direct_frontend_invocation',
    rank: 'blocked',
    requiredRuntimeUseCase: null,
    preferredAfter: [],
    preferredBefore: [],
    mustNotReplace: ['remotion'],
    why: 'Qwen remains backend/worker-only and must not be loaded, called, or invoked from browser-facing code.',
    executionBlockedUntil: blockedUseBlockers,
  }),
  decision({
    useCaseId: 'unbounded_long_video_analysis',
    rank: 'blocked',
    requiredRuntimeUseCase: null,
    preferredAfter: ['opencv', 'pyscenedetect'],
    preferredBefore: [],
    mustNotReplace: ['pyscenedetect', 'opencv', 'ffprobe'],
    why: 'Qwen routing is bounded to sampled frames and controlled visual-token budgets; unbounded long-video analysis needs separate owner acceptance.',
    executionBlockedUntil: blockedUseBlockers,
  }),
]

export function listQwenVlUseCaseRoutingDecisions(): QwenVlUseCaseRoutingDecision[] {
  return QWEN_VL_USE_CASE_ROUTING_DECISIONS.map((item) => ({ ...item }))
}

export function getQwenVlUseCaseRoutingDecision(
  useCaseId: QwenVlRoutingUseCaseId,
): QwenVlUseCaseRoutingDecision {
  const found = QWEN_VL_USE_CASE_ROUTING_DECISIONS.find((item) => item.useCaseId === useCaseId)

  if (!found) {
    throw new Error(`Unknown Qwen VLM routing use case: ${useCaseId}`)
  }

  return { ...found }
}

export function rankQwenVlForUseCase(useCaseId: QwenVlRoutingUseCaseId): QwenVlRoutingRank {
  return getQwenVlUseCaseRoutingDecision(useCaseId).rank
}
