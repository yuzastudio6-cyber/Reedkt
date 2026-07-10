import { createHash } from 'node:crypto'
import { getRateCardSnapshot, toolCostRateCard } from './rate-card'
import { assertNoSecretLikeCostPayload } from './secret-safety'
import type {
  ToolCostComputeLevel,
  ToolCostEstimate,
  ToolCostEstimateInput,
  ToolCostEvent,
  ToolCostEventInput,
  ToolCostFailureCategory,
  ToolCostProviderType,
  ToolCostQualityLevel,
  ToolCostRiskLevel,
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
    pricingSnapshot: buildPricingSnapshot(input.providerType, input.computeLevel, input.qualityLevel, riskLevel),
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
    pricingSnapshot: buildPricingSnapshot(input.providerType, inferComputeLevel(input), input.qualityLevel, inferRiskLevel(input.providerType, input.gpuCount ?? 0, input)),
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

function buildPricingSnapshot(
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
