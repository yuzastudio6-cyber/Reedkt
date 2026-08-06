import type {
  ReEditProActiveReasoningModelRouteId,
} from '../../src/types/reasoning-model-routing'
import type { ReasoningModelRateCardEntry } from './types'

export const REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION =
  'reeditpro-reasoning-model-rate-card-v2-2026-07-30'

export const REEDITPRO_REASONING_MODEL_RATE_CARD: Readonly<
  Record<ReEditProActiveReasoningModelRouteId, ReasoningModelRateCardEntry>
> = {
  kimi_k3_primary: {
    routeId: 'kimi_k3_primary',
    provider: 'moonshot_ai',
    exactProviderModelId: 'kimi-k3',
    nativeCurrency: 'USD',
    contextWindowTokens: 1_000_000,
    cacheMissInputMicrosPerMillionTokens: 3_000_000,
    providerNativeCacheHitMicrosPerMillionTokens: 300_000,
    providerNativeCacheCreationMicrosPerMillionTokens: null,
    qwenImplicitCacheHitMicrosPerMillionTokens: null,
    qwenExplicitCacheHitMicrosPerMillionTokens: null,
    qwenExplicitCacheCreationMicrosPerMillionTokens: null,
    outputMicrosPerMillionTokens: 15_000_000,
    longContextInputThresholdTokens: null,
    longContextInputRateMultiplierBps: 10_000,
    longContextOutputRateMultiplierBps: 10_000,
    pricingSourceUrls: [
      'https://platform.kimi.ai/',
      'https://platform.kimi.ai/docs/guide/kimi-k3-quickstart',
    ],
    observedAt: '2026-07-18T00:00:00.000Z',
  },
  gpt_5_6_terra_fallback: {
    routeId: 'gpt_5_6_terra_fallback',
    provider: 'openai',
    exactProviderModelId: 'gpt-5.6-terra',
    nativeCurrency: 'USD',
    contextWindowTokens: 1_050_000,
    cacheMissInputMicrosPerMillionTokens: 2_500_000,
    providerNativeCacheHitMicrosPerMillionTokens: 250_000,
    providerNativeCacheCreationMicrosPerMillionTokens: 3_125_000,
    qwenImplicitCacheHitMicrosPerMillionTokens: null,
    qwenExplicitCacheHitMicrosPerMillionTokens: null,
    qwenExplicitCacheCreationMicrosPerMillionTokens: null,
    outputMicrosPerMillionTokens: 15_000_000,
    longContextInputThresholdTokens: 272_000,
    longContextInputRateMultiplierBps: 20_000,
    longContextOutputRateMultiplierBps: 15_000,
    pricingSourceUrls: [
      'https://developers.openai.com/api/docs/models/gpt-5.6-terra',
      'https://openai.com/index/gpt-5-6/',
    ],
    observedAt: '2026-07-30T00:00:00.000Z',
  },
  deepseek_v4_pro_fallback: {
    routeId: 'deepseek_v4_pro_fallback',
    provider: 'deepseek',
    exactProviderModelId: 'deepseek-v4-pro',
    nativeCurrency: 'USD',
    contextWindowTokens: 1_000_000,
    cacheMissInputMicrosPerMillionTokens: 435_000,
    providerNativeCacheHitMicrosPerMillionTokens: 3_625,
    providerNativeCacheCreationMicrosPerMillionTokens: null,
    qwenImplicitCacheHitMicrosPerMillionTokens: null,
    qwenExplicitCacheHitMicrosPerMillionTokens: null,
    qwenExplicitCacheCreationMicrosPerMillionTokens: null,
    outputMicrosPerMillionTokens: 870_000,
    longContextInputThresholdTokens: null,
    longContextInputRateMultiplierBps: 10_000,
    longContextOutputRateMultiplierBps: 10_000,
    pricingSourceUrls: [
      'https://api-docs.deepseek.com/quick_start/pricing/',
    ],
    observedAt: '2026-07-18T00:00:00.000Z',
  },
} as const

export function getReasoningModelRateCardEntry(
  routeId: ReEditProActiveReasoningModelRouteId,
): ReasoningModelRateCardEntry {
  const entry = REEDITPRO_REASONING_MODEL_RATE_CARD[routeId]
  return { ...entry, pricingSourceUrls: [...entry.pricingSourceUrls] }
}
