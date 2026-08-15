import { ApiError } from '../errors/api-error'
import type {
  CanonicalGpuWorkerOperationRuntimePort,
} from './canonical-gpu-worker-operation-router-types'

export const CANONICAL_GPU_WORKER_SAM2_PYTHON =
  '/usr/bin/python3' as const
export const CANONICAL_GPU_WORKER_SAM2_RUNNER =
  '/opt/reeditpro/gpu-operations/sam2/runner.py' as const

/**
 * @deprecated Immutable historical-evidence identity only. The returned port
 * cannot execute or spawn SAM 2. Every new plan, fallback, and repair uses the
 * separately qualified SAM 3.1 operation.
 */
export function createCanonicalGpuWorkerSam2SubprocessRuntimePort():
CanonicalGpuWorkerOperationRuntimePort {
  throw notReady('sam2_historical_only_new_dispatch_blocked')
}

function notReady(code: string): ApiError {
  return new ApiError('TOOL_NOT_READY', code, 409, {
    requiredGate:
      'canonical_gpu_worker_sam2_fixed_subprocess_runtime',
  })
}
