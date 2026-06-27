import {
  getQwenVlUseCaseRoutingDecision,
  listQwenVlUseCaseRoutingDecisions,
} from './qwen-vl-use-case-routing'
import type {
  QwenVlRoutingRank,
  QwenVlRoutingUseCaseId,
  QwenVlUseCaseRoutingDecision,
} from './qwen-vl-use-case-routing'

export type QwenVlRoutingDryRunStatus =
  | 'selected_primary_metadata_only'
  | 'selected_advisory_metadata_only'
  | 'blocked_by_policy'

export type QwenVlRoutingDryRunSyntheticCaseId =
  | 'private_source_frame_understanding'
  | 'private_product_demo_step_understanding'
  | 'private_broll_candidate_review'
  | 'private_generated_asset_visual_qa'
  | 'private_caption_visual_consistency_qa'
  | 'private_ocr_layout_reasoning'
  | 'private_chart_screen_reasoning'
  | 'private_safe_zone_planning_signal'
  | 'blocked_ai_video_generation'
  | 'blocked_final_render_export'
  | 'blocked_raw_chat_worker_execution'
  | 'blocked_direct_frontend_invocation'
  | 'blocked_unbounded_long_video_analysis'

export type QwenVlRoutingDryRunRequest = {
  requestId: string
  useCaseId: QwenVlRoutingUseCaseId
  approvedPlanSnapshotId: string
  creditReservationId: string
  queueLeaseId: string
  structuredIntentId: string
  privateSourceRefIds: string[]
  rawPromptPresent: boolean
  publicUrlPresent: boolean
  signedUrlPresent: boolean
  directFrontendRequest: boolean
  boundedFrameSampleCount: number
}

export type QwenVlRoutingDryRunCase = {
  caseId: QwenVlRoutingDryRunSyntheticCaseId
  description: string
  request: QwenVlRoutingDryRunRequest
  expectedStatus: QwenVlRoutingDryRunStatus
}

export type QwenVlRoutingDryRunEvaluation = {
  caseId: QwenVlRoutingDryRunSyntheticCaseId
  status: QwenVlRoutingDryRunStatus
  rank: QwenVlRoutingRank
  selectedToolId: 'qwen_vl' | null
  requiredRuntimeUseCase: QwenVlUseCaseRoutingDecision['requiredRuntimeUseCase']
  preferredAfter: QwenVlUseCaseRoutingDecision['preferredAfter']
  preferredBefore: QwenVlUseCaseRoutingDecision['preferredBefore']
  mustNotReplace: QwenVlUseCaseRoutingDecision['mustNotReplace']
  reasons: string[]
  policyViolations: string[]
  dryRunPassedClaimed: false
  runtimeGates: QwenVlUseCaseRoutingDecision['runtimeGates']
  sideEffectGates: QwenVlUseCaseRoutingDecision['sideEffectGates']
}

export type QwenVlRoutingDryRunSummary = {
  mode: 'qwen_vl_routing_integration_dry_run_no_inference'
  totalCases: number
  selectedPrimaryCount: number
  selectedAdvisoryCount: number
  blockedCount: number
  dryRunPassedClaimed: false
  inferenceRun: false
  cloudRunInvoked: false
  workersDispatched: false
  generatedAssetsCreated: false
  publicArtifactsCreated: false
  signedUrlsCreated: false
  nextPrompt: 'QWEN2_5_VL_STACK_TOOL_41-PRIVATE-INVOKE-AUTH-VERIFY-OR-ROUTER-HANDOFF: refresh gcloud auth or hand off Qwen routing dry-run to planner, no inference'
}

function request(
  useCaseId: QwenVlRoutingUseCaseId,
  overrides: Partial<QwenVlRoutingDryRunRequest> = {},
): QwenVlRoutingDryRunRequest {
  return {
    requestId: `mock-reference-only-qwen-route-${useCaseId}`,
    useCaseId,
    approvedPlanSnapshotId: 'mock-reference-only-approved-plan-snapshot-qwen-routing',
    creditReservationId: 'mock-reference-only-credit-reservation-qwen-routing',
    queueLeaseId: 'mock-reference-only-queue-lease-qwen-routing',
    structuredIntentId: 'mock-reference-only-structured-intent-qwen-routing',
    privateSourceRefIds: ['mock-reference-only-private-frame-ref-001'],
    rawPromptPresent: false,
    publicUrlPresent: false,
    signedUrlPresent: false,
    directFrontendRequest: false,
    boundedFrameSampleCount: 1,
    ...overrides,
  }
}

export const QWEN_VL_ROUTING_DRY_RUN_CASES: QwenVlRoutingDryRunCase[] = [
  {
    caseId: 'private_source_frame_understanding',
    description: 'Structured source-frame understanding from approved private frame refs.',
    request: request('source_frame_understanding'),
    expectedStatus: 'selected_primary_metadata_only',
  },
  {
    caseId: 'private_product_demo_step_understanding',
    description: 'Product/demo step interpretation from sampled private UI frames.',
    request: request('product_demo_step_understanding'),
    expectedStatus: 'selected_primary_metadata_only',
  },
  {
    caseId: 'private_broll_candidate_review',
    description: 'Review a private generated or selected B-roll candidate without generating video.',
    request: request('broll_candidate_review'),
    expectedStatus: 'selected_primary_metadata_only',
  },
  {
    caseId: 'private_generated_asset_visual_qa',
    description: 'Visual QA for a private generated frame or clip reference.',
    request: request('generated_asset_visual_qa'),
    expectedStatus: 'selected_primary_metadata_only',
  },
  {
    caseId: 'private_caption_visual_consistency_qa',
    description: 'Advisory caption/visual consistency check after deterministic OCR and region checks.',
    request: request('caption_visual_consistency_qa'),
    expectedStatus: 'selected_advisory_metadata_only',
  },
  {
    caseId: 'private_ocr_layout_reasoning',
    description: 'Advisory OCR layout context after deterministic text extraction.',
    request: request('ocr_layout_reasoning'),
    expectedStatus: 'selected_advisory_metadata_only',
  },
  {
    caseId: 'private_chart_screen_reasoning',
    description: 'Advisory chart/screen context after controlled chart and OCR tools.',
    request: request('chart_screen_reasoning'),
    expectedStatus: 'selected_advisory_metadata_only',
  },
  {
    caseId: 'private_safe_zone_planning_signal',
    description: 'Advisory safe-zone signal after deterministic region sampling.',
    request: request('safe_zone_planning_signal'),
    expectedStatus: 'selected_advisory_metadata_only',
  },
  {
    caseId: 'blocked_ai_video_generation',
    description: 'Reject attempts to use Qwen as an AI video generation model.',
    request: request('ai_video_generation'),
    expectedStatus: 'blocked_by_policy',
  },
  {
    caseId: 'blocked_final_render_export',
    description: 'Reject attempts to use Qwen as render, mux, export, or delivery owner.',
    request: request('final_render_export'),
    expectedStatus: 'blocked_by_policy',
  },
  {
    caseId: 'blocked_raw_chat_worker_execution',
    description: 'Reject raw chat or raw prompt worker execution.',
    request: request('raw_chat_worker_execution', {
      rawPromptPresent: true,
      privateSourceRefIds: [],
    }),
    expectedStatus: 'blocked_by_policy',
  },
  {
    caseId: 'blocked_direct_frontend_invocation',
    description: 'Reject direct browser/frontend Qwen invocation.',
    request: request('direct_frontend_invocation', {
      directFrontendRequest: true,
    }),
    expectedStatus: 'blocked_by_policy',
  },
  {
    caseId: 'blocked_unbounded_long_video_analysis',
    description: 'Reject unbounded long-video analysis without bounded sampling acceptance.',
    request: request('unbounded_long_video_analysis', {
      boundedFrameSampleCount: 0,
    }),
    expectedStatus: 'blocked_by_policy',
  },
]

function statusForRank(rank: QwenVlRoutingRank): QwenVlRoutingDryRunStatus {
  if (rank === 'primary_vlm') {
    return 'selected_primary_metadata_only'
  }

  if (rank === 'secondary_advisory') {
    return 'selected_advisory_metadata_only'
  }

  return 'blocked_by_policy'
}

function collectPolicyViolations(request: QwenVlRoutingDryRunRequest): string[] {
  const violations: string[] = []

  if (request.rawPromptPresent) {
    violations.push('raw_prompt_present')
  }
  if (request.publicUrlPresent) {
    violations.push('public_url_present')
  }
  if (request.signedUrlPresent) {
    violations.push('signed_url_present')
  }
  if (request.directFrontendRequest) {
    violations.push('direct_frontend_request')
  }
  if (!request.approvedPlanSnapshotId) {
    violations.push('approved_plan_snapshot_missing')
  }
  if (!request.creditReservationId) {
    violations.push('credit_reservation_missing')
  }
  if (!request.queueLeaseId) {
    violations.push('queue_lease_missing')
  }
  if (!request.structuredIntentId) {
    violations.push('structured_intent_missing')
  }
  if (request.privateSourceRefIds.length === 0) {
    violations.push('private_source_refs_missing')
  }
  if (request.boundedFrameSampleCount < 1) {
    violations.push('bounded_frame_sample_missing')
  }

  return violations
}

export function evaluateQwenVlRoutingDryRunCase(
  testCase: QwenVlRoutingDryRunCase,
): QwenVlRoutingDryRunEvaluation {
  const decision = getQwenVlUseCaseRoutingDecision(testCase.request.useCaseId)
  const policyViolations = collectPolicyViolations(testCase.request)
  const status = decision.rank === 'blocked' || policyViolations.length > 0
    ? 'blocked_by_policy'
    : statusForRank(decision.rank)

  return {
    caseId: testCase.caseId,
    status,
    rank: decision.rank,
    selectedToolId: status === 'blocked_by_policy' ? null : 'qwen_vl',
    requiredRuntimeUseCase: status === 'blocked_by_policy' ? null : decision.requiredRuntimeUseCase,
    preferredAfter: decision.preferredAfter,
    preferredBefore: decision.preferredBefore,
    mustNotReplace: decision.mustNotReplace,
    reasons: [
      decision.why,
      status === 'blocked_by_policy'
        ? 'No execution route is selected for this dry-run case.'
        : 'Route is selected as metadata only; runtime invocation remains disabled.',
    ],
    policyViolations,
    dryRunPassedClaimed: false,
    runtimeGates: decision.runtimeGates,
    sideEffectGates: decision.sideEffectGates,
  }
}

export function runQwenVlRoutingDryRun(): {
  evaluations: QwenVlRoutingDryRunEvaluation[]
  summary: QwenVlRoutingDryRunSummary
} {
  const routingUseCases = listQwenVlUseCaseRoutingDecisions().map((item) => item.useCaseId)
  for (const testCase of QWEN_VL_ROUTING_DRY_RUN_CASES) {
    if (!routingUseCases.includes(testCase.request.useCaseId)) {
      throw new Error(`Dry-run case uses an unknown Qwen route use case: ${testCase.caseId}`)
    }
  }

  const evaluations = QWEN_VL_ROUTING_DRY_RUN_CASES.map(evaluateQwenVlRoutingDryRunCase)
  const selectedPrimaryCount = evaluations.filter((item) => item.status === 'selected_primary_metadata_only').length
  const selectedAdvisoryCount = evaluations.filter((item) => item.status === 'selected_advisory_metadata_only').length
  const blockedCount = evaluations.filter((item) => item.status === 'blocked_by_policy').length

  return {
    evaluations,
    summary: {
      mode: 'qwen_vl_routing_integration_dry_run_no_inference',
      totalCases: evaluations.length,
      selectedPrimaryCount,
      selectedAdvisoryCount,
      blockedCount,
      dryRunPassedClaimed: false,
      inferenceRun: false,
      cloudRunInvoked: false,
      workersDispatched: false,
      generatedAssetsCreated: false,
      publicArtifactsCreated: false,
      signedUrlsCreated: false,
      nextPrompt: 'QWEN2_5_VL_STACK_TOOL_41-PRIVATE-INVOKE-AUTH-VERIFY-OR-ROUTER-HANDOFF: refresh gcloud auth or hand off Qwen routing dry-run to planner, no inference',
    },
  }
}
