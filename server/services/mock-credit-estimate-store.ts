import type {
  CreditEstimateLineItemRecord,
  CreditEstimateLineItemType,
  CreditEstimateRecord,
  CreditUsageCategory,
  EditCreditCostSummaryLine,
  EditCreditEstimateLowerCostOption,
  EditCreditEstimatePreview,
  EditCreditEstimateReadinessStatus,
  EditCreditEstimateSafetyFlags,
  EditCreditEstimateServiceFeeEstimate,
  EditCreditEstimateToolEstimateSnapshot,
  EditCreditEstimateToolUsageInput,
  EditCreditEstimateTopUpSummary,
  PreviewEditCreditEstimateRequest,
} from '../../src/types/credits'
import type { ReEditProCanonicalEditLevel } from '../../src/types/edit-level'
import type { JSONObject } from '../../src/types/shared'
import {
  calculateReEditProServiceFeeCredits,
  REEDITPRO_CREDIT_POLICY_VERSION,
  REEDITPRO_FINAL_CHARGE_FORMULA,
  REEDITPRO_RESERVATION_POLICY_COPY,
  REEDITPRO_SERVICE_FEE_POLICY_VERSION,
} from '../../src/types/credit-policy'
import {
  estimateProductionToolCost,
  type CalculateToolActualCostMicrosInput,
  type ProductionToolCostEstimate,
  type ToolCostUsageCategory,
} from '../tool-cost-metering'
import type { ProductionToolId } from '../tool-registry'
import { createMockId, nowIso } from './service-helpers'

export interface MockCreditEstimateStore {
  previews: EditCreditEstimatePreview[]
  walletMutationRecords: unknown[]
  reservationMutationRecords: unknown[]
  ledgerMutationRecords: unknown[]
  exportUnlockRecords: unknown[]
  jobEnqueueRecords: unknown[]
  providerCallRecords: unknown[]
  workerRunRecords: unknown[]
  renderExportRecords: unknown[]
}

export function createMockCreditEstimateStore(
  previews: EditCreditEstimatePreview[] = [],
): MockCreditEstimateStore {
  return {
    previews: [...previews],
    walletMutationRecords: [],
    reservationMutationRecords: [],
    ledgerMutationRecords: [],
    exportUnlockRecords: [],
    jobEnqueueRecords: [],
    providerCallRecords: [],
    workerRunRecords: [],
    renderExportRecords: [],
  }
}

export function buildEditCreditEstimatePreview(
  input: PreviewEditCreditEstimateRequest,
): EditCreditEstimatePreview {
  const creditEstimateId = createMockId('credit_estimate_preview')
  const createdAt = nowIso()
  const toolEstimates = input.plannedToolIds.map((toolId) =>
    requireProductionToolEstimate(input, creditEstimateId, toolId as ProductionToolId),
  )
  const toolSnapshots = toolEstimates.map(mapToolEstimateSnapshot)
  const lineItems = toolEstimates.map((estimate) =>
    buildToolEstimateLineItem(input, creditEstimateId, estimate, createdAt),
  )

  const lowToolCostCredits = sum(toolSnapshots.map((estimate) => estimate.lowCredits))
  const expectedToolCostCredits = sum(toolSnapshots.map((estimate) => estimate.expectedCredits))
  const highToolCostCredits = sum(toolSnapshots.map((estimate) => estimate.highCredits))
  const lowFee = calculateServiceFeeEstimate(input, lowToolCostCredits)
  const expectedFee = calculateServiceFeeEstimate(input, expectedToolCostCredits)
  const highFee = calculateServiceFeeEstimate(input, highToolCostCredits)
  const customEstimateRequired = lowFee.customEstimateRequired ||
    expectedFee.customEstimateRequired ||
    highFee.customEstimateRequired
  const lowServiceFeeCredits = lowFee.serviceFeeCredits
  const expectedServiceFeeCredits = expectedFee.serviceFeeCredits
  const highServiceFeeCredits = highFee.serviceFeeCredits
  const minimumEstimatedCredits = lowToolCostCredits + lowServiceFeeCredits
  const totalEstimatedCredits = expectedToolCostCredits + expectedServiceFeeCredits
  const maximumEstimatedCredits = highToolCostCredits + highServiceFeeCredits
  const requiredTopUpCredits = input.availableCreditsSnapshot === undefined
    ? 0
    : Math.max(0, maximumEstimatedCredits - input.availableCreditsSnapshot)
  const hasToolEstimateBlocker = toolSnapshots.some((estimate) =>
    !canProceedToReservationWithToolStatus(estimate.prerequisiteStatus)
  )
  const readinessStatus = resolveReadinessStatus({
    customEstimateRequired,
    requiredTopUpCredits,
    hasToolEstimateBlocker,
  })
  const canProceedToReservation = readinessStatus === 'ready_for_reservation'
  const serviceFeeEstimate: EditCreditEstimateServiceFeeEstimate = {
    lowToolCostCredits,
    expectedToolCostCredits,
    highToolCostCredits,
    lowServiceFeeCredits,
    expectedServiceFeeCredits,
    highServiceFeeCredits,
    customEstimateRequired,
    durationBucket: expectedFee.durationBucket,
    creditPolicyVersion: REEDITPRO_CREDIT_POLICY_VERSION,
    serviceFeePolicyVersion: REEDITPRO_SERVICE_FEE_POLICY_VERSION,
    finalChargeFormula: REEDITPRO_FINAL_CHARGE_FORMULA,
  }
  const topUpSummary: EditCreditEstimateTopUpSummary = {
    availableCreditsSnapshot: input.availableCreditsSnapshot,
    reservedCreditsSnapshot: input.reservedCreditsSnapshot,
    purchasedCreditsSnapshot: input.purchasedCreditsSnapshot,
    weeklyBonusCreditsSnapshot: input.weeklyBonusCreditsSnapshot,
    requiredHoldCredits: maximumEstimatedCredits,
    requiredTopUpCredits,
    canProceedToReservation,
    readinessStatus,
  }
  const lowerCostOptions = buildLowerCostOptions({
    input,
    toolSnapshots,
    expectedToolCostCredits,
    expectedServiceFeeCredits,
    customEstimateRequired,
  })
  const serviceFeeLine = buildServiceFeeLineItem({
    input,
    creditEstimateId,
    expectedServiceFeeCredits,
    serviceFeeEstimate,
    createdAt,
  })
  const allLineItems = [...lineItems, serviceFeeLine]
  const userFacingLines = buildUserFacingEstimateLines({
    expectedToolCostCredits,
    expectedServiceFeeCredits,
    totalEstimatedCredits,
    maximumEstimatedCredits,
    requiredTopUpCredits,
  })
  const warnings = buildEstimateWarnings({
    toolSnapshots,
    customEstimateRequired,
    requiredTopUpCredits,
    hasToolEstimateBlocker,
  })
  const summary = {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    productEditLevel: input.productEditLevel,
    finalVideoDurationSeconds: input.finalVideoDurationSeconds,
    plannedToolCount: input.plannedToolIds.length,
    lowToolCostCredits,
    expectedToolCostCredits,
    highToolCostCredits,
    lowServiceFeeCredits,
    expectedServiceFeeCredits,
    highServiceFeeCredits,
    minimumEstimatedCredits,
    totalEstimatedCredits,
    maximumEstimatedCredits,
    requiredHoldCredits: maximumEstimatedCredits,
    requiredTopUpCredits,
    canProceedToReservation,
    customEstimateRequired,
    readinessStatus,
    userFacingLines,
  }
  const safetyFlags = buildSafetyFlags()
  const estimatePayload = asJsonObject({
    milestone: 'RP-ESTIMATE-01',
    estimateOnly: true,
    idempotencyKey: input.idempotencyKey,
    productEditLevel: input.productEditLevel,
    plannedToolIds: input.plannedToolIds,
    toolEstimates: toolSnapshots,
    serviceFeeEstimate,
    topUpSummary,
    lowerCostOptions,
    safetyFlags,
    reservationPolicyCopy: REEDITPRO_RESERVATION_POLICY_COPY,
    userFacingCopy: {
      title: customEstimateRequired ? 'Custom credit estimate needed' : 'Credit estimate ready',
      body: customEstimateRequired
        ? 'This edit length requires a custom estimate before paid work can start.'
        : 'Review the low, expected, and high estimate before approving future paid work.',
    },
  })
  const estimate: CreditEstimateRecord = {
    id: creditEstimateId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    status: customEstimateRequired || hasToolEstimateBlocker ? 'draft' : 'ready',
    totalEstimatedCredits,
    minimumEstimatedCredits,
    maximumEstimatedCredits,
    availableCreditsSnapshot: input.availableCreditsSnapshot,
    reservedCreditsSnapshot: input.reservedCreditsSnapshot,
    purchasedCreditsSnapshot: input.purchasedCreditsSnapshot,
    weeklyBonusCreditsSnapshot: input.weeklyBonusCreditsSnapshot,
    estimateReason: 'edit_credit_estimate_preview',
    estimatePayload,
    createdByAgent: 'RP-ESTIMATE-01',
    lineItems: allLineItems,
    createdAt,
    updatedAt: createdAt,
    metadata: asJsonObject({
      mockOnly: true,
      estimateOnly: true,
      noWalletMutation: true,
      noReservationMutation: true,
      noLedgerWrite: true,
      noProviderCall: true,
      noWorkerRun: true,
      noRenderOrExport: true,
    }),
  }

  return {
    estimate,
    summary,
    toolEstimates: toolSnapshots,
    serviceFeeEstimate,
    topUpSummary,
    lowerCostOptions,
    safetyFlags,
    idempotencyStatus: 'created',
    warnings,
  }
}

export function insertEditCreditEstimatePreview(
  store: MockCreditEstimateStore,
  preview: EditCreditEstimatePreview,
): EditCreditEstimatePreview {
  store.previews.push(preview)
  return preview
}

export function upsertEditCreditEstimatePreviewByIdempotencyKey(
  store: MockCreditEstimateStore,
  input: PreviewEditCreditEstimateRequest,
): EditCreditEstimatePreview {
  const existing = store.previews.find((preview) =>
    preview.estimate.workspaceId === input.workspaceId &&
    getPreviewIdempotencyKey(preview) === input.idempotencyKey
  )
  if (existing) {
    return {
      ...existing,
      idempotencyStatus: 'duplicate_returned',
      warnings: [
        ...existing.warnings,
        'Duplicate estimate preview idempotency key returned the existing mock estimate; no double-counting occurred.',
      ],
    }
  }

  return insertEditCreditEstimatePreview(store, buildEditCreditEstimatePreview(input))
}

export function listEditCreditEstimatePreviewsForProject(
  store: MockCreditEstimateStore,
  projectId: string,
): EditCreditEstimatePreview[] {
  return store.previews.filter((preview) => preview.estimate.projectId === projectId)
}

export function getLatestEditCreditEstimatePreviewForEditPlan(
  store: MockCreditEstimateStore,
  editPlanId: string,
): EditCreditEstimatePreview | undefined {
  return store.previews
    .filter((preview) => preview.estimate.editPlanId === editPlanId)
    .sort((left, right) => right.estimate.createdAt.localeCompare(left.estimate.createdAt))[0]
}

function requireProductionToolEstimate(
  input: PreviewEditCreditEstimateRequest,
  creditEstimateId: string,
  toolId: ProductionToolId,
): ProductionToolCostEstimate {
  const usage = input.toolUsageInputs?.[toolId]
  const result = estimateProductionToolCost({
    toolId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditEstimateId,
    productEditLevel: input.productEditLevel,
    toolComputeLevel: usage?.toolComputeLevel ?? undefined,
    qualityLevel: usage?.qualityLevel ?? undefined,
    usage: buildActualCostInput(usage),
    estimateOnlyWhenBlocked: true,
    idempotencyKey: `${input.idempotencyKey}:${toolId}`,
    metadata: asJsonObject({
      ...(input.metadata ?? {}),
      ...(usage?.metadata ?? {}),
      milestone: 'RP-ESTIMATE-01',
      estimateOnly: true,
    }),
  })
  if (!result.ok) {
    throw new Error(`Credit estimate preview failed for ${toolId}: ${result.error.message}`)
  }
  return result.data
}

function buildActualCostInput(
  usage?: EditCreditEstimateToolUsageInput,
): CalculateToolActualCostMicrosInput | undefined {
  if (!usage) return undefined
  if (usage.actualInternalCostCents !== undefined) {
    return {
      sourceKind: 'mock_manual_entry',
      actualInternalCostCents: usage.actualInternalCostCents,
    }
  }
  if (hasProviderUsage(usage)) {
    return {
      sourceKind: 'external_provider',
      provider: {
        requestCount: usage.requestCount,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        inputVideoSeconds: usage.inputVideoSeconds,
        outputVideoSeconds: usage.outputVideoSeconds,
        inputAudioSeconds: usage.inputAudioSeconds,
        outputAudioSeconds: usage.outputAudioSeconds,
        imageCount: usage.imageCount,
        provider: usage.provider ?? null,
        model: usage.model ?? null,
      },
      computeLevel: usage.toolComputeLevel ?? undefined,
    }
  }
  if (hasRendererUsage(usage)) {
    return {
      sourceKind: 'deterministic_renderer',
      deterministicRenderer: {
        requestCount: usage.requestCount,
        outputSeconds: usage.outputDurationSeconds ?? usage.renderDurationSeconds ?? 0,
        megapixelFrames: usage.megapixelFrames ?? 0,
        computeLevel: usage.toolComputeLevel ?? undefined,
      },
    }
  }
  if (hasRuntimeUsage(usage)) {
    return {
      sourceKind: 'infrastructure_runtime',
      runtime: {
        wallTimeMilliseconds: Math.ceil((usage.estimatedRuntimeSeconds ?? 1) * 1_000),
        renderSeconds: usage.renderDurationSeconds,
        vcpuCount: usage.vcpuCount,
        memoryGib: usage.memoryGib,
        gpuCount: usage.gpuCount,
        tempStorageGibHours: usage.tempStorageGibHours,
        outputStorageGibHours: usage.outputStorageGibHours,
        networkEgressMib: usage.networkEgressMib,
        computeLevel: usage.toolComputeLevel ?? undefined,
      },
    }
  }
  return undefined
}

function mapToolEstimateSnapshot(
  estimate: ProductionToolCostEstimate,
): EditCreditEstimateToolEstimateSnapshot {
  return {
    toolId: estimate.profile.toolId,
    toolName: estimate.profile.toolName,
    owner: estimate.profile.owner,
    usageCategory: estimate.profile.usageCategory,
    lineItemType: mapToolUsageToLineItemType(estimate.profile.usageCategory),
    productEditLevel: estimate.productEditLevel,
    toolComputeLevel: estimate.toolComputeLevel,
    qualityLevel: estimate.qualityLevel,
    prerequisiteStatus: estimate.creditPrerequisiteStatus,
    lowInternalCostCents: estimate.range.lowInternalCostCents,
    expectedInternalCostCents: estimate.range.expectedInternalCostCents,
    highInternalCostCents: estimate.range.highInternalCostCents,
    lowCredits: estimate.range.lowCredits,
    expectedCredits: estimate.range.expectedCredits,
    highCredits: estimate.range.highCredits,
    rateCardVersion: estimate.rateCardVersion,
    pricingSnapshot: estimate.pricingSnapshot,
    serviceFeeIncluded: false,
    warnings: estimate.warnings,
  }
}

function buildToolEstimateLineItem(
  input: PreviewEditCreditEstimateRequest,
  creditEstimateId: string,
  estimate: ProductionToolCostEstimate,
  createdAt: string,
): CreditEstimateLineItemRecord {
  const lineItemType = mapToolUsageToLineItemType(estimate.profile.usageCategory)
  const usageCategory = mapToolUsageToCreditUsageCategory(estimate.profile.usageCategory)
  return {
    id: createMockId('credit_estimate_line_item'),
    creditEstimateId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    lineItemType,
    usageCategory,
    label: estimate.profile.toolName,
    description: 'Estimated internal tool cost only; ReEditPro service fee is separate.',
    estimatedCredits: estimate.range.expectedCredits,
    isOptional: false,
    isPremium: input.productEditLevel !== 'normal' ||
      estimate.qualityLevel === 'premium' ||
      estimate.riskLevel === 'high',
    requiresUserApproval: true,
    providerHint: estimate.pricingSnapshot.provider ?? undefined,
    modelHint: estimate.pricingSnapshot.model ?? undefined,
    linePayload: asJsonObject({
      milestone: 'RP-ESTIMATE-01',
      lineItemRole: 'production_tool_estimate',
      toolId: estimate.profile.toolId,
      toolOwner: estimate.profile.owner,
      providerBoundary: estimate.profile.providerBoundary,
      providerType: estimate.profile.providerType,
      exactUsageCategory: estimate.profile.usageCategory,
      productEditLevel: estimate.productEditLevel,
      toolComputeLevel: estimate.toolComputeLevel,
      qualityLevel: estimate.qualityLevel,
      prerequisiteStatus: estimate.creditPrerequisiteStatus,
      lowCredits: estimate.range.lowCredits,
      expectedCredits: estimate.range.expectedCredits,
      highCredits: estimate.range.highCredits,
      lowInternalCostCents: estimate.range.lowInternalCostCents,
      expectedInternalCostCents: estimate.range.expectedInternalCostCents,
      highInternalCostCents: estimate.range.highInternalCostCents,
      rateCardVersion: estimate.rateCardVersion,
      pricingSnapshot: estimate.pricingSnapshot,
      serviceFeeIncluded: false,
      warnings: estimate.warnings,
    }),
    createdAt,
  }
}

function buildServiceFeeLineItem(input: {
  input: PreviewEditCreditEstimateRequest
  creditEstimateId: string
  expectedServiceFeeCredits: number
  serviceFeeEstimate: EditCreditEstimateServiceFeeEstimate
  createdAt: string
}): CreditEstimateLineItemRecord {
  return {
    id: createMockId('credit_estimate_line_item'),
    creditEstimateId: input.creditEstimateId,
    workspaceId: input.input.workspaceId,
    projectId: input.input.projectId,
    editPlanId: input.input.editPlanId,
    lineItemType: 'other',
    usageCategory: 'admin',
    label: 'ReEditPro service/edit fee',
    description: 'Separate ReEditPro service fee from credit policy math.',
    estimatedCredits: input.expectedServiceFeeCredits,
    isOptional: false,
    isPremium: input.input.productEditLevel !== 'normal',
    requiresUserApproval: true,
    linePayload: asJsonObject({
      milestone: 'RP-ESTIMATE-01',
      lineItemRole: 'reeditpro_service_fee',
      productEditLevel: input.input.productEditLevel,
      serviceFeeIncluded: true,
      toolCostsIncludeServiceFee: false,
      creditPolicyVersion: REEDITPRO_CREDIT_POLICY_VERSION,
      serviceFeePolicyVersion: REEDITPRO_SERVICE_FEE_POLICY_VERSION,
      serviceFeeEstimate: input.serviceFeeEstimate,
      finalChargeFormula: REEDITPRO_FINAL_CHARGE_FORMULA,
    }),
    createdAt: input.createdAt,
  }
}

function calculateServiceFeeEstimate(
  input: PreviewEditCreditEstimateRequest,
  toolCostCredits: number,
): {
  serviceFeeCredits: number
  customEstimateRequired: boolean
  durationBucket: string
} {
  const calculation = calculateReEditProServiceFeeCredits({
    actualToolCostCredits: toolCostCredits,
    durationSeconds: input.finalVideoDurationSeconds,
    editLevel: input.productEditLevel,
  })
  return {
    serviceFeeCredits: calculation.serviceFeeCredits ?? 0,
    customEstimateRequired: calculation.customEstimateRequired,
    durationBucket: calculation.durationBucket,
  }
}

function buildLowerCostOptions(input: {
  input: PreviewEditCreditEstimateRequest
  toolSnapshots: EditCreditEstimateToolEstimateSnapshot[]
  expectedToolCostCredits: number
  expectedServiceFeeCredits: number
  customEstimateRequired: boolean
}): EditCreditEstimateLowerCostOption[] {
  const options: EditCreditEstimateLowerCostOption[] = []
  const targetLevel = getDowngradeTarget(input.input.productEditLevel)
  if (targetLevel) {
    const targetFee = calculateServiceFeeEstimate(
      { ...input.input, productEditLevel: targetLevel },
      input.expectedToolCostCredits,
    )
    options.push({
      id: `downgrade-to-${targetLevel}`,
      label: `Switch to ${formatProductEditLevel(targetLevel)}`,
      description: 'Lower the product edit level while keeping the same tool estimate snapshot.',
      action: 'downgrade_product_edit_level',
      affectedToolIds: input.toolSnapshots.map((estimate) => estimate.toolId),
      targetProductEditLevel: targetLevel,
      estimatedSavingsCredits: Math.max(0, input.expectedServiceFeeCredits - targetFee.serviceFeeCredits),
    })
  }

  const highRiskTools = input.toolSnapshots.filter((estimate) =>
    estimate.qualityLevel === 'premium' ||
    estimate.prerequisiteStatus === 'estimate_only_blocked' ||
    estimate.prerequisiteStatus === 'estimate_only' ||
    estimate.highCredits > estimate.expectedCredits * 2
  )
  if (highRiskTools.length > 0) {
    options.push({
      id: 'reduce-premium-or-high-risk-tools',
      label: 'Reduce premium tool scope',
      description: 'Remove or simplify premium, high-risk, or estimate-only tool work before approval.',
      action: 'reduce_tool_scope',
      affectedToolIds: highRiskTools.map((estimate) => estimate.toolId),
      estimatedSavingsCredits: sum(highRiskTools.map((estimate) => estimate.expectedCredits)),
    })
  }

  const renderTools = input.toolSnapshots.filter((estimate) =>
    estimate.usageCategory === 'rendering' ||
    estimate.usageCategory === 'render_export' ||
    estimate.lineItemType === 'final_export' ||
    estimate.lineItemType === 'render_preview'
  )
  if (renderTools.length > 0) {
    options.push({
      id: 'lower-render-quality',
      label: 'Lower render quality',
      description: 'Use a lower-cost render profile or preview-only render before final export approval.',
      action: 'lower_render_quality',
      affectedToolIds: renderTools.map((estimate) => estimate.toolId),
      estimatedSavingsCredits: Math.ceil(sum(renderTools.map((estimate) => estimate.expectedCredits)) * 0.25),
    })
  }

  const audioTools = input.toolSnapshots.filter((estimate) =>
    estimate.usageCategory === 'soundsync' ||
    estimate.lineItemType === 'music' ||
    estimate.lineItemType === 'sfx' ||
    estimate.lineItemType === 'soundsync'
  )
  if (audioTools.length > 0) {
    options.push({
      id: 'reduce-audio-scope',
      label: 'Reduce music and SFX scope',
      description: 'Keep voice-safe cleanup while reducing optional music, SFX, or SoundSync polish.',
      action: 'reduce_audio_scope',
      affectedToolIds: audioTools.map((estimate) => estimate.toolId),
      estimatedSavingsCredits: Math.ceil(sum(audioTools.map((estimate) => estimate.expectedCredits)) * 0.2),
    })
  }

  if (input.customEstimateRequired) {
    options.push({
      id: 'request-custom-estimate-review',
      label: 'Request custom estimate review',
      description: 'This duration requires owner review before paid work or reservation approval.',
      action: 'custom_estimate_review',
      affectedToolIds: input.toolSnapshots.map((estimate) => estimate.toolId),
    })
  }

  return options
}

function buildUserFacingEstimateLines(input: {
  expectedToolCostCredits: number
  expectedServiceFeeCredits: number
  totalEstimatedCredits: number
  maximumEstimatedCredits: number
  requiredTopUpCredits: number
}): EditCreditCostSummaryLine[] {
  return [
    {
      label: 'Estimated tool cost',
      credits: input.expectedToolCostCredits,
      description: 'Expected internal production tool cost; service fee not included.',
    },
    {
      label: 'ReEditPro service/edit fee',
      credits: input.expectedServiceFeeCredits,
      description: 'Credit-policy fee calculated separately from tool owner costs.',
    },
    {
      label: 'Expected total',
      credits: input.totalEstimatedCredits,
      description: 'Expected tool cost plus ReEditPro service/edit fee.',
    },
    {
      label: 'Required hold',
      credits: input.maximumEstimatedCredits,
      description: 'Future reservation would hold the high estimate, not the expected estimate.',
    },
    {
      label: 'Top up needed',
      credits: input.requiredTopUpCredits,
      description: 'Informational only; this milestone cannot add credits or unlock export.',
    },
  ]
}

function buildEstimateWarnings(input: {
  toolSnapshots: EditCreditEstimateToolEstimateSnapshot[]
  customEstimateRequired: boolean
  requiredTopUpCredits: number
  hasToolEstimateBlocker: boolean
}): string[] {
  return Array.from(new Set([
    'RP-ESTIMATE-01 preview is mock-only; no wallet, reservation, ledger, provider, worker, render/export, Stripe, Supabase, or credit spend side effect occurred.',
    'Tool-cost estimates exclude ReEditPro service fee; service fee is calculated separately by RP-CREDITPOLICY-01.',
    ...(input.customEstimateRequired
      ? ['Custom duration requires owner review before paid work or future credit reservation.']
      : []),
    ...(input.requiredTopUpCredits > 0
      ? ['Required top-up is informational only; no checkout, credit purchase, or export unlock occurred.']
      : []),
    ...(input.hasToolEstimateBlocker
      ? ['One or more production tools are estimate-only or otherwise not ready for paid reservation.']
      : []),
    ...input.toolSnapshots.flatMap((estimate) => estimate.warnings),
  ]))
}

function resolveReadinessStatus(input: {
  customEstimateRequired: boolean
  requiredTopUpCredits: number
  hasToolEstimateBlocker: boolean
}): EditCreditEstimateReadinessStatus {
  if (input.customEstimateRequired) return 'custom_estimate_required'
  if (input.hasToolEstimateBlocker) return 'estimate_only_blocked'
  if (input.requiredTopUpCredits > 0) return 'needs_top_up'
  return 'ready_for_reservation'
}

function canProceedToReservationWithToolStatus(status: string): boolean {
  return status === 'ready' || status === 'missing_active_credit_reservation'
}

function buildSafetyFlags(): EditCreditEstimateSafetyFlags {
  return {
    estimateOnly: true,
    creditsReservedOrSpent: false,
    walletMutated: false,
    reservationMutated: false,
    ledgerWritten: false,
    providerCalled: false,
    workerRun: false,
    renderOrExportStarted: false,
    supabaseWritten: false,
    serviceFeeIncludedInToolCosts: false,
  }
}

function mapToolUsageToLineItemType(usageCategory: ToolCostUsageCategory): CreditEstimateLineItemType {
  switch (usageCategory) {
    case 'transcription':
      return 'transcript'
    case 'captions':
      return 'captions'
    case 'rendering':
    case 'render_export':
      return 'final_export'
    case 'stroke_motion':
      return 'stroke_motion'
    case 'graphic_design':
      return 'graphic_design'
    case 'real_motion':
      return 'real_motion'
    case 'soundsync':
      return 'soundsync'
    case 'revision':
      return 'revision'
    case 'media_analysis':
      return 'other'
    case 'basic_edit':
    case 'pro_edit':
    case 'signature_edit':
    case 'premium_signature_edit':
    case 'admin':
    case 'other':
      return 'planning'
  }
}

function mapToolUsageToCreditUsageCategory(usageCategory: ToolCostUsageCategory): CreditUsageCategory {
  switch (usageCategory) {
    case 'transcription':
    case 'captions':
    case 'media_analysis':
    case 'render_export':
      return usageCategory === 'render_export' ? 'rendering' : 'other'
    default:
      return usageCategory
  }
}

function getDowngradeTarget(
  productEditLevel: ReEditProCanonicalEditLevel,
): ReEditProCanonicalEditLevel | undefined {
  if (productEditLevel === 'ultra_premium') return 'premium'
  if (productEditLevel === 'premium') return 'normal'
  return undefined
}

function formatProductEditLevel(productEditLevel: ReEditProCanonicalEditLevel): string {
  return productEditLevel
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function hasProviderUsage(usage: EditCreditEstimateToolUsageInput): boolean {
  return [
    usage.requestCount,
    usage.inputTokens,
    usage.outputTokens,
    usage.inputVideoSeconds,
    usage.outputVideoSeconds,
    usage.inputAudioSeconds,
    usage.outputAudioSeconds,
    usage.imageCount,
  ].some((value) => value !== undefined)
}

function hasRendererUsage(usage: EditCreditEstimateToolUsageInput): boolean {
  return usage.renderDurationSeconds !== undefined ||
    usage.outputDurationSeconds !== undefined ||
    usage.megapixelFrames !== undefined
}

function hasRuntimeUsage(usage: EditCreditEstimateToolUsageInput): boolean {
  return usage.estimatedRuntimeSeconds !== undefined ||
    usage.vcpuCount !== undefined ||
    usage.memoryGib !== undefined ||
    usage.gpuCount !== undefined ||
    usage.tempStorageGibHours !== undefined ||
    usage.outputStorageGibHours !== undefined ||
    usage.networkEgressMib !== undefined
}

function getPreviewIdempotencyKey(preview: EditCreditEstimatePreview): string | undefined {
  const idempotencyKey = preview.estimate.estimatePayload?.idempotencyKey
  return typeof idempotencyKey === 'string' ? idempotencyKey : undefined
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function asJsonObject(value: Record<string, unknown>): JSONObject {
  return value as JSONObject
}
