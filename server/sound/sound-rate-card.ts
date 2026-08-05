import {
  canonicalToolRateCardSnapshotRegistry,
  type ToolRateCardSnapshot,
} from '../tool-registry'

export const SOUND_MIRELO_RATE_CARD_SNAPSHOT: ToolRateCardSnapshot = {
  rateCardSnapshotId: 'sound.rate_snapshot.mirelo_2026_08_03',
  toolKey: 'mirelo_sfx',
  observedAt: '2026-08-03T00:00:00.000Z',
  currency: 'provider_credit',
  unit: 'mirelo_credits_per_generated_second',
  unitCost: 10,
  usdConversionStatus: 'unknown',
  sourceRef: 'sound.rate_source.mirelo_pricing_10_credits_per_second_2026_08_03',
}

// Mirelo's published unit is provider credits rather than USD. No USD value is
// published until an account-specific conversion is verified. Cost settlement
// remains blocked until that commercial rate evidence is recorded.
canonicalToolRateCardSnapshotRegistry.set(SOUND_MIRELO_RATE_CARD_SNAPSHOT)
