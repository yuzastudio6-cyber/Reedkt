import { createHash } from 'node:crypto'
import {
  COST_MICROS_PER_CENT,
  TOOL_COST_RATE_CARD,
  TOOL_COST_RATE_CARD_VERSION,
  TOOL_RUNTIME_COMPUTE_LEVELS,
  getRateCardSnapshot,
  toolCostRateCard,
} from './rate-card'
import { assertNoSecretLikeCostPayload } from './secret-safety'
import type {
  CalculateToolActualCostMicrosInput,
  DeterministicRendererCostInput,
  ExternalProviderCostInput,
  InfrastructureRuntimeCostInput,
  MockToolCostEvent,
  ToolCostComputeLevel,
  ToolCostEstimate,
  ToolCostEstimateRange,
  ToolCostEstimateInput,
  ToolCostEvent,
  ToolCostEventAggregation,
  ToolCostEventInput,
  ToolCostFailureCategory,
  ToolCostMathErrorCode,
  ToolCostMathResult,
  ToolCostMicrosCalculation,
  ToolCostPricingSnapshot,
  ToolCostProviderType,
  ToolCostQualityLevel,
  ToolCostRiskLevel,
  ToolCostSourceKind,
  ToolRuntimeComputeLevel,
} from './types'

const MICROS_PER_CENT = 10_000

export function internalMicrosToCents(micros: number): number {
  return Math.max(0, Math.ceil(micros / MICROS_PER_CENT))
}

export function centsToCredits(cents: number): number {
  return Math.max(0, Math.ceil(cents / toolCostRateCard.creditValueCents))
}

export function estimateToolCost(input: ToolCostEstimateInput): ToolCostEstimate {
  assertNoSecretLikeCostPayload(input.metadata ?? {}, 'metadata')
  const usage = normalizeUsage(input)
  const riskLevel = inferRiskLevel(input.providerType, usage.gpuCount, input)
  const expectedMicros = calculateCostMicros({
    providerType: input.providerType,
    computeLevel: input.computeLevel,
    qualityLevel: input.qualityLevel,
    runtimeSeconds: usage.estimatedRuntimeSeconds,
    billableMs: undefined,
    inputTokens: input.inputTokens ?? 0,
    outputTokens: input.outputTokens ?? 0,
    inputVideoSeconds: usage.inputVideoSeconds,
    outputVideoSeconds: usage.outputVideoSeconds,
    inputAudioSeconds: usage.inputAudioSeconds,
    outputAudioSeconds: usage.outputAudioSeconds,
    imageCount: usage.imageCount,
    renderDurationSeconds: input.renderDurationSeconds ?? usage.outputVideoSeconds,
    outputResolution: usage.resolution,
    outputFrameRate: usage.frameRate,
    vcpuCount: usage.vcpuCount,
    memoryGiB: usage.memoryGiB,
    gpuType: usage.gpuType,
    gpuCount: usage.gpuCount,
    temporaryStorageGiBHours: input.temporaryStorageGiBHours ?? 0,
    outputStorageGiBHours: input.outputStorageGiBHours ?? 0,
    networkEgressMiB: input.networkEgressMiB ?? 0,
  })
  const risk = toolCostRateCard.riskBuffers[riskLevel]
  const lowInternalCostCents = internalMicrosToCents(expectedMicros * risk.lowMultiplier)
  const expectedInternalCostCents = internalMicrosToCents(expectedMicros)
  const highInternalCostCents = internalMicrosToCents(expectedMicros * risk.highMultiplier)
  const lowCredits = centsToCredits(lowInternalCostCents)
  const expectedCredits = centsToCredits(expectedInternalCostCents)
  const highCredits = centsToCredits(highInternalCostCents)
  const canRunWithinApprovedReservation = input.approvedReservationRemainingCredits === undefined
    ? true
    : highCredits <= input.approvedReservationRemainingCredits

  return {
    toolId: input.toolId,
    toolName: input.toolName,
    usageCategory: input.usageCategory,
    computeLevel: input.computeLevel,
    providerType: input.providerType,
    providerName: input.providerName ?? null,
    modelName: input.modelName ?? null,
    qualityLevel: input.qualityLevel,
    inputVideoSeconds: usage.inputVideoSeconds,
    outputVideoSeconds: usage.outputVideoSeconds,
    inputAudioSeconds: usage.inputAudioSeconds,
    outputAudioSeconds: usage.outputAudioSeconds,
    imageCount: usage.imageCount,
    estimatedRuntimeSeconds: usage.estimatedRuntimeSeconds,
    resolution: usage.resolution,
    frameRate: usage.frameRate,
    lowInternalCostCents,
    expectedInternalCostCents,
    highInternalCostCents,
    lowCredits,
    expectedCredits,
    highCredits,
    rateCardVersion: toolCostRateCard.version,
    pricingSnapshot: buildToolCostPricingSnapshot(input.providerType, input.computeLevel, input.qualityLevel, riskLevel),
    serviceFeeIncluded: false,
    assumptions: [
      ...(input.assumptions ?? []),
      'ReEditPro service/edit fee is not included in tool costs.',
      'Static v1 rate card is a mock-safe placeholder until owner-approved production rates exist.',
      canRunWithinApprovedReservation
        ? 'High estimate fits the supplied approved reservation context or no reservation context was supplied.'
        : 'High estimate exceeds the supplied approved reservation context; revised estimate approval is required before paid execution.',
    ],
    riskLevel,
    requiresExternalProvider: input.providerType === 'external_api',
    providerOptions: input.providerOptions ?? [],
    canRunWithinApprovedReservation,
  }
}

export function emitToolCostEvent(input: ToolCostEventInput): ToolCostEvent {
  assertNoSecretLikeCostPayload(input.metadata ?? {}, 'metadata')
  const failureCategory = input.failureCategory ?? 'none'
  const billableToUser = normalizeBillableToUser(input.billableToUser, failureCategory, Boolean(input.creditEstimateId && input.creditReservationId))
  const billableMs = input.billableMs ?? roundBillableMs(input.wallClockMs)
  const actualInternalCostMicros = calculateCostMicros({
    providerType: input.providerType,
    computeLevel: inferComputeLevel(input),
    qualityLevel: input.qualityLevel,
    runtimeSeconds: Math.max(0, input.wallClockMs / 1_000),
    billableMs,
    inputTokens: input.inputTokens ?? 0,
    outputTokens: input.outputTokens ?? 0,
    inputVideoSeconds: input.inputVideoSeconds ?? 0,
    outputVideoSeconds: input.outputVideoSeconds ?? 0,
    inputAudioSeconds: input.inputAudioSeconds ?? 0,
    outputAudioSeconds: input.outputAudioSeconds ?? 0,
    imageCount: input.imageCount ?? 0,
    renderDurationSeconds: input.renderDurationSeconds ?? 0,
    outputResolution: input.outputResolution ?? 'unknown',
    outputFrameRate: input.outputFrameRate ?? 0,
    vcpuCount: input.vcpuCount ?? 0,
    memoryGiB: input.memoryGiB ?? 0,
    gpuType: input.gpuType ?? null,
    gpuCount: input.gpuCount ?? 0,
    temporaryStorageGiBHours: input.temporaryStorageGiBHours ?? 0,
    outputStorageGiBHours: input.outputStorageGiBHours ?? 0,
    networkEgressMiB: input.networkEgressMiB ?? 0,
  })
  const actualInternalCostCents = internalMicrosToCents(actualInternalCostMicros)
  const toolCostCredits = centsToCredits(actualInternalCostCents)

  if (billableToUser && (!input.creditEstimateId || !input.creditReservationId)) {
    throw new Error('Billable tool cost events require approved creditEstimateId and active creditReservationId.')
  }

  if (
    billableToUser &&
    input.approvedReservationRemainingCredits !== undefined &&
    toolCostCredits > input.approvedReservationRemainingCredits
  ) {
    throw new Error('Tool cost exceeds the approved reservation; revised estimate approval is required.')
  }

  const retryAttempt = input.retryAttempt ?? 0
  const event: ToolCostEvent = {
    id: input.id ?? createToolCostEventId(input, retryAttempt),
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId ?? null,
    jobId: input.jobId ?? null,
    jobBatchId: input.jobBatchId ?? null,
    generationRequestId: input.generationRequestId ?? null,
    renderJobId: input.renderJobId ?? null,
    creditEstimateId: input.creditEstimateId ?? null,
    creditReservationId: input.creditReservationId ?? null,
    toolId: input.toolId,
    toolName: input.toolName,
    usageCategory: input.usageCategory,
    providerType: input.providerType,
    providerName: input.providerName ?? null,
    modelName: input.modelName ?? null,
    qualityLevel: input.qualityLevel,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    wallClockMs: input.wallClockMs,
    billableMs,
    vcpuCount: input.vcpuCount ?? 0,
    memoryGiB: input.memoryGiB ?? 0,
    gpuType: input.gpuType ?? null,
    gpuCount: input.gpuCount ?? 0,
    inputTokens: input.inputTokens ?? 0,
    outputTokens: input.outputTokens ?? 0,
    inputVideoSeconds: input.inputVideoSeconds ?? 0,
    outputVideoSeconds: input.outputVideoSeconds ?? 0,
    inputAudioSeconds: input.inputAudioSeconds ?? 0,
    outputAudioSeconds: input.outputAudioSeconds ?? 0,
    imageCount: input.imageCount ?? 0,
    renderDurationSeconds: input.renderDurationSeconds ?? 0,
    outputResolution: input.outputResolution ?? null,
    outputFrameRate: input.outputFrameRate ?? 0,
    rateCardVersion: toolCostRateCard.version,
    pricingSnapshot: buildToolCostPricingSnapshot(input.providerType, inferComputeLevel(input), input.qualityLevel, inferRiskLevel(input.providerType, input.gpuCount ?? 0, input)),
    estimatedInternalCostCents: input.estimatedInternalCostCents ?? actualInternalCostCents,
    actualInternalCostCents,
    actualInternalCostMicros,
    toolCostCredits,
    retryAttempt,
    retryReason: input.retryReason ?? null,
    failureCategory,
    billableToUser,
    metadata: input.metadata ?? {},
  }

  assertNoSecretLikeCostPayload(event.pricingSnapshot, 'pricingSnapshot')
  assertNoSecretLikeCostPayload(event.metadata, 'metadata')
  return event
}

export function roundBillableMs(wallClockMs: number): number {
  const rounded = Math.ceil(Math.max(0, wallClockMs) / toolCostRateCard.billing.billableRoundingMs) * toolCostRateCard.billing.billableRoundingMs
  return Math.max(toolCostRateCard.billing.minimumBillableMs, rounded)
}

export function calculateCostMicros(input: {
  providerType: ToolCostProviderType
  computeLevel: ToolCostComputeLevel
  qualityLevel: ToolCostQualityLevel
  runtimeSeconds: number
  billableMs?: number
  inputTokens: number
  outputTokens: number
  inputVideoSeconds: number
  outputVideoSeconds: number
  inputAudioSeconds: number
  outputAudioSeconds: number
  imageCount: number
  renderDurationSeconds: number
  outputResolution: string | null
  outputFrameRate: number
  vcpuCount: number
  memoryGiB: number
  gpuType: string | null
  gpuCount: number
  temporaryStorageGiBHours: number
  outputStorageGiBHours: number
  networkEgressMiB: number
}): number {
  const billableSeconds = (input.billableMs ?? roundBillableMs(input.runtimeSeconds * 1_000)) / 1_000
  const qualityMultiplier = toolCostRateCard.qualityMultipliers[input.qualityLevel]

  if (input.providerType === 'external_api') {
    return qualityMultiplier * (
      input.inputTokens * toolCostRateCard.provider.defaultInputTokenMicros +
      input.outputTokens * toolCostRateCard.provider.defaultOutputTokenMicros +
      input.inputVideoSeconds * toolCostRateCard.provider.inputVideoSecondMicros +
      input.outputVideoSeconds * toolCostRateCard.provider.outputVideoSecondMicros +
      input.inputAudioSeconds * toolCostRateCard.provider.inputAudioSecondMicros +
      input.outputAudioSeconds * toolCostRateCard.provider.outputAudioSecondMicros +
      input.imageCount * toolCostRateCard.provider.imageMicros +
      input.renderDurationSeconds * toolCostRateCard.provider.renderSecondMicros
    )
  }

  if (input.providerType === 'human') {
    return (billableSeconds / 3_600) * toolCostRateCard.human.hourlyMicros
  }

  const defaults = toolCostRateCard.computeLevelDefaults[input.computeLevel]
  const vcpuCount = input.vcpuCount || defaults.vcpuCount
  const memoryGiB = input.memoryGiB || defaults.memoryGiB
  const gpuCount = input.gpuCount || defaults.gpuCount
  const gpuMicros = gpuCount * resolveGpuMicros(input.gpuType) * billableSeconds
  const computeMicros = billableSeconds * (
    vcpuCount * toolCostRateCard.infrastructure.cpuMicrosPerVcpuSecond +
    memoryGiB * toolCostRateCard.infrastructure.memoryMicrosPerGiBSecond
  ) + gpuMicros
  const storageMicros =
    input.temporaryStorageGiBHours * toolCostRateCard.infrastructure.temporaryStorageMicrosPerGiBHour +
    input.outputStorageGiBHours * toolCostRateCard.infrastructure.outputStorageMicrosPerGiBHour
  const networkMicros = input.networkEgressMiB * toolCostRateCard.infrastructure.networkEgressMicrosPerMiB
  const overheadMicros = resolveRuntimeOverhead(input.providerType)
  const rendererMicros = input.providerType === 'deterministic_renderer'
    ? calculateRendererMicros(input.renderDurationSeconds, input.outputResolution, input.outputFrameRate)
    : 0

  return qualityMultiplier * defaults.qualityMultiplier * (computeMicros + storageMicros + networkMicros + overheadMicros + rendererMicros)
}

function buildToolCostPricingSnapshot(
  providerType: ToolCostProviderType,
  computeLevel: ToolCostComputeLevel,
  qualityLevel: ToolCostQualityLevel,
  riskLevel: ToolCostRiskLevel,
): Record<string, unknown> {
  return {
    ...getRateCardSnapshot(),
    selectedProviderType: providerType,
    selectedComputeLevel: computeLevel,
    selectedQualityLevel: qualityLevel,
    selectedRiskLevel: riskLevel,
  }
}

function calculateRendererMicros(renderDurationSeconds: number, resolution: string | null, frameRate: number): number {
  const frameCount = Math.max(0, renderDurationSeconds) * Math.max(0, frameRate)
  return (
    toolCostRateCard.deterministicRenderer.flatRequestMicros +
    Math.max(0, renderDurationSeconds) * toolCostRateCard.deterministicRenderer.outputSecondMicros +
    frameCount * megapixelsFromResolution(resolution) * toolCostRateCard.deterministicRenderer.megapixelFrameMicros
  )
}

function createToolCostEventId(input: ToolCostEventInput, retryAttempt: number): string {
  const stableSource = [
    input.workspaceId,
    input.projectId,
    input.jobId ?? input.generationRequestId ?? input.renderJobId ?? 'no-job-id',
    input.toolId,
    String(retryAttempt),
  ].join(':')
  return `tool-cost-${createHash('sha256').update(stableSource).digest('hex').slice(0, 24)}`
}

function inferComputeLevel(input: ToolCostEventInput): ToolCostComputeLevel {
  if ((input.gpuCount ?? 0) > 0 || input.qualityLevel === 'premium') return 'premium'
  if ((input.vcpuCount ?? 0) >= 2 || (input.memoryGiB ?? 0) >= 2 || input.qualityLevel === 'production') return 'standard'
  return 'economy'
}

function inferRiskLevel(providerType: ToolCostProviderType, gpuCount: number, input: { outputVideoSeconds?: number; outputAudioSeconds?: number; imageCount?: number }): ToolCostRiskLevel {
  if (providerType === 'gpu_worker' || gpuCount > 0 || providerType === 'unknown') return 'high'
  if (
    providerType === 'external_api' ||
    (input.outputVideoSeconds ?? 0) > 0 ||
    (input.outputAudioSeconds ?? 0) > 0 ||
    (input.imageCount ?? 0) > 0
  ) {
    return 'medium'
  }
  return 'low'
}

function megapixelsFromResolution(resolution: string | null): number {
  const match = resolution?.match(/(\d{3,5})\s*x\s*(\d{3,5})/i)
  if (!match) return 2.0736
  const width = Number(match[1])
  const height = Number(match[2])
  if (!Number.isFinite(width) || !Number.isFinite(height)) return 2.0736
  return Math.max(0, (width * height) / 1_000_000)
}

function normalizeBillableToUser(inputBillable: boolean | undefined, failureCategory: ToolCostFailureCategory, hasApprovalAndReservation: boolean): boolean {
  if (failureCategory === 'none') return inputBillable ?? true
  if (failureCategory === 'user_requested_retry' || failureCategory === 'user_requested_revision') {
    return Boolean(inputBillable && hasApprovalAndReservation)
  }
  return false
}

function normalizeUsage(input: ToolCostEstimateInput): {
  inputVideoSeconds: number
  outputVideoSeconds: number
  inputAudioSeconds: number
  outputAudioSeconds: number
  imageCount: number
  estimatedRuntimeSeconds: number
  resolution: string
  frameRate: number
  vcpuCount: number
  memoryGiB: number
  gpuType: string | null
  gpuCount: number
} {
  const defaults = toolCostRateCard.computeLevelDefaults[input.computeLevel]
  return {
    inputVideoSeconds: input.inputVideoSeconds ?? 0,
    outputVideoSeconds: input.outputVideoSeconds ?? 0,
    inputAudioSeconds: input.inputAudioSeconds ?? 0,
    outputAudioSeconds: input.outputAudioSeconds ?? 0,
    imageCount: input.imageCount ?? 0,
    estimatedRuntimeSeconds: input.estimatedRuntimeSeconds ?? 60,
    resolution: input.resolution ?? '1920x1080',
    frameRate: input.frameRate ?? 30,
    vcpuCount: input.vcpuCount ?? defaults.vcpuCount,
    memoryGiB: input.memoryGiB ?? defaults.memoryGiB,
    gpuType: input.gpuType ?? (defaults.gpuCount > 0 ? 'nvidia_l4' : null),
    gpuCount: input.gpuCount ?? defaults.gpuCount,
  }
}

function resolveGpuMicros(gpuType: string | null): number {
  if (!gpuType) return toolCostRateCard.infrastructure.defaultGpuMicrosPerGpuSecond
  return toolCostRateCard.infrastructure.gpuMicrosPerGpuSecond[gpuType] ?? toolCostRateCard.infrastructure.defaultGpuMicrosPerGpuSecond
}

function resolveRuntimeOverhead(providerType: ToolCostProviderType): number {
  if (providerType === 'cloud_run_request') return toolCostRateCard.infrastructure.cloudRunRequestOverheadMicros
  if (providerType === 'cloud_run_job') return toolCostRateCard.infrastructure.cloudRunJobOverheadMicros
  if (providerType === 'compute_engine_vm') return toolCostRateCard.infrastructure.computeEngineVmOverheadMicros
  return 0
}

export function centsToCreditsCeil(cents: number): ToolCostMathResult<number> {
  if (!Number.isFinite(cents) || cents < 0 || !Number.isInteger(cents)) {
    return failToolCost('invalid_cents', 'cents must be a non-negative integer.', 'cents')
  }
  return okToolCost(centsToCredits(cents))
}

export function calculateToolCostCredits(cents: number): ToolCostMathResult<number> {
  return centsToCreditsCeil(cents)
}

export function createToolCostCredits(cents: number): number {
  const result = centsToCreditsCeil(cents)
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export function microsToCentsCeil(micros: number): ToolCostMathResult<number> {
  if (!Number.isFinite(micros) || micros < 0 || !Number.isInteger(micros)) {
    return failToolCost('invalid_cents', 'micros must be a non-negative integer.', 'micros')
  }
  return okToolCost(internalMicrosToCents(micros))
}

export function normalizeBillableMilliseconds(milliseconds: number): ToolCostMathResult<number> {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0 || !Number.isInteger(milliseconds)) {
    return failToolCost('invalid_milliseconds', 'milliseconds must be a positive integer.', 'billableMilliseconds')
  }
  return okToolCost(milliseconds)
}

export function roundBillableMilliseconds(milliseconds: number): ToolCostMathResult<number> {
  const normalized = normalizeBillableMilliseconds(milliseconds)
  if (!normalized.ok) return normalized
  const { minimumBillableMilliseconds, roundingIncrementMilliseconds } = TOOL_COST_RATE_CARD.roundingPolicy
  const rounded = Math.ceil(normalized.data / roundingIncrementMilliseconds) * roundingIncrementMilliseconds
  return okToolCost(Math.max(minimumBillableMilliseconds, rounded))
}

export function buildPricingSnapshot(input: {
  sourceKind: ToolCostSourceKind
  provider?: string | null
  model?: string | null
  computeLevel?: ToolRuntimeComputeLevel | null
  riskLevel?: ToolCostRiskLevel | null
  pricingUnits?: Record<string, unknown>
}): ToolCostMathResult<ToolCostPricingSnapshot> {
  const snapshot: ToolCostPricingSnapshot = {
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    sourceKind: input.sourceKind,
    provider: input.provider ?? null,
    model: input.model ?? null,
    computeLevel: input.computeLevel ?? null,
    riskLevel: input.riskLevel ?? null,
    serviceFeeIncluded: false,
    pricingUnits: input.pricingUnits ?? {},
  }
  const secretSafety = validatePricingSnapshotHasNoSecrets(snapshot)
  if (!secretSafety.ok) return secretSafety
  return okToolCost(snapshot)
}

export function validatePricingSnapshotHasNoSecrets(snapshot: ToolCostPricingSnapshot | Record<string, unknown>): ToolCostMathResult<true> {
  try {
    assertNoSecretLikeCostPayload(snapshot, 'pricingSnapshot')
    return okToolCost(true)
  } catch (error) {
    return failToolCost('secret_like_payload', error instanceof Error ? error.message : 'pricing snapshot contains secret-like fields')
  }
}

export function calculateExternalProviderCostMicros(
  input: ExternalProviderCostInput,
): ToolCostMathResult<ToolCostMicrosCalculation> {
  const requestCount = nonNegativeInteger(input.requestCount ?? 0, 'requestCount')
  if (!requestCount.ok) return requestCount
  const inputTokens = nonNegativeInteger(input.inputTokens ?? 0, 'inputTokens')
  if (!inputTokens.ok) return inputTokens
  const outputTokens = nonNegativeInteger(input.outputTokens ?? 0, 'outputTokens')
  if (!outputTokens.ok) return outputTokens
  const imageCount = nonNegativeInteger(input.imageCount ?? 0, 'imageCount')
  if (!imageCount.ok) return imageCount
  const inputVideoSeconds = nonNegativeFinite(input.inputVideoSeconds ?? 0, 'inputVideoSeconds')
  if (!inputVideoSeconds.ok) return inputVideoSeconds
  const outputVideoSeconds = nonNegativeFinite(input.outputVideoSeconds ?? 0, 'outputVideoSeconds')
  if (!outputVideoSeconds.ok) return outputVideoSeconds
  const inputAudioSeconds = nonNegativeFinite(input.inputAudioSeconds ?? 0, 'inputAudioSeconds')
  if (!inputAudioSeconds.ok) return inputAudioSeconds
  const outputAudioSeconds = nonNegativeFinite(input.outputAudioSeconds ?? 0, 'outputAudioSeconds')
  if (!outputAudioSeconds.ok) return outputAudioSeconds

  const rates = TOOL_COST_RATE_CARD.provider
  const breakdownMicros = {
    requestMicros: requestCount.data * rates.perRequestMicros,
    inputTokenMicros: Math.ceil(inputTokens.data * rates.perInputTokenMicros),
    outputTokenMicros: Math.ceil(outputTokens.data * rates.perOutputTokenMicros),
    inputVideoMicros: Math.ceil(inputVideoSeconds.data * rates.perInputVideoSecondMicros),
    outputVideoMicros: Math.ceil(outputVideoSeconds.data * rates.perOutputVideoSecondMicros),
    inputAudioMicros: Math.ceil(inputAudioSeconds.data * rates.perInputAudioSecondMicros),
    outputAudioMicros: Math.ceil(outputAudioSeconds.data * rates.perOutputAudioSecondMicros),
    imageMicros: imageCount.data * rates.perImageMicros,
  }
  return calculation('external_provider', sumMicros(breakdownMicros), breakdownMicros, {
    provider: input.provider ?? null,
    model: input.model ?? null,
    pricingUnits: { rates, units: input },
  })
}

export function calculateInfrastructureRuntimeCostMicros(
  input: InfrastructureRuntimeCostInput,
): ToolCostMathResult<ToolCostMicrosCalculation> {
  const computeLevel = input.computeLevel ?? 'standard'
  if (!isRuntimeComputeLevel(computeLevel)) return failToolCost('invalid_compute_level', 'Invalid compute level.', 'computeLevel')
  const billableMilliseconds = roundBillableMilliseconds(input.wallTimeMilliseconds)
  if (!billableMilliseconds.ok) return billableMilliseconds
  const billableSeconds = billableMilliseconds.data / 1_000
  const renderSeconds = nonNegativeFinite(input.renderSeconds ?? billableSeconds, 'renderSeconds')
  if (!renderSeconds.ok) return renderSeconds
  const vcpuCount = nonNegativeFinite(input.vcpuCount ?? 0, 'vcpuCount')
  if (!vcpuCount.ok) return vcpuCount
  const memoryGib = nonNegativeFinite(input.memoryGib ?? 0, 'memoryGib')
  if (!memoryGib.ok) return memoryGib
  const gpuCount = nonNegativeFinite(input.gpuCount ?? 0, 'gpuCount')
  if (!gpuCount.ok) return gpuCount
  const tempStorageGibHours = nonNegativeFinite(input.tempStorageGibHours ?? 0, 'tempStorageGibHours')
  if (!tempStorageGibHours.ok) return tempStorageGibHours
  const outputStorageGibHours = nonNegativeFinite(input.outputStorageGibHours ?? 0, 'outputStorageGibHours')
  if (!outputStorageGibHours.ok) return outputStorageGibHours
  const networkEgressMib = nonNegativeFinite(input.networkEgressMib ?? 0, 'networkEgressMib')
  if (!networkEgressMib.ok) return networkEgressMib

  const rates = TOOL_COST_RATE_CARD.runtime
  const breakdownMicros = {
    renderMicros: Math.ceil(renderSeconds.data * rates.perRenderSecondMicros),
    cpuMicros: Math.ceil(vcpuCount.data * billableSeconds * rates.perVcpuSecondMicros),
    memoryMicros: Math.ceil(memoryGib.data * billableSeconds * rates.perMemoryGibSecondMicros),
    gpuMicros: Math.ceil(gpuCount.data * billableSeconds * rates.perGpuSecondMicros),
    tempStorageMicros: Math.ceil(tempStorageGibHours.data * rates.perTempStorageGibHourMicros),
    outputStorageMicros: Math.ceil(outputStorageGibHours.data * rates.perOutputStorageGibHourMicros),
    networkEgressMicros: Math.ceil(networkEgressMib.data * rates.perNetworkEgressMibMicros),
  }
  const result = calculation('infrastructure_runtime', sumMicros(breakdownMicros), breakdownMicros, {
    computeLevel,
    pricingUnits: { rates, units: { ...input, billableMilliseconds: billableMilliseconds.data } },
  })
  if (!result.ok) return result
  return okToolCost({ ...result.data, computeLevel, billableMilliseconds: billableMilliseconds.data })
}

export function calculateDeterministicRendererCostMicros(
  input: DeterministicRendererCostInput,
): ToolCostMathResult<ToolCostMicrosCalculation> {
  const requestCount = nonNegativeInteger(input.requestCount ?? 1, 'requestCount')
  if (!requestCount.ok) return requestCount
  const outputSeconds = nonNegativeFinite(input.outputSeconds ?? 0, 'outputSeconds')
  if (!outputSeconds.ok) return outputSeconds
  const megapixelFrames = nonNegativeFinite(input.megapixelFrames ?? 0, 'megapixelFrames')
  if (!megapixelFrames.ok) return megapixelFrames
  const computeLevel = input.computeLevel ?? 'standard'
  if (!isRuntimeComputeLevel(computeLevel)) return failToolCost('invalid_compute_level', 'Invalid compute level.', 'computeLevel')
  const rates = TOOL_COST_RATE_CARD.deterministicRenderer
  const breakdownMicros = {
    requestMicros: requestCount.data * rates.flatRequestMicros,
    outputSecondMicros: Math.ceil(outputSeconds.data * rates.perOutputSecondMicros),
    megapixelFrameMicros: Math.ceil(megapixelFrames.data * rates.perMegapixelFrameMicros),
  }
  const result = calculation('deterministic_renderer', sumMicros(breakdownMicros), breakdownMicros, {
    computeLevel,
    pricingUnits: { rates, units: input },
  })
  if (!result.ok) return result
  return okToolCost({ ...result.data, computeLevel })
}

export function calculateToolActualCostMicros(
  input: CalculateToolActualCostMicrosInput,
): ToolCostMathResult<ToolCostMicrosCalculation> {
  if (input.sourceKind === 'external_provider') return calculateExternalProviderCostMicros(input)
  if (input.sourceKind === 'infrastructure_runtime') return calculateInfrastructureRuntimeCostMicros(input.runtime)
  if (input.sourceKind === 'deterministic_renderer') return calculateDeterministicRendererCostMicros(input.deterministicRenderer)
  if (input.sourceKind === 'mock_manual_entry') {
    const micros = input.actualInternalCostMicros ?? (input.actualInternalCostCents ?? 0) * COST_MICROS_PER_CENT
    if (!Number.isFinite(micros) || micros < 0 || !Number.isInteger(micros)) {
      return failToolCost('invalid_cents', 'manual tool cost must be non-negative.', 'actualInternalCostMicros')
    }
    return calculation('mock_manual_entry', micros, { manualMicros: micros }, {
      pricingUnits: {
        actualInternalCostMicros: micros,
        actualInternalCostCents: internalMicrosToCents(micros),
      },
    })
  }
  return failToolCost('invalid_source_kind', 'Unsupported tool cost source kind.', 'sourceKind')
}

export function calculateEstimateRangeFromExpectedCost(input: {
  expectedInternalCostMicros: number
  riskLevel?: ToolCostRiskLevel
  approvedReservationCredits?: number
  sourceKind?: ToolCostSourceKind
  provider?: string | null
  model?: string | null
  computeLevel?: ToolRuntimeComputeLevel | null
}): ToolCostMathResult<ToolCostEstimateRange> {
  if (!Number.isFinite(input.expectedInternalCostMicros) || input.expectedInternalCostMicros < 0) {
    return failToolCost('invalid_cents', 'expectedInternalCostMicros must be non-negative.', 'expectedInternalCostMicros')
  }
  const riskLevel = input.riskLevel ?? 'medium'
  const riskBuffer = TOOL_COST_RATE_CARD.riskBuffersBasisPoints[riskLevel]
  const lowInternalCostCents = internalMicrosToCents(Math.max(0, Math.floor(input.expectedInternalCostMicros * 0.8)))
  const expectedInternalCostCents = internalMicrosToCents(Math.ceil(input.expectedInternalCostMicros))
  const highInternalCostCents = internalMicrosToCents(Math.ceil(input.expectedInternalCostMicros + (input.expectedInternalCostMicros * riskBuffer / 10_000)))
  const highCredits = centsToCredits(highInternalCostCents)
  const pricingSnapshot = buildPricingSnapshot({
    sourceKind: input.sourceKind ?? 'mock_manual_entry',
    provider: input.provider ?? null,
    model: input.model ?? null,
    computeLevel: input.computeLevel ?? null,
    riskLevel,
    pricingUnits: { expectedInternalCostMicros: input.expectedInternalCostMicros },
  })
  if (!pricingSnapshot.ok) return pricingSnapshot
  return okToolCost({
    lowInternalCostCents,
    expectedInternalCostCents,
    highInternalCostCents,
    lowCredits: centsToCredits(lowInternalCostCents),
    expectedCredits: centsToCredits(expectedInternalCostCents),
    highCredits,
    riskLevel,
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    sourceKind: input.sourceKind ?? 'mock_manual_entry',
    provider: input.provider ?? null,
    model: input.model ?? null,
    computeLevel: input.computeLevel ?? null,
    serviceFeeIncluded: false,
    pricingSnapshot: pricingSnapshot.data,
    canRunWithinApprovedReservation: input.approvedReservationCredits === undefined
      ? null
      : highCredits <= input.approvedReservationCredits,
  })
}

export function summarizeMockToolCostEvents(events: readonly MockToolCostEvent[]): ToolCostEventAggregation {
  const byUsageCategory: ToolCostEventAggregation['byUsageCategory'] = {}
  let actualBillableCostCents = 0
  let nonBillableCostCents = 0
  const billableEventIds: string[] = []
  const nonBillableEventIds: string[] = []
  const nonBillableReasons = new Set<string>()

  for (const event of events) {
    const bucket = byUsageCategory[event.usageCategory] ?? {
      actualInternalCostCents: 0,
      credits: 0,
      eventCount: 0,
      billableEventCount: 0,
      nonBillableEventCount: 0,
    }
    bucket.eventCount += 1
    if (event.billableToUser) {
      actualBillableCostCents += event.actualInternalCostCents
      bucket.actualInternalCostCents += event.actualInternalCostCents
      bucket.credits += event.toolCostCredits
      bucket.billableEventCount += 1
      billableEventIds.push(event.id)
    } else {
      nonBillableCostCents += event.actualInternalCostCents
      bucket.nonBillableEventCount += 1
      nonBillableEventIds.push(event.id)
      if (event.nonBillableReason) nonBillableReasons.add(event.nonBillableReason)
      else if (event.failureCategory && event.failureCategory !== 'none') nonBillableReasons.add(event.failureCategory)
    }
    byUsageCategory[event.usageCategory] = bucket
  }

  return {
    actualBillableCostCents,
    actualBillableCostCredits: centsToCredits(actualBillableCostCents),
    nonBillableCostCents,
    nonBillableCredits: centsToCredits(nonBillableCostCents),
    billableEventCount: billableEventIds.length,
    nonBillableEventCount: nonBillableEventIds.length,
    billableEventIds,
    nonBillableEventIds,
    nonBillableReasons: Array.from(nonBillableReasons),
    byUsageCategory,
  }
}

function calculation(
  sourceKind: ToolCostSourceKind,
  actualInternalCostMicros: number,
  breakdownMicros: Record<string, number>,
  options: {
    provider?: string | null
    model?: string | null
    computeLevel?: ToolRuntimeComputeLevel | null
    pricingUnits?: Record<string, unknown>
  } = {},
): ToolCostMathResult<ToolCostMicrosCalculation> {
  const pricingSnapshot = buildPricingSnapshot({
    sourceKind,
    provider: options.provider ?? null,
    model: options.model ?? null,
    computeLevel: options.computeLevel ?? null,
    pricingUnits: options.pricingUnits ?? {},
  })
  if (!pricingSnapshot.ok) return pricingSnapshot
  return okToolCost({
    actualInternalCostMicros,
    sourceKind,
    rateCardVersion: TOOL_COST_RATE_CARD_VERSION,
    provider: options.provider ?? null,
    model: options.model ?? null,
    computeLevel: options.computeLevel ?? null,
    pricingSnapshot: pricingSnapshot.data,
    breakdownMicros,
  })
}

function nonNegativeInteger(value: number, field: string): ToolCostMathResult<number> {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    return failToolCost('invalid_count', `${field} must be a non-negative integer.`, field)
  }
  return okToolCost(value)
}

function nonNegativeFinite(value: number, field: string): ToolCostMathResult<number> {
  if (!Number.isFinite(value) || value < 0) {
    return failToolCost('invalid_seconds', `${field} must be a non-negative finite number.`, field)
  }
  return okToolCost(value)
}

function sumMicros(breakdown: Record<string, number>): number {
  return Object.values(breakdown).reduce((sum, value) => sum + value, 0)
}

function isRuntimeComputeLevel(value: string): value is ToolRuntimeComputeLevel {
  return (TOOL_RUNTIME_COMPUTE_LEVELS as readonly string[]).includes(value)
}

function okToolCost<TData>(data: TData): ToolCostMathResult<TData> {
  return { ok: true, data }
}

function failToolCost(
  code: ToolCostMathErrorCode,
  message: string,
  field?: string,
): ToolCostMathResult<never> {
  return { ok: false, error: { code, message, field } }
}
