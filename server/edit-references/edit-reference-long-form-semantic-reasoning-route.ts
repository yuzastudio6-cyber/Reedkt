import { createHash } from 'node:crypto'
import {
  qwenLongFormSemanticChunkContextSchema,
  type QwenLongFormSemanticChunkContext,
  type QwenLongFormSemanticChunkFinding,
  type QwenLongFormSemanticChunkProvider,
} from '../services/qwen-long-form-semantic-chunk-provider'
import {
  resolveEditReferenceReasoningRouteProviderFailClosed,
  validateEditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteAuthorization,
  type EditReferenceReasoningRouteId,
  type EditReferenceReasoningRouteProviderResolver,
} from './edit-reference-reasoning-route-authorization'
import {
  validateEditReferenceLongFormStudyUsage,
  type EditReferenceLongFormStudyUsageEvidence,
} from './edit-reference-long-form-study-usage-contract'

export const EDIT_REFERENCE_LONG_FORM_SEMANTIC_REASONING_ROUTE_VERSION =
  'edit-reference-long-form-semantic-reasoning-route-v1' as const

export interface EditReferenceLongFormSemanticReasoningProviderResult {
  readonly status: 'completed' | 'blocked'
  readonly findings: readonly QwenLongFormSemanticChunkFinding[]
  readonly chunkSummary?: string
  readonly execution: {
    readonly structuredEvidenceRead: boolean
    readonly providerCallMade: boolean
    readonly modelCallMade: boolean
    readonly workerJobCreated: false
    readonly remoteMutationMade: false
  }
  readonly runtimeProvenance?: {
    readonly runtimeSource: 'verified_live'
    readonly adapterId: string
    readonly adapterVersion: string
    readonly providerId: string
    readonly modelId: string
    readonly modelRevision: string
    readonly modelAggregateSha256: string
    readonly modelRoutingPolicyVersion: string
    readonly synthesisInstructionDigestSha256: string
  }
  readonly blockers: readonly string[]
}

export interface EditReferenceLongFormSemanticReasoningProvider {
  readonly executionMode: 'live_provider'
  readonly routeId: EditReferenceReasoningRouteId
  readonly providerBoundary: EditReferenceReasoningRouteAuthorization['providerBoundary']
  readonly exactProviderModelId: EditReferenceReasoningRouteAuthorization['exactProviderModelId']
  analyze(
    context: QwenLongFormSemanticChunkContext,
  ): Promise<EditReferenceLongFormSemanticReasoningProviderResult>
}

export type ResolveEditReferenceLongFormSemanticReasoningProvider =
  EditReferenceReasoningRouteProviderResolver<EditReferenceLongFormSemanticReasoningProvider>

export interface EditReferenceLongFormSemanticReasoningRouteResolution {
  readonly schemaVersion: typeof EDIT_REFERENCE_LONG_FORM_SEMANTIC_REASONING_ROUTE_VERSION
  readonly requestDigestSha256: string
  readonly authorization: EditReferenceReasoningRouteAuthorization
  readonly provider: EditReferenceLongFormSemanticReasoningProvider
  readonly qwenCompatibilityProviderUsed: boolean
  readonly providerCallMade: false
}

export function hashEditReferenceLongFormSemanticReasoningRequest(input: {
  readonly context: QwenLongFormSemanticChunkContext
  readonly usage: EditReferenceLongFormStudyUsageEvidence
}): string {
  const context = qwenLongFormSemanticChunkContextSchema.parse(input.context)
  validateEditReferenceLongFormStudyUsage(input.usage)
  const costAuthority = costAuthorityFromUsage(input.usage)
  return sha256({
    schemaVersion: EDIT_REFERENCE_LONG_FORM_SEMANTIC_REASONING_ROUTE_VERSION,
    lane: 'long_form_semantic_synthesis',
    context,
    costAuthority,
  })
}

/**
 * Consumes, but never mints, the shared backend reasoning-route authority.
 * A legacy Qwen provider can be adapted only for an already-authorized Qwen
 * fallback attempt. Kimi and DeepSeek must arrive through the injected shared
 * backend resolver, so this feature cannot silently substitute providers.
 */
export async function resolveEditReferenceLongFormSemanticReasoningRoute(input: {
  readonly context: QwenLongFormSemanticChunkContext
  readonly usage: EditReferenceLongFormStudyUsageEvidence
  readonly authorization: EditReferenceReasoningRouteAuthorization | null | undefined
  readonly providerResolver: ResolveEditReferenceLongFormSemanticReasoningProvider | null | undefined
  readonly qwenFallbackProvider?: QwenLongFormSemanticChunkProvider | null
}): Promise<EditReferenceLongFormSemanticReasoningRouteResolution> {
  const requestDigestSha256 = hashEditReferenceLongFormSemanticReasoningRequest(input)
  const expectedRouteId = input.authorization?.routeId ?? 'kimi_k3_primary'
  const validation = validateEditReferenceReasoningRouteAuthorization({
    authorization: input.authorization,
    expectedLane: 'long_form_semantic_synthesis',
    expectedRouteId,
    requestDigestSha256,
    costAuthority: costAuthorityFromUsage(input.usage),
  })
  if (!validation.ok || !input.authorization) {
    throw new Error('Long-form semantic synthesis lacks exact shared reasoning-route authority.')
  }

  const qwenCompatibilityProvider = input.qwenFallbackProvider
    ? wrapAuthorizedQwenFallback(input.qwenFallbackProvider)
    : undefined
  const provider = await resolveEditReferenceReasoningRouteProviderFailClosed({
    authorization: input.authorization,
    resolver: input.providerResolver,
    qwenFallbackProvider: qwenCompatibilityProvider,
  })
  if (
    !provider
    || provider.executionMode !== 'live_provider'
    || provider.routeId !== input.authorization.routeId
    || provider.providerBoundary !== input.authorization.providerBoundary
    || provider.exactProviderModelId !== input.authorization.exactProviderModelId
    || typeof provider.analyze !== 'function'
  ) {
    throw new Error('Long-form semantic synthesis provider does not match the authorized reasoning route.')
  }

  return {
    schemaVersion: EDIT_REFERENCE_LONG_FORM_SEMANTIC_REASONING_ROUTE_VERSION,
    requestDigestSha256,
    authorization: input.authorization,
    provider,
    qwenCompatibilityProviderUsed: provider === qwenCompatibilityProvider,
    providerCallMade: false,
  }
}

function wrapAuthorizedQwenFallback(
  provider: QwenLongFormSemanticChunkProvider,
): EditReferenceLongFormSemanticReasoningProvider {
  if (provider.executionMode !== 'live_provider') {
    throw new Error('Long-form semantic Qwen compatibility provider is not a live provider.')
  }
  return {
    executionMode: 'live_provider',
    routeId: 'qwen_3_7_fallback',
    providerBoundary: 'qwen_3_7_provider_boundary',
    exactProviderModelId: 'qwen3.7-max-2026-06-08',
    analyze: (context) => provider.analyze(context),
  }
}

function costAuthorityFromUsage(usage: EditReferenceLongFormStudyUsageEvidence) {
  if (
    usage.mode !== 'production_metered'
    || usage.productionCostAuthoritySatisfied !== true
    || !usage.approvedUsageEstimateId
    || !usage.internalCostBudgetId
    || !usage.rateCardSnapshotId
    || !usage.maximumAuthorizedInternalCostMicros
  ) throw new Error('Long-form semantic synthesis requires exact production internal-cost authority.')
  return {
    executionScope: 'production' as const,
    approvedUsageEstimateId: usage.approvedUsageEstimateId,
    internalCostBudgetId: usage.internalCostBudgetId,
    immutableRateCardSnapshotId: usage.rateCardSnapshotId,
    maximumAuthorizedInternalCostMicros: usage.maximumAuthorizedInternalCostMicros,
  }
}

function sha256(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}
