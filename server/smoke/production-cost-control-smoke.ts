import assert from 'node:assert/strict'
import {
  buildCostControlSummary,
  gpuCostPolicy,
  jobTimeoutPolicy,
  killSwitchPolicy,
  providerCostPolicy,
  rateLimitPolicy,
  renderCostPolicy,
  workerConcurrencyPolicy,
} from '../cost-controls'
import { productionErrorCategories } from '../observability'

assert.ok(gpuCostPolicy.maxConcurrentGpuJobsByEnvironment.production >= 0, 'GPU concurrency limit should be defined')
assert.equal(gpuCostPolicy.rtxPro6000Policy.status, 'future_premium_manual_approval_only', 'RTX PRO 6000 must be manual/future/premium only')
assert.equal(killSwitchPolicy.gpuWorkerKillSwitch, true, 'GPU kill switch should exist and default on')
assert.ok(workerConcurrencyPolicy.maxConcurrentJobsByWorkerType.render_worker > 0, 'render concurrency limit should exist')
assert.equal(renderCostPolicy.killSwitchEnabled, true, 'render kill switch should exist')
assert.equal(providerCostPolicy.killSwitchEnabled, true, 'provider kill switch should exist')
assert.equal(providerCostPolicy.providersBlockedByDefault, true, 'providers should remain blocked by default')

assert.ok(jobTimeoutPolicy.cpuWorkerTimeoutMs > 0, 'CPU worker timeout should exist')
assert.ok(jobTimeoutPolicy.gpuWorkerTimeoutMs > 0, 'GPU worker timeout should exist')
assert.ok(jobTimeoutPolicy.renderWorkerTimeoutMs > 0, 'render worker timeout should exist')
assert.ok(jobTimeoutPolicy.qaWorkerTimeoutMs > 0, 'QA worker timeout should exist')
assert.ok(jobTimeoutPolicy.readinessWorkerTimeoutMs > 0, 'readiness worker timeout should exist')

assert.ok(rateLimitPolicy.perWorkspaceJobCreationPerHour > 0, 'workspace rate limit should exist')
assert.ok(rateLimitPolicy.perUserUploadRequestsPerHour > 0, 'user upload rate limit should exist')
assert.ok(rateLimitPolicy.perProjectConcurrentJobs > 0, 'project concurrency rate limit should exist')
assert.ok(productionErrorCategories.includes('cost_limit_exceeded'), 'cost limit exceeded error category should exist')

const summary = buildCostControlSummary()
assert.equal(summary.staticDryRunOnly, true, 'cost summary must be static/dry-run only')
assert.equal(summary.productionExecutionAllowed, false, 'cost summary must not enable production execution')

console.log('production-cost-control-smoke passed')
