import {
  buildToolCallIntentCreditGate,
  summarizeToolCallCreditGate,
  type ToolCallCreditGateContext,
} from '../../src/lib/tool-call-credit-gate'
import type {
  ToolCallIntent,
  ToolCallIntentCapabilityId,
  ToolCallIntentPlan,
} from '../../src/types/tool-call-intents'
import { estimateToolCost } from './cost-math'
import type {
  ToolCostComputeLevel,
  ToolCostEstimateInput,
  ToolCostProviderType,
  ToolCostQualityLevel,
  ToolCostUsageCategory,
} from './types'

export interface ApplyToolCallIntentCostGateParams {
  plan: ToolCallIntentPlan
  gateContext: ToolCallCreditGateContext
  usageOverrides?: Record<string, Partial<ToolCostEstimateInput>>
}

export interface ToolExecutionCostCreditGateInput {
  approvedPlanSnapshotId?: string | null
  creditEstimateId?: string | null
  creditReservationId?: string | null
  idempotencyKey?: string | null
  estimatedHighCredits?: number | null
  approvedReservationRemainingCredits?: number | null
}

export function applyToolCostMeteringToToolCallIntentPlan(
  params: ApplyToolCallIntentCostGateParams,
): ToolCallIntentPlan {
  const intents = params.plan.intents.map((intent) => {
    const estimateInput = {
      ...toolCostEstimateInputForIntent(intent, params.gateContext),
      ...(params.usageOverrides?.[intent.id] ?? {}),
      ...(params.usageOverrides?.[intent.toolId] ?? {}),
    }
    const estimate = estimateToolCost(estimateInput)
    const costEstimate = {
      ...intent.costEstimate,
      credits: estimate.expectedCredits,
      lowCredits: estimate.lowCredits,
      expectedCredits: estimate.expectedCredits,
      highCredits: estimate.highCredits,
      lowInternalCostCents: estimate.lowInternalCostCents,
      expectedInternalCostCents: estimate.expectedInternalCostCents,
      highInternalCostCents: estimate.highInternalCostCents,
      rateCardVersion: estimate.rateCardVersion,
      pricingSnapshot: normalizePricingSnapshot(estimate.pricingSnapshot),
      canRunWithinApprovedReservation: estimate.canRunWithinApprovedReservation,
      revisedEstimateRequired: !estimate.canRunWithinApprovedReservation,
      basis: `${intent.costEstimate.basis} Metered by ${estimate.rateCardVersion}.`,
      notes: [
        ...intent.costEstimate.notes,
        ...estimate.assumptions,
      ],
    }
    const meteredIntent = {
      ...intent,
      costEstimate,
    }

    return {
      ...meteredIntent,
      creditGate: buildToolCallIntentCreditGate(meteredIntent, params.gateContext),
    }
  })
  const creditGateSummary = summarizeToolCallCreditGate(intents, params.gateContext)

  return {
    ...params.plan,
    intents,
    totalEstimatedCredits: creditGateSummary.totalExpectedCredits,
    creditGateSummary,
    notes: [
      ...params.plan.notes,
      'Tool-call estimates are metered with the static v1 tool-cost rate card; ReEditPro service/edit fees remain outside tool events.',
      'Execution remains blocked unless the approved snapshot, credit estimate, active reservation, and high-estimate budget coverage are present.',
    ],
  }
}

export function assertToolCallIntentExecutionCreditGate(plan: ToolCallIntentPlan): ToolCallIntentPlan {
  const summary = plan.creditGateSummary ?? summarizeToolCallCreditGate(plan.intents)
  if (!summary.executionAllowed) {
    throw new Error(`Tool-call execution is blocked: ${summary.blockers.join(' ')}`)
  }

  return plan
}

export function assertToolExecutionCostCreditGate(input: ToolExecutionCostCreditGateInput): true {
  const blockers: string[] = []
  const approvedPlanSnapshotId = normalizeString(input.approvedPlanSnapshotId)
  const creditEstimateId = normalizeString(input.creditEstimateId)
  const creditReservationId = normalizeString(input.creditReservationId)
  const idempotencyKey = normalizeString(input.idempotencyKey)

  if (!approvedPlanSnapshotId) blockers.push('approvedPlanSnapshotId is required')
  if (!creditEstimateId) blockers.push('creditEstimateId is required')
  if (!creditReservationId) blockers.push('creditReservationId is required')
  if (!idempotencyKey) blockers.push('idempotencyKey is required')
  if (creditReservationId && typeof input.approvedReservationRemainingCredits !== 'number') {
    blockers.push('approvedReservationRemainingCredits is required')
  }

  if (
    typeof input.estimatedHighCredits === 'number' &&
    typeof input.approvedReservationRemainingCredits === 'number' &&
    input.estimatedHighCredits > input.approvedReservationRemainingCredits
  ) {
    blockers.push('estimatedHighCredits exceeds approvedReservationRemainingCredits; revised estimate approval is required')
  }

  if (blockers.length > 0) {
    throw new Error(`Tool execution cost-credit gate failed: ${blockers.join('; ')}.`)
  }

  return true
}

export function toolCostEstimateInputForIntent(
  intent: ToolCallIntent,
  context: ToolCallCreditGateContext = {},
): ToolCostEstimateInput {
  const profile = usageProfileForCapability(intent.capabilityId)
  return {
    toolId: intent.toolId,
    toolName: intent.toolLabel,
    usageCategory: profile.usageCategory,
    computeLevel: profile.computeLevel,
    providerType: profile.providerType,
    providerName: profile.providerName,
    modelName: profile.modelName,
    qualityLevel: profile.qualityLevel,
    inputVideoSeconds: profile.inputVideoSeconds,
    outputVideoSeconds: profile.outputVideoSeconds,
    inputAudioSeconds: profile.inputAudioSeconds,
    outputAudioSeconds: profile.outputAudioSeconds,
    imageCount: profile.imageCount,
    estimatedRuntimeSeconds: profile.estimatedRuntimeSeconds,
    resolution: profile.resolution,
    frameRate: profile.frameRate,
    inputTokens: profile.inputTokens,
    outputTokens: profile.outputTokens,
    renderDurationSeconds: profile.renderDurationSeconds,
    vcpuCount: profile.vcpuCount,
    memoryGiB: profile.memoryGiB,
    gpuType: profile.gpuType,
    gpuCount: profile.gpuCount,
    temporaryStorageGiBHours: profile.temporaryStorageGiBHours,
    outputStorageGiBHours: profile.outputStorageGiBHours,
    networkEgressMiB: profile.networkEgressMiB,
    approvedReservationRemainingCredits: normalizeNumber(context.approvedReservationRemainingCredits),
    assumptions: [
      `Tool-call intent ${intent.id} remains tied to an approved plan snapshot before execution.`,
      `Capability lane: ${intent.capabilityId}; readiness: ${intent.readinessState}.`,
    ],
    metadata: {
      source: 'tool_call_intent_cost_gate',
      intentId: intent.id,
      capabilityId: intent.capabilityId,
      lane: intent.lane,
      readinessState: intent.readinessState,
    },
  }
}

function usageProfileForCapability(capabilityId: ToolCallIntentCapabilityId): {
  usageCategory: ToolCostUsageCategory
  computeLevel: ToolCostComputeLevel
  providerType: ToolCostProviderType
  providerName?: string | null
  modelName?: string | null
  qualityLevel: ToolCostQualityLevel
  inputVideoSeconds?: number
  outputVideoSeconds?: number
  inputAudioSeconds?: number
  outputAudioSeconds?: number
  imageCount?: number
  estimatedRuntimeSeconds?: number
  resolution?: string
  frameRate?: number
  inputTokens?: number
  outputTokens?: number
  renderDurationSeconds?: number
  vcpuCount?: number
  memoryGiB?: number
  gpuType?: string | null
  gpuCount?: number
  temporaryStorageGiBHours?: number
  outputStorageGiBHours?: number
  networkEgressMiB?: number
} {
  switch (capabilityId) {
    case 'audio':
    case 'sound_music_audio':
      return {
        usageCategory: 'soundsync',
        computeLevel: 'standard',
        providerType: 'cloud_run_job',
        qualityLevel: 'preview',
        inputAudioSeconds: 90,
        estimatedRuntimeSeconds: 75,
        vcpuCount: 1,
        memoryGiB: 1,
      }
    case 'browser_capture':
      return {
        usageCategory: 'graphic_design',
        computeLevel: 'economy',
        providerType: 'cloud_run_job',
        qualityLevel: 'preview',
        imageCount: 4,
        estimatedRuntimeSeconds: 45,
        vcpuCount: 1,
        memoryGiB: 1,
      }
    case 'chart_dataviz':
      return {
        usageCategory: 'graphic_design',
        computeLevel: 'economy',
        providerType: 'deterministic_renderer',
        qualityLevel: 'preview',
        imageCount: 3,
        estimatedRuntimeSeconds: 40,
        vcpuCount: 1,
        memoryGiB: 1,
      }
    case 'color':
      return {
        usageCategory: 'media_analysis',
        computeLevel: 'standard',
        providerType: 'cloud_run_job',
        qualityLevel: 'preview',
        imageCount: 12,
        estimatedRuntimeSeconds: 90,
        vcpuCount: 2,
        memoryGiB: 2,
        temporaryStorageGiBHours: 0.25,
      }
    case 'credit_gate':
      return {
        usageCategory: 'planning',
        computeLevel: 'economy',
        providerType: 'cloud_run_request',
        qualityLevel: 'draft',
        estimatedRuntimeSeconds: 5,
      }
    case 'media_extraction':
      return {
        usageCategory: 'media_analysis',
        computeLevel: 'economy',
        providerType: 'cloud_run_job',
        qualityLevel: 'preview',
        inputVideoSeconds: 90,
        estimatedRuntimeSeconds: 75,
        vcpuCount: 1,
        memoryGiB: 1,
        temporaryStorageGiBHours: 0.25,
        outputStorageGiBHours: 0.1,
      }
    case 'ocr':
      return {
        usageCategory: 'captions',
        computeLevel: 'standard',
        providerType: 'cloud_run_job',
        qualityLevel: 'preview',
        imageCount: 12,
        estimatedRuntimeSeconds: 60,
        vcpuCount: 2,
        memoryGiB: 2,
      }
    case 'qwen_reasoning':
      return {
        usageCategory: 'planning',
        computeLevel: 'premium',
        providerType: 'external_api',
        providerName: 'qwen_provider_gateway',
        modelName: 'future_owner_approved_qwen',
        qualityLevel: 'premium',
        inputTokens: 6000,
        outputTokens: 2000,
      }
    case 'qwen_visual_understanding':
      return {
        usageCategory: 'media_analysis',
        computeLevel: 'premium',
        providerType: 'external_api',
        providerName: 'qwen_provider_gateway',
        modelName: 'future_owner_approved_qwen_vl',
        qualityLevel: 'premium',
        inputVideoSeconds: 45,
        inputTokens: 2000,
        outputTokens: 1200,
      }
    case 'render':
      return {
        usageCategory: 'rendering',
        computeLevel: 'standard',
        providerType: 'deterministic_renderer',
        qualityLevel: 'production',
        outputVideoSeconds: 60,
        renderDurationSeconds: 90,
        estimatedRuntimeSeconds: 120,
        resolution: '1920x1080',
        frameRate: 30,
        vcpuCount: 2,
        memoryGiB: 4,
        outputStorageGiBHours: 0.25,
      }
    case 'storage_runtime':
      return {
        usageCategory: 'other',
        computeLevel: 'economy',
        providerType: 'cloud_run_request',
        qualityLevel: 'draft',
        estimatedRuntimeSeconds: 5,
        outputStorageGiBHours: 0.1,
      }
    case 'timeline':
      return {
        usageCategory: 'planning',
        computeLevel: 'economy',
        providerType: 'cloud_run_request',
        qualityLevel: 'draft',
        estimatedRuntimeSeconds: 10,
      }
    case 'track_a_container_tools':
      return {
        usageCategory: 'media_analysis',
        computeLevel: 'standard',
        providerType: 'cloud_run_job',
        qualityLevel: 'preview',
        inputVideoSeconds: 60,
        estimatedRuntimeSeconds: 90,
        vcpuCount: 2,
        memoryGiB: 2,
      }
    case 'transcript':
      return {
        usageCategory: 'transcription',
        computeLevel: 'standard',
        providerType: 'cloud_run_job',
        qualityLevel: 'preview',
        inputAudioSeconds: 90,
        estimatedRuntimeSeconds: 120,
        vcpuCount: 2,
        memoryGiB: 2,
      }
  }
}

function normalizePricingSnapshot(snapshot: Record<string, unknown>): Record<string, string | number | boolean | null | string[]> {
  const normalized: Record<string, string | number | boolean | null | string[]> = {}

  for (const [key, value] of Object.entries(snapshot)) {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      normalized[key] = value
      continue
    }

    if (Array.isArray(value)) {
      normalized[key] = value.map((item) => String(item))
      continue
    }

    normalized[key] = JSON.stringify(value)
  }

  return normalized
}

function normalizeString(value: string | null | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeNumber(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
