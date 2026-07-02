import type { RenderCostPolicy } from './cost-control-types'

export const renderCostPolicy: RenderCostPolicy = {
  maxRenderDurationMs: 30 * 60 * 1000,
  maxRenderRetries: 1,
  maxOutputResolutionByTier: {
    basic: { width: 1920, height: 1080 },
    pro: { width: 2560, height: 1440 },
    premium: { width: 3840, height: 2160 },
  },
  maxConcurrentRenderJobs: 2,
  killSwitchEnabled: true,
}
