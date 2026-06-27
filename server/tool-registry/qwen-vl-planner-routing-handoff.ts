import {
  evaluateQwenVlRoutingDryRunCase,
} from './qwen-vl-routing-dry-run'
import type {
  QwenVlRoutingDryRunCase,
  QwenVlRoutingDryRunEvaluation,
  QwenVlRoutingDryRunRequest,
  QwenVlRoutingDryRunSyntheticCaseId,
} from './qwen-vl-routing-dry-run'
import type { QwenVlRoutingUseCaseId } from './qwen-vl-use-case-routing'

export type QwenVlPlannerTaskId =
  | 'planner_source_sequence_map_visual_understanding'
  | 'planner_product_demo_step_detection'
  | 'planner_broll_relevance_scoring'
  | 'planner_generated_asset_visual_qa'
  | 'planner_caption_visual_collision_review'
  | 'planner_ocr_layout_context_review'
  | 'planner_chart_screen_context_review'
  | 'planner_safe_zone_semantic_signal'
  | 'planner_blocked_ai_video_generation_request'
  | 'planner_blocked_final_export_request'
  | 'planner_blocked_raw_chat_request'
  | 'planner_blocked_frontend_request'
  | 'planner_blocked_unbounded_video_request'

export type QwenVlPlannerTaskSource =
  | 'source_sequence_map'
  | 'edit_intent_visual_analysis'
  | 'broll_asset_plan'
  | 'generated_asset_qa_plan'
  | 'caption_layout_qa_plan'
  | 'controlled_tool_qa_plan'
  | 'blocked_execution_request'

export type QwenVlPlannerRoutingTask = {
  plannerTaskId: QwenVlPlannerTaskId
  source: QwenVlPlannerTaskSource
  routeCaseId: QwenVlRoutingDryRunSyntheticCaseId
  useCaseId: QwenVlRoutingUseCaseId
  structuredIntentId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  queueLeaseId: string
  privateSourceRefIds: string[]
  deterministicPrerequisites: string[]
  plannerReason: string
  expectedPlannerOutcome:
    | 'qwen_primary_metadata_route'
    | 'qwen_advisory_metadata_route'
    | 'blocked_policy_route'
}

export type QwenVlPlannerRoutingHandoff = {
  plannerTaskId: QwenVlPlannerTaskId
  source: QwenVlPlannerTaskSource
  status:
    | 'planner_handoff_primary_metadata_only'
    | 'planner_handoff_advisory_metadata_only'
    | 'planner_handoff_blocked_by_policy'
  selectedToolId: 'qwen_vl' | null
  runtimeUseCase: QwenVlRoutingDryRunEvaluation['requiredRuntimeUseCase']
  structuredIntentId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  queueLeaseId: string
  privateSourceRefIds: string[]
  deterministicPrerequisites: string[]
  plannerReason: string
  routeReasons: string[]
  policyViolations: string[]
  preferredAfter: QwenVlRoutingDryRunEvaluation['preferredAfter']
  preferredBefore: QwenVlRoutingDryRunEvaluation['preferredBefore']
  mustNotReplace: QwenVlRoutingDryRunEvaluation['mustNotReplace']
  dryRunPassedClaimed: false
  plannerMayDispatchWorker: false
  plannerMayInvokeCloudRun: false
  plannerMayRunInference: false
  plannerMayCreateGeneratedAsset: false
  plannerMayRenderExport: false
  plannerMayUseRawPrompt: false
}

export type QwenVlPlannerRoutingHandoffSummary = {
  mode: 'qwen_vl_planner_routing_handoff_metadata_only'
  totalPlannerTasks: number
  primaryMetadataRoutes: number
  advisoryMetadataRoutes: number
  blockedRoutes: number
  dryRunPassedClaimed: false
  plannerDispatchAllowed: false
  cloudRunInvocationAllowed: false
  inferenceAllowed: false
  rawPromptAllowed: false
  generatedAssetCreationAllowed: false
  renderExportAllowed: false
  nextPrompt: 'QWEN2_5_VL_STACK_TOOL_42-PLANNER-UI-SURFACING: surface Qwen planner route choices in mock tool planning UI, no inference'
}

function task(
  plannerTaskId: QwenVlPlannerTaskId,
  source: QwenVlPlannerTaskSource,
  routeCaseId: QwenVlRoutingDryRunSyntheticCaseId,
  useCaseId: QwenVlRoutingUseCaseId,
  plannerReason: string,
  expectedPlannerOutcome: QwenVlPlannerRoutingTask['expectedPlannerOutcome'],
  deterministicPrerequisites: string[],
  overrides: Partial<Pick<QwenVlPlannerRoutingTask, 'privateSourceRefIds'>> = {},
): QwenVlPlannerRoutingTask {
  return {
    plannerTaskId,
    source,
    routeCaseId,
    useCaseId,
    structuredIntentId: `mock-reference-only-structured-intent-${plannerTaskId}`,
    approvedPlanSnapshotId: 'mock-reference-only-approved-plan-snapshot-qwen-planner-handoff',
    creditReservationId: 'mock-reference-only-credit-reservation-qwen-planner-handoff',
    queueLeaseId: 'mock-reference-only-queue-lease-qwen-planner-handoff',
    privateSourceRefIds: ['mock-reference-only-private-frame-ref-planner-001'],
    deterministicPrerequisites,
    plannerReason,
    expectedPlannerOutcome,
    ...overrides,
  }
}

export const QWEN_VL_PLANNER_ROUTING_TASKS: QwenVlPlannerRoutingTask[] = [
  task(
    'planner_source_sequence_map_visual_understanding',
    'source_sequence_map',
    'private_source_frame_understanding',
    'source_frame_understanding',
    'Planner needs semantic visual context for sampled source frames while preserving deterministic frame sampling and OCR boundaries.',
    'qwen_primary_metadata_route',
    ['opencv_sampled_private_frames', 'approved_snapshot_reference'],
  ),
  task(
    'planner_product_demo_step_detection',
    'edit_intent_visual_analysis',
    'private_product_demo_step_understanding',
    'product_demo_step_understanding',
    'Planner needs product/demo step meaning from private UI frames without treating Qwen as exact OCR authority.',
    'qwen_primary_metadata_route',
    ['paddleocr_text_regions', 'opencv_frame_regions'],
  ),
  task(
    'planner_broll_relevance_scoring',
    'broll_asset_plan',
    'private_broll_candidate_review',
    'broll_candidate_review',
    'Planner needs B-roll candidate relevance scoring after generated or selected private candidates exist.',
    'qwen_primary_metadata_route',
    ['wan_or_ltx_candidate_reference', 'private_artifact_manifest_reference'],
  ),
  task(
    'planner_generated_asset_visual_qa',
    'generated_asset_qa_plan',
    'private_generated_asset_visual_qa',
    'generated_asset_visual_qa',
    'Planner needs advisory generated-asset visual QA before composition handoff.',
    'qwen_primary_metadata_route',
    ['private_generated_asset_reference', 'qa_plan_reference'],
  ),
  task(
    'planner_caption_visual_collision_review',
    'caption_layout_qa_plan',
    'private_caption_visual_consistency_qa',
    'caption_visual_consistency_qa',
    'Planner needs caption/visual consistency signals after deterministic OCR and region checks.',
    'qwen_advisory_metadata_route',
    ['paddleocr_text_regions', 'opencv_safe_zone_regions'],
  ),
  task(
    'planner_ocr_layout_context_review',
    'controlled_tool_qa_plan',
    'private_ocr_layout_reasoning',
    'ocr_layout_reasoning',
    'Planner needs layout context around OCR output, but exact text remains deterministic.',
    'qwen_advisory_metadata_route',
    ['paddleocr_text_output'],
  ),
  task(
    'planner_chart_screen_context_review',
    'controlled_tool_qa_plan',
    'private_chart_screen_reasoning',
    'chart_screen_reasoning',
    'Planner needs screen/chart context while controlled chart tools own exact labels and values.',
    'qwen_advisory_metadata_route',
    ['d3_or_echarts_chart_spec', 'paddleocr_screen_text'],
  ),
  task(
    'planner_safe_zone_semantic_signal',
    'caption_layout_qa_plan',
    'private_safe_zone_planning_signal',
    'safe_zone_planning_signal',
    'Planner needs semantic salience signals for no-cover zones after deterministic region detection.',
    'qwen_advisory_metadata_route',
    ['opencv_region_map', 'remotion_layout_plan'],
  ),
  task(
    'planner_blocked_ai_video_generation_request',
    'blocked_execution_request',
    'blocked_ai_video_generation',
    'ai_video_generation',
    'Planner must route generated B-roll to Wan/LTX/Mochi/Hunyuan paths, not Qwen.',
    'blocked_policy_route',
    ['wan_primary_broll_route'],
  ),
  task(
    'planner_blocked_final_export_request',
    'blocked_execution_request',
    'blocked_final_render_export',
    'final_render_export',
    'Planner must keep final composition/export with Remotion, FFmpeg, and ffprobe.',
    'blocked_policy_route',
    ['remotion_render_plan', 'ffmpeg_export_plan'],
  ),
  task(
    'planner_blocked_raw_chat_request',
    'blocked_execution_request',
    'blocked_raw_chat_worker_execution',
    'raw_chat_worker_execution',
    'Planner must reject raw chat execution and require structured intent plus approved snapshot.',
    'blocked_policy_route',
    ['structured_intent_required'],
    { privateSourceRefIds: [] },
  ),
  task(
    'planner_blocked_frontend_request',
    'blocked_execution_request',
    'blocked_direct_frontend_invocation',
    'direct_frontend_invocation',
    'Planner must reject direct frontend/browser Qwen invocation.',
    'blocked_policy_route',
    ['backend_worker_boundary_required'],
  ),
  task(
    'planner_blocked_unbounded_video_request',
    'blocked_execution_request',
    'blocked_unbounded_long_video_analysis',
    'unbounded_long_video_analysis',
    'Planner must reject unbounded long-video analysis until a bounded sampling owner path exists.',
    'blocked_policy_route',
    ['bounded_frame_sampling_required'],
  ),
]

function toDryRunCase(task: QwenVlPlannerRoutingTask): QwenVlRoutingDryRunCase {
  const request: QwenVlRoutingDryRunRequest = {
    requestId: `mock-reference-only-qwen-planner-route-${task.plannerTaskId}`,
    useCaseId: task.useCaseId,
    approvedPlanSnapshotId: task.approvedPlanSnapshotId,
    creditReservationId: task.creditReservationId,
    queueLeaseId: task.queueLeaseId,
    structuredIntentId: task.structuredIntentId,
    privateSourceRefIds: task.privateSourceRefIds,
    rawPromptPresent: task.routeCaseId === 'blocked_raw_chat_worker_execution',
    publicUrlPresent: false,
    signedUrlPresent: false,
    directFrontendRequest: task.routeCaseId === 'blocked_direct_frontend_invocation',
    boundedFrameSampleCount: task.routeCaseId === 'blocked_unbounded_long_video_analysis' ? 0 : 1,
  }

  return {
    caseId: task.routeCaseId,
    description: task.plannerReason,
    request,
    expectedStatus: task.expectedPlannerOutcome === 'qwen_primary_metadata_route'
      ? 'selected_primary_metadata_only'
      : task.expectedPlannerOutcome === 'qwen_advisory_metadata_route'
        ? 'selected_advisory_metadata_only'
        : 'blocked_by_policy',
  }
}

function statusFromEvaluation(evaluation: QwenVlRoutingDryRunEvaluation): QwenVlPlannerRoutingHandoff['status'] {
  if (evaluation.status === 'selected_primary_metadata_only') {
    return 'planner_handoff_primary_metadata_only'
  }
  if (evaluation.status === 'selected_advisory_metadata_only') {
    return 'planner_handoff_advisory_metadata_only'
  }
  return 'planner_handoff_blocked_by_policy'
}

export function buildQwenVlPlannerRoutingHandoffs(): {
  handoffs: QwenVlPlannerRoutingHandoff[]
  summary: QwenVlPlannerRoutingHandoffSummary
} {
  const handoffs = QWEN_VL_PLANNER_ROUTING_TASKS.map((plannerTask) => {
    const evaluation = evaluateQwenVlRoutingDryRunCase(toDryRunCase(plannerTask))
    return {
      plannerTaskId: plannerTask.plannerTaskId,
      source: plannerTask.source,
      status: statusFromEvaluation(evaluation),
      selectedToolId: evaluation.selectedToolId,
      runtimeUseCase: evaluation.requiredRuntimeUseCase,
      structuredIntentId: plannerTask.structuredIntentId,
      approvedPlanSnapshotId: plannerTask.approvedPlanSnapshotId,
      creditReservationId: plannerTask.creditReservationId,
      queueLeaseId: plannerTask.queueLeaseId,
      privateSourceRefIds: plannerTask.privateSourceRefIds,
      deterministicPrerequisites: plannerTask.deterministicPrerequisites,
      plannerReason: plannerTask.plannerReason,
      routeReasons: evaluation.reasons,
      policyViolations: evaluation.policyViolations,
      preferredAfter: evaluation.preferredAfter,
      preferredBefore: evaluation.preferredBefore,
      mustNotReplace: evaluation.mustNotReplace,
      dryRunPassedClaimed: false as const,
      plannerMayDispatchWorker: false as const,
      plannerMayInvokeCloudRun: false as const,
      plannerMayRunInference: false as const,
      plannerMayCreateGeneratedAsset: false as const,
      plannerMayRenderExport: false as const,
      plannerMayUseRawPrompt: false as const,
    }
  })

  return {
    handoffs,
    summary: {
      mode: 'qwen_vl_planner_routing_handoff_metadata_only',
      totalPlannerTasks: handoffs.length,
      primaryMetadataRoutes: handoffs.filter((item) => item.status === 'planner_handoff_primary_metadata_only').length,
      advisoryMetadataRoutes: handoffs.filter((item) => item.status === 'planner_handoff_advisory_metadata_only').length,
      blockedRoutes: handoffs.filter((item) => item.status === 'planner_handoff_blocked_by_policy').length,
      dryRunPassedClaimed: false,
      plannerDispatchAllowed: false,
      cloudRunInvocationAllowed: false,
      inferenceAllowed: false,
      rawPromptAllowed: false,
      generatedAssetCreationAllowed: false,
      renderExportAllowed: false,
      nextPrompt: 'QWEN2_5_VL_STACK_TOOL_42-PLANNER-UI-SURFACING: surface Qwen planner route choices in mock tool planning UI, no inference',
    },
  }
}
