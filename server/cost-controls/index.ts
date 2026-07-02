export * from './cost-control-types'
export * from './gpu-cost-policy'
export * from './render-cost-policy'
export * from './provider-cost-policy'
export * from './worker-concurrency-policy'
export * from './rate-limit-policy'
export * from './job-timeout-policy'
export * from './kill-switch-policy'

import { gpuCostPolicy } from './gpu-cost-policy'
import { jobTimeoutPolicy } from './job-timeout-policy'
import { killSwitchPolicy } from './kill-switch-policy'
import { providerCostPolicy } from './provider-cost-policy'
import { rateLimitPolicy } from './rate-limit-policy'
import { renderCostPolicy } from './render-cost-policy'
import { workerConcurrencyPolicy } from './worker-concurrency-policy'
import type { CostControlSummary } from './cost-control-types'

export function buildCostControlSummary(): CostControlSummary {
  return {
    generatedAt: new Date().toISOString(),
    staticDryRunOnly: true,
    productionExecutionAllowed: false,
    gpuPolicy: gpuCostPolicy,
    renderPolicy: renderCostPolicy,
    providerPolicy: providerCostPolicy,
    concurrencyPolicy: workerConcurrencyPolicy,
    rateLimitPolicy,
    timeoutPolicy: jobTimeoutPolicy,
    killSwitchPolicy,
    blockers: [
      'Production GPU jobs remain disabled until readiness, cost, model-weight, and human approvals pass.',
      'Provider calls remain blocked until an explicit provider budget and approval policy exists.',
      'Final export and public delivery kill switches default to on for M17 static readiness.',
    ],
    warnings: [
      'Limits are policy placeholders and must be reviewed before any external beta.',
      'RTX PRO 6000 is future/premium/manual-approval-only.',
    ],
  }
}
