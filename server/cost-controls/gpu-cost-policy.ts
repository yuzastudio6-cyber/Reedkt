import type { GpuCostPolicy } from './cost-control-types'

export const gpuCostPolicy: GpuCostPolicy = {
  defaultGpuClass: 'nvidia_l4',
  maxConcurrentGpuJobsByEnvironment: {
    local: 0,
    internal: 1,
    limited_beta: 1,
    production: 0,
  },
  maxGpuJobDurationMs: 20 * 60 * 1000,
  maxGpuRetries: 1,
  maxEstimatedGpuSpendPerWorkspacePerDayUsd: 25,
  rtxPro6000Policy: {
    status: 'future_premium_manual_approval_only',
    productionAllowed: false,
  },
  killSwitchEnabled: true,
  productionGpuJobsAllowed: false,
}

export function gpuProductionExecutionAllowed(policy: GpuCostPolicy = gpuCostPolicy): false {
  void policy
  return false
}
