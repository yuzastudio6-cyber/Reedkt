import { realVideoFilmSlowmotionConfig } from './real-video-film-slowmotion-policy'
import type { RealVideoFilmSlowmotionSourceSummary } from './real-video-film-slowmotion-types'

export function buildRealVideoFilmSourceResolverSummary(): RealVideoFilmSlowmotionSourceSummary {
  return {
    approvedInputVideoGcsUri: realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri,
    sourceChain: 'phase32_controlled_private_export',
    anchorTimestampSeconds: realVideoFilmSlowmotionConfig.approvedAnchorTimestampSeconds,
    blockers: [],
    warnings: [
      'Only the approved Phase 32 private color-corrected export may be used.',
      'No arbitrary media, new uploads, or full-video interpolation are allowed in Phase 38D.',
    ],
  }
}
