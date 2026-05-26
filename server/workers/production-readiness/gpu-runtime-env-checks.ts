import {
  GCP_PRODUCTION_CLOUD_RUN_JOBS,
  GCP_PRODUCTION_PREMIUM_GPU_OPTION,
} from '../../config/gcp-production-config'

export interface GpuRuntimeEnvironmentCheck {
  checkName: string
  status: 'passed' | 'warning' | 'blocked'
  message: string
}

export function buildGpuRuntimeEnvironmentChecks(): GpuRuntimeEnvironmentCheck[] {
  const gpuJob = GCP_PRODUCTION_CLOUD_RUN_JOBS.find((job) => job.name === 'reeditpro-gpu-ai-worker')
  const checks: GpuRuntimeEnvironmentCheck[] = []

  checks.push({
    checkName: 'gpu_worker_template_exists',
    status: gpuJob ? 'passed' : 'blocked',
    message: gpuJob ? 'GPU Cloud Run Job template exists.' : 'GPU Cloud Run Job template is missing.',
  })

  checks.push({
    checkName: 'gpu_l4_first',
    status: gpuJob?.gpuType === 'nvidia-l4' ? 'passed' : 'blocked',
    message: 'GPU worker must remain NVIDIA L4 first in M11.',
  })

  checks.push({
    checkName: 'gpu_single_instance',
    status: gpuJob?.gpuCount === 1 ? 'passed' : 'blocked',
    message: 'GPU worker template must use one GPU per instance.',
  })

  checks.push({
    checkName: 'gpu_no_zonal_redundancy',
    status: gpuJob?.noGpuZonalRedundancy === true ? 'passed' : 'blocked',
    message: 'Cloud Run GPU template must include no GPU zonal redundancy.',
  })

  checks.push({
    checkName: 'gpu_l4_minimum_resources',
    status: (gpuJob?.cpu ?? 0) >= 4 && gpuJob?.memory === '16Gi' ? 'passed' : 'blocked',
    message: 'L4 GPU template must document at least 4 CPU and 16Gi memory.',
  })

  checks.push({
    checkName: 'gpu_rtx_pro_future_only',
    status: GCP_PRODUCTION_PREMIUM_GPU_OPTION.status === 'future_premium_evaluation_only' &&
      GCP_PRODUCTION_PREMIUM_GPU_OPTION.minimumCpu >= 20 &&
      GCP_PRODUCTION_PREMIUM_GPU_OPTION.minimumMemory === '80Gi'
      ? 'passed'
      : 'blocked',
    message: 'RTX PRO 6000 must remain future/premium/evaluation only with 20 CPU and 80Gi minimum.',
  })

  return checks
}
