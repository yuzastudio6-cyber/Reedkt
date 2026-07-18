import type { ReEditProReasoningModelRouteId } from '../../src/types/reasoning-model-routing'
import type { ReasoningModelRateCardEntry } from './types'

export const REEDITPRO_REASONING_MODEL_RATE_CARD_VERSION =
  'reeditpro-reasoning-model-rate-card-v1-2026-07-18'

export const REEDITPRO_REASONING_MODEL_RATE_CARD: Readonly<
  Record<ReEditProReasoningModelRouteId, ReasoningModelRateCardEntry>
> = {
  kimi_k3_primary: {
    routeId: 'kimi_k3_primary',
    provider: 'moonshot_ai',
    exactProviderModelId: 'kimi-k3',
    nativeCurrency: 'USD',
    contextWindowTokens: 1_000_000,
    cacheMissInputMicrosPerMillionTokens: 3_000_000,
    providerNativeCacheHitMicrosPerMillionTokens: 300_000,
    qwenImplicitCacheHitMicrosPerMillionTokens: null,
    qwenExplicitCacheHitMicrosPerMillionTokens: null,
    qwenExplicitCacheCreationMicrosPerMillionTokens: null,
    outputMicrosPerMillionTokens: 15_000_000,
    pricingSourceUrls: [
      'https://platform.kimi.ai/',
      'https://platform.kimi.ai/docs/guide/kimi-k3-quickstart',
    ],
    observedAt: '2026-07-18T00:00:00.000Z',
  },
  qwen_3_7_fallback: {
    routeId: 'qwen_3_7_fallback',
    provider: 'alibaba_cloud_model_studio',
    exactProviderModelId: 'qwen3.7-max-2026-06-08',
    nativeCurrency: 'CNY',
    contextWindowTokens: 1_000_000,
    cacheMissInputMicrosPerMillionTokens: 12_000_000,
    providerNativeCacheHitMicrosPerMillionTokens: null,
    qwenImplicitCacheHitMicrosPerMillionTokens: 2_400_000,
    qwenExplicitCacheHitMicrosPerMillionTokens: 1_200_000,
    qwenExplicitCacheCreationMicrosPerMillionTokens: 15_000_000,
    outputMicrosPerMillionTokens: 36_000_000,
    pricingSourceUrls: [
      'https://help.aliyun.com/en/model-studio/model-pricing',
      'https://help.aliyun.com/en/model-studio/context-cache',
    ],
    observedAt: '2026-07-18T00:00:00.000Z',
  },
  deepseek_v4_pro_fallback: {
    routeId: 'deepseek_v4_pro_fallback',
    provider: 'deepseek',
    exactProviderModelId: 'deepseek-v4-pro',
    nativeCurrency: 'USD',
    contextWindowTokens: 1_000_000,
    cacheMissInputMicrosPerMillionTokens: 435_000,
    providerNativeCacheHitMicrosPerMillionTokens: 3_625,
    qwenImplicitCacheHitMicrosPerMillionTokens: null,
    qwenExplicitCacheHitMicrosPerMillionTokens: null,
    qwenExplicitCacheCreationMicrosPerMillionTokens: null,
    outputMicrosPerMillionTokens: 870_000,
    pricingSourceUrls: [
      'https://api-docs.deepseek.com/quick_start/pricing/',
    ],
    observedAt: '2026-07-18T00:00:00.000Z',
  },
} as const

export function getReasoningModelRateCardEntry(
  routeId: ReEditProReasoningModelRouteId,
): ReasoningModelRateCardEntry {
  const entry = REEDITPRO_REASONING_MODEL_RATE_CARD[routeId]
  return { ...entry, pricingSourceUrls: [...entry.pricingSourceUrls] }
}
