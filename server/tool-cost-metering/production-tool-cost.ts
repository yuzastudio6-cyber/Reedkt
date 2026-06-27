import { randomUUID } from 'node:crypto'

import {
  REEDITPRO_EDIT_LEVELS,
  type JSONObject,
  type ReEditProCanonicalEditLevel,
} from '../../src/types'
import {
  getProductionToolProfile,
  listProductionToolProfiles,
  type ProductionRegistryWorkerType,
  type ProductionToolCategory,
  type ProductionToolExecutionMode,
  type ProductionToolId,
  type ProductionToolProfile,
} from '../tool-registry'
import { evaluateRuntimePolicy, getRuntimePolicyForTool } from '../tool-registry/tool-runtime-policy'
import { calculateEstimateRangeFromExpectedCost, calculateToolActualCostMicros } from './cost-math'
import {
  createMockToolCostEvent,
  createMockToolCostStore,
  getMockToolCostEventByIdempotencyKey,
  insertMockToolCostEvent,
  type MockToolCostStore,
} from './mock-tool-cost-store'
import {
  TOOL_COST_RATE_CARD,
  TOOL_COST_RATE_CARD_VERSION,
  TOOL_RUNTIME_COMPUTE_LEVELS,
} from './rate-card'
import { validateToolCostNoSecretLikeFields } from './secret-safety'
import type {
  CalculateToolActualCostMicrosInput,
  MockToolCostEvent,
  ToolCostEstimateRange,
  ToolCostFailureCategory,
  ToolCostRiskLevel,
  ToolCostUsageCategory,
  ToolRuntimeComputeLevel,
} from './types'

export const TOOL_CREDIT_PREREQUISITE_STATUSES = [
  'ready',
  'estimate_only',
  'missing_approved_plan',
  'missing_approved_credit_estimate',
  'missing_active_credit_reservation',
  'missing_idempotency_key',
  'production_blocked',
  'requires_revised_estimate',
  'invalid_context',
] as const

export type ToolCreditPrerequisiteStatus = typeof TOOL_CREDIT_PREREQUISITE_STATUSES[number]

export type ProductionToolCostProviderType =
  | 'api_boundary'
  | 'browser_preview'
  | 'deterministic_renderer'
  | 'gpu_model_runtime'
  | 'local_runtime'
  | 'planning_metadata'
  | 'qa_runtime'
  | 'readiness_metadata'

export type ProductionToolCostQualityLevel = ToolRuntimeComputeLevel

export interface ProductionToolMeteringProfile {
  toolId: ProductionToolId
  toolName: string
  owner: ProductionRegistryWorkerType
  usageCategory: ToolCostUsageCategory
  providerBoundary: ProductionToolExecutionMode
  providerType: ProductionToolCostProviderType
  defaultProviderName: string | null
  defaultModelName: string | null
  defaultToolComputeLevel: ToolRuntimeComputeLevel
  defaultQualityLevel: ProductionToolCostQualityLevel
  defaultRiskLevel: ToolCostRiskLevel
  requiresApprovedPlan: boolean
  requiresApprovedCreditEstimate: boolean
  requiresActiveCreditReservation: boolean
  requiresIdempotencyKey: boolean
  serviceFeeIncluded: false
  productionBlockerStatus: ProductionToolProfile['productionStatus']
  canRunInExternalBeta: boolean
  estimateOnlyWhenBlocked: boolean
  runtimeAllowed: boolean
  runtimeWarnings: string[]
  runtimeBlockingReasons: string[]
}

export interface ProductionToolCostBaseInput {
  toolId: ProductionToolId | string
  workspaceId: string
  projectId: string
  editPlanId?: string | null
  approvedPlanSnapshotId?: string | null
  jobId?: string | null
  jobBatchId?: string | null
  generationRequestId?: string | null
  renderJobId?: string | null
  creditEstimateId?: string | null
  creditReservationId?: string | null
  productEditLevel: ReEditProCanonicalEditLevel
  toolComputeLevel?: ToolRuntimeComputeLevel | string | null
  qualityLevel?: ProductionToolCostQualityLevel | string | null
  usage?: CalculateToolActualCostMicrosInput
  approvedReservationRemainingCredits?: number | null
  idempotencyKey?: string | null
  metadata?: JSONObject
}

export interface EstimateProductionToolCostInput extends ProductionToolCostBaseInput {
  estimateOnlyWhenBlocked?: boolean
}

export interface ProductionToolCostEstimate {
  profile: ProductionToolMeteringProfile
  productEditLevel: ReEditProCanonicalEditLevel
  toolComputeLevel: ToolRuntimeComputeLevel
  qualityLevel: ProductionToolCostQualityLevel
  sourceKind: CalculateToolActualCostMicrosInput['sourceKind']
  expectedInternalCostMicros: number
  lowInternalCostMicros: number
  highInternalCostMicros: number
  range: ToolCostEstimateRange
  riskLevel: ToolCostRiskLevel
  rateCardVersion: string
  pricingSnapshot: ToolCostEstimateRange['pricingSnapshot']
  serviceFeeIncluded: false
  creditPrerequisiteStatus: ToolCreditPrerequisiteStatus
  canRunWithinApprovedReservation: boolean | null
  warnings: string[]
}

export interface EmitProductionToolCostEventInput extends ProductionToolCostBaseInput {
  store?: MockToolCostStore
  runtime?: JSONObject
  providerResult?: JSONObject
  retryAttempt?: number
  retryReason?: string | null
  failureCategory?: ToolCostFailureCategory
  billableToUser?: boolean
  nonBillableReason?: string
}

export interface ProductionToolCostEventEmission {
  profile: ProductionToolMeteringProfile
  estimate: ProductionToolCostEstimate
  event: MockToolCostEvent
  idempotencyStatus: 'inserted' | 'duplicate_returned'
  serviceFeeIncluded: false
  warnings: string[]
}

export type ProductionToolCostErrorCode =
  | 'unknown_tool'
  | 'invalid_context'
  | 'credit_prerequisite_failed'
  | 'secret_like_metadata'
  | 'forbidden_tool_cost_metadata'
  | 'tool_cost_math_failed'

export interface ProductionToolCostError {
  code: ProductionToolCostErrorCode
  message: string
  status: ToolCreditPrerequisiteStatus
  field?: string
  warnings: string[]
}

export type ProductionToolCostResult<TData> =
  | { ok: true; data: TData }
  | { ok: false; error: ProductionToolCostError }

const usageCategoryByProductionCategory: Record<ProductionToolCategory, ToolCostUsageCategory> = {
  audio_analysis: 'soundsync',
  audio_cleanup: 'soundsync',
  background_removal: 'media_analysis',
  browser_capture: 'graphic_design',
  captions: 'captions',
  charts_dataviz: 'graphic_design',
  color_management: 'media_analysis',
  core_media: 'rendering',
  enhancement: 'media_analysis',
  evaluation: 'media_analysis',
  frame_interpolation: 'media_analysis',
  image_processing: 'graphic_design',
  maps_geospatial: 'graphic_design',
  mask_refinement: 'media_analysis',
  motion_graphics: 'graphic_design',
  music_separation: 'soundsync',
  ocr: 'graphic_design',
  qa: 'admin',
  render_composition: 'rendering',
  scene_detection: 'media_analysis',
  segmentation_tracking: 'media_analysis',
  speech_transcription: 'transcription',
  timeline: 'media_analysis',
  visual_analysis: 'media_analysis',
}

const forbiddenUserMetadataKeys = new Set([
  'authorization',
  'credentials',
  'finalChargeCredits',
  'ledgerId',
  'providerHeaders',
  'rawProviderPayload',
  'reeditproServiceFeeCredits',
  'serviceFeeCredits',
  'serviceFeeIncluded',
  'walletId',
])

export function listProductionToolMeteringProfiles(): ProductionToolMeteringProfile[] {
  return listProductionToolProfiles().map(normalizeProductionToolMeteringProfile)
}

export function getProductionToolMeteringProfile(
  toolId: ProductionToolId | string,
): ProductionToolMeteringProfile | undefined {
  const profile = getProductionToolProfile(toolId)
  return profile ? normalizeProductionToolMeteringProfile(profile) : undefined
}

export function normalizeProductionToolMeteringProfile(
  profile: ProductionToolProfile,
): ProductionToolMeteringProfile {
  const runtimePolicy = getRuntimePolicyForTool(profile)
  const runtimeEvaluation = evaluateRuntimePolicy(profile, profile.workerType)
  const defaultRiskLevel = deriveDefaultRiskLevel(profile, runtimeEvaluation.allowed)
  const canRunInExternalBeta = Boolean(
    runtimeEvaluation.allowed &&
    runtimePolicy.productionExecutionAllowed &&
    profile.launchCore &&
    profile.productionStatus === 'launch_core' &&
    profile.commercialUseStatus !== 'blocked' &&
    profile.commercialUseStatus !== 'needs_review' &&
    profile.commercialUseStatus !== 'unknown' &&
    profile.licenseRisk !== 'blocked' &&
    profile.licenseRisk !== 'high' &&
    profile.licenseRisk !== 'unknown' &&
    (!profile.modelWeightPolicy.required || profile.modelWeightPolicy.reviewStatus === 'approved'),
  )

  return {
    toolId: profile.toolId,
    toolName: profile.displayName,
    owner: profile.workerType,
    usageCategory: usageCategoryByProductionCategory[profile.category],
    providerBoundary: profile.executionMode,
    providerType: deriveProviderType(profile),
    defaultProviderName: null,
    defaultModelName: profile.modelWeightPolicy.required ? profile.displayName : null,
    defaultToolComputeLevel: deriveDefaultComputeLevel(profile),
    defaultQualityLevel: deriveDefaultQualityLevel(profile),
    defaultRiskLevel,
    requiresApprovedPlan: runtimePolicy.approvedSnapshotRequired,
    requiresApprovedCreditEstimate: runtimePolicy.approvedSnapshotRequired &&
      profile.workerType !== 'tool_readiness_worker',
    requiresActiveCreditReservation: runtimePolicy.creditReservationRequired ||
      profile.workerType === 'render_worker',
    requiresIdempotencyKey: true,
    serviceFeeIncluded: false,
    productionBlockerStatus: profile.productionStatus,
    canRunInExternalBeta,
    estimateOnlyWhenBlocked: !canRunInExternalBeta || !runtimePolicy.productionExecutionAllowed,
    runtimeAllowed: runtimeEvaluation.allowed,
    runtimeWarnings: runtimeEvaluation.warnings,
    runtimeBlockingReasons: runtimeEvaluation.blockingReasons,
  }
}

export function estimateProductionToolCost(
  input: EstimateProductionToolCostInput,
): ProductionToolCostResult<ProductionToolCostEstimate> {
  const profile = getProductionToolMeteringProfile(input.toolId)
  if (!profile) {
    return failProductionToolCost('unknown_tool', `Unknown production tool: ${input.toolId}`, 'invalid_context', 'toolId')
  }

  const contextValidation = validateProductionToolCostContext(input)
  if (!contextValidation.ok) return contextValidation

  const toolComputeLevel = (input.toolComputeLevel ?? profile.defaultToolComputeLevel) as ToolRuntimeComputeLevel
  const qualityLevel = (input.qualityLevel ?? profile.defaultQualityLevel) as ProductionToolCostQualityLevel
  const usage = input.usage ?? buildDefaultActualCostInput(profile, toolComputeLevel)
  const calculated = calculateToolActualCostMicros(usage)
  if (!calculated.ok) {
    return failProductionToolCost('tool_cost_math_failed', calculated.error.message, 'invalid_context', calculated.error.field)
  }

  const expectedInternalCostMicros = applyBasisPoints(
    calculated.data.actualInternalCostMicros,
    TOOL_COST_RATE_CARD.qualityMultipliersBasisPoints[qualityLevel],
  )
  const riskLevel = input.usage ? profile.defaultRiskLevel : profile.defaultRiskLevel
  const estimateRange = calculateEstimateRangeFromExpectedCost({
    expectedInternalCostMicros,
    riskLevel,
    approvedReservationCredits: input.approvedReservationRemainingCredits ?? undefined,
    sourceKind: calculated.data.sourceKind,
    provider: calculated.data.provider ?? profile.defaultProviderName,
    model: calculated.data.model ?? profile.defaultModelName,
    computeLevel: calculated.data.computeLevel ?? toolComputeLevel,
  })
  if (!estimateRange.ok) {
    return failProductionToolCost('tool_cost_math_failed', estimateRange.error.message, 'invalid_context', estimateRange.error.field)
  }

  const lowInternalCostMicros = Math.min(applyBasisPoints(expectedInternalCostMicros, 8_000), expectedInternalCostMicros)
  const highInternalCostMicros = Math.max(
    expectedInternalCostMicros + applyBasisPoints(expectedInternalCostMicros, TOOL_COST_RATE_CARD.riskBuffersBasisPoints[riskLevel]),
    expectedInternalCostMicros,
  )
  const prerequisiteStatus = evaluateCreditPrerequisiteStatus({
    profile,
    input,
    estimateOnlyAllowed: input.estimateOnlyWhenBlocked ?? true,
    billableToUser: true,
  })
  const reservationStatus = estimateRange.data.canRunWithinApprovedReservation === false
    ? 'requires_revised_estimate'
    : prerequisiteStatus
  const warnings = buildEstimateWarnings(profile, reservationStatus, estimateRange.data.canRunWithinApprovedReservation)

  return okProductionToolCost({
    profile,
    productEditLevel: input.productEditLevel,
    toolComputeLevel,
    qualityLevel,
    sourceKind: calculated.data.sourceKind,
    expectedInternalCostMicros,
    lowInternalCostMicros,
    highInternalCostMicros,
    range: estimateRange.data,
    riskLevel,
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    pricingSnapshot: estimateRange.data.pricingSnapshot,
    serviceFeeIncluded: false,
    creditPrerequisiteStatus: reservationStatus,
    canRunWithinApprovedReservation: estimateRange.data.canRunWithinApprovedReservation,
    warnings,
  })
}

export function emitProductionToolCostEvent(
  input: EmitProductionToolCostEventInput,
): ProductionToolCostResult<ProductionToolCostEventEmission> {
  const store = input.store ?? createMockToolCostStore()
  const estimate = estimateProductionToolCost(input)
  if (!estimate.ok) return estimate

  const billableToUser = input.billableToUser ?? true
  const billablePrerequisiteStatus = estimate.data.creditPrerequisiteStatus === 'estimate_only' &&
    !estimate.data.profile.runtimeAllowed
    ? 'production_blocked'
    : estimate.data.creditPrerequisiteStatus
  if (billableToUser && billablePrerequisiteStatus !== 'ready') {
    return failProductionToolCost(
      'credit_prerequisite_failed',
      `Billable production tool cost event blocked: ${billablePrerequisiteStatus}.`,
      billablePrerequisiteStatus,
      'creditPrerequisiteStatus',
      estimate.data.warnings,
    )
  }

  if (input.idempotencyKey) {
    const existing = getMockToolCostEventByIdempotencyKey(
      store,
      input.workspaceId,
      input.projectId,
      input.idempotencyKey,
    )
    if (existing) {
      return okProductionToolCost({
        profile: estimate.data.profile,
        estimate: estimate.data,
        event: existing,
        idempotencyStatus: 'duplicate_returned',
        serviceFeeIncluded: false,
        warnings: ['Duplicate idempotency key returned the existing mock tool-cost event.'],
      })
    }
  }

  const usage = input.usage ?? buildDefaultActualCostInput(estimate.data.profile, estimate.data.toolComputeLevel)
  const event = createMockToolCostEvent({
    id: `toolcost_${estimate.data.profile.toolId}_${randomUUID()}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    creditEstimateId: input.creditEstimateId ?? null,
    creditReservationId: input.creditReservationId ?? null,
    label: `${estimate.data.profile.toolName} actual internal tool cost`,
    usageCategory: estimate.data.profile.usageCategory,
    lineItemType: estimate.data.profile.usageCategory === 'media_analysis' ? 'media_analysis' : undefined,
    computeLevel: estimate.data.toolComputeLevel,
    billableToUser,
    actualCostInput: usage,
    failureCategory: input.failureCategory ?? 'none',
    retryAttempt: input.retryAttempt ?? 0,
    idempotencyKey: input.idempotencyKey ?? null,
    nonBillableReason: billableToUser
      ? undefined
      : input.nonBillableReason ?? estimate.data.creditPrerequisiteStatus,
    metadata: buildEventMetadata(input, estimate.data),
  })

  insertMockToolCostEvent(store, event)
  return okProductionToolCost({
    profile: estimate.data.profile,
    estimate: estimate.data,
    event,
    idempotencyStatus: 'inserted',
    serviceFeeIncluded: false,
    warnings: estimate.data.warnings,
  })
}

function validateProductionToolCostContext(
  input: ProductionToolCostBaseInput,
): ProductionToolCostResult<true> {
  if (!isProductEditLevel(input.productEditLevel)) {
    return failProductionToolCost(
      'invalid_context',
      'productEditLevel must be normal, premium, or ultra_premium; it is not a tool runtime compute level.',
      'invalid_context',
      'productEditLevel',
    )
  }

  if (input.toolComputeLevel !== undefined && input.toolComputeLevel !== null && !isRuntimeComputeLevel(input.toolComputeLevel)) {
    return failProductionToolCost(
      'invalid_context',
      'toolComputeLevel must be economy, standard, or premium.',
      'invalid_context',
      'toolComputeLevel',
    )
  }

  if (input.qualityLevel !== undefined && input.qualityLevel !== null && !isRuntimeComputeLevel(input.qualityLevel)) {
    return failProductionToolCost(
      'invalid_context',
      'qualityLevel must be economy, standard, or premium.',
      'invalid_context',
      'qualityLevel',
    )
  }

  const secretSafety = validateToolCostNoSecretLikeFields({
    metadata: input.metadata ?? {},
    providerResult: 'providerResult' in input ? (input as EmitProductionToolCostEventInput).providerResult ?? {} : {},
    runtime: 'runtime' in input ? (input as EmitProductionToolCostEventInput).runtime ?? {} : {},
  })
  if (!secretSafety.ok) {
    return failProductionToolCost(
      'secret_like_metadata',
      `Tool-cost adapter metadata contains secret-like fields: ${secretSafety.secretLikePaths.join(', ')}`,
      'invalid_context',
      'metadata',
    )
  }

  const forbiddenMetadataPaths = findForbiddenMetadataPaths({
    metadata: input.metadata ?? {},
    providerResult: 'providerResult' in input ? (input as EmitProductionToolCostEventInput).providerResult ?? {} : {},
    runtime: 'runtime' in input ? (input as EmitProductionToolCostEventInput).runtime ?? {} : {},
  })
  if (forbiddenMetadataPaths.length > 0) {
    return failProductionToolCost(
      'forbidden_tool_cost_metadata',
      `Tool-cost adapter metadata contains forbidden billing/provider fields: ${forbiddenMetadataPaths.join(', ')}`,
      'invalid_context',
      'metadata',
    )
  }

  return okProductionToolCost(true)
}

function evaluateCreditPrerequisiteStatus(input: {
  profile: ProductionToolMeteringProfile
  input: ProductionToolCostBaseInput
  estimateOnlyAllowed: boolean
  billableToUser: boolean
}): ToolCreditPrerequisiteStatus {
  const { profile } = input
  if (profile.estimateOnlyWhenBlocked && input.estimateOnlyAllowed) return 'estimate_only'
  if (!profile.runtimeAllowed && input.billableToUser) return 'production_blocked'
  if (profile.requiresIdempotencyKey && !input.input.idempotencyKey) return 'missing_idempotency_key'
  if (profile.requiresApprovedPlan && !input.input.approvedPlanSnapshotId && !input.input.editPlanId) {
    return 'missing_approved_plan'
  }
  if (profile.requiresApprovedCreditEstimate && !input.input.creditEstimateId) {
    return 'missing_approved_credit_estimate'
  }
  if (profile.requiresActiveCreditReservation && !input.input.creditReservationId) {
    return 'missing_active_credit_reservation'
  }
  return 'ready'
}

function buildDefaultActualCostInput(
  profile: ProductionToolMeteringProfile,
  computeLevel: ToolRuntimeComputeLevel,
): CalculateToolActualCostMicrosInput {
  switch (profile.owner) {
    case 'gpu_ai_worker':
      return {
        sourceKind: 'infrastructure_runtime',
        runtime: {
          wallTimeMilliseconds: 2_500,
          renderSeconds: 0,
          vcpuCount: 2,
          memoryGib: 8,
          gpuCount: 1,
          computeLevel,
        },
        riskLevel: profile.defaultRiskLevel,
      }
    case 'render_worker':
      return {
        sourceKind: 'deterministic_renderer',
        deterministicRenderer: {
          requestCount: 1,
          outputSeconds: 6,
          megapixelFrames: 180,
          computeLevel,
        },
        riskLevel: profile.defaultRiskLevel,
      }
    case 'cpu_analysis_worker':
      return {
        sourceKind: 'infrastructure_runtime',
        runtime: {
          wallTimeMilliseconds: 1_500,
          renderSeconds: 0,
          vcpuCount: 1,
          memoryGib: 2,
          gpuCount: 0,
          computeLevel,
        },
        riskLevel: profile.defaultRiskLevel,
      }
    case 'qa_worker':
      return {
        sourceKind: 'infrastructure_runtime',
        runtime: {
          wallTimeMilliseconds: 1_000,
          renderSeconds: 0,
          vcpuCount: 1,
          memoryGib: 1,
          gpuCount: 0,
          computeLevel,
        },
        riskLevel: profile.defaultRiskLevel,
      }
    case 'api_service':
    case 'frontend_preview_only':
    case 'planning_only':
    case 'tool_readiness_worker':
      return {
        sourceKind: 'mock_manual_entry',
        actualInternalCostCents: 0,
        riskLevel: profile.defaultRiskLevel,
      }
  }
}

function deriveProviderType(profile: ProductionToolProfile): ProductionToolCostProviderType {
  switch (profile.workerType) {
    case 'api_service':
      return 'api_boundary'
    case 'cpu_analysis_worker':
      return 'local_runtime'
    case 'frontend_preview_only':
      return 'browser_preview'
    case 'gpu_ai_worker':
      return 'gpu_model_runtime'
    case 'planning_only':
      return 'planning_metadata'
    case 'qa_worker':
      return 'qa_runtime'
    case 'render_worker':
      return 'deterministic_renderer'
    case 'tool_readiness_worker':
      return 'readiness_metadata'
  }
}

function deriveDefaultComputeLevel(profile: ProductionToolProfile): ToolRuntimeComputeLevel {
  if (profile.workerType === 'gpu_ai_worker' || profile.gpuRequired) return 'premium'
  if (profile.workerType === 'render_worker') return 'standard'
  if (profile.workerType === 'frontend_preview_only' || profile.workerType === 'planning_only') return 'economy'
  if (profile.workerType === 'tool_readiness_worker' || profile.workerType === 'qa_worker') return 'economy'
  return profile.launchCore ? 'standard' : 'economy'
}

function deriveDefaultQualityLevel(profile: ProductionToolProfile): ProductionToolCostQualityLevel {
  if (profile.workerType === 'gpu_ai_worker') return 'premium'
  if (profile.workerType === 'render_worker') return 'standard'
  return 'economy'
}

function deriveDefaultRiskLevel(profile: ProductionToolProfile, runtimeAllowed: boolean): ToolCostRiskLevel {
  if (
    !runtimeAllowed ||
    profile.productionStatus === 'blocked' ||
    profile.productionStatus === 'evaluation_only' ||
    profile.productionStatus === 'needs_license_review' ||
    profile.licenseRisk === 'blocked' ||
    profile.licenseRisk === 'high' ||
    profile.licenseRisk === 'unknown' ||
    profile.commercialUseStatus === 'blocked' ||
    profile.commercialUseStatus === 'needs_review' ||
    profile.commercialUseStatus === 'unknown' ||
    (profile.modelWeightPolicy.required && profile.modelWeightPolicy.reviewStatus !== 'approved')
  ) {
    return 'high'
  }
  if (
    profile.productionStatus !== 'launch_core' ||
    profile.licenseRisk === 'medium' ||
    profile.commercialUseStatus === 'allowed_with_review'
  ) {
    return 'medium'
  }
  return 'low'
}

function buildEstimateWarnings(
  profile: ProductionToolMeteringProfile,
  status: ToolCreditPrerequisiteStatus,
  canRunWithinApprovedReservation: boolean | null,
): string[] {
  const warnings = [
    ...profile.runtimeWarnings,
    ...profile.runtimeBlockingReasons,
  ]
  if (status !== 'ready') {
    warnings.push(`Tool-cost estimate is not approved paid execution: ${status}.`)
  }
  if (canRunWithinApprovedReservation === false) {
    warnings.push('Estimated high cost exceeds approved reservation; a revised estimate is required before paid work.')
  }
  warnings.push('Mock-safe estimate only; no wallet, reservation, ledger, settlement, provider, render, or worker side effect occurred.')
  warnings.push('ReEditPro service fee is excluded from production tool-cost estimates and events.')
  return Array.from(new Set(warnings))
}

function buildEventMetadata(
  input: EmitProductionToolCostEventInput,
  estimate: ProductionToolCostEstimate,
): JSONObject {
  return {
    ...(input.metadata ?? {}),
    mockOnly: true,
    milestone: 'RP-TOOLCOST-01',
    toolId: estimate.profile.toolId,
    toolOwner: estimate.profile.owner,
    providerBoundary: estimate.profile.providerBoundary,
    providerType: estimate.profile.providerType,
    productEditLevel: estimate.productEditLevel,
    toolComputeLevel: estimate.toolComputeLevel,
    qualityLevel: estimate.qualityLevel,
    creditPrerequisiteStatus: estimate.creditPrerequisiteStatus,
    providerResultSummary: input.providerResult
      ? {
          rawPayloadStored: false,
          keys: Object.keys(input.providerResult).sort(),
        }
      : null,
    retryReason: input.retryReason ?? null,
    runtimeSummary: input.runtime
      ? {
          rawPayloadStored: false,
          keys: Object.keys(input.runtime).sort(),
        }
      : null,
    serviceFeeIncluded: false,
    ownerReportsActualInternalToolCostOnly: true,
    noWalletMutation: true,
    noReservationMutation: true,
    noLedgerWrite: true,
    noSettlement: true,
  }
}

function findForbiddenMetadataPaths(value: unknown, path: string[] = []): string[] {
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenMetadataPaths(item, [...path, String(index)]))
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const nextPath = [...path, key]
    const ownPath = forbiddenUserMetadataKeys.has(key) ? [nextPath.join('.')] : []
    return [...ownPath, ...findForbiddenMetadataPaths(child, nextPath)]
  })
}

function isProductEditLevel(value: string): value is ReEditProCanonicalEditLevel {
  return (REEDITPRO_EDIT_LEVELS as readonly string[]).includes(value)
}

function isRuntimeComputeLevel(value: string): value is ToolRuntimeComputeLevel {
  return (TOOL_RUNTIME_COMPUTE_LEVELS as readonly string[]).includes(value)
}

function applyBasisPoints(value: number, basisPoints: number): number {
  if (value === 0) return 0
  return Math.ceil((value * basisPoints) / 10_000)
}

function okProductionToolCost<TData>(data: TData): ProductionToolCostResult<TData> {
  return { ok: true, data }
}

function failProductionToolCost(
  code: ProductionToolCostErrorCode,
  message: string,
  status: ToolCreditPrerequisiteStatus,
  field?: string,
  warnings: string[] = [],
): ProductionToolCostResult<never> {
  return {
    ok: false,
    error: {
      code,
      message,
      status,
      field,
      warnings,
    },
  }
}
