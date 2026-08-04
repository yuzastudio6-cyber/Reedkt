import type {
  ContextAwareMockEditPlanResult,
  MockCreditEstimate,
  MockCreditEstimateLineItem,
  MockCreditEstimateLineItemType,
  PlanningContext,
  ProfessionalIntegrationState,
  ProfessionalQaState,
} from '../../types'
import { MOCK_CREATED_AT } from '../footage-prep'

type BuildMockCreditEstimateInput = {
  projectId: string
  workspaceId?: string
  userId?: string
  planningContext?: PlanningContext | null
  professionalIntegrationState?: ProfessionalIntegrationState | null
  professionalQaState?: ProfessionalQaState | null
  contextAwarePlanResult?: ContextAwareMockEditPlanResult | null
}

function lineId(projectId: string, index: number) {
  return `${projectId}-mock-credit-line-${String(index).padStart(3, '0')}`
}

function makeLineItem(
  projectId: string,
  index: number,
  type: MockCreditEstimateLineItemType,
  label: string,
  quantity: number,
  credits: number,
  explanation: string,
): MockCreditEstimateLineItem {
  return {
    id: lineId(projectId, index),
    type,
    label,
    quantity,
    credits,
    explanation,
  }
}

function hasCueRole(context: PlanningContext | null | undefined, roles: string[]) {
  return Boolean(context?.cueUsages.some((cue) => roles.includes(cue.role)))
}

function hasCaptionDirection(context: PlanningContext | null | undefined) {
  return Boolean(
    context?.editBrief?.captionPreference ||
      hasCueRole(context, ['caption_instruction', 'text_overlay']),
  )
}

function hasAudioTreatment(
  context: PlanningContext | null | undefined,
  professionalIntegrationState: ProfessionalIntegrationState | null | undefined,
) {
  return Boolean(
    hasCueRole(context, ['music', 'sound_effect']) ||
      professionalIntegrationState?.assetTreatmentPlans.some((plan) =>
        plan.kind === 'music_treatment' || plan.kind === 'sound_treatment',
      ),
  )
}

function hasGraphicsTreatment(
  context: PlanningContext | null | undefined,
  professionalIntegrationState: ProfessionalIntegrationState | null | undefined,
) {
  return Boolean(
    hasCueRole(context, ['overlay', 'text_overlay', 'graphic', 'caption_instruction']) ||
      (professionalIntegrationState?.overlayCompositionPlans.length ?? 0) > 0 ||
      professionalIntegrationState?.assetTreatmentPlans.some((plan) =>
        plan.kind === 'graphic_treatment' ||
        plan.kind === 'logo_treatment' ||
        plan.kind === 'overlay_card',
      ),
  )
}

function planMentionsSystem(result: ContextAwareMockEditPlanResult | null | undefined, system: string) {
  const normalizedSystem = system.toLowerCase()
  const summaryMentionsSystem = result?.planSummary.toLowerCase().includes(normalizedSystem) ?? false
  const creditSummaryMentionsSystem = result?.editPlan.creditEstimate.visualSystemSummary?.some((item) =>
    item.label.toLowerCase().includes(normalizedSystem),
  ) ?? false

  return summaryMentionsSystem || creditSummaryMentionsSystem
}

export function buildMockCreditEstimate({
  contextAwarePlanResult,
  planningContext,
  professionalIntegrationState,
  professionalQaState,
  projectId,
  userId,
  workspaceId,
}: BuildMockCreditEstimateInput): MockCreditEstimate {
  const lineDrafts: Array<{
    type: MockCreditEstimateLineItemType
    label: string
    quantity: number
    credits: number
    explanation: string
  }> = [
    {
      type: 'base_preview',
      label: 'Base private review',
      quantity: 1,
      credits: 5,
      explanation: 'Internal preview orchestration baseline. This is not billing.',
    },
  ]

  if (planningContext) {
    const startedMinutes = Math.max(1, Math.ceil(planningContext.cleanAssembly.durationMs / 60000))
    lineDrafts.push({
      type: 'clean_assembly',
      label: 'Clean Assembly timing',
      quantity: startedMinutes,
      credits: Math.min(20, startedMinutes),
      explanation: 'One estimated credit per started Clean Assembly minute, capped for internal testing.',
    })
  }

  const brollCount = professionalIntegrationState?.brollIntegrationPlans.length ?? 0
  if (brollCount > 0) {
    lineDrafts.push({
      type: 'b_roll',
      label: 'B-roll treatments',
      quantity: brollCount,
      credits: brollCount * 2,
      explanation: 'Planning estimate for trimming, crop, color match, stabilization, and audio-safe B-roll.',
    })
  }

  const overlayCount = professionalIntegrationState?.overlayCompositionPlans.length ?? 0
  if (overlayCount > 0) {
    lineDrafts.push({
      type: 'overlay',
      label: 'Overlay composition',
      quantity: overlayCount,
      credits: overlayCount * 2,
      explanation: 'Planning estimate for safe zones, captions, faces, readable scale, and polished framing.',
    })
  }

  if (professionalIntegrationState?.professionalIntegrationPlan) {
    lineDrafts.push({
      type: 'professional_integration',
      label: 'Professional Integration',
      quantity: 1,
      credits: 3,
      explanation: 'Local treatment planning layer between the edit plan and preview handoff.',
    })
  }

  if (professionalQaState?.report) {
    lineDrafts.push({
      type: 'qa',
      label: 'Professional QA',
      quantity: 1,
      credits: 1,
      explanation: 'Local QA report checks readiness before private review orchestration.',
    })
  }

  if (hasCaptionDirection(planningContext)) {
    lineDrafts.push({
      type: 'captions',
      label: 'Caption readiness',
      quantity: 1,
      credits: 2,
      explanation: 'Estimate for caption-aware preview planning and collision checks.',
    })
  }

  if (hasAudioTreatment(planningContext, professionalIntegrationState)) {
    lineDrafts.push({
      type: 'audio',
      label: 'Audio treatment',
      quantity: 1,
      credits: 2,
      explanation: 'Estimate for speech-safe music, SFX, and B-roll audio behavior.',
    })
  }

  if (hasGraphicsTreatment(planningContext, professionalIntegrationState)) {
    lineDrafts.push({
      type: 'graphics',
      label: 'Graphics and overlays',
      quantity: 1,
      credits: 2,
      explanation: 'Estimate for graphic, card, logo, and overlay treatment planning.',
    })
  }

  if (planMentionsSystem(contextAwarePlanResult, 'Stroke Motion')) {
    lineDrafts.push({
      type: 'stroke_motion',
      label: 'Stroke Motion planning',
      quantity: 1,
      credits: 2,
      explanation: 'Included only because the current plan already names Stroke Motion.',
    })
  }

  if (planMentionsSystem(contextAwarePlanResult, 'Real Motion')) {
    lineDrafts.push({
      type: 'real_motion',
      label: 'Real Motion planning',
      quantity: 1,
      credits: 4,
      explanation: 'Included only because the current plan already names Real Motion.',
    })
  }

  const lineItems = lineDrafts.map((line, index) =>
    makeLineItem(projectId, index + 1, line.type, line.label, line.quantity, line.credits, line.explanation),
  )
  const totalCredits = lineItems.reduce((sum, item) => sum + item.credits, 0)

  return {
    id: `${projectId}-mock-credit-estimate`,
    projectId,
    workspaceId,
    userId,
    status: 'ready',
    lineItems,
    totalCredits,
    freePreview: false,
    explanation: 'This is an internal credit preview for private review planning only. It does not reserve, deduct, charge, or refund credits.',
    createdAt: MOCK_CREATED_AT,
    updatedAt: MOCK_CREATED_AT,
  }
}

export function summarizeMockCreditEstimate(estimate: MockCreditEstimate | null) {
  if (!estimate) return 'Internal credit preview has not been created yet.'
  return `${estimate.totalCredits} estimated internal credit${estimate.totalCredits === 1 ? '' : 's'} across ${estimate.lineItems.length} estimate line items. This is not billing.`
}
