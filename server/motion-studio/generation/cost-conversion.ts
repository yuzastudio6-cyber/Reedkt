import type {
  MotionStudioCurrencyExchangeRateSnapshot,
  MotionStudioWanUsdCostDerivation,
  MotionStudioProviderNativeRateSnapshot,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_WAN_USD_COST_DERIVATION_VERSION,
} from '../../../src/types/motion-studio'
import {
  validateMotionStudioCurrencyExchangeRateSnapshot,
  validateMotionStudioProviderNativeRateSnapshot,
} from '../../../src/lib/motion-studio/contracts'
import { ApiError } from '../../errors/api-error'
import { sha256CanonicalJson } from '../commands/canonical-json'

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER)

function assertPositiveSafeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be a positive safe integer.`, 400)
  }
}

/** Convert a rational CNY-micro amount to USD micros, always rounding upward. */
export function convertCnyMicrosToUsdMicrosCeil(input: {
  cnyMicros: number
  fxSnapshot: MotionStudioCurrencyExchangeRateSnapshot
}): number {
  assertPositiveSafeInteger(input.cnyMicros, 'cnyMicros')
  const validation = validateMotionStudioCurrencyExchangeRateSnapshot(input.fxSnapshot)
  if (!validation.ok) {
    throw new ApiError('VALIDATION_FAILED', `Invalid FX snapshot: ${validation.errors.join(' ')}`, 400)
  }
  const numerator = BigInt(input.cnyMicros) * BigInt(input.fxSnapshot.quoteAmountMicros)
  const denominator = BigInt(input.fxSnapshot.baseAmountMicros)
  const roundedUp = (numerator + denominator - 1n) / denominator
  if (roundedUp > MAX_SAFE_BIGINT) {
    throw new ApiError('VALIDATION_FAILED', 'Converted USD amount exceeds safe integer micros.', 400)
  }
  return Number(roundedUp)
}

export function deriveWanUsdCost(input: {
  id: string
  derivedUsdRateCardVersionId: string
  quantitySeconds: number
  nativeRateSnapshot: MotionStudioProviderNativeRateSnapshot
  fxSnapshot?: MotionStudioCurrencyExchangeRateSnapshot
  calculatedAt: string
}): MotionStudioWanUsdCostDerivation {
  assertPositiveSafeInteger(input.quantitySeconds, 'quantitySeconds')
  const rateValidation = validateMotionStudioProviderNativeRateSnapshot(input.nativeRateSnapshot)
  if (!rateValidation.ok) {
    throw new ApiError('VALIDATION_FAILED', `Invalid provider-native rate snapshot: ${rateValidation.errors.join(' ')}`, 400)
  }
  if (
    input.nativeRateSnapshot.providerRoute !== 'wan' ||
    input.nativeRateSnapshot.unit !== 'video_second'
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Wan derivation requires a registered provider-native rate per video second.', 400)
  }
  const nativeCost = BigInt(input.nativeRateSnapshot.unitPriceNativeMicros) * BigInt(input.quantitySeconds)
  if (nativeCost > MAX_SAFE_BIGINT) {
    throw new ApiError('VALIDATION_FAILED', 'Provider-native cost exceeds safe integer micros.', 400)
  }
  const nativeCostMicros = Number(nativeCost)
  const usesNativeUsd = input.nativeRateSnapshot.currency === 'USD'
  if (usesNativeUsd && input.fxSnapshot) {
    throw new ApiError('VALIDATION_FAILED', 'Native USD Wan pricing must not apply a CNY-to-USD snapshot.', 400)
  }
  if (!usesNativeUsd && !input.fxSnapshot) {
    throw new ApiError('VALIDATION_FAILED', 'CNY Wan pricing requires an exact CNY-to-USD snapshot.', 400)
  }
  const usdInternalCostMicros = usesNativeUsd
    ? nativeCostMicros
    : convertCnyMicrosToUsdMicrosCeil({
        cnyMicros: nativeCostMicros,
        fxSnapshot: input.fxSnapshot!,
      })
  const currencyExchangeRateSnapshotId = input.fxSnapshot?.id ?? null
  const conversionMode = usesNativeUsd ? 'native_usd' as const : 'cny_to_usd' as const
  const roundingRule = usesNativeUsd ? 'exact_native_usd' as const : 'ceil_quote_micros' as const
  const digestInput = {
    schemaVersion: MOTION_STUDIO_WAN_USD_COST_DERIVATION_VERSION,
    providerNativeRateSnapshotId: input.nativeRateSnapshot.id,
    providerNativeRateSnapshotDigest: input.nativeRateSnapshot.contentDigest,
    currencyExchangeRateSnapshotId,
    currencyExchangeRateSnapshotDigest: input.fxSnapshot?.contentDigest ?? null,
    quantity: input.quantitySeconds,
    unit: 'video_second',
    nativeCurrency: input.nativeRateSnapshot.currency,
    nativeCostMicros,
    usdInternalCostMicros,
    conversionMode,
    roundingRule,
  } as const
  return {
    schemaVersion: MOTION_STUDIO_WAN_USD_COST_DERIVATION_VERSION,
    id: input.id,
    providerNativeRateSnapshotId: input.nativeRateSnapshot.id,
    currencyExchangeRateSnapshotId,
    derivedUsdRateCardVersionId: input.derivedUsdRateCardVersionId,
    quantity: input.quantitySeconds,
    unit: 'video_second',
    nativeCurrency: input.nativeRateSnapshot.currency,
    nativeCostMicros,
    usdInternalCostMicros,
    conversionMode,
    roundingRule,
    calculationDigest: sha256CanonicalJson(digestInput),
    calculatedAt: input.calculatedAt,
    immutable: true,
  }
}

export function assertWanCostSnapshotCurrent(input: {
  nativeRateSnapshot: MotionStudioProviderNativeRateSnapshot
  fxSnapshot?: MotionStudioCurrencyExchangeRateSnapshot
  now: string
}): void {
  const now = Date.parse(input.now)
  if (!Number.isFinite(now)) throw new ApiError('VALIDATION_FAILED', 'Current time must be ISO-8601.', 400)
  const effectiveFrom = Date.parse(input.nativeRateSnapshot.effectiveFrom)
  const effectiveTo = input.nativeRateSnapshot.effectiveTo
    ? Date.parse(input.nativeRateSnapshot.effectiveTo)
    : Number.POSITIVE_INFINITY
  if (now < effectiveFrom || now >= effectiveTo) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Wan provider-native rate snapshot is not current.', 409)
  }
  if (input.nativeRateSnapshot.currency === 'USD') {
    if (input.fxSnapshot) {
      throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'Native USD Wan pricing cannot bind a CNY-to-USD snapshot.', 409)
    }
    return
  }
  if (!input.fxSnapshot) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'CNY Wan pricing requires a current CNY-to-USD snapshot.', 409)
  }
  if (now < Date.parse(input.fxSnapshot.effectiveAt) || now >= Date.parse(input.fxSnapshot.expiresAt)) {
    throw new ApiError('MOTION_STUDIO_APPROVAL_BLOCKED', 'CNY-to-USD snapshot is not current.', 409)
  }
}
