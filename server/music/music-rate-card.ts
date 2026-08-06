import { hashMusicValue } from './music-contracts'

export const MUSIC_RATE_CARD_VERSION = 'music.rate_card.v2.2026-08-04' as const

const RATE_CARD_BODY = Object.freeze({
  version: MUSIC_RATE_CARD_VERSION,
  currency: 'USD' as const,
  creditValueUsd: 0.10,
  serviceFeeIncluded: false as const,
  walletMutationAuthorized: false as const,
  providerRates: {
    googleLyria3ProPreviewUpToThreeMinutesUsd: 0.08,
    googleLyria3ClipPreviewThirtySecondsUsd: 0.04,
  },
  evidenceRefs: [
    'pricing-and-credits.md:1-credit-equals-0.10-usd',
    'https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing',
  ],
})

export const MUSIC_RATE_CARD = Object.freeze({
  ...RATE_CARD_BODY,
  rateCardHash: hashMusicValue(RATE_CARD_BODY),
})

export function providerUsdToCredits(providerCostUsd: number): number {
  if (!Number.isFinite(providerCostUsd) || providerCostUsd < 0) {
    throw new Error('Music provider cost must be a finite non-negative USD amount.')
  }
  return Number((providerCostUsd / MUSIC_RATE_CARD.creditValueUsd).toFixed(6))
}

export function createMusicCostEvidence(input: {
  estimatedCredits: number
  providerCostUsd: number
  nestedSoundCredits: number
}) {
  const actualMusicCredits = providerUsdToCredits(input.providerCostUsd)
  const base = {
    estimatedCredits: input.estimatedCredits,
    actualMusicCredits,
    nestedSoundCredits: input.nestedSoundCredits,
    totalActualCredits: Number((actualMusicCredits + input.nestedSoundCredits).toFixed(6)),
    providerCostUsd: Number(input.providerCostUsd.toFixed(6)),
    rateCardVersion: MUSIC_RATE_CARD.version,
    rateCardHash: MUSIC_RATE_CARD.rateCardHash,
    serviceFeeIncluded: false as const,
    walletMutationExecuted: false as const,
  }
  return Object.freeze({ ...base, evidenceHash: hashMusicValue(base) })
}
