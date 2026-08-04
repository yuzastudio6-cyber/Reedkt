import type { RenderCostPolicy } from './cost-control-types'

export const renderCostPolicy: RenderCostPolicy = {
  maxRenderDurationMs: 30 * 60 * 1000,
  maxRenderRetries: 1,
  maxOutputResolutionByTier: {
    basic: { width: 3840, height: 2160 },
    pro: { width: 3840, height: 2160 },
    premium: { width: 3840, height: 2160 },
  },
  maxOutputPixelCount: 8_294_400,
  maxOutputLongEdge: 3_840,
  maxOutputShortEdge: 2_160,
  estimateCostBasisProfileId: 'uhd_2160',
  tierControlsOutputQuality: false,
  maxConcurrentRenderJobs: 2,
  killSwitchEnabled: true,
}
