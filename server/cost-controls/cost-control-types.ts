export type CostControlEnvironment = 'local' | 'internal' | 'limited_beta' | 'production'

export type CostControlDecision = 'allowed' | 'blocked' | 'manual_review_required'

export interface GpuCostPolicy {
  defaultGpuClass: 'nvidia_l4'
  maxConcurrentGpuJobsByEnvironment: Record<CostControlEnvironment, number>
  maxGpuJobDurationMs: number
  maxGpuRetries: number
  maxEstimatedGpuSpendPerWorkspacePerDayUsd: number
  rtxPro6000Policy: {
    status: 'future_premium_manual_approval_only'
    productionAllowed: false
  }
  killSwitchEnabled: boolean
  productionGpuJobsAllowed: false
}

export interface RenderCostPolicy {
  maxRenderDurationMs: number
  maxRenderRetries: number
  maxOutputResolutionByTier: Record<string, { width: number; height: number }>
  maxConcurrentRenderJobs: number
  killSwitchEnabled: boolean
}

export interface ProviderCostPolicy {
  providersBlockedByDefault: true
  providerCallBudgetsUsd: Record<string, number>
  killSwitchEnabled: boolean
  approvedProviders: string[]
}

export interface WorkerConcurrencyPolicy {
  maxConcurrentJobsByWorkerType: Record<string, number>
  productionOverrideRequiresHumanApproval: true
}

export interface RateLimitPolicy {
  perWorkspaceJobCreationPerHour: number
  perUserUploadRequestsPerHour: number
  perUserRenderRequestsPerHour: number
  perProjectConcurrentJobs: number
}

export interface JobTimeoutPolicy {
  cpuWorkerTimeoutMs: number
  gpuWorkerTimeoutMs: number
  renderWorkerTimeoutMs: number
  qaWorkerTimeoutMs: number
  readinessWorkerTimeoutMs: number
}

export interface KillSwitchPolicy {
  globalGenerationKillSwitch: boolean
  gpuWorkerKillSwitch: boolean
  renderWorkerKillSwitch: boolean
  providerKillSwitch: boolean
  finalExportKillSwitch: boolean
  publicDeliveryShareKillSwitch: boolean
}

export interface CostControlSummary {
  generatedAt: string
  staticDryRunOnly: true
  productionExecutionAllowed: false
  gpuPolicy: GpuCostPolicy
  renderPolicy: RenderCostPolicy
  providerPolicy: ProviderCostPolicy
  concurrencyPolicy: WorkerConcurrencyPolicy
  rateLimitPolicy: RateLimitPolicy
  timeoutPolicy: JobTimeoutPolicy
  killSwitchPolicy: KillSwitchPolicy
  blockers: string[]
  warnings: string[]
}
