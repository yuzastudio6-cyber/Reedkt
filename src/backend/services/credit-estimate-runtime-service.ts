import type {
  CreditEstimateLineItemRecord,
  CreditEstimateLineItemType,
  CreditEstimateRecord,
  CreditUsageCategory,
  JSONObject,
} from '../../types'
import type { CreditSpendPurpose } from '../../types/credit-runtime'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, insertMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult } from '../service-result'
import type { ProfessionalExportCreditCoverage } from '../../types/professional-export'
import { buildProfessionalExportCreditCoverage } from '../../lib/professional-export-policy'

export interface CreditEstimateRuntimeLineInput {
  lineItemType: CreditEstimateLineItemType
  usageCategory: CreditUsageCategory
  label: string
  estimatedCredits: number
  description?: string
  isOptional?: boolean
  isPremium?: boolean
  providerHint?: string
  modelHint?: string
}

export interface CreateCreditEstimateRuntimeInput {
  workspaceId: string
  projectId: string
  editPlanId?: string
  chatSessionId?: string
  purpose: CreditSpendPurpose
  estimateReason?: string
  availableCreditsSnapshot?: number
  reservedCreditsSnapshot?: number
  lineItems: CreditEstimateRuntimeLineInput[]
  mockFreeDemo?: boolean
  professionalExportCoverage?: ProfessionalExportCreditCoverage
}

export interface CreditEstimateRuntimeResult {
  creditEstimate: CreditEstimateRecord
  lineItems: CreditEstimateLineItemRecord[]
  mode: 'mock' | 'frontend_estimate_only'
  approvalRequired: boolean
  expensiveOperations: string[]
  userFacingExplanation: string
  warnings: string[]
}

export function createCreditEstimateRuntime(
  db: MockDatabase,
  input: CreateCreditEstimateRuntimeInput,
): ServiceResult<CreditEstimateRuntimeResult> {
  const lineItems = input.lineItems.map((line) => createCreditEstimateLineItem(input, line))
  const totalEstimatedCredits = lineItems.reduce((total, line) => total + line.estimatedCredits, 0)
  const approvalRequired = totalEstimatedCredits > 0 && !input.mockFreeDemo
  const estimate: CreditEstimateRecord = {
    id: createMockId('credit-runtime-estimate'),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    chatSessionId: input.chatSessionId,
    editPlanId: input.editPlanId,
    status: 'shown_to_user',
    totalEstimatedCredits,
    minimumEstimatedCredits: Math.max(0, totalEstimatedCredits - 3),
    maximumEstimatedCredits: totalEstimatedCredits + (approvalRequired ? 6 : 0),
    availableCreditsSnapshot: input.availableCreditsSnapshot ?? db.creditWallets[0]?.cachedAvailableCredits ?? 0,
    reservedCreditsSnapshot: input.reservedCreditsSnapshot ?? db.creditWallets[0]?.cachedReservedCredits ?? 0,
    weeklyBonusCreditsSnapshot: 100,
    estimateReason: input.estimateReason ?? `Mock runtime estimate for ${input.purpose}.`,
    estimatePayload: {
      approvalRequiredBeforeReservation: approvalRequired,
      purpose: input.purpose,
      mockFreeDemo: input.mockFreeDemo ?? false,
      noSpendOrReservation: true,
      ...(input.professionalExportCoverage
        ? {
            professionalExportCoverage: input.professionalExportCoverage as unknown as JSONObject,
            finalExportUsesExistingReservation: true,
            exportTimeEstimateOrChargeAllowed: false,
          }
        : {}),
    },
    shownToUserAt: nowIso(),
    createdByAgent: 'mock_credit_runtime_agent',
    lineItems,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      frontendMayDisplayOnly: true,
    },
  }

  insertMockRecord(db, 'creditEstimates', estimate)
  lineItems.forEach((lineItem) => {
    lineItem.creditEstimateId = estimate.id
  })
  lineItems.forEach((lineItem) => insertMockRecord(db, 'creditEstimateLineItems', lineItem))

  return ok({
    creditEstimate: estimate,
    lineItems,
    mode: input.mockFreeDemo ? 'frontend_estimate_only' : 'mock',
    approvalRequired,
    expensiveOperations: lineItems
      .filter((line) => line.estimatedCredits > 0)
      .map((line) => line.label),
    userFacingExplanation: approvalRequired
      ? 'Review and approve this credit estimate before ReeditPro reserves credits or starts generation/rendering.'
      : 'This mock/demo estimate does not reserve or spend credits.',
    warnings: [
      'Estimate runtime is mock-only; no credits were reserved or spent.',
      ...(approvalRequired ? ['Backend runtime is required for real credit reservation.'] : []),
    ],
  })
}

export function createCreditEstimateFromEditPlan(
  db: MockDatabase,
  input: Omit<CreateCreditEstimateRuntimeInput, 'purpose' | 'lineItems'>,
): ServiceResult<CreditEstimateRuntimeResult> {
  const editPlan = input.editPlanId ? findMockRecord(db, 'editPlans', input.editPlanId) : undefined

  if (input.editPlanId && !editPlan) {
    return fail('EDIT_PLAN_NOT_FOUND', `Edit plan ${input.editPlanId} was not found.`)
  }

  const cleanupCredits = editPlan?.complexity === 'basic_edit' ? 10 : 18
  const signatureCredits = db.signatureRoutes.some((route) => route.editPlanId === input.editPlanId && route.approvalNeeded)
    ? 12
    : 0
  const finalVideoDurationSeconds = Math.max(
    1,
    ...db.editPlanSegments
      .filter((segment) => segment.editPlanId === input.editPlanId)
      .map((segment) => segment.outputEndSeconds),
  )
  const professionalExportCoverage = buildProfessionalExportCreditCoverage({
    durationSeconds: finalVideoDurationSeconds,
    outputFps: 30,
  })

  return createCreditEstimateRuntime(db, {
    ...input,
    purpose: 'edit_planning',
    estimateReason: 'Mock edit plan estimate created before generation can start.',
    professionalExportCoverage,
    lineItems: [
      {
        lineItemType: 'basic_edit_cleanup',
        usageCategory: 'basic_edit',
        label: 'Professional edit planning and cleanup',
        description: 'Basic remains professional; this estimate is shown before any generation.',
        estimatedCredits: cleanupCredits,
      },
      ...(signatureCredits > 0
        ? [{
            lineItemType: 'stroke_motion' as const,
            usageCategory: 'stroke_motion' as const,
            label: 'Signature system generation allowance',
            description: 'Reserved only if the user approves the estimate and plan.',
            estimatedCredits: signatureCredits,
            isPremium: false,
          }]
        : []),
      {
        lineItemType: 'final_export',
        usageCategory: 'rendering',
        label: '4K UHD render and export ceiling',
        description: 'Included in the initial edit estimate and existing reservation; covered export profiles must not create another estimate or charge.',
        estimatedCredits: professionalExportCoverage.maximumInternalToolCostCredits,
        isPremium: false,
      },
    ],
  })
}

export function createCreditEstimateForMusic(
  db: MockDatabase,
  input: Omit<CreateCreditEstimateRuntimeInput, 'purpose' | 'lineItems'>,
): ServiceResult<CreditEstimateRuntimeResult> {
  return createCreditEstimateRuntime(db, {
    ...input,
    purpose: 'music_generation',
    estimateReason: 'Mock SoundSync music generation estimate.',
    lineItems: [
      {
        lineItemType: 'music',
        usageCategory: 'soundsync',
        label: 'SoundSync music generation',
        description: 'Future music generation remains approval and reservation gated.',
        estimatedCredits: 18,
        providerHint: 'future_music_worker',
      },
    ],
  })
}

export function createCreditEstimateForSFX(
  db: MockDatabase,
  input: Omit<CreateCreditEstimateRuntimeInput, 'purpose' | 'lineItems'>,
): ServiceResult<CreditEstimateRuntimeResult> {
  return createCreditEstimateRuntime(db, {
    ...input,
    purpose: 'sfx_generation',
    estimateReason: 'Mock SoundSync SFX generation estimate.',
    lineItems: [
      {
        lineItemType: 'sfx',
        usageCategory: 'soundsync',
        label: 'SoundSync SFX generation',
        description: 'Future SFX generation remains approval and reservation gated.',
        estimatedCredits: 6,
        providerHint: 'future_sfx_worker',
      },
    ],
  })
}

export function createCreditEstimateForSignatureSystems(
  db: MockDatabase,
  input: Omit<CreateCreditEstimateRuntimeInput, 'purpose' | 'lineItems'>,
): ServiceResult<CreditEstimateRuntimeResult> {
  return createCreditEstimateRuntime(db, {
    ...input,
    purpose: 'stroke_motion_generation',
    estimateReason: 'Mock signature system generation estimate.',
    lineItems: [
      {
        lineItemType: 'stroke_motion',
        usageCategory: 'stroke_motion',
        label: 'Stroke Motion generation',
        description: 'Signature generation cannot start until credits are approved and reserved.',
        estimatedCredits: 12,
      },
      {
        lineItemType: 'graphic_design',
        usageCategory: 'signature_edit',
        label: 'Graphic Design / VisualExplain allowance',
        estimatedCredits: 8,
        isOptional: true,
      },
    ],
  })
}

export function createCreditEstimateForRender(
  db: MockDatabase,
  input: Omit<CreateCreditEstimateRuntimeInput, 'purpose' | 'lineItems'> & { finalExport?: boolean },
): ServiceResult<CreditEstimateRuntimeResult> {
  if (input.finalExport) {
    return fail(
      'CREDIT_ESTIMATE_NOT_READY',
      'Final export must use the 4K UHD ceiling included in the approved edit estimate and its existing reservation; do not create a second export estimate or charge.',
    )
  }
  return createCreditEstimateRuntime(db, {
    ...input,
    purpose: 'preview_render',
    estimateReason: 'Mock preview render estimate.',
    lineItems: [
      {
        lineItemType: 'render_preview',
        usageCategory: 'rendering',
        label: 'Preview render placeholder',
        description: 'Preview rendering remains backend/worker-only after approval and reservation.',
        estimatedCredits: 8,
      },
    ],
  })
}

export function summarizeCreditEstimateRuntime(result: CreditEstimateRuntimeResult): string {
  const approval = result.approvalRequired ? 'requires approval before reservation' : 'does not require credit spend'
  return `${result.creditEstimate.totalEstimatedCredits} credit(s) estimated; ${approval}.`
}

function createCreditEstimateLineItem(
  input: CreateCreditEstimateRuntimeInput,
  line: CreditEstimateRuntimeLineInput,
): CreditEstimateLineItemRecord {
  return {
    id: createMockId('credit-runtime-line-item'),
    creditEstimateId: 'pending-credit-runtime-estimate',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    lineItemType: line.lineItemType,
    usageCategory: line.usageCategory,
    label: line.label,
    description: line.description,
    estimatedCredits: line.estimatedCredits,
    isOptional: line.isOptional ?? false,
    isPremium: line.isPremium ?? false,
    requiresUserApproval: line.estimatedCredits > 0 && !input.mockFreeDemo,
    providerHint: line.providerHint,
    modelHint: line.modelHint,
    linePayload: {
      purpose: input.purpose,
      mockOnly: true,
      noSpendOrReservation: true,
    },
    createdAt: nowIso(),
  }
}
