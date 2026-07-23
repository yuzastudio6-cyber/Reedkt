import type { ID, ISODateString } from '../shared'
import type {
  CurrencyExchangeRateEvidenceRef,
  ProviderRateCardEvidenceRef,
} from './costs'

export const MOTION_STUDIO_PROVIDER_NATIVE_RATE_SNAPSHOT_VERSION =
  'motion-studio-provider-native-rate-snapshot-v1' as const
export const MOTION_STUDIO_FX_SNAPSHOT_VERSION =
  'motion-studio-currency-exchange-rate-snapshot-v1' as const
export const MOTION_STUDIO_WAN_USD_COST_DERIVATION_VERSION =
  'motion-studio-wan-usd-cost-derivation-v2' as const

export type MotionStudioProviderNativeCurrency = 'CNY' | 'USD'

/**
 * Immutable provider-native pricing evidence. USD authorization remains in the
 * canonical Production Cost Engine; this record preserves the provider's own
 * billing unit without silently rewriting historical USD estimates.
 */
export interface MotionStudioProviderNativeRateSnapshot {
  schemaVersion: typeof MOTION_STUDIO_PROVIDER_NATIVE_RATE_SNAPSHOT_VERSION
  id: ID
  providerRoute: 'wan' | 'hailuo'
  providerAdapterId: string
  modelOrService: string
  version: string
  contentDigest: string
  currency: MotionStudioProviderNativeCurrency
  unit: 'video_second' | 'request'
  unitPriceNativeMicros: number
  minimumChargeNativeMicros: number
  roundingRule: 'exact_integer_quantity' | 'provider_reported'
  effectiveFrom: ISODateString
  effectiveTo?: ISODateString
  sourceReference: ProviderRateCardEvidenceRef
  verifiedAt: ISODateString
  immutable: true
}

/**
 * Rational base/quote observation. For CNY -> USD, baseAmountMicros is a CNY
 * amount and quoteAmountMicros is its exact USD-micro equivalent according to
 * the captured source. Conversion must use integer arithmetic and round up.
 */
export interface MotionStudioCurrencyExchangeRateSnapshot {
  schemaVersion: typeof MOTION_STUDIO_FX_SNAPSHOT_VERSION
  id: ID
  version: string
  contentDigest: string
  baseCurrency: 'CNY'
  quoteCurrency: 'USD'
  baseAmountMicros: number
  quoteAmountMicros: number
  roundingRule: 'ceil_quote_micros'
  sourceReference: CurrencyExchangeRateEvidenceRef
  capturedAt: ISODateString
  effectiveAt: ISODateString
  expiresAt: ISODateString
  immutable: true
}

export interface MotionStudioWanUsdCostDerivation {
  schemaVersion: typeof MOTION_STUDIO_WAN_USD_COST_DERIVATION_VERSION
  id: ID
  providerNativeRateSnapshotId: ID
  currencyExchangeRateSnapshotId: ID | null
  derivedUsdRateCardVersionId: ID
  quantity: number
  unit: 'video_second' | 'request'
  nativeCurrency: MotionStudioProviderNativeCurrency
  nativeCostMicros: number
  usdInternalCostMicros: number
  conversionMode: 'native_usd' | 'cny_to_usd'
  roundingRule: 'exact_native_usd' | 'ceil_quote_micros'
  calculationDigest: string
  calculatedAt: ISODateString
  immutable: true
}

/** @deprecated Use the currency-truthful Wan USD derivation names. */
export const MOTION_STUDIO_FX_DERIVATION_VERSION =
  MOTION_STUDIO_WAN_USD_COST_DERIVATION_VERSION
/** @deprecated Use MotionStudioWanUsdCostDerivation. */
export type MotionStudioFxDerivedUsdCost = MotionStudioWanUsdCostDerivation
