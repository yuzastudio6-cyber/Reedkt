import type {
  MotionStudioCurrencyExchangeRateSnapshot,
  MotionStudioProviderNativeRateSnapshot,
  ProviderRateCardEvidenceRef,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID,
  MOTION_STUDIO_GPT_IMAGE_MODEL_ID,
  MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID,
  MOTION_STUDIO_HAILUO_MODEL_ID,
} from '../../../src/types/motion-studio'
import {
  providerRateCardEvidenceRefSchema,
  validateMotionStudioProviderNativeRateSnapshot,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'
import type { MotionStudioAttemptUsageLine } from '../jobs/types'
import { assertWanCostSnapshotCurrent, deriveWanUsdCost } from './cost-conversion'
import type {
  ParsedGptImage2LiveResponse,
  ParsedHailuoQueryResponse,
  ParsedWanQueryResponse,
} from './live-provider-adapters'

export const MOTION_STUDIO_GPT_IMAGE_2_TOKEN_RATE_SNAPSHOT_VERSION =
  'motion-studio-gpt-image-2-token-rate-snapshot-v1' as const
export const MOTION_STUDIO_LIVE_MEDIA_QA_CPU_RATE_SNAPSHOT_VERSION =
  'motion-studio-live-media-qa-cpu-rate-snapshot-v1' as const

const MOTION_STUDIO_LIVE_MEDIA_QA_TOOL_ID = 'motion_studio_live_media_ingest_qa' as const

const TOKENS_PER_RATE_UNIT = 1_000_000n
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)

export interface MotionStudioGptImage2TokenRateSnapshot {
  schemaVersion: typeof MOTION_STUDIO_GPT_IMAGE_2_TOKEN_RATE_SNAPSHOT_VERSION
  id: string
  providerAdapterId: typeof MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID
  modelOrService: typeof MOTION_STUDIO_GPT_IMAGE_MODEL_ID
  version: string
  contentDigest: string
  textInputUsdMicrosPerMillionTokens: number
  imageInputUsdMicrosPerMillionTokens: number
  cachedTextInputUsdMicrosPerMillionTokens: number
  cachedImageInputUsdMicrosPerMillionTokens: number
  outputImageUsdMicrosPerMillionTokens: number
  sourceReference: ProviderRateCardEvidenceRef
  effectiveFrom: string
  effectiveTo?: string
  verifiedAt: string
  immutable: true
}

export interface MotionStudioLiveMediaQaCpuRateSnapshot {
  schemaVersion: typeof MOTION_STUDIO_LIVE_MEDIA_QA_CPU_RATE_SNAPSHOT_VERSION
  id: string
  toolOrService: typeof MOTION_STUDIO_LIVE_MEDIA_QA_TOOL_ID
  version: string
  contentDigest: string
  unit: 'cpu_second'
  unitPriceUsdMicrosPerCpuSecond: number
  minimumChargeUsdMicros: number
  sourceReference: ProviderRateCardEvidenceRef
  effectiveFrom: string
  effectiveTo?: string
  verifiedAt: string
  immutable: true
}

export interface MotionStudioLiveCostAuthority {
  costEstimateItemId: string
  rateCardVersionId: string
  maximumAuthorizedInternalCostMicros: number
}

export interface MotionStudioGptImage2CostAuthority extends MotionStudioLiveCostAuthority {
  rateSnapshot: MotionStudioGptImage2TokenRateSnapshot
}

export interface MotionStudioWanCostAuthority extends MotionStudioLiveCostAuthority {
  derivationId: string
  derivedUsdRateCardVersionId: string
  nativeRateSnapshot: MotionStudioProviderNativeRateSnapshot
  fxSnapshot?: MotionStudioCurrencyExchangeRateSnapshot
  calculatedAt: string
}

export interface MotionStudioHailuoCostAuthority extends MotionStudioLiveCostAuthority {
  nativeRateSnapshot: MotionStudioProviderNativeRateSnapshot
  calculatedAt: string
}

export interface MotionStudioLiveInfrastructureCostAuthority extends MotionStudioLiveCostAuthority {
  rateSnapshot: MotionStudioLiveMediaQaCpuRateSnapshot
}

export interface MotionStudioGptImage2CostBreakdown {
  uncachedTextTokens: number
  uncachedImageTokens: number
  cachedTextTokens: number
  cachedImageTokens: number
  outputImageTokens: number
  internalCostMicros: number
  roundingRule: 'ceil_total_usd_micros'
  cachedTokenAllocation: 'text_first_conservative_when_provider_does_not_split_cache_type'
}

export function createMotionStudioGptImage2TokenRateSnapshot(
  input: Omit<MotionStudioGptImage2TokenRateSnapshot, 'schemaVersion' | 'contentDigest' | 'immutable'>,
): MotionStudioGptImage2TokenRateSnapshot {
  const base = {
    schemaVersion: MOTION_STUDIO_GPT_IMAGE_2_TOKEN_RATE_SNAPSHOT_VERSION,
    ...input,
    immutable: true as const,
  }
  const snapshot = {
    ...base,
    contentDigest: gptRateSnapshotContentDigest({ ...base, contentDigest: '' }),
  }
  assertGptRateSnapshot(snapshot, input.verifiedAt)
  return snapshot
}

export function createMotionStudioLiveMediaQaCpuRateSnapshot(
  input: Omit<MotionStudioLiveMediaQaCpuRateSnapshot, 'schemaVersion' | 'contentDigest' | 'immutable'>,
): MotionStudioLiveMediaQaCpuRateSnapshot {
  const base = {
    schemaVersion: MOTION_STUDIO_LIVE_MEDIA_QA_CPU_RATE_SNAPSHOT_VERSION,
    ...input,
    immutable: true as const,
  }
  const snapshot = {
    ...base,
    contentDigest: liveMediaQaRateSnapshotContentDigest({ ...base, contentDigest: '' }),
  }
  assertLiveMediaQaRateSnapshot(snapshot, input.verifiedAt)
  return snapshot
}

export function meterMotionStudioLiveMediaQaCpuUsage(input: {
  operationId: string
  requestDigest: string
  responseDigest: string
  qaEvidenceDigest?: string
  cpuUsageMicroseconds: number
  authority: MotionStudioLiveInfrastructureCostAuthority
  measuredAt: string
}): MotionStudioAttemptUsageLine {
  if (!stableId(input.operationId)) throw invalid('Live media QA operation ID is invalid.')
  assertDigest(input.requestDigest, 'live media QA request digest')
  assertDigest(input.responseDigest, 'live media QA response digest')
  if (input.qaEvidenceDigest) assertDigest(input.qaEvidenceDigest, 'live media QA evidence digest')
  if (
    !Number.isSafeInteger(input.cpuUsageMicroseconds) ||
    input.cpuUsageMicroseconds < 0 ||
    input.cpuUsageMicroseconds > 500_000_000
  ) throw invalid('Live media QA CPU measurement is outside the bounded five-hundred-second window.')
  assertCostAuthority(input.authority)
  assertLiveMediaQaRateSnapshot(input.authority.rateSnapshot, input.measuredAt)
  if (input.authority.rateSnapshot.id !== input.authority.rateCardVersionId) {
    throw invalid('Live media QA CPU schedule must match the exact immutable job rate-card version.')
  }
  const rate = input.authority.rateSnapshot
  const calculated = safeNumber(ceilDiv(
    BigInt(input.cpuUsageMicroseconds) * BigInt(rate.unitPriceUsdMicrosPerCpuSecond),
    TOKENS_PER_RATE_UNIT,
  ), 'live media QA infrastructure cost')
  const internalCostMicros = Math.max(rate.minimumChargeUsdMicros, calculated)
  assertWithinCostCeiling(internalCostMicros, input.authority.maximumAuthorizedInternalCostMicros)
  return {
    costEstimateItemId: input.authority.costEstimateItemId,
    meterId: 'cpu_second',
    quantity: input.cpuUsageMicroseconds / 1_000_000,
    internalCostMicros,
    evidenceClass: 'infrastructure_metered',
    evidenceDigest: sha256CanonicalJson({
      schemaVersion: 'motion-studio-live-media-qa-cpu-usage-v1',
      operationId: input.operationId,
      requestDigest: input.requestDigest,
      responseDigest: input.responseDigest,
      qaEvidenceDigest: input.qaEvidenceDigest ?? null,
      cpuUsageMicroseconds: input.cpuUsageMicroseconds,
      quantityCpuSeconds: input.cpuUsageMicroseconds / 1_000_000,
      rateSnapshotId: rate.id,
      rateSnapshotDigest: rate.contentDigest,
      rateCardVersionId: input.authority.rateCardVersionId,
      internalCostMicros,
      measuredAt: input.measuredAt,
    }),
  }
}

export function meterGptImage2ProviderUsage(input: {
  operationKind: 'gpt_image_generation' | 'gpt_image_edit'
  usage: ParsedGptImage2LiveResponse['usage']
  responseDigest: string
  authority: MotionStudioGptImage2CostAuthority
  measuredAt: string
}): { usageLine: MotionStudioAttemptUsageLine; breakdown: MotionStudioGptImage2CostBreakdown } {
  assertDigest(input.responseDigest, 'GPT Image 2 response digest')
  assertCostAuthority(input.authority)
  assertGptRateSnapshot(input.authority.rateSnapshot, input.measuredAt)
  if (input.authority.rateSnapshot.id !== input.authority.rateCardVersionId) {
    throw invalid('GPT Image 2 token schedule must match the exact immutable job rate-card version.')
  }
  const usage = input.usage
  const textTokens = usage.inputTextTokens
  const imageTokens = usage.inputImageTokens
  const cachedTokens = usage.inputCachedTokens
  const outputImageTokens = usage.outputImageTokens
  if (textTokens + imageTokens !== usage.inputTokens || outputImageTokens !== usage.outputTokens) {
    throw invalid('GPT Image 2 detailed usage does not reconcile to provider totals.')
  }
  if (cachedTokens > usage.inputTokens) throw invalid('GPT Image 2 cached usage exceeds total input usage.')

  // OpenAI reports one cached-token total rather than cached text/image splits.
  // Allocating cache to text first applies the smaller discount first and is
  // therefore the conservative provisional internal-cost interpretation.
  const cachedTextTokens = Math.min(cachedTokens, textTokens)
  const cachedImageTokens = cachedTokens - cachedTextTokens
  if (cachedImageTokens > imageTokens) throw invalid('GPT Image 2 cached usage cannot be allocated to input categories.')
  const uncachedTextTokens = textTokens - cachedTextTokens
  const uncachedImageTokens = imageTokens - cachedImageTokens
  const rate = input.authority.rateSnapshot
  const numerator =
    BigInt(uncachedTextTokens) * BigInt(rate.textInputUsdMicrosPerMillionTokens) +
    BigInt(uncachedImageTokens) * BigInt(rate.imageInputUsdMicrosPerMillionTokens) +
    BigInt(cachedTextTokens) * BigInt(rate.cachedTextInputUsdMicrosPerMillionTokens) +
    BigInt(cachedImageTokens) * BigInt(rate.cachedImageInputUsdMicrosPerMillionTokens) +
    BigInt(outputImageTokens) * BigInt(rate.outputImageUsdMicrosPerMillionTokens)
  const internalCostMicros = safeNumber(ceilDiv(numerator, TOKENS_PER_RATE_UNIT), 'GPT Image 2 internal cost')
  assertWithinCostCeiling(internalCostMicros, input.authority.maximumAuthorizedInternalCostMicros)
  const breakdown: MotionStudioGptImage2CostBreakdown = {
    uncachedTextTokens,
    uncachedImageTokens,
    cachedTextTokens,
    cachedImageTokens,
    outputImageTokens,
    internalCostMicros,
    roundingRule: 'ceil_total_usd_micros',
    cachedTokenAllocation: 'text_first_conservative_when_provider_does_not_split_cache_type',
  }
  return {
    usageLine: {
      costEstimateItemId: input.authority.costEstimateItemId,
      meterId: 'provider_request',
      quantity: 1,
      internalCostMicros,
      evidenceClass: 'provider_reported',
      evidenceDigest: sha256CanonicalJson({
        schemaVersion: 'motion-studio-gpt-image-2-provider-usage-v1',
        operationKind: input.operationKind,
        rateSnapshotId: rate.id,
        rateSnapshotDigest: rate.contentDigest,
        rateCardVersionId: input.authority.rateCardVersionId,
        responseDigest: input.responseDigest,
        providerUsage: usage,
        breakdown,
        measuredAt: input.measuredAt,
      }),
    },
    breakdown,
  }
}

export function meterWanProviderUsage(input: {
  result: ParsedWanQueryResponse
  authority: MotionStudioWanCostAuthority
}): { usageLine: MotionStudioAttemptUsageLine; derivation: ReturnType<typeof deriveWanUsdCost> } {
  if (input.result.status !== 'SUCCEEDED' || !input.result.usage) {
    throw invalid('Wan provider cost requires one successful provider-reported six-second result.')
  }
  return meterWanProviderUsageFromPersistedEvidence({
    providerResponseDigest: input.result.responseDigest,
    usage: input.result.usage,
    authority: input.authority,
  })
}

export function meterWanProviderUsageFromPersistedEvidence(input: {
  providerResponseDigest: string
  usage: {
    billedDurationSeconds: number
    outputDurationSeconds: number
    videoCount: 1
    resolution: 720
  }
  authority: MotionStudioWanCostAuthority
}): { usageLine: MotionStudioAttemptUsageLine; derivation: ReturnType<typeof deriveWanUsdCost> } {
  assertDigest(input.providerResponseDigest, 'Wan provider response digest')
  assertCostAuthority(input.authority)
  if (
    input.usage.billedDurationSeconds !== 6 || input.usage.outputDurationSeconds !== 6 ||
    input.usage.videoCount !== 1 || input.usage.resolution !== 720
  ) {
    throw invalid('Persisted Wan provider usage must describe one exact six-second 720P result.')
  }
  assertWanCostSnapshotCurrent({
    nativeRateSnapshot: input.authority.nativeRateSnapshot,
    fxSnapshot: input.authority.fxSnapshot,
    now: input.authority.calculatedAt,
  })
  if (input.authority.derivedUsdRateCardVersionId !== input.authority.rateCardVersionId) {
    throw invalid('Wan USD derivation must match the exact immutable job rate-card version.')
  }
  const derivation = deriveWanUsdCost({
    id: input.authority.derivationId,
    derivedUsdRateCardVersionId: input.authority.derivedUsdRateCardVersionId,
    quantitySeconds: input.usage.billedDurationSeconds,
    nativeRateSnapshot: input.authority.nativeRateSnapshot,
    fxSnapshot: input.authority.fxSnapshot,
    calculatedAt: input.authority.calculatedAt,
  })
  assertWithinCostCeiling(derivation.usdInternalCostMicros, input.authority.maximumAuthorizedInternalCostMicros)
  return {
    usageLine: {
      costEstimateItemId: input.authority.costEstimateItemId,
      meterId: 'generated_video_second',
      quantity: input.usage.billedDurationSeconds,
      internalCostMicros: derivation.usdInternalCostMicros,
      evidenceClass: 'provider_reported',
      evidenceDigest: sha256CanonicalJson({
        schemaVersion: 'motion-studio-wan-provider-usage-v1',
        providerResponseDigest: input.providerResponseDigest,
        rateCardVersionId: input.authority.rateCardVersionId,
        providerUsage: input.usage,
        derivation,
      }),
    },
    derivation,
  }
}

export function meterHailuoProviderUsage(input: {
  result: ParsedHailuoQueryResponse
  authority: MotionStudioHailuoCostAuthority
}): MotionStudioAttemptUsageLine {
  if (input.result.status !== 'Success' || input.result.width !== 1364 || input.result.height !== 768) {
    throw invalid('Hailuo provider cost requires the exact successful provider-native 1364x768 evidence result.')
  }
  return meterHailuoProviderUsageFromPersistedEvidence({
    providerResponseDigest: input.result.responseDigest,
    providerNativeWidth: input.result.width,
    providerNativeHeight: input.result.height,
    authority: input.authority,
  })
}

export function meterHailuoProviderUsageFromPersistedEvidence(input: {
  providerResponseDigest: string
  providerNativeWidth: 1364
  providerNativeHeight: 768
  authority: MotionStudioHailuoCostAuthority
}): MotionStudioAttemptUsageLine {
  assertCostAuthority(input.authority)
  if (input.providerNativeWidth !== 1364 || input.providerNativeHeight !== 768) {
    throw invalid('Persisted Hailuo usage requires exact provider-native 1364x768 evidence.')
  }
  assertDigest(input.providerResponseDigest, 'Hailuo response digest')
  const validation = validateMotionStudioProviderNativeRateSnapshot(input.authority.nativeRateSnapshot)
  if (!validation.ok) throw invalid(`Invalid Hailuo rate snapshot: ${validation.errors.join(' ')}`)
  const rate = input.authority.nativeRateSnapshot
  if (
    rate.providerRoute !== 'hailuo' || rate.providerAdapterId !== MOTION_STUDIO_HAILUO_LIVE_ADAPTER_ID ||
    rate.modelOrService !== MOTION_STUDIO_HAILUO_MODEL_ID || rate.currency !== 'USD' || rate.unit !== 'request'
  ) throw invalid('Hailuo usage requires the exact frozen USD-per-request rate snapshot.')
  if (rate.id !== input.authority.rateCardVersionId) {
    throw invalid('Hailuo rate snapshot must match the exact immutable job rate-card version.')
  }
  assertNativeRateCurrent(rate, input.authority.calculatedAt)
  const internalCostMicros = Math.max(rate.unitPriceNativeMicros, rate.minimumChargeNativeMicros)
  assertWithinCostCeiling(internalCostMicros, input.authority.maximumAuthorizedInternalCostMicros)
  return {
    costEstimateItemId: input.authority.costEstimateItemId,
    meterId: 'provider_request',
    quantity: 1,
    internalCostMicros,
    evidenceClass: 'provider_reported',
    evidenceDigest: sha256CanonicalJson({
      schemaVersion: 'motion-studio-hailuo-provider-usage-v1',
      rateSnapshotId: rate.id,
      rateSnapshotDigest: rate.contentDigest,
      rateCardVersionId: input.authority.rateCardVersionId,
      responseDigest: input.providerResponseDigest,
      quantity: 1,
      internalCostMicros,
      calculatedAt: input.authority.calculatedAt,
    }),
  }
}

function assertGptRateSnapshot(snapshot: MotionStudioGptImage2TokenRateSnapshot, nowValue: string): void {
  if (
    snapshot.schemaVersion !== MOTION_STUDIO_GPT_IMAGE_2_TOKEN_RATE_SNAPSHOT_VERSION ||
    snapshot.providerAdapterId !== MOTION_STUDIO_GPT_IMAGE_LIVE_ADAPTER_ID ||
    snapshot.modelOrService !== MOTION_STUDIO_GPT_IMAGE_MODEL_ID || snapshot.immutable !== true ||
    !stableId(snapshot.id) || !stableId(snapshot.version)
  ) throw invalid('GPT Image 2 rate snapshot identity is invalid.')
  for (const [field, value] of Object.entries({
    textInputUsdMicrosPerMillionTokens: snapshot.textInputUsdMicrosPerMillionTokens,
    imageInputUsdMicrosPerMillionTokens: snapshot.imageInputUsdMicrosPerMillionTokens,
    cachedTextInputUsdMicrosPerMillionTokens: snapshot.cachedTextInputUsdMicrosPerMillionTokens,
    cachedImageInputUsdMicrosPerMillionTokens: snapshot.cachedImageInputUsdMicrosPerMillionTokens,
    outputImageUsdMicrosPerMillionTokens: snapshot.outputImageUsdMicrosPerMillionTokens,
  })) assertPositiveSafeInteger(value, field)
  if (
    snapshot.cachedTextInputUsdMicrosPerMillionTokens > snapshot.textInputUsdMicrosPerMillionTokens ||
    snapshot.cachedImageInputUsdMicrosPerMillionTokens > snapshot.imageInputUsdMicrosPerMillionTokens
  ) throw invalid('GPT Image 2 cached rates cannot exceed uncached rates.')
  if (!providerRateCardEvidenceRefSchema.safeParse(snapshot.sourceReference).success) {
    throw invalid('GPT Image 2 rate snapshot lacks valid immutable pricing evidence.')
  }
  const expectedDigest = gptRateSnapshotContentDigest(snapshot)
  if (snapshot.contentDigest !== expectedDigest || !/^[a-f0-9]{64}$/.test(snapshot.contentDigest)) {
    throw invalid('GPT Image 2 rate snapshot digest does not match its immutable fields.')
  }
  const now = Date.parse(nowValue)
  const from = Date.parse(snapshot.effectiveFrom)
  const to = snapshot.effectiveTo ? Date.parse(snapshot.effectiveTo) : Number.POSITIVE_INFINITY
  const verified = Date.parse(snapshot.verifiedAt)
  const captured = Date.parse(snapshot.sourceReference.capturedAt)
  if (
    !Number.isFinite(now) || !Number.isFinite(from) || Number.isNaN(to) ||
    !Number.isFinite(verified) || !Number.isFinite(captured) || captured > verified || verified > now ||
    now < from || now >= to
  ) {
    throw blocked('GPT Image 2 rate snapshot is not current.')
  }
}

function assertLiveMediaQaRateSnapshot(
  snapshot: MotionStudioLiveMediaQaCpuRateSnapshot,
  nowValue: string,
): void {
  if (
    snapshot.schemaVersion !== MOTION_STUDIO_LIVE_MEDIA_QA_CPU_RATE_SNAPSHOT_VERSION ||
    snapshot.toolOrService !== MOTION_STUDIO_LIVE_MEDIA_QA_TOOL_ID ||
    snapshot.unit !== 'cpu_second' || snapshot.immutable !== true ||
    !stableId(snapshot.id) || !stableId(snapshot.version)
  ) throw invalid('Live media QA CPU rate snapshot identity is invalid.')
  assertPositiveSafeInteger(snapshot.unitPriceUsdMicrosPerCpuSecond, 'live media QA CPU unit rate')
  if (!Number.isSafeInteger(snapshot.minimumChargeUsdMicros) || snapshot.minimumChargeUsdMicros < 0) {
    throw invalid('Live media QA minimum charge must be a non-negative safe integer.')
  }
  if (!providerRateCardEvidenceRefSchema.safeParse(snapshot.sourceReference).success) {
    throw invalid('Live media QA CPU rate snapshot lacks valid immutable evidence.')
  }
  if (
    snapshot.contentDigest !== liveMediaQaRateSnapshotContentDigest(snapshot) ||
    !/^[a-f0-9]{64}$/.test(snapshot.contentDigest)
  ) throw invalid('Live media QA CPU rate snapshot digest does not match its immutable fields.')
  const now = Date.parse(nowValue)
  const from = Date.parse(snapshot.effectiveFrom)
  const to = snapshot.effectiveTo ? Date.parse(snapshot.effectiveTo) : Number.POSITIVE_INFINITY
  const verified = Date.parse(snapshot.verifiedAt)
  const captured = Date.parse(snapshot.sourceReference.capturedAt)
  if (
    !Number.isFinite(now) || !Number.isFinite(from) || Number.isNaN(to) ||
    !Number.isFinite(verified) || !Number.isFinite(captured) || captured > verified || verified > now ||
    now < from || now >= to
  ) throw blocked('Live media QA CPU rate snapshot is not current.')
}

function gptRateSnapshotContentDigest(snapshot: MotionStudioGptImage2TokenRateSnapshot): string {
  return sha256CanonicalJson({
    schemaVersion: snapshot.schemaVersion,
    id: snapshot.id,
    providerAdapterId: snapshot.providerAdapterId,
    modelOrService: snapshot.modelOrService,
    version: snapshot.version,
    textInputUsdMicrosPerMillionTokens: snapshot.textInputUsdMicrosPerMillionTokens,
    imageInputUsdMicrosPerMillionTokens: snapshot.imageInputUsdMicrosPerMillionTokens,
    cachedTextInputUsdMicrosPerMillionTokens: snapshot.cachedTextInputUsdMicrosPerMillionTokens,
    cachedImageInputUsdMicrosPerMillionTokens: snapshot.cachedImageInputUsdMicrosPerMillionTokens,
    outputImageUsdMicrosPerMillionTokens: snapshot.outputImageUsdMicrosPerMillionTokens,
    sourceReference: snapshot.sourceReference,
    effectiveFrom: snapshot.effectiveFrom,
    effectiveTo: snapshot.effectiveTo ?? null,
    verifiedAt: snapshot.verifiedAt,
    immutable: true,
  })
}

function liveMediaQaRateSnapshotContentDigest(snapshot: MotionStudioLiveMediaQaCpuRateSnapshot): string {
  return sha256CanonicalJson({
    schemaVersion: snapshot.schemaVersion,
    id: snapshot.id,
    toolOrService: snapshot.toolOrService,
    version: snapshot.version,
    unit: snapshot.unit,
    unitPriceUsdMicrosPerCpuSecond: snapshot.unitPriceUsdMicrosPerCpuSecond,
    minimumChargeUsdMicros: snapshot.minimumChargeUsdMicros,
    sourceReference: snapshot.sourceReference,
    effectiveFrom: snapshot.effectiveFrom,
    effectiveTo: snapshot.effectiveTo ?? null,
    verifiedAt: snapshot.verifiedAt,
    immutable: true,
  })
}

function assertNativeRateCurrent(rate: MotionStudioProviderNativeRateSnapshot, nowValue: string): void {
  const now = Date.parse(nowValue)
  const from = Date.parse(rate.effectiveFrom)
  const to = rate.effectiveTo ? Date.parse(rate.effectiveTo) : Number.POSITIVE_INFINITY
  if (!Number.isFinite(now) || !Number.isFinite(from) || Number.isNaN(to) || now < from || now >= to) {
    throw blocked('Provider-native rate snapshot is not current.')
  }
}

function assertCostAuthority(authority: MotionStudioLiveCostAuthority): void {
  if (!stableId(authority.costEstimateItemId)) throw invalid('Cost estimate item ID is invalid.')
  if (!stableId(authority.rateCardVersionId)) throw invalid('Rate-card version ID is invalid.')
  assertPositiveSafeInteger(authority.maximumAuthorizedInternalCostMicros, 'maximum authorized internal cost')
}

function assertWithinCostCeiling(cost: number, maximum: number): void {
  if (!Number.isSafeInteger(cost) || cost < 0 || cost > maximum) {
    throw blocked('Measured usage exceeds the immutable operation cost ceiling.')
  }
}

function assertPositiveSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) throw invalid(`${label} must be a positive safe integer.`)
}

function safeNumber(value: bigint, label: string): number {
  if (value < 0n || value > MAX_SAFE_BIGINT) throw invalid(`${label} exceeds safe integer micros.`)
  return Number(value)
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator - 1n) / denominator
}

function assertDigest(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) throw invalid(`${label} is malformed.`)
}

function stableId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(value) && !value.includes('..')
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}

function blocked(message: string): ApiError {
  return new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', message, 409)
}
