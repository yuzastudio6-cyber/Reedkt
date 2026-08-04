import {
  GCP_PRODUCTION_LEGACY_CLOUD_RUN_JOB_TEMPLATES,
  GCP_PRODUCTION_PREMIUM_GPU_OPTION,
  GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES,
} from '../../config/gcp-production-config'

export interface GpuRuntimeEnvironmentCheck {
  checkName: string
  status: 'passed' | 'warning' | 'blocked'
  message: string
}

export function buildGpuRuntimeEnvironmentChecks(): GpuRuntimeEnvironmentCheck[] {
  const a100 = GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES.find((runtime) =>
    runtime.routeId === 'a100_80gb_heavy_primary')
  const l4Fallback = GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES.find((runtime) =>
    runtime.routeId === 'l4_heavy_fallback')
  const l4Standard = GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES.find((runtime) =>
    runtime.routeId === 'l4_standard_primary')
  const checks: GpuRuntimeEnvironmentCheck[] = []

  checks.push({
    checkName: 'quality_first_gpu_topology_exists',
    status: a100 && l4Fallback && l4Standard ? 'passed' : 'blocked',
    message: 'A100 heavy-primary, L4 heavy-fallback, and L4 standard-primary templates must all exist.',
  })

  checks.push({
    checkName: 'gpu_a100_80gb_heavy_primary',
    status: a100?.runtimeKind === 'google_cloud_batch_job'
      && a100.machineType === 'a2-ultragpu-1g'
      && a100.accelerator === 'nvidia_a100_80gb'
      && a100.gpuMemoryGiB === 80
      ? 'passed'
      : 'blocked',
    message: 'Heavy models and heavy processing must use one A100 80 GB Batch job as the primary route.',
  })

  checks.push({
    checkName: 'gpu_l4_standard_and_qualified_heavy_fallback',
    status: l4Standard?.runtimeKind === 'google_cloud_run_job'
      && l4Standard.accelerator === 'nvidia_l4'
      && l4Standard.routeRole === 'standard_primary'
      && l4Fallback?.runtimeKind === 'google_cloud_run_job'
      && l4Fallback.accelerator === 'nvidia_l4'
      && l4Fallback.routeRole === 'heavy_fallback'
      ? 'passed'
      : 'blocked',
    message: 'L4 must be the normal GPU media route and a separately qualified heavy fallback, never the heavy primary.',
  })

  checks.push({
    checkName: 'gpu_user_triggered_scale_to_zero',
    status: GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES.every((runtime) =>
      runtime.minimumIdleInstances === 0
      && runtime.maximumConcurrentAttemptsPerInstance === 1
      && runtime.maximumTaskRetries === 0
      && runtime.startsOnlyFromConsumedApprovedUserAttempt
      && runtime.stopsAtTerminalAttempt)
      ? 'passed'
      : 'blocked',
    message: 'Every A100/L4 attempt must start from approved user work, run in isolation, and return to zero at terminal state.',
  })

  checks.push({
    checkName: 'gpu_no_substantive_cpu_fallback',
    status: GCP_PRODUCTION_QUALITY_FIRST_GPU_RUNTIMES.every((runtime) =>
      !runtime.cpuOnlySubstantiveExecutionAllowed
      && !runtime.qualityReducingFallbackAllowed
      && !runtime.runtimeNetworkDownloadAllowed)
      ? 'passed'
      : 'blocked',
    message: 'No active GPU route may fall back to CPU, reduce quality, or download models at job time.',
  })

  checks.push({
    checkName: 'gpu_legacy_l4_first_and_rtx_routes_retired',
    status: GCP_PRODUCTION_LEGACY_CLOUD_RUN_JOB_TEMPLATES.historicalReadbackOnly
      && !GCP_PRODUCTION_LEGACY_CLOUD_RUN_JOB_TEMPLATES.mayAuthorizeNewWork
      && GCP_PRODUCTION_PREMIUM_GPU_OPTION.status ===
        'retired_not_in_current_quality_first_policy'
      && !GCP_PRODUCTION_PREMIUM_GPU_OPTION.mayAuthorizeNewWork
      ? 'passed'
      : 'blocked',
    message: 'Historical L4-first and RTX PRO 6000 templates must remain non-authoritative for new work.',
  })

  return checks
}
