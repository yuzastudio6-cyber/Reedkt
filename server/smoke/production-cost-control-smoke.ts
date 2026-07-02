import assert from 'node:assert/strict'
import { loadRuntimeEnv } from '../config/env'
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

const mockEnv = loadRuntimeEnv({
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
})
assert.equal(mockEnv.productionGlobalGenerationKillSwitchActive, false, 'mock runtime should not trip the production global kill switch by default')
assert.equal(mockEnv.productionRenderWorkerKillSwitchActive, false, 'mock runtime should not trip the production render kill switch by default')

const productionNoSupabaseEnv = loadRuntimeEnv({
  E2E_RUNTIME_MODE: 'local',
  SUPABASE_URL: 'https://reeditpro.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'fake-service-role-key',
})
assert.equal(productionNoSupabaseEnv.productionGlobalGenerationKillSwitchActive, true, 'non-mock production-like runtime should fail closed with global kill switch active by default')
assert.equal(productionNoSupabaseEnv.productionFinalExportKillSwitchActive, true, 'non-mock production-like runtime should fail closed with final export kill switch active by default')

const productionOpenedEnv = loadRuntimeEnv({
  E2E_RUNTIME_MODE: 'local',
  SUPABASE_URL: 'https://reeditpro.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'fake-service-role-key',
  PRODUCTION_GLOBAL_GENERATION_KILL_SWITCH_ACTIVE: 'false',
  PRODUCTION_GPU_WORKER_KILL_SWITCH_ACTIVE: 'false',
  PRODUCTION_RENDER_WORKER_KILL_SWITCH_ACTIVE: 'false',
  PRODUCTION_PROVIDER_KILL_SWITCH_ACTIVE: 'false',
  PRODUCTION_FINAL_EXPORT_KILL_SWITCH_ACTIVE: 'false',
})
assert.equal(productionOpenedEnv.productionGlobalGenerationKillSwitchActive, false, 'production kill switch can be opened only by explicit backend env configuration')
assert.equal(productionOpenedEnv.productionFinalExportKillSwitchActive, false, 'final export kill switch can be opened only by explicit backend env configuration')

const summary = buildCostControlSummary()
assert.equal(summary.staticDryRunOnly, true, 'cost summary must be static/dry-run only')
assert.equal(summary.productionExecutionAllowed, false, 'cost summary must not enable production execution')

console.log('production-cost-control-smoke passed')
