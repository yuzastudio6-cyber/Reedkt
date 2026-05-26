import type { JobTimeoutPolicy } from './cost-control-types'

export const jobTimeoutPolicy: JobTimeoutPolicy = {
  cpuWorkerTimeoutMs: 10 * 60 * 1000,
  gpuWorkerTimeoutMs: 20 * 60 * 1000,
  renderWorkerTimeoutMs: 30 * 60 * 1000,
  qaWorkerTimeoutMs: 5 * 60 * 1000,
  readinessWorkerTimeoutMs: 5 * 60 * 1000,
}
